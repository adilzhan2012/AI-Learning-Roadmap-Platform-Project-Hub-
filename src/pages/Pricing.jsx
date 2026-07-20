import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  X, 
  Lock, 
  ChevronDown, 
  ChevronUp, 
  Crown,
  Loader2
} from 'lucide-react';
import { auth, db } from '../firebase.js';
import { doc, setDoc } from 'firebase/firestore';
import { usePlanLimits } from '../hooks/usePlanLimits.js';
import { useNavigate } from 'react-router-dom';

export const LockIcon = ({ className }) => (
  <Lock className={className} strokeWidth={1.5} />
);

export default function Pricing() {
  const navigate = useNavigate();
  const { plan, loading, dbBillingPeriod } = usePlanLimits();
  const [billingPeriod, setBillingPeriod] = useState('monthly'); // 'monthly' | 'yearly'
  const [showFullComparison, setShowFullComparison] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  // Simulated payment state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [checkoutStage, setCheckoutStage] = useState('input'); // 'input' | 'processing' | 'success'
  const [checkoutError, setCheckoutError] = useState('');

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
      const ref = doc(db, 'users', auth.currentUser.uid, 'subscription', 'details');
      await setDoc(ref, { plan: 'FREE' }, { merge: true });
      setTimeout(() => {
        setCancelling(false);
        setIsCancelModalOpen(false);
        window.location.reload();
      }, 1000);
    } catch (e) {
      console.error(e);
      setCancelling(false);
    }
  };

  const handleSelectPlan = (targetPlan) => {
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }
    
    if (targetPlan === 'PRO') {
      setIsCheckoutOpen(true);
    } else {
      handleDowngrade();
    }
  };

  const handleDowngrade = async () => {
    setUpgrading(true);
    try {
      const ref = doc(db, 'users', auth.currentUser.uid, 'subscription', 'details');
      await setDoc(ref, { plan: 'FREE' }, { merge: true });
      setTimeout(() => {
        setUpgrading(false);
        window.location.reload();
      }, 800);
    } catch (e) {
      console.error(e);
      setUpgrading(false);
    }
  };

  const handleSubmitPayment = () => {
    if (!cardHolder.trim() || !cardNumber || cardNumber.length < 19 || !cardExpiry || cardExpiry.length < 5 || !cardCvc || cardCvc.length < 3) {
      setCheckoutError('Пожалуйста, заполните все реквизиты карты корректно.');
      return;
    }
    setCheckoutError('');
    setCheckoutStage('processing');
    
    // Simulate premium payment processing
    setTimeout(() => {
      setCheckoutStage('success');
    }, 2500);
  };

  const handleFinishUpgrade = async () => {
    setIsCheckoutOpen(false);
    setCheckoutStage('input');
    setUpgrading(true);
    try {
      const ref = doc(db, 'users', auth.currentUser.uid, 'subscription', 'details');
      await setDoc(ref, { plan: 'PRO' }, { merge: true });
      setTimeout(() => {
        setUpgrading(false);
        window.location.reload();
      }, 800);
    } catch (e) {
      console.error(e);
      setUpgrading(false);
    }
  };

  if (loading || upgrading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4.5rem)] bg-[#000000] text-white">
        <Loader2 className="w-8 h-8 animate-spin text-white mb-2" />
        <p className="text-sm text-[#98989D] font-mono">Обновление тарифного плана...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4.5rem)] bg-[#000000] text-[#FFFFFF] font-sans py-12 px-4 select-none relative">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto mb-10">
        <motion.h1 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-black font-clash tracking-tight mb-3"
        >
          Выберите свой план
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-base text-[#98989D] font-medium leading-relaxed"
        >
          Инвестируйте в свое обучение с AI-ментором, персонализированными траекториями и интерактивным графом знаний.
        </motion.p>
      </div>

      {/* Segmented iOS Period Toggle */}
      <div className="flex justify-center mb-12">
        <div className="relative bg-[#1C1C1E] p-1 rounded-full flex items-center border border-[rgba(255,255,255,0.06)] shadow-inner">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`relative px-5 py-2 text-xs font-semibold rounded-full transition-all leading-none ${
              billingPeriod === 'monthly' ? 'text-[#000000] bg-[#FFFFFF] shadow-sm' : 'text-[#98989D] hover:text-[#FFFFFF]'
            }`}
          >
            Месяц
          </button>
          <button
            onClick={() => setBillingPeriod('yearly')}
            className={`relative px-5 py-2 text-xs font-semibold rounded-full transition-all leading-none flex items-center gap-1.5 ${
              billingPeriod === 'yearly' ? 'text-[#000000] bg-[#FFFFFF] shadow-sm' : 'text-[#98989D] hover:text-[#FFFFFF]'
            }`}
          >
            Год
            <span className={`text-[9px] font-mono font-bold leading-none ${billingPeriod === 'yearly' ? 'text-[#636366]' : 'text-[#8E8E93]'}`}>
              -20%
            </span>
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      <div className={`mx-auto gap-8 items-stretch mb-16 ${
        plan === 'PRO' 
          ? 'max-w-[450px] grid grid-cols-1' 
          : 'max-w-[900px] grid grid-cols-1 md:grid-cols-2'
      }`}>
        
        {/* FREE PLAN CARD */}
        {plan !== 'PRO' && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
            className={`bg-[#1C1C1E] border ${
              plan === 'FREE' ? 'border-[#FFFFFF]/25' : 'border-[rgba(255,255,255,0.06)]'
            } rounded-[2rem] p-8 flex flex-col justify-between relative`}
          >
            <div>
              <div className="mb-6">
                <h3 className="text-xl font-bold tracking-tight text-[#FFFFFF] mb-1">Free</h3>
                <p className="text-xs text-[#98989D] font-medium">Базовое знакомство с платформой</p>
              </div>

              <div className="mb-8">
                <span className="text-4xl font-black font-clash tracking-tight text-[#FFFFFF]">$0</span>
                <span className="text-xs text-[#98989D] block mt-1">Всегда бесплатно</span>
              </div>

              {/* Checklist */}
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3 text-sm">
                  <Check className="w-5 h-5 text-[#8E8E93] shrink-0 mt-0.5" strokeWidth={2} />
                  <span className="text-[#F5F5F7] leading-tight">1 Сгенерированный курс в месяц</span>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  <Check className="w-5 h-5 text-[#8E8E93] shrink-0 mt-0.5" strokeWidth={2} />
                  <span className="text-[#F5F5F7] leading-tight">5 пробных сообщений AI-ментору</span>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  <Check className="w-5 h-5 text-[#8E8E93] shrink-0 mt-0.5" strokeWidth={2} />
                  <span className="text-[#F5F5F7] leading-tight">Базовый интерактивный граф знаний</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-[#98989D]/60">
                  <X className="w-5 h-5 text-[#636366] shrink-0 mt-0.5" strokeWidth={2} />
                  <span className="leading-tight">Полная аналитика прогресса</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-[#98989D]/60">
                  <X className="w-5 h-5 text-[#636366] shrink-0 mt-0.5" strokeWidth={2} />
                  <span className="leading-tight">Доступ к Алмазной и Магистр лигам</span>
                </li>
              </ul>
            </div>

            <div>
              {plan === 'FREE' ? (
                <button 
                  disabled 
                  className="w-full py-4 rounded-2xl font-bold bg-transparent border border-[rgba(255,255,255,0.08)] text-[#98989D] text-xs cursor-default"
                >
                  Текущий тариф
                </button>
              ) : (
                <button 
                  onClick={() => handleSelectPlan('FREE')}
                  className="w-full py-4 rounded-2xl font-bold bg-transparent border border-[rgba(255,255,255,0.15)] text-[#FFFFFF] hover:bg-[rgba(255,255,255,0.04)] active:scale-[0.98] transition-all text-xs"
                >
                  Перейти на Free
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* PRO PLAN CARD (ACCENTED) */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 22 }}
          className={`bg-[#1C1C1E] rounded-[2rem] p-8 flex flex-col justify-between relative scale-[1.03] shadow-[0_30px_70px_rgba(255,255,255,0.04)] md:z-10 border-[2px] ${
            (plan === 'PRO' && dbBillingPeriod === billingPeriod) || plan !== 'PRO'
              ? 'border-[#FFFFFF]'
              : 'border-[rgba(255,255,255,0.06)]'
          }`}
        >
          {/* Recommended Tag */}
          {plan !== 'PRO' && (
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#2C2C2E] text-[#FFFFFF] border border-[rgba(255,255,255,0.1)] px-3 py-1 rounded-full text-[9px] font-bold tracking-wider uppercase font-sans">
              Рекомендуется
            </div>
          )}

          <div>
            <div className="mb-6 flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold tracking-tight text-[#FFFFFF] mb-1 flex items-center gap-1.5">
                  Pro <Crown className="w-4 h-4 text-[#FFFFFF]" strokeWidth={2} />
                </h3>
                <p className="text-xs text-[#98989D] font-medium">Безлимитное и адаптивное обучение</p>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black font-clash tracking-tight text-[#FFFFFF] font-mono tabular-nums">
                  {billingPeriod === 'monthly' ? '$10' : '$8.33'}
                </span>
                <span className="text-xs text-[#98989D] font-medium">
                  /мес
                </span>
              </div>
              <span className="text-[10px] text-[#8E8E93] block mt-1 font-sans">
                {billingPeriod === 'monthly' ? 'Оплата ежемесячно ($10)' : 'Оплата ежегодно ($100)'}
              </span>
            </div>

            {/* Checklist */}
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3 text-sm">
                <Check className="w-5 h-5 text-[#FFFFFF] shrink-0 mt-0.5" strokeWidth={2.5} />
                <span className="text-[#FFFFFF] font-medium leading-tight">Безлимитная генерация курсов</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Check className="w-5 h-5 text-[#FFFFFF] shrink-0 mt-0.5" strokeWidth={2.5} />
                <span className="text-[#FFFFFF] font-medium leading-tight">AI-ментор с памятью о сессиях (50/день)</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Check className="w-5 h-5 text-[#FFFFFF] shrink-0 mt-0.5" strokeWidth={2.5} />
                <span className="text-[#FFFFFF] font-medium leading-tight">Полный доступ к аналитике прогресса</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Check className="w-5 h-5 text-[#FFFFFF] shrink-0 mt-0.5" strokeWidth={2.5} />
                <span className="text-[#FFFFFF] font-medium leading-tight">Все лиги (включая Алмазную и Магистров)</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Check className="w-5 h-5 text-[#FFFFFF] shrink-0 mt-0.5" strokeWidth={2.5} />
                <span className="text-[#FFFFFF] font-medium leading-tight">Сертификаты по завершению курсов</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Check className="w-5 h-5 text-[#FFFFFF] shrink-0 mt-0.5" strokeWidth={2.5} />
                <span className="text-[#FFFFFF] font-medium leading-tight">Приоритетная поддержка 24/7</span>
              </li>
            </ul>
          </div>

          <div>
            {plan === 'PRO' ? (
              dbBillingPeriod === billingPeriod ? (
                <div className="space-y-4">
                  <div className="bg-[#2C2C2E]/40 border border-white/5 rounded-2xl p-4 text-left select-none">
                    <span className="text-[10px] text-[#8E8E93] uppercase tracking-wider block mb-1">Сведения о подписке</span>
                    <span className="text-xs text-white block mb-1 font-bold">Тариф YourWay Pro · Активен</span>
                    <span className="text-[11px] text-[#98989D] block">
                      Автоматическое продление: {getRenewalDate()}
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
                  className="w-full py-4 rounded-2xl font-bold bg-[#FFFFFF] text-[#000000] hover:bg-[#F5F5F7] active:scale-[0.98] transition-all text-xs shadow-md"
                >
                  {billingPeriod === 'yearly' ? 'Перейти на годовой тариф' : 'Перейти на месячный тариф'}
                </button>
              )
            ) : (
              <button 
                onClick={() => handleSelectPlan('PRO')}
                className="w-full py-4 rounded-2xl font-bold bg-[#FFFFFF] text-[#000000] hover:bg-[#F5F5F7] active:scale-[0.98] transition-all text-xs shadow-md"
              >
                Активировать Pro
              </button>
            )}
          </div>
        </motion.div>
      </div>

      {/* Active PRO features grid (Large features cards) */}
      {plan === 'PRO' && (
        <div className="max-w-[900px] mx-auto mt-16 mb-12 text-center">
          <h2 className="text-xl font-bold tracking-tight text-white mb-8 font-clash uppercase">
            Вам доступны все возможности PRO
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: 'Безлимитные курсы',
                desc: 'Создавайте неограниченное количество дорожных карт любой сложности. Генерируйте расширенные разделы с максимальной глубиной.',
                icon: '📚'
              },
              {
                title: 'AI-Ментор с памятью',
                desc: 'Глубокий контекст обучения. Ментор помнит все предыдущие вопросы, сохраняет историю переписки и адаптируется под ваши цели.',
                icon: '🧠'
              },
              {
                title: 'Доступ ко всем лигам',
                desc: 'Вы больше не ограничены лигой Графит. Соревнуйтесь в Кварцевой, Обсидиановой, Платиновой и легендарной Титановой лигах.',
                icon: '🏆'
              },
              {
                title: 'Официальные сертификаты',
                desc: 'Генерируйте верифицируемые PDF-сертификаты после завершения курсов для подтверждения ваших профессиональных навыков.',
                icon: '🎓'
              }
            ].map((feat, i) => (
              <div 
                key={i} 
                className="bg-[#1C1C1E] border border-[rgba(255,255,255,0.06)] rounded-[1.5rem] p-6 text-left hover:border-white/20 transition-colors"
              >
                <div className="text-2xl mb-3">{feat.icon}</div>
                <h3 className="text-sm font-bold text-white mb-2">{feat.title}</h3>
                <p className="text-xs text-[#98989D] leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comparison Table Toggle */}
      <div className="text-center mb-16">
        <button 
          onClick={() => setShowFullComparison(!showFullComparison)}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#98989D] hover:text-[#FFFFFF] transition-colors"
        >
          {showFullComparison ? 'Скрыть подробное сравнение' : 'Показать подробное сравнение'}
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
            className="max-w-[700px] mx-auto bg-[#1C1C1E] border border-[rgba(255,255,255,0.08)] rounded-[2rem] p-8 overflow-x-auto"
          >
            <table className="w-full text-left text-xs leading-normal">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.08)]">
                  <th className="pb-4 font-bold text-[#8E8E93]">Функция</th>
                  <th className="pb-4 text-center font-bold text-[#8E8E93]">Free</th>
                  <th className="pb-4 text-center font-bold text-[#FFFFFF]">Pro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.04)] font-sans">
                {/* Courses */}
                <tr>
                  <td className="py-4 text-[#F5F5F7]">Генерация дорожных карт</td>
                  <td className="text-center py-4 text-[#98989D]">2 курса в месяц</td>
                  <td className="text-center py-4 text-[#FFFFFF] font-bold">Безлимитно</td>
                </tr>
                {/* AI Mentor */}
                <tr>
                  <td className="py-4 text-[#F5F5F7]">Интерактивный AI-ментор</td>
                  <td className="text-center py-4 text-[#98989D]">5 сообщений</td>
                  <td className="text-center py-4 text-[#FFFFFF] font-bold">50 обращений в день</td>
                </tr>
                {/* Knowledge Graph */}
                <tr>
                  <td className="py-4 text-[#F5F5F7]">Граф знаний</td>
                  <td className="text-center py-4 text-[#98989D]">Базовый</td>
                  <td className="text-center py-4 text-[#FFFFFF] font-bold">Полная кастомизация</td>
                </tr>
                {/* Analytics */}
                <tr>
                  <td className="py-4 text-[#F5F5F7]">Аналитика и инсайты</td>
                  <td className="text-center py-4 text-[#98989D]"><LockIcon className="w-3.5 h-3.5 mx-auto text-[#636366]" /></td>
                  <td className="text-center py-4 text-[#FFFFFF] font-bold">Включено (полный доступ)</td>
                </tr>
                {/* Leagues */}
                <tr>
                  <td className="py-4 text-[#F5F5F7]">Доступ к элитным лигам</td>
                  <td className="text-center py-4 text-[#98989D]">Базовые лиги</td>
                  <td className="text-center py-4 text-[#FFFFFF] font-bold">Все лиги (Diamond + Master)</td>
                </tr>
                {/* Certificates */}
                <tr>
                  <td className="py-4 text-[#F5F5F7]">Сертификация выпускников</td>
                  <td className="text-center py-4 text-[#98989D]"><LockIcon className="w-3.5 h-3.5 mx-auto text-[#636366]" /></td>
                  <td className="text-center py-4 text-[#FFFFFF] font-bold">Включено</td>
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
            {/* Backdrop blur */}
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

            {/* Modal box */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="relative bg-[#1C1C1E] border border-[rgba(255,255,255,0.08)] w-full max-w-md rounded-[2rem] p-8 shadow-2xl z-10 text-center overflow-hidden"
            >
              {checkoutStage === 'input' && (
                <>
                  <h3 className="text-xl font-bold text-white mb-1 font-clash">Оформление подписки PRO</h3>
                  <p className="text-xs text-[#98989D] mb-6">
                    Тариф: {billingPeriod === 'monthly' ? 'Ежемесячный ($10/мес)' : 'Ежегодный ($100/год)'}
                  </p>

                  {/* Credit Card Mock Visual */}
                  <div className="w-full aspect-[1.586/1] bg-gradient-to-br from-[#2C2C2E] to-[#1C1C1E] rounded-2xl p-6 text-left border border-white/10 relative overflow-hidden mb-6 shadow-inner select-none">
                    {/* Subtle lines inside card */}
                    <svg className="absolute inset-0 w-full h-full text-white opacity-[0.03] stroke-current stroke-[0.5] fill-none" viewBox="0 0 100 60" preserveAspectRatio="none">
                      <circle cx="50" cy="30" r="25" />
                      <circle cx="50" cy="30" r="15" />
                    </svg>
                    
                    <div className="flex justify-between items-start mb-6">
                      <span className="text-[10px] font-mono tracking-widest text-[#8E8E93] uppercase">YourWay PRO</span>
                      <svg className="w-8 h-8 text-white opacity-40 fill-current" viewBox="0 0 24 24">
                        <circle cx="8" cy="12" r="6" />
                        <circle cx="16" cy="12" r="6" />
                      </svg>
                    </div>

                    {/* Card Number */}
                    <div className="text-base md:text-lg font-mono tracking-wider tabular-nums text-white mb-6">
                      {cardNumber || '•••• •••• •••• ••••'}
                    </div>

                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-[8px] text-[#8E8E93] uppercase block">Cardholder</span>
                        <span className="text-xs font-mono text-white truncate max-w-[150px] inline-block uppercase">
                          {cardHolder || 'ALEXANDER SMIRNOV'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[8px] text-[#8E8E93] uppercase block">Expires</span>
                        <span className="text-xs font-mono text-white tabular-nums">
                          {cardExpiry || 'MM/YY'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Form fields */}
                  <div className="space-y-4 text-left">
                    <div>
                      <label className="text-[10px] text-[#8E8E93] uppercase tracking-wider block mb-1">Имя на карте</label>
                      <input 
                        type="text"
                        placeholder="ALEXANDER SMIRNOV"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                        className="w-full bg-[#2C2C2E]/40 border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-2.5 text-xs text-white uppercase focus:outline-none focus:border-white transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-[#8E8E93] uppercase tracking-wider block mb-1">Номер карты</label>
                      <input 
                        type="text"
                        placeholder="4000 1234 5678 9010"
                        maxLength={19}
                        value={cardNumber}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
                          setCardNumber(val);
                        }}
                        className="w-full bg-[#2C2C2E]/40 border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-white transition-colors"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-[#8E8E93] uppercase tracking-wider block mb-1">Срок действия</label>
                        <input 
                          type="text"
                          placeholder="MM/YY"
                          maxLength={5}
                          value={cardExpiry}
                          onChange={(e) => {
                            let val = e.target.value.replace(/\D/g, '');
                            if (val.length > 2) {
                              val = val.substring(0, 2) + '/' + val.substring(2, 4);
                            }
                            setCardExpiry(val);
                          }}
                          className="w-full bg-[#2C2C2E]/40 border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-white transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#8E8E93] uppercase tracking-wider block mb-1">CVC-код</label>
                        <input 
                          type="password"
                          placeholder="•••"
                          maxLength={3}
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ''))}
                          className="w-full bg-[#2C2C2E]/40 border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-white transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {checkoutError && (
                    <p className="text-xs text-red-400 mt-4 text-left">{checkoutError}</p>
                  )}

                  <div className="flex gap-4 mt-8">
                    <button
                      onClick={() => setIsCheckoutOpen(false)}
                      className="flex-1 py-3 rounded-xl border border-[rgba(255,255,255,0.08)] text-white hover:bg-[#2C2C2E]/40 transition-colors text-xs font-bold"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={handleSubmitPayment}
                      className="flex-1 py-3 rounded-xl bg-white text-black hover:bg-[#E8E8ED] transition-colors text-xs font-bold"
                    >
                      Оплатить {billingPeriod === 'monthly' ? '$10' : '$100'}
                    </button>
                  </div>
                </>
              )}

              {checkoutStage === 'processing' && (
                <div className="py-12 flex flex-col items-center justify-center gap-4">
                  <Loader2 className="w-8 h-8 animate-spin text-white" />
                  <p className="text-sm font-mono text-[#8E8E93]">Авторизация платежа...</p>
                  <p className="text-xs text-[#636366] max-w-xs leading-relaxed">
                    Пожалуйста, не закрывайте окно. Мы проверяем безопасность транзакции через 3D-Secure эмуляцию.
                  </p>
                </div>
              )}

              {checkoutStage === 'success' && (
                <div className="py-8 flex flex-col items-center justify-center gap-4">
                  <div className="w-16 h-16 bg-white/5 border border-white/20 rounded-full flex items-center justify-center text-white mb-2 shadow-lg">
                    <Check className="w-8 h-8 text-white animate-pulse" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-xl font-bold text-white font-clash">Оплата успешно проведена!</h3>
                  <p className="text-xs text-[#98989D] max-w-xs leading-relaxed">
                    Счет оплачен. Подписка PRO успешно активирована. Добро пожаловать в элитный соревновательный клуб YourWay!
                  </p>
                  <button
                    onClick={handleFinishUpgrade}
                    className="w-full mt-6 py-3 rounded-xl bg-white text-black hover:bg-[#E8E8ED] transition-colors text-xs font-bold"
                  >
                    Начать обучение
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {isCancelModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            {/* Backdrop blur */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!cancelling) setIsCancelModalOpen(false);
              }}
              className="absolute inset-0 bg-black/75 backdrop-blur-md"
            />

            {/* Modal box */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="relative bg-[#1C1C1E] border border-[rgba(255,255,255,0.08)] w-full max-w-md rounded-[2rem] p-8 shadow-2xl z-10 text-center overflow-hidden"
            >
              {cancelling ? (
                <div className="py-12 flex flex-col items-center justify-center gap-4">
                  <Loader2 className="w-8 h-8 animate-spin text-white" />
                  <p className="text-sm font-mono text-[#8E8E93]">Отмена подписки...</p>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <X className="w-5 h-5" strokeWidth={2} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 font-clash">
                    Вы уверены, что хотите отменить подписку?
                  </h3>
                  <p className="text-xs text-[#98989D] mb-6 leading-relaxed">
                    Вы потеряете доступ ко всем Pro-возможностям, включая безлимитную генерацию курсов (останется только 1 активный), память сессий AI-ментора, экспертные лиги и PDF-сертификаты.
                  </p>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setIsCancelModalOpen(false)}
                      className="flex-1 py-3 rounded-xl bg-white text-black hover:bg-[#E8E8ED] transition-colors text-xs font-bold"
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
