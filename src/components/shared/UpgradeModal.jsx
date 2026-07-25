import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, CheckCircle2, Copy, Share2 } from 'lucide-react';
import { PLAN_LIMITS } from '../../constants/planLimits.js';
import { auth } from '../../firebase.js';
import { getUserStats, getReferralsCount } from '../../services/courseService.js';

export default function UpgradeModal({ isOpen, onClose, onUpgrade }) {
  const [discountActive, setDiscountActive] = useState(false);
  const [referralLink, setReferralLink] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !auth.currentUser) return;
    
    const checkReferralStatus = async () => {
      try {
        const uid = auth.currentUser.uid;
        const [stats, count] = await Promise.all([
          getUserStats(uid),
          getReferralsCount(uid)
        ]);
        
        setReferralLink(`${window.location.origin}/register?ref=${stats.referralCode || uid}`);
        if (stats.referredBy || count > 0) {
          setDiscountActive(true);
        }
      } catch (e) {
        console.error('Error fetching referral status:', e);
      }
    };
    
    checkReferralStatus();
  }, [isOpen]);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
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
          className="relative bg-surface border border-outline-variant w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-y-auto flex flex-col md:flex-row z-10"
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
              {discountActive ? (
                <div className="mb-8">
                  <div className="flex items-end gap-3">
                    <p className="text-3xl font-black text-purple-300">
                      {PLAN_LIMITS.PRO.priceNumeric * 0.9} ₽ <span className="text-xl font-bold">/ месяц</span>
                    </p>
                    <p className="text-xl text-on-surface-variant line-through mb-1 font-bold">
                      {PLAN_LIMITS.PRO.priceNumeric} ₽
                    </p>
                  </div>
                  <div className="inline-block mt-2 bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg text-sm font-bold border border-emerald-500/30">
                    Скидка 10% на первый месяц! 🎉
                  </div>
                </div>
              ) : (
                <p className="text-3xl font-black text-purple-300 mb-8">{PLAN_LIMITS.PRO.price}</p>
              )}
              
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

              {/* Реферальная программа */}
              <div className="mt-8 p-6 bg-surface-container/50 rounded-2xl border border-outline-variant/30 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Share2 className="w-5 h-5 text-amber-500" />
                  <h3 className="text-lg font-bold text-on-surface">Пригласи друга - получи скидку!</h3>
                </div>
                <p className="text-on-surface-variant text-sm leading-relaxed mb-4">
                  Отправь эту ссылку другу. Когда он зарегистрируется, вы <strong className="text-amber-500">оба получите скидку 10%</strong> на первый месяц подписки PRO.
                </p>
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={referralLink} 
                    className="flex-1 bg-surface border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface font-medium outline-none truncate"
                    placeholder="Загрузка ссылки..."
                  />
                  <button 
                    onClick={handleCopy}
                    disabled={!referralLink}
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Скопировано' : 'Копировать'}
                  </button>
                </div>
              </div>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
