import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Bell, Shield, Paintbrush, LogOut, CheckCircle2, Loader2, Sparkles, Key, AlertTriangle, X } from 'lucide-react';
import { auth, signOut } from '../firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { getUserStats, updateUserProfile } from '../services/courseService.js';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function Settings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(auth.currentUser);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [activeSection, setActiveSection] = useState('account');
  
  // Profile settings
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [notifications, setNotifications] = useState(true);
  const [marketing, setMarketing] = useState(false);

  const sections = [
    { id: 'account', label: 'Account Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security & Privacy', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Paintbrush },
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const stats = await getUserStats(currentUser.uid);
          setFirstName(stats.firstName || '');
          setLastName(stats.lastName || '');
          setGeminiKey(localStorage.getItem('user_gemini_api_key') || '');
        } catch (e) {
          console.error("Error loading profile settings:", e);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error(error);
    }
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    let firestoreSuccess = false;
    let localKeySuccess = false;

    // 1. Try to save profile fields to Firestore
    try {
      await updateUserProfile(user.uid, {
        firstName,
        lastName
      });
      firestoreSuccess = true;
    } catch (err) {
      console.error("Failed to save profile to Firestore:", err);
    }

    // 2. Try to save Gemini key locally
    try {
      if (geminiKey.trim() !== '') {
        localStorage.setItem('user_gemini_api_key', geminiKey.trim());
      } else {
        localStorage.removeItem('user_gemini_api_key');
      }
      localKeySuccess = true;
    } catch (err) {
      console.error("Failed to save Gemini key locally:", err);
    }

    setSaving(false);

    if (firestoreSuccess && localKeySuccess) {
      setSuccessMsg('All settings saved successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } else if (localKeySuccess && !firestoreSuccess) {
      // Local key succeeded, Firestore failed (probably rules issue)
      setSuccessMsg('API Key saved locally. Profile fields failed to save to Firestore (check your database security rules!).');
    } else {
      setErrorMsg('Failed to save settings. Please check your network or database rules.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#000000] text-white gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-medium tracking-wide">Loading Settings...</p>
      </div>
    );
  }

  const userInitial = firstName ? firstName.charAt(0).toUpperCase() : (user?.email?.charAt(0).toUpperCase() || '?');

  return (
    <motion.main initial="hidden" animate="show" variants={containerVariants} className="p-4 md:p-8 max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
      
      {/* Sidebar Settings Nav */}
      <motion.div variants={cardVariants} className="w-full md:w-64 flex-shrink-0">
        <h1 className="text-3xl font-bold text-on-surface mb-8 tracking-tight">Settings</h1>
        <div className="flex flex-col gap-2">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`relative flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors text-left ${
                activeSection === section.id ? 'text-on-surface' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              {activeSection === section.id && (
                <motion.div 
                  layoutId="settings-active-pill"
                  className="absolute inset-0 bg-surface border border-outline-variant rounded-xl z-[-1] shadow-sm"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <section.icon className={`w-5 h-5 ${activeSection === section.id ? 'text-primary' : ''}`} />
              {section.label}
            </button>
          ))}
          
          <div className="my-4 border-t border-outline-variant/50"></div>
          
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-error hover:bg-error/10 transition-colors text-left group">
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Log Out
          </button>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <motion.div variants={cardVariants} className="flex-1 max-w-3xl">
        <form onSubmit={handleSaveChanges} className="bg-surface border border-outline-variant rounded-3xl shadow-sm overflow-hidden">
          
          {activeSection === 'account' && (
            <>
              <div className="p-6 md:p-8 border-b border-outline-variant">
                <h2 className="text-2xl font-bold text-on-surface">Account Profile</h2>
                <p className="text-on-surface-variant mt-1">Manage your personal information and API keys.</p>
              </div>

              <div className="p-6 md:p-8 space-y-8">
                <AnimatePresence mode="wait">
                  {successMsg && (
                    <motion.div 
                      key="success"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-green-500/10 border border-green-500/20 text-green-500 rounded-xl p-4 text-sm font-semibold flex items-center gap-2 mb-4"
                    >
                      <CheckCircle2 className="w-5 h-5" /> {successMsg}
                    </motion.div>
                  )}
                  {errorMsg && (
                    <motion.div 
                      key="error"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl p-4 text-sm font-semibold flex items-center gap-2 mb-4"
                    >
                      <AlertTriangle className="w-5 h-5 animate-pulse" /> {errorMsg}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    {userInitial}{lastName ? lastName.charAt(0).toUpperCase() : ''}
                  </div>
                  <div>
                    <span className="text-sm font-bold text-on-surface-variant block">Profile Initial Avatar</span>
                    <p className="text-xs text-on-surface-variant mt-1">Generated dynamically from your first and last name.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5 relative group">
                    <label className="text-sm font-semibold text-on-surface">First Name</label>
                    <input 
                      type="text" 
                      value={firstName} 
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First name"
                      className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all group-hover:border-outline" 
                    />
                  </div>
                  
                  <div className="space-y-1.5 relative group">
                    <label className="text-sm font-semibold text-on-surface">Last Name</label>
                    <input 
                      type="text" 
                      value={lastName} 
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last name"
                      className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all group-hover:border-outline" 
                    />
                  </div>

                  <div className="space-y-1.5 relative group md:col-span-2">
                    <label className="text-sm font-semibold text-on-surface">Email Address</label>
                    <input 
                      type="email" 
                      value={user?.email || 'user@example.com'} 
                      disabled 
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface-variant opacity-70 cursor-not-allowed" 
                    />
                    <p className="text-xs text-on-surface-variant mt-1">Logged in via Firebase Email/Password provider.</p>
                  </div>

                  <div className="space-y-1.5 relative group md:col-span-2 border-t border-outline-variant/30 pt-6">
                    <label className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                      <Key className="w-4 h-4 text-indigo-500" /> Google Gemini API Key
                    </label>
                    <input 
                      type="password" 
                      value={geminiKey} 
                      onChange={(e) => setGeminiKey(e.target.value)} 
                      placeholder="AIzaSy..."
                      className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all group-hover:border-outline font-mono" 
                    />
                    <p className="text-xs text-on-surface-variant mt-1">
                      Enter your personal Google Gemini API key to generate roadmaps.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeSection === 'notifications' && (
            <>
              <div className="p-6 md:p-8 border-b border-outline-variant">
                <h2 className="text-2xl font-bold text-on-surface">Notifications</h2>
                <p className="text-on-surface-variant mt-1">Manage how and when you receive updates.</p>
              </div>
              <div className="p-6 md:p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-on-surface text-sm">Course Updates</h4>
                    <p className="text-xs text-on-surface-variant">Get notified when enrolled courses add new content.</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setNotifications(!notifications)} 
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out ${notifications ? 'bg-primary' : 'bg-surface-container-high'}`}
                  >
                    <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-sm" animate={{ x: notifications ? 24 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-on-surface text-sm">Marketing Emails</h4>
                    <p className="text-xs text-on-surface-variant">Receive weekly newsletters and feature updates.</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setMarketing(!marketing)} 
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out ${marketing ? 'bg-primary' : 'bg-surface-container-high'}`}
                  >
                    <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-sm" animate={{ x: marketing ? 24 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
                  </button>
                </div>
              </div>
            </>
          )}

          {activeSection === 'security' && (
            <>
              <div className="p-6 md:p-8 border-b border-outline-variant">
                <h2 className="text-2xl font-bold text-on-surface">Security & Privacy</h2>
                <p className="text-on-surface-variant mt-1">Manage your password and review the privacy policy.</p>
              </div>
              <div className="p-6 md:p-8 space-y-8">
                <div>
                  <h3 className="text-sm font-semibold text-on-surface mb-2">Change Password</h3>
                  <p className="text-xs text-on-surface-variant mb-4">You will receive an email to reset your password.</p>
                  <button type="button" className="bg-surface-container border border-outline-variant text-on-surface px-4 py-2 rounded-lg text-sm font-semibold hover:bg-surface-container-high transition-colors">
                    Send Reset Email
                  </button>
                </div>
                <div className="border-t border-outline-variant/30 pt-6">
                  <h3 className="text-lg font-bold text-on-surface mb-4">Privacy Policy</h3>
                  <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/50 max-h-64 overflow-y-auto text-sm text-on-surface-variant space-y-4">
                    <p><strong>Last Updated: June 16, 2026</strong></p>
                    <p>Welcome to the AI Learning Roadmap Platform. Your privacy is important to us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our application.</p>
                    <p><strong>1. Information We Collect</strong><br/>We collect personal information that you voluntarily provide to us when you register on the application, express an interest in obtaining information about us or our products and services, when you participate in activities on the application or otherwise when you contact us. This includes your email address, name, and your provided API keys.</p>
                    <p><strong>2. How We Use Your Information</strong><br/>We use personal information collected via our application for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.</p>
                    <p><strong>3. API Keys</strong><br/>Your Gemini API keys are stored locally in your browser's local storage and are never transmitted to our servers. They are sent directly to Google's Generative AI servers for the sole purpose of generating your personal learning roadmaps.</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeSection === 'appearance' && (
            <>
              <div className="p-6 md:p-8 border-b border-outline-variant">
                <h2 className="text-2xl font-bold text-on-surface">Appearance</h2>
                <p className="text-on-surface-variant mt-1">Customize the look and feel of your workspace.</p>
              </div>
              <div className="p-6 md:p-8">
                <div className="flex items-center justify-between bg-surface-container p-4 rounded-xl border border-outline-variant/50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Paintbrush className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-on-surface text-sm">Dark Mode</h4>
                      <p className="text-xs text-on-surface-variant">Switch between light and dark themes using the sidebar toggle.</p>
                    </div>
                  </div>
                  <p className="text-xs text-secondary italic">Check sidebar for global toggle</p>
                </div>
              </div>
            </>
          )}

          {(activeSection === 'account' || activeSection === 'notifications') && (
            <div className="p-6 md:p-8 pt-0 flex justify-end">
              <motion.button 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }} 
                type="submit"
                disabled={saving}
                className="bg-primary text-on-primary px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <><CheckCircle2 className="w-5 h-5" /> Save Changes</>
                )}
              </motion.button>
            </div>
          )}
        </form>
      </motion.div>

    </motion.main>
  );
}
