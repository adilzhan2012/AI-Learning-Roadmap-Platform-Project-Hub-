import React from 'react';
import { motion } from 'framer-motion';
import { Compass, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { t } from '../i18n.js';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-full bg-background text-on-surface p-4 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="relative w-32 h-32 mb-8 text-primary"
      >
        <Compass className="w-full h-full opacity-20" />
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Compass className="w-24 h-24 text-primary drop-shadow-[0_0_15px_rgba(var(--color-primary),0.5)]" />
        </motion.div>
      </motion.div>
      
      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-6xl font-bold mb-4 tracking-tighter"
      >
        404
      </motion.h1>
      
      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-xl text-on-surface-variant mb-8 max-w-md"
      >
        Oops! Looks like you've ventured off the roadmap. This learning path doesn't exist yet.
      </motion.p>
      
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/95 transition-all"
      >
        <ArrowLeft className="w-5 h-5" />
        Return to Dashboard
      </motion.button>
    </div>
  );
}
