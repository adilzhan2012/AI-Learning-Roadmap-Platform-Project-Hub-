import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, CheckCircle2, Copy, Share2, Check } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { auth, functions } from '../../firebase.js';
import { getUserStats, getReferralsCount } from '../../services/courseService.js';
import { useLocale, t } from '../../i18n.js';
import { useNavigate } from 'react-router-dom';
import { usePlanLimits } from '../../hooks/usePlanLimits.js';

export default function UpgradeModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { plan } = usePlanLimits();
  const locale = useLocale();
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [discountActive, setDiscountActive] = useState(false);
  const [referralLink, setReferralLink] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !auth.currentUser) return;
    
    const checkReferralStatus = async () => {
      try {
        const uid = auth.currentUser.uid;
        
        // 1. Primary: Server-side check
        try {
          const getStatusFn = httpsCallable(functions, 'getReferralDiscountStatus');
          const res = await getStatusFn();
          if (res && res.data) {
            setDiscountActive(res.data.isEligible === true);
          }
        } catch (fnErr) {
          console.warn('[UpgradeModal] Server check fallback:', fnErr);
        }

        // 2. Fetch stats for link construction and fallback
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

  // Handle ESC and safe body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelectPlan = () => {
    onClose();
    navigate('/pricing');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm" 
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-background border border-outline-variant w-full max-w-6xl max-h-[90vh] rounded-[2rem] shadow-2xl overflow-y-auto flex flex-col z-10 p-5 sm:p-6 md:p-8 lg:p-10"
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-10 h-10 bg-surface-container hover:bg-surface-container-high rounded-full flex items-center justify-center text-on-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center max-w-xl mx-auto mb-8 mt-2">
            <h2 className="text-3xl font-black tracking-tight text-on-surface mb-3 font-clash uppercase">
              Достигнут лимит
            </h2>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {locale === 'en' ? 'You have exhausted the features available on your plan. Choose an appropriate level to continue learning.' : 'Вы исчерпали доступные функции на вашем тарифе. Выберите подходящий уровень для продолжения обучения.'}
            </p>

            <div className="inline-flex bg-surface p-1 rounded-xl border border-outline mt-6">
              <button 
                onClick={() => setBillingPeriod('monthly')}
                className={`px-4 py-2 text-[10px] font-bold rounded-lg transition-all ${
                  billingPeriod === 'monthly' ? 'bg-on-surface text-inverse-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Ежемесячно
              </button>
              <button 
                onClick={() => setBillingPeriod('yearly')}
                className={`px-4 py-2 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  billingPeriod === 'yearly' ? 'bg-on-surface text-inverse-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Ежегодно
                <span className="bg-surface-container/60 text-[#30D158] text-[8px] font-mono px-1.5 py-0.5 rounded border border-[#30D158]/20 uppercase tracking-wide">{locale === 'en' ? '15% off' : 'Скидка 15%'}</span>
              </button>
            </div>
          </div>

          <div className="mx-auto gap-4 md:gap-6 items-stretch mb-8 w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {/* FREE PLAN CARD */}
            <div className={`bg-surface-container border ${
              plan === 'FREE' ? 'border-outline bg-surface-container-high' : 'border-outline-variant'
            } rounded-[2rem] p-6 flex flex-col justify-between relative`}>
              <div>
                <div className="mb-4">
                  <h3 className="text-xl font-bold tracking-tight text-on-surface mb-1">Free</h3>
                  <p className="text-xs text-on-surface-variant font-medium">{locale === 'en' ? 'Basic platform introduction' : 'Базовое знакомство с платформой'}</p>
                </div>
                <div className="mb-6">
                  <span className="text-3xl font-black font-clash tracking-tight text-on-surface">$0</span>
                  <span className="text-[10px] text-on-surface-variant block mt-1">{locale === 'en' ? 'Always free' : 'Всегда бесплатно'}</span>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2.5 text-xs">
                    <Check className="w-4 h-4 text-on-surface-variant shrink-0 mt-0.5" strokeWidth={2} />
                    <span className="text-on-background leading-tight">{locale === 'en' ? '1 Generated course' : '1 Сгенерированный курс'}</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-xs">
                    <Check className="w-4 h-4 text-on-surface-variant shrink-0 mt-0.5" strokeWidth={2} />
                    <span className="text-on-background leading-tight">{locale === 'en' ? '5 trial AI Mentor messages' : '5 пробных сообщений AI-ментору'}</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-xs text-on-surface-variant/60">
                    <X className="w-4 h-4 text-[#636366] shrink-0 mt-0.5" strokeWidth={2} />
                    <span className="leading-tight">{locale === 'en' ? 'Interactive practice & code review' : 'Интерактивная практика и код-ревью'}</span>
                  </li>
                </ul>
              </div>
              <button 
                onClick={onClose}
                className="w-full py-3.5 rounded-2xl font-bold bg-transparent border border-outline text-on-surface hover:bg-[rgba(255,255,255,0.04)] active:scale-[0.98] transition-all text-xs"
              >
                Остаться на Free
              </button>
            </div>

            {/* PRO PLAN CARD */}
            <div className={`bg-surface-container rounded-[2rem] p-6 flex flex-col justify-between relative border-[2px] ${
              plan === 'PRO' ? 'border-primary bg-surface-container-high' : 'border-outline-variant'
            }`}>
              <div>
                <div className="mb-4">
                  <h3 className="text-xl font-bold tracking-tight text-on-surface mb-1 flex items-center gap-1.5">
                    Pro <Crown className="w-4 h-4 text-on-surface" strokeWidth={2} />
                  </h3>
                  <p className="text-xs text-on-surface-variant font-medium">{locale === 'en' ? 'Unlimited & adaptive learning' : 'Безлимитное и адаптивное обучение'}</p>
                </div>
                <div className="mb-6">
                  {discountActive ? (
                    <>
                      <div className="flex items-baseline gap-1 mb-1">
                        <span className="text-3xl font-black font-clash tracking-tight text-on-surface font-mono tabular-nums">
                          {billingPeriod === 'monthly' ? '$8.99' : '$6.75'}
                        </span>
                        <span className="text-[10px] text-on-surface-variant font-medium line-through mr-1">
                          {billingPeriod === 'monthly' ? '$9.99' : '$7.50'}
                        </span>
                        <span className="text-[10px] text-on-surface-variant font-medium">/мес</span>
                      </div>
                      <div className="inline-block bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[9px] font-bold border border-emerald-500/30 mb-1">
                        Скидка 10% на первый месяц
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black font-clash tracking-tight text-on-surface font-mono tabular-nums">
                          {billingPeriod === 'monthly' ? '$9.99' : '$7.50'}
                        </span>
                        <span className="text-[10px] text-on-surface-variant font-medium">/мес</span>
                      </div>
                    </>
                  )}
                  <span className="text-[9px] text-on-surface-variant block mt-1 font-sans">
                    {billingPeriod === 'monthly' ? locale === 'en' ? 'Billed monthly' : 'Оплата ежемесячно' : locale === 'en' ? 'Billed annually' : 'Оплата ежегодно'}
                  </span>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2.5 text-xs">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" strokeWidth={2.5} />
                    <span className="text-on-surface font-medium leading-tight">{locale === 'en' ? 'Unlimited course generation' : 'Безлимитная генерация курсов'}</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-xs">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" strokeWidth={2.5} />
                    <span className="text-on-surface font-medium leading-tight">{locale === 'en' ? 'AI Mentor (50 messages/day)' : 'AI-ментор (50 сообщений в день)'}</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-xs">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" strokeWidth={2.5} />
                    <span className="text-on-surface font-medium leading-tight">{locale === 'en' ? 'Access to Diamond & Master leagues' : 'Доступ к Алмазной и Магистр лигам'}</span>
                  </li>
                </ul>
              </div>
              <button 
                onClick={handleSelectPlan}
                className="w-full py-3.5 rounded-2xl font-bold bg-on-surface text-inverse-on-surface hover:bg-[#F5F5F7] active:scale-[0.98] transition-all text-xs shadow-md"
              >
                {plan === 'PRO' ? locale === 'en' ? 'Proceed to payment' : 'Перейти к оплате' : 'Активировать Pro'}
              </button>
            </div>

            {/* ULTRA PLAN CARD */}
            <div className={`bg-gradient-to-b from-surface-container to-indigo-50 dark:to-[#1E1B4B]/80 rounded-[2rem] p-6 flex flex-col justify-between relative border-[2px] shadow-[0_30px_70px_rgba(99,102,241,0.06)] ${
              plan === 'ULTRA' ? 'border-[#818CF8] bg-indigo-50/50 dark:bg-[#1E1B4B]/20' : 'border-indigo-500/20 hover:border-indigo-500/50'
            }`}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-on-surface px-2 py-0.5 rounded-full text-[8px] font-bold tracking-wider uppercase font-sans flex items-center gap-1 shadow-md shadow-indigo-950/55">
                <span className="material-symbols-outlined text-[8px] icon-filled text-on-surface animate-pulse">star</span> Элитный тариф
              </div>
              <div>
                <div className="mb-4">
                  <h3 className="text-xl font-bold tracking-tight text-on-surface mb-1 flex items-center gap-1.5">
                    Ultra <span className="text-[8px] font-black bg-indigo-500 text-on-surface px-1.5 py-0.5 rounded leading-none">ULTRA</span>
                  </h3>
                  <p className="text-[10px] text-indigo-600 dark:text-indigo-300 font-medium">{locale === 'en' ? 'Maximum YourWay AI arsenal' : 'Максимальный AI-арсенал YourWay'}</p>
                </div>
                <div className="mb-6">
                  {discountActive ? (
                    <>
                      <div className="flex items-baseline gap-1 mb-1">
                        <span className="text-3xl font-black font-clash tracking-tight text-on-surface font-mono tabular-nums">
                          {billingPeriod === 'monthly' ? '$26.99' : '$18.75'}
                        </span>
                        <span className="text-[10px] text-indigo-300 font-medium line-through mr-1">
                          {billingPeriod === 'monthly' ? '$29.99' : '$20.83'}
                        </span>
                        <span className="text-[10px] text-on-surface-variant font-medium">/мес</span>
                      </div>
                      <div className="inline-block bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[9px] font-bold border border-emerald-500/30 mb-1">
                        Скидка 10% на первый месяц
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black font-clash tracking-tight text-on-surface font-mono tabular-nums">
                          {billingPeriod === 'monthly' ? '$29.99' : '$20.83'}
                        </span>
                        <span className="text-[10px] text-on-surface-variant font-medium">/мес</span>
                      </div>
                    </>
                  )}
                  <span className="text-[9px] text-indigo-600 dark:text-indigo-300 block mt-1 font-sans">
                    {billingPeriod === 'monthly' ? locale === 'en' ? 'Billed monthly' : 'Оплата ежемесячно' : locale === 'en' ? 'Billed annually' : 'Оплата ежегодно'}
                  </span>
                </div>
                <ul className="space-y-2.5 mb-6 text-left">
                  <li className="flex items-start gap-2 text-[11px] text-on-surface">
                    <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" strokeWidth={3} />
                    <span className="leading-tight">{locale === 'en' ? 'Unlimited AI Mentor (no message limit)' : 'Безлимитный AI-ментор (без лимита сообщений)'}</span>
                  </li>
                  <li className="flex items-start gap-2 text-[11px] text-on-surface">
                    <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" strokeWidth={3} />
                    <span className="leading-tight">{locale === 'en' ? 'Interactive briefing course creation' : 'Интерактивный брифинг-составление курсов'}</span>
                  </li>
                  <li className="flex items-start gap-2 text-[11px] text-on-surface">
                    <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" strokeWidth={3} />
                    <span className="leading-tight">{locale === 'en' ? 'RAG: PDF, YouTube & Web Import' : 'RAG: Импорт PDF, YouTube и веб'}</span>
                  </li>
                  <li className="flex items-start gap-2 text-[11px] text-on-surface">
                    <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" strokeWidth={3} />
                    <span className="leading-tight">{locale === 'en' ? 'AI Code Review: bug analysis' : 'AI Code Review: анализ кода на ошибки'}</span>
                  </li>
                </ul>
              </div>
              <button 
                onClick={handleSelectPlan}
                className="w-full py-3.5 rounded-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 text-on-surface hover:from-indigo-400 hover:to-purple-500 active:scale-[0.98] transition-all text-xs shadow-md shadow-indigo-900/40"
              >
                Активировать Ultra
              </button>
            </div>
          </div>
          
          {auth.currentUser && (
            <div className="mt-2 p-4 bg-surface-container/50 rounded-2xl border border-amber-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Share2 className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-on-surface">{locale === 'en' ? 'Invite a friend - get a discount!' : 'Пригласи друга - получи скидку!'}</h3>
              </div>
              <p className="text-on-surface-variant text-xs leading-relaxed mb-3">
                {locale === 'en' ? <>Send the link to a friend. You <strong className="text-amber-500">both get 10% off</strong> your subscription.</> : <>Отправь ссылку другу. Вы <strong className="text-amber-500">оба получите скидку 10%</strong> на подписку.</>}
              </p>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={referralLink} 
                  className="flex-1 bg-surface border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface font-medium outline-none truncate"
                  placeholder={locale === 'en' ? 'Loading link...' : 'Загрузка ссылки...'}
                />
                <button 
                  onClick={handleCopy}
                  disabled={!referralLink}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap text-xs"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? locale === 'en' ? 'Copied' : 'Скопировано' : t('common.copy')}
                </button>
              </div>
            </div>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
