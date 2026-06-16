import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowLeft, Loader2 } from 'lucide-react';
import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from '../firebase.js';
import { getUserStats } from '../services/courseService.js';

function getFriendlyErrorMessage(code) {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please log in.';
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Invalid email or password.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/invalid-api-key':
      return 'Firebase API Key is missing or invalid. Check your .env file.';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is disabled. Please enable it in the Firebase Console.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

const floatVariants = {
  animate: {
    y: [0, -20, 0],
    transition: { duration: 5, repeat: Infinity, ease: 'easeInOut' }
  }
};

export default function Auth({ type }) {
  const isLogin = type === 'login';
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const title = isLogin ? 'Welcome back' : 'Create an account';
  const subtitle = isLogin ? 'Enter your details to access your dashboard.' : 'Sign up to start building your AI academy.';
  const submitText = isLogin ? 'Sign In' : 'Sign Up';
  const altText = isLogin ? "Don't have an account?" : "Already have an account?";
  const altLink = isLogin ? '/register' : '/login';
  const altLinkText = isLogin ? 'Sign up' : 'Log in';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        // Initialize user profile in Firestore
        await getUserStats(user.uid);
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
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-[#000000] p-6 relative overflow-hidden">
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
        className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-2xl glass-card z-10"
      >
        
        <div className="flex items-center gap-2 mb-8 justify-center font-semibold text-xl tracking-tight text-gray-900 dark:text-white">
          <Sparkles className="w-5 h-5 text-blue-500" />
          AI Learning Roadmap Platform — Project Hub
        </div>
        
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">{title}</h2>
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
          
          <div>
            <label test-id="email-label" htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email address</label>
            <input type="email" id="email" required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="you@example.com" />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <input type="password" id="password" required minLength="6"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="••••••••" />
          </div>
          
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit" disabled={loading}
            className="w-full py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black font-medium text-lg shadow-lg flex justify-center items-center gap-2 disabled:opacity-70"
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
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
