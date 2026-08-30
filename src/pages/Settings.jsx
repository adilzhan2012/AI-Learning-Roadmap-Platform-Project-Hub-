import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Bell, Shield, Paintbrush, LogOut, CheckCircle2, Loader2, Sparkles, Key, AlertTriangle, X, Globe, FileText, ChevronRight } from 'lucide-react';
import { auth, signOut, db, functions, storage } from '../firebase.js';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import UserAvatar from '../components/shared/UserAvatar.jsx';
import ImageCropperModal from '../components/shared/ImageCropperModal.jsx';
import { onAuthStateChanged, sendPasswordResetEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useNavigate } from 'react-router-dom';
import { getUserStats, updateUserProfile } from '../services/courseService.js';
import { t, useLocale, getAvailableLocales, setLocale } from '../i18n.js';
import LegalDocModal from '../components/shared/LegalDocModal.jsx';
import PasswordStrengthMeter from '../components/auth/PasswordStrengthMeter.jsx';
import { validateNistPassword, checkPwnedPassword } from '../utils/passwordValidator.js';
import { Eye, EyeOff, KeyRound } from 'lucide-react';

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
  const [photoURL, setPhotoURL] = useState('');
  const [avatarColor, setAvatarColor] = useState('');
  
  // Cropper State
  const [cropperOpen, setCropperOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  // App State
  const [notifications, setNotifications] = useState(() => localStorage.getItem('prefs_notifications') !== 'false');
  const [marketing, setMarketing] = useState(() => localStorage.getItem('prefs_marketing') === 'true');
  const [groupProgressNotifications, setGroupProgressNotifications] = useState(() => localStorage.getItem('prefs_group_progress_notifications') !== 'false');
  const [activeSection, setActiveSection] = useState('account');
  const [activeModal, setActiveModal] = useState(null); // 'terms' | 'privacy' | 'cookie' | null

  // Direct Password Change States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [isCheckingBreach, setIsCheckingBreach] = useState(false);
  const [breachFound, setBreachFound] = useState(false);

  useEffect(() => {
    localStorage.setItem('prefs_notifications', notifications);
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('prefs_marketing', marketing);
  }, [marketing]);

  useEffect(() => {
    localStorage.setItem('prefs_group_progress_notifications', groupProgressNotifications);
  }, [groupProgressNotifications]);

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
          setPhotoURL(stats.photoURL || '');
          setAvatarColor(stats.avatarColor || '');
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

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Clear the input value so selecting the same file again triggers onChange
    e.target.value = null;
    
    const objectUrl = URL.createObjectURL(file);
    setRawImageSrc(objectUrl);
    setCropperOpen(true);
  };
  
  const handleCropComplete = async (croppedBlob) => {
    setCropperOpen(false);
    setRawImageSrc(null);
    setUploadingAvatar(true);
    setErrorMsg('');
    try {
      const avatarRef = ref(storage, `avatars/${user.uid}.jpg`);
      await uploadBytes(avatarRef, croppedBlob);
      const url = await getDownloadURL(avatarRef);
      
      setPhotoURL(url);
      
      // Notify Topbar
      const cached = JSON.parse(localStorage.getItem('cached_profile') || '{}');
      const updatedProfile = { ...cached, photoURL: url };
      localStorage.setItem('cached_profile', JSON.stringify(updatedProfile));
      window.dispatchEvent(new CustomEvent('profileUpdated', { detail: updatedProfile }));
      
      setSuccessMsg(t('settings.profile.saved') || 'Profile saved successfully!');
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to upload image. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };
  
  const handleRemoveAvatar = async () => {
    if (!photoURL) return;
    setUploadingAvatar(true);
    try {
      const avatarRef = ref(storage, `avatars/${user.uid}.jpg`);
      await deleteObject(avatarRef).catch(e => console.log('Ignore if not exists', e));
      setPhotoURL('');
      
      // Notify Topbar
      const cached = JSON.parse(localStorage.getItem('cached_profile') || '{}');
      const updatedProfile = { ...cached, photoURL: '' };
      localStorage.setItem('cached_profile', JSON.stringify(updatedProfile));
      window.dispatchEvent(new CustomEvent('profileUpdated', { detail: updatedProfile }));
      
      setSuccessMsg('Avatar removed');
    } catch(e) {
      console.error(e);
      setErrorMsg('Failed to remove avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const AVATAR_COLORS = [
    'bg-gradient-to-br from-indigo-500 to-purple-600',
    'bg-gradient-to-br from-emerald-500 to-teal-600',
    'bg-gradient-to-br from-rose-500 to-pink-600',
    'bg-gradient-to-br from-amber-500 to-orange-600',
    'bg-gradient-to-br from-blue-500 to-cyan-600',
    'bg-gradient-to-br from-fuchsia-500 to-violet-600',
    '#252525',
    '#18181b',
  ];

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await updateUserProfile(user.uid, { firstName, lastName, username, photoURL, avatarColor });
      
      // Update local storage and dispatch event to notify Topbar
      const cached = JSON.parse(localStorage.getItem('cached_profile') || '{}');
      const updatedProfile = { ...cached, firstName, lastName, username, photoURL, avatarColor };
      localStorage.setItem('cached_profile', JSON.stringify(updatedProfile));
      window.dispatchEvent(new CustomEvent('profileUpdated', { detail: updatedProfile }));
      
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

  // Debounced breach checking for new password in Settings
  useEffect(() => {
    if (!newPassword || newPassword.length < 12) {
      setBreachFound(false);
      setIsCheckingBreach(false);
      return;
    }

    let isMounted = true;
    const timer = setTimeout(async () => {
      setIsCheckingBreach(true);
      try {
        const count = await checkPwnedPassword(newPassword);
        if (isMounted) setBreachFound(count > 0);
      } catch (_) {
        if (isMounted) setBreachFound(false);
      } finally {
        if (isMounted) setIsCheckingBreach(false);
      }
    }, 450);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [newPassword]);

  const handleDirectPasswordChange = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!user || !user.email) return;

    if (!currentPassword) {
      setErrorMsg(locale === 'ru' ? 'Введите текущий пароль' : 'Enter current password');
      return;
    }

    if (!newPassword) {
      setErrorMsg(t('auth.passwordRules.required'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg(locale === 'ru' ? 'Новые пароли не совпадают' : 'New passwords do not match');
      return;
    }

    // NIST Validation
    const nistResult = await validateNistPassword(newPassword, {
      email: user.email,
      username,
      firstName,
      lastName
    }, { checkBreach: true });

    if (!nistResult.valid) {
      const firstErrorKey = nistResult.errors[0];
      setErrorMsg(t(firstErrorKey) || (locale === 'ru' ? 'Пароль не соответствует требованиям безопасности' : 'Password does not meet security requirements'));
      return;
    }

    setChangingPassword(true);
    try {
      // 1. Re-authenticate user with current password
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // 2. Update password
      await updatePassword(user, newPassword);

      setSuccessMsg(locale === 'ru' ? 'Пароль успешно обновлен!' : 'Password successfully updated!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      console.error('Password change error:', err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setErrorMsg(locale === 'ru' ? 'Неверный текущий пароль' : 'Incorrect current password');
      } else if (err.code === 'auth/requires-recent-login') {
        setErrorMsg(locale === 'ru' ? 'Сессия устарела. Пожалуйста, выйдите и войдите снова' : 'Session expired. Please log out and log in again');
      } else {
        setErrorMsg(err.message || (locale === 'ru' ? 'Не удалось изменить пароль' : 'Failed to change password'));
      }
    } finally {
      setChangingPassword(false);
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
      <div className="flex items-center justify-center h-full min-h-screen w-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const userInitial = firstName ? firstName.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : '?');

  const getProviderName = () => {
    if (!user || !user.providerData || user.providerData.length === 0) return locale === 'ru' ? 'Email/Пароль' : 'Email/Password';
    const providerId = user.providerData[0].providerId;
    if (providerId === 'google.com') return 'Google';
    if (providerId === 'github.com') return 'GitHub';
    if (providerId === 'apple.com') return 'Apple';
    return locale === 'ru' ? 'Email/Пароль' : 'Email/Password';
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 shrink-0 select-none flex flex-col md:sticky md:top-24 self-start">
        <div>
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

        <div className="mt-8 text-xs text-on-surface-variant/60">
          <p>&copy; {new Date().getFullYear()} {locale === 'ru' ? 'Все права защищены.' : 'All rights reserved.'}</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full md:max-w-3xl min-w-0">
        <div className="bg-surface border border-outline-variant rounded-3xl shadow-sm overflow-hidden min-h-[440px] flex flex-col justify-between">
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

                    <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-8 p-6 bg-surface-container rounded-2xl border border-outline/50">
                      <div className="relative group shrink-0">
                        <UserAvatar 
                          photoURL={photoURL}
                          firstName={firstName}
                          lastName={lastName}
                          email={user?.email}
                          avatarColor={avatarColor}
                          className="w-24 h-24 text-3xl shadow-xl"
                        />
                        {uploadingAvatar && (
                          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm">
                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                          </div>
                        )}
                        <label className="absolute bottom-0 right-0 p-2 bg-primary text-on-primary rounded-full cursor-pointer hover:scale-105 transition-transform shadow-lg z-10" title="Upload Photo">
                          <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        </label>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-on-surface mb-1">
                          {locale === 'en' ? 'Your Avatar' : 'Ваш Аватар'}
                        </h3>
                        <p className="text-xs text-on-surface-variant mb-4 max-w-sm">
                          {locale === 'en'
                            ? 'Upload a photo to personalize your profile (max 2MB). If no photo is set, choose a background color for your initials.'
                            : 'Загрузите фото, чтобы персонализировать профиль. Максимальный размер 2MB. Если фото не загружено, выберите цвет фона для инициалов.'}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-3">
                          {photoURL ? (
                            <button 
                              type="button" 
                              onClick={handleRemoveAvatar}
                              disabled={uploadingAvatar}
                              className="text-xs font-semibold px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl transition-colors"
                            >
                              {locale === 'en' ? 'Remove photo' : 'Удалить фото'}
                            </button>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {AVATAR_COLORS.map((color, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => setAvatarColor(color)}
                                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${color.startsWith('#') ? '' : color} ${avatarColor === color || (!avatarColor && i === 0) ? 'border-primary scale-110' : 'border-transparent'}`}
                                  style={color.startsWith('#') ? { backgroundColor: color } : {}}
                                  title="Change avatar color"
                                />
                              ))}
                            </div>
                          )}
                        </div>
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
                        <p className="text-xs text-on-surface-variant mt-1">
                          {locale === 'ru' ? `Вход выполнен через ${getProviderName()}` : `Logged in via ${getProviderName()}`}
                        </p>
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
                    <div className="flex items-start gap-4 p-4 rounded-xl border border-outline-variant/40 bg-surface-container/20">
                      <div className="pt-1">
                        <label className="relative flex cursor-pointer items-center rounded-full p-1" htmlFor="checkbox-marketing">
                          <input 
                            type="checkbox" 
                            className="peer cursor-pointer appearance-none rounded-md border-2 border-on-surface/40 hover:border-primary bg-surface transition-all checked:border-primary checked:bg-primary w-5 h-5"
                            id="checkbox-marketing"
                            checked={marketing}
                            onChange={(e) => setMarketing(e.target.checked)}
                          />
                          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-on-primary opacity-0 transition-opacity peer-checked:opacity-100">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                            </svg>
                          </div>
                        </label>
                      </div>
                      <div className="flex-1 cursor-pointer" onClick={() => setMarketing(!marketing)}>
                        <h4 className="font-semibold text-on-surface text-base mb-1">{t('settings.notifications.marketing') || 'Marketing Emails'}</h4>
                        <p className="text-sm text-on-surface-variant leading-relaxed">{t('settings.notifications.marketingDesc') || 'Receive weekly newsletters and feature updates.'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 rounded-xl border border-outline-variant/40 bg-surface-container/20">
                      <div className="pt-1">
                        <label className="relative flex cursor-pointer items-center rounded-full p-1" htmlFor="checkbox-group-progress">
                          <input 
                            type="checkbox" 
                            className="peer cursor-pointer appearance-none rounded-md border-2 border-on-surface/40 hover:border-primary bg-surface transition-all checked:border-primary checked:bg-primary w-5 h-5"
                            id="checkbox-group-progress"
                            checked={groupProgressNotifications}
                            onChange={(e) => setGroupProgressNotifications(e.target.checked)}
                          />
                          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-on-primary opacity-0 transition-opacity peer-checked:opacity-100">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                            </svg>
                          </div>
                        </label>
                      </div>
                      <div className="flex-1 cursor-pointer" onClick={() => setGroupProgressNotifications(!groupProgressNotifications)}>
                        <h4 className="font-semibold text-on-surface text-base mb-1">
                          {locale === 'en' ? 'Group Study Progress Notifications' : 'Уведомления о прогрессе участников группы'}
                        </h4>
                        <p className="text-sm text-on-surface-variant leading-relaxed">
                          {locale === 'en'
                            ? 'Receive updates when your group study peers complete modules and submit homework.'
                            : 'Получать сообщения о прохождении модулей и сдаче домашних заданий согруппниками.'}
                        </p>
                      </div>
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
                    {/* In-app Direct Password Update Form with NIST standard */}
                    <div className="bg-surface-container/60 border border-outline-variant/60 rounded-2xl p-5 md:p-6">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <KeyRound className="w-5 h-5 text-primary" />
                        <h3 className="text-base font-bold text-on-surface">
                          {locale === 'ru' ? 'Смена пароля' : 'Change Password'}
                        </h3>
                      </div>
                      <p className="text-xs text-on-surface-variant mb-6">
                        {locale === 'ru' 
                          ? 'Введите текущий пароль и новый надежный пароль по стандартам NIST SP 800-63B.' 
                          : 'Enter your current password and a new secure password adhering to NIST SP 800-63B.'}
                      </p>

                      <form onSubmit={handleDirectPasswordChange} className="space-y-4 max-w-xl">
                        {/* Current password */}
                        <div>
                          <label className="block text-xs font-semibold text-on-surface mb-1.5">
                            {locale === 'ru' ? 'Текущий пароль' : 'Current Password'}
                          </label>
                          <div className="relative">
                            <input 
                              type={showCurrentPass ? "text" : "password"}
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              autoComplete="current-password"
                              className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all pr-10 text-sm"
                              placeholder="••••••••"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowCurrentPass(!showCurrentPass)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-1"
                              title={showCurrentPass ? (locale === 'ru' ? 'Скрыть' : 'Hide') : (locale === 'ru' ? 'Показать' : 'Show')}
                            >
                              {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* New password */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-semibold text-on-surface">
                              {locale === 'ru' ? 'Новый пароль' : 'New Password'}
                            </label>
                            <span className="text-[11px] text-on-surface-variant">
                              {t('auth.passwordRules.unicodeSupported')}
                            </span>
                          </div>
                          <div className="relative">
                            <input 
                              type={showNewPass ? "text" : "password"}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              autoComplete="new-password"
                              className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all pr-10 text-sm"
                              placeholder={locale === 'ru' ? 'Минимум 12 символов или фраза' : '12+ characters or passphrase'}
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPass(!showNewPass)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-1"
                              title={showNewPass ? (locale === 'ru' ? 'Скрыть' : 'Hide') : (locale === 'ru' ? 'Показать' : 'Show')}
                            >
                              {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>

                          {/* NIST Strength Meter & Real-time Checklist */}
                          <PasswordStrengthMeter 
                            password={newPassword}
                            context={{ email: user?.email, username, firstName, lastName }}
                            isCheckingBreach={isCheckingBreach}
                            breachFound={breachFound}
                          />
                        </div>

                        {/* Confirm new password */}
                        <div>
                          <label className="block text-xs font-semibold text-on-surface mb-1.5">
                            {locale === 'ru' ? 'Повторите новый пароль' : 'Confirm New Password'}
                          </label>
                          <div className="relative">
                            <input 
                              type={showConfirmPass ? "text" : "password"}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              autoComplete="new-password"
                              className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all pr-10 text-sm"
                              placeholder="••••••••"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPass(!showConfirmPass)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-1"
                              title={showConfirmPass ? (locale === 'ru' ? 'Скрыть' : 'Hide') : (locale === 'ru' ? 'Показать' : 'Show')}
                            >
                              {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="pt-2 flex flex-wrap items-center gap-3">
                          <button
                            type="submit"
                            disabled={changingPassword || !newPassword || !currentPassword}
                            className="bg-primary hover:bg-primary/90 text-on-primary font-bold px-5 py-2.5 rounded-xl text-xs transition-all disabled:opacity-50 flex items-center gap-2 shadow-md active:scale-[0.98]"
                          >
                            {changingPassword && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            {locale === 'ru' ? 'Сохранить новый пароль' : 'Update Password'}
                          </button>

                          <button
                            type="button"
                            onClick={handlePasswordReset}
                            className="bg-surface-container border border-outline-variant text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high px-4 py-2.5 rounded-xl text-xs font-medium transition-colors"
                          >
                            {locale === 'ru' ? 'Сбросить через Email' : 'Reset via Email'}
                          </button>
                        </div>
                      </form>
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
                type="button"
                onClick={handleSaveChanges}
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
        </div>
      </div>

      <ImageCropperModal
        isOpen={cropperOpen}
        onClose={() => { setCropperOpen(false); setRawImageSrc(null); }}
        imageSrc={rawImageSrc}
        onCropComplete={handleCropComplete}
      />

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
