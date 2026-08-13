import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Send, 
  Loader2, 
  Crown, 
  X, 
  BookOpen, 
  Calendar,
  ArrowRight,
  Trash2,
  Lock,
  Menu,
  Edit2,
  Plus,
  BrainCircuit
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, db, functions } from '../firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { doc, getDoc, setDoc, collection, query, orderBy, getDocs, deleteDoc } from 'firebase/firestore';
import { usePlanLimits } from '../hooks/usePlanLimits.js';
import { PLAN_LIMITS } from '../constants/planLimits.js';
import ReactMarkdown from 'react-markdown';
import MentorBubble from './MentorBubble.jsx';
import { t, useLocale } from '../i18n.js';
import { getUserStats, getUserCourses, callGeminiWithRetry } from '../services/courseService.js';

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
  const [courseGenerating, setCourseGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generatedTopics, setGeneratedTopics] = useState(new Set());
  const [timeRemaining, setTimeRemaining] = useState('');
  const [feedbacks, setFeedbacks] = useState({});

  const { plan, usage, checkLimit, incrementUsage, isUpgradeModalOpen, setUpgradeModalOpen } = usePlanLimits();
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
        modelName: isProSoftCapped ? 'llama-3.1-8b-instant' : 'llama-3.3-70b-versatile',
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
          const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
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
  }, [messages, generating, courseGenerating]);

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
            messages: []
          };
          const newDocRef = doc(db, 'users', user.uid, 'mentorSessions', newId);
          await setDoc(newDocRef, newSession);
          setSessions([newSession]);
          setActiveSessionId(newId);
          setMessages([]);
        }
      }
    } catch (e) {
      console.error("Failed to delete session:", e);
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
    if (!text.trim() || generating || courseGenerating) return;

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
          title: displayTitle 
        };

        setDoc(docRef, updateData, { merge: true }).then(() => {
          setSessions(sPrev => sPrev.map(s => s.id === activeSessionId ? { ...s, title: displayTitle, messages: next } : s));
          
          // Trigger async smart rename if needed
          if (needsRename) {
            const prompt = `Сгенерируй очень короткий заголовок (максимум 3-4 слова) для диалога, отражающий суть вопроса. Вопрос: "${text}". Выведи только заголовок, без кавычек и точек.`;
            callGeminiWithRetry(null, prompt, 'gemini-2.5-flash').then(smartTitle => {
              if (smartTitle && smartTitle.trim()) {
                const cleanTitle = smartTitle.trim().replace(/^["']|["']$/g, '').substring(0, 40);
                setDoc(docRef, { title: cleanTitle }, { merge: true }).then(() => {
                  setSessions(sPrev => sPrev.map(s => s.id === activeSessionId ? { ...s, title: cleanTitle } : s));
                });
              }
            }).catch(e => console.error("Smart rename failed:", e));
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

      let planCourseInstruction = '';
      if (plan === 'ULTRA') {
        planCourseInstruction = `
ULTRA SUBSCRIBER SPECIAL ABILITY - INTERACTIVE ROADMAP BRIEFING:
If the user wants to learn a new topic, prepare for an interview, or create a syllabus (e.g. "Хочу подтянуть Go для backend-разработки"):
1. CRITICAL: You MUST FIRST guide them through an interactive briefing. Ask 2-3 clarifying questions about their background, their schedule, and their exact goals. Do NOT output any JSON draft until they have answered your questions.
2. ONLY AFTER they have provided these details, suggest a customized course pacing and list of modules.
3. When you show them a draft of the course modules and schedule, you MUST output this draft as a JSON block matching the following structure so the application can render a custom interactive UI:
\`\`\`json
{
  "action": "propose_course",
  "topic": "Go для backend-разработки",
  "level": "Intermediate",
  "preferences": {
    "dailyTime": "45m",
    "courseStyle": "Friendly",
    "flashcardCount": "5",
    "prerequisites": "Skip basic programming concepts",
    "duration": "3 months, 45m on weekdays, 2h on Saturday"
  },
  "modules": [
    "Введение в синтаксис Go",
    "Конкурентность и горутины",
    "Веб-серверы и API на Go"
  ]
}
\`\`\`
Ask them if the modules look good or if they want to adjust anything.
4. Once they explicitly confirm they are happy with the draft structure, reply with a confirmation and output a final JSON block:
\`\`\`json
{
  "action": "generate_course",
  "topic": "Go для backend-разработки",
  "level": "Intermediate",
  "preferences": {
    "dailyTime": "45m",
    "courseStyle": "Friendly",
    "flashcardCount": "5",
    "prerequisites": "Skip basic programming concepts",
    "duration": "3 months, 45m on weekdays, 2h on Saturday"
  }
}
\`\`\`
This will trigger the automatic course generation. Keep the JSON blocks valid.`;
      } else if (plan === 'PRO') {
        planCourseInstruction = `
PRO SUBSCRIBER ABILITY - DIRECT COURSE PROPOSAL:
If the user asks to create a course or learn a topic (e.g. "составь курс по React"):
1. Immediately output a proposed course JSON block matching:
\`\`\`json
{
  "action": "propose_course",
  "topic": "Тема курса",
  "level": "Intermediate",
  "preferences": {
    "dailyTime": "30m",
    "courseStyle": "Practical",
    "flashcardCount": "5",
    "prerequisites": "Basic skills",
    "duration": "1 month"
  },
  "modules": [
    "Модуль 1",
    "Модуль 2",
    "Модуль 3"
  ]
}
\`\`\`
2. In text, tell them you generated a standard roadmap for them. Add a note: "Подсказка: На подписке **ULTRA** я могу провести персональный бриф из 3 вопросов и подстроить программу под твой график и стек."`;
      }

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
3. Keep your responses highly educational, structured, and clear.
4. CRITICAL: ALWAYS respond ENTIRELY in Russian. Do NOT use Chinese characters or English unless quoting code.
5. Address the user by name, but ONLY ONCE at the very beginning of the conversation. Do NOT repeat greetings like "Привет, Имя" or "Добрый день" in every single message. Just jump straight into answering the question.
6. IMPORTANT LIMITATION: If the user asks to create, design, compose, or write a course syllabus, roadmap, or study plan (e.g., "составь курс", "сделай программу обучения"):
   - If they are on plan "ULTRA", guide them through the interactive briefing (as instructed below).
   - If they are on plan "PRO", generate the direct course proposal as instructed below.
   - If they are on plan "FREE", you MUST politely refuse to draft or write the syllabus. Explain that personalized course generation, interactive syllabus briefings, and materials-based roadmaps (RAG) are exclusive to PRO and ULTRA plans. Suggest they upgrade to PRO or ULTRA to unlock this capability.
7. IMPORTANT: Do NOT assume the user wants to discuss their existing courses unless they explicitly mention them. If they ask to "create a course" or "learn a new topic", they are asking for a NEW course, so IGNORE the existing enrolled roadmaps.
8. REMEMBER THE CONTEXT: You must continue the conversation based on the 'Conversation History' provided below. Do not repeat questions you already asked.
9. WOW FACTOR - PERSONALIZED ANALOGIES: When explaining complex technical concepts (like concurrency, pointers, algorithms, state management), use vivid real-world analogies tailored to everyday situations to make the explanation unforgettable.
${planCourseInstruction}`;

      const isComplexQuery = text.length > 200 || text.toLowerCase().includes('объясни') || text.toLowerCase().includes('почему') || text.toLowerCase().includes('ошибка');
      const selectedModel = isProSoftCapped 
        ? 'gemini-2.5-flash' 
        : (isComplexQuery ? 'gemini-2.5-pro' : 'gemini-2.5-flash');

      const historyText = messages.slice(-6).map(m => {
        if (m.id === 'welcome' || !m.content) return '';
        return `${m.role === 'user' ? 'User' : 'Assistant'}: ${cleanMessageContent(m.content)}`;
      }).filter(Boolean).join('\n\n');

      const fullPrompt = `${systemPrompt}\n\nConversation History:\n${historyText || 'No previous history.'}\n\nUser Question: ${text}`;
      const responseText = await callGeminiWithRetry(null, fullPrompt, 'mentor_message', selectedModel);

      const parsedAction = parseJsonBlock(responseText);
      
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText || 'Извините, не удалось сгенерировать ответ.'
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
          setDoc(docRef, { messages: next }, { merge: true }).then(() => {
            setSessions(sPrev => sPrev.map(s => s.id === activeSessionId ? { ...s, messages: next } : s));
          }).catch(err => {
            console.error("Failed to save session history:", err);
          });
        }
        return next;
      });

      const promptTokens = Math.ceil((text.length + systemPrompt.length) / 4);
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
    setGeneratedTopics(prev => new Set([...prev, topic]));
    navigate('/graph', {
      state: {
        isGenerating: true,
        topic,
        level,
        preferences,
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
            className="fixed bottom-6 right-6 z-[90] h-14 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 border border-indigo-400/30 flex items-center justify-center text-on-surface shadow-[0_8px_30px_rgb(99,102,241,0.4)] hover:scale-105 active:scale-95 transition-all select-none group px-4 gap-2.5"
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[95] flex items-center justify-center p-0 md:p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                y: 0, 
                width: '100%',
              }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="h-[100%] md:h-[620px] w-full max-w-[750px] bg-surface-container-high/95 md:border border-outline-variant rounded-none md:rounded-2xl flex flex-col shadow-2xl overflow-y-auto backdrop-blur-md select-none font-sans text-on-surface relative animate-in fade-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-surface border-b border-outline-variant h-14 flex items-center justify-between px-4 sm:px-6 shrink-0 z-20 relative">
                <div className="flex items-center gap-2.5">
                  <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1.5 hover:bg-surface-container rounded-lg text-on-surface-variant hover:text-on-surface transition-colors mr-1">
                    <Menu className="w-6 h-6" />
                  </button>
                  <div className="hidden sm:flex w-8 h-8 rounded-lg bg-indigo-500/10 items-center justify-center border border-indigo-500/20">
                    <BrainCircuit className="w-5 h-5 text-indigo-400" />
                  </div>
                  <span className="text-base font-bold text-on-surface tracking-tight flex items-center gap-2">
                    {locale === 'en' ? 'AI Mentor' : 'AI Ментор'}
                    {plan === 'ULTRA' ? (
                      <span className="text-[9px] font-black tracking-widest text-indigo-500 dark:text-indigo-300 border border-indigo-500/35 px-2 py-0.5 rounded bg-indigo-500/10 uppercase hidden sm:inline-block">Ultra</span>
                    ) : plan === 'PRO' ? (
                      <span className="text-[9px] font-black tracking-widest text-amber-500 dark:text-amber-300 border border-amber-500/35 px-2 py-0.5 rounded bg-amber-500/10 uppercase hidden sm:inline-block">Pro</span>
                    ) : null}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-surface-container rounded-lg text-on-surface-variant hover:text-on-surface transition-colors">
                    <X className="w-6 h-6 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Inner Workspace */}
              <div className="flex-1 flex min-h-0 overflow-hidden relative">
                
                {/* Mobile Sidebar Overlay */}
                {isSidebarOpen && (
                  <div 
                    className="absolute inset-0 bg-black/50 z-10 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                  />
                )}

                {/* Left Sidebar - Dialogues History List */}
                <div className={`
                  absolute z-20 h-full bg-surface-container border-r border-outline-variant flex flex-col shrink-0
                  transition-all duration-300 ease-in-out overflow-hidden
                  ${isSidebarOpen ? 'translate-x-0 w-[240px] md:w-[220px] md:relative' : '-translate-x-full w-[240px] md:w-0 border-r-0 md:relative'}
                `}>
                  {/* New Session Button */}
                  <div className="p-3 border-b border-outline-variant shrink-0">
                    <button 
                      onClick={handleCreateNewSession}
                      disabled={plan === 'FREE'}
                      className="w-full flex items-center justify-center gap-1.5 bg-on-surface hover:opacity-80 disabled:opacity-50 text-surface py-2.5 rounded-xl text-sm font-bold transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      {locale === 'en' ? 'New Chat' : 'Новый диалог'}
                    </button>
                  </div>

                  {/* Sessions List */}
                  {plan === 'FREE' ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-4 text-center text-zinc-500 gap-2">
                      <Lock className="w-5 h-5 text-zinc-600" />
                      <span className="text-[10px] leading-relaxed">
                        {locale === 'en' 
                          ? <>Chat history is available with <strong>PRO</strong> and <strong>ULTRA</strong> plans</>
                          : <>История диалогов доступна на тарифах <strong>PRO</strong> и <strong>ULTRA</strong></>}
                      </span>
                      <button 
                        onClick={() => { setIsOpen(false); navigate('/pricing'); }} 
                        className="mt-2 text-[10px] bg-amber-500 hover:bg-amber-400 text-black px-3 py-1.5 rounded-lg font-extrabold transition-colors uppercase tracking-wider"
                      >
                        {locale === 'en' ? 'Upgrade to PRO' : 'Купить PRO'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
                      {sessions.map(s => (
                        <div 
                          key={s.id}
                          onClick={() => handleSelectSession(s.id)}
                          className={`group w-full px-3 py-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-colors border ${
                            activeSessionId === s.id 
                              ? 'bg-indigo-600/10 border-indigo-500/35 text-indigo-300' 
                              : 'hover:bg-on-surface/5 border-transparent text-zinc-400 hover:text-on-surface'
                          }`}
                        >
                          {editingSessionId === s.id ? (
                            <input
                              autoFocus
                              value={editingTitle}
                              onChange={e => setEditingTitle(e.target.value)}
                              onBlur={() => handleRenameSubmit(s.id)}
                              onKeyDown={e => { if(e.key === 'Enter') handleRenameSubmit(s.id); if(e.key === 'Escape') setEditingSessionId(null); }}
                              onClick={e => e.stopPropagation()}
                              className="text-xs bg-transparent border-b border-indigo-500 outline-none text-on-surface w-[110px]"
                            />
                          ) : (
                            <span className="text-xs font-medium truncate max-w-[130px]">{s.title}</span>
                          )}
                          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-all shrink-0">
                            <button 
                              onClick={(e) => { e.stopPropagation(); setEditingSessionId(s.id); setEditingTitle(s.title); }}
                              className="p-1 hover:bg-surface-container rounded text-zinc-500 hover:text-indigo-400"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={(e) => handleDeleteSession(e, s.id)}
                              className="p-1 hover:bg-surface-container rounded text-zinc-500 hover:text-rose-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Chat Area */}
                <div className="flex-1 flex flex-col min-h-0 bg-surface-container-low relative">
                  {/* Chat Body */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 scrollbar-thin relative flex flex-col">
                    {messages.length === 0 && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 pointer-events-none">
                        <div className="max-w-md w-full animate-in fade-in zoom-in duration-500">
                          <h2 className="text-2xl font-bold text-on-surface mb-2">
                            {new Date().getHours() < 6
                              ? (locale === 'en' ? 'Good night' : 'Доброй ночи')
                              : new Date().getHours() < 12
                              ? (locale === 'en' ? 'Good morning' : 'Доброе утро')
                              : new Date().getHours() < 18
                              ? (locale === 'en' ? 'Good afternoon' : 'Добрый день')
                              : (locale === 'en' ? 'Good evening' : 'Добрый вечер')}, {profile?.firstName || (locale === 'en' ? 'Learner' : 'Пользователь')}!
                          </h2>
                          <p className="text-on-surface-variant text-base">
                            {locale === 'en' ? 'What would you like to explore today?' : 'Чем сегодня займемся?'}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {messages.map((msg, index) => {
                      const isAssistant = msg.role === 'assistant';
                      const cleanContent = cleanMessageContent(msg.content);
                      const proposalData = isAssistant ? parseJsonBlock(msg.content) : null;

                      return (
                        <div key={msg.id || index} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                          {cleanContent.trim() && (
                            <div className={`max-w-[85%] rounded-3xl p-4 text-sm leading-relaxed ${
                              msg.role === 'user'
                                ? 'bg-surface-container-high dark:bg-[#2F2F2F] text-on-surface rounded-br-none shadow-sm'
                                : 'text-on-surface bg-transparent rounded-bl-none px-0'
                            }`}>
                              <div className={`markdown-content prose dark:prose-invert text-left ${msg.role === 'user' ? 'text-on-surface' : ''}`}>
                                <ReactMarkdown>
                                  {cleanContent}
                                </ReactMarkdown>
                              </div>
                              {isAssistant && msg.id !== 'welcome' && (
                                <div className="flex items-center gap-2 mt-2 pt-1 border-t border-outline-variant/30">
                                  <button
                                    onClick={() => handleFeedback(msg.id, cleanContent, 1)}
                                    className={`text-xs px-2 py-0.5 rounded-lg border transition-colors ${feedbacks[msg.id] === 1 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-bold' : 'bg-surface-container border-outline-variant text-on-surface-variant hover:text-emerald-400'}`}
                                    title={locale === 'en' ? 'Helpful answer' : 'Полезный ответ'}
                                  >
                                    👍
                                  </button>
                                  <button
                                    onClick={() => handleFeedback(msg.id, cleanContent, -1)}
                                    className={`text-xs px-2 py-0.5 rounded-lg border transition-colors ${feedbacks[msg.id] === -1 ? 'bg-rose-500/20 text-rose-400 border-rose-500/30 font-bold' : 'bg-surface-container border-outline-variant text-on-surface-variant hover:text-rose-400'}`}
                                    title={locale === 'en' ? 'Unclear answer' : 'Непонятный ответ'}
                                  >
                                    👎
                                  </button>
                                  {feedbacks[msg.id] && (
                                    <span className="text-[10px] text-indigo-400 font-medium animate-in fade-in">
                                      {locale === 'en' ? 'Thanks for feedback!' : 'Спасибо за отзыв!'}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {proposalData && proposalData.action === 'propose_course' && (
                            <div className="w-full max-w-[90%] bg-gradient-to-b from-indigo-500/10 to-indigo-500/5 dark:from-[#1E1B4B]/80 dark:to-[#111827]/80 border border-indigo-500/30 rounded-2xl p-4 mt-2 shadow-lg shadow-indigo-500/5 dark:shadow-indigo-950/20 text-left">
                              <div className="flex items-center justify-between mb-3 border-b border-indigo-500/10 pb-2">
                                <span className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 tracking-wider uppercase flex items-center gap-1">
                                  <Crown className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 animate-pulse" />
                                  {locale === 'en' ? 'Personal Proposal' : 'Персональное предложение'}
                                </span>
                                <span className="text-[8px] bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/20 dark:border-indigo-400/30 text-indigo-600 dark:text-indigo-300 px-1.5 py-0.5 rounded font-mono uppercase">
                                  {proposalData.level}
                                </span>
                              </div>

                              <h4 className="text-sm font-bold text-on-surface mb-1.5">
                                📚 {proposalData.topic}
                              </h4>
                              <p className="text-xs text-on-surface-variant leading-relaxed mb-3">
                                {proposalData.preferences.duration} • {proposalData.preferences.dailyTime} {locale === 'en' ? '/ day' : 'в день'}
                              </p>
                              
                              <button 
                                onClick={() => triggerCourseGeneration(proposalData.topic, proposalData.level, proposalData.preferences)}
                                disabled={courseGenerating || generatedTopics.has(proposalData.topic)}
                                className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-on-surface font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {generatedTopics.has(proposalData.topic) 
                                  ? (locale === 'en' ? '✅ Roadmap Launched' : '✅ Роудмап запущен') 
                                  : (locale === 'en' ? 'Generate & Launch Roadmap' : 'Сгенерировать и запустить роудмап')}
                                {!generatedTopics.has(proposalData.topic) && <ArrowRight className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          )}

                          {isAssistant && cleanContent.includes('[Перейти к графу знаний]') && (
                            <button
                              onClick={() => {
                                setIsOpen(false);
                                navigate('/graph');
                              }}
                              className="mt-2 py-1.5 px-3 bg-on-surface/10 hover:bg-on-surface/15 border border-white/10 rounded-lg text-on-surface font-bold text-[10px] flex items-center gap-1 transition-all"
                            >
                              🚀 {locale === 'en' ? 'Open Knowledge Graph' : 'Открыть Граф знаний'}
                            </button>
                          )}
                        </div>
                      );
                    })}

                    {generating && (
                      <div className="flex items-center gap-2 text-on-surface-variant text-[10px] bg-surface border border-outline-variant w-fit rounded-xl px-3 py-2 select-none">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500 dark:text-indigo-400" />
                        <span>{locale === 'en' ? 'Mentor is thinking...' : 'Наставник думает...'}</span>
                      </div>
                    )}

                    {courseGenerating && (
                      <div className="flex flex-col items-center justify-center py-4 bg-indigo-500/5 dark:bg-[#1E1B4B]/20 border border-indigo-500/10 rounded-xl gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-indigo-500 dark:text-indigo-400" />
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-300 font-bold">
                          {locale === 'en' ? 'Synthesizing syllabus and content...' : 'Синтез программы и знаний...'}
                        </span>
                      </div>
                    )}

                    <div ref={chatEndRef} />
                  </div>

                  {/* Input Bar */}
                  {isProSoftCapped && (
                    <div className="px-3 py-1.5 bg-amber-500/10 border-t border-outline-variant text-[10px] text-amber-600 dark:text-amber-400 flex items-center justify-between select-none shrink-0 w-full">
                      <span>⚡ Дневной лимит вопросов повышенной точности исчерпан. Используется базовая модель Llama 3.1 8B. Сброс через <strong>{timeRemaining}</strong> (00:00 UTC).</span>
                      <button 
                        type="button"
                        onClick={() => { setIsOpen(false); navigate('/pricing'); }} 
                        className="font-bold underline hover:text-amber-500 dark:hover:text-amber-300 shrink-0 ml-2"
                      >
                        В Ultra
                      </button>
                    </div>
                  )}
                  <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-outline-variant bg-surface flex gap-2 shrink-0 w-full">
                    <input
                      type="text"
                      placeholder={plan === 'ULTRA' ? "Задайте вопрос или составьте бриф..." : "Задайте вопрос ментору..."}
                      disabled={generating || courseGenerating}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className="flex-1 bg-surface-container border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={generating || courseGenerating || !input.trim()}
                      className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-on-surface hover:opacity-80 disabled:opacity-50 disabled:bg-surface-container disabled:text-on-surface-variant text-surface flex items-center justify-center transition-colors shrink-0"
                    >
                      <Send className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                  </form>

                  {/* Info Footer */}
                  <div className="bg-surface-container-low px-4 py-1.5 border-t border-outline-variant flex items-center justify-between text-[9px] text-on-surface-variant shrink-0">
                    <span>
                      Лимит: {plan === 'ULTRA' 
                        ? `${Math.max(0, PLAN_LIMITS.ULTRA.aiMentorTokensPerDay - (usage.ultraTokensUsed || 0)).toLocaleString()} токенов/день` 
                        : plan === 'PRO'
                          ? `${Math.max(0, PLAN_LIMITS.PRO.aiMentorPerDay - (usage.mentorMessagesUsed || 0))} сообщ./день`
                          : `${Math.max(0, (isFreeOnboarding ? PLAN_LIMITS.FREE.onboardingMessagesTotal : PLAN_LIMITS.FREE.aiMentorPerDay) - (usage.mentorMessagesUsed || 0))} сообщ.${isFreeOnboarding ? ' всего (онбординг)' : '/день'}`}
                    </span>
                    <button onClick={handleClearHistory} className="hover:text-on-surface transition-colors">
                      Очистить историю
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
