import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Shield, Paintbrush, LogOut, CheckCircle2 } from 'lucide-react';
import { auth, signOut } from '../firebase.js';
import { useNavigate } from 'react-router-dom';

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
  const [activeSection, setActiveSection] = useState('account');
  const [notifications, setNotifications] = useState(true);
  const [marketing, setMarketing] = useState(false);

  const sections = [
    { id: 'account', label: 'Account Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security & Privacy', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Paintbrush },
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error(error);
    }
  };

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
        <div className="bg-surface border border-outline-variant rounded-3xl shadow-sm overflow-hidden">
          
          <div className="p-6 md:p-8 border-b border-outline-variant">
            <h2 className="text-2xl font-bold text-on-surface">Account Profile</h2>
            <p className="text-on-surface-variant mt-1">Manage your personal information and learning preferences.</p>
          </div>

          <div className="p-6 md:p-8 space-y-8">
            {/* Avatar Section */}
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                PL
              </div>
              <div>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="px-4 py-2 bg-surface-container hover:bg-surface-container-high border border-outline-variant rounded-lg text-sm font-semibold text-on-surface transition-colors">
                  Change Avatar
                </motion.button>
                <p className="text-xs text-on-surface-variant mt-2">JPG, GIF or PNG. 1MB max.</p>
              </div>
            </div>

            {/* Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5 relative group">
                <label className="text-sm font-semibold text-on-surface">First Name</label>
                <input type="text" defaultValue="Premium" className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all group-hover:border-outline" />
              </div>
              <div className="space-y-1.5 relative group">
                <label className="text-sm font-semibold text-on-surface">Last Name</label>
                <input type="text" defaultValue="Learner" className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all group-hover:border-outline" />
              </div>
              <div className="space-y-1.5 relative group md:col-span-2">
                <label className="text-sm font-semibold text-on-surface">Email Address</label>
                <input type="email" value={auth.currentUser?.email || 'user@example.com'} disabled className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface-variant opacity-70 cursor-not-allowed" />
                <p className="text-xs text-on-surface-variant mt-1">Contact support to change your email address.</p>
              </div>
            </div>

            {/* Toggle Section */}
            <div className="pt-6 border-t border-outline-variant/50 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-on-surface text-sm">Course Updates</h4>
                  <p className="text-xs text-on-surface-variant">Get notified when enrolled courses add new content.</p>
                </div>
                <button 
                  onClick={() => setNotifications(!notifications)} 
                  className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out ${notifications ? 'bg-primary' : 'bg-surface-container-high'}`}
                >
                  <motion.div 
                    layout 
                    className="w-4 h-4 rounded-full bg-white shadow-sm"
                    animate={{ x: notifications ? 24 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-on-surface text-sm">Marketing Emails</h4>
                  <p className="text-xs text-on-surface-variant">Receive weekly newsletters and feature updates.</p>
                </div>
                <button 
                  onClick={() => setMarketing(!marketing)} 
                  className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out ${marketing ? 'bg-primary' : 'bg-surface-container-high'}`}
                >
                  <motion.div 
                    layout 
                    className="w-4 h-4 rounded-full bg-white shadow-sm"
                    animate={{ x: marketing ? 24 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>
            </div>

            <div className="pt-6 border-t border-outline-variant/50 flex justify-end">
              <motion.button 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }} 
                className="bg-primary text-on-primary px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-primary/20 flex items-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" /> Save Changes
              </motion.button>
            </div>

          </div>
        </div>
      </motion.div>

    </motion.main>
  );
}
