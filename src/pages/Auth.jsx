import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowLeft, Loader2 } from 'lucide-react';
import Logo from '../components/shared/Logo.jsx';
import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from '../firebase.js';
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

  const title = isLogin ? t('auth.welcomeBack') : t('auth.createAccount');
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
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        // Initialize user profile in Firestore
        await getUserStats(user.uid, { firstName, lastName, username, referredBy, email });
      }
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError(getFriendlyErrorMessage(err.code));
    } finally {
      setLoading(false);
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
                  placeholder="Иван" />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.profile.lastName')}</label>
                <input type="text" id="lastName" required={!isLogin}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-on-surface dark:bg-black text-gray-900 dark:text-on-surface focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Иванов" />
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
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('auth.passwordLabel')}</label>
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
