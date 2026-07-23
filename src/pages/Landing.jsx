import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Activity, Terminal } from 'lucide-react';
import Logo from '../components/shared/Logo.jsx';
import { auth } from '../firebase.js';

const floatVariants = {
  animate: {
    y: [0, -20, 0],
    transition: {
      duration: 5,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
};

const fadeUpVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: 'spring', damping: 25, stiffness: 100 }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

export default function Landing() {
  const isLoggedIn = !!auth.currentUser;

  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans overflow-x-hidden selection:bg-blue-900 w-full relative">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div 
          variants={floatVariants}
          animate="animate"
          className="absolute top-[20%] left-[20%] w-[600px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full mix-blend-screen"
        />
        <motion.div 
          variants={floatVariants}
          animate="animate"
          style={{ animationDelay: '-2s' }}
          className="absolute top-[40%] right-[10%] w-[500px] h-[500px] bg-indigo-500/10 blur-[100px] rounded-full mix-blend-screen"
        />
      </div>

      {/* Minimal Nav */}
      <motion.nav 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="fixed top-0 w-full z-50 bg-black/40 backdrop-blur-xl border-b border-white/10 transition-all duration-300"
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/">
            <Logo variant="full" className="h-8" />
          </Link>
          <div>
            {isLoggedIn ? (
              <Link to="/dashboard">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-sm font-medium bg-on-surface text-black px-4 py-2 rounded-full inline-block shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                >
                  Go to Dashboard
                </motion.button>
              </Link>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className="text-sm font-medium text-neutral-300 hover:text-on-surface transition-colors">Log in</Link>
                <Link to="/register">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="text-sm font-medium bg-on-surface text-black px-4 py-2 rounded-full inline-block shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                  >
                    Sign up
                  </motion.button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </motion.nav>

      {/* Hero Interactive Dashboard Wrapper */}
      <main className="relative pt-32 pb-20 md:pt-40 md:pb-32 px-6 flex flex-col items-center justify-center text-center z-10 min-h-screen">
        
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="max-w-7xl mx-auto w-full flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16 text-left"
        >
          {/* Left Text & Action Area */}
          <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left">
            <motion.h1 variants={fadeUpVariants} className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
                yourway.co
              </span>
            </motion.h1>
            <motion.p variants={fadeUpVariants} className="text-xl md:text-2xl text-neutral-400 max-w-2xl mb-10 font-light">
              An intelligent, immersive environment to track, learn, and master your technical roadmap.
            </motion.p>
            
            <motion.div variants={fadeUpVariants} className="flex flex-col sm:flex-row items-center gap-4 mb-8">
              {isLoggedIn ? (
                <Link to="/dashboard">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 rounded-full bg-on-surface text-black font-semibold text-lg shadow-[0_0_30px_rgba(255,255,255,0.15)] flex items-center gap-2"
                  >
                    Enter Workspace <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </Link>
              ) : (
                <Link to="/register">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 rounded-full bg-on-surface text-black font-semibold text-lg shadow-[0_0_30px_rgba(255,255,255,0.15)] flex items-center gap-2"
                  >
                    Start Learning Now <Activity className="w-5 h-5" />
                  </motion.button>
                </Link>
              )}
            </motion.div>
          </div>

          {/* Right Square Hero PNG Logo Container */}
          <motion.div 
            variants={fadeUpVariants}
            className="w-72 h-72 sm:w-80 sm:h-80 md:w-[380px] md:h-[380px] lg:w-[420px] lg:h-[420px] aspect-square flex-shrink-0 flex items-center justify-center"
          >
            <img 
              src="/logo-icon-dark.png" 
              alt="yourway.co Logo" 
              className="w-full h-full object-contain object-center" 
            />
          </motion.div>

          {/* Interactive Glassmorphism Dashboard Preview */}
          <motion.div 
            variants={fadeUpVariants}
            className="relative w-full aspect-video rounded-[2.5rem] overflow-hidden bg-on-surface/5 backdrop-blur-xl border border-white/10 shadow-2xl group cursor-pointer"
            whileHover={{ scale: 1.02, borderColor: 'rgba(255,255,255,0.2)' }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            {/* Mock Dashboard UI Inside */}
            <div className="absolute inset-4 rounded-[1.5rem] bg-black/40 border border-white/5 flex flex-col overflow-hidden">
              <div className="h-12 border-b border-white/5 flex items-center px-6 gap-4">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                </div>
                <div className="flex-1 h-6 bg-on-surface/5 rounded-full flex items-center justify-center">
                  <span className="text-xs text-neutral-500 font-mono tracking-wider">platform.projecthub.ai</span>
                </div>
              </div>
              <div className="flex-1 p-8 flex items-center justify-center">
                <div className="text-center">
                   <motion.div 
                     animate={{ rotate: 360 }} 
                     transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                     className="inline-block mb-4"
                   >
                     <Terminal className="w-16 h-16 text-on-surface/20 group-hover:text-on-surface/40 transition-colors duration-500" />
                   </motion.div>
                   <p className="text-neutral-500 font-medium tracking-wide uppercase text-sm">Interactive Knowledge Graph Interface</p>
                </div>
              </div>
            </div>
            
            {/* Click overlay to redirect */}
            <Link to={isLoggedIn ? "/dashboard" : "/register"} className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20 backdrop-blur-sm">
              <motion.span 
                initial={{ y: 20 }}
                whileInView={{ y: 0 }}
                className="px-6 py-3 rounded-full bg-on-surface text-black font-semibold shadow-xl flex items-center gap-2"
              >
                Launch Environment <ArrowRight className="w-4 h-4" />
              </motion.span>
            </Link>
          </motion.div>

        </motion.div>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6 bg-black/50 backdrop-blur-md relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 font-semibold text-lg tracking-tight text-on-surface/80">
            <Sparkles className="w-5 h-5 text-on-surface/80" />
            yourway.co
          </div>
          <div className="text-sm text-neutral-500 font-medium">
            &copy; 2026 yourway.co. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
