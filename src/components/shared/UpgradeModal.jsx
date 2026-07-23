import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, CheckCircle2 } from 'lucide-react';
import { PLAN_LIMITS } from '../../constants/planLimits.js';

export default function UpgradeModal({ isOpen, onClose, onUpgrade }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative bg-surface border border-outline-variant w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row z-10"
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-10 h-10 bg-black/20 hover:bg-black/40 rounded-full flex items-center justify-center text-on-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex-1 p-8 md:p-12 bg-gradient-to-br from-surface to-surface-container-high border-b md:border-b-0 md:border-r border-outline-variant relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-3xl font-black text-on-surface mb-2">Бесплатный план</h2>
              <p className="text-3xl font-black text-on-surface-variant mb-8">{PLAN_LIMITS.FREE.price}</p>
              
              <ul className="space-y-4 mb-8">
                {PLAN_LIMITS.FREE.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                    <span className="text-on-surface-variant text-lg leading-tight">{f}</span>
                  </li>
                ))}
              </ul>
              
              <button 
                onClick={onClose}
                className="w-full py-4 rounded-xl font-bold border-2 border-outline-variant text-on-surface hover:bg-surface-container transition-all"
              >
                Остаться на Free
              </button>
            </div>
          </div>

          <div className="flex-1 p-8 md:p-12 bg-gradient-to-br from-indigo-900 to-purple-900 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/20 blur-[100px] rounded-full" />
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-500 px-4 py-1.5 rounded-full font-black text-sm mb-6 border border-amber-500/50">
                <Crown className="w-4 h-4" />
                RECOMMENDED
              </div>
              <h2 className="text-3xl font-black text-on-surface mb-2">PRO План</h2>
              <p className="text-3xl font-black text-purple-300 mb-8">{PLAN_LIMITS.PRO.price}</p>
              
              <ul className="space-y-4 mb-8">
                {PLAN_LIMITS.PRO.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-amber-500 flex-shrink-0" />
                    <span className="text-on-surface text-lg leading-tight font-medium">{f}</span>
                  </li>
                ))}
              </ul>
              
              <button 
                onClick={onUpgrade}
                className="w-full py-4 rounded-xl font-black bg-gradient-to-r from-amber-400 to-orange-500 text-black hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_40px_-10px_rgba(245,158,11,0.5)]"
              >
                Перейти на PRO
              </button>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
