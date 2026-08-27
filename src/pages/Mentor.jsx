import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Send, 
  Loader2, 
  User, 
  Crown, 
  ArrowLeft,
  AlertTriangle,
  RefreshCw,
  MessageSquare,
  HelpCircle,
  Lock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth, db, functions } from '../firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { callGeminiWithRetry, getUserCourses, getUserStats } from '../services/courseService.js';
import { buildMentorContext } from '../services/mentorContext/index.js';
import { usePlanLimits } from '../hooks/usePlanLimits.js';
import { PLAN_LIMITS } from '../constants/planLimits.js';
import ReactMarkdown from 'react-markdown';
import UserAvatar from '../components/shared/UserAvatar.jsx';
import UpgradeModal from '../components/shared/UpgradeModal.jsx';
import { t } from '../i18n.js';

const messageVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function Mentor() {
  const navigate = useNavigate();
  const [user, setUser] = useState(auth.currentUser);
  const [courses, setCourses] = useState([]);
  const [profile, setProfile] = useState({});
  const initialLocale = localStorage.getItem('yourway-locale') || 'ru';
  const getInitialWelcome = (loc = initialLocale) => ({
    id: 'welcome',
    role: 'assistant',
    content: loc === 'en'
      ? "Hello! I am your personal AI Mentor. I track your roadmap progress, quiz results, and I'm ready to help explain challenging concepts, break down quiz errors, or help you optimize your study trajectory. What would you like to explore today?"
      : "Привет! Я твой персональный AI-ментор. Я вижу твой прогресс по курсам, результаты квизов и готов помочь разобрать любые сложные темы, объяснить ошибки в тестах или подсказать, как оптимизировать твою дорожную карту обучения. О чём бы ты хотел узнать?"
  });

  const [messages, setMessages] = useState([getInitialWelcome()]);
  const [input, setInput] = useState('');
  const [generating, setGenerating] = useState(false);
  const [apiKeyError, setApiKeyError] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const { plan, usage, checkLimit, incrementUsage, isUpgradeModalOpen, setUpgradeModalOpen } = usePlanLimits();
  const chatEndRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const stats = await getUserStats(currentUser.uid);
          setProfile(stats);
          
          const userCourses = await getUserCourses(currentUser.uid);
          setCourses(userCourses);
        } catch (e) {
          console.error("Failed to load mentor context data:", e);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
        navigate('/');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // Load mentor session history from Firestore if Pro
  useEffect(() => {
    if (!user || loading) return;
    
    const loadSessionHistory = async () => {
      if (plan === 'PRO') {
        try {
          const docRef = doc(db, 'users', user.uid, 'mentorSession', 'history');
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data().messages) {
            setMessages(docSnap.data().messages);
          }
        } catch (e) {
          console.error("Failed to load mentor chat history:", e);
        }
      }
    };
    loadSessionHistory();
  }, [user, plan, loading]);

  // Handle Initial Prompt from Session Storage (e.g., from quiz errors redirect)
  useEffect(() => {
    if (!loading && !apiKeyError) {
      const initialPrompt = sessionStorage.getItem('mentor_initial_prompt');
      if (initialPrompt) {
        sessionStorage.removeItem('mentor_initial_prompt');
        handleSendMessage(null, initialPrompt);
      }
    }
  }, [loading, apiKeyError]);

  // Auto Scroll to Bottom of Chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, generating]);

  const handleSendMessage = async (e, textOverride = null) => {
    if (e) e.preventDefault();
    const text = textOverride || input;
    if (!text.trim() || generating) return;

    // Check plan limits
    if (!checkLimit('mentor_message')) {
      return;
    }

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text
    };

    setMessages(prev => {
      const next = [...prev, userMessage];
      if (plan === 'PRO' && user) {
        const docRef = doc(db, 'users', user.uid, 'mentorSession', 'history');
        setDoc(docRef, { messages: next }, { merge: true }).catch(err => {
          console.error("Failed to save session history:", err);
        });
      }
      return next;
    });

    if (!textOverride) setInput('');
    setGenerating(true);

    try {
      // Smart model routing: use Gemini 2.5 Flash for short queries, Gemini 2.5 Pro for complex/deep responses
      const isProSoftCapped = plan === 'PRO' && (usage.mentorMessagesUsed || 0) >= PLAN_LIMITS.PRO.aiMentorPerDay;
      const isComplexQuery = text.length > 200 || text.toLowerCase().includes('объясни') || text.toLowerCase().includes('почему') || text.toLowerCase().includes('ошибка');
      
      const selectedModel = isProSoftCapped 
        ? 'gemini-2.5-flash' 
        : (isComplexQuery ? 'gemini-2.5-pro' : 'gemini-2.5-flash');

      const activeLocale = profile.locale || localStorage.getItem('yourway-locale') || 'ru';
      const mentorContext = await buildMentorContext({
        userId: user?.uid,
        mode: 'global',
        contextId: null,
        userProfile: {
          name: profile.firstName || (activeLocale === 'en' ? 'Learner' : 'Пользователь'),
          firstName: profile.firstName,
          streakDays: profile.streakDays || 1,
          enrolledCourses: courses
        },
        courseLanguage: activeLocale === 'en' ? 'en' : 'ru',
        historyOverride: messages
      });

      const responseText = await callGeminiWithRetry(
        null,
        null,
        'mentor_message',
        selectedModel,
        null,
        {
          mentorContext,
          userQuery: text
        }
      );

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText || (activeLocale === 'en' ? 'Sorry, failed to generate a response.' : 'Извините, не удалось сгенерировать ответ.')
      };

      setMessages(prev => {
        const next = [...prev, assistantMessage];
        if (plan === 'PRO' && user) {
          const docRef = doc(db, 'users', user.uid, 'mentorSession', 'history');
          setDoc(docRef, { messages: next }, { merge: true }).catch(err => {
            console.error("Failed to save session history:", err);
          });
        }
        return next;
      });

      const promptTokens = Math.ceil(text.length / 4);
      const responseTokens = Math.ceil((responseText || '').length / 4);
      const totalTokens = promptTokens + responseTokens;

      await incrementUsage('mentor_message', totalTokens);
    } catch (err) {
      console.error("Mentor chat error:", err);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: t('mentor.errorGeneric') || '⚠️ An error occurred. Please try again.'
      }]);
    } finally {
      setGenerating(false);
    }
  };

  const handleSuggestClick = (suggestion) => {
    setInput(suggestion);
  };

  const handleClearHistory = async () => {
    const activeLocale = profile.locale || localStorage.getItem('yourway-locale') || 'ru';
    const defaultMsg = [getInitialWelcome(activeLocale)];
    setMessages(defaultMsg);
    if (plan === 'PRO' && user) {
      try {
        const docRef = doc(db, 'users', user.uid, 'mentorSession', 'history');
        await setDoc(docRef, { messages: defaultMsg }, { merge: true });
      } catch (e) {
        console.error("Failed to clear chat history:", e);
      }
    }
  };

  const regTime = new Date(auth.currentUser?.metadata?.creationTime || new Date()).getTime();
  const nowTime = new Date().getTime();
  const daysSinceReg = (nowTime - regTime) / (1000 * 60 * 60 * 24);
  const isFreeOnboarding = daysSinceReg <= 7;

  const limitVal = plan === 'ULTRA' 
    ? PLAN_LIMITS.ULTRA.aiMentorTokensPerDay 
    : (plan === 'PRO' ? PLAN_LIMITS.PRO.aiMentorPerDay : (isFreeOnboarding ? PLAN_LIMITS.FREE.onboardingMessagesTotal : PLAN_LIMITS.FREE.aiMentorPerDay));
    
  const isProSoftCapped = plan === 'PRO' && (usage.mentorMessagesUsed || 0) >= PLAN_LIMITS.PRO.aiMentorPerDay;
  
  const remainingVal = plan === 'ULTRA'
    ? Math.max(0, limitVal - (usage.ultraTokensUsed || 0))
    : Math.max(0, limitVal - (usage.mentorMessagesUsed || 0));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-on-surface w-full">
        <Loader2 className="w-8 h-8 animate-spin text-on-surface mb-2" />
        <p className="text-sm text-on-surface-variant font-mono">Подключение к AI-ментору...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-4.5rem)] flex flex-col md:flex-row gap-6 p-4 md:p-6 font-sans text-on-surface">
      {/* Left Context & Stats Panel */}
      <div className="w-full md:w-80 shrink-0 flex flex-col gap-4">
        {/* Profile Card */}
        <div className="bg-surface border border-outline-variant rounded-3xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-on-surface font-bold text-lg">
              {profile.firstName?.charAt(0) || '?'}
            </div>
            <div>
              <h3 className="font-bold text-on-surface leading-tight">{profile.firstName || 'Студент'}</h3>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 border rounded uppercase ${plan === 'PRO' ? 'text-amber-500 border-amber-500/30 bg-amber-500/10' : 'text-on-surface-variant border-outline-variant'}`}>
                  {plan}
                </span>
                {plan !== 'PRO' && (
                  <button 
                    onClick={() => setUpgradeModalOpen(true)}
                    className="text-[10px] text-indigo-400 hover:underline font-bold"
                  >
                    Купить PRO
                  </button>
                )}
              </div>
            </div>
          </div>
          
          <div className="border-t border-outline-variant/50 pt-4 space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-on-surface-variant">Серия активности:</span>
              <span className="font-bold font-mono">{profile.streakDays || 1} дн. 🔥</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-on-surface-variant">Изучено часов:</span>
              <span className="font-bold font-mono">{profile.hoursLearned || 0} ч.</span>
            </div>
          </div>
        </div>

        {/* AI Usage Limits Card */}
        <div className="bg-surface border border-outline-variant rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Crown className="w-5 h-5 text-amber-500" />
            <h4 className="font-bold text-sm">Лимиты сообщений</h4>
          </div>
          <p className="text-xs text-on-surface-variant mb-4 leading-relaxed">
            {plan === 'ULTRA' 
              ? 'В ULTRA тарифе вам доступен дневной бюджет в 300 000 токенов.' 
              : plan === 'PRO'
                ? 'В PRO тарифе вам доступно до 40 сообщений ментору в день.' 
                : isFreeOnboarding
                  ? `Вам доступен приветственный пакет из ${PLAN_LIMITS.FREE.onboardingMessagesTotal} сообщений на первые 7 дней.`
                  : `Вам доступно до ${PLAN_LIMITS.FREE.aiMentorPerDay} сообщений ментору в день.`}
          </p>
          <div className="space-y-2">
            <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${Math.min(100, (
                    plan === 'ULTRA' 
                      ? ((usage.ultraTokensUsed || 0) / limitVal) * 100 
                      : ((usage.mentorMessagesUsed || 0) / limitVal) * 100
                  ))}%` 
                }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-mono text-on-surface-variant">
              <span>Использовано: {plan === 'ULTRA' ? (usage.ultraTokensUsed || 0) : (usage.mentorMessagesUsed || 0)}</span>
              <span>
                Осталось: {plan === 'ULTRA' 
                  ? `${remainingVal.toLocaleString()} токенов` 
                  : `${remainingVal} сообщ.`}
              </span>
            </div>
          </div>
        </div>

        {/* Active Courses Context Card */}
        <div className="bg-surface border border-outline-variant rounded-3xl p-6 shadow-sm hidden md:flex flex-col flex-1 overflow-hidden">
          <h4 className="font-bold text-sm mb-4">Текущий прогресс</h4>
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
            {courses.length === 0 ? (
              <p className="text-xs text-on-surface-variant italic">Вы еще не сгенерировали дорожные карты.</p>
            ) : (
              courses.map(course => (
                <div key={course.id} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium truncate max-w-[70%]">{course.title}</span>
                    <span className="font-bold font-mono text-on-surface-variant">{course.progress}%</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-primary h-full rounded-full"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right Chat Interface */}
      <div className="flex-1 bg-surface border border-outline-variant rounded-3xl shadow-sm flex flex-col overflow-hidden relative">
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-lowest flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base flex items-center gap-1.5 leading-tight">
                AI Ментор 
                <span className="px-1.5 py-0.5 text-[8px] font-bold tracking-widest text-on-surface-variant border border-[#98989D]/30 rounded leading-none uppercase">
                  Pro
                </span>
              </h2>
              <span className="text-xs text-on-surface-variant flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                В сети • На базе Gemini
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {plan === 'PRO' && (
              <button 
                onClick={handleClearHistory}
                className="text-[10px] text-on-surface-variant hover:text-on-surface border border-[#98989D]/20 hover:border-white/40 rounded-xl px-2.5 py-1.5 flex items-center gap-1 transition-all"
                title="Очистить историю сессии"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Новый диалог</span>
              </button>
            )}
            <div className="text-right">
            {plan === 'PRO' ? (
              <span className="text-xs text-on-surface-variant font-medium font-sans">
                Обращений сегодня: <span className="font-mono font-bold text-on-surface">{usage.mentorMessagesUsed || 0}</span>
              </span>
            ) : (
              <div className="flex flex-col items-end gap-1">
                <span className="text-[11px] text-on-surface-variant font-medium">
                  <span className="font-mono font-bold text-on-surface">{usage.mentorMessagesUsed || 0}</span> из <span className="font-mono text-on-surface">5</span> сообщений в этом месяце
                </span>
                <div className="w-24 bg-on-surface/10 h-1 rounded-full overflow-hidden">
                  <div 
                    className="bg-on-surface h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, ((usage.mentorMessagesUsed || 0) / 5) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

        {/* Message Panel */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 custom-scrollbar bg-surface-container-lowest/20">
          {apiKeyError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl flex gap-3 items-start text-sm">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="font-bold mb-1">API ключ Gemini отсутствует</h5>
                <p className="text-xs text-red-500/80 leading-relaxed mb-3">
                  Для работы AI-ментора необходимо указать ключ API. Вы можете получить его в Google AI Studio и вставить в личном кабинете.
                </p>
                <button 
                  onClick={() => navigate('/settings')}
                  className="bg-red-500 text-on-surface font-bold px-4 py-2 rounded-xl text-xs hover:bg-red-600 transition-colors"
                >
                  Перейти в Настройки
                </button>
              </div>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                variants={messageVariants}
                initial="hidden"
                animate="visible"
                className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                {msg.role === 'user' ? (
                  <UserAvatar 
                    photoURL={profile.photoURL}
                    firstName={profile.firstName}
                    lastName={profile.lastName}
                    email={user?.email}
                    avatarColor={profile.avatarColor}
                    className="w-8 h-8 shadow-sm text-xs"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm bg-indigo-500/10 border border-indigo-500/20 text-indigo-500">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                {/* Bubble */}
                <div className={`p-4 rounded-2xl text-sm leading-relaxed border ${msg.role === 'user' ? 'bg-primary text-on-primary border-primary rounded-tr-none' : 'bg-surface border-outline-variant/60 rounded-tl-none text-on-surface shadow-sm'}`}>
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div className="prose dark:prose-invert prose-xs max-w-none font-sans text-on-surface">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {generating && (
              <motion.div
                variants={messageVariants}
                initial="hidden"
                animate="visible"
                className="flex gap-4 max-w-[85%]"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center flex-shrink-0 animate-pulse">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="p-4 rounded-2xl bg-surface border border-outline-variant/60 rounded-tl-none flex items-center gap-2 text-on-surface-variant font-mono text-xs">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                  <span>Ментор формулирует мысль...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={chatEndRef} />
        </div>

        {/* Suggested Prompts (Horizontal Scroll) */}
        {messages.length === 1 && !generating && (
          <div className="px-6 py-2 flex gap-2 overflow-x-auto flex-shrink-0 custom-scrollbar border-t border-outline-variant/30 select-none">
            {[
              'Как мне лучше подготовиться к следующей теме?',
              'Объясни сложную математику в нейросетях простыми словами',
              'Как оптимизировать дорожную карту, если мне слишком сложно?',
              'Освежи мою память по основам машинного обучения'
            ].map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestClick(s)}
                className="whitespace-nowrap px-3 py-1.5 bg-surface-container border border-outline-variant hover:bg-surface-container-high rounded-full text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-all flex-shrink-0"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar or Paywall */}
        {((plan === 'FREE' && (usage.mentorMessagesUsed || 0) >= limitVal) ||
          (plan === 'ULTRA' && (usage.ultraTokensUsed || 0) >= PLAN_LIMITS.ULTRA.aiMentorTokensPerDay)) ? (
          <div className="p-6 border-t border-outline-variant bg-surface flex flex-col sm:flex-row items-center justify-between gap-4 flex-shrink-0 rounded-b-3xl">
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 bg-on-surface/5 border border-white/10 rounded-xl flex items-center justify-center text-on-surface flex-shrink-0">
                <Lock className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div>
                <h5 className="font-bold text-sm text-on-surface">Достигнут лимит сообщений ментора</h5>
                <p className="text-xs text-on-surface-variant leading-tight mt-0.5">
                  {plan === 'ULTRA' 
                    ? 'Вы израсходовали дневной бюджет токенов тарифа ULTRA. Лимит обнулится завтра.' 
                    : `Вы исчерпали доступные сообщения на сегодня. Обновите тариф для продолжения.`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/pricing')}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold bg-on-surface text-inverse-on-surface hover:bg-[#F5F5F7] transition-all text-xs"
            >
              {plan === 'FREE' ? 'Купить PRO' : 'Посмотреть тарифы'}
            </button>
          </div>
        ) : (
          <div className="flex flex-col flex-shrink-0 w-full">
            {isProSoftCapped && (
              <div className="px-6 py-2 bg-amber-500/10 border-t border-outline-variant/30 text-[11px] text-amber-500 flex items-center justify-between select-none">
                <span className="font-medium">⚠️ Достигнут лимит Gemini Pro. Чат переведен на упрощенную модель ИИ Flash.</span>
                <button 
                  type="button" 
                  onClick={() => navigate('/pricing')} 
                  className="font-bold underline hover:text-amber-400 ml-2"
                >
                  Перейти на ULTRA
                </button>
              </div>
            )}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-outline-variant bg-surface-container-lowest flex items-center gap-3 w-full">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={generating || apiKeyError}
                placeholder={apiKeyError ? "Настройте Gemini API Key для отправки сообщений..." : "Задайте вопрос AI-ментору..."}
                className="flex-1 bg-surface border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/45 focus:border-primary transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || generating || apiKeyError}
                className="bg-primary hover:bg-primary/95 text-on-primary w-11 h-11 rounded-xl flex items-center justify-center shadow-lg transition-transform hover:scale-102 active:scale-98 disabled:opacity-40 disabled:hover:scale-100 disabled:active:scale-100 flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>

      <UpgradeModal 
        isOpen={isUpgradeModalOpen} 
        onClose={() => setUpgradeModalOpen(false)} 
        onUpgrade={async () => {
          // Perform automatic PRO plan upgrade on button click in demo environment!
          const user = auth.currentUser;
          if (user) {
            try {
              const updateSubFn = httpsCallable(functions, 'updateSubscription');
              await updateSubFn({ plan: 'PRO' });
              setUpgradeModalOpen(false);
              window.location.reload();
            } catch (e) {
              console.error(e);
              alert(e.message || "Ошибка при обновлении подписки. Пожалуйста, убедитесь, что ваш email верифицирован.");
            }
          }
        }} 
      />
    </div>
  );
}
