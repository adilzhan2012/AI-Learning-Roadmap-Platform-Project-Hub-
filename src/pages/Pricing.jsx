import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  X, 
  Lock, 
  ChevronDown, 
  ChevronUp, 
  Crown,
  Loader2,
  Sparkles
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
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState('PRO'); // 'PRO' | 'ULTRA'

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
      await setDoc(ref, { plan: selectedUpgradePlan }, { merge: true });
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
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4.5rem)] bg-background text-on-surface">
        <Loader2 className="w-8 h-8 animate-spin text-on-surface mb-2" />
        <p className="text-sm text-on-surface-variant font-mono">Обновление тарифного плана...</p>
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
          Тарифные планы
        </motion.h1>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          Выберите подходящий уровень для достижения ваших целей обучения. Сгенерируйте индивидуальные курсы с использованием ИИ.
        </p>

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
            <span className="bg-surface-container/60 text-[#30D158] text-[8px] font-mono px-1.5 py-0.5 rounded border border-[#30D158]/20 uppercase tracking-wide">Скидка 15%</span>
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
              <h3 className="text-xl font-bold tracking-tight text-on-surface mb-1">Free</h3>
              <p className="text-xs text-on-surface-variant font-medium">Базовое знакомство с платформой</p>
            </div>

            <div className="mb-8">
              <span className="text-4xl font-black font-clash tracking-tight text-on-surface">$0</span>
              <span className="text-xs text-on-surface-variant block mt-1">Всегда бесплатно</span>
            </div>

            {/* Checklist */}
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3 text-sm">
                <Check className="w-5 h-5 text-on-surface-variant shrink-0 mt-0.5" strokeWidth={2} />
                <span className="text-on-background leading-tight">1 Сгенерированный курс</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Check className="w-5 h-5 text-on-surface-variant shrink-0 mt-0.5" strokeWidth={2} />
                <span className="text-on-background leading-tight">5 пробных сообщений AI-ментору</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-on-surface-variant/60">
                <X className="w-5 h-5 text-[#636366] shrink-0 mt-0.5" strokeWidth={2} />
                <span className="leading-tight">Интерактивная практика и код-ревью</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-on-surface-variant/60">
                <X className="w-5 h-5 text-[#636366] shrink-0 mt-0.5" strokeWidth={2} />
                <span className="leading-tight">RAG: Генерация из PDF/YouTube</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-on-surface-variant/60">
                <X className="w-5 h-5 text-[#636366] shrink-0 mt-0.5" strokeWidth={2} />
                <span className="leading-tight">Mock Interview & Экспорт</span>
              </li>
            </ul>
          </div>

          <div>
            {plan === 'FREE' ? (
              <button 
                disabled 
                className="w-full py-4 rounded-2xl font-bold bg-transparent border border-outline text-on-surface-variant text-xs cursor-default"
              >
                Текущий тариф
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
              <p className="text-xs text-on-surface-variant font-medium">Безлимитное и адаптивное обучение</p>
            </div>

            <div className="mb-8">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black font-clash tracking-tight text-on-surface font-mono tabular-nums">
                  {billingPeriod === 'monthly' ? '$9.99' : '$7.50'}
                </span>
                <span className="text-xs text-on-surface-variant font-medium">/мес</span>
              </div>
              <span className="text-[10px] text-on-surface-variant block mt-1 font-sans">
                {billingPeriod === 'monthly' ? 'Оплата ежемесячно ($9.99)' : 'Оплата ежегодно ($89.99)'}
              </span>
            </div>

            {/* Checklist */}
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3 text-sm">
                <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" strokeWidth={2.5} />
                <span className="text-on-surface font-medium leading-tight">Безлимитная генерация курсов</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" strokeWidth={2.5} />
                <span className="text-on-surface font-medium leading-tight">AI-ментор (50 сообщений в день)</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" strokeWidth={2.5} />
                <span className="text-on-surface font-medium leading-tight">Доступ к Алмазной и Магистр лигам</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-on-surface-variant/60">
                <X className="w-5 h-5 text-[#636366] shrink-0 mt-0.5" strokeWidth={2} />
                <span className="leading-tight">Интерактивная практика и код-ревью</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-on-surface-variant/60">
                <X className="w-5 h-5 text-[#636366] shrink-0 mt-0.5" strokeWidth={2} />
                <span className="leading-tight">RAG: Генерация по PDF/YouTube</span>
              </li>
            </ul>
          </div>

          <div>
            {plan === 'PRO' ? (
              dbBillingPeriod === billingPeriod ? (
                <div className="space-y-4">
                  <div className="bg-surface-container/40 border border-white/5 rounded-2xl p-4 text-left select-none">
                    <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block mb-1">Сведения о подписке</span>
                    <span className="text-xs text-on-surface block mb-1 font-bold">Тариф YourWay Pro · Активен</span>
                    <span className="text-[11px] text-on-surface-variant block">
                      Продление: {getRenewalDate()}
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
                  {billingPeriod === 'yearly' ? 'Перейти на годовой Pro' : 'Перейти на месячный Pro'}
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
              <p className="text-xs text-indigo-600 dark:text-indigo-300 font-medium">Максимальный AI-арсенал YourWay</p>
            </div>

            <div className="mb-8">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black font-clash tracking-tight text-on-surface font-mono tabular-nums">
                  {billingPeriod === 'monthly' ? '$29.99' : '$20.83'}
                </span>
                <span className="text-xs text-on-surface-variant font-medium">/мес</span>
              </div>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-300 block mt-1 font-sans">
                {billingPeriod === 'monthly' ? 'Оплата ежемесячно ($29.99)' : 'Оплата ежегодно ($249.99)'}
              </span>
            </div>

            {/* Checklist */}
            <ul className="space-y-3.5 mb-8 text-left">
              <li className="flex items-start gap-2.5 text-xs text-on-surface">
                <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" strokeWidth={3} />
                <span className="leading-tight">Безлимитный AI-ментор (без лимита сообщений)</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-on-surface">
                <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" strokeWidth={3} />
                <span className="leading-tight">Интерактивный брифинг-составление курсов</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-on-surface">
                <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" strokeWidth={3} />
                <span className="leading-tight">RAG: Импорт PDF, YouTube и веб-документации</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-on-surface">
                <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" strokeWidth={3} />
                <span className="leading-tight">AI Code Review: анализ кода на ошибки и уязвимости</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-on-surface">
                <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" strokeWidth={3} />
                <span className="leading-tight">Адаптивный Граф знаний (авто-микромодули)</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-on-surface">
                <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" strokeWidth={3} />
                <span className="leading-tight">AI Mock Interview: HR & Tech-симулятор в финале</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-on-surface">
                <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" strokeWidth={3} />
                <span className="leading-tight">Экспорт лекций и карточек в Notion & Anki</span>
              </li>
            </ul>
          </div>

          <div>
            {plan === 'ULTRA' ? (
              dbBillingPeriod === billingPeriod ? (
                <div className="space-y-4">
                  <div className="bg-indigo-950/40 border border-indigo-500/20 rounded-2xl p-4 text-left select-none">
                    <span className="text-[10px] text-indigo-300 uppercase tracking-wider block mb-1">Сведения о подписке</span>
                    <span className="text-xs text-on-surface block mb-1 font-bold font-clash">Тариф YourWay Ultra · Активен</span>
                    <span className="text-[11px] text-zinc-300 block">
                      Продление: {getRenewalDate()}
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
                  {billingPeriod === 'yearly' ? 'Перейти на годовой Ultra' : 'Перейти на месячный Ultra'}
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

      {/* Active Features Info Cards */}
      {(plan === 'PRO' || plan === 'ULTRA') && (
        <div className="max-w-[900px] mx-auto mt-16 mb-12 text-center">
          <h2 className="text-xl font-bold tracking-tight text-on-surface mb-8 font-clash uppercase">
            Вам доступны возможности тарифа {plan}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plan === 'ULTRA' ? (
              [
                {
                  title: 'RAG: Генерация по материалам',
                  desc: 'Загрузите PDF книгу, статью или документацию, вставьте YouTube лекцию — искусственный интеллект сгенерирует курс и граф знаний на их основе.',
                  icon: '📖'
                },
                {
                  title: 'AI Code Review и интерактивная практика',
                  desc: 'Пишите реальный код непосредственно в окне урока. AI-эксперт проверит код-стайл, укажет на утечки, ошибки и уязвимости.',
                  icon: '💻'
                },
                {
                  title: 'Адаптивный Граф знаний',
                  desc: 'Если тесты по ноде пройдены с низким результатом, система автоматически перестраивает граф, генерируя микро-модули закрытия пробелов.',
                  icon: '🧬'
                },
                {
                  title: 'Симуляция собеседований',
                  desc: 'Mock-интервью в конце курсов. Голосовой/текстовый тренажер, оценивающий вас по вопросам HR и Tech-лидов.',
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
            className="max-w-[800px] mx-auto bg-surface border border-outline rounded-[2rem] p-8 overflow-x-auto"
          >
            <table className="w-full text-left text-xs leading-normal">
              <thead>
                <tr className="border-b border-outline">
                  <th className="pb-4 font-bold text-on-surface-variant">Функция</th>
                  <th className="pb-4 text-center font-bold text-on-surface-variant">Free</th>
                  <th className="pb-4 text-center font-bold text-on-surface">Pro</th>
                  <th className="pb-4 text-center font-bold text-indigo-400">Ultra</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.04)] font-sans">
                {/* Courses */}
                <tr>
                  <td className="py-4 text-on-background">Генерация дорожных карт</td>
                  <td className="text-center py-4 text-on-surface-variant">2 курса / мес</td>
                  <td className="text-center py-4 text-on-surface font-bold">Безлимитно</td>
                  <td className="text-center py-4 text-indigo-300 font-bold">Безлимитно</td>
                </tr>
                {/* AI Mentor */}
                <tr>
                  <td className="py-4 text-on-background">Интерактивный AI-ментор</td>
                  <td className="text-center py-4 text-on-surface-variant">5 сообщений</td>
                  <td className="text-center py-4 text-on-surface font-bold">50 сообщ/день</td>
                  <td className="text-center py-4 text-indigo-300 font-bold">Без ограничений</td>
                </tr>
                {/* RAG Generation */}
                <tr>
                  <td className="py-4 text-on-background">RAG (PDF, YouTube лекции)</td>
                  <td className="text-center py-4 text-on-surface-variant"><LockIcon className="w-3.5 h-3.5 mx-auto text-[#636366]" /></td>
                  <td className="text-center py-4 text-on-surface-variant"><LockIcon className="w-3.5 h-3.5 mx-auto text-[#636366]" /></td>
                  <td className="text-center py-4 text-indigo-300 font-bold">Включено</td>
                </tr>
                {/* Code review */}
                <tr>
                  <td className="py-4 text-on-background">AI Code Review и практика программирования</td>
                  <td className="text-center py-4 text-on-surface-variant"><LockIcon className="w-3.5 h-3.5 mx-auto text-[#636366]" /></td>
                  <td className="text-center py-4 text-on-surface-variant"><LockIcon className="w-3.5 h-3.5 mx-auto text-[#636366]" /></td>
                  <td className="text-center py-4 text-indigo-300 font-bold">Включено</td>
                </tr>
                {/* Adaptive Graph */}
                <tr>
                  <td className="py-4 text-on-background">Адаптивный граф (микромодули)</td>
                  <td className="text-center py-4 text-on-surface-variant"><LockIcon className="w-3.5 h-3.5 mx-auto text-[#636366]" /></td>
                  <td className="text-center py-4 text-on-surface font-bold">Частично</td>
                  <td className="text-center py-4 text-indigo-300 font-bold">Полное покрытие</td>
                </tr>
                {/* Mock Interview */}
                <tr>
                  <td className="py-4 text-on-background">ИнтервьюHR / Tech-лид</td>
                  <td className="text-center py-4 text-on-surface-variant"><LockIcon className="w-3.5 h-3.5 mx-auto text-[#636366]" /></td>
                  <td className="text-center py-4 text-on-surface-variant"><LockIcon className="w-3.5 h-3.5 mx-auto text-[#636366]" /></td>
                  <td className="text-center py-4 text-indigo-300 font-bold">Включено</td>
                </tr>
                {/* Export */}
                <tr>
                  <td className="py-4 text-on-background">Экспорт в Notion и Anki</td>
                  <td className="text-center py-4 text-on-surface-variant"><LockIcon className="w-3.5 h-3.5 mx-auto text-[#636366]" /></td>
                  <td className="text-center py-4 text-on-surface-variant"><LockIcon className="w-3.5 h-3.5 mx-auto text-[#636366]" /></td>
                  <td className="text-center py-4 text-indigo-300 font-bold">Включено</td>
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
                  <h3 className="text-xl font-bold text-on-surface mb-1 font-clash">Оформление подписки {selectedUpgradePlan}</h3>
                  <p className="text-xs text-on-surface-variant mb-6">
                    Тариф: {selectedUpgradePlan} ({billingPeriod === 'monthly' ? `Ежемесячный - $${selectedUpgradePlan === 'ULTRA' ? '29.99' : '9.99'}/мес` : `Ежегодный - $${selectedUpgradePlan === 'ULTRA' ? '249.99' : '89.99'}/год`})
                  </p>

                  <div className="w-full aspect-[1.586/1] bg-gradient-to-br from-[#2C2C2E] to-[#1C1C1E] rounded-2xl p-6 text-left border border-white/10 relative overflow-hidden mb-6 shadow-inner select-none">
                    <svg className="absolute inset-0 w-full h-full text-on-surface opacity-[0.03] stroke-current stroke-[0.5] fill-none" viewBox="0 0 100 60" preserveAspectRatio="none">
                      <circle cx="50" cy="30" r="25" />
                      <circle cx="50" cy="30" r="15" />
                    </svg>
                    
                    <div className="flex justify-between items-start mb-6">
                      <span className="text-[10px] font-mono tracking-widest text-on-surface-variant uppercase">YourWay {selectedUpgradePlan}</span>
                      <svg className="w-8 h-8 text-on-surface opacity-40 fill-current" viewBox="0 0 24 24">
                        <circle cx="8" cy="12" r="6" />
                        <circle cx="16" cy="12" r="6" />
                      </svg>
                    </div>

                    <div className="text-base md:text-lg font-mono tracking-wider tabular-nums text-on-surface mb-6">
                      {cardNumber || '•••• •••• •••• ••••'}
                    </div>

                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-[8px] text-on-surface-variant uppercase block">Cardholder</span>
                        <span className="text-xs font-mono text-on-surface truncate max-w-[150px] inline-block uppercase">
                          {cardHolder || 'ALEXANDER SMIRNOV'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[8px] text-on-surface-variant uppercase block">Expires</span>
                        <span className="text-xs font-mono text-on-surface tabular-nums">
                          {cardExpiry || 'MM/YY'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 text-left">
                    <div>
                      <label className="text-[10px] text-on-surface-variant uppercase tracking-wider block mb-1">Имя на карте</label>
                      <input 
                        type="text"
                        placeholder="ALEXANDER SMIRNOV"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                        className="w-full bg-surface-container/40 border border-outline rounded-xl px-4 py-2.5 text-xs text-on-surface uppercase focus:outline-none focus:border-white transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-on-surface-variant uppercase tracking-wider block mb-1">Номер карты</label>
                      <input 
                        type="text"
                        placeholder="4000 1234 5678 9010"
                        maxLength={19}
                        value={cardNumber}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
                          setCardNumber(val);
                        }}
                        className="w-full bg-surface-container/40 border border-outline rounded-xl px-4 py-2.5 text-xs font-mono text-on-surface focus:outline-none focus:border-white transition-colors"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-on-surface-variant uppercase tracking-wider block mb-1">Срок действия</label>
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
                          className="w-full bg-surface-container/40 border border-outline rounded-xl px-4 py-2.5 text-xs font-mono text-on-surface focus:outline-none focus:border-white transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-on-surface-variant uppercase tracking-wider block mb-1">CVC-код</label>
                        <input 
                          type="password"
                          placeholder="•••"
                          maxLength={3}
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ''))}
                          className="w-full bg-surface-container/40 border border-outline rounded-xl px-4 py-2.5 text-xs font-mono text-on-surface focus:outline-none focus:border-white transition-colors"
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
                      className="flex-1 py-3 rounded-xl border border-outline text-on-surface hover:bg-surface-container/40 transition-colors text-xs font-bold"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={handleSubmitPayment}
                      className="flex-1 py-3 rounded-xl bg-on-surface text-black hover:bg-surface-container transition-colors text-xs font-bold"
                    >
                      Оплатить {selectedUpgradePlan === 'ULTRA' ? (billingPeriod === 'monthly' ? '$29.99' : '$249.99') : (billingPeriod === 'monthly' ? '$9.99' : '$89.99')}
                    </button>
                  </div>
                </>
              )}

              {checkoutStage === 'processing' && (
                <div className="py-12 flex flex-col items-center justify-center gap-4">
                  <Loader2 className="w-8 h-8 animate-spin text-on-surface" />
                  <p className="text-sm font-mono text-on-surface-variant">Авторизация платежа...</p>
                  <p className="text-xs text-[#636366] max-w-xs leading-relaxed">
                    Пожалуйста, не закрывайте окно. Мы проверяем безопасность транзакции через 3D-Secure эмуляцию.
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
                      Поздравляем!
                    </h3>
                    <p className="text-sm text-on-background max-w-sm mx-auto leading-relaxed font-medium">
                      Тариф <span className="font-bold text-indigo-400 uppercase tracking-widest">{selectedUpgradePlan}</span> успешно активирован.
                      <br/>
                      <span className="text-xs text-on-surface-variant mt-2 block">
                        Откройте для себя новые возможности обучения с ИИ. Добро пожаловать на новый уровень.
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
                  <p className="text-sm font-mono text-on-surface-variant">Отмена подписки...</p>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <X className="w-5 h-5" strokeWidth={2} />
                  </div>
                  <h3 className="text-xl font-bold text-on-surface mb-2 font-clash">
                    Вы уверены, что хотите отменить подписку?
                  </h3>
                  <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">
                    Вы потеряете доступ ко всем Pro-возможностям, включая безлимитную генерацию курсов (останется только 1 активный), память сессий AI-ментора, экспертные лиги и PDF-сертификаты.
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
