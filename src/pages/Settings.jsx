import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Bell, Shield, Paintbrush, LogOut, CheckCircle2, Loader2, Sparkles, Key, AlertTriangle, X, Globe } from 'lucide-react';
import { auth, signOut } from '../firebase.js';
import { onAuthStateChanged, sendPasswordResetEmail } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { getUserStats, updateUserProfile } from '../services/courseService.js';
import { t, useLocale, getAvailableLocales, setLocale } from '../i18n.js';

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
  const locale = useLocale();
  const [user, setUser] = useState(auth.currentUser);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  
  // App State
  const [notifications, setNotifications] = useState(() => localStorage.getItem('prefs_notifications') !== 'false');
  const [marketing, setMarketing] = useState(() => localStorage.getItem('prefs_marketing') === 'true');
  const [activeSection, setActiveSection] = useState('account');

  useEffect(() => {
    localStorage.setItem('prefs_notifications', notifications);
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('prefs_marketing', marketing);
  }, [marketing]);

  const SECTIONS = [
    { id: 'account', icon: User, label: t('settings.nav.profile') },
    { id: 'notifications', icon: Bell, label: t('settings.prefs.notifications') },
    { id: 'security', icon: Shield, label: t('settings.nav.security') || 'Security & Privacy' },
    { id: 'appearance', icon: Paintbrush, label: t('settings.prefs.appearance') },
    { id: 'localization', icon: Globe, label: t('settings.nav.localization') }
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const stats = await getUserStats(currentUser.uid);
          setFirstName(stats.firstName || '');
          setLastName(stats.lastName || '');
          setUsername(stats.username || '');
        } catch (e) {
          console.error("Error loading profile:", e);
        } finally {
          setLoading(false);
        }
      } else {
        navigate('/');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await updateUserProfile(user.uid, { firstName, lastName, username });
      setSuccessMsg(t('settings.profile.saved'));
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
      setErrorMsg(t('settings.profile.saveError') || 'Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (e) {
      console.error('Logout failed', e);
    }
  };

  const handlePasswordReset = async () => {
    if (!user || !user.email) return;
    try {
      await sendPasswordResetEmail(auth, user.email);
      setSuccessMsg((t('settings.security.resetSent') || "Password reset email sent to ") + user.email);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (e) {
      console.error(e);
      setErrorMsg(t('settings.security.resetError') || "Failed to send password reset email.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const userInitial = firstName ? firstName.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : '?');

  return (
    <motion.main 
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="p-4 md:p-8 max-w-7xl mx-auto flex flex-col md:flex-row gap-8"
    >
      {/* Sidebar Navigation */}
      <motion.div variants={cardVariants} className="w-full md:w-64 shrink-0">
        <h1 className="text-3xl font-bold text-on-surface mb-2">{t('settings.title')}</h1>
        <p className="text-sm text-on-surface-variant mb-6">{t('settings.subtitle')}</p>

        <div className="flex flex-col gap-1">
          {SECTIONS.map((section) => (
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
            {t('settings.nav.logout') || 'Log Out'}
          </button>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <motion.div variants={cardVariants} className="flex-1 max-w-3xl">
        <form onSubmit={handleSaveChanges} className="bg-surface border border-outline-variant rounded-3xl shadow-sm overflow-hidden">
          
          {activeSection === 'account' && (
            <>
              <div className="p-6 md:p-8 border-b border-outline-variant">
                <h2 className="text-2xl font-bold text-on-surface">{t('settings.profile.title') || 'Account Profile'}</h2>
                <p className="text-on-surface-variant mt-1">{t('settings.profile.subtitle') || 'Manage your personal information.'}</p>
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
                    <span className="text-sm font-bold text-on-surface-variant block">{t('settings.profile.avatarTitle') || 'Profile Initial Avatar'}</span>
                    <p className="text-xs text-on-surface-variant mt-1">{t('settings.profile.avatarDesc') || 'Generated dynamically from your first and last name.'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5 relative group">
                    <label className="text-sm font-semibold text-on-surface">{t('settings.profile.firstName') || 'First Name'}</label>
                    <input 
                      type="text" 
                      value={firstName} 
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder={t('settings.profile.firstName') || 'First name'}
                      className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all group-hover:border-outline" 
                    />
                  </div>
                  
                  <div className="space-y-1.5 relative group">
                    <label className="text-sm font-semibold text-on-surface">{t('settings.profile.lastName') || 'Last Name'}</label>
                    <input 
                      type="text" 
                      value={lastName} 
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder={t('settings.profile.lastName') || 'Last name'}
                      className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all group-hover:border-outline" 
                    />
                  </div>

                  <div className="space-y-1.5 relative group md:col-span-2">
                    <label className="text-sm font-semibold text-on-surface">{t('settings.profile.username') || 'Nickname / Username'}</label>
                    <input 
                      type="text" 
                      value={username} 
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={t('settings.profile.usernamePlaceholder') || 'Enter your nickname'}
                      className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all group-hover:border-outline" 
                    />
                  </div>

                  <div className="space-y-1.5 relative group md:col-span-2">
                    <label className="text-sm font-semibold text-on-surface">{t('settings.profile.email') || 'Email Address'}</label>
                    <input 
                      type="email" 
                      value={user?.email || 'user@example.com'} 
                      disabled 
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface-variant opacity-70 cursor-not-allowed" 
                    />
                    <p className="text-xs text-on-surface-variant mt-1">{t('settings.profile.emailDesc') || 'Logged in via Firebase Email/Password provider.'}</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeSection === 'notifications' && (
            <>
              <div className="p-6 md:p-8 border-b border-outline-variant">
                <h2 className="text-2xl font-bold text-on-surface">{t('settings.nav.notifications') || 'Notifications'}</h2>
                <p className="text-on-surface-variant mt-1">{t('settings.notifications.subtitle') || 'Manage how and when you receive updates.'}</p>
              </div>
              <div className="p-6 md:p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-on-surface text-sm">{t('settings.notifications.course') || 'Course Updates'}</h4>
                    <p className="text-xs text-on-surface-variant">{t('settings.notifications.courseDesc') || 'Get notified when enrolled courses add new content.'}</p>
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
                    <h4 className="font-semibold text-on-surface text-sm">{t('settings.notifications.marketing') || 'Marketing Emails'}</h4>
                    <p className="text-xs text-on-surface-variant">{t('settings.notifications.marketingDesc') || 'Receive weekly newsletters and feature updates.'}</p>
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
                <h2 className="text-2xl font-bold text-on-surface">{t('settings.nav.security') || 'Security & Privacy'}</h2>
                <p className="text-on-surface-variant mt-1">{t('settings.security.subtitle') || 'Manage your password and review the privacy policy.'}</p>
              </div>
              <div className="p-6 md:p-8 space-y-8">
                <div>
                  <h3 className="text-sm font-semibold text-on-surface mb-2">{t('settings.security.changePass') || 'Change Password'}</h3>
                  <p className="text-xs text-on-surface-variant mb-4">{t('settings.security.changePassDesc') || 'You will receive an email to reset your password.'}</p>
                  <button type="button" onClick={handlePasswordReset} className="bg-surface-container border border-outline-variant text-on-surface px-4 py-2 rounded-lg text-sm font-semibold hover:bg-surface-container-high transition-colors">
                    {t('settings.security.sendReset') || 'Send Reset Email'}
                  </button>
                </div>
                <div className="border-t border-outline-variant/30 pt-6">
                  <h3 className="text-lg font-bold text-on-surface mb-4">{t('settings.security.privacyTitle') || 'Privacy Policy'}</h3>
                  <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/50 max-h-64 overflow-y-auto text-sm text-on-surface-variant space-y-4">
                    <p><strong>Last Updated: June 16, 2026</strong></p>
                    <p>Welcome to yourway.co. Your privacy is important to us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our application.</p>
                    <p><strong>1. Information We Collect</strong><br/>We collect personal information that you voluntarily provide to us when you register on the application, express an interest in obtaining information about us or our products and services, when you participate in activities on the application or otherwise when you contact us. This includes your email address and name.</p>
                    <p><strong>2. How We Use Your Information</strong><br/>We use personal information collected via our application for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeSection === 'appearance' && (
            <>
              <div className="p-6 md:p-8 border-b border-outline-variant">
                <h2 className="text-2xl font-bold text-on-surface">{t('settings.appearance.title') || 'Appearance'}</h2>
                <p className="text-on-surface-variant mt-1">{t('settings.appearance.subtitle') || 'Customize the look and feel of your workspace.'}</p>
              </div>
              <div className="p-6 md:p-8">
                <div className="flex items-center justify-between bg-surface-container p-4 rounded-xl border border-outline-variant/50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Paintbrush className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-on-surface text-sm">{t('settings.appearance.darkMode') || 'Dark Mode'}</h4>
                      <p className="text-xs text-on-surface-variant">{t('settings.appearance.darkModeDesc') || 'Switch between light and dark themes using the sidebar toggle.'}</p>
                    </div>
                  </div>
                  <p className="text-xs text-secondary italic">{t('settings.appearance.checkSidebar') || 'Check sidebar for global toggle'}</p>
                </div>
              </div>
            </>
          )}

          {activeSection === 'localization' && (
            <>
              <div className="p-6 md:p-8 border-b border-outline-variant">
                <h2 className="text-2xl font-bold text-on-surface">{t('settings.nav.localization')}</h2>
                <p className="text-on-surface-variant mt-1">{t('settings.locale.subtitle')}</p>
              </div>
              <div className="p-6 md:p-8 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-on-surface mb-2">{t('settings.locale.interfaceLang')}</h3>
                  <p className="text-xs text-on-surface-variant mb-4">{t('settings.locale.interfaceLangDesc')}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {getAvailableLocales().map(lang => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => setLocale(lang.code)}
                        className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-colors ${
                          locale === lang.code 
                            ? 'border-primary bg-primary/5 shadow-sm' 
                            : 'border-outline-variant bg-surface hover:bg-surface-container'
                        }`}
                      >
                        <span className="text-2xl">{lang.flag}</span>
                        <div className="flex-1">
                          <p className={`text-sm font-semibold ${locale === lang.code ? 'text-primary' : 'text-on-surface'}`}>
                            {lang.label}
                          </p>
                          <p className="text-xs text-on-surface-variant uppercase">{lang.code}</p>
                        </div>
                        {locale === lang.code && <CheckCircle2 className="w-5 h-5 text-primary" />}
                      </button>
                    ))}
                  </div>
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
                  <><CheckCircle2 className="w-5 h-5" /> {t('settings.profile.saveChanges') || 'Save Changes'}</>
                )}
              </motion.button>
            </div>
          )}
        </form>
      </motion.div>

    </motion.main>
  );
}
