import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function XPToast({ amount, reason }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className="bg-indigo-600 text-on-surface px-4 py-3 rounded-2xl shadow-xl shadow-indigo-500/20 flex items-center gap-3 backdrop-blur-md border border-indigo-400/30"
    >
      <div className="bg-on-surface/20 p-1.5 rounded-full">
        <Sparkles className="w-5 h-5 text-indigo-100" />
      </div>
      <div>
        <p className="font-black text-lg leading-tight">+{amount} XP</p>
        {reason && <p className="text-xs font-medium text-indigo-100/90">{reason}</p>}
      </div>
    </motion.div>
  );
}
