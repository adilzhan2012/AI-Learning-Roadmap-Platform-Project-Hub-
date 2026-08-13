import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  X, 
  Lock, 
  ChevronDown, 
  ChevronUp, 
  Crown,
  Loader2,
  Sparkles,
  Copy,
  Share2,
  CheckCircle2
} from 'lucide-react';
import { auth, db, functions } from '../firebase.js';
import { httpsCallable } from 'firebase/functions';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { sendEmailVerification } from 'firebase/auth';
import { usePlanLimits } from '../hooks/usePlanLimits.js';
import { useLocale, t } from '../i18n.js';
import { useNavigate } from 'react-router-dom';
import { getUserStats, getReferralsCount } from '../services/courseService.js';

export const LockIcon = ({ className }) => (
  <Lock className={className} strokeWidth={1.5} />
);

export default function Pricing() {
  const navigate = useNavigate();
  const locale = useLocale();
  const { plan, loading, dbBillingPeriod } = usePlanLimits();
  const [billingPeriod, setBillingPeriod] = useState('monthly'); // 'monthly' | 'yearly'
  const [showFullComparison, setShowFullComparison] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState('PRO'); // 'PRO' | 'ULTRA'

  // Email verification state
  const [verificationSent, setVerificationSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(auth.currentUser?.emailVerified || false);

  useEffect(() => {
    const checkVerification = async () => {
      if (auth.currentUser && !auth.currentUser.emailVerified) {
        try {
          await auth.currentUser.reload();
          if (auth.currentUser.emailVerified) {
            await auth.currentUser.getIdToken(true); // Force token refresh so backend sees it
          }
          setEmailVerified(auth.currentUser.emailVerified);
        } catch (e) {
          console.error('Error reloading user:', e);
        }
      } else if (auth.currentUser) {
        setEmailVerified(auth.currentUser.emailVerified);
      }
    };

    checkVerification();

    const handleFocus = () => {
      checkVerification();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const handleSendVerification = async () => {
    if (auth.currentUser) {
      try {
        await sendEmailVerification(auth.currentUser);
        setVerificationSent(true);
      } catch (e) {
        alert("Ошибка: " + e.message);
      }
    }
  };

  // Simulated payment state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [checkoutStage, setCheckoutStage] = useState('input'); // 'input' | 'processing' | 'success'
  const [checkoutError, setCheckoutError] = useState('');

  // Referral states
  const [discountActive, setDiscountActive] = useState(false);
  const [referralLink, setReferralLink] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const checkReferral = async () => {
      try {
        const [stats, count] = await Promise.all([
          getUserStats(uid),
          getReferralsCount(uid)
        ]);
        setReferralLink(`${window.location.origin}/register?ref=${stats.referralCode || uid}`);
        if (stats.referredBy || count > 0) {
          setDiscountActive(true);
        }
      } catch (e) {
        console.error('Error fetching referrals:', e);
      }
    };
    checkReferral();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Cancel subscription states
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const getRenewalDate = () => {
    const d = new Date();
    if (billingPeriod === 'monthly') {
      d.setMonth(d.getMonth() + 1);
    } else {
      d.setFullYear(d.getFullYear() + 1);
    }
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return d.toLocaleDateString('ru-RU', options);
  };

  const handleCancelSubscription = async () => {
    setCancelling(true);
    try {
      const updateSubFn = httpsCallable(functions, 'updateSubscription');
      await updateSubFn({ plan: 'FREE' });
      setCancelling(false);
      setIsCancelModalOpen(false);
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert(e.message || (locale === "en" ? "Error cancelling subscription" : "Ошибка при отмене подписки"));
      setCancelling(false);
    }
  };

  const handleSelectPlan = (targetPlan) => {
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }
    
    if (targetPlan === 'PRO' || targetPlan === 'ULTRA') {
      setSelectedUpgradePlan(targetPlan);
      setIsCheckoutOpen(true);
    } else {
      handleDowngrade();
    }
  };

  const handleDowngrade = async () => {
    setUpgrading(true);
    try {
      const updateSubFn = httpsCallable(functions, 'updateSubscription');
      await updateSubFn({ plan: 'FREE' });
      setUpgrading(false);
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert(e.message || (locale === "en" ? "Error switching to basic plan" : "Ошибка при переходе на базовый тариф"));
      setUpgrading(false);
    }
  };

  const handleSubmitPayment = async () => {
    setCheckoutError('');
    if (!promoCode) {
      setCheckoutError(locale === 'en' ? 'Enter invite code.' : 'Введите инвайт-код.');
      return;
    }

    setCheckoutStage('processing');

    try {
      const codeSnap = await getDoc(doc(db, 'promocodes', promoCode));
      if (!codeSnap.exists() || !codeSnap.data().active) {
        setCheckoutStage('input');
        setCheckoutError(locale === 'en' ? 'Invalid or disabled invite code.' : 'Недействительный или отключенный инвайт-код.');
        return;
      }
      
      // Код валиден
      setCheckoutStage('success');
    } catch (e) {
      setCheckoutStage('input');
      setCheckoutError((locale === 'en' ? 'Error validating code: ' : 'Ошибка проверки кода: ') + e.message);
    }
  };

  const handleFinishUpgrade = async () => {
    setIsCheckoutOpen(false);
    setCheckoutStage('input');
    setUpgrading(true);
    try {
      // Force reload user profile and refresh token so email_verified is current
      if (auth.currentUser) {
        await auth.currentUser.reload();
        await auth.currentUser.getIdToken(true);
      }
      const updateSubFn = httpsCallable(functions, 'updateSubscription');
      await updateSubFn({ plan: selectedUpgradePlan, promoCode });
      setUpgrading(false);
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert(e.message || (locale === "en" ? "Error upgrading subscription. Please ensure your email is verified." : "Ошибка при обновлении подписки. Пожалуйста, убедитесь, что ваш email верифицирован."));
      setUpgrading(false);
    }
  };

  if (loading || upgrading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4.5rem)] bg-background text-on-surface">
        <Loader2 className="w-8 h-8 animate-spin text-on-surface mb-2" />
        <p className="text-sm text-on-surface-variant font-mono">{locale === "en" ? "Upgrading plan..." : "Обновление тарифного плана..."}</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4.5rem)] bg-background text-on-surface font-sans py-12 px-4 select-none relative">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto mb-10">
        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-black tracking-tight text-on-surface mb-3 font-clash uppercase"
        >
          {t('pricing.title') || (locale === 'en' ? 'Pricing Plans' : 'Тарифные планы')}
        </motion.h1>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          {locale === "en" ? "Choose the right plan to achieve your learning goals. Generate personalized courses using AI." : "Выберите подходящий уровень для достижения ваших целей обучения. Сгенерируйте индивидуальные курсы с использованием ИИ."}
        </p>

        {auth.currentUser && !emailVerified && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 bg-[#FF453A]/10 border border-[#FF453A]/20 p-4 rounded-[16px] flex flex-col sm:flex-row items-center justify-between gap-4 text-left"
          >
            <div>
              <h4 className="font-bold text-[#FF453A] text-sm">{locale === "en" ? "Email not verified!" : "Email не подтвержден!"}</h4>
              <p className="text-xs text-[#FF453A]/80 mt-1">{locale === "en" ? "You need to verify your email to subscribe." : "Для оформления подписки вам необходимо подтвердить почту."}</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button 
                onClick={async () => {
                  if (auth.currentUser) {
                    await auth.currentUser.reload();
                    if (auth.currentUser.emailVerified) {
                      await auth.currentUser.getIdToken(true);
                    }
                    setEmailVerified(auth.currentUser.emailVerified);
                  }
                }} 
                className="px-4 py-2 w-full sm:w-auto bg-transparent border border-[#FF453A]/30 hover:bg-[#FF453A]/10 text-[#FF453A] rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap"
              >
                {locale === 'en' ? 'I confirmed' : 'Я подтвердил(а)'}
              </button>
              <button 
                onClick={handleSendVerification} 
                disabled={verificationSent} 
                className="px-4 py-2 w-full sm:w-auto bg-[#FF453A]/20 hover:bg-[#FF453A]/30 text-[#FF453A] rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap"
              >
                {verificationSent ? (locale === 'en' ? 'Email sent' : 'Письмо отправлено') : t('settings.security.sendReset')}
              </button>
            </div>
          </motion.div>
        )}

        {/* Toggle Billing Period */}
        <div className="inline-flex bg-surface p-1 rounded-xl border border-outline mt-8">
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
            <span className="bg-surface-container/60 text-[#30D158] text-[8px] font-mono px-1.5 py-0.5 rounded border border-[#30D158]/20 uppercase tracking-wide">{locale === "en" ? "15% off" : "Скидка 15%"}</span>
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="mx-auto gap-8 items-stretch mb-16 max-w-[1100px] grid grid-cols-1 md:grid-cols-3">
        
        {/* FREE PLAN CARD */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 22 }}
          className={`bg-surface-container border ${
            plan === 'FREE' ? 'border-outline bg-surface-container-high' : 'border-outline-variant'
          } rounded-[2rem] p-8 flex flex-col justify-between relative`}
        >
          <div>
            <div className="mb-6">
              <h3 className="text-xl font-bold tracking-tight text-on-surface mb-1">{t('pricing.freeTitle') || 'Free'}</h3>
              <p className="text-xs text-on-surface-variant font-medium">{locale === "en" ? "Basic platform introduction" : "Базовое знакомство с платформой"}</p>
            </div>

            <div className="mb-8">
              <span className="text-4xl font-black font-clash tracking-tight text-on-surface">$0</span>
              <span className="text-xs text-on-surface-variant block mt-1">{locale === "en" ? "Always free" : "Всегда бесплатно"}</span>
            </div>

            {/* Checklist */}
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3 text-sm">
                <Check className="w-5 h-5 text-on-surface-variant shrink-0 mt-0.5" strokeWidth={2} />
                <span className="text-on-background leading-tight">{locale === "en" ? "1 Generated course" : "1 Сгенерированный курс"}</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Check className="w-5 h-5 text-on-surface-variant shrink-0 mt-0.5" strokeWidth={2} />
                <span className="text-on-background leading-tight">{locale === "en" ? "5 trial AI Mentor messages" : "5 пробных сообщений AI-ментору"}</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-on-surface-variant/60">
                <X className="w-5 h-5 text-[#636366] shrink-0 mt-0.5" strokeWidth={2} />
                <span className="leading-tight">{locale === "en" ? "Interactive practice & code review" : "Интерактивная практика и код-ревью"}</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-on-surface-variant/60">
                <X className="w-5 h-5 text-[#636366] shrink-0 mt-0.5" strokeWidth={2} />
                <span className="leading-tight">{locale === "en" ? "RAG: PDF/YouTube generation" : "RAG: Генерация из PDF/YouTube"}</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-on-surface-variant/60">
                <X className="w-5 h-5 text-[#636366] shrink-0 mt-0.5" strokeWidth={2} />
                <span className="leading-tight">{locale === "en" ? "Mock Interview & Export" : "Mock Interview & Экспорт"}</span>
              </li>
            </ul>
          </div>

          <div>
            {plan === 'FREE' ? (
              <button 
                disabled 
                className="w-full py-4 rounded-2xl font-bold bg-transparent border border-outline text-on-surface-variant text-xs cursor-default"
              >
                {t('pricing.current') || (locale === 'en' ? 'Current Plan' : 'Текущий тариф')}
              </button>
            ) : (
              <button 
                onClick={() => handleDowngrade()}
                className="w-full py-4 rounded-2xl font-bold bg-transparent border border-outline text-on-surface hover:bg-[rgba(255,255,255,0.04)] active:scale-[0.98] transition-all text-xs"
              >
                Перейти на Free
              </button>
            )}
          </div>
        </motion.div>

        {/* PRO PLAN CARD (ACCENTED) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 22 }}
          className={`bg-surface-container rounded-[2rem] p-8 flex flex-col justify-between relative border-[2px] ${
            plan === 'PRO' ? 'border-primary bg-surface-container-high' : 'border-outline-variant'
          }`}
        >
          <div>
            <div className="mb-6">
              <h3 className="text-xl font-bold tracking-tight text-on-surface mb-1 flex items-center gap-1.5">
                Pro <Crown className="w-4 h-4 text-on-surface" strokeWidth={2} />
              </h3>
              <p className="text-xs text-on-surface-variant font-medium">{locale === "en" ? "Unlimited & adaptive learning" : "Безлимитное и адаптивное обучение"}</p>
            </div>

            <div className="mb-8">
              {discountActive ? (
                <>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-4xl font-black font-clash tracking-tight text-on-surface font-mono tabular-nums">
                      {billingPeriod === 'monthly' ? '$8.99' : '$6.75'}
                    </span>
                    <span className="text-xs text-on-surface-variant font-medium line-through mr-1">
                      {billingPeriod === 'monthly' ? '$9.99' : '$7.50'}
                    </span>
                    <span className="text-xs text-on-surface-variant font-medium">{locale === "en" ? "/mo" : "/мес"}</span>
                  </div>
                  <div className="inline-block bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-500/30 mb-1">
                    Скидка 10% на первый месяц
                  </div>
                  <span className="text-[10px] text-on-surface-variant block font-sans">
                    {billingPeriod === 'monthly' ? (locale === 'en' ? 'Billed monthly ($8.99)' : 'Оплата ежемесячно ($8.99)') : (locale === 'en' ? 'Billed annually ($80.99)' : 'Оплата ежегодно ($80.99)')}
                  </span>
                </>
              ) : (
                <>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black font-clash tracking-tight text-on-surface font-mono tabular-nums">
                      {billingPeriod === 'monthly' ? '$9.99' : '$7.50'}
                    </span>
                    <span className="text-xs text-on-surface-variant font-medium">{locale === "en" ? "/mo" : "/мес"}</span>
                  </div>
                  <span className="text-[10px] text-on-surface-variant block mt-1 font-sans">
                    {billingPeriod === 'monthly' ? (locale === 'en' ? 'Billed monthly ($9.99)' : 'Оплата ежемесячно ($9.99)') : (locale === 'en' ? 'Billed annually ($89.99)' : 'Оплата ежегодно ($89.99)')}
                  </span>
                </>
              )}
            </div>

            {/* Checklist */}
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3 text-sm">
                <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" strokeWidth={2.5} />
                <span className="text-on-surface font-medium leading-tight">{locale === "en" ? "Unlimited course generation" : "Безлимитная генерация курсов"}</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" strokeWidth={2.5} />
                <span className="text-on-surface font-medium leading-tight">{locale === "en" ? "AI Mentor (50 messages/day)" : "AI-ментор (50 сообщений в день)"}</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" strokeWidth={2.5} />
                <span className="text-on-surface font-medium leading-tight">{locale === "en" ? "Access to Diamond & Master leagues" : "Доступ к Алмазной и Магистр лигам"}</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-on-surface-variant/60">
                <X className="w-5 h-5 text-[#636366] shrink-0 mt-0.5" strokeWidth={2} />
                <span className="leading-tight">{locale === "en" ? "Interactive practice & code review" : "Интерактивная практика и код-ревью"}</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-on-surface-variant/60">
                <X className="w-5 h-5 text-[#636366] shrink-0 mt-0.5" strokeWidth={2} />
                <span className="leading-tight">{locale === "en" ? "RAG: PDF/YouTube generation" : "RAG: Генерация по PDF/YouTube"}</span>
              </li>
            </ul>
          </div>

          <div>
            {plan === 'PRO' ? (
              dbBillingPeriod === billingPeriod ? (
                <div className="space-y-4">
                  <div className="bg-surface-container/40 border border-white/5 rounded-2xl p-4 text-left select-none">
                    <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block mb-1">{locale === "en" ? "Subscription Details" : "Сведения о подписке"}</span>
                    <span className="text-xs text-on-surface block mb-1 font-bold">{locale === "en" ? "YourWay Pro · Active" : "Тариф YourWay Pro · Активен"}</span>
                    <span className="text-[11px] text-on-surface-variant block">
                      {locale === "en" ? "Renews: " : "Продление: "}{getRenewalDate()}
                    </span>
                  </div>
                  <button 
                    onClick={() => setIsCancelModalOpen(true)}
                    className="w-full py-3.5 rounded-2xl font-bold bg-transparent border border-red-500/30 text-red-400 hover:bg-red-500/10 active:scale-[0.98] transition-all text-xs"
                  >
                    Отменить подписку
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => handleSelectPlan('PRO')}
                  className="w-full py-4 rounded-2xl font-bold bg-on-surface text-inverse-on-surface hover:bg-[#F5F5F7] active:scale-[0.98] transition-all text-xs shadow-md"
                >
                  {billingPeriod === 'yearly' ? (locale === 'en' ? 'Switch to Yearly Pro' : 'Перейти на годовой Pro') : (locale === 'en' ? 'Switch to Monthly Pro' : 'Перейти на месячный Pro')}
                </button>
              )
            ) : (
              <button 
                onClick={() => handleSelectPlan('PRO')}
                className="w-full py-4 rounded-2xl font-bold bg-on-surface text-inverse-on-surface hover:bg-[#F5F5F7] active:scale-[0.98] transition-all text-xs shadow-md"
              >
                Активировать Pro
              </button>
            )}
          </div>
        </motion.div>

        {/* ULTRA PLAN CARD (PREMIUM PURPLE GLOW) */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 22 }}
          className={`bg-gradient-to-b from-surface-container to-indigo-50 dark:to-[#1E1B4B]/80 rounded-[2rem] p-8 flex flex-col justify-between relative border-[2px] shadow-[0_30px_70px_rgba(99,102,241,0.06)] ${
            plan === 'ULTRA' ? 'border-[#818CF8] bg-indigo-50/50 dark:bg-[#1E1B4B]/20' : 'border-indigo-500/20 hover:border-indigo-500/50'
          }`}
        >
          {/* Badge */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-indigo-600 text-on-surface px-3 py-1 rounded-full text-[9px] font-bold tracking-wider uppercase font-sans flex items-center gap-1 shadow-md shadow-indigo-950/55">
            <span className="material-symbols-outlined text-[10px] icon-filled text-on-surface animate-pulse">star</span> Элитный тариф
          </div>

          <div>
            <div className="mb-6">
              <h3 className="text-xl font-bold tracking-tight text-on-surface mb-1 flex items-center gap-1.5">
                Ultra <span className="text-[10px] font-black bg-indigo-500 text-on-surface px-1.5 py-0.5 rounded leading-none">ULTRA</span>
              </h3>
              <p className="text-xs text-indigo-600 dark:text-indigo-300 font-medium">{locale === "en" ? "Maximum YourWay AI arsenal" : "Максимальный AI-арсенал YourWay"}</p>
            </div>

            <div className="mb-8">
              {discountActive ? (
                <>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-4xl font-black font-clash tracking-tight text-on-surface font-mono tabular-nums">
                      {billingPeriod === 'monthly' ? '$26.99' : '$18.75'}
                    </span>
                    <span className="text-xs text-indigo-300 font-medium line-through mr-1">
                      {billingPeriod === 'monthly' ? '$29.99' : '$20.83'}
                    </span>
                    <span className="text-xs text-on-surface-variant font-medium">{locale === "en" ? "/mo" : "/мес"}</span>
                  </div>
                  <div className="inline-block bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-500/30 mb-1">
                    Скидка 10% на первый месяц
                  </div>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-300 block font-sans">
                    {billingPeriod === 'monthly' ? (locale === 'en' ? 'Billed monthly ($26.99)' : 'Оплата ежемесячно ($26.99)') : (locale === 'en' ? 'Billed annually ($224.99)' : 'Оплата ежегодно ($224.99)')}
                  </span>
                </>
              ) : (
                <>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black font-clash tracking-tight text-on-surface font-mono tabular-nums">
                      {billingPeriod === 'monthly' ? '$29.99' : '$20.83'}
                    </span>
                    <span className="text-xs text-on-surface-variant font-medium">{locale === "en" ? "/mo" : "/мес"}</span>
                  </div>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-300 block mt-1 font-sans">
                    {billingPeriod === 'monthly' ? (locale === 'en' ? 'Billed monthly ($29.99)' : 'Оплата ежемесячно ($29.99)') : (locale === 'en' ? 'Billed annually ($249.99)' : 'Оплата ежегодно ($249.99)')}
                  </span>
                </>
              )}
            </div>

            {/* Checklist */}
            <ul className="space-y-3.5 mb-8 text-left">
              <li className="flex items-start gap-2.5 text-xs text-on-surface">
                <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" strokeWidth={3} />
                <span className="leading-tight">{locale === 'en' ? 'Unlimited AI Mentor (no message limit)' : 'Безлимитный AI-ментор (без лимита сообщений)'}</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-on-surface">
                <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" strokeWidth={3} />
                <span className="leading-tight">{locale === 'en' ? 'Interactive briefing course creation' : 'Интерактивный брифинг-составление курсов'}</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-on-surface">
                <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" strokeWidth={3} />
                <span className="leading-tight">{locale === 'en' ? 'RAG: PDF, YouTube & Web Docs Import' : 'RAG: Импорт PDF, YouTube и веб-документации'}</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-on-surface">
                <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" strokeWidth={3} />
                <span className="leading-tight">{locale === 'en' ? 'AI Code Review: Bug & Vulnerability Analysis' : 'AI Code Review: анализ кода на ошибки и уязвимости'}</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-on-surface">
                <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" strokeWidth={3} />
                <span className="leading-tight">{locale === 'en' ? 'Adaptive Knowledge Graph (Auto Micromodules)' : 'Адаптивный Граф знаний (авто-микромодули)'}</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-on-surface">
                <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" strokeWidth={3} />
                <span className="leading-tight">{locale === 'en' ? 'AI Mock Interview: HR & Tech Simulator at the End' : 'AI Mock Interview: HR & Tech-симулятор в финале'}</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-on-surface">
                <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" strokeWidth={3} />
                <span className="leading-tight">{locale === 'en' ? 'Export Lectures & Cards to Notion & Anki' : 'Экспорт лекций и карточек в Notion & Anki'}</span>
              </li>
            </ul>
          </div>

          <div>
            {plan === 'ULTRA' ? (
              dbBillingPeriod === billingPeriod ? (
                <div className="space-y-4">
                  <div className="bg-indigo-950/40 border border-indigo-500/20 rounded-2xl p-4 text-left select-none">
                    <span className="text-[10px] text-indigo-300 uppercase tracking-wider block mb-1">{locale === "en" ? "Subscription Details" : "Сведения о подписке"}</span>
                    <span className="text-xs text-on-surface block mb-1 font-bold font-clash">{locale === 'en' ? 'YourWay Ultra Plan · Active' : 'Тариф YourWay Ultra · Активен'}</span>
                    <span className="text-[11px] text-zinc-300 block">
                      {locale === "en" ? "Renews: " : "Продление: "}{getRenewalDate()}
                    </span>
                  </div>
                  <button 
                    onClick={() => setIsCancelModalOpen(true)}
                    className="w-full py-3.5 rounded-2xl font-bold bg-transparent border border-red-500/30 text-red-400 hover:bg-red-500/10 active:scale-[0.98] transition-all text-xs"
                  >
                    Отменить подписку
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => handleSelectPlan('ULTRA')}
                  className="w-full py-4 rounded-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 text-on-surface hover:from-indigo-400 hover:to-purple-500 active:scale-[0.98] transition-all text-xs shadow-md"
                >
                  {billingPeriod === 'yearly' ? (locale === 'en' ? 'Switch to Yearly Ultra' : 'Перейти на годовой Ultra') : (locale === 'en' ? 'Switch to Monthly Ultra' : 'Перейти на месячный Ultra')}
                </button>
              )
            ) : (
              <button 
                onClick={() => handleSelectPlan('ULTRA')}
                className="w-full py-4 rounded-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 text-on-surface hover:from-indigo-400 hover:to-purple-500 active:scale-[0.98] transition-all text-xs shadow-md shadow-indigo-900/40"
              >
                Активировать Ultra
              </button>
            )}
          </div>
        </motion.div>
      </div>

      {/* Referral Program Banner */}
      {auth.currentUser && (
        <div className="max-w-[900px] mx-auto mb-16">
          <div className="p-6 md:p-8 bg-surface border border-amber-500/30 rounded-3xl relative overflow-hidden flex flex-col md:flex-row items-center gap-6 shadow-[0_0_50px_-20px_rgba(245,158,11,0.2)]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[100px] rounded-full" />
            
            <div className="flex-1 relative z-10 text-center md:text-left">
              <div className="inline-flex items-center gap-2 mb-3">
                <Share2 className="w-5 h-5 text-amber-500" />
                <h3 className="text-xl font-bold text-on-surface font-clash">{locale === "en" ? "Invite a friend - get 10% off!" : "Пригласи друга - получи скидку 10%!"}</h3>
              </div>
              <p className="text-on-surface-variant text-sm leading-relaxed mb-4">
                {locale === "en" ? <>Send this link to a friend. When they sign up, you <strong className="text-amber-500">both get 10% off</strong> your first month of PRO or ULTRA.</> : <>Отправь эту ссылку другу. Когда он зарегистрируется, вы <strong className="text-amber-500">оба получите скидку 10%</strong> на первый месяц подписки PRO или ULTRA.</>}
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input 
                  type="text" 
                  readOnly 
                  value={referralLink} 
                  className="w-full sm:flex-1 bg-surface-container/50 border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface font-medium outline-none truncate focus:border-amber-500/50 transition-colors"
                  placeholder={locale === 'en' ? 'Loading link...' : 'Загрузка ссылки...'}
                />
                <button 
                  onClick={handleCopy}
                  disabled={!referralLink}
                  className="w-full sm:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap shadow-lg shadow-amber-500/20"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? (locale === 'en' ? 'Copied' : 'Скопировано') : (locale === 'en' ? 'Copy link' : 'Копировать ссылку')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Active Features Info Cards */}
      {(plan === 'PRO' || plan === 'ULTRA') && (
        <div className="max-w-[900px] mx-auto mt-16 mb-12 text-center">
          <h2 className="text-xl font-bold tracking-tight text-on-surface mb-8 font-clash uppercase">
            locale === 'en' ? 'You have access to features of ' : 'Вам доступны возможности тарифа '{plan}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plan === 'ULTRA' ? (
              [
                {
                  title: locale === 'en' ? 'RAG: Content Generation' : 'RAG: Генерация по материалам',
                  desc: locale === 'en' ? 'Upload a PDF book, article, or documentation, insert a YouTube lecture — AI will generate a course and knowledge graph based on them.' : 'Загрузите PDF книгу, статью или документацию, вставьте YouTube лекцию — искусственный интеллект сгенерирует курс и граф знаний на их основе.',
                  icon: '📖'
                },
                {
                  title: locale === 'en' ? 'AI Code Review and interactive practice' : 'AI Code Review и интерактивная практика',
                  desc: locale === 'en' ? 'Write real code right in the lesson window. AI expert will check code style, point out leaks, bugs, and vulnerabilities.' : 'Пишите реальный код непосредственно в окне урока. AI-эксперт проверит код-стайл, укажет на утечки, ошибки и уязвимости.',
                  icon: '💻'
                },
                {
                  title: locale === 'en' ? 'Adaptive Knowledge Graph' : 'Адаптивный Граф знаний',
                  desc: locale === 'en' ? 'If node tests are passed with a low score, the system automatically rebuilds the graph, generating micromodules to fill gaps.' : 'Если тесты по ноде пройдены с низким результатом, система автоматически перестраивает граф, генерируя микро-модули закрытия пробелов.',
                  icon: '🧬'
                },
                {
                  title: locale === 'en' ? 'Interview Simulation' : 'Симуляция собеседований',
                  desc: locale === 'en' ? 'Mock interviews at the end of courses. Voice/text simulator evaluating you on HR and Tech Lead questions.' : 'Mock-интервью в конце курсов. Голосовой/текстовый тренажер, оценивающий вас по вопросам HR и Tech-лидов.',
                  icon: '🤝'
                }
              ].map((feat, i) => (
                <div 
                  key={i} 
                  className="bg-surface border border-indigo-500/20 rounded-[1.5rem] p-6 text-left hover:border-indigo-400/50 transition-colors shadow-inner"
                >
                  <div className="text-2xl mb-3">{feat.icon}</div>
                  <h3 className="text-sm font-bold text-on-surface mb-2">{feat.title}</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{feat.desc}</p>
                </div>
              ))
            ) : (
              [
                {
                  title: locale === 'en' ? 'Unlimited Courses' : 'Безлимитные курсы',
                  desc: locale === 'en' ? 'Create an unlimited number of roadmaps of any complexity. Generate advanced sections with maximum depth.' : 'Создавайте неограниченное количество дорожных карт любой сложности. Генерируйте расширенные разделы с максимальной глубиной.',
                  icon: '📚'
                },
                {
                  title: locale === 'en' ? 'AI Mentor with Memory' : 'AI-Ментор с памятью',
                  desc: locale === 'en' ? 'Deep learning context. The mentor remembers all previous questions, keeps conversation history, and adapts to your goals.' : 'Глубокий контекст обучения. Ментор помнит все предыдущие вопросы, сохраняет историю переписки и адаптируется под ваши цели.',
                  icon: '🧠'
                },
                {
                  title: locale === 'en' ? 'Access to All Leagues' : 'Доступ ко всем лигам',
                  desc: locale === 'en' ? 'You are no longer limited to the Graphite league. Compete in Quartz, Obsidian, Platinum, and the legendary Titanium leagues.' : 'Вы больше не ограничены лигой Графит. Соревнуйтесь в Кварцевой, Обсидиановой, Платиновой и легендарной Титановой лигах.',
                  icon: '🏆'
                },
                {
                  title: locale === 'en' ? 'Official Certificates' : 'Официальные сертификаты',
                  desc: locale === 'en' ? 'Generate verifiable PDF certificates upon course completion to prove your professional skills.' : 'Генерируйте верифицируемые PDF-сертификаты после завершения курсов для подтверждения ваших профессиональных навыков.',
                  icon: '🎓'
                }
              ].map((feat, i) => (
                <div 
                  key={i} 
                  className="bg-surface border border-outline rounded-[1.5rem] p-6 text-left hover:border-white/20 transition-colors"
                >
                  <div className="text-2xl mb-3">{feat.icon}</div>
                  <h3 className="text-sm font-bold text-on-surface mb-2">{feat.title}</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{feat.desc}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Comparison Table Toggle */}
      <div className="text-center mb-16">
        <button 
          onClick={() => setShowFullComparison(!showFullComparison)}
          className="inline-flex items-center gap-2 text-xs font-bold text-on-surface-variant hover:text-on-surface transition-colors"
        >
          {showFullComparison ? locale === 'en' ? 'Hide detailed comparison' : 'Скрыть подробное сравнение' : locale === 'en' ? 'Show detailed comparison' : 'Показать подробное сравнение'}
          {showFullComparison ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Full Comparison Table */}
      <AnimatePresence>
        {showFullComparison && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="max-w-[800px] mx-auto bg-surface border border-outline rounded-[2rem] p-8 overflow-x-auto"
          >
            <table className="w-full text-left text-xs leading-normal">
              <thead>
                <tr className="border-b border-outline">
                  <th className="pb-4 font-bold text-on-surface-variant">{locale === 'en' ? 'Feature' : 'Функция'}</th>
                  <th className="pb-4 text-center font-bold text-on-surface-variant">{t('pricing.freeTitle') || 'Free'}</th>
                  <th className="pb-4 text-center font-bold text-on-surface">Pro</th>
                  <th className="pb-4 text-center font-bold text-indigo-400">Ultra</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.04)] font-sans">
                {/* Courses */}
                <tr>
                  <td className="py-4 text-on-background">{locale === 'en' ? 'Roadmap Generation' : 'Генерация дорожных карт'}</td>
                  <td className="text-center py-4 text-on-surface-variant">{locale === 'en' ? '2 courses / mo' : '2 курса / мес'}</td>
                  <td className="text-center py-4 text-on-surface font-bold">{locale === 'en' ? 'Unlimited' : 'Безлимитно'}</td>
                  <td className="text-center py-4 text-indigo-300 font-bold">{locale === 'en' ? 'Unlimited' : 'Безлимитно'}</td>
                </tr>
                {/* AI Mentor */}
                <tr>
                  <td className="py-4 text-on-background">{locale === 'en' ? 'Interactive AI Mentor' : 'Интерактивный AI-ментор'}</td>
                  <td className="text-center py-4 text-on-surface-variant">{locale === 'en' ? '5 messages' : '5 сообщений'}</td>
                  <td className="text-center py-4 text-on-surface font-bold">{locale === 'en' ? '50 msg/day' : '50 сообщ/день'}</td>
                  <td className="text-center py-4 text-indigo-300 font-bold">{locale === 'en' ? 'Unlimited' : 'Без ограничений'}</td>
                </tr>
                {/* RAG Generation */}
                <tr>
                  <td className="py-4 text-on-background">{locale === 'en' ? 'RAG (PDF, YouTube Lectures)' : 'RAG (PDF, YouTube лекции)'}</td>
                  <td className="text-center py-4 text-on-surface-variant"><LockIcon className="w-3.5 h-3.5 mx-auto text-[#636366]" /></td>
                  <td className="text-center py-4 text-on-surface-variant"><LockIcon className="w-3.5 h-3.5 mx-auto text-[#636366]" /></td>
                  <td className="text-center py-4 text-indigo-300 font-bold">{locale === 'en' ? 'Included' : 'Включено'}</td>
                </tr>
                {/* Code review */}
                <tr>
                  <td className="py-4 text-on-background">{locale === 'en' ? 'AI Code Review & Programming Practice' : 'AI Code Review и практика программирования'}</td>
                  <td className="text-center py-4 text-on-surface-variant"><LockIcon className="w-3.5 h-3.5 mx-auto text-[#636366]" /></td>
                  <td className="text-center py-4 text-on-surface-variant"><LockIcon className="w-3.5 h-3.5 mx-auto text-[#636366]" /></td>
                  <td className="text-center py-4 text-indigo-300 font-bold">{locale === 'en' ? 'Included' : 'Включено'}</td>
                </tr>
                {/* Adaptive Graph */}
                <tr>
                  <td className="py-4 text-on-background">{locale === 'en' ? 'Adaptive Graph (Micromodules)' : 'Адаптивный граф (микромодули)'}</td>
                  <td className="text-center py-4 text-on-surface-variant"><LockIcon className="w-3.5 h-3.5 mx-auto text-[#636366]" /></td>
                  <td className="text-center py-4 text-on-surface font-bold">{locale === 'en' ? 'Partially' : 'Частично'}</td>
                  <td className="text-center py-4 text-indigo-300 font-bold">{locale === 'en' ? 'Full Coverage' : 'Полное покрытие'}</td>
                </tr>
                {/* Mock Interview */}
                <tr>
                  <td className="py-4 text-on-background">{locale === 'en' ? 'HR / Tech Lead Interview' : 'ИнтервьюHR / Tech-лид'}</td>
                  <td className="text-center py-4 text-on-surface-variant"><LockIcon className="w-3.5 h-3.5 mx-auto text-[#636366]" /></td>
                  <td className="text-center py-4 text-on-surface-variant"><LockIcon className="w-3.5 h-3.5 mx-auto text-[#636366]" /></td>
                  <td className="text-center py-4 text-indigo-300 font-bold">{locale === 'en' ? 'Included' : 'Включено'}</td>
                </tr>
                {/* Export */}
                <tr>
                  <td className="py-4 text-on-background">{locale === 'en' ? 'Export to Notion and Anki' : 'Экспорт в Notion и Anki'}</td>
                  <td className="text-center py-4 text-on-surface-variant"><LockIcon className="w-3.5 h-3.5 mx-auto text-[#636366]" /></td>
                  <td className="text-center py-4 text-on-surface-variant"><LockIcon className="w-3.5 h-3.5 mx-auto text-[#636366]" /></td>
                  <td className="text-center py-4 text-indigo-300 font-bold">{locale === 'en' ? 'Included' : 'Включено'}</td>
                </tr>
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Simulated Checkout Modal */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (checkoutStage !== 'processing') {
                  setIsCheckoutOpen(false);
                  setCheckoutStage('input');
                }
              }}
              className="absolute inset-0 bg-black/75 backdrop-blur-md"
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="relative bg-surface border border-outline w-full max-w-md rounded-[2rem] p-8 shadow-2xl z-10 text-center overflow-hidden"
            >
              {checkoutStage === 'input' && (
                <>
                  <h3 className="text-xl font-bold text-on-surface mb-1 font-clash">{locale === 'en' ? 'Subscription Checkout ' : 'Оформление подписки '}{selectedUpgradePlan}</h3>
                  <p className="text-xs text-on-surface-variant mb-6">
                    {locale === 'en' ? 'Plan: ' : 'Тариф: '}{selectedUpgradePlan} ({billingPeriod === 'monthly' ? `{locale === 'en' ? 'Monthly - ' : 'Ежемесячный - '}$${selectedUpgradePlan === 'ULTRA' ? '29.99' : '9.99'}/мес` : `{locale === 'en' ? 'Yearly - ' : 'Ежегодный - '}$${selectedUpgradePlan === 'ULTRA' ? '249.99' : '89.99'}/год`})
                  </p>

                  <div className="bg-surface-container/20 border border-outline/5 rounded-xl p-4 text-left text-xs text-on-surface-variant mb-6">
                    <p className="mb-2 text-on-surface font-semibold">{locale === 'en' ? '🔒 Beta Testing' : '🔒 Бета-тестирование'}</p>
                    <p>{locale === 'en' ? 'The platform is currently in closed beta. Enter a special invite code to activate a paid plan.' : 'Сейчас платформа находится на стадии закрытого бета-теста. Для активации платного тарифа введите специальный инвайт-код.'}</p>
                  </div>

                  <div className="text-left mb-6">
                    <label className="block text-xs font-bold text-on-surface mb-2">{locale === 'en' ? 'Promo Code / Invite Code' : 'Промокод / Инвайт-код'}</label>
                    <input 
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.trim().toUpperCase())}
                      placeholder={t('pricing.promoPlaceholder')}
                      className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white font-mono outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all uppercase"
                    />
                  </div>

                  {checkoutError && (
                    <p className="text-xs text-red-400 mt-4 text-left">{checkoutError}</p>
                  )}

                  <div className="flex gap-4 mt-8">
                    <button
                      onClick={() => setIsCheckoutOpen(false)}
                      className="flex-1 py-3 rounded-xl border border-outline text-on-surface hover:bg-surface-container/40 transition-colors text-xs font-bold"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={handleSubmitPayment}
                      className="flex-1 py-3 rounded-xl bg-on-surface text-black hover:bg-surface-container transition-colors text-xs font-bold"
                    >
                      Активировать тариф
                    </button>
                  </div>
                </>
              )}

              {checkoutStage === 'processing' && (
                <div className="py-12 flex flex-col items-center justify-center gap-4">
                  <Loader2 className="w-8 h-8 animate-spin text-on-surface" />
                  <p className="text-sm font-mono text-on-surface-variant">{locale === 'en' ? 'Authorizing Payment...' : 'Авторизация платежа...'}</p>
                  <p className="text-xs text-[#636366] max-w-xs leading-relaxed">
                    {locale === 'en' ? 'Please do not close this window. We are verifying the transaction security via 3D-Secure emulation.' : 'Пожалуйста, не закрывайте окно. Мы проверяем безопасность транзакции через 3D-Secure эмуляцию.'}
                  </p>
                </div>
              )}

              {checkoutStage === 'success' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                  className="py-12 flex flex-col items-center justify-center gap-6 relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-3xl -z-10 rounded-full" />
                  
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, rotate: 360 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
                    className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 p-[2px] shadow-[0_0_40px_rgba(99,102,241,0.5)]"
                  >
                    <div className="w-full h-full bg-surface rounded-full flex items-center justify-center">
                      <Check className="w-10 h-10 text-indigo-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.8)]" strokeWidth={3} />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-center"
                  >
                    <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 font-clash mb-3">
                      {locale === 'en' ? 'Congratulations!' : 'Поздравляем!'}
                    </h3>
                    <p className="text-sm text-on-background max-w-sm mx-auto leading-relaxed font-medium">
                      Тариф <span className="font-bold text-indigo-400 uppercase tracking-widest">{selectedUpgradePlan}</span>{locale === 'en' ? ' successfully activated.' : ' успешно активирован.'}
                      <br/>
                      <span className="text-xs text-on-surface-variant mt-2 block">
                        {locale === 'en' ? 'Discover new AI learning possibilities. Welcome to the next level.' : 'Откройте для себя новые возможности обучения с ИИ. Добро пожаловать на новый уровень.'}
                      </span>
                    </p>
                  </motion.div>

                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleFinishUpgrade}
                    className="w-full mt-4 py-4 rounded-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 text-on-surface hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] transition-all flex justify-center items-center gap-2"
                  >
                    <Sparkles className="w-5 h-5 fill-current" />
                    Начать обучение
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {isCancelModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!cancelling) setIsCancelModalOpen(false);
              }}
              className="absolute inset-0 bg-black/75 backdrop-blur-md"
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="relative bg-surface border border-outline w-full max-w-md rounded-[2rem] p-8 shadow-2xl z-10 text-center overflow-hidden"
            >
              {cancelling ? (
                <div className="py-12 flex flex-col items-center justify-center gap-4">
                  <Loader2 className="w-8 h-8 animate-spin text-on-surface" />
                  <p className="text-sm font-mono text-on-surface-variant">{locale === 'en' ? 'Cancelling Subscription...' : 'Отмена подписки...'}</p>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <X className="w-5 h-5" strokeWidth={2} />
                  </div>
                  <h3 className="text-xl font-bold text-on-surface mb-2 font-clash">
                    {locale === 'en' ? 'Are you sure you want to cancel your subscription?' : 'Вы уверены, что хотите отменить подписку?'}
                  </h3>
                  <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">
                    {locale === 'en' ? 'You will lose access to all Pro features, including unlimited course generation (only 1 active will remain), AI Mentor session memory, expert leagues, and PDF certificates.' : 'Вы потеряете доступ ко всем Pro-возможностям, включая безлимитную генерацию курсов (останется только 1 активный), память сессий AI-ментора, экспертные лиги и PDF-сертификаты.'}
                  </p>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setIsCancelModalOpen(false)}
                      className="flex-1 py-3 rounded-xl bg-on-surface text-black hover:bg-surface-container transition-colors text-xs font-bold"
                    >
                      Назад
                    </button>
                    <button
                      onClick={handleCancelSubscription}
                      className="flex-1 py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors text-xs font-bold"
                    >
                      Подтвердить
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
