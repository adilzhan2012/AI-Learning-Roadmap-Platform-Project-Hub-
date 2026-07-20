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
import { auth, db } from '../firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { callGroqWithRetry, getUserCourses, getUserStats } from '../services/courseService.js';
import { usePlanLimits } from '../hooks/usePlanLimits.js';
import { PLAN_LIMITS } from '../constants/planLimits.js';
import ReactMarkdown from 'react-markdown';
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
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Привет! Я твой персональный AI-ментор. Я вижу твой прогресс по курсам, результаты квизов и готов помочь разобрать любые сложные темы, объяснить ошибки в тестах или подсказать, как оптимизировать твою дорожную карту обучения. О чём бы ты хотел узнать?'
    }
  ]);
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
          
          const key = true;
          if (!key) {
            setApiKeyError(true);
          }
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
      const apiKey = null;
      if (false) {
        setApiKeyError(true);
        throw new Error('MISSING_API_KEY');
      }

      // Build context-rich system prompt for Groq
      const enrolledCoursesText = courses.length > 0 
        ? courses.map(c => `- ${c.title} (${c.level}, Прогресс: ${c.progress}%)`).join('\n')
        : 'Нет активных курсов.';

      const systemPrompt = `You are an expert AI Mentor on the learning platform yourway.co.
User Context:
- Name: ${profile.firstName || 'Пользователь'}
- Subscription Plan: ${plan}
- Weekly Streak: ${profile.streakDays || 1} days

Enrolled Roadmaps & Progress:
${enrolledCoursesText}

INSTRUCTIONS:
1. Be a supportive, friendly, and expert technical tutor.
2. Adapt your tone and explanation complexity based on the user's queries.
3. If they mention they are stuck or it's "too hard/too easy", guide them to regenerate their roadmap in the dashboard with customized parameters.
4. Keep your responses highly educational, structured, and clear. Use Markdown (bold text, lists, code snippets, blockquotes).
5. Address the user directly using their name when appropriate.
6. Strictly respond in the language of the user's message (default to Russian).
7. If they ask about quiz errors, explain the underlying logic thoroughly so they understand.`;

      // Smart model routing: use Llama 3.1 8B for short queries to minimize token cost, Llama 3.3 70B for complex/deep responses
      const isComplexQuery = text.length > 200 || text.toLowerCase().includes('объясни') || text.toLowerCase().includes('почему') || text.toLowerCase().includes('ошибка');
      const selectedModel = isComplexQuery ? 'llama-3.3-70b-versatile' : 'llama-3.1-8b-instant';

      const fullPrompt = `${systemPrompt}\n\nUser Question: ${text}`;
      const responseText = await callGroqWithRetry(apiKey, fullPrompt, selectedModel);

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText || 'Извините, не удалось сгенерировать ответ.'
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

      await incrementUsage('mentor_message');
    } catch (err) {
      console.error("Mentor chat error:", err);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '⚠️ Произошла ошибка при соединении с AI-ментором. Пожалуйста, убедитесь, что у вас настроен правильный Groq API Key в Настройках.'
      }]);
    } finally {
      setGenerating(false);
    }
  };

  const handleSuggestClick = (suggestion) => {
    setInput(suggestion);
  };

  const handleClearHistory = async () => {
    const defaultMsg = [
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Привет! Я твой персональный AI-ментор. Я вижу твой прогресс по курсам, результаты квизов и готов помочь разобрать любые сложные темы, объяснить ошибки в тестах или подсказать, как оптимизировать твою дорожную карту обучения. О чём бы ты хотел узнать?'
      }
    ];
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

  const limitVal = plan === 'PRO' ? PLAN_LIMITS.PRO.maxMentorMessages : PLAN_LIMITS.FREE.maxMentorMessages;
  const messagesRemaining = Math.max(0, limitVal - (usage.mentorMessagesUsed || 0));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#000000] text-white">
        <Loader2 className="w-8 h-8 animate-spin text-white mb-2" />
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
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
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
            {plan === 'PRO' 
              ? 'В PRO тарифе вам доступно до 50 сообщений ментору в день.' 
              : 'В бесплатном тарифе вам доступно 5 пробных сообщений в месяц.'}
          </p>
          <div className="space-y-2">
            <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, ((usage.mentorMessagesUsed || 0) / limitVal) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-mono text-on-surface-variant">
              <span>Использовано: {usage.mentorMessagesUsed || 0}</span>
              <span>Осталось: {messagesRemaining}</span>
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
                <span className="px-1.5 py-0.5 text-[8px] font-bold tracking-widest text-[#98989D] border border-[#98989D]/30 rounded leading-none uppercase">
                  Pro
                </span>
              </h2>
              <span className="text-xs text-on-surface-variant flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                В сети • На базе Groq
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {plan === 'PRO' && (
              <button 
                onClick={handleClearHistory}
                className="text-[10px] text-[#98989D] hover:text-white border border-[#98989D]/20 hover:border-white/40 rounded-xl px-2.5 py-1.5 flex items-center gap-1 transition-all"
                title="Очистить историю сессии"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Новый диалог</span>
              </button>
            )}
            <div className="text-right">
            {plan === 'PRO' ? (
              <span className="text-xs text-[#98989D] font-medium font-sans">
                Обращений сегодня: <span className="font-mono font-bold text-white">{usage.mentorMessagesUsed || 0}</span>
              </span>
            ) : (
              <div className="flex flex-col items-end gap-1">
                <span className="text-[11px] text-[#98989D] font-medium">
                  <span className="font-mono font-bold text-white">{usage.mentorMessagesUsed || 0}</span> из <span className="font-mono text-white">5</span> сообщений в этом месяце
                </span>
                <div className="w-24 bg-white/10 h-1 rounded-full overflow-hidden">
                  <div 
                    className="bg-white h-full rounded-full transition-all duration-300"
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
                <h5 className="font-bold mb-1">API ключ Groq отсутствует</h5>
                <p className="text-xs text-red-500/80 leading-relaxed mb-3">
                  Для работы AI-ментора необходимо указать ключ API. Вы можете получить его бесплатно на сайте Groq Console и вставить в личном кабинете.
                </p>
                <button 
                  onClick={() => navigate('/settings')}
                  className="bg-red-500 text-white font-bold px-4 py-2 rounded-xl text-xs hover:bg-red-600 transition-colors"
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
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-primary text-on-primary' : 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-500'}`}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                </div>

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
        {messagesRemaining <= 0 ? (
          <div className="p-6 border-t border-outline-variant bg-[#1C1C1E] flex flex-col sm:flex-row items-center justify-between gap-4 flex-shrink-0 rounded-b-3xl">
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                <Lock className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div>
                <h5 className="font-bold text-sm text-white">Достигнут лимит сообщений ментора</h5>
                <p className="text-xs text-[#98989D] leading-tight mt-0.5">
                  {plan === 'PRO' 
                    ? 'Вы израсходовали 50 сообщений на сегодня. Лимит обнулится завтра.' 
                    : 'Купите подписку Pro, чтобы общаться с ментором до 50 раз в день.'}
                </p>
              </div>
            </div>
            {plan !== 'PRO' && (
              <button
                type="button"
                onClick={() => navigate('/pricing')}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold bg-[#FFFFFF] text-[#000000] hover:bg-[#F5F5F7] transition-all text-xs"
              >
                Получить Pro
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="p-4 border-t border-outline-variant bg-surface-container-lowest flex items-center gap-3 flex-shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={generating || apiKeyError}
              placeholder={apiKeyError ? "Настройте Groq API Key для отправки сообщений..." : "Задайте вопрос AI-ментору..."}
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
        )}
      </div>

      <UpgradeModal 
        isOpen={isUpgradeModalOpen} 
        onClose={() => setUpgradeModalOpen(false)} 
        onUpgrade={async () => {
          // Perform automatic PRO plan upgrade on button click in demo environment!
          const user = auth.currentUser;
          if (user) {
            const ref = doc(db, 'users', user.uid, 'subscription', 'details');
            await setDoc(ref, { plan: 'PRO' }, { merge: true });
            setUpgradeModalOpen(false);
            window.location.reload();
          }
        }} 
      />
    </div>
  );
}
