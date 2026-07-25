import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Network, Loader2, BookOpen, Clock, Brain, Pointer, ZoomIn, ZoomOut, RotateCcw, Lock,
  Code, Terminal, Layers, Database, Cpu, Settings, Shield, Sliders, Globe, Star, Sparkles, Check, Flame, Trophy, Award, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { getUserCourses, callGroqWithRetry } from '../services/courseService.js';
import { t } from '../i18n.js';
import LessonPanel from '../components/lessons/LessonPanel.jsx';
import MasteryBlock from '../components/shared/MasteryBlock.jsx';
import { calculateMastery } from '../hooks/useMastery.js';
import QuizHistoryModal from '../components/quiz/QuizHistoryModal.jsx';
import { usePlanLimits } from '../hooks/usePlanLimits.js';
import { useXP } from '../hooks/useXP.js';
import ReactMarkdown from 'react-markdown';

// Simple vis-network map icons fallback
const iconMap = {
  school: BookOpen,
  activity: Clock,
  brain: Brain,
};

// String hashing helper to generate deterministic offsets
const getNumericHash = (str) => {
  const s = String(str);
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = s.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

// Select topic icon based on title keywords
const getTopicIcon = (node) => {
  const label = (node.label || node.title || '').toLowerCase();
  if (label.includes('intro') || label.includes('введение')) return BookOpen;
  if (label.includes('code') || label.includes('код') || label.includes('program') || label.includes('разработ')) return Code;
  if (label.includes('data') || label.includes('баз') || label.includes('sql') || label.includes('данн')) return Database;
  if (label.includes('system') || label.includes('архитект') || label.includes('устрой')) return Cpu;
  if (label.includes('security') || label.includes('безопасн') || label.includes('auth') || label.includes('защит')) return Shield;
  if (label.includes('setting') || label.includes('настро') || label.includes('конфиг')) return Settings;
  if (label.includes('api') || label.includes('web') || label.includes('сеть') || label.includes('интернет')) return Globe;
  if (label.includes('alg') || label.includes('логик') || label.includes('структур')) return Brain;
  if (label.includes('core') || label.includes('основ') || label.includes('базов')) return Layers;
  
  return iconMap[node.category] || Brain;
};

// Cute inline SVG Go Gopher Mascot Avatar (rendered as sticker)
const GoMascotAvatar = () => (
  <svg viewBox="0 0 100 100" className="w-10 h-10 select-none pointer-events-none drop-shadow-[0_2px_4px_rgba(16,185,129,0.3)]">
    {/* Body - cute light blue */}
    <ellipse cx="50" cy="55" rx="35" ry="30" fill="#00ADD8" />
    {/* Face/eyes area */}
    <ellipse cx="50" cy="48" rx="28" ry="18" fill="#FCEBC8" />
    {/* Eyes */}
    <circle cx="40" cy="45" r="5" fill="#000000" />
    <circle cx="40" cy="43" r="1.5" fill="#FFFFFF" />
    <circle cx="60" cy="45" r="5" fill="#000000" />
    <circle cx="60" cy="43" r="1.5" fill="#FFFFFF" />
    {/* Nose */}
    <ellipse cx="50" cy="50" rx="3.5" ry="2.5" fill="#E57C23" />
    {/* Teeth */}
    <rect x="47" y="52" width="3" height="4.5" fill="#FFFFFF" rx="0.5" />
    <rect x="50" y="52" width="3" height="4.5" fill="#FFFFFF" rx="0.5" />
    {/* Ears */}
    <ellipse cx="20" cy="35" rx="6" ry="8" fill="#00ADD8" transform="rotate(-20 20 35)" />
    <ellipse cx="20" cy="35" rx="3" ry="5" fill="#FCEBC8" transform="rotate(-20 20 35)" />
    <ellipse cx="80" cy="35" rx="6" ry="8" fill="#00ADD8" transform="rotate(20 80 35)" />
    <ellipse cx="80" cy="35" rx="3" ry="5" fill="#FCEBC8" transform="rotate(20 80 35)" />
    {/* Hands / Paws */}
    <circle cx="28" cy="74" r="5" fill="#00ADD8" />
    <circle cx="72" cy="74" r="5" fill="#00ADD8" />
  </svg>
);

// Layout calculation function for directed acyclic graph nodes
const calculateNodePositions = (nodes, edges) => {
  const adj = {};
  const inDegree = {};
  nodes.forEach(n => {
    adj[n.id] = [];
    inDegree[n.id] = 0;
  });
  
  edges.forEach(e => {
    if (adj[e.from]) {
      adj[e.from].push(e.to);
    }
    if (inDegree[e.to] !== undefined) {
      inDegree[e.to]++;
    }
  });

  const queue = [];
  const level = {};
  nodes.forEach(n => {
    if (inDegree[n.id] === 0) {
      queue.push(n.id);
      level[n.id] = 0;
    }
  });

  while (queue.length > 0) {
    const curr = queue.shift();
    const currLevel = level[curr] || 0;
    
    (adj[curr] || []).forEach(next => {
      const nextLevel = Math.max(level[next] || 0, currLevel + 1);
      level[next] = nextLevel;
      queue.push(next);
    });
  }

  nodes.forEach(n => {
    if (level[n.id] === undefined) {
      level[n.id] = 0;
    }
  });

  const levelGroups = {};
  nodes.forEach(n => {
    const l = level[n.id];
    if (!levelGroups[l]) levelGroups[l] = [];
    levelGroups[l].push(n.id);
  });

  const positions = {};
  const spacingX = 240; // Горизонтальный отступ между соседними узлами
  const spacingY = 160; // Вертикальный отступ между уровнями (топиками)
  const startY = 120;
  const centerX = 450; // Центрирование по горизонтали

  Object.entries(levelGroups).forEach(([lStr, nodeIds]) => {
    const l = parseInt(lStr);
    const count = nodeIds.length;
    
    nodeIds.forEach((id, idx) => {
      // Y определяется уровнем (сверху вниз)
      const y = startY + l * spacingY;
      
      // X распределяет сестринские узлы горизонтально (слева направо)
      let x = centerX;
      if (count > 1) {
        const totalWidth = (count - 1) * spacingX;
        x = centerX - totalWidth / 2 + idx * spacingX;
      }
      
      positions[id] = {
        x,
        y
      };
    });
  });

  return positions;
};

// Check if node is leaf node
const isLeafNode = (nodeId, edges) => {
  return !edges.some(e => String(e.from) === String(nodeId));
};

// Find descendants of a node (to hide folded branches)
const getHiddenNodeIds = (foldedSet, nodes, edges) => {
  const hidden = new Set();
  const adj = {};
  nodes.forEach(n => { adj[n.id] = []; });
  edges.forEach(e => {
    if (adj[e.from]) adj[e.from].push(e.to);
  });

  const traverse = (nodeId) => {
    (adj[nodeId] || []).forEach(childId => {
      hidden.add(childId);
      traverse(childId);
    });
  };

  foldedSet.forEach(nodeId => {
    traverse(nodeId);
  });

  return hidden;
};

// Floating background particles
const BackgroundParticles = () => {
  const particles = Array.from({ length: 12 }).map((_, i) => ({
    id: i,
    size: Math.random() * 120 + 60,
    x: Math.random() * 2500 - 500,
    y: Math.random() * 2000 - 500,
    delay: Math.random() * 5,
    duration: Math.random() * 15 + 15,
  }));
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-gradient-to-tr from-blue-500/20 to-purple-500/20 filter blur-3xl"
          style={{
            width: p.size,
            height: p.size,
            left: p.x,
            top: p.y,
          }}
          animate={{
            y: [p.y - 40, p.y + 40, p.y - 40],
            x: [p.x - 20, p.x + 20, p.x - 20],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: p.delay,
          }}
        />
      ))}
    </div>
  );
};

export default function Graph() {
  const navigate = useNavigate();
  const { plan } = usePlanLimits();
  const { userLevelData, addXP } = useXP();
  
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);

  // Draggable node states
  const [draggedOffsets, setDraggedOffsets] = useState({});
  const dragStartRef = useRef(null);
  const [activeDragNodeId, setActiveDragNodeId] = useState(null);

  // Mock Interview States
  const [mockInterviewOpen, setMockInterviewOpen] = useState(false);
  const [interviewMessages, setInterviewMessages] = useState([]);
  const [interviewInput, setInterviewInput] = useState('');
  const [interviewGenerating, setInterviewGenerating] = useState(false);
  const [interviewStage, setInterviewStage] = useState('welcome'); // 'welcome' | 'chat' | 'results'
  const [interviewFeedback, setInterviewFeedback] = useState('');
  const [quizResults, setQuizResults] = useState({});
  const [isStudying, setIsStudying] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [quizRefreshTrigger, setQuizRefreshTrigger] = useState(0);
  const [isLightTheme, setIsLightTheme] = useState(document.documentElement.classList.contains('light'));
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyModalFilterNodeId, setHistoryModalFilterNodeId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  // Layout view container ref
  const containerRef = useRef(null);

  // Folded nodes state
  const [foldedNodes, setFoldedNodes] = useState(new Set());

  // Sync theme changes
  useEffect(() => {
    const handleThemeChange = (e) => {
      setIsLightTheme(e.detail.theme === 'light');
    };
    window.addEventListener('theme:changed', handleThemeChange);
    return () => window.removeEventListener('theme:changed', handleThemeChange);
  }, []);

  // Fetch user profile fields (streak, achievements etc.)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserProfile(docSnap.data());
        }
      }
    });
    return () => unsubscribe();
  }, [quizRefreshTrigger]);

  // Load courses
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          let fetched = await getUserCourses(user.uid);
          if (plan === 'FREE') {
            fetched = fetched.length > 0 ? [fetched[0]] : [];
          }
          setCourses(fetched);
          
          const savedCourseId = localStorage.getItem('selected_course_id');
          const course = fetched.find(c => c.id === savedCourseId) || fetched[0];
          setSelectedCourse(course || null);
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [plan]);

  // Load quiz results
  useEffect(() => {
    const user = auth.currentUser;
    if (!user || !selectedCourse) return;

    const loadQuizResults = async () => {
      try {
        const snap = await getDocs(collection(db, 'users', user.uid, 'quizResults'));
        const resultsMap = {};
        snap.forEach(doc => {
          const data = doc.data();
          if (selectedCourse.nodes.some(n => n.id === data.nodeId)) {
            if (!resultsMap[data.nodeId] || data.lastAttemptAt > resultsMap[data.nodeId].lastAttemptAt) {
              resultsMap[data.nodeId] = data;
            }
          }
        });
        setQuizResults(resultsMap);
      } catch (e) {
        console.error("Failed to load quiz results:", e);
      }
    };

    loadQuizResults();
  }, [selectedCourse, quizRefreshTrigger]);

  const handleStartInterview = async () => {
    setInterviewStage('chat');
    setInterviewGenerating(true);
    setInterviewMessages([]);
    try {
      const prompt = `You are a Team Lead Go backend developer and HR specialist conducting a technical mock interview.
The student is applying for a job and has completed a course on "${selectedCourse?.title}".
Topic description: "${selectedCourse?.description}"

Please start the interview. Greet the student, state your name/role, and ask your first challenging technical question related to the course topic.
Respond in Russian. Keep your introduction short and professional.`;
      const result = await callGroqWithRetry(null, prompt, 'ai_question');
      setInterviewMessages([{
        id: '1',
        role: 'assistant',
        content: result
      }]);
    } catch (e) {
      console.error(e);
      setInterviewMessages([{
        id: '1',
        role: 'assistant',
        content: 'Привет! Я тимлид компании. Давай начнем наше собеседование. Расскажи, пожалуйста, своими словами, как ты понимаешь основные концепты курса?'
      }]);
    } finally {
      setInterviewGenerating(false);
    }
  };

  const handleSendInterviewAnswer = async () => {
    if (!interviewInput.trim() || interviewGenerating) return;
    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: interviewInput
    };
    const updatedMsgs = [...interviewMessages, userMsg];
    setInterviewMessages(updatedMsgs);
    setInterviewInput('');
    setInterviewGenerating(true);

    const answerCount = updatedMsgs.filter(m => m.role === 'user').length;
    
    try {
      if (answerCount >= 3) {
        const prompt = `You are a Team Lead Go backend developer and HR specialist compiling a mock interview scorecard.
Here is the transcript of your mock interview with the student for the course "${selectedCourse?.title}":
${updatedMsgs.map(m => `${m.role === 'user' ? 'Студент' : 'Интервьюер'}: ${m.content}`).join('\n')}

Provide a final detailed performance feedback report in the Russian language. Include:
1. **Технические навыки**: Оцените глубину ответов, точность терминологии и понимание темы.
2. **HR / Soft Skills**: Оцените уверенность ответов и стиль изложения.
3. **Рекомендации**: На какие темы стоит обратить внимание.
4. **Вердикт**: Готовность к реальному собеседованию (в процентах, например: "Готовность: 85%").
Use Markdown formatting.`;
        const feedback = await callGroqWithRetry(null, prompt, 'ai_question');
        setInterviewFeedback(feedback);
        setInterviewStage('results');
        addXP(100, 'AI Mock Interview завершено');
      } else {
        const prompt = `You are a Team Lead Go backend developer and HR specialist conducting a mock interview.
Here is the transcript of your interview so far for the course "${selectedCourse?.title}":
${updatedMsgs.map(m => `${m.role === 'user' ? 'Студент' : 'Интервьюер'}: ${m.content}`).join('\n')}

Analyze the student's last response. Briefly comment on it (constructively) and ask the next technical or HR question to proceed.
Respond in Russian. Keep your reply concise and professional.`;
        const nextQuestion = await callGroqWithRetry(null, prompt, 'ai_question');
        setInterviewMessages([...updatedMsgs, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: nextQuestion
        }]);
      }
    } catch (e) {
      console.error(e);
      setInterviewMessages([...updatedMsgs, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Интересный ответ. Давай перейдем к следующему вопросу. Расскажи подробнее о практическом применении изученных тобою подходов?'
      }]);
    } finally {
      setInterviewGenerating(false);
    }
  };

  // Base node position mapping memo
  const baseNodePositions = useMemo(() => {
    if (!selectedCourse) return {};
    return calculateNodePositions(selectedCourse.nodes, selectedCourse.edges);
  }, [selectedCourse]);

  // Combined positions including dragging offsets
  const nodePositions = useMemo(() => {
    const positions = { ...baseNodePositions };
    Object.entries(draggedOffsets).forEach(([id, offset]) => {
      if (positions[id]) {
        positions[id] = {
          x: baseNodePositions[id].x + offset.x,
          y: baseNodePositions[id].y + offset.y
        };
      }
    });
    return positions;
  }, [baseNodePositions, draggedOffsets]);

  const graphHeight = useMemo(() => {
    if (!selectedCourse || Object.keys(nodePositions).length === 0) return 800;
    const ys = selectedCourse.nodes
      .map(n => nodePositions[n.id]?.y)
      .filter(y => y !== undefined);
    if (ys.length === 0) return 800;
    return Math.max(...ys) + 200;
  }, [selectedCourse, nodePositions]);

  // Node branch folding memo
  const hiddenNodeIds = useMemo(() => {
    if (!selectedCourse) return new Set();
    return getHiddenNodeIds(foldedNodes, selectedCourse.nodes, selectedCourse.edges);
  }, [foldedNodes, selectedCourse]);

  // Reset folded state and dragged offsets on course change
  useEffect(() => {
    setFoldedNodes(new Set());
    setDraggedOffsets({});
  }, [selectedCourse]);

  const handleCourseChange = (e) => {
    const courseId = e.target.value;
    const course = courses.find(c => c.id === courseId);
    setSelectedCourse(course || null);
    setSelectedNode(null);
    localStorage.setItem('selected_course_id', courseId);
  };

  const handleSelectNode = (node) => {
    setSelectedNode(node);
  };

  // Pointer-based dragging handlers to allow card movement without selection conflict
  const handlePointerDown = (e, nodeId) => {
    if (e.button !== 0) return; // Only drag with left click
    if (e.target.closest('.fold-btn')) return; // Ignore drag if clicking fold/unfold button

    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const currentOffset = draggedOffsets[nodeId] || { x: 0, y: 0 };

    dragStartRef.current = {
      startX,
      startY,
      initialOffsetX: currentOffset.x,
      initialOffsetY: currentOffset.y,
      hasMoved: false,
      pointerId: e.pointerId
    };

    setActiveDragNodeId(nodeId);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e, nodeId) => {
    if (activeDragNodeId !== nodeId || !dragStartRef.current) return;
    e.stopPropagation();

    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      dragStartRef.current.hasMoved = true;
    }

    const initialOffsetX = dragStartRef.current.initialOffsetX;
    const initialOffsetY = dragStartRef.current.initialOffsetY;

    setDraggedOffsets(prev => ({
      ...prev,
      [nodeId]: {
        x: initialOffsetX + dx,
        y: initialOffsetY + dy
      }
    }));
  };

  const handlePointerUp = (e, nodeId) => {
    if (activeDragNodeId !== nodeId || !dragStartRef.current) return;
    e.stopPropagation();

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {
      // ignore
    }

    const { hasMoved } = dragStartRef.current;
    dragStartRef.current = null;
    setActiveDragNodeId(null);

    // If there was no drag movement, select the node
    if (!hasMoved) {
      const node = selectedCourse.nodes.find(n => n.id === nodeId);
      if (node) {
        handleSelectNode(node);
      }
    }
  };

  const handleSelectNodeFromHistory = (nodeId) => {
    const node = selectedCourse?.nodes?.find(n => String(n.id) === String(nodeId));
    if (node) {
      handleSelectNode(node);
    }
  };

  const handleNodeDoubleClick = (nodeId) => {
    setFoldedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#07080a] text-zinc-100 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        <p className="text-sm font-semibold tracking-wide font-clash">{t('graph.loading')}</p>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="p-8 max-w-7xl mx-auto h-[calc(100vh-4rem)] flex flex-col justify-center items-center text-center bg-[#07080a]">
        <Network className="w-16 h-16 text-zinc-600 mb-4 opacity-30 animate-pulse" />
        <h2 className="text-xl font-bold text-on-surface mb-2 font-clash">{t('graph.noRoadmaps')}</h2>
        <p className="text-xs text-zinc-400 max-w-md mb-6">{t('graph.noRoadmapsDesc')}</p>
        <button 
          onClick={() => navigate('/dashboard')}
          className="bg-on-surface hover:bg-zinc-200 text-black px-6 py-3 rounded-[12px] font-bold text-xs uppercase tracking-wider transition-all"
        >
          {t('lessons.goDashboard')}
        </button>
      </div>
    );
  }

  // Calculate layout bounds to size SVG
  const bounds = Object.values(nodePositions).reduce(
    (acc, pos) => ({
      minX: Math.min(acc.minX, pos.x),
      maxX: Math.max(acc.maxX, pos.x),
      minY: Math.min(acc.minY, pos.y),
      maxY: Math.max(acc.maxY, pos.y),
    }),
    { minX: 100, maxX: 1000, minY: 100, maxY: 700 }
  );

  const svgWidth = Math.max(bounds.maxX + 600, window.innerWidth * 2.2);
  const svgHeight = Math.max(bounds.maxY + 600, window.innerHeight * 2.2);

  const visibleNodes = selectedCourse.nodes.filter(n => !hiddenNodeIds.has(n.id));
  const visibleEdges = selectedCourse.edges.filter(e => !hiddenNodeIds.has(e.from) && !hiddenNodeIds.has(e.to));

  const totalNodesCount = selectedCourse?.nodes?.length || 0;
  const completedNodesCount = selectedCourse?.nodes?.filter(n => n.status === 'completed').length || 0;
  const courseProgressPct = totalNodesCount > 0 ? Math.round((completedNodesCount / totalNodesCount) * 100) : 0;
  const totalEstimatedHours = selectedCourse?.nodes?.reduce((acc, n) => acc + (Number(n.hours || n.estimatedTime) || 2), 0) || 0;
  const completedHours = selectedCourse?.nodes?.filter(n => n.status === 'completed').reduce((acc, n) => acc + (Number(n.hours || n.estimatedTime) || 2), 0) || 0;

  return (
    <motion.div initial="hidden" animate="show" className="w-full h-full flex flex-col text-zinc-100 font-sans select-none overflow-hidden pb-2 min-h-0 relative">
      
      {/* Custom Styles Injector */}
      <style>{`
        .skill-tree-grid {
          background-image: radial-gradient(var(--grid-dot) 1.2px, transparent 1.2px);
          background-size: 20px 20px;
        }
        
        :root {
          --grid-dot: rgba(255, 255, 255, 0.05);
        }
        .light, :host-context(.light), html.light {
          --grid-dot: rgba(0, 0, 0, 0.06) !important;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(100, 116, 139, 0.2);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 116, 139, 0.4);
        }
      `}</style>

      {/* Top Header Card */}
      <div 
        className={`mb-5 flex-shrink-0 flex flex-col gap-4 p-5 md:p-6 border rounded-[24px] font-sans transition-all ${
          isLightTheme 
            ? 'bg-on-surface border-zinc-200 text-zinc-900 shadow-md' 
            : 'bg-[#141417]/80 backdrop-blur-xl border-zinc-800/80 text-zinc-100 shadow-[0_8px_30px_rgb(0,0,0,0.2)]'
        }`}
      >
        {/* Row 1: Title, Course Info & Main Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start md:items-center gap-4">
            <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center shrink-0 shadow-inner ${
              isLightTheme ? 'bg-gradient-to-br from-violet-500/10 to-indigo-500/20 text-violet-600 border border-violet-200' : 'bg-gradient-to-br from-violet-500/20 to-indigo-500/10 text-violet-400 border border-violet-500/20'
            }`}>
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-extrabold font-clash tracking-wide m-0">{t('graph.title') || 'Knowledge graph'}</h2>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/30 uppercase tracking-wider">
                  Интерактивная карта
                </span>
              </div>
              <p className={`text-xs mt-1 font-medium flex items-center gap-2 flex-wrap ${
                isLightTheme ? 'text-zinc-600' : 'text-zinc-400'
              }`}>
                <span className="font-bold text-on-surface">{selectedCourse ? t(selectedCourse.title) : ''}</span>
                <span>•</span>
                <span>{totalNodesCount} тем</span>
                <span>•</span>
                <span>~{totalEstimatedHours} ч. обучения</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 self-end md:self-auto">
            <button
              onClick={() => {
                setHistoryModalFilterNodeId(null);
                setHistoryModalOpen(true);
              }}
              className={`flex items-center justify-center gap-2 border px-4 py-2.5 rounded-[14px] text-xs font-bold transition-all shadow-sm ${
                isLightTheme 
                  ? 'bg-zinc-100 hover:bg-zinc-200/80 border-zinc-200 text-zinc-800' 
                  : 'bg-zinc-900/90 hover:bg-zinc-800 border-zinc-800 text-zinc-200'
              }`}
            >
              <Clock className="w-4 h-4 text-violet-400" />
              <span>История тестов</span>
            </button>

            <select 
              value={selectedCourse?.id || ''} 
              onChange={handleCourseChange}
              className={`border rounded-[14px] px-4 py-2.5 text-xs font-bold font-sans focus:outline-none focus:border-violet-500 shadow-sm cursor-pointer transition-all ${
                isLightTheme 
                  ? 'bg-zinc-100 hover:bg-zinc-200/80 border-zinc-200 text-zinc-800' 
                  : 'bg-zinc-900/90 hover:bg-zinc-800 border-zinc-800 text-zinc-200'
              }`}
            >
              {courses.map(c => (
                <option key={c.id} value={c.id} className={isLightTheme ? 'bg-on-surface text-zinc-900' : 'bg-zinc-950 text-zinc-100'}>{t(c.title)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Divider */}
        <div className={`h-px w-full ${isLightTheme ? 'bg-zinc-200' : 'bg-zinc-800/80'}`} />

        {/* Row 2: Gamification Stats Grid & Legend ("что то ещё было" + "пространство") */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 items-stretch">
          
          {/* Stat 1: Course Progress */}
          <div className={`flex flex-col justify-between p-3.5 rounded-[16px] border ${
            isLightTheme ? 'bg-zinc-50/80 border-zinc-200' : 'bg-zinc-900/40 border-zinc-800/60'
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}`}>Прогресс курса</span>
              <span className="text-xs font-black font-mono text-violet-400">{courseProgressPct}%</span>
            </div>
            <div className="space-y-1">
              <div className={`w-full h-2 rounded-full overflow-hidden ${isLightTheme ? 'bg-zinc-200' : 'bg-zinc-800'}`}>
                <div 
                  className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${courseProgressPct}%` }}
                />
              </div>
              <p className={`text-[10px] font-medium text-right ${isLightTheme ? 'text-zinc-600' : 'text-zinc-400'}`}>
                {completedNodesCount} из {totalNodesCount} тем пройдено
              </p>
            </div>
          </div>

          {/* Stat 2: Estimated Hours */}
          <div className={`flex flex-col justify-between p-3.5 rounded-[16px] border ${
            isLightTheme ? 'bg-zinc-50/80 border-zinc-200' : 'bg-zinc-900/40 border-zinc-800/60'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}`}>Общее время</span>
              <span className="text-xs font-black font-mono text-indigo-400">~{totalEstimatedHours} ч.</span>
            </div>
            <p className={`text-[11px] font-medium ${isLightTheme ? 'text-zinc-700' : 'text-zinc-300'}`}>
              Изучено: <strong className="text-on-surface font-mono">~{completedHours} ч.</strong>
            </p>
          </div>

          {/* Stat 3: XP & Level */}
          {userLevelData ? (
            <div className={`flex flex-col justify-between p-3.5 rounded-[16px] border ${
              isLightTheme ? 'bg-zinc-50/80 border-zinc-200' : 'bg-zinc-900/40 border-zinc-800/60'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}`}>Уровень {userLevelData.current.level}</span>
                <span className="text-[11px] font-bold text-amber-400">{userLevelData.current.title}</span>
              </div>
              <div className="space-y-1">
                <div className={`w-full h-2 rounded-full overflow-hidden ${isLightTheme ? 'bg-zinc-200' : 'bg-zinc-800'}`}>
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${userLevelData.progress}%` }}
                  />
                </div>
                <p className={`text-[10px] font-mono text-right ${isLightTheme ? 'text-zinc-600' : 'text-zinc-400'}`}>
                  {userLevelData.progress.toFixed(0)}% до следующего
                </p>
              </div>
            </div>
          ) : (
            <div className={`flex flex-col justify-between p-3.5 rounded-[16px] border ${
              isLightTheme ? 'bg-zinc-50/80 border-zinc-200' : 'bg-zinc-900/40 border-zinc-800/60'
            }`}>
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}`}>Статус ученика</span>
              <p className="text-xs font-bold text-amber-400">Активный участник</p>
            </div>
          )}

          {/* Stat 4: Streak */}
          <div className={`flex items-center gap-3 p-3.5 rounded-[16px] border ${
            isLightTheme ? 'bg-zinc-50/80 border-zinc-200' : 'bg-zinc-900/40 border-zinc-800/60'
          }`}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/10 border border-orange-500/30 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5 text-orange-500 animate-bounce" />
            </div>
            <div>
              <span className={`text-[10px] font-semibold uppercase tracking-wider block ${isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}`}>Активность</span>
              <span className="text-sm font-black text-orange-500 font-mono">{userProfile?.streakDays || 1} дн. подряд</span>
            </div>
          </div>

          {/* Stat 5: Legend */}
          <div className={`flex flex-col justify-center p-3.5 rounded-[16px] border sm:col-span-2 lg:col-span-4 xl:col-span-1 ${
            isLightTheme ? 'bg-zinc-50/80 border-zinc-200' : 'bg-zinc-900/40 border-zinc-800/60'
          }`}>
            <span className={`text-[10px] font-semibold uppercase tracking-wider mb-2 ${isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}`}>Легенда карты</span>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              {[
                { bgClass: 'bg-[#ffe100] border-black', label: 'Темы' },
                { bgClass: 'bg-[#1a1a1a] border-zinc-700', label: 'Практика' },
                { bgClass: isLightTheme ? 'bg-[#f4f4f5] border-zinc-300' : 'bg-[#27272a] border-zinc-800', label: 'Заблокировано' }
              ].map(({ bgClass, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className={`w-3.5 h-3.5 rounded-md border ${bgClass}`} />
                  <span className={`text-[11px] font-medium ${isLightTheme ? 'text-zinc-700' : 'text-zinc-300'}`}>{label}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 relative">
        
        <div 
          className={`flex-1 min-h-0 skill-tree-grid ${
            isLightTheme 
              ? 'bg-on-surface border-zinc-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]' 
              : 'bg-[#0f172a] border-outline'
          } border rounded-[20px] overflow-y-auto overflow-x-auto relative flex flex-col p-8 items-center custom-scrollbar`}
          ref={containerRef}
        >
          {/* Static Roadmap Layout (Centered) */}
          <div
            className="relative select-none shrink-0"
            style={{ width: '900px', height: `${graphHeight}px` }}
          >
            {/* SVG connections layer */}
            <svg className="absolute inset-0 pointer-events-none w-full h-full" style={{ width: '900px', height: `${graphHeight}px` }}>
              {/* Render paths */}
              {visibleEdges.map(edge => {
                const isFromCompleted = selectedCourse.nodes.find(n => n.id === edge.from)?.status === 'completed' || quizResults?.[edge.from]?.passed === true;
                const isToCompleted = selectedCourse.nodes.find(n => n.id === edge.to)?.status === 'completed' || quizResults?.[edge.to]?.passed === true;
                const isEdgeCompleted = isFromCompleted && isToCompleted;
                const isEdgeActive = isFromCompleted && !isToCompleted;
                
                const fromPos = nodePositions[edge.from];
                const toPos = nodePositions[edge.to];
                if (!fromPos || !toPos) return null;

                const x1 = fromPos.x;
                const y1 = fromPos.y;
                const x2 = toPos.x;
                const y2 = toPos.y;
                
                const dy = y2 - y1;
                const cx1 = x1;
                const cy1 = y1 + dy * 0.45;
                const cx2 = x2;
                const cy2 = y2 - dy * 0.45;
                
                const d = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
                
                let strokeColor = isLightTheme ? '#d1d5db' : '#3f3f46'; // grey for locked/inactive

                if (isEdgeCompleted || isEdgeActive) {
                  strokeColor = '#2563eb'; // blue for active/completed connections
                }
                
                return (
                  <g key={`${edge.from}-${edge.to}`}>
                    <path 
                      d={d} 
                      fill="none" 
                      stroke={strokeColor} 
                      strokeWidth="2" 
                    />
                  </g>
                );
              })}
            </svg>

            {/* Render node elements absolutely positioned */}
            {visibleNodes.map(node => {
              const pos = nodePositions[node.id];
              if (!pos) return null;

              const result = quizResults?.[node.id];
              const isCompleted = node.status === 'completed' || result?.passed === true;
              const isLocked = node.status === 'locked' && !isCompleted;
              const isCurrent = !isCompleted && !isLocked;

              const isMilestone = node.level === 'Advanced' || isLeafNode(node.id, selectedCourse.edges) || (node.label || '').toLowerCase().includes('exam') || (node.label || '').toLowerCase().includes('экзамен');
              const hasChildren = selectedCourse.edges.some(e => String(e.from) === String(node.id));
              const isFolded = foldedNodes.has(node.id);
              
              // Dynamic card widths/heights in style:
              const cardWidth = 200;
              const cardHeight = 55;

              const isSelected = selectedNode?.id === node.id;
              const isCheckpoint = (node.label || node.title || '').toLowerCase().includes('checkpoint') || 
                                   (node.label || node.title || '').toLowerCase().includes('project') || 
                                   (node.label || node.title || '').toLowerCase().includes('проект');

              let cardBg = '';
              let cardText = '';
              let cardBorder = '';
              let cardShadow = '';

              if (isLocked) {
                cardBg = isLightTheme ? 'bg-[#f4f4f5]' : 'bg-[#27272a]';
                cardText = isLightTheme ? 'text-zinc-400 font-semibold' : 'text-zinc-500 font-semibold';
                cardBorder = isSelected 
                  ? 'border-violet-600 border-2 ring-2 ring-violet-500/30' 
                  : (isLightTheme ? 'border-zinc-300 border' : 'border-zinc-800 border');
              } else if (isCheckpoint) {
                cardBg = 'bg-[#1a1a1a]';
                cardText = 'text-on-surface font-bold';
                cardBorder = isSelected 
                  ? 'border-violet-500 border-2 ring-2 ring-violet-500/40' 
                  : isCurrent 
                  ? 'border-blue-600 border-2 ring-2 ring-blue-500/40' 
                  : 'border-black border-2';
              } else {
                // Yellow topic cards
                cardBg = 'bg-[#ffe100]';
                cardText = 'text-black font-bold';
                cardBorder = isSelected 
                  ? 'border-violet-600 border-2 ring-2 ring-violet-500/50' 
                  : isCurrent 
                  ? 'border-blue-600 border-2 ring-2 ring-blue-500/50' 
                  : 'border-black border-2';
              }

              const isDragging = activeDragNodeId === node.id;

              return (
                <div
                  key={node.id}
                  onPointerDown={(e) => handlePointerDown(e, node.id)}
                  onPointerMove={(e) => handlePointerMove(e, node.id)}
                  onPointerUp={(e) => handlePointerUp(e, node.id)}
                  className={`absolute pointer-events-auto z-10 select-none touch-none ${
                    isDragging ? 'cursor-grabbing' : 'cursor-grab'
                  } ${isDragging ? '' : 'transition-all duration-500 ease-out'}`}
                  style={{
                    left: pos.x,
                    top: pos.y,
                    width: cardWidth,
                    minHeight: cardHeight,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <div 
                    className={`relative w-full min-h-[55px] h-full rounded-[8px] p-2 flex flex-col items-center justify-center overflow-visible transition-all duration-300 ${
                      !isDragging ? 'transform hover:scale-[1.03]' : ''
                    } ${cardBg} ${cardBorder} ${cardText} ${cardShadow}`}
                  >
                    {/* Inner content: centered text with status icons */}
                    <div className="flex items-center justify-center gap-1.5 px-1.5 w-full text-center">
                      {isCompleted && <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[3]" />}
                      {isLocked && <Lock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />}
                      <span className="text-[12px] leading-tight select-none pointer-events-none break-words whitespace-pre-wrap">
                        {t(node.label || node.title)}
                      </span>
                    </div>

                    {/* Milestone badge indicator */}
                    {isMilestone && !isLocked && (
                      <div className="absolute top-0 right-4 translate-y-[-50%] bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black text-[7px] tracking-widest uppercase px-1.5 py-0.5 rounded border border-black shadow-sm">
                        ★
                      </div>
                    )}

                    {/* Branch folding button */}
                    {hasChildren && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNodeDoubleClick(node.id);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        title={isFolded ? "Развернуть ветку" : "Свернуть ветку"}
                        className={`fold-btn absolute bottom-[-9px] left-1/2 -translate-x-1/2 z-20 w-4.5 h-4.5 rounded-full flex items-center justify-center border border-black text-[10px] font-extrabold shadow-sm transition-all ${
                          isFolded 
                            ? 'bg-[#ffe100] text-black animate-pulse' 
                            : 'bg-on-surface text-black hover:bg-zinc-200'
                        }`}
                      >
                        {isFolded ? '+' : '-'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Detail Sidebar Panel */}
        <motion.div className="w-full lg:w-80 flex-shrink-0 flex flex-col h-full max-h-full overflow-hidden">
          <AnimatePresence mode="wait">
            {selectedNode ? (
              <motion.div 
                key="course"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.15 }}
                className="w-full border border-white/10 bg-slate-900/50 backdrop-blur-xl flex flex-col overflow-hidden flex-shrink-0 rounded-[20px] h-full font-sans shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]"
              >
                {/* Header */}
                <div className="p-4 border-b border-white/10 bg-on-surface/5">
                  {/* Level Badge */}
                  <span className="inline-flex items-center text-[9px] font-mono font-bold px-2 py-0.5 rounded-[6px] bg-violet-500/20 text-violet-300 border border-violet-500/30 mb-2 uppercase tracking-wider">
                    {selectedNode.level || 'Intermediate'}
                  </span>
                  
                  {/* Title */}
                  <h3 className="text-sm font-extrabold text-on-surface leading-snug font-clash">
                    {t(selectedNode.label || selectedNode.title)}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed line-clamp-4">
                    {t(selectedNode.desc || selectedNode.description) || 'Нажми «Начать урок» чтобы сгенерировать материал'}
                  </p>
                </div>

                {/* Body */}
                <div className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
                  {/* Meta stats */}
                  <div className="flex gap-2">
                    <div className="flex-1 bg-zinc-950/40 border border-white/5 rounded-[12px] p-2.5">
                      <p className="text-[10px] text-zinc-400 mb-0.5 font-sans">⏱ Время</p>
                      <p className="text-xs font-bold text-zinc-100 font-mono">~{selectedNode.hours || selectedNode.estimatedTime || '2'} ч</p>
                    </div>
                    <div className="flex-1 bg-zinc-950/40 border border-white/5 rounded-[12px] p-2.5">
                      <p className="text-[10px] text-zinc-400 mb-0.5 font-sans">📄 Уроков</p>
                      <p className="text-xs font-bold text-zinc-100 font-mono">{selectedNode.lessons || selectedNode.lessonsCount || '1'}</p>
                    </div>
                  </div>

                  {/* Mastery Score */}
                  {(() => {
                    const qResult = quizResults?.[selectedNode.id];
                    const mScore = qResult ? calculateMastery(qResult.score, qResult.lastAttemptAt?.toDate?.() || qResult.lastAttemptAt) : null;
                    return (
                      <MasteryBlock 
                        masteryScore={mScore} 
                        attempts={qResult?.attempts} 
                        onViewHistory={() => {
                          setHistoryModalFilterNodeId(selectedNode.id);
                          setHistoryModalOpen(true);
                        }} 
                      />
                    );
                  })()}

                  {/* Prerequisites */}
                  {selectedCourse && selectedCourse.edges.filter(e => String(e.to) === String(selectedNode.id)).length > 0 && (
                    <div>
                      <p className="text-[10px] text-zinc-400 mb-1.5 font-sans font-semibold">Требует завершить</p>
                      {selectedCourse.edges.filter(e => String(e.to) === String(selectedNode.id)).map(e => {
                        const preId = e.from;
                        const preNode = selectedCourse.nodes.find(n => String(n.id) === String(preId));
                        const isDone = quizResults?.[preId]?.passed;
                        return (
                          <div key={preId} className={`flex items-center gap-2 p-2 rounded-[10px] border text-xs mb-1 font-sans ${
                            isDone
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                              : 'bg-zinc-950/20 border-white/5 text-zinc-400'
                          }`}>
                            <span className="font-bold">{isDone ? '✓' : '🔒'}</span>
                            <span className="truncate">{t(preNode?.label || preNode?.title || preId)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Opens items */}
                  {selectedCourse && selectedCourse.edges.filter(e => String(e.from) === String(selectedNode.id)).length > 0 && (
                    <div>
                      <p className="text-[10px] text-zinc-400 mb-1.5 font-sans font-semibold">Открывает доступ к</p>
                      {selectedCourse.edges.filter(e => String(e.from) === String(selectedNode.id)).map(e => {
                        const nextId = e.to;
                        const nextNode = selectedCourse.nodes.find(n => String(n.id) === String(nextId));
                        return (
                          <div key={nextId} className="flex items-center gap-2 p-2 rounded-[10px] border border-white/5 bg-zinc-950/40 text-xs text-zinc-400 mb-1 font-sans">
                            <span className="text-violet-400 font-bold">→</span>
                            <span className="truncate">{t(nextNode?.label || nextNode?.title || nextId)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Start Button & AI CTA */}
                <div className="p-3 border-t border-white/10 bg-on-surface/5 flex flex-col gap-2.5">
                  <button
                    onClick={() => setIsStudying(true)}
                    disabled={selectedNode.status === 'locked'}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-[12px] text-xs font-bold transition-all transform active:scale-95 duration-150 font-sans ${
                      selectedNode.status === 'locked'
                        ? 'bg-zinc-800/40 border border-white/5 text-zinc-500 cursor-not-allowed'
                        : selectedNode.status === 'completed'
                        ? 'bg-transparent border border-white/20 text-on-surface hover:bg-on-surface/5 hover:border-white'
                        : 'bg-on-surface text-black hover:bg-zinc-200'
                    }`}
                  >
                    {selectedNode.status === 'locked' && <Lock className="w-3.5 h-3.5" />}
                    {selectedNode.status === 'locked' && 'Заблокировано'}
                    {selectedNode.status !== 'locked' && selectedNode.status === 'completed' && 'Повторить урок'}
                    {selectedNode.status !== 'locked' && selectedNode.status !== 'completed' && 'Начать урок'}
                  </button>

                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="placeholder"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-[20px] p-6 h-full flex flex-col items-center justify-center text-center text-zinc-400 font-sans shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] animate-fade-in-up"
              >
                <div className="w-16 h-16 bg-zinc-950/40 border border-white/5 rounded-[16px] flex items-center justify-center mb-6">
                  <Pointer className="w-6 h-6 text-on-surface opacity-40" strokeWidth={1.5} />
                </div>
                <p className="text-sm font-semibold">{t('graph.details.placeholder') || 'Выберите тему на карте, чтобы увидеть детали'}</p>
                


                {/* AI Mock Interview (ULTRA feature) */}
                {plan === 'ULTRA' && (
                  <div className="mt-4 w-full relative overflow-hidden p-4 rounded-[16px] bg-gradient-to-br from-purple-950/40 to-pink-950/40 border border-purple-500/20 flex flex-col gap-2.5 text-left shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-[10px] font-bold text-purple-300">
                        🎓 AI Mock Interview
                      </span>
                      <span className="text-[8px] bg-purple-500 text-on-surface px-1.5 py-0.5 rounded font-black tracking-wide leading-none">ULTRA</span>
                    </div>
                    <p className="text-[10px] text-zinc-300 leading-normal">
                      Готовы к собеседованию? Пройдите симуляцию технического или HR интервью по теме "{selectedCourse?.title}".
                    </p>
                    <button
                      onClick={() => {
                        setMockInterviewOpen(true);
                      }}
                      className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-on-surface text-[10px] font-bold rounded-[8px] transition-all flex items-center justify-center gap-1 shadow-[0_4px_12px_rgba(139,92,246,0.2)]"
                    >
                      Запустить собеседование
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>


 
        <AnimatePresence>
          {historyModalOpen && (
            <QuizHistoryModal
              isOpen={historyModalOpen}
              onClose={() => setHistoryModalOpen(false)}
              quizResults={quizResults}
              selectedCourse={selectedCourse}
              initialNodeId={historyModalFilterNodeId}
              onSelectNode={handleSelectNodeFromHistory}
            />
          )}
        </AnimatePresence>

        {/* Mock Interview Modal */}
        <AnimatePresence>
          {mockInterviewOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !interviewGenerating && setMockInterviewOpen(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />
              
              <motion.div 
                initial={{ scale: 0.95, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.95, y: 20, opacity: 0 }}
                className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 shadow-2xl relative z-10 overflow-hidden text-on-surface flex flex-col max-h-[85vh]"
              >
                <div className="flex justify-between items-start mb-6 shrink-0">
                  <div>
                    <h3 className="text-xl font-bold flex items-center gap-2 text-purple-400">
                      <span>🎓</span> AI Mock Interview: {selectedCourse?.title}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">Симулятор технического и HR собеседования с ИИ Тимлидом</p>
                  </div>
                  <button 
                    disabled={interviewGenerating}
                    onClick={() => setMockInterviewOpen(false)}
                    className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {interviewStage === 'welcome' && (
                  <div className="space-y-6 text-center py-8 flex-1 flex flex-col justify-center items-center">
                    <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mb-4 border border-purple-500/20">
                      <Sparkles className="w-10 h-10 text-purple-400 animate-pulse" />
                    </div>
                    <div className="max-w-md">
                      <h4 className="text-lg font-bold text-zinc-200 mb-2 font-sans">Добро пожаловать на тренировочное интервью!</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed mb-6 font-sans">
                        ИИ задаст вам 3 сложных вопроса по пройденному материалу курса. В конце вы получите развернутую оценку технических знаний (Hard Skills) и стиля общения (Soft Skills) с процентом готовности к реальной работе.
                      </p>
                      <button
                        onClick={handleStartInterview}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-on-surface font-bold rounded-xl shadow-lg transition-all text-xs font-sans"
                      >
                        Начать собеседование
                      </button>
                    </div>
                  </div>
                )}

                {interviewStage === 'chat' && (
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4 custom-scrollbar text-left">
                      {interviewMessages.map((msg, i) => (
                        <div 
                          key={msg.id}
                          className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border text-[10px] font-bold ${
                            msg.role === 'user' ? 'bg-zinc-700 border-zinc-600 text-on-surface' : 'bg-purple-950/40 border-purple-500/30 text-purple-300'
                          }`}>
                            {msg.role === 'user' ? 'Я' : 'HR'}
                          </div>
                          <div className={`p-4 rounded-2xl text-xs leading-relaxed font-sans ${
                            msg.role === 'user' ? 'bg-zinc-800 text-zinc-100' : 'bg-zinc-900 border border-zinc-800/80 text-zinc-200'
                          }`}>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                      {interviewGenerating && (
                        <div className="flex gap-3 max-w-[85%] mr-auto items-center text-zinc-500 text-xs italic font-sans">
                          <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                          Собеседник печатает вопрос...
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 border-t border-zinc-800 pt-4 shrink-0">
                      <input 
                        type="text"
                        value={interviewInput}
                        onChange={(e) => setInterviewInput(e.target.value)}
                        placeholder="Введите ваш ответ..."
                        onKeyDown={(e) => e.key === 'Enter' && handleSendInterviewAnswer()}
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-on-surface placeholder:text-zinc-600 focus:outline-none focus:border-purple-500 transition-colors font-sans"
                      />
                      <button
                        onClick={handleSendInterviewAnswer}
                        disabled={!interviewInput.trim() || interviewGenerating}
                        className="px-5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-on-surface text-xs font-bold rounded-xl transition-all font-sans"
                      >
                        Ответить
                      </button>
                    </div>
                  </div>
                )}

                {interviewStage === 'results' && (
                  <div className="flex-1 overflow-y-auto space-y-6 text-left pr-2 custom-scrollbar">
                    <div className="flex items-center gap-3 p-4 bg-purple-950/20 border border-purple-500/20 rounded-2xl">
                      <Trophy className="w-8 h-8 text-yellow-400 shrink-0" />
                      <div>
                        <h4 className="text-sm font-bold text-on-surface font-sans">Интервью успешно пройдено!</h4>
                        <p className="text-[10px] text-zinc-400 mt-0.5 font-sans">Оценка составлена ИИ Тимлидом на основе ваших ответов.</p>
                      </div>
                    </div>

                    <div className="prose prose-invert prose-sm leading-relaxed max-w-none text-left font-sans">
                      <ReactMarkdown>{interviewFeedback}</ReactMarkdown>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-zinc-800">
                      <button
                        onClick={() => {
                          setMockInterviewOpen(false);
                          setInterviewStage('welcome');
                          setInterviewFeedback('');
                          setInterviewMessages([]);
                        }}
                        className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-on-surface text-xs font-bold rounded-xl transition-colors font-sans"
                      >
                        Закрыть симулятор
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>

      {/* Expanded Lesson Panel (Moved to root so it covers Top Header Card cleanly when studying) */}
      <AnimatePresence>
        {isStudying && selectedNode && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-0 z-50 bg-background flex flex-col transition-all duration-500 ease-in-out"
          >
            <LessonPanel 
              selectedCourse={selectedCourse}
              selectedNode={selectedNode}
              onClose={() => setIsStudying(false)}
              isZenMode={isZenMode}
              toggleZenMode={() => setIsZenMode(!isZenMode)}
              onQuizComplete={() => setQuizRefreshTrigger(prev => prev + 1)}
              onNodeUpdated={(updatedNode, updatedCourse) => {
                if (updatedCourse) {
                  setCourses(courses.map(c => c.id === updatedCourse.id ? updatedCourse : c));
                  setSelectedCourse(updatedCourse);
                } else {
                  const updatedNodes = selectedCourse.nodes.map(n => n.id === updatedNode.id ? updatedNode : n);
                  const newCourse = { ...selectedCourse, nodes: updatedNodes };
                  setSelectedCourse(newCourse);
                  setCourses(courses.map(c => c.id === newCourse.id ? newCourse : c));
                }
                setSelectedNode(updatedNode);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
