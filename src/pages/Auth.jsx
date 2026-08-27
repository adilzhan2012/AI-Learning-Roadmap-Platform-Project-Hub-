import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, Mail, CheckCircle2, X, Eye, EyeOff, Upload, User, ArrowRight } from 'lucide-react';
import Logo from '../components/shared/Logo.jsx';
import { 
  auth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  GoogleAuthProvider, 
  GithubAuthProvider,
  signInWithPopup,
  db,
  storage
} from '../firebase.js';
import { sendEmailVerification, updateProfile, sendPasswordResetEmail, onAuthStateChanged, getAdditionalUserInfo } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getUserStats } from '../services/courseService.js';
import { t, useLocale } from '../i18n.js';
import LegalDocModal from '../components/shared/LegalDocModal.jsx';
import UserAvatar from '../components/shared/UserAvatar.jsx';
import ImageCropperModal from '../components/shared/ImageCropperModal.jsx';

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

function getFriendlyErrorMessage(code) {
  switch (code) {
    case 'auth/email-already-in-use':
      return t('auth.error.emailInUse');
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return t('auth.error.invalidCredential');
    case 'auth/weak-password':
      return t('auth.error.weakPassword');
    case 'auth/invalid-email':
      return t('auth.error.invalidEmail');
    case 'auth/invalid-api-key':
      return t('auth.error.invalidApiKey');
    case 'auth/operation-not-allowed':
      return t('auth.error.operationNotAllowed');
    default:
      return t('auth.error.default') || 'An error occurred. Please try again.';
  }
}

const floatVariants = {
  animate: {
    y: [0, -20, 0],
    transition: { duration: 5, repeat: Infinity, ease: 'easeInOut' }
  }
};

export default function Auth({ type }) {
  const locale = useLocale();
  const isLogin = type === 'login';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const referredBy = searchParams.get('ref');

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  
  // Registration Wizard States
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState(null);
  
  const [authMethod, setAuthMethod] = useState('email'); // 'email' | 'google' | 'github' | 'apple'
  const [providerUser, setProviderUser] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'terms' | 'privacy' | 'cookie' | null
  const [showRegSuccess, setShowRegSuccess] = useState(false);

  // Password Reset States
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    // Auto-redirect or setup wizard for authenticated users
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser && !loading && !showRegSuccess) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.username || data.firstName || data.displayName || currentUser.displayName) {
              navigate('/dashboard');
            }
          } else {
            // User is authenticated in Firebase Auth, but has no Firestore profile document yet
            if (isLogin) {
              // Redirect to register wizard to complete profile setup
              navigate('/register');
            } else {
              // Populate initial fields from currentUser on register page
              if (currentUser.email && !email) setEmail(currentUser.email);
              if (currentUser.displayName && !firstName) {
                const parts = currentUser.displayName.split(' ');
                setFirstName(parts[0] || '');
                setLastName(parts.slice(1).join(' ') || '');
              }
              setProviderUser(currentUser);
              setAuthMethod(currentUser.providerData?.[0]?.providerId || 'email');
            }
          }
        } catch(e) {
          console.error('[Auth] Error checking user profile:', e);
        }
      }
    });
    return () => unsubscribe();
  }, [loading, showRegSuccess, authMethod, navigate, isLogin]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return locale === 'ru' ? 'Доброе утро, приступим?' : "Good morning, let's start";
    if (hour >= 12 && hour < 18) return locale === 'ru' ? 'Добрый день, приступим?' : "Good afternoon, let's start";
    if (hour >= 18 && hour < 23) return locale === 'ru' ? 'Добрый вечер, приступим?' : "Good evening, let's start";
    return locale === 'ru' ? 'Доброй ночи, приступим?' : "Good night, let's start";
  };

  const title = isLogin ? getGreeting() : t('auth.createAccount');
  const subtitle = isLogin ? t('auth.loginSubtitle') : t('auth.registerSubtitle');
  const altText = isLogin ? t('auth.noAccount') : t('auth.haveAccount');
  const altLink = isLogin ? '/register' : '/login';
  const altLinkText = isLogin ? t('auth.signUp') : t('auth.signIn');

  const handleNextStep = () => {
    setError('');
    if (step === 1) {
      if (!firstName.trim() || !lastName.trim()) {
        setError(locale === 'ru' ? 'Введите имя и фамилию' : 'Enter first and last name');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!email.trim() || !username.trim()) {
        setError(locale === 'ru' ? 'Введите email и никнейм' : 'Enter email and username');
        return;
      }
      if (!email.includes('@')) {
        setError(locale === 'ru' ? 'Неверный формат email' : 'Invalid email format');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!password) {
        setError(locale === 'ru' ? 'Введите пароль' : 'Enter password');
        return;
      }
      if (password !== confirmPassword) {
        setError(locale === 'ru' ? 'Пароли не совпадают' : 'Passwords do not match');
        return;
      }
      if (password.length < 6) {
        setError(locale === 'ru' ? 'Пароль должен содержать минимум 6 символов' : 'Password must be at least 6 characters');
        return;
      }
      if (!agreed) {
        setError(locale === 'ru' ? 'Вы должны согласиться с политиками' : 'You must agree to the policies');
        return;
      }
      setStep(4);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setRawImageSrc(objectUrl);
    setCropperOpen(true);
  };

  const handleCropComplete = (croppedBlob) => {
    setAvatarFile(croppedBlob);
    const previewUrl = URL.createObjectURL(croppedBlob);
    setAvatarPreview(previewUrl);
    setCropperOpen(false);
    setRawImageSrc(null);
  };

  const finishRegistration = async (userObj) => {
    try {
      let finalPhotoUrl = '';
      
      if (avatarFile && userObj) {
        const bitmap = await createImageBitmap(avatarFile);
        const MAX_SIZE = 500;
        const scale = Math.min(MAX_SIZE / bitmap.width, MAX_SIZE / bitmap.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width * scale;
        canvas.height = bitmap.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));
        const avatarRef = ref(storage, `avatars/${userObj.uid}.jpg`);
        await uploadBytes(avatarRef, blob);
        finalPhotoUrl = await getDownloadURL(avatarRef);
      }

      const fullName = `${firstName} ${lastName}`.trim();
      await updateProfile(userObj, { 
        displayName: fullName,
        photoURL: finalPhotoUrl || userObj.photoURL || ''
      });
      
      const stats = await getUserStats(userObj.uid, { 
        firstName, 
        lastName, 
        username, 
        referredBy, 
        email,
        avatarColor: finalPhotoUrl ? '' : avatarColor,
        photoURL: finalPhotoUrl
      });
      
      window.dispatchEvent(new CustomEvent('profileUpdated', { detail: stats }));
      
      if (authMethod === 'email') {
        auth.languageCode = locale === 'ru' ? 'ru' : 'en';
        await sendEmailVerification(userObj).catch(e => console.error(e));
      }

      setShowRegSuccess(true);
    } catch (err) {
      console.error(err);
      setError(getFriendlyErrorMessage(err.code));
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    
    if (isLogin) {
      setLoading(true);
      try {
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/dashboard');
      } catch (err) {
        console.error(err);
        setError(getFriendlyErrorMessage(err.code));
        setLoading(false);
      }
      return;
    }

    if (authMethod !== 'email') {
      if (!username.trim()) {
        setError(locale === 'ru' ? 'Введите никнейм' : 'Enter username');
        return;
      }
      if (!agreed) {
        setError(locale === 'ru' ? 'Вы должны согласиться с политиками' : 'You must agree to the policies');
        return;
      }
    }

    // Email Registration Final Submit
    setLoading(true);
    try {
      let userObj = providerUser;
      if (authMethod === 'email') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        userObj = userCredential.user;
      }
      if (authMethod !== 'email' && providerUser) {
        await finishRegistration(providerUser);
        return;
      }
      await finishRegistration(userObj);
    } catch (err) {
      console.error(err);
      setError(getFriendlyErrorMessage(err.code));
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const { isNewUser } = getAdditionalUserInfo(result);
      
      if (isNewUser) {
        setProviderUser(result.user);
        setAuthMethod('google');
        
        const nameParts = (result.user.displayName || '').split(' ');
        setFirstName(nameParts[0] || '');
        setLastName(nameParts.slice(1).join(' ') || '');
        setEmail(result.user.email || '');
        
        setStep(4); 
        setLoading(false);
      } else {
        const userDoc = await getDoc(doc(db, 'users', result.user.uid));
        if (!userDoc.exists()) {
          setProviderUser(result.user);
          setAuthMethod('google');
          const nameParts = (result.user.displayName || '').split(' ');
          setFirstName(nameParts[0] || '');
          setLastName(nameParts.slice(1).join(' ') || '');
          setEmail(result.user.email || '');
          setStep(4);
          setLoading(false);
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      console.error(err);
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setError(getFriendlyErrorMessage(err.code));
      }
      setLoading(false);
    }
  };

  const handleGithubAuth = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GithubAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const { isNewUser } = getAdditionalUserInfo(result);
      
      if (isNewUser) {
        setProviderUser(result.user);
        setAuthMethod('github');
        
        const nameParts = (result.user.displayName || '').split(' ');
        setFirstName(nameParts[0] || '');
        setLastName(nameParts.slice(1).join(' ') || '');
        setEmail(result.user.email || '');
        
        setStep(4); 
        setLoading(false);
      } else {
        const userDoc = await getDoc(doc(db, 'users', result.user.uid));
        if (!userDoc.exists()) {
          setProviderUser(result.user);
          setAuthMethod('github');
          const nameParts = (result.user.displayName || '').split(' ');
          setFirstName(nameParts[0] || '');
          setLastName(nameParts.slice(1).join(' ') || '');
          setEmail(result.user.email || '');
          setStep(4);
          setLoading(false);
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      console.error(err);
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setError(getFriendlyErrorMessage(err.code));
      }
      setLoading(false);
    }
  };



  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetError('');
    if (!resetEmail) {
      setResetError(locale === 'ru' ? 'Введите email' : 'Enter email');
      return;
    }
    setResetLoading(true);
    try {
      auth.languageCode = locale === 'ru' ? 'ru' : 'en';
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSuccess(true);
    } catch (err) {
      setResetError(getFriendlyErrorMessage(err.code));
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-background p-6 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <motion.div 
          variants={floatVariants}
          animate="animate"
          className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/20 blur-[100px] rounded-full"
        />
        <motion.div 
          variants={floatVariants}
          animate="animate"
          style={{ animationDelay: '-2s' }}
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/20 blur-[100px] rounded-full"
        />
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 25, stiffness: 100 }}
        className="w-full max-w-md bg-on-surface dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-2xl glass-card z-10"
      >
        
        <div className="flex items-center justify-center mb-8">
          <Link to="/">
            <Logo variant="full" className="h-8" />
          </Link>
        </div>
        
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-on-surface mb-2">{title}</h2>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-8">{subtitle}</p>
        
        <form onSubmit={isLogin ? handleSubmit : (e) => e.preventDefault()} className="space-y-5">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200 overflow-hidden"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
          
          {isLogin ? (
            <>
              <div>
                <label test-id="email-label" htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('auth.emailLabel')}</label>
                <input type="email" id="email" required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-on-surface dark:bg-black text-gray-900 dark:text-on-surface focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="you@example.com" />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('auth.passwordLabel')}</label>
                  <button 
                    type="button" 
                    onClick={() => setShowResetModal(true)}
                    className="text-xs font-medium text-blue-600 hover:text-blue-500 transition-colors"
                  >
                    {t('auth.forgotPassword')}
                  </button>
                </div>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"}
                    id="password" required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-on-surface dark:bg-black text-gray-900 dark:text-on-surface focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-12"
                    placeholder="••••••••" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3.5 px-4 bg-primary hover:bg-primary/90 text-on-primary rounded-xl font-bold transition-all shadow-lg shadow-primary/30 hover:shadow-primary/40 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none flex justify-center items-center h-[52px]"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('auth.signIn')}
              </button>

              <div className="flex items-center my-6">
                <div className="flex-1 border-t border-gray-300 dark:border-gray-700"></div>
                <span className="px-4 text-xs text-gray-500 uppercase tracking-widest">{locale === 'ru' ? 'Или' : 'Or'}</span>
                <div className="flex-1 border-t border-gray-300 dark:border-gray-700"></div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={loading}
                  className="w-full py-3.5 px-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-medium transition-all shadow-sm active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none flex justify-center items-center gap-3 h-[52px]"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      {locale === 'ru' ? 'Войти через Google' : 'Continue with Google'}
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleGithubAuth}
                  disabled={loading}
                  className="w-full py-3.5 px-4 bg-gray-900 hover:bg-black dark:bg-gray-800 dark:hover:bg-gray-700 text-white rounded-xl font-medium transition-all shadow-sm active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none flex justify-center items-center gap-3 h-[52px]"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                      </svg>
                      {locale === 'ru' ? 'Войти через GitHub' : 'Continue with GitHub'}
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            // REGISTRATION WIZARD
            <div className="space-y-4">
              {/* Progress Steps */}
              <div className="flex items-center justify-between mb-6">
                {[1, 2, 3, 4].map(s => (
                  <div key={s} className={`h-2 flex-1 mx-1 rounded-full ${s <= step ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-800'} transition-colors duration-300`} />
                ))}
              </div>

              {step === 1 && (
                <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.profile.firstName')}</label>
                    <input type="text" id="firstName" 
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-on-surface dark:bg-black text-gray-900 dark:text-on-surface focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder={locale === 'ru' ? 'Иван' : 'John'} 
                      onKeyDown={(e) => e.key === 'Enter' && handleNextStep()}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.profile.lastName')}</label>
                    <input type="text" id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-on-surface dark:bg-black text-gray-900 dark:text-on-surface focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder={locale === 'ru' ? 'Иванов' : 'Doe'} 
                      onKeyDown={(e) => e.key === 'Enter' && handleNextStep()}
                    />
                  </div>
                  
                  <button 
                    type="button" 
                    onClick={handleNextStep}
                    className="w-full py-3.5 px-4 bg-primary hover:bg-primary/90 text-on-primary rounded-xl font-bold transition-all shadow-lg shadow-primary/30 active:scale-[0.98] flex justify-center items-center h-[52px] mt-4"
                  >
                    {locale === 'ru' ? 'Далее' : 'Next'} <ArrowRight className="w-5 h-5 ml-2" />
                  </button>

                  <div className="flex items-center my-6">
                    <div className="flex-1 border-t border-gray-300 dark:border-gray-700"></div>
                    <span className="px-4 text-xs text-gray-500 uppercase tracking-widest">{locale === 'ru' ? 'Или' : 'Or'}</span>
                    <div className="flex-1 border-t border-gray-300 dark:border-gray-700"></div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={handleGoogleAuth}
                      disabled={loading}
                      className="w-full py-3.5 px-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-medium transition-all shadow-sm active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none flex justify-center items-center gap-3 h-[52px]"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                        <>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                          </svg>
                          {locale === 'ru' ? 'Продолжить с Google' : 'Continue with Google'}
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleGithubAuth}
                      disabled={loading}
                      className="w-full py-3.5 px-4 bg-gray-900 hover:bg-black dark:bg-gray-800 dark:hover:bg-gray-700 text-white rounded-xl font-medium transition-all shadow-sm active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none flex justify-center items-center gap-3 h-[52px]"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                        <>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                          </svg>
                          {locale === 'ru' ? 'Продолжить с GitHub' : 'Continue with GitHub'}
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
                  <div>
                    <label test-id="email-label" htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('auth.emailLabel')}</label>
                    <input type="email" id="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-on-surface dark:bg-black text-gray-900 dark:text-on-surface focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="you@example.com" 
                      onKeyDown={(e) => e.key === 'Enter' && handleNextStep()}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.profile.username')}</label>
                    <input type="text" id="username" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-on-surface dark:bg-black text-gray-900 dark:text-on-surface focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="ivan_cool" 
                      onKeyDown={(e) => e.key === 'Enter' && handleNextStep()}
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setStep(1)} className="py-3.5 px-4 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-all active:scale-[0.98]">
                      {locale === 'ru' ? 'Назад' : 'Back'}
                    </button>
                    <button type="button" onClick={handleNextStep} className="flex-1 py-3.5 px-4 bg-primary hover:bg-primary/90 text-on-primary rounded-xl font-bold transition-all shadow-lg active:scale-[0.98] flex justify-center items-center">
                      {locale === 'ru' ? 'Далее' : 'Next'} <ArrowRight className="w-5 h-5 ml-2" />
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('auth.passwordLabel')}</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"}
                        id="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-on-surface dark:bg-black text-gray-900 dark:text-on-surface focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-12"
                        placeholder="••••••••" 
                        autoFocus
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{locale === 'ru' ? 'Повторите пароль' : 'Confirm Password'}</label>
                    <div className="relative">
                      <input 
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-on-surface dark:bg-black text-gray-900 dark:text-on-surface focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-12"
                        placeholder="••••••••" 
                        onKeyDown={(e) => e.key === 'Enter' && handleNextStep()}
                      />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 mt-4">
                    <input type="checkbox" id="terms" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary dark:border-gray-600 dark:bg-gray-800" />
                    <label htmlFor="terms" className="text-xs text-gray-600 dark:text-gray-400 leading-tight">
                      {locale === 'ru' ? 'Создавая аккаунт, вы соглашаетесь с нашими ' : 'By creating an account, you agree to our '}
                      <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveModal('terms'); }} className="text-blue-600 hover:underline">{locale === 'ru' ? 'Условиями обслуживания' : 'Terms of Service'}</button>,{' '}
                      <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveModal('privacy'); }} className="text-blue-600 hover:underline">{locale === 'ru' ? 'Политикой конфиденциальности' : 'Privacy Policy'}</button>{locale === 'ru' ? ' и ' : ' and '}
                      <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveModal('cookie'); }} className="text-blue-600 hover:underline">{locale === 'ru' ? 'Политикой использования файлов cookie' : 'Cookie Policy'}</button>.
                    </label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setStep(2)} className="py-3.5 px-4 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-all active:scale-[0.98]">
                      {locale === 'ru' ? 'Назад' : 'Back'}
                    </button>
                    <button type="button" onClick={handleNextStep} className="flex-1 py-3.5 px-4 bg-primary hover:bg-primary/90 text-on-primary rounded-xl font-bold transition-all shadow-lg active:scale-[0.98] flex justify-center items-center">
                      {locale === 'ru' ? 'Далее' : 'Next'} <ArrowRight className="w-5 h-5 ml-2" />
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-6">
                  {/* Additional fields for Social Auth Users that skipped step 2 */}
                  {authMethod !== 'email' && (
                    <div className="space-y-4 mb-6">
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label htmlFor="firstNameSocial" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.profile.firstName')}</label>
                          <input type="text" id="firstNameSocial" 
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-on-surface dark:bg-black text-gray-900 dark:text-on-surface focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder={locale === 'ru' ? 'Иван' : 'John'} 
                          />
                        </div>
                        <div className="flex-1">
                          <label htmlFor="lastNameSocial" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.profile.lastName')}</label>
                          <input type="text" id="lastNameSocial" 
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-on-surface dark:bg-black text-gray-900 dark:text-on-surface focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder={locale === 'ru' ? 'Иванов' : 'Doe'} 
                          />
                        </div>
                      </div>
                      <div>
                      <label htmlFor="usernameSocial" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.profile.username')}</label>
                      <input type="text" id="usernameSocial" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-on-surface dark:bg-black text-gray-900 dark:text-on-surface focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="ivan_cool" 
                        autoFocus
                      />
                    </div>
                  </div>
                  )}

                  <div className="text-center">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{locale === 'ru' ? 'Настройте аватар' : 'Setup your avatar'}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">{locale === 'ru' ? 'Загрузите фото или выберите цвет для фона инициалов' : 'Upload a photo or pick a background color'}</p>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center mb-6">
                    <div className="relative group shrink-0">
                      <UserAvatar 
                        photoURL={avatarPreview}
                        firstName={firstName}
                        lastName={lastName}
                        email={email}
                        avatarColor={avatarColor}
                        className="w-24 h-24 text-3xl shadow-xl border border-gray-200 dark:border-gray-700"
                      />
                      <label className="absolute bottom-0 right-0 p-2 bg-primary text-on-primary rounded-full cursor-pointer hover:scale-105 transition-transform shadow-lg z-10" title="Upload Photo">
                        <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                        <Upload className="w-4 h-4" />
                      </label>
                    </div>
                  </div>

                  {!avatarFile && (
                    <div className="flex flex-wrap justify-center gap-3">
                      {AVATAR_COLORS.map((color, i) => (
                        <UserAvatar
                          key={i}
                          onClick={() => setAvatarColor(color)}
                          firstName={firstName}
                          lastName={lastName}
                          email={email}
                          avatarColor={color}
                          className={`w-10 h-10 text-xs sm:text-sm border-2 transition-transform hover:scale-110 ${avatarColor === color || (!avatarColor && i === 0) ? 'border-primary scale-110 shadow-md' : 'border-gray-200 dark:border-gray-700'}`}
                          title="Change avatar color"
                        />
                      ))}
                    </div>
                  )}

                  {authMethod !== 'email' && (
                    <div className="flex items-start gap-3 mt-8">
                      <input type="checkbox" id="termsSocial" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary dark:border-gray-600 dark:bg-gray-800" />
                      <label htmlFor="termsSocial" className="text-xs text-gray-600 dark:text-gray-400 leading-tight">
                        {locale === 'ru' ? 'Создавая аккаунт, вы соглашаетесь с нашими ' : 'By creating an account, you agree to our '}
                        <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveModal('terms'); }} className="text-blue-600 hover:underline">{locale === 'ru' ? 'Условиями обслуживания' : 'Terms of Service'}</button>,{' '}
                        <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveModal('privacy'); }} className="text-blue-600 hover:underline">{locale === 'ru' ? 'Политикой конфиденциальности' : 'Privacy Policy'}</button>{locale === 'ru' ? ' и ' : ' and '}
                        <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveModal('cookie'); }} className="text-blue-600 hover:underline">{locale === 'ru' ? 'Политикой использования файлов cookie' : 'Cookie Policy'}</button>.
                      </label>
                    </div>
                  )}

                  <div className="flex gap-3 pt-6">
                    {authMethod === 'email' && (
                      <button type="button" onClick={() => setStep(3)} className="py-3.5 px-4 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-all active:scale-[0.98]">
                        {locale === 'ru' ? 'Назад' : 'Back'}
                      </button>
                    )}
                    <button type="button" onClick={handleSubmit} disabled={loading || (authMethod !== 'email' && (!username.trim() || !agreed))} className="flex-1 py-3.5 px-4 bg-primary hover:bg-primary/90 text-on-primary rounded-xl font-bold transition-all shadow-lg active:scale-[0.98] flex justify-center items-center">
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (locale === 'ru' ? 'Завершить' : 'Finish')}
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </form>
        
        <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          {altText}{' '}
          <Link to={altLink} className="font-semibold text-primary hover:text-primary/80 transition-colors">
            {altLinkText}
          </Link>
        </p>
      </motion.div>

      {/* Success Modal */}
      <AnimatePresence>
        {showRegSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center relative border border-gray-200 dark:border-gray-800"
            >
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {locale === 'ru' ? 'Регистрация успешна!' : 'Registration successful!'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                {locale === 'ru' 
                  ? 'Мы отправили письмо с подтверждением на ваш email. Пожалуйста, проверьте почту и перейдите по ссылке.'
                  : 'We sent a verification email to your address. Please check your inbox and click the link.'}
              </p>
              <button 
                onClick={() => navigate('/dashboard')}
                className="w-full py-4 bg-primary hover:bg-primary/90 text-on-primary font-bold rounded-xl transition-all shadow-lg shadow-primary/30 active:scale-[0.98]"
              >
                {locale === 'ru' ? 'Перейти в платформу' : 'Go to platform'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Password Reset Modal */}
      <AnimatePresence>
        {showResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-md w-full shadow-2xl relative border border-gray-200 dark:border-gray-800"
            >
              <button 
                onClick={() => setShowResetModal(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6">
                <Mail className="w-6 h-6 text-blue-500" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('auth.resetTitle')}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('auth.resetSubtitle')}</p>
              
              {resetSuccess ? (
                <div className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 p-4 rounded-xl border border-green-200 dark:border-green-900/50 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-sm leading-relaxed">{t('settings.security.resetSent')} <strong>{resetEmail}</strong></p>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  {resetError && (
                    <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200">{resetError}</div>
                  )}
                  <div>
                    <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('auth.emailLabel')}</label>
                    <input type="email" id="resetEmail" required 
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-on-surface dark:bg-black text-gray-900 dark:text-on-surface focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="you@example.com" />
                  </div>
                  <button 
                    type="submit" 
                    disabled={resetLoading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-md active:scale-[0.98] disabled:opacity-70 flex justify-center items-center h-[50px]"
                  >
                    {resetLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('auth.resetButton')}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <LegalDocModal 
        isOpen={!!activeModal} 
        onClose={() => setActiveModal(null)} 
        docKey={activeModal || 'terms'} 
      />
      <ImageCropperModal
        isOpen={cropperOpen}
        onClose={() => { setCropperOpen(false); setRawImageSrc(null); }}
        imageSrc={rawImageSrc}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
}
