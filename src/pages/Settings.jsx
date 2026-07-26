import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Bell, Shield, Paintbrush, LogOut, CheckCircle2, Loader2, Sparkles, Key, AlertTriangle, X, Globe, FileText, ChevronRight } from 'lucide-react';
import { auth, signOut, db, functions } from '../firebase.js';
import { onAuthStateChanged, sendPasswordResetEmail } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useNavigate } from 'react-router-dom';
import { getUserStats, updateUserProfile } from '../services/courseService.js';
import { t, useLocale, getAvailableLocales, setLocale } from '../i18n.js';
import LegalDocModal from '../components/shared/LegalDocModal.jsx';

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
  const [activeModal, setActiveModal] = useState(null); // 'terms' | 'privacy' | 'cookie' | null

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

  const handleDeleteAccount = async () => {
    const confirmMsg = locale === 'ru' 
      ? 'Вы уверены, что хотите навсегда удалить свой аккаунт? Это действие необратимо, и все ваши данные будут потеряны.' 
      : 'Are you sure you want to permanently delete your account? This action is irreversible and all your data will be lost.';
    
    if (!window.confirm(confirmMsg)) return;
    
    if (!user) return;
    try {
      setLoading(true);
      const deleteUserDataFn = httpsCallable(functions, 'deleteUserData');
      await deleteUserDataFn();
      await signOut(auth);
      navigate('/');
    } catch (err) {
      console.error(err);
      setLoading(false);
      alert((locale === 'ru' ? 'Ошибка при удалении аккаунта: ' : 'Error deleting account: ') + (err.message || err.code));
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
    <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 shrink-0 select-none">
        <h1 className="text-3xl font-bold text-on-surface mb-2">{t('settings.title')}</h1>
        <p className="text-sm text-on-surface-variant mb-6">{t('settings.subtitle')}</p>

        <div className="flex flex-col gap-1">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors text-left border ${
                activeSection === section.id 
                  ? 'text-on-surface bg-surface border-outline-variant shadow-sm' 
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container border-transparent'
              }`}
            >
              <section.icon className={`w-5 h-5 shrink-0 ${activeSection === section.id ? 'text-primary' : ''}`} />
              <span className="truncate">{section.label}</span>
            </button>
          ))}
          
          <div className="my-4 border-t border-outline-variant/50"></div>
          
          <button type="button" onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-error hover:bg-error/10 transition-colors text-left group">
            <LogOut className="w-5 h-5 shrink-0 group-hover:-translate-x-1 transition-transform" />
            <span>{t('settings.nav.logout') || 'Log Out'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full md:max-w-3xl min-w-0">
        <form onSubmit={handleSaveChanges} className="bg-surface border border-outline-variant rounded-3xl shadow-sm overflow-hidden min-h-[440px] flex flex-col justify-between">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1, ease: 'easeInOut' }}
              className="flex-1"
            >
              {activeSection === 'account' && (
                <>
                  <div className="p-4 sm:p-6 md:p-8 border-b border-outline-variant">
                    <h2 className="text-2xl font-bold text-on-surface">{t('settings.nav.profile') || 'Profile Settings'}</h2>
                    <p className="text-on-surface-variant mt-1">{t('settings.profile.subtitle') || 'Update your personal details and public profile.'}</p>
                  </div>
                  <div className="p-4 sm:p-6 md:p-8 space-y-6 md:space-y-8">
                    <AnimatePresence mode="wait">
                      {successMsg && (
                        <motion.div 
                          key="success"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="bg-green-500/10 border border-green-500/20 text-green-500 rounded-xl p-4 text-sm font-semibold flex items-center gap-2 mb-4"
                        >
                          <CheckCircle2 className="w-5 h-5" /> {successMsg}
                        </motion.div>
                      )}
                      {errorMsg && (
                        <motion.div 
                          key="error"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl p-4 text-sm font-semibold flex items-center gap-2 mb-4"
                        >
                          <AlertTriangle className="w-5 h-5 animate-pulse" /> {errorMsg}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex items-center gap-4 md:gap-6">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-on-surface text-xl md:text-2xl font-bold shadow-lg shrink-0">
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
                  <div className="p-4 sm:p-6 md:p-8 border-b border-outline-variant">
                    <h2 className="text-2xl font-bold text-on-surface">{t('settings.nav.notifications') || 'Notifications'}</h2>
                    <p className="text-on-surface-variant mt-1">{t('settings.notifications.subtitle') || 'Manage how and when you receive updates.'}</p>
                  </div>
                  <div className="p-4 sm:p-6 md:p-8 space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-on-surface text-sm">{t('settings.notifications.course') || 'Course Updates'}</h4>
                        <p className="text-xs text-on-surface-variant">{t('settings.notifications.courseDesc') || 'Get notified when enrolled courses add new content.'}</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setNotifications(!notifications)} 
                        className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${notifications ? 'bg-primary' : 'bg-surface-container-high'}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-on-surface shadow-sm transition-transform duration-200 ${notifications ? 'translate-x-6' : 'translate-x-0'}`} />
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
                        <div className={`w-4 h-4 rounded-full bg-on-surface shadow-sm transition-transform duration-200 ${marketing ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>
                </>
              )}

              {activeSection === 'security' && (
                <>
                  <div className="p-4 sm:p-6 md:p-8 border-b border-outline-variant">
                    <h2 className="text-2xl font-bold text-on-surface">{t('settings.nav.security') || 'Security & Privacy'}</h2>
                    <p className="text-on-surface-variant mt-1">{t('settings.security.subtitle') || 'Manage your password and review the privacy policy.'}</p>
                  </div>
                  <div className="p-4 sm:p-6 md:p-8 space-y-8">
                    <div>
                      <h3 className="text-sm font-semibold text-on-surface mb-2">{t('settings.security.changePass') || 'Change Password'}</h3>
                      <p className="text-xs text-on-surface-variant mb-4">{t('settings.security.changePassDesc') || 'You will receive an email to reset your password.'}</p>
                      <button type="button" onClick={handlePasswordReset} className="w-full md:w-auto text-center justify-center bg-surface-container border border-outline-variant text-on-surface px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-surface-container-high transition-colors">
                        {t('settings.security.sendReset') || 'Send Reset Email'}
                      </button>
                    </div>
                    <div className="border-t border-outline-variant/30 pt-6">
                      <h3 className="text-lg font-bold text-on-surface mb-4">
                        {locale === 'ru' ? 'Правовые документы и приватность' : 'Legal Documents & Privacy'}
                      </h3>
                      <p className="text-xs text-on-surface-variant mb-4">
                        {locale === 'ru' 
                          ? 'Ознакомьтесь с официальными документами платформы YourWay.co.' 
                          : 'Review the official documents of the YourWay.co platform.'}
                      </p>
                      <div className="flex flex-col gap-3">
                        {[
                          { key: 'terms', ru: 'Пользовательское соглашение', en: 'Terms of Service' },
                          { key: 'privacy', ru: 'Политика конфиденциальности', en: 'Privacy Policy' },
                          { key: 'cookie', ru: 'Политика файлов Cookie', en: 'Cookie Policy' }
                        ].map(doc => (
                          <button
                            key={doc.key}
                            type="button"
                            onClick={() => setActiveModal(doc.key)}
                            className="flex items-center justify-between bg-surface-container p-4 rounded-xl border border-outline-variant/50 hover:bg-surface-container-high transition-colors text-left"
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-primary" />
                              <span className="text-sm font-semibold text-on-surface">
                                {locale === 'ru' ? doc.ru : doc.en}
                              </span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-on-surface-variant" />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-red-500/20 pt-6 mt-8">
                      <h3 className="text-lg font-bold text-red-500 mb-2">
                        {locale === 'ru' ? 'Опасная зона' : 'Danger Zone'}
                      </h3>
                      <p className="text-xs text-on-surface-variant mb-4">
                        {locale === 'ru' ? 'Полное и безвозвратное удаление вашего аккаунта и всех связанных данных.' : 'Permanently delete your account and all associated data.'}
                      </p>
                      <button type="button" onClick={handleDeleteAccount} className="w-full md:w-auto text-center justify-center bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors">
                        {locale === 'ru' ? 'Удалить аккаунт' : 'Delete Account'}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {activeSection === 'appearance' && (
                <>
                  <div className="p-4 sm:p-6 md:p-8 border-b border-outline-variant">
                    <h2 className="text-2xl font-bold text-on-surface">{t('settings.appearance.title') || 'Appearance'}</h2>
                    <p className="text-on-surface-variant mt-1">{t('settings.appearance.subtitle') || 'Customize the look and feel of your workspace.'}</p>
                  </div>
                  <div className="p-4 sm:p-6 md:p-8">
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
                  <div className="p-4 sm:p-6 md:p-8 border-b border-outline-variant">
                    <h2 className="text-2xl font-bold text-on-surface">{t('settings.nav.localization')}</h2>
                    <p className="text-on-surface-variant mt-1">{t('settings.locale.subtitle')}</p>
                  </div>
                  <div className="p-4 sm:p-6 md:p-8 space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold text-on-surface mb-2">{t('settings.locale.interfaceLang')}</h3>
                      <p className="text-xs text-on-surface-variant mb-4">{t('settings.locale.interfaceLangDesc')}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {getAvailableLocales().map(lang => (
                          <button
                            key={lang.code}
                            type="button"
                            disabled={lang.disabled}
                            onClick={() => !lang.disabled && setLocale(lang.code)}
                            className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-colors relative ${
                              lang.disabled 
                                ? 'border-outline-variant/40 bg-surface-container/30 opacity-60 cursor-not-allowed' 
                                : locale === lang.code 
                                ? 'border-primary bg-primary/5 shadow-sm' 
                                : 'border-outline-variant bg-surface hover:bg-surface-container'
                            }`}
                          >
                            <span className="text-2xl">{lang.flag}</span>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className={`text-sm font-semibold ${locale === lang.code ? 'text-primary' : 'text-on-surface'}`}>
                                  {lang.label}
                                </p>
                                {lang.statusText && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                    {lang.statusText}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-on-surface-variant uppercase mt-0.5">{lang.code}</p>
                            </div>
                            {locale === lang.code && !lang.disabled && <CheckCircle2 className="w-5 h-5 text-primary" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          {(activeSection === 'account' || activeSection === 'notifications') && (
            <div className="p-4 sm:p-6 md:p-8 pt-0 flex flex-col md:flex-row justify-end">
              <button 
                type="submit"
                disabled={saving}
                className="w-full md:w-auto justify-center bg-primary text-on-primary px-6 py-3 rounded-xl font-semibold shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <><CheckCircle2 className="w-5 h-5" /> {t('settings.profile.saveChanges') || 'Save Changes'}</>
                )}
              </button>
            </div>
          )}
        </form>
      </div>

      <AnimatePresence>
        {activeModal && (
          <LegalDocModal 
            isOpen={!!activeModal} 
            onClose={() => setActiveModal(null)} 
            docKey={activeModal} 
          />
        )}
      </AnimatePresence>

    </div>
  );
}
