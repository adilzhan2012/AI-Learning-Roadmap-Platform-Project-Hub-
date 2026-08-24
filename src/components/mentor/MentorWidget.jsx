import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, db, functions } from '../../firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { doc, setDoc, collection, query, orderBy, getDocs, deleteDoc } from 'firebase/firestore';
import { usePlanLimits } from '../../hooks/usePlanLimits.js';
import { PLAN_LIMITS } from '../../constants/planLimits.js';
import MentorBubble from './MentorBubble.jsx';
import { useLocale } from '../../i18n.js';
import { getUserStats, getUserCourses, callGeminiWithRetry } from '../../services/courseService.js';
import { buildMentorContext } from '../../services/mentorContext/index.js';

// Modular UI Components & Theme Hook
import { useMentorTheme } from './hooks/useMentorTheme.js';
import { useMentorResize } from './hooks/useMentorResize.js';
import MentorHeader from './components/MentorHeader.jsx';
import MentorSidebar from './components/MentorSidebar.jsx';
import MentorEmptyState from './components/MentorEmptyState.jsx';
import MentorMessageList from './components/MentorMessageList.jsx';
import MentorInput from './components/MentorInput.jsx';
import MentorFooter from './components/MentorFooter.jsx';
import MentorBackdrop from './components/MentorBackdrop.jsx';

// Feature flag for Vertex AI Gemini Function Calling (Tool Use)
const USE_FUNCTION_CALLING = true;

export default function MentorWidget() {
  const navigate = useNavigate();
  const location = useLocation();
  const locale = useLocale();
  const [user, setUser] = useState(auth.currentUser);
  const [isOpen, setIsOpen] = useState(false);
  const [courses, setCourses] = useState([]);
  const [profile, setProfile] = useState({});
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generatedTopics, setGeneratedTopics] = useState(new Set());
  const [timeRemaining, setTimeRemaining] = useState('');
  const [feedbacks, setFeedbacks] = useState({});

  const { isDark, neutral, getCategoryTokens } = useMentorTheme();
  const { size, startResizing } = useMentorResize();

  const { plan, usage, checkLimit, incrementUsage } = usePlanLimits();
  const isProSoftCapped = plan === 'PRO' && (usage.mentorMessagesUsed || 0) >= PLAN_LIMITS.PRO.aiMentorPerDay;

  // Calculate live countdown timer to 00:00 UTC for soft-cap reset
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const nextUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
      const diffMs = nextUtc.getTime() - now.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      setTimeRemaining(`${hours}ч ${mins}м`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleFeedback = async (msgId, replyContent, rating) => {
    setFeedbacks(prev => ({ ...prev, [msgId]: rating }));
    try {
      const saveFn = httpsCallable(functions, 'saveMentorFeedback');
      await saveFn({
        messageId: msgId,
        queryText: "",
        replyText: replyContent,
        rating,
        modelName: isProSoftCapped ? 'gemini-2.5-flash' : 'gemini-2.5-pro',
        context: 'global_widget'
      });
    } catch (e) {
      console.error("Failed to save mentor feedback:", e);
    }
  };
  
  const regTime = new Date(auth.currentUser?.metadata?.creationTime || new Date()).getTime();
  const nowTime = new Date().getTime();
  const daysSinceReg = (nowTime - regTime) / (1000 * 60 * 60 * 24);
  const isFreeOnboarding = daysSinceReg <= 7;

  const chatEndRef = useRef(null);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Sync auth state & initial user data
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
          console.error("Failed to load mentor widget context data:", e);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Load mentor session history from Firestore if Pro/Ultra or 48h LocalStorage for Free
  useEffect(() => {
    if (!user || loading) return;
    
    const loadSessionHistory = async () => {
      if (plan === 'PRO' || plan === 'ULTRA') {
        try {
          const sessionsCol = collection(db, 'users', user.uid, 'mentorSessions');
          const q = query(sessionsCol, orderBy('createdAt', 'desc'));
          const snap = await getDocs(q);
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          
          const now = new Date().getTime();
          const thresholdDays = plan === 'ULTRA' ? 10 : plan === 'PRO' ? 5 : 0;
          const thresholdMs = thresholdDays * 24 * 60 * 60 * 1000;
          
          const validList = [];
          for (const session of list) {
            const sessionTime = session.createdAt?.toMillis ? session.createdAt.toMillis() : new Date(session.createdAt).getTime();
            if (thresholdMs > 0 && (now - sessionTime > thresholdMs)) {
              deleteDoc(doc(db, 'users', user.uid, 'mentorSessions', session.id)).catch(() => {});
            } else {
              validList.push(session);
            }
          }

          setSessions(validList);
          if (validList.length > 0) {
            setActiveSessionId(validList[0].id);
            setMessages(validList[0].messages || []);
          } else {
            // Create default session
            const newId = Date.now().toString();
            const newSession = {
              id: newId,
              title: 'Первый диалог',
              createdAt: new Date(),
              mode: 'global',
              contextId: null,
              messages: []
            };
            const docRef = doc(db, 'users', user.uid, 'mentorSessions', newId);
            await setDoc(docRef, newSession);
            setSessions([newSession]);
            setActiveSessionId(newId);
            setMessages([]);
          }
        } catch (e) {
          console.error("Failed to load mentor sessions:", e);
        }
      } else {
        // FREE users get a single local session persisted in localStorage for 48 hours
        try {
          const savedMessages = localStorage.getItem('free_mentor_messages');
          const savedTimestamp = parseInt(localStorage.getItem('free_mentor_timestamp') || '0', 10);
          const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;
          if (savedMessages && (Date.now() - savedTimestamp < FORTY_EIGHT_HOURS)) {
            setMessages(JSON.parse(savedMessages));
          } else {
            setMessages([]);
          }
        } catch (err) {
          setMessages([]);
        }
        setSessions([]);
        setActiveSessionId('free_local');
      }
    };
    loadSessionHistory();
  }, [user, plan, loading]);

  // Auto Scroll to Bottom of Chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, generating]);

  // Helper to extract JSON from assistant responses (briefing draft or final confirmation)
  const parseJsonBlock = (text) => {
    try {
      const cleanText = text.trim();
      const firstBrace = cleanText.indexOf('{');
      const lastBrace = cleanText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        const jsonStr = cleanText.substring(firstBrace, lastBrace + 1);
        const data = JSON.parse(jsonStr);
        if (data.action === 'propose_course' || data.action === 'generate_course') {
          return data;
        }
      }
    } catch (e) {
      // Not a valid json block
    }
    return null;
  };

  const handleCreateNewSession = async () => {
    if (plan === 'FREE') return;
    const newId = Date.now().toString();
    const newSession = {
      id: newId,
      title: `Диалог #${sessions.length + 1}`,
      createdAt: new Date(),
      mode: 'global',
      contextId: null,
      messages: []
    };
    try {
      const docRef = doc(db, 'users', user.uid, 'mentorSessions', newId);
      await setDoc(docRef, newSession);
      setSessions(prev => [newSession, ...prev]);
      setActiveSessionId(newId);
      setMessages([]);
    } catch (e) {
      console.error("Failed to create new session:", e);
    }
  };

  const handleSelectSession = (sessionId) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setActiveSessionId(sessionId);
      setMessages(session.messages || []);
    }
  };

  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation();
    if (!user) return;
    try {
      const docRef = doc(db, 'users', user.uid, 'mentorSessions', sessionId);
      await deleteDoc(docRef);
      const filtered = sessions.filter(s => s.id !== sessionId);
      setSessions(filtered);
      if (activeSessionId === sessionId) {
        if (filtered.length > 0) {
          setActiveSessionId(filtered[0].id);
          setMessages(filtered[0].messages || []);
        } else {
          // If no sessions left, create a default one
          const newId = Date.now().toString();
          const newSession = {
            id: newId,
            title: 'Первый диалог',
            createdAt: new Date(),
            mode: 'global',
            contextId: null,
            messages: []
          };
          const newDocRef = doc(db, 'users', user.uid, 'mentorSessions', newId);
          await setDoc(newDocRef, newSession);
          setSessions([newSession]);
          setActiveSessionId(newId);
          setMessages([]);
        }
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  const handleRenameSubmit = async (sessionId) => {
    if (!editingTitle.trim()) {
      setEditingSessionId(null);
      return;
    }
    try {
      const docRef = doc(db, 'users', user.uid, 'mentorSessions', sessionId);
      await setDoc(docRef, { title: editingTitle }, { merge: true });
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title: editingTitle } : s));
    } catch (e) {
      console.error("Failed to rename session:", e);
    }
    setEditingSessionId(null);
  };

  const handleSendMessage = async (e, textOverride = null) => {
    if (e) e.preventDefault();
    const text = textOverride || input;
    if (!text.trim() || generating) return;

    if (!user) {
      navigate('/login');
      return;
    }

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
      if ((plan === 'PRO' || plan === 'ULTRA') && user && activeSessionId) {
        const docRef = doc(db, 'users', user.uid, 'mentorSessions', activeSessionId);
        
        // Auto-rename dialog based on first query
        const currentSession = sessions.find(s => s.id === activeSessionId);
        let currentTitle = currentSession?.title || 'Диалог';
        const needsRename = currentTitle.startsWith('Диалог #') || currentTitle === 'Первый диалог';
        
        let displayTitle = currentTitle;
        if (needsRename) {
          displayTitle = text.substring(0, 25) + (text.length > 25 ? '...' : '');
        }

        const updateData = { 
          messages: next, 
          title: displayTitle,
          mode: 'global',
          contextId: null
        };

        setDoc(docRef, updateData, { merge: true }).then(() => {
          setSessions(sPrev => sPrev.map(s => s.id === activeSessionId ? { ...s, title: displayTitle, messages: next } : s));
          
          // Trigger async smart rename if needed
          if (needsRename) {
            const prompt = `Сгенерируй очень короткий заголовок (максимум 3-4 слова) для диалога, отражающий суть вопроса. Вопрос: "${text}". Выведи только заголовок, без кавычек и точек.`;
            callGeminiWithRetry(null, prompt, 'ai_question', 'gemini-2.5-flash').then(smartTitle => {
              if (smartTitle && smartTitle.trim()) {
                const cleanTitle = smartTitle.trim().replace(/^["']|["']$/g, '').substring(0, 40);
                setDoc(docRef, { title: cleanTitle, mode: 'global', contextId: null }, { merge: true }).then(() => {
                  setSessions(sPrev => sPrev.map(s => s.id === activeSessionId ? { ...s, title: cleanTitle } : s));
                });
              }
            }).catch(err => console.error("Smart rename failed:", err));
          }
        }).catch(err => {
          console.error("Failed to save session history:", err);
        });
      }
      return next;
    });

    if (!textOverride) setInput('');
    setGenerating(true);

    try {
      const enrolledCoursesText = courses.length > 0 
        ? courses.map(c => `- ${c.title} (${c.level}, Прогресс: ${c.progress}%)`).join('\n')
        : 'Нет активных курсов.';

      const isComplexQuery = text.length > 200 || text.toLowerCase().includes('объясни') || text.toLowerCase().includes('почему') || text.toLowerCase().includes('ошибка');
      const selectedModel = isProSoftCapped 
        ? 'gemini-2.5-flash' 
        : (isComplexQuery ? 'gemini-2.5-pro' : 'gemini-2.5-flash');

      const mentorContext = await buildMentorContext({
        userId: user?.uid,
        mode: 'global',
        contextId: activeSessionId || null,
        userProfile: {
          name: profile.firstName || (locale === 'en' ? 'Learner' : 'Пользователь'),
          firstName: profile.firstName,
          streakDays: profile.streakDays || 1,
          enrolledCourses: courses
        },
        courseLanguage: locale === 'en' ? 'en' : 'ru',
        historyOverride: messages
      });

      const response = await callGeminiWithRetry(
        null,
        null,
        'mentor_message',
        selectedModel,
        null,
        {
          mentorContext,
          userQuery: text,
          returnFullResponse: true
        }
      );

      const responseText = typeof response === 'string' ? response : (response?.result || '');
      const responseToolCall = typeof response === 'object' ? response?.toolCall : null;

      let parsedAction = null;
      if (USE_FUNCTION_CALLING && responseToolCall) {
        if (responseToolCall.name === 'propose_course' || responseToolCall.name === 'generate_course') {
          parsedAction = {
            action: responseToolCall.name,
            topic: responseToolCall.args?.topic,
            level: responseToolCall.args?.difficulty || responseToolCall.args?.level || 'Intermediate',
            modules: responseToolCall.args?.modules || [],
            preferences: responseToolCall.args?.preferences || { dailyTime: '45m', duration: '1 month' }
          };
        }
      } else {
        // Fallback to legacy string JSON parsing
        parsedAction = parseJsonBlock(responseText);
      }
      
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText || 'Извините, не удалось сгенерировать ответ.',
        toolCall: responseToolCall
      };

      setMessages(prev => {
        const next = [...prev, assistantMessage];
        if (plan === 'FREE') {
          try {
            localStorage.setItem('free_mentor_messages', JSON.stringify(next));
            localStorage.setItem('free_mentor_timestamp', Date.now().toString());
          } catch (e) {}
        }
        if ((plan === 'PRO' || plan === 'ULTRA') && user && activeSessionId) {
          const docRef = doc(db, 'users', user.uid, 'mentorSessions', activeSessionId);
          setDoc(docRef, { 
            messages: next,
            mode: 'global',
            contextId: null
          }, { merge: true }).then(() => {
            setSessions(sPrev => sPrev.map(s => s.id === activeSessionId ? { ...s, messages: next } : s));
          }).catch(err => {
            console.error("Failed to save session history:", err);
          });
        }
        return next;
      });

      const promptTokens = Math.ceil(text.length / 4);
      const responseTokens = Math.ceil((responseText || '').length / 4);
      const totalTokens = promptTokens + responseTokens;

      await incrementUsage('mentor_message', totalTokens);

      if (parsedAction && parsedAction.action === 'generate_course') {
        await triggerCourseGeneration(parsedAction.topic, parsedAction.level, parsedAction.preferences);
      }

    } catch (err) {
      console.error("Mentor widget chat error:", err);
      const errMsg = err?.message || err?.details || '';
      if (errMsg.includes('PRO_ROADMAP_LIMIT_EXCEEDED') || errMsg.includes('PRO_ROADMAP')) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '⚠️ Достигнут лимит (2 AI-курса в месяц) для тарифа **PRO**. Перейдите на тариф **ULTRA** для неограниченной генерации курсов!'
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '⚠️ Не удалось связаться с AI Наставником. Пожалуйста, попробуйте еще раз.'
        }]);
      }
    } finally {
      setGenerating(false);
    }
  };

  const triggerCourseGeneration = (topic, level, preferences) => {
    if (!user) return;
    setIsOpen(false);
    setGeneratedTopics(prev => new Set([...prev, topic]));
    navigate('/graph', {
      state: {
        isGenerating: true,
        topic,
        level: level || 'Intermediate',
        preferences: preferences || { dailyTime: '45m', duration: '1 month' },
        userUid: user.uid
      }
    });
  };

  const handleClearHistory = async () => {
    const defaultMsg = [
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Привет! Я твой персональный AI-ментор. Готов помочь разобраться в сложных темах. Задай мне любой вопрос!'
      }
    ];
    setMessages(defaultMsg);
    if ((plan === 'PRO' || plan === 'ULTRA') && user && activeSessionId) {
      try {
        const docRef = doc(db, 'users', user.uid, 'mentorSessions', activeSessionId);
        await setDoc(docRef, { messages: defaultMsg }, { merge: true });
        setSessions(sPrev => sPrev.map(s => s.id === activeSessionId ? { ...s, messages: defaultMsg } : s));
      } catch (e) {
        console.error("Failed to clear chat history:", e);
      }
    }
  };

  const cleanMessageContent = (content) => {
    const firstBrace = content.indexOf('```json');
    if (firstBrace !== -1) {
      const lastBrace = content.lastIndexOf('```');
      if (lastBrace > firstBrace) {
        return content.substring(0, firstBrace) + content.substring(lastBrace + 3);
      }
    }
    const firstSingleBrace = content.indexOf('{');
    if (firstSingleBrace !== -1) {
      const lastSingleBrace = content.lastIndexOf('}');
      if (lastSingleBrace > firstSingleBrace) {
        if (content.includes('"action"') && content.includes('"topic"')) {
          return content.substring(0, firstSingleBrace) + content.substring(lastSingleBrace + 1);
        }
      }
    }
    return content;
  };

  const isPublicRoute = ['/', '/login', '/register'].includes(location.pathname);
  if (isPublicRoute || !user) return null;

  const totalLimit = plan === 'ULTRA' 
    ? PLAN_LIMITS.ULTRA.aiMentorTokensPerDay 
    : plan === 'PRO'
      ? PLAN_LIMITS.PRO.aiMentorPerDay
      : (isFreeOnboarding ? PLAN_LIMITS.FREE.onboardingMessagesTotal : PLAN_LIMITS.FREE.aiMentorPerDay);

  const currentUsed = plan === 'ULTRA'
    ? (usage.ultraTokensUsed || 0)
    : (usage.mentorMessagesUsed || 0);

  const remainingPercent = Math.max(0, Math.min(100, ((totalLimit - currentUsed) / totalLimit) * 100));

  return (
    <>
      {/* Mentor Bubble Component */}
      <MentorBubble 
        isOpen={isOpen} 
        onOpenMentor={() => setIsOpen(true)} 
        streakDays={profile?.streakDays || 0}
      />

      {/* Floating Action Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 50 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-[90px] right-4 md:bottom-8 md:left-8 md:right-auto z-[90] h-14 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 border border-indigo-400/30 flex items-center justify-center text-white shadow-[0_8px_30px_rgb(99,102,241,0.4)] hover:scale-105 active:scale-95 transition-all select-none group px-4 gap-2.5"
          >
            {/* SVG Progress Ring */}
            <div className="relative w-7 h-7 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.5" stroke="currentColor" strokeWidth="2.5" className="text-white/20" fill="transparent" />
                <circle
                  cx="18" cy="18" r="15.5"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="text-indigo-300 transition-all duration-500"
                  fill="transparent"
                  strokeDasharray={97.39}
                  strokeDashoffset={97.39 - (97.39 * remainingPercent) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <BrainCircuit className="w-4 h-4 text-white animate-pulse group-hover:scale-110 transition-transform relative z-10" />
            </div>

            <span className="hidden sm:inline-block text-xs font-bold tracking-wide text-white">
              {locale === 'en' ? 'AI Mentor' : 'AI Наставник'}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Modal Window */}
      <AnimatePresence>
        {isOpen && (
          <div 
            className={`fixed inset-0 z-[95] flex items-center justify-center p-0 md:p-4 ${neutral.modalOverlay}`}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{
                width: window.innerWidth >= 768 ? `${size.width}px` : '100%',
                height: window.innerWidth >= 768 ? `${size.height}px` : '100%',
                maxWidth: '95vw',
                maxHeight: '92vh',
              }}
              className={`w-full md:border rounded-none md:rounded-2xl flex flex-col relative select-none font-sans overflow-hidden ${neutral.modalBg}`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Animated Backdrop Blur Spots */}
              <MentorBackdrop isDark={isDark} />

              {/* Header */}
              <MentorHeader 
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                onClose={() => setIsOpen(false)}
                plan={plan}
                locale={locale}
                themeTokens={neutral}
              />

              {/* Modal Inner Workspace */}
              <div className="flex-1 flex min-h-0 overflow-hidden relative z-10">
                {/* Left Sidebar - Dialogues History List */}
                <MentorSidebar 
                  isOpen={isSidebarOpen}
                  onCloseMobile={() => setIsSidebarOpen(false)}
                  sessions={sessions}
                  activeSessionId={activeSessionId}
                  onSelectSession={handleSelectSession}
                  onCreateNewSession={handleCreateNewSession}
                  onDeleteSession={handleDeleteSession}
                  onRenameSubmit={handleRenameSubmit}
                  editingSessionId={editingSessionId}
                  setEditingSessionId={setEditingSessionId}
                  editingTitle={editingTitle}
                  setEditingTitle={setEditingTitle}
                  plan={plan}
                  locale={locale}
                  themeTokens={neutral}
                  getCategoryTokens={getCategoryTokens}
                  onUpgrade={() => { setIsOpen(false); navigate('/pricing'); }}
                />

                {/* Right Chat Area */}
                <div className={`flex-1 flex flex-col min-h-0 relative ${neutral.chatAreaBg}`}>
                  {messages.length === 0 ? (
                    <MentorEmptyState 
                      profile={profile}
                      locale={locale}
                      onSelectPrompt={(prompt) => handleSendMessage(null, prompt)}
                      getCategoryTokens={getCategoryTokens}
                      themeTokens={neutral}
                    />
                  ) : (
                    <MentorMessageList 
                      messages={messages}
                      generating={generating}
                      feedbacks={feedbacks}
                      onFeedback={handleFeedback}
                      onTriggerCourseGeneration={triggerCourseGeneration}
                      generatedTopics={generatedTopics}
                      onNavigateToGraph={() => {
                        setIsOpen(false);
                        navigate('/graph');
                      }}
                      chatEndRef={chatEndRef}
                      locale={locale}
                      themeTokens={neutral}
                      cleanMessageContent={cleanMessageContent}
                      parseJsonBlock={parseJsonBlock}
                      useFunctionCalling={USE_FUNCTION_CALLING}
                    />
                  )}

                  {/* Input Bar */}
                  <MentorInput 
                    input={input}
                    setInput={setInput}
                    onSendMessage={handleSendMessage}
                    generating={generating}
                    plan={plan}
                    isProSoftCapped={isProSoftCapped}
                    timeRemaining={timeRemaining}
                    locale={locale}
                    themeTokens={neutral}
                    onUpgrade={() => { setIsOpen(false); navigate('/pricing'); }}
                  />

                  {/* Info Footer */}
                  <MentorFooter 
                    plan={plan}
                    usage={usage}
                    isFreeOnboarding={isFreeOnboarding}
                    onClearHistory={handleClearHistory}
                    locale={locale}
                    themeTokens={neutral}
                  />
                </div>
              </div>

              {/* Desktop Resize Drag Handle (Bottom Right Corner) */}
              <div
                onMouseDown={startResizing}
                className="hidden md:block absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-30 opacity-40 hover:opacity-100 transition-opacity"
                title={locale === 'en' ? 'Drag to resize window' : 'Потяните, чтобы изменить размер окна'}
              >
                <svg viewBox="0 0 16 16" className="w-full h-full fill-current text-zinc-400">
                  <path d="M14 14H12V12H14V14ZM14 10H12V8H14V10ZM10 14H8V12H10V14ZM14 6H12V4H14V6ZM6 14H4V12H6V14Z" />
                </svg>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
