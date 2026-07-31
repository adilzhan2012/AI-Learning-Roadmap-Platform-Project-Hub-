import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowLeft, Loader2, Mail, CheckCircle2, X } from 'lucide-react';
import Logo from '../components/shared/Logo.jsx';
import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from '../firebase.js';
import { sendEmailVerification, updateProfile, sendPasswordResetEmail, onAuthStateChanged } from 'firebase/auth';
import { getUserStats } from '../services/courseService.js';
import { t, useLocale } from '../i18n.js';
import LegalDocModal from '../components/shared/LegalDocModal.jsx';

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
      return t('auth.error.default');
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

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'terms' | 'privacy' | 'cookie' | null

  // UI States for Modals
  const [showRegSuccess, setShowRegSuccess] = useState(false);
  
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && !loading && !showRegSuccess) {
        navigate('/dashboard');
      }
    });
    return () => unsubscribe();
  }, [loading, showRegSuccess, navigate]);

  // Password Reset States
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return locale === 'ru' ? 'Доброе утро, приступим?' : "Good morning, let's start";
    if (hour >= 12 && hour < 18) return locale === 'ru' ? 'Добрый день, приступим?' : "Good afternoon, let's start";
    if (hour >= 18 && hour < 23) return locale === 'ru' ? 'Добрый вечер, приступим?' : "Good evening, let's start";
    return locale === 'ru' ? 'Доброй ночи, приступим?' : "Good night, let's start";
  };

  const title = isLogin ? getGreeting() : t('auth.createAccount');
  const subtitle = isLogin ? t('auth.loginSubtitle') : t('auth.registerSubtitle');
  const submitText = isLogin ? t('auth.signIn') : t('auth.signUp');
  const altText = isLogin ? t('auth.noAccount') : t('auth.haveAccount');
  const altLink = isLogin ? '/register' : '/login';
  const altLinkText = isLogin ? t('auth.signUp') : t('auth.signIn');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!isLogin && !agreed) {
      setError(locale === 'ru' ? 'Вы должны согласиться с политиками для продолжения.' : 'You must agree to the policies to continue.');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/dashboard');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Immediately update Firebase profile so UI doesn't show "Learner" and "L"
        await updateProfile(user, { displayName: firstName.trim() });
        
        // Initialize user profile in Firestore
        await getUserStats(user.uid, { firstName, lastName, username, referredBy, email });
        
        // Автоматически отправляем письмо для подтверждения
        try {
          auth.languageCode = locale === 'ru' ? 'ru' : 'en';
          await sendEmailVerification(user);
        } catch (e) {
          console.error("Ошибка при отправке письма подтверждения:", e);
        }
        
        // Показываем красивое модальное окно вместо alert
        setShowRegSuccess(true);
      }
    } catch (err) {
      console.error(err);
      setError(getFriendlyErrorMessage(err.code));
    } finally {
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
        
        <form onSubmit={handleSubmit} className="space-y-5">
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
          
          {!isLogin && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.profile.firstName')}</label>
                <input type="text" id="firstName" required={!isLogin}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-on-surface dark:bg-black text-gray-900 dark:text-on-surface focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder={locale === 'ru' ? 'Иван' : 'John'} />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.profile.lastName')}</label>
                <input type="text" id="lastName" required={!isLogin}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-on-surface dark:bg-black text-gray-900 dark:text-on-surface focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder={locale === 'ru' ? 'Иванов' : 'Doe'} />
              </div>
            </div>
          )}
          
          {!isLogin && (
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.profile.username')}</label>
              <input type="text" id="username" required={!isLogin}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-on-surface dark:bg-black text-gray-900 dark:text-on-surface focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="ivan_cool" />
            </div>
          )}

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
              {isLogin && (
                <button 
                  type="button" 
                  onClick={() => setShowResetModal(true)}
                  className="text-xs font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  {locale === 'ru' ? 'Забыли пароль?' : 'Forgot password?'}
                </button>
              )}
            </div>
            <input type="password" id="password" required minLength="6"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-on-surface dark:bg-black text-gray-900 dark:text-on-surface focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="••••••••" />
          </div>
          
          {!isLogin && (
            <div className="flex items-start gap-2.5 mt-2">
              <input 
                type="checkbox" 
                id="agreePolicies" 
                required 
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500 bg-on-surface dark:bg-black cursor-pointer"
              />
              <label htmlFor="agreePolicies" className="text-xs text-gray-500 dark:text-gray-400 leading-normal select-none">
                {locale === 'ru' ? (
                  <>
                    Я соглашаюсь с{' '}
                    <button type="button" onClick={() => setActiveModal('terms')} className="text-blue-600 hover:text-blue-500 underline font-medium">
                      Условиями использования
                    </button>
                    ,{' '}
                    <button type="button" onClick={() => setActiveModal('privacy')} className="text-blue-600 hover:text-blue-500 underline font-medium">
                      Политикой конфиденциальности
                    </button>{' '}
                    и{' '}
                    <button type="button" onClick={() => setActiveModal('cookie')} className="text-blue-600 hover:text-blue-500 underline font-medium">
                      Политикой Cookie
                    </button>
                    .
                  </>
                ) : (
                  <>
                    I agree to the{' '}
                    <button type="button" onClick={() => setActiveModal('terms')} className="text-blue-600 hover:text-blue-500 underline font-medium">
                      Terms of Service
                    </button>
                    ,{' '}
                    <button type="button" onClick={() => setActiveModal('privacy')} className="text-blue-600 hover:text-blue-500 underline font-medium">
                      Privacy Policy
                    </button>{' '}
                    and{' '}
                    <button type="button" onClick={() => setActiveModal('cookie')} className="text-blue-600 hover:text-blue-500 underline font-medium">
                      Cookie Policy
                    </button>
                    .
                  </>
                )}
              </label>
            </div>
          )}
          
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit" disabled={loading || (!isLogin && !agreed)}
            className="w-full py-3 rounded-xl bg-black dark:bg-on-surface text-on-surface dark:text-black font-medium text-lg shadow-lg flex justify-center items-center gap-2 disabled:opacity-70"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : submitText}
          </motion.button>
        </form>
        
        <p className="mt-8 text-center text-gray-600 dark:text-gray-400">
          {altText} <Link to={altLink} className="text-blue-600 hover:text-blue-500 font-medium ml-1">{altLinkText}</Link>
        </p>
        <p className="mt-4 flex justify-center">
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-on-surface transition-colors flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> {t('auth.backHome')}
          </Link>
        </p>
        
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800 text-center">
          <div className="text-[10px] uppercase tracking-widest font-mono text-gray-400 dark:text-gray-500">
            Designed & Developed by<br/>Ivakin Daniil & Dutpayev Adilzhan
          </div>
        </div>
      </motion.div>

      {/* Registration Success Modal */}
      <AnimatePresence>
        {showRegSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => {}}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-[#18181B] border border-gray-200 dark:border-white/10 rounded-3xl p-8 w-full max-w-sm shadow-2xl flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6">
                <Mail className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {locale === 'ru' ? 'Добро пожаловать!' : 'Welcome!'}
              </h3>
              <p className="text-gray-600 dark:text-zinc-400 mb-8 leading-relaxed">
                {locale === 'ru' 
                  ? 'Ваш аккаунт успешно создан. Мы отправили письмо на вашу почту для её подтверждения. Пожалуйста, проверьте папку "Входящие" и "Спам".'
                  : 'Your account has been created successfully. We have sent a verification link to your email. Please check your inbox and spam folder.'}
              </p>
              <button 
                onClick={() => {
                  setShowRegSuccess(false);
                  navigate('/dashboard');
                }}
                className="w-full py-3.5 rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                {locale === 'ru' ? 'Перейти в Dashboard' : 'Go to Dashboard'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Password Reset Modal */}
      <AnimatePresence>
        {showResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowResetModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-[#18181B] border border-gray-200 dark:border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {locale === 'ru' ? 'Восстановление пароля' : 'Reset Password'}
                </h3>
                <button 
                  onClick={() => setShowResetModal(false)} 
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {resetSuccess ? (
                <div className="flex flex-col items-center text-center py-4">
                  <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {locale === 'ru' ? 'Письмо отправлено!' : 'Email Sent!'}
                  </h4>
                  <p className="text-gray-600 dark:text-zinc-400 text-sm mb-6">
                    {locale === 'ru' 
                      ? 'Инструкция по сбросу пароля отправлена на указанный email. Проверьте папку "Спам", если письмо не пришло.' 
                      : 'Password reset instructions have been sent to your email. Check your spam folder if you don\'t see it.'}
                  </p>
                  <button 
                    onClick={() => setShowResetModal(false)}
                    className="w-full py-3 rounded-xl font-medium bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-900 dark:text-white transition-colors"
                  >
                    {locale === 'ru' ? 'Закрыть' : 'Close'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  {resetError && (
                    <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200">
                      {resetError}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                      {t('auth.emailLabel')}
                    </label>
                    <input 
                      type="email" 
                      required 
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="you@example.com" 
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={resetLoading}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg flex justify-center items-center gap-2 disabled:opacity-70 transition-colors mt-2"
                  >
                    {resetLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (locale === 'ru' ? 'Сбросить пароль' : 'Reset Password')}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
