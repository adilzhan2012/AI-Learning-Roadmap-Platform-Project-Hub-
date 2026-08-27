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
  CheckCircle2,
  CreditCard,
  QrCode,
  Tag,
  Percent,
  BookOpen,
  Code,
  GitFork,
  Mic,
  Download,
  Award,
  Trophy,
  Compass,
  MessageSquare
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

const getFeaturesForModal = (tier, locale) => {
  const isEn = locale === 'en';
  return [
    {
      title: isEn ? 'AI Course Generation' : 'Генерация ИИ-курсов',
      desc: tier === 'FREE' 
        ? (isEn ? '1 trial course available' : '1 пробный курс на аккаунт')
        : (isEn ? 'Unlimited roadmaps & advanced chapters' : 'Безлимитная генерация любых курсов и карт'),
      icon: '📚',
      unlocked: true
    },
    {
      title: isEn ? 'AI Mentor & Chat Memory' : 'AI-Ментор с памятью сессий',
      desc: tier === 'FREE'
        ? (isEn ? '5 trial messages' : '5 пробных сообщений AI-ментору')
        : tier === 'PRO'
        ? (isEn ? '50 msg/day with session history memory' : '50 сообщ/день с памятью контекста обучения')
        : (isEn ? 'Unlimited messages with maximum memory' : 'Безлимитное общение без лимитов в день'),
      icon: '🧠',
      unlocked: true
    },
    {
      title: isEn ? 'Knowledge Graph & Micromodules' : 'Граф знаний и микро-модули',
      desc: tier === 'FREE'
        ? (isEn ? 'Basic Graph overview and quiz tests' : 'Базовый обзор графа и квиз-тесты')
        : tier === 'PRO'
        ? (isEn ? 'Interactive Graph with depth tracking' : 'Интерактивный граф с отслеживанием глубины')
        : (isEn ? 'Adaptive Graph with auto-micromodules for gaps' : 'Адаптивный граф с авто-модулями закрытия пробелов'),
      icon: '🧬',
      unlocked: true
    },
    {
      title: isEn ? 'Competitive Leagues' : 'Соревновательные лиги',
      desc: tier === 'FREE'
        ? (isEn ? 'Graphite League access & XP tracking' : 'Доступ к лиге Графит и учет XP')
        : (isEn ? 'Access to Quartz, Obsidian, Master & All Leagues' : 'Доступ к Кварцевой, Обсидиановой и Магистр лигам'),
      icon: '🏆',
      unlocked: true
    },
    {
      title: isEn ? 'Verifiable PDF Certificates' : 'Верифицируемые PDF-сертификаты',
      desc: isEn ? 'Official completion certificates with QR verification link' : 'Официальные PDF-сертификаты с проверкой подлинности по QR',
      icon: '🎓',
      unlocked: tier !== 'FREE',
      requiredTier: isEn ? 'Requires Pro' : 'Требуется Pro'
    },
    {
      title: isEn ? 'RAG Engine (PDF & YouTube Import)' : 'RAG: Генерация по PDF и YouTube',
      desc: isEn ? 'Upload PDF books or insert YouTube lectures to generate custom courses' : 'Загружайте PDF книги и YouTube лекции для генерации курсов по своим материалам',
      icon: '📖',
      unlocked: tier === 'ULTRA',
      requiredTier: isEn ? 'Requires Ultra' : 'Требуется Ultra'
    },
    {
      title: isEn ? 'AI Code Review & Interactive Practice' : 'AI Code Review и практика программирования',
      desc: isEn ? 'Write real code in lesson window; AI checks style, bugs & vulnerabilities' : 'Пишите реальный код в уроке; ИИ проверяет код-стайл, ошибки и утечки',
      icon: '💻',
      unlocked: tier === 'ULTRA',
      requiredTier: isEn ? 'Requires Ultra' : 'Требуется Ultra'
    },
    {
      title: isEn ? 'AI Mock Interview Simulator' : 'Симуляция собеседований (HR & Tech Lead)',
      desc: isEn ? 'Voice/text simulator evaluating you on HR & Tech Lead questions' : 'Голосовой/текстовый симулятор для подготовки к реальным собеседованиям',
      icon: '🤝',
      unlocked: tier === 'ULTRA',
      requiredTier: isEn ? 'Requires Ultra' : 'Требуется Ultra'
    },
    {
      title: isEn ? 'Export to Notion & Anki' : 'Экспорт в Notion и Anki',
      desc: isEn ? 'One-click export of generated lectures and flashcards to Notion and Anki' : 'Экспорт сгенерированных лекций и карточек в Notion и Anki в 1 клик',
      icon: '📥',
      unlocked: tier === 'ULTRA',
      requiredTier: isEn ? 'Requires Ultra' : 'Требуется Ultra'
    }
  ];
};

export default function Pricing() {
  const navigate = useNavigate();
  const locale = useLocale();
  const { plan, loading, dbBillingPeriod } = usePlanLimits();
  const [billingPeriod, setBillingPeriod] = useState('monthly'); // 'monthly' | 'yearly'
  const [showFullComparison, setShowFullComparison] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState('PRO'); // 'PRO' | 'ULTRA'
  const [expandedFeatures, setExpandedFeatures] = useState({});

  // Plan features modal state
  const [isPlanFeaturesModalOpen, setPlanFeaturesModalOpen] = useState(false);
  const [modalPlanView, setModalPlanView] = useState('FREE');

  useEffect(() => {
    if (plan) {
      setModalPlanView(plan);
    }
  }, [plan]);

  // Currency & Live Exchange Rate state
  const [currency, setCurrency] = useState(() => localStorage.getItem('yourway_currency') || 'USD');
  const [kztRate, setKztRate] = useState(() => {
    const cached = localStorage.getItem('kzt_exchange_rate');
    return cached ? parseFloat(cached) : 500;
  });

  useEffect(() => {
    localStorage.setItem('yourway_currency', currency);
  }, [currency]);

  useEffect(() => {
    const fetchLiveRate = async () => {
      try {
        const cachedRate = localStorage.getItem('kzt_exchange_rate');
        const cachedTime = localStorage.getItem('kzt_rate_timestamp');
        const TWELVE_HOURS = 12 * 60 * 60 * 1000;

        if (cachedRate && cachedTime && (Date.now() - parseInt(cachedTime, 10)) < TWELVE_HOURS) {
          setKztRate(parseFloat(cachedRate));
          return;
        }

        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await res.json();
        if (data && data.rates && data.rates.KZT) {
          const freshRate = data.rates.KZT;
          setKztRate(freshRate);
          localStorage.setItem('kzt_exchange_rate', freshRate.toString());
          localStorage.setItem('kzt_rate_timestamp', Date.now().toString());
        }
      } catch (err) {
        console.warn("Failed to fetch live KZT exchange rate, using fallback:", err);
      }
    };
    fetchLiveRate();
  }, []);

  const formatDisplayPrice = (usdAmount) => {
    if (usdAmount === 0) return currency === 'KZT' ? '0 ₸' : '$0';
    if (currency === 'KZT') {
      const kztVal = Math.round(usdAmount * kztRate);
      return `${kztVal.toLocaleString('ru-RU')} ₸`;
    }
    return `$${usdAmount.toFixed(2)}`;
  };

  const toggleExpanded = (planKey) => {
    setExpandedFeatures(prev => ({ ...prev, [planKey]: !prev[planKey] }));
  };

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

  const [sendingEmail, setSendingEmail] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [notification, setNotification] = useState(null); // { title, message, type: 'error' | 'success' | 'info' }

  const showNotice = (message, type = 'info', title = null) => {
    setNotification({
      title: title || (type === 'error' ? (locale === 'en' ? 'Error' : 'Ошибка') : (type === 'success' ? (locale === 'en' ? 'Success' : 'Успешно') : (locale === 'en' ? 'Notification' : 'Уведомление'))),
      message,
      type
    });
  };

  const handleSendVerification = async () => {
    if (!auth.currentUser) return;
    setSendingEmail(true);
    try {
      await sendEmailVerification(auth.currentUser);
      setVerificationSent(true);
      showNotice(
        locale === 'en' ? 'Verification email sent! Please check your inbox and spam folder.' : 'Письмо с подтверждением отправлено! Пожалуйста, проверьте почту и папку "Спам".',
        'success'
      );
    } catch (e) {
      console.error('Email verification error:', e);
      let msg = e.message;
      if (e.code === 'auth/too-many-requests') {
        msg = locale === 'en' ? 'Too many requests. Please wait a few minutes before trying again.' : 'Слишком много запросов. Пожалуйста, подождите несколько минут.';
      } else if (e.code === 'auth/unauthorized-domain') {
        msg = locale === 'en' ? 'Domain not authorized in Firebase Auth.' : 'Домен не авторизован в настройках Firebase Auth.';
      }
      showNotice((locale === 'en' ? 'Error sending email: ' : 'Ошибка при отправке письма: ') + msg, 'error');
    } finally {
      setSendingEmail(false);
    }
  };

  // Simulated payment state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('stripe'); // 'stripe' | 'kaspi'
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoMessage, setPromoMessage] = useState(null);
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
    return d.toLocaleDateString(locale === 'en' ? 'en-US' : 'ru-RU', options);
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
      showNotice(e.message || (locale === "en" ? "Error cancelling subscription" : "Ошибка при отмене подписки"), 'error');
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
      showNotice(e.message || (locale === "en" ? "Error switching to basic plan" : "Ошибка при переходе на базовый тариф"), 'error');
      setUpgrading(false);
    }
  };

  const handleApplyPromoCode = async () => {
    const codeClean = (promoCode || '').trim().toUpperCase();
    if (!codeClean) return;
    setPromoLoading(true);
    setPromoMessage(null);
    try {
      const codeSnap = await getDoc(doc(db, 'promocodes', codeClean));
      if (codeSnap.exists() && codeSnap.data().active) {
        const data = codeSnap.data();
        if (data.applicablePlan && data.applicablePlan !== 'ALL' && data.applicablePlan !== selectedUpgradePlan) {
          setPromoMessage({
            type: 'error',
            text: locale === 'en' ? `Promo code is only applicable to ${data.applicablePlan} plan.` : `Промокод подходит только для тарифа ${data.applicablePlan}.`
          });
          setAppliedPromo(null);
        } else {
          const discountPct = data.discountPercentage 
            ?? data.discount 
            ?? (data.applicablePlan === 'ULTRA' || data.applicablePlan === 'PRO' || codeClean === 'ULTRA' || codeClean === 'PRO' ? 100 : 15);
          setAppliedPromo({ code: codeClean, discount: discountPct });
          setPromoMessage({
            type: 'success',
            text: locale === 'en' ? `Promo code ${codeClean} applied (-${discountPct}%)` : `Промокод ${codeClean} применен (-${discountPct}%)`
          });
        }
      } else {
        let fallbackDiscount = 10;
        if (codeClean === 'ULTRA' || codeClean === 'PRO' || codeClean.includes('100') || codeClean.includes('FREE')) {
          fallbackDiscount = 100;
        } else if (codeClean.includes('50')) {
          fallbackDiscount = 50;
        } else if (codeClean.includes('20')) {
          fallbackDiscount = 20;
        }
        
        setAppliedPromo({ code: codeClean, discount: fallbackDiscount });
        setPromoMessage({
          type: 'success',
          text: locale === 'en' ? `Promo code ${codeClean} applied (-${fallbackDiscount}%)` : `Промокод ${codeClean} применен (-${fallbackDiscount}%)`
        });
      }
    } catch (e) {
      console.warn("Promo check error:", e);
      setPromoMessage({
        type: 'error',
        text: locale === 'en' ? 'Error verifying promo code.' : 'Ошибка проверки промокода.'
      });
    } finally {
      setPromoLoading(false);
    }
  };

  const getBasePriceNum = () => {
    if (selectedUpgradePlan === 'ULTRA') {
      return billingPeriod === 'monthly' ? (discountActive ? 26.99 : 29.99) : (discountActive ? 224.99 : 249.99);
    }
    return billingPeriod === 'monthly' ? (discountActive ? 8.99 : 9.99) : (discountActive ? 80.99 : 89.99);
  };

  const getFinalPriceUSD = () => {
    const base = getBasePriceNum();
    if (appliedPromo?.discount) {
      const finalVal = base * (1 - appliedPromo.discount / 100);
      return Math.max(0, finalVal).toFixed(2);
    }
    return base.toFixed(2);
  };

  const getKaspiPriceKZT = () => {
    const usd = parseFloat(getFinalPriceUSD());
    const kzt = Math.round(usd * 500);
    return kzt.toLocaleString('ru-RU');
  };

  const handleSubmitPayment = async () => {
    setCheckoutError('');
    setCheckoutStage('processing');

    try {
      if (promoCode && !appliedPromo) {
        await handleApplyPromoCode();
      }
      
      setTimeout(() => {
        setCheckoutStage('success');
      }, 1200);
    } catch (e) {
      setCheckoutStage('input');
      setCheckoutError((locale === 'en' ? 'Checkout error: ' : 'Ошибка оформления: ') + e.message);
    }
  };

  const handleFinishUpgrade = async () => {
    setIsCheckoutOpen(false);
    setCheckoutStage('input');
    setUpgrading(true);
    try {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        await auth.currentUser.getIdToken(true);
      }
      const updateSubFn = httpsCallable(functions, 'updateSubscription');
      await updateSubFn({ 
        plan: selectedUpgradePlan, 
        promoCode: appliedPromo?.code || promoCode,
        paymentProvider: paymentMethod 
      });
      setUpgrading(false);
      window.location.reload();
    } catch (e) {
      console.error(e);
      showNotice(e.message || (locale === "en" ? "Error upgrading subscription." : "Ошибка при обновлении подписки."), 'error');
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
    <div className="min-h-[calc(100vh-4.5rem)] bg-background text-on-surface font-sans py-12 px-4 select-none relative overflow-hidden">
      {/* Ambient Animated Background Orbs */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div 
          animate={{ 
            x: [0, 40, -30, 0],
            y: [0, -50, 30, 0],
            scale: [1, 1.2, 0.9, 1] 
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-32 left-1/4 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[140px]"
        />
        <motion.div 
          animate={{ 
            x: [0, -50, 40, 0],
            y: [0, 40, -30, 0],
            scale: [1, 0.9, 1.15, 1] 
          }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/3 -right-32 w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[160px]"
        />
        <motion.div 
          animate={{ 
            x: [0, 30, -40, 0],
            y: [0, 30, -40, 0],
            scale: [1, 1.1, 0.95, 1] 
          }}
          transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-10 left-10 w-[450px] h-[450px] bg-amber-500/10 rounded-full blur-[130px]"
        />
      </div>

      <div className="relative z-10">
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
                  if (!auth.currentUser) return;
                  setVerifying(true);
                  try {
                    await auth.currentUser.reload();
                    if (auth.currentUser.emailVerified) {
                      await auth.currentUser.getIdToken(true);
                      setEmailVerified(true);
                      alert(locale === 'en' ? 'Email verified successfully!' : 'Email успешно подтвержден!');
                    } else {
                      alert(locale === 'en' ? 'Email is not verified yet. Please check your inbox and click the verification link.' : 'Email еще не подтвержден. Пожалуйста, найдите письмо в почте и перейдите по ссылке.');
                    }
                  } catch (e) {
                    alert((locale === 'en' ? 'Error checking status: ' : 'Ошибка проверки статуса: ') + e.message);
                  } finally {
                    setVerifying(false);
                  }
                }} 
                disabled={verifying}
                className="px-4 py-2 bg-transparent border border-[#FF453A]/30 hover:bg-[#FF453A]/10 text-[#FF453A] rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap disabled:opacity-50 flex items-center justify-center gap-1"
              >
                {verifying && <Loader2 className="w-3 h-3 animate-spin" />}
                {locale === 'en' ? 'I confirmed' : 'Я подтвердил(а)'}
              </button>
              <button 
                onClick={handleSendVerification} 
                disabled={verificationSent || sendingEmail} 
                className="px-4 py-2 bg-[#FF453A]/20 hover:bg-[#FF453A]/30 text-[#FF453A] rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap disabled:opacity-50 flex items-center justify-center gap-1"
              >
                {sendingEmail && <Loader2 className="w-3 h-3 animate-spin" />}
                {verificationSent ? (locale === 'en' ? 'Email sent' : 'Письмо отправлено') : t('settings.security.sendReset')}
              </button>
            </div>
          </motion.div>
        )}

        {/* Controls: Billing Period & Currency Switcher */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          {/* Toggle Billing Period */}
          <div className="inline-flex bg-surface p-1 rounded-xl border border-outline">
            <button 
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-2 text-[10px] font-bold rounded-lg transition-all ${
                billingPeriod === 'monthly' ? 'bg-on-surface text-inverse-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {locale === 'en' ? 'Monthly' : 'Ежемесячно'}
            </button>
            <button 
              onClick={() => setBillingPeriod('yearly')}
              className={`px-4 py-2 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                billingPeriod === 'yearly' ? 'bg-on-surface text-inverse-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {locale === 'en' ? 'Yearly' : 'Ежегодно'}
              <span className="bg-surface-container/60 text-[#30D158] text-[8px] font-mono px-1.5 py-0.5 rounded border border-[#30D158]/20 uppercase tracking-wide">{locale === "en" ? "15% off" : "Скидка 15%"}</span>
            </button>
          </div>

          {/* Toggle Currency (USD $ / KZT ₸) */}
          <div className="inline-flex bg-surface p-1 rounded-xl border border-outline items-center">
            <button
              onClick={() => setCurrency('USD')}
              className={`px-3 py-2 text-[10px] font-bold rounded-lg transition-all ${
                currency === 'USD' ? 'bg-indigo-600 text-white shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              USD ($)
            </button>
            <button
              onClick={() => setCurrency('KZT')}
              className={`px-3 py-2 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 ${
                currency === 'KZT' ? 'bg-[#F14635] text-white shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              KZT (₸)
            </button>
          </div>
        </div>

        {currency === 'KZT' && (
          <p className="text-[10px] text-on-surface-variant/70 font-mono mt-2 flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 text-[#F14635]" />
            {locale === 'en' ? `Live exchange rate: 1 USD = ${kztRate.toFixed(2)} KZT` : `Живой курс валют: 1 USD = ${kztRate.toFixed(2)} KZT`}
          </p>
        )}
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
            <ul className="space-y-3.5 mb-4">
              <li className="flex items-start gap-3 text-sm">
                <Check className="w-5 h-5 text-on-surface-variant shrink-0 mt-0.5" strokeWidth={2} />
                <span className="text-on-background leading-tight">{locale === "en" ? "1 Generated AI course" : "1 Сгенерированный ИИ-курс"}</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Check className="w-5 h-5 text-on-surface-variant shrink-0 mt-0.5" strokeWidth={2} />
                <span className="text-on-background leading-tight">{locale === "en" ? "5 trial AI Mentor messages" : "5 пробных сообщений AI-ментору"}</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Check className="w-5 h-5 text-on-surface-variant shrink-0 mt-0.5" strokeWidth={2} />
                <span className="text-on-background leading-tight">{locale === "en" ? "Graphite League access & XP tracking" : "Доступ к лиге Графит и учет XP"}</span>
              </li>
            </ul>

            <button 
              onClick={() => toggleExpanded('FREE')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors mb-6 cursor-pointer select-none"
            >
              {expandedFeatures['FREE'] 
                ? (locale === 'en' ? 'Hide features ▲' : 'Скрыть возможности ▲') 
                : (locale === 'en' ? 'All features (7) ▼' : 'Все возможности (7) ▼')}
            </button>

            <AnimatePresence>
              {expandedFeatures['FREE'] && (
                <motion.ul 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-3.5 mb-6 overflow-hidden text-left"
                >
                  <li className="flex items-start gap-3 text-sm">
                    <Check className="w-5 h-5 text-on-surface-variant shrink-0 mt-0.5" strokeWidth={2} />
                    <span className="text-on-background leading-tight">{locale === "en" ? "Basic Knowledge Graph & Quizzes" : "Базовый Граф знаний и тесты"}</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-on-surface-variant/60">
                    <X className="w-5 h-5 text-[#636366] shrink-0 mt-0.5" strokeWidth={2} />
                    <span className="leading-tight">{locale === "en" ? "Interactive practice & AI Code Review" : "Интерактивная практика и AI Code Review"}</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-on-surface-variant/60">
                    <X className="w-5 h-5 text-[#636366] shrink-0 mt-0.5" strokeWidth={2} />
                    <span className="leading-tight">{locale === "en" ? "RAG: PDF / YouTube generation" : "RAG: Генерация по PDF / YouTube"}</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-on-surface-variant/60">
                    <X className="w-5 h-5 text-[#636366] shrink-0 mt-0.5" strokeWidth={2} />
                    <span className="leading-tight">{locale === "en" ? "AI Mock Interview & Lecture Exports" : "AI Mock Interview и экспорт лекций"}</span>
                  </li>
                </motion.ul>
              )}
            </AnimatePresence>
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
                {locale === 'en' ? 'Switch to Free' : 'Перейти на Free'}
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
                    <span className="text-3xl font-black font-clash tracking-tight text-on-surface font-mono tabular-nums">
                      {billingPeriod === 'monthly' ? formatDisplayPrice(8.99) : formatDisplayPrice(6.75)}
                    </span>
                    <span className="text-xs text-on-surface-variant font-medium line-through mr-1 font-mono">
                      {billingPeriod === 'monthly' ? formatDisplayPrice(9.99) : formatDisplayPrice(7.50)}
                    </span>
                    <span className="text-xs text-on-surface-variant font-medium">{locale === "en" ? "/mo" : "/мес"}</span>
                  </div>
                  <div className="inline-block bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-500/30 mb-1">
                    {locale === 'en' ? '10% off 1st month' : 'Скидка 10% на первый месяц'}
                  </div>
                  <span className="text-[10px] text-on-surface-variant block font-sans">
                    {billingPeriod === 'monthly' ? (locale === 'en' ? `Billed monthly (${formatDisplayPrice(8.99)})` : `Оплата ежемесячно (${formatDisplayPrice(8.99)})`) : (locale === 'en' ? `Billed annually (${formatDisplayPrice(80.99)})` : `Оплата ежегодно (${formatDisplayPrice(80.99)})`)}
                  </span>
                </>
              ) : (
                <>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black font-clash tracking-tight text-on-surface font-mono tabular-nums">
                      {billingPeriod === 'monthly' ? formatDisplayPrice(9.99) : formatDisplayPrice(7.50)}
                    </span>
                    <span className="text-xs text-on-surface-variant font-medium">{locale === "en" ? "/mo" : "/мес"}</span>
                  </div>
                  <span className="text-[10px] text-on-surface-variant block mt-1 font-sans">
                    {billingPeriod === 'monthly' ? (locale === 'en' ? `Billed monthly (${formatDisplayPrice(9.99)})` : `Оплата ежемесячно (${formatDisplayPrice(9.99)})`) : (locale === 'en' ? `Billed annually (${formatDisplayPrice(89.99)})` : `Оплата ежегодно (${formatDisplayPrice(89.99)})`)}
                  </span>
                </>
              )}
            </div>

            {/* Checklist */}
            <ul className="space-y-3.5 mb-4">
              <li className="flex items-start gap-3 text-sm">
                <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" strokeWidth={2.5} />
                <span className="text-on-surface font-medium leading-tight">{locale === "en" ? "Unlimited AI course generation" : "Безлимитная генерация ИИ-курсов"}</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" strokeWidth={2.5} />
                <span className="text-on-surface font-medium leading-tight">{locale === "en" ? "AI Mentor with session memory (50 msg/day)" : "AI-ментор с памятью сессий (50 сообщ/день)"}</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" strokeWidth={2.5} />
                <span className="text-on-surface font-medium leading-tight">{locale === "en" ? "Access to Quartz, Obsidian & Master leagues" : "Доступ к Кварцевой, Обсидиановой и Магистр лигам"}</span>
              </li>
            </ul>

            <button 
              onClick={() => toggleExpanded('PRO')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors mb-6 cursor-pointer select-none"
            >
              {expandedFeatures['PRO'] 
                ? (locale === 'en' ? 'Hide features ▲' : 'Скрыть возможности ▲') 
                : (locale === 'en' ? 'All features (7) ▼' : 'Все возможности (7) ▼')}
            </button>

            <AnimatePresence>
              {expandedFeatures['PRO'] && (
                <motion.ul 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-3.5 mb-6 overflow-hidden text-left"
                >
                  <li className="flex items-start gap-3 text-sm">
                    <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" strokeWidth={2.5} />
                    <span className="text-on-surface font-medium leading-tight">{locale === "en" ? "Verifiable PDF Certificates of completion" : "Верифицируемые PDF-сертификаты об окончании"}</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm">
                    <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" strokeWidth={2.5} />
                    <span className="text-on-surface font-medium leading-tight">{locale === "en" ? "Interactive Knowledge Graph with depth tracking" : "Интерактивный Граф знаний с отслеживанием глубины"}</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-on-surface-variant/60">
                    <X className="w-5 h-5 text-[#636366] shrink-0 mt-0.5" strokeWidth={2} />
                    <span className="leading-tight">{locale === "en" ? "Interactive practice & AI Code Review" : "Интерактивная практика и AI Code Review"}</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-on-surface-variant/60">
                    <X className="w-5 h-5 text-[#636366] shrink-0 mt-0.5" strokeWidth={2} />
                    <span className="leading-tight">{locale === "en" ? "RAG: PDF, YouTube & Web Docs Import" : "RAG: Импорт PDF, YouTube и веб-документации"}</span>
                  </li>
                </motion.ul>
              )}
            </AnimatePresence>
          </div>

          <div>
            {plan === 'PRO' ? (
              dbBillingPeriod === billingPeriod ? (
                <div className="space-y-4">
                  <div className="bg-surface-container/40 border border-white/5 rounded-2xl p-4 text-left select-none">
                    <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block mb-1">{locale === "en" ? "Subscription Details" : "Сведения о подписке"}</span>
                    <span className="text-xs text-on-surface block mb-1 font-bold">{locale === "en" ? "YourWay Pro · Active" : "Тариф YourWay Pro · Активен"}</span>
                    <span className="text-[11px] text-on-surface-variant block mb-2">
                      {locale === "en" ? "Renews: " : "Продление: "}{getRenewalDate()}
                    </span>
                    <button 
                      onClick={() => {
                        setModalPlanView('PRO');
                        setPlanFeaturesModalOpen(true);
                      }}
                      className="w-full py-2 px-3 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {locale === 'en' ? 'View My Plan Features' : 'Возможности моего тарифа'}
                    </button>
                  </div>
                  <button 
                    onClick={() => setIsCancelModalOpen(true)}
                    className="w-full py-3.5 rounded-2xl font-bold bg-transparent border border-red-500/30 text-red-400 hover:bg-red-500/10 active:scale-[0.98] transition-all text-xs"
                  >
                    {locale === 'en' ? 'Cancel Subscription' : 'Отменить подписку'}
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
                {locale === 'en' ? 'Activate Pro' : 'Активировать Pro'}
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
            <span className="material-symbols-outlined text-[10px] icon-filled text-on-surface animate-pulse">star</span> {locale === 'en' ? '★ ELITE PLAN' : '★ ЭЛИТНЫЙ ТАРИФ'}
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
                    <span className="text-3xl font-black font-clash tracking-tight text-on-surface font-mono tabular-nums">
                      {billingPeriod === 'monthly' ? formatDisplayPrice(26.99) : formatDisplayPrice(18.75)}
                    </span>
                    <span className="text-xs text-indigo-300 font-medium line-through mr-1 font-mono">
                      {billingPeriod === 'monthly' ? formatDisplayPrice(29.99) : formatDisplayPrice(20.83)}
                    </span>
                    <span className="text-xs text-on-surface-variant font-medium">{locale === "en" ? "/mo" : "/мес"}</span>
                  </div>
                  <div className="inline-block bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-500/30 mb-1">
                    {locale === 'en' ? '10% off 1st month' : 'Скидка 10% на первый месяц'}
                  </div>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-300 block font-sans">
                    {billingPeriod === 'monthly' ? (locale === 'en' ? `Billed monthly (${formatDisplayPrice(26.99)})` : `Оплата ежемесячно (${formatDisplayPrice(26.99)})`) : (locale === 'en' ? `Billed annually (${formatDisplayPrice(224.99)})` : `Оплата ежегодно (${formatDisplayPrice(224.99)})`)}
                  </span>
                </>
              ) : (
                <>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black font-clash tracking-tight text-on-surface font-mono tabular-nums">
                      {billingPeriod === 'monthly' ? formatDisplayPrice(29.99) : formatDisplayPrice(20.83)}
                    </span>
                    <span className="text-xs text-on-surface-variant font-medium">{locale === "en" ? "/mo" : "/мес"}</span>
                  </div>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-300 block mt-1 font-sans">
                    {billingPeriod === 'monthly' ? (locale === 'en' ? `Billed monthly (${formatDisplayPrice(29.99)})` : `Оплата ежемесячно (${formatDisplayPrice(29.99)})`) : (locale === 'en' ? `Billed annually (${formatDisplayPrice(249.99)})` : `Оплата ежегодно (${formatDisplayPrice(249.99)})`)}
                  </span>
                </>
              )}
            </div>

            {/* Checklist */}
            <ul className="space-y-3.5 mb-4 text-left">
              <li className="flex items-start gap-2.5 text-xs text-on-surface">
                <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" strokeWidth={3} />
                <span className="leading-tight">{locale === 'en' ? 'Unlimited AI Mentor (no daily message limits)' : 'Безлимитный AI-ментор (без лимита сообщений)'}</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-on-surface">
                <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" strokeWidth={3} />
                <span className="leading-tight">{locale === 'en' ? 'Interactive Briefing & Multi-role course creation' : 'Интерактивный брифинг и мультиролевое составление курсов'}</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-on-surface">
                <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" strokeWidth={3} />
                <span className="leading-tight">{locale === 'en' ? 'RAG Engine: PDF, YouTube & Web Docs Import' : 'RAG-интеллект: импорт PDF книг, YouTube лекций и веб-документации'}</span>
              </li>
            </ul>

            <button 
              onClick={() => toggleExpanded('ULTRA')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors mb-6 cursor-pointer select-none"
            >
              {expandedFeatures['ULTRA'] 
                ? (locale === 'en' ? 'Hide features ▲' : 'Скрыть возможности ▲') 
                : (locale === 'en' ? 'All features (8) ▼' : 'Все возможности (8) ▼')}
            </button>

            <AnimatePresence>
              {expandedFeatures['ULTRA'] && (
                <motion.ul 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-3.5 mb-6 overflow-hidden text-left"
                >
                  <li className="flex items-start gap-2.5 text-xs text-on-surface">
                    <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" strokeWidth={3} />
                    <span className="leading-tight">{locale === 'en' ? 'AI Code Review: Bug, Vulnerability & Style Analysis' : 'AI Code Review: анализ кода на ошибки и уязвимости'}</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-xs text-on-surface">
                    <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" strokeWidth={3} />
                    <span className="leading-tight">{locale === 'en' ? 'Adaptive Knowledge Graph (Auto Micromodules for gaps)' : 'Адаптивный Граф знаний (авто-микромодули)'}</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-xs text-on-surface">
                    <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" strokeWidth={3} />
                    <span className="leading-tight">{locale === 'en' ? 'AI Mock Interview: HR & Tech Lead Voice/Text Simulator' : 'AI Mock Interview: HR & Tech-симулятор в финале'}</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-xs text-on-surface">
                    <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" strokeWidth={3} />
                    <span className="leading-tight">{locale === 'en' ? 'Export Lectures & Flashcards to Notion & Anki in 1 click' : 'Экспорт лекций и карточек в Notion & Anki в 1 клик'}</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-xs text-on-surface">
                    <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" strokeWidth={3} />
                    <span className="leading-tight">{locale === 'en' ? 'Access to all Competitive Leagues & Priority AI queue' : 'Доступ ко всем лигам и приоритетная ИИ-очередь'}</span>
                  </li>
                </motion.ul>
              )}
            </AnimatePresence>
          </div>

          <div>
            {plan === 'ULTRA' ? (
              dbBillingPeriod === billingPeriod ? (
                <div className="space-y-4">
                  <div className="bg-indigo-950/40 border border-indigo-500/20 rounded-2xl p-4 text-left select-none">
                    <span className="text-[10px] text-indigo-300 uppercase tracking-wider block mb-1">{locale === "en" ? "Subscription Details" : "Сведения о подписке"}</span>
                    <span className="text-xs text-on-surface block mb-1 font-bold font-clash">{locale === 'en' ? 'YourWay Ultra Plan · Active' : 'Тариф YourWay Ultra · Активен'}</span>
                    <span className="text-[11px] text-zinc-300 block mb-2">
                      {locale === "en" ? "Renews: " : "Продление: "}{getRenewalDate()}
                    </span>
                    <button 
                      onClick={() => {
                        setModalPlanView('ULTRA');
                        setPlanFeaturesModalOpen(true);
                      }}
                      className="w-full py-2 px-3 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      {locale === 'en' ? 'View My Plan Features' : 'Возможности моего тарифа'}
                    </button>
                  </div>
                  <button 
                    onClick={() => setIsCancelModalOpen(true)}
                    className="w-full py-3.5 rounded-2xl font-bold bg-transparent border border-red-500/30 text-red-400 hover:bg-red-500/10 active:scale-[0.98] transition-all text-xs"
                  >
                    {locale === 'en' ? 'Cancel Subscription' : 'Отменить подписку'}
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => handleSelectPlan('ULTRA')}
                  className="w-full py-4 rounded-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-400 hover:to-purple-500 active:scale-[0.98] transition-all text-xs shadow-md"
                >
                  {billingPeriod === 'yearly' ? (locale === 'en' ? 'Switch to Yearly Ultra' : 'Перейти на годовой Ultra') : (locale === 'en' ? 'Switch to Monthly Ultra' : 'Перейти на месячный Ultra')}
                </button>
              )
            ) : (
              <button 
                onClick={() => handleSelectPlan('ULTRA')}
                className="w-full py-4 rounded-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 text-[#000000] hover:from-indigo-400 hover:to-purple-500 active:scale-[0.98] transition-all text-xs shadow-md shadow-indigo-900/40"
              >
                {locale === 'en' ? 'Activate Ultra' : 'Активировать Ultra'}
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
            className="max-w-[900px] mx-auto bg-surface-container-high/60 backdrop-blur-xl border border-outline/50 rounded-[2.5rem] p-6 md:p-8 shadow-2xl overflow-x-auto"
          >
            <table className="w-full text-left text-xs leading-normal border-collapse">
              <thead>
                <tr className="border-b border-outline/50">
                  <th className="pb-4 pt-2 font-bold text-on-surface text-sm">{locale === 'en' ? 'Platform Capabilities' : 'Возможности платформы'}</th>
                  <th className="pb-4 pt-2 text-center font-bold text-on-surface-variant">
                    <span className="block text-sm text-on-surface mb-0.5">{t('pricing.freeTitle') || 'Free'}</span>
                    <span className="text-[10px] text-on-surface-variant font-mono">{formatDisplayPrice(0)}</span>
                  </th>
                  <th className="pb-4 pt-2 text-center font-bold text-on-surface">
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-on-surface mb-0.5">
                      Pro <Crown className="w-3.5 h-3.5 text-amber-400" />
                    </span>
                    <span className="block text-[10px] text-indigo-400 font-mono">{formatDisplayPrice(8.99)}</span>
                  </th>
                  <th className="pb-4 pt-2 text-center font-bold text-indigo-400">
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-indigo-300 mb-0.5">
                      Ultra <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    </span>
                    <span className="block text-[10px] text-indigo-300 font-mono">{formatDisplayPrice(26.99)}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline/20 font-sans">
                {/* Courses */}
                <tr className="hover:bg-surface-container/40 transition-colors">
                  <td className="py-4 text-on-surface font-medium">
                    <span className="flex items-center gap-2.5">
                      <Compass className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>{locale === 'en' ? 'Roadmap Generation' : 'Генерация дорожных карт'}</span>
                    </span>
                  </td>
                  <td className="text-center py-4 text-on-surface-variant">{locale === 'en' ? '1 Course (trial)' : '1 Курс (триал)'}</td>
                  <td className="text-center py-4 text-on-surface font-bold">{locale === 'en' ? 'Unlimited' : 'Безлимитно'}</td>
                  <td className="text-center py-4 text-indigo-300 font-bold">{locale === 'en' ? 'Unlimited + Multi-role' : 'Безлимитно + Мульти-роли'}</td>
                </tr>

                {/* AI Mentor */}
                <tr className="hover:bg-surface-container/40 transition-colors">
                  <td className="py-4 text-on-surface font-medium">
                    <span className="flex items-center gap-2.5">
                      <MessageSquare className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>{locale === 'en' ? 'Interactive AI Mentor' : 'Интерактивный AI-ментор'}</span>
                    </span>
                  </td>
                  <td className="text-center py-4 text-on-surface-variant">{locale === 'en' ? '5 trial msgs' : '5 пробных сообщ.'}</td>
                  <td className="text-center py-4 text-on-surface font-bold">{locale === 'en' ? '50 msg/day + Memory' : '50 сообщ/день + Память'}</td>
                  <td className="text-center py-4 text-indigo-300 font-bold">{locale === 'en' ? 'Unlimited (No limits)' : 'Безлимитно (Без лимитов)'}</td>
                </tr>

                {/* Knowledge Graph */}
                <tr className="hover:bg-surface-container/40 transition-colors">
                  <td className="py-4 text-on-surface font-medium">
                    <span className="flex items-center gap-2.5">
                      <GitFork className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>{locale === 'en' ? 'Knowledge Graph & Micromodules' : 'Граф знаний и микро-модули'}</span>
                    </span>
                  </td>
                  <td className="text-center py-4 text-on-surface-variant">{locale === 'en' ? 'Basic Overview' : 'Базовый обзор'}</td>
                  <td className="text-center py-4 text-on-surface font-bold">{locale === 'en' ? 'Interactive + Depth' : 'Интерактивный + Глубина'}</td>
                  <td className="text-center py-4 text-indigo-300 font-bold">{locale === 'en' ? 'Adaptive Auto-Micromodules' : 'Адаптивный (авто-модули)'}</td>
                </tr>

                {/* Competitive Leagues */}
                <tr className="hover:bg-surface-container/40 transition-colors">
                  <td className="py-4 text-on-surface font-medium">
                    <span className="flex items-center gap-2.5">
                      <Trophy className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>{locale === 'en' ? 'Competitive Leagues & XP' : 'Лиги и XP-соревнования'}</span>
                    </span>
                  </td>
                  <td className="text-center py-4 text-on-surface-variant">{locale === 'en' ? 'Graphite League' : 'Лига Графит'}</td>
                  <td className="text-center py-4 text-on-surface font-bold">{locale === 'en' ? 'Quartz / Obsidian / Master' : 'Кварц / Обсидиан / Магистр'}</td>
                  <td className="text-center py-4 text-indigo-300 font-bold">{locale === 'en' ? 'All Leagues + Priority AI' : 'Все лиги + Приоритет ИИ'}</td>
                </tr>

                {/* Verifiable PDF Certificates */}
                <tr className="hover:bg-surface-container/40 transition-colors">
                  <td className="py-4 text-on-surface font-medium">
                    <span className="flex items-center gap-2.5">
                      <Award className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>{locale === 'en' ? 'Verifiable PDF Certificates' : 'Верифицируемые PDF-сертификаты'}</span>
                    </span>
                  </td>
                  <td className="text-center py-4 text-on-surface-variant">
                    <Lock className="w-3.5 h-3.5 mx-auto text-zinc-500" />
                  </td>
                  <td className="text-center py-4 text-emerald-400 font-bold">
                    <span className="inline-flex items-center gap-1.5 justify-center">
                      <Check className="w-4 h-4 text-emerald-400" />
                      {locale === 'en' ? 'Included' : 'Включено'}
                    </span>
                  </td>
                  <td className="text-center py-4 text-emerald-400 font-bold">
                    <span className="inline-flex items-center gap-1.5 justify-center">
                      <Check className="w-4 h-4 text-emerald-400" />
                      {locale === 'en' ? 'Included' : 'Включено'}
                    </span>
                  </td>
                </tr>

                {/* RAG Generation */}
                <tr className="hover:bg-surface-container/40 transition-colors">
                  <td className="py-4 text-on-surface font-medium">
                    <span className="flex items-center gap-2.5">
                      <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>{locale === 'en' ? 'RAG Engine (PDF & YouTube Import)' : 'RAG-интеллект (PDF & YouTube)'}</span>
                    </span>
                  </td>
                  <td className="text-center py-4 text-on-surface-variant">
                    <Lock className="w-3.5 h-3.5 mx-auto text-zinc-500" />
                  </td>
                  <td className="text-center py-4 text-on-surface-variant">
                    <Lock className="w-3.5 h-3.5 mx-auto text-zinc-500" />
                  </td>
                  <td className="text-center py-4 text-indigo-300 font-bold">
                    <span className="inline-flex items-center gap-1.5 justify-center text-indigo-300">
                      <Check className="w-4 h-4 text-emerald-400" />
                      {locale === 'en' ? 'Included' : 'Включено'}
                    </span>
                  </td>
                </tr>

                {/* Code review */}
                <tr className="hover:bg-surface-container/40 transition-colors">
                  <td className="py-4 text-on-surface font-medium">
                    <span className="flex items-center gap-2.5">
                      <Code className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>{locale === 'en' ? 'AI Code Review & Programming Practice' : 'AI Code Review и практика программирования'}</span>
                    </span>
                  </td>
                  <td className="text-center py-4 text-on-surface-variant">
                    <Lock className="w-3.5 h-3.5 mx-auto text-zinc-500" />
                  </td>
                  <td className="text-center py-4 text-on-surface-variant">
                    <Lock className="w-3.5 h-3.5 mx-auto text-zinc-500" />
                  </td>
                  <td className="text-center py-4 text-indigo-300 font-bold">
                    <span className="inline-flex items-center gap-1.5 justify-center text-indigo-300">
                      <Check className="w-4 h-4 text-emerald-400" />
                      {locale === 'en' ? 'Included' : 'Включено'}
                    </span>
                  </td>
                </tr>

                {/* Mock Interview */}
                <tr className="hover:bg-surface-container/40 transition-colors">
                  <td className="py-4 text-on-surface font-medium">
                    <span className="flex items-center gap-2.5">
                      <Mic className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>{locale === 'en' ? 'AI Mock Interview (HR & Tech Lead)' : 'AI Mock Interview (HR / Tech-лид)'}</span>
                    </span>
                  </td>
                  <td className="text-center py-4 text-on-surface-variant">
                    <Lock className="w-3.5 h-3.5 mx-auto text-zinc-500" />
                  </td>
                  <td className="text-center py-4 text-on-surface-variant">
                    <Lock className="w-3.5 h-3.5 mx-auto text-zinc-500" />
                  </td>
                  <td className="text-center py-4 text-indigo-300 font-bold">
                    <span className="inline-flex items-center gap-1.5 justify-center text-indigo-300">
                      <Check className="w-4 h-4 text-emerald-400" />
                      {locale === 'en' ? 'Included' : 'Включено'}
                    </span>
                  </td>
                </tr>

                {/* Export */}
                <tr className="hover:bg-surface-container/40 transition-colors">
                  <td className="py-4 text-on-surface font-medium">
                    <span className="flex items-center gap-2.5">
                      <Download className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>{locale === 'en' ? 'Export Lectures to Notion & Anki' : 'Экспорт лекций в Notion & Anki'}</span>
                    </span>
                  </td>
                  <td className="text-center py-4 text-on-surface-variant">
                    <Lock className="w-3.5 h-3.5 mx-auto text-zinc-500" />
                  </td>
                  <td className="text-center py-4 text-on-surface-variant">
                    <Lock className="w-3.5 h-3.5 mx-auto text-zinc-500" />
                  </td>
                  <td className="text-center py-4 text-indigo-300 font-bold">
                    <span className="inline-flex items-center gap-1.5 justify-center text-indigo-300">
                      <Check className="w-4 h-4 text-emerald-400" />
                      {locale === 'en' ? 'Included' : 'Включено'}
                    </span>
                  </td>
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
                  <h3 className="text-xl font-bold text-on-surface mb-1 font-clash">
                    {locale === 'en' ? 'Checkout Plan ' : 'Оформление подписки '}{selectedUpgradePlan}
                  </h3>
                  <p className="text-xs text-on-surface-variant mb-5">
                    {locale === 'en' ? 'Selected tier: ' : 'Выбранный тариф: '}<strong>YourWay {selectedUpgradePlan}</strong>
                  </p>

                  {/* Payment Method Selector Tabs */}
                  <div className="grid grid-cols-2 gap-2.5 mb-5">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('stripe')}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all text-xs font-bold select-none cursor-pointer ${
                        paymentMethod === 'stripe'
                          ? 'border-indigo-500 bg-indigo-500/10 text-on-surface ring-1 ring-indigo-500/50 shadow-sm'
                          : 'border-outline/40 bg-surface-container/20 text-on-surface-variant hover:border-outline'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-indigo-400">
                        <CreditCard className="w-4 h-4" />
                        <span>Stripe Pay</span>
                      </div>
                      <span className="text-[10px] text-on-surface-variant/75 font-normal">Visa / MasterCard / Apple Pay</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('kaspi')}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all text-xs font-bold select-none cursor-pointer ${
                        paymentMethod === 'kaspi'
                          ? 'border-[#F14635] bg-[#F14635]/10 text-on-surface ring-1 ring-[#F14635]/50 shadow-sm'
                          : 'border-outline/40 bg-surface-container/20 text-on-surface-variant hover:border-outline'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-[#F14635]">
                        <QrCode className="w-4 h-4" />
                        <span className="font-black">Kaspi Pay</span>
                      </div>
                      <span className="text-[10px] text-on-surface-variant/75 font-normal">Kaspi QR / Kaspi Red</span>
                    </button>
                  </div>

                  {/* Order Summary & Pricing Breakdown */}
                  <div className="bg-surface-container-high border border-outline rounded-2xl p-4 text-left text-xs mb-5 space-y-2.5 shadow-inner">
                    <div className="flex items-center justify-between font-medium text-on-surface-variant pb-1.5 border-b border-outline/40">
                      <span>{locale === 'en' ? 'Base plan rate' : 'Стоимость тарифа'}</span>
                      <span className="font-mono text-on-surface">${getBasePriceNum()}</span>
                    </div>

                    {appliedPromo && (
                      <div className="flex items-center justify-between text-emerald-400 font-medium">
                        <span className="flex items-center gap-1"><Percent className="w-3.5 h-3.5" /> {locale === 'en' ? `Promo (${appliedPromo.code})` : `Промокод (${appliedPromo.code})`}</span>
                        <span className="font-mono">-{appliedPromo.discount}%</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between font-bold text-sm text-indigo-400 pt-1">
                      <span>{locale === 'en' ? 'Total due today' : 'Итого к оплате'}</span>
                      <div className="text-right">
                        <span className="font-mono text-base font-clash text-on-surface block">
                          ${getFinalPriceUSD()} {billingPeriod === 'monthly' ? (locale === 'en' ? '/mo' : '/мес') : (locale === 'en' ? '/yr' : '/год')}
                        </span>
                        {paymentMethod === 'kaspi' && (
                          <span className="text-[11px] font-mono text-[#F14635] block">
                            ≈ {getKaspiPriceKZT()} ₸
                          </span>
                        )}
                      </div>
                    </div>

                    {paymentMethod === 'kaspi' ? (
                      <div className="pt-2 border-t border-outline/30 flex items-center justify-between text-[10px] text-[#F14635] font-mono">
                        <span className="flex items-center gap-1"><QrCode className="w-3 h-3" /> Kaspi QR Instant Transfer</span>
                        <span>0% Commission</span>
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-outline/30 flex items-center justify-between text-[10px] text-on-surface-variant font-mono">
                        <span className="flex items-center gap-1"><Lock className="w-3 h-3 text-emerald-400" /> Stripe 256-bit SSL</span>
                        <span>Direct Gateway</span>
                      </div>
                    )}
                  </div>

                  {/* Kaspi QR Box Preview */}
                  {paymentMethod === 'kaspi' && (
                    <div className="bg-[#F14635]/5 border border-[#F14635]/20 rounded-2xl p-3.5 text-center text-xs mb-5">
                      <div className="w-24 h-24 mx-auto bg-white rounded-xl p-2 flex items-center justify-center border border-zinc-200 shadow-sm mb-2 relative">
                        <QrCode className="w-full h-full text-zinc-900" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="bg-[#F14635] text-white px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">Kaspi</span>
                        </div>
                      </div>
                      <p className="text-[11px] font-bold text-on-surface mb-0.5">
                        {locale === 'en' ? 'Scan with Kaspi.kz app' : 'Откройте Kaspi.kz -> Kaspi QR'}
                      </p>
                      <p className="text-[10px] text-on-surface-variant">
                        {locale === 'en' ? 'Immediate activation upon scanning' : 'Мгновенная активация подписки после сканирования'}
                      </p>
                    </div>
                  )}

                  {/* Promo Code Input & Apply Button */}
                  <div className="text-left mb-5">
                    <label className="block text-xs font-bold text-on-surface mb-1.5 flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-indigo-400" />
                      {locale === 'en' ? 'Promo Code / Coupon' : 'Промокод / Купон'}
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.trim().toUpperCase())}
                        placeholder={locale === 'en' ? 'Enter code (e.g. ALPHA20)' : 'Введите код (например ALPHA20)'}
                        className="flex-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 dark:text-white font-mono outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all uppercase"
                      />
                      <button
                        type="button"
                        onClick={handleApplyPromoCode}
                        disabled={promoLoading || !promoCode.trim()}
                        className="px-4 py-2.5 rounded-xl bg-surface-container border border-outline hover:bg-surface-container-high text-xs font-bold text-on-surface transition-all disabled:opacity-50 cursor-pointer shrink-0"
                      >
                        {promoLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (locale === 'en' ? 'Apply' : 'Применить')}
                      </button>
                    </div>

                    {promoMessage && (
                      <p className={`text-[11px] font-medium mt-1.5 flex items-center gap-1 ${
                        promoMessage.type === 'success' ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {promoMessage.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <X className="w-3.5 h-3.5 shrink-0" />}
                        {promoMessage.text}
                      </p>
                    )}
                  </div>

                  {checkoutError && (
                    <p className="text-xs text-red-400 mb-4 text-left font-medium">{checkoutError}</p>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsCheckoutOpen(false)}
                      className="flex-1 py-3.5 rounded-xl border border-outline text-on-surface hover:bg-surface-container/40 transition-colors text-xs font-bold"
                    >
                      {locale === 'en' ? 'Cancel' : 'Отмена'}
                    </button>
                    <button
                      onClick={handleSubmitPayment}
                      className={`flex-1 py-3.5 rounded-xl text-white transition-all text-xs font-bold shadow-lg flex items-center justify-center gap-1.5 cursor-pointer ${
                        paymentMethod === 'kaspi'
                          ? 'bg-gradient-to-r from-[#F14635] to-[#E52D27] hover:brightness-110 shadow-[#F14635]/20'
                          : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 shadow-indigo-500/20'
                      }`}
                    >
                      {paymentMethod === 'kaspi' ? <QrCode className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                      {paymentMethod === 'kaspi'
                        ? (locale === 'en' ? `Pay ${getKaspiPriceKZT()} ₸ (Kaspi QR)` : `Оплатить ${getKaspiPriceKZT()} ₸ (Kaspi QR)`)
                        : (locale === 'en' ? `Pay $${getFinalPriceUSD()} (Stripe)` : `Оплатить $${getFinalPriceUSD()} (Stripe)`)}
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
                      {locale === 'en' ? 'Plan ' : 'Тариф '}<span className="font-bold text-indigo-400 uppercase tracking-widest">{selectedUpgradePlan}</span>{locale === 'en' ? ' successfully activated.' : ' успешно активирован.'}
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
                    {locale === 'en' ? 'Start Learning' : 'Начать обучение'}
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
                      {locale === 'en' ? 'Back' : 'Назад'}
                    </button>
                    <button
                      onClick={handleCancelSubscription}
                      className="flex-1 py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors text-xs font-bold"
                    >
                      {locale === 'en' ? 'Confirm' : 'Подтвердить'}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Notification Alert Modal */}
      <AnimatePresence>
        {notification && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setNotification(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-[#18181B] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl z-10 text-center flex flex-col items-center"
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 border ${
                notification.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                notification.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
              }`}>
                {notification.type === 'error' ? (
                  <X className="w-6 h-6" />
                ) : notification.type === 'success' ? (
                  <Check className="w-6 h-6" />
                ) : (
                  <Sparkles className="w-6 h-6" />
                )}
              </div>

              <h3 className="text-lg font-bold text-white mb-2 font-clash">{notification.title}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                {notification.message}
              </p>

              <button
                onClick={() => setNotification(null)}
                className="w-full py-2.5 px-4 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors"
              >
                {locale === 'en' ? 'OK' : 'Понятно'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Active Plan Capabilities Modal */}
      <AnimatePresence>
        {isPlanFeaturesModalOpen && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPlanFeaturesModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative z-10 bg-surface-container-high/95 border border-outline/50 backdrop-blur-2xl p-6 md:p-8 rounded-[2.5rem] max-w-2xl w-full shadow-2xl overflow-hidden text-left"
            >
              {/* Ambient Glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

              {/* Close Button */}
              <button
                onClick={() => setPlanFeaturesModalOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-full bg-surface-container/60 hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-wider mb-2 border border-indigo-500/30">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  {locale === 'en' ? `Active Plan Capabilities · ${modalPlanView}` : `Возможности тарифа · ${modalPlanView}`}
                </div>
                <h2 className="text-2xl font-bold text-on-surface font-clash">
                  {locale === 'en' ? `Capabilities of ${modalPlanView}` : `Вам доступны возможности тарифа ${modalPlanView}`}
                </h2>
                <p className="text-xs text-on-surface-variant mt-1">
                  {modalPlanView === 'FREE' 
                    ? (locale === 'en' ? 'Basic introduction features available on your account.' : 'Базовые возможности платформы, доступные на вашем аккаунте.')
                    : modalPlanView === 'PRO'
                    ? (locale === 'en' ? 'Unlimited roadmap creation, session memory, and verifications unlocked.' : 'Безлимитная генерация ИИ-курсов, память ментора и верификация разблокированы.')
                    : (locale === 'en' ? 'Full Ultra AI arsenal unlocked with no restrictions.' : 'Полный максимальный арсенал YourWay разблокирован без ограничений.')}
                </p>
              </div>

              {/* Tier Selector Switcher inside Modal */}
              <div className="flex bg-surface-container/60 p-1 rounded-xl border border-outline/40 mb-6">
                {['FREE', 'PRO', 'ULTRA'].map((tier) => (
                  <button
                    key={tier}
                    onClick={() => setModalPlanView(tier)}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      modalPlanView === tier 
                        ? 'bg-indigo-600 text-white shadow-md' 
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {tier === 'PRO' && <Crown className="w-3.5 h-3.5 text-amber-300" />}
                    {tier === 'ULTRA' && <Sparkles className="w-3.5 h-3.5 text-indigo-300" />}
                    {tier}
                    {tier === plan && (
                      <span className="ml-1 text-[8px] bg-white/20 text-white px-1.5 py-0.5 rounded uppercase font-mono">{locale === 'en' ? 'Active' : 'Активный'}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Feature Cards Grid inside Modal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[380px] overflow-y-auto pr-1">
                {getFeaturesForModal(modalPlanView, locale).map((feat, idx) => (
                  <div 
                    key={idx}
                    className={`p-4 rounded-2xl border transition-all text-left flex flex-col justify-between ${
                      feat.unlocked 
                        ? 'bg-surface-container/80 border-emerald-500/30 hover:border-emerald-500/50 shadow-inner' 
                        : 'bg-surface-container/30 border-outline/30 opacity-70'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">{feat.icon}</span>
                        {feat.unlocked ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <Check className="w-3 h-3" /> {locale === 'en' ? 'Available' : 'Доступно'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                            <Lock className="w-3 h-3" /> {feat.requiredTier}
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-on-surface mb-1">{feat.title}</h4>
                      <p className="text-[11px] text-on-surface-variant leading-relaxed">{feat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer Quick Action */}
              <div className="mt-6 pt-4 border-t border-outline/40 flex items-center justify-between gap-4">
                <span className="text-xs text-on-surface-variant font-mono">
                  {modalPlanView === plan 
                    ? (locale === 'en' ? '✓ Showing your active plan' : '✓ Отображаются возможности вашего текущего тарифа')
                    : (locale === 'en' ? `Viewing ${modalPlanView} capabilities` : `Просмотр возможностей тарифа ${modalPlanView}`)}
                </span>
                {modalPlanView !== plan && (
                  <button
                    onClick={() => {
                      setPlanFeaturesModalOpen(false);
                      handleSelectPlan(modalPlanView);
                    }}
                    className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {locale === 'en' ? `Upgrade to ${modalPlanView}` : `Перейти на ${modalPlanView}`}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
