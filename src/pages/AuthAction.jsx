import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, XCircle, ArrowLeft, Lock } from 'lucide-react';
import { auth } from '../firebase.js';
import { confirmPasswordReset, applyActionCode, verifyPasswordResetCode } from 'firebase/auth';
import Logo from '../components/shared/Logo.jsx';
import { useLocale } from '../i18n.js';

export default function AuthAction() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const locale = useLocale();
  
  const mode = searchParams.get('mode');
  const actionCode = searchParams.get('oobCode');
  
  // States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [validCode, setValidCode] = useState(false);
  
  // Password Reset States
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    if (!mode || !actionCode) {
      setError(locale === 'ru' ? 'Неверная ссылка.' : 'Invalid link.');
      setLoading(false);
      return;
    }

    const handleVerifyEmail = async () => {
      try {
        await applyActionCode(auth, actionCode);
        setSuccess(true);
      } catch (err) {
        console.error(err);
        setError(locale === 'ru' ? 'Ссылка устарела или уже использована.' : 'The link is expired or already used.');
      } finally {
        setLoading(false);
      }
    };

    const handleResetPassword = async () => {
      try {
        const email = await verifyPasswordResetCode(auth, actionCode);
        setUserEmail(email);
        setValidCode(true);
      } catch (err) {
        console.error(err);
        setError(locale === 'ru' ? 'Ссылка для сброса пароля устарела или недействительна.' : 'The password reset link is expired or invalid.');
      } finally {
        setLoading(false);
      }
    };

    if (mode === 'verifyEmail') {
      handleVerifyEmail();
    } else if (mode === 'resetPassword') {
      handleResetPassword();
    } else {
      setError(locale === 'ru' ? 'Неизвестное действие.' : 'Unknown action.');
      setLoading(false);
    }
  }, [mode, actionCode, locale]);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError(locale === 'ru' ? 'Пароль должен содержать минимум 6 символов.' : 'Password must be at least 6 characters.');
      return;
    }
    
    setError(null);
    setIsSubmitting(true);
    
    try {
      await confirmPasswordReset(auth, actionCode, newPassword);
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError(locale === 'ru' ? 'Произошла ошибка при сохранении пароля.' : 'An error occurred while changing the password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-10">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {locale === 'ru' ? 'Проверка ссылки...' : 'Verifying link...'}
          </p>
        </div>
      );
    }

    if (error && !success) {
      return (
        <div className="flex flex-col items-center text-center py-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mb-6">
            <XCircle className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {locale === 'ru' ? 'Ошибка' : 'Error'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            {error}
          </p>
          <Link to="/login" className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg transition-colors inline-block">
            {locale === 'ru' ? 'Вернуться ко входу' : 'Back to Login'}
          </Link>
        </div>
      );
    }

    if (mode === 'verifyEmail' && success) {
      return (
        <div className="flex flex-col items-center text-center py-6">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mb-6">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {locale === 'ru' ? 'Email подтвержден!' : 'Email Verified!'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            {locale === 'ru' ? 'Ваш адрес электронной почты успешно подтвержден. Теперь вы можете использовать все функции платформы.' : 'Your email address has been successfully verified. You can now use all platform features.'}
          </p>
          <Link to="/dashboard" className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg transition-colors inline-block">
            {locale === 'ru' ? 'Перейти в Dashboard' : 'Go to Dashboard'}
          </Link>
        </div>
      );
    }

    if (mode === 'resetPassword') {
      if (success) {
        return (
          <div className="flex flex-col items-center text-center py-6">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mb-6">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {locale === 'ru' ? 'Пароль изменен!' : 'Password Changed!'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              {locale === 'ru' ? 'Вы можете войти в аккаунт, используя ваш новый пароль.' : 'You can now log in using your new password.'}
            </p>
            <Link to="/login" className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg transition-colors inline-block">
              {locale === 'ru' ? 'Войти' : 'Log In'}
            </Link>
          </div>
        );
      }

      if (validCode) {
        return (
          <div className="py-2">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
              {locale === 'ru' ? 'Новый пароль' : 'New Password'}
            </h3>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
              {locale === 'ru' ? `Для аккаунта ${userEmail}` : `For account ${userEmail}`}
            </p>
            
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200 text-center">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {locale === 'ru' ? 'Введите новый пароль' : 'Enter new password'}
                </label>
                <input 
                  type="password" 
                  required 
                  minLength="6"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="••••••••" 
                />
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg flex justify-center items-center gap-2 disabled:opacity-70 transition-colors mt-2"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (locale === 'ru' ? 'Сохранить пароль' : 'Save Password')}
              </button>
            </form>
          </div>
        );
      }
    }

    return null;
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-background p-6 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <motion.div 
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/20 blur-[100px] rounded-full"
        />
        <motion.div 
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/20 blur-[100px] rounded-full"
        />
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 25, stiffness: 100 }}
        className="w-full max-w-md bg-white dark:bg-[#18181B] border border-gray-200 dark:border-white/10 rounded-3xl p-8 shadow-2xl z-10 relative"
      >
        <div className="flex items-center justify-center mb-8">
          <Link to="/">
            <Logo variant="full" className="h-8" />
          </Link>
        </div>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={loading ? 'loading' : mode + success}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>

        {!success && !loading && (
          <p className="mt-8 flex justify-center">
            <Link to="/login" className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> {locale === 'ru' ? 'Вернуться ко входу' : 'Back to Login'}
            </Link>
          </p>
        )}
      </motion.div>
    </div>
  );
}
