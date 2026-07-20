import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Network, Loader2, BookOpen, Clock, Brain, Pointer, ZoomIn, ZoomOut, RotateCcw, Lock,
  Code, Terminal, Layers, Database, Cpu, Settings, Shield, Sliders, Globe, Star, Sparkles, Check, Flame, Trophy, Award
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { getUserCourses } from '../services/courseService.js';
import { t } from '../i18n.js';
import LessonPanel from '../components/lessons/LessonPanel.jsx';
import MasteryBlock from '../components/shared/MasteryBlock.jsx';
import { calculateMastery } from '../hooks/useMastery.js';
import QuizHistoryModal from '../components/quiz/QuizHistoryModal.jsx';
import { usePlanLimits } from '../hooks/usePlanLimits.js';
import { useXP } from '../hooks/useXP.js';

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
  const spacingX = 330; // Increased spacing for larger cards
  const spacingY = 190;
  const startX = 160;
  const centerY = 350;

  Object.entries(levelGroups).forEach(([lStr, nodeIds]) => {
    const l = parseInt(lStr);
    const count = nodeIds.length;
    
    nodeIds.forEach((id, idx) => {
      const x = startX + l * spacingX + (idx % 2 === 0 ? 0 : 25);
      
      let y = centerY;
      if (count > 1) {
        const totalHeight = (count - 1) * spacingY;
        y = centerY - totalHeight / 2 + idx * spacingY;
      }
      
      const hashVal = getNumericHash(id);
      const jitterX = (Math.sin(hashVal * 0.5) * 12);
      const jitterY = (Math.cos(hashVal * 0.5) * 18);
      
      positions[id] = {
        x: x + jitterX,
        y: y + jitterY
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
  const { userLevelData } = useXP();
  
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [quizResults, setQuizResults] = useState({});
  const [isStudying, setIsStudying] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [quizRefreshTrigger, setQuizRefreshTrigger] = useState(0);
  const [isLightTheme, setIsLightTheme] = useState(document.documentElement.classList.contains('light'));
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyModalFilterNodeId, setHistoryModalFilterNodeId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  // Layout view coordinates
  const [pan, setPan] = useState({ x: 100, y: 150 });
  const [zoom, setZoom] = useState(0.85);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Card dragging offset state
  const [draggedNodeOffsets, setDraggedNodeOffsets] = useState({});
  const [draggingNode, setDraggingNode] = useState(null);

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

  // Node position mapping memo
  const nodePositions = useMemo(() => {
    if (!selectedCourse) return {};
    return calculateNodePositions(selectedCourse.nodes, selectedCourse.edges);
  }, [selectedCourse]);

  // Node branch folding memo
  const hiddenNodeIds = useMemo(() => {
    if (!selectedCourse) return new Set();
    return getHiddenNodeIds(foldedNodes, selectedCourse.nodes, selectedCourse.edges);
  }, [foldedNodes, selectedCourse]);

  // Reset folded state & positions on course change
  useEffect(() => {
    setFoldedNodes(new Set());
    setDraggedNodeOffsets({});
  }, [selectedCourse]);

  // Center on mount/course change
  useEffect(() => {
    if (Object.keys(nodePositions).length === 0) return;
    
    const centerGraph = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth || window.innerWidth - 320;
      const containerHeight = containerRef.current.clientHeight || window.innerHeight - 200;
      
      const firstActive = selectedCourse.nodes.find(n => n.status === 'active') || selectedCourse.nodes[0];
      const startPos = nodePositions[firstActive?.id] || Object.values(nodePositions)[0];
      
      if (startPos) {
        setPan({
          x: containerWidth / 2 - startPos.x * zoom,
          y: containerHeight / 2 - startPos.y * zoom
        });
      }
    };

    centerGraph();
    const t = setTimeout(centerGraph, 100);
    return () => clearTimeout(t);
  }, [nodePositions]);

  // Panning + Node Dragging logic on Mouse Move
  const handleMouseMove = (e) => {
    if (draggingNode) {
      // Calculate delta divided by zoom factor so drag tracks the pointer accurately
      const dx = (e.clientX - draggingNode.startX) / zoom;
      const dy = (e.clientY - draggingNode.startY) / zoom;
      setDraggedNodeOffsets(prev => ({
        ...prev,
        [draggingNode.id]: {
          x: draggingNode.initialOffsetX + dx,
          y: draggingNode.initialOffsetY + dy
        }
      }));
    } else if (isDragging) {
      setPan({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
      });
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    if (draggingNode) {
      const dx = (touch.clientX - draggingNode.startX) / zoom;
      const dy = (touch.clientY - draggingNode.startY) / zoom;
      setDraggedNodeOffsets(prev => ({
        ...prev,
        [draggingNode.id]: {
          x: draggingNode.initialOffsetX + dx,
          y: draggingNode.initialOffsetY + dy
        }
      }));
    } else if (isDragging) {
      setPan({
        x: touch.clientX - dragStart.current.x,
        y: touch.clientY - dragStart.current.y
      });
    }
  };

  // Drag start for background panning
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    const touch = e.touches[0];
    dragStart.current = { x: touch.clientX - pan.x, y: touch.clientY - pan.y };
  };

  // Drag start for individual node cards
  const handleNodeDragStart = (e, nodeId) => {
    e.stopPropagation();
    // Only drag with left click / single touch
    const clientX = e.clientX !== undefined ? e.clientX : e.touches?.[0]?.clientX;
    const clientY = e.clientY !== undefined ? e.clientY : e.touches?.[0]?.clientY;
    if (clientX === undefined) return;

    const currentOffset = draggedNodeOffsets[nodeId] || { x: 0, y: 0 };
    setDraggingNode({
      id: nodeId,
      startX: clientX,
      startY: clientY,
      initialOffsetX: currentOffset.x,
      initialOffsetY: currentOffset.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggingNode(null);
  };

  const handleWheel = (e) => {
    if (plan === 'FREE') return;
    e.preventDefault();
    const zoomFactor = 1.08;
    const nextZoom = e.deltaY < 0 ? zoom * zoomFactor : zoom / zoomFactor;
    setZoom(Math.max(0.4, Math.min(nextZoom, 1.8)));
  };

  const handleZoomIn = () => setZoom(z => Math.min(z * 1.15, 1.8));
  const handleZoomOut = () => setZoom(z => Math.max(z / 1.15, 0.4));
  const handleReset = () => {
    setZoom(0.85);
    setDraggedNodeOffsets({});
    if (selectedCourse && containerRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      const firstActive = selectedCourse.nodes.find(n => n.status === 'active') || selectedCourse.nodes[0];
      const pos = nodePositions[firstActive?.id];
      if (pos) {
        setPan({
          x: containerWidth / 2 - pos.x * 0.85,
          y: containerHeight / 2 - pos.y * 0.85
        });
      }
    }
  };

  const handleCourseChange = (e) => {
    const courseId = e.target.value;
    const course = courses.find(c => c.id === courseId);
    setSelectedCourse(course || null);
    setSelectedNode(null);
    localStorage.setItem('selected_course_id', courseId);
  };

  const handleSelectNode = (node) => {
    setSelectedNode(node);
    
    // Smooth camera center
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      const pos = nodePositions[node.id];
      const offset = draggedNodeOffsets[node.id] || { x: 0, y: 0 };
      if (pos) {
        setPan({
          x: containerWidth / 2 - (pos.x + offset.x) * zoom,
          y: containerHeight / 2 - (pos.y + offset.y) * zoom
        });
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
        <h2 className="text-xl font-bold text-white mb-2 font-clash">{t('graph.noRoadmaps')}</h2>
        <p className="text-xs text-zinc-400 max-w-md mb-6">{t('graph.noRoadmapsDesc')}</p>
        <button 
          onClick={() => navigate('/dashboard')}
          className="bg-white hover:bg-zinc-200 text-black px-6 py-3 rounded-[12px] font-bold text-xs uppercase tracking-wider transition-all"
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

  return (
    <motion.div initial="hidden" animate="show" className="max-w-[2000px] mx-auto h-[calc(100vh-4.5rem)] flex flex-col text-zinc-100 p-4 font-sans select-none overflow-hidden">
      
      {/* Custom Styles Injector */}
      <style>{`
        .skill-tree-grid {
          background-image: 
            radial-gradient(var(--grid-dot) 1px, transparent 1px),
            linear-gradient(to right, var(--grid-line) 1px, transparent 1px),
            linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px);
          background-size: 24px 24px, 120px 120px, 120px 120px;
        }
        
        :root {
          --grid-dot: rgba(255, 255, 255, 0.035);
          --grid-line: rgba(255, 255, 255, 0.008);
        }
        .light {
          --grid-dot: rgba(0, 0, 0, 0.04);
          --grid-line: rgba(0, 0, 0, 0.015);
        }

        @keyframes path-glow-flow {
          0% {
            stroke-dashoffset: 0;
          }
          100% {
            stroke-dashoffset: -40;
          }
        }

        .neon-glow-active {
          filter: drop-shadow(0 0 5px rgba(59, 130, 246, 0.4)) drop-shadow(0 0 10px rgba(59, 130, 246, 0.2));
        }
        
        .neon-glow-completed {
          filter: drop-shadow(0 0 5px rgba(16, 185, 129, 0.4)) drop-shadow(0 0 10px rgba(16, 185, 129, 0.2));
        }

        .flowing-particles-completed {
          stroke-dasharray: 8 20;
          animation: path-glow-flow 1.8s linear infinite;
        }

        .flowing-particles-active {
          stroke-dasharray: 6 15;
          animation: path-glow-flow 1.4s linear infinite;
        }

        @keyframes active-pulse {
          0%, 100% {
            box-shadow: 0 6px 16px rgba(59, 130, 246, 0.25);
          }
          50% {
            box-shadow: 0 6px 26px rgba(59, 130, 246, 0.55);
          }
        }
        
        .glow-node-current-dark {
          animation: active-pulse 2.5s infinite;
        }
        
        .glow-node-completed {
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.15);
        }
      `}</style>

      {/* Top Header Card */}
      <motion.div 
        className="mb-4 flex-shrink-0 flex flex-col xl:flex-row xl:items-center justify-between gap-4 px-5 py-4 border border-white/10 bg-slate-900/60 backdrop-blur-xl rounded-[20px] shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] font-sans"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-[14px] flex items-center justify-center shadow-[0_4px_20px_rgba(99,102,241,0.3)]">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white font-clash tracking-wide">{t('graph.title') || 'Knowledge graph'}</h2>
            <p className="text-[11px] text-zinc-400 mt-0.5 font-mono">
              {selectedCourse ? t(selectedCourse.title) : ''} · {selectedCourse?.nodes?.length || 0} тем
            </p>
          </div>
        </div>
        
        {/* Gamified stats bar */}
        <div className="flex flex-wrap items-center gap-4 xl:gap-6">
          {/* XP Progress Bar */}
          {userLevelData && (
            <div className="flex items-center gap-3 bg-zinc-950/40 border border-white/5 px-4 py-2 rounded-[14px]">
              <div className="text-right">
                <p className="text-[9px] text-zinc-400 font-medium">Уровень {userLevelData.current.level}</p>
                <p className="text-[11px] font-bold text-violet-400 leading-tight">{userLevelData.current.title}</p>
              </div>
              <div className="w-28 h-2 bg-zinc-800 rounded-full overflow-hidden border border-white/5 relative">
                <div 
                  className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${userLevelData.progress}%` }}
                />
              </div>
              <p className="text-[10px] font-mono text-zinc-300">{userLevelData.progress.toFixed(0)}%</p>
            </div>
          )}

          {/* Streak */}
          <div className="flex items-center gap-2 bg-zinc-950/40 border border-white/5 px-4 py-2 rounded-[14px]">
            <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <Flame className="w-4 h-4 text-orange-500 animate-bounce" />
            </div>
            <div>
              <p className="text-[9px] text-zinc-400 font-medium leading-none">Стрик дней</p>
              <p className="text-[11px] font-bold text-orange-400 mt-0.5">{userProfile?.streakDays || 1} дн.</p>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 bg-zinc-950/20 px-3 py-1.5 rounded-[12px] border border-white/5">
            {[
              { bgClass: isLightTheme ? 'bg-emerald-50 border-emerald-500/60' : 'bg-emerald-950/10 border-emerald-500/60', label: 'Изучено' },
              { bgClass: isLightTheme ? 'bg-black border-zinc-800' : 'bg-white border-zinc-200', label: 'Рекомендуется' },
              { bgClass: isLightTheme ? 'bg-zinc-150 border-zinc-300' : 'bg-zinc-900/30 border-zinc-800/40', label: 'Заблокировано' },
            ].map(({ bgClass, label }) => (
              <div key={label} className="flex items-center gap-1.5 font-sans">
                <div className={`w-6 h-4 rounded-md border ${bgClass}`} />
                <span className="text-[10px] font-semibold text-zinc-400">{label}</span>
              </div>
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setHistoryModalFilterNodeId(null);
                setHistoryModalOpen(true);
              }}
              className="flex items-center justify-center gap-1 bg-zinc-900/60 hover:bg-white/10 border border-white/10 text-white px-3.5 py-2.5 rounded-[12px] text-xs font-bold transition-all"
            >
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              История тестов
            </button>

            <select 
              value={selectedCourse?.id || ''} 
              onChange={handleCourseChange}
              className="bg-zinc-900 border border-white/10 rounded-[12px] px-3 py-2.5 text-xs font-mono text-zinc-100 focus:outline-none focus:border-violet-500"
            >
              {courses.map(c => (
                <option key={c.id} value={c.id} className="bg-zinc-950">{t(c.title)}</option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 relative">
        
        {/* Canvas Wrapper */}
        <motion.div 
          className="flex-1 bg-[#07080a] border border-white/10 rounded-[20px] overflow-hidden relative flex flex-col group cursor-grab active:cursor-grabbing"
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
          onWheel={handleWheel}
        >
          {/* Drifting particle background & Grid */}
          <BackgroundParticles />
          <div className="absolute inset-0 skill-tree-grid pointer-events-none opacity-45" />

          {/* Floating Controls Dock */}
          {plan !== 'FREE' && (
            <div className="absolute bottom-6 left-6 z-10 flex gap-2 bg-slate-900/60 backdrop-blur-xl px-3 py-2 rounded-full border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]" onMouseDown={(e) => e.stopPropagation()}>
              {[ 
                { icon: ZoomIn, onClick: handleZoomIn, label: 'Приблизить' }, 
                { icon: ZoomOut, onClick: db && handleZoomOut, label: 'Отдалить' }, 
                { icon: RotateCcw, onClick: handleReset, label: 'Сбросить' } 
              ].map((btn, i) => (
                <motion.button 
                  key={i} 
                  whileTap={{ scale: 0.95 }} 
                  onClick={btn.onClick} 
                  title={btn.label}
                  className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-zinc-100 transition-colors border border-white/5 bg-zinc-950/20"
                >
                  <btn.icon className="w-4 h-4" strokeWidth={1.5} />
                </motion.button>
              ))}
            </div>
          )}

          {/* Interactive Viewport */}
          <motion.div
            animate={{ x: pan.x, y: pan.y, scale: zoom }}
            transition={isDragging || draggingNode ? { type: "tween", duration: 0 } : { type: "spring", stiffness: 180, damping: 24 }}
            className="absolute origin-center select-none"
            style={{ width: svgWidth, height: svgHeight, pointerEvents: 'none' }}
          >
            {/* SVG connections layer */}
            <svg className="absolute inset-0 pointer-events-none w-full h-full">
              <defs>
                <filter id="glow-blue" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="glow-green" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Render paths */}
              {visibleEdges.map(edge => {
                const isFromCompleted = selectedCourse.nodes.find(n => n.id === edge.from)?.status === 'completed' || quizResults?.[edge.from]?.passed === true;
                const isToCompleted = selectedCourse.nodes.find(n => n.id === edge.to)?.status === 'completed' || quizResults?.[edge.to]?.passed === true;
                const isEdgeCompleted = isFromCompleted && isToCompleted;
                const isEdgeActive = isFromCompleted && !isToCompleted;
                
                const fromPos = nodePositions[edge.from];
                const toPos = nodePositions[edge.to];
                if (!fromPos || !toPos) return null;

                const offsetFrom = draggedNodeOffsets[edge.from] || { x: 0, y: 0 };
                const offsetTo = draggedNodeOffsets[edge.to] || { x: 0, y: 0 };
                
                const x1 = fromPos.x + offsetFrom.x;
                const y1 = fromPos.y + offsetFrom.y;
                const x2 = toPos.x + offsetTo.x;
                const y2 = toPos.y + offsetTo.y;
                
                const dx = x2 - x1;
                const cx1 = x1 + dx * 0.45;
                const cy1 = y1;
                const cx2 = x1 + dx * 0.55;
                const cy2 = y2;
                
                const d = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
                
                let strokeColor = 'rgba(63, 63, 70, 0.35)'; // Locked gray
                let filterId = null;
                let flowClass = '';

                if (isEdgeCompleted) {
                  strokeColor = 'rgba(16, 185, 129, 0.25)';
                  filterId = 'url(#glow-green)';
                  flowClass = 'flowing-particles-completed';
                } else if (isEdgeActive) {
                  strokeColor = 'rgba(59, 130, 246, 0.35)';
                  filterId = 'url(#glow-blue)';
                  flowClass = 'flowing-particles-active';
                }
                
                return (
                  <g key={`${edge.from}-${edge.to}`}>
                    {/* Glowing shadow underlay */}
                    {filterId && (
                      <path 
                        d={d} 
                        fill="none" 
                        stroke={isEdgeCompleted ? '#10B981' : '#3B82F6'} 
                        strokeWidth="4" 
                        opacity="0.25" 
                        filter={filterId} 
                      />
                    )}
                    {/* Base path */}
                    <path 
                      d={d} 
                      fill="none" 
                      stroke={strokeColor} 
                      strokeWidth={isEdgeCompleted || isEdgeActive ? '2.2' : '1.5'} 
                      strokeDasharray={isEdgeCompleted || isEdgeActive ? undefined : '5 4'}
                    />
                    {/* Animated Flow Dashing */}
                    {(isEdgeCompleted || isEdgeActive) && (
                      <path 
                        d={d} 
                        fill="none" 
                        stroke={isEdgeCompleted ? '#34D399' : '#60A5FA'} 
                        strokeWidth="2" 
                        className={flowClass} 
                        opacity="0.85"
                      />
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Render node elements absolutely positioned */}
            {visibleNodes.map(node => {
              const pos = nodePositions[node.id];
              if (!pos) return null;

              const offset = draggedNodeOffsets[node.id] || { x: 0, y: 0 };

              const result = quizResults?.[node.id];
              const isCompleted = node.status === 'completed' || result?.passed === true;
              const isLocked = node.status === 'locked' && !isCompleted;
              const isCurrent = !isCompleted && !isLocked;

              const isMilestone = node.level === 'Advanced' || isLeafNode(node.id, selectedCourse.edges) || (node.label || '').toLowerCase().includes('exam') || (node.label || '').toLowerCase().includes('экзамен');
              const hasChildren = selectedCourse.edges.some(e => String(e.from) === String(node.id));
              const isFolded = foldedNodes.has(node.id);
              
              // Larger rectangular card dimensions (230x120px)
              const cardWidth = 230;
              const cardHeight = 120;

              const TopicIcon = getTopicIcon(node);
              const masteryScore = result ? calculateMastery(result.score, result.lastAttemptAt?.toDate?.() || result.lastAttemptAt) : 0;
              const isSelected = selectedNode?.id === node.id;

              // Themes & Visual configurations for rectangular cards
              let cardBg = '';
              let cardText = '';
              let cardBorder = '';
              let cardShadow = '';

              if (isCompleted) {
                cardBg = isLightTheme ? 'bg-emerald-50/95' : 'bg-emerald-950/10';
                cardText = isLightTheme ? 'text-emerald-950' : 'text-emerald-50';
                cardBorder = isSelected ? 'border-violet-500 ring-2 ring-violet-500/20' : 'border-emerald-500/60';
                cardShadow = 'glow-node-completed shadow-[0_6px_16px_rgba(16,185,129,0.2)]';
              } else if (isCurrent) {
                // Active node: WHITE on dark theme, BLACK on light theme!
                cardBg = isLightTheme ? 'bg-black' : 'bg-white';
                cardText = isLightTheme ? 'text-white' : 'text-black';
                cardBorder = isSelected ? 'border-violet-500 ring-2 ring-violet-500/35' : (isLightTheme ? 'border-zinc-800' : 'border-zinc-200');
                cardShadow = isLightTheme 
                  ? 'shadow-[0_6px_22px_rgba(0,0,0,0.3)]' 
                  : 'glow-node-current-dark shadow-[0_0_20px_rgba(59,130,246,0.45)]';
              } else {
                // Locked
                cardBg = isLightTheme ? 'bg-zinc-150' : 'bg-zinc-900/35';
                cardText = isLightTheme ? 'text-zinc-400' : 'text-zinc-500';
                cardBorder = isSelected ? 'border-violet-500/50' : 'border-zinc-800/40';
                cardShadow = '';
              }

              return (
                <div
                  key={node.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectNode(node);
                  }}
                  onMouseDown={(e) => handleNodeDragStart(e, node.id)} // Node Drag and Drop triggers!
                  onTouchStart={(e) => handleNodeDragStart(e, node.id)}
                  className="absolute pointer-events-auto transition-all duration-300"
                  style={{
                    left: (pos.x + offset.x) - cardWidth / 2,
                    top: (pos.y + offset.y) - cardHeight / 2,
                    width: cardWidth,
                    height: cardHeight,
                  }}
                >
                  <div 
                    className={`relative w-full h-full rounded-[16px] border p-4 flex flex-col justify-between overflow-hidden transition-all duration-300 transform hover:scale-[1.03] active:scale-[0.98] ${cardBg} ${cardBorder} ${cardText} ${cardShadow} ${isLocked ? 'opacity-55 hover:opacity-80' : ''}`}
                  >
                    {/* Cute sticker mascot on completed cards */}
                    {isCompleted && (
                      <div className="absolute right-0 bottom-0 opacity-[0.25] pointer-events-none translate-x-1 translate-y-1">
                        <GoMascotAvatar />
                      </div>
                    )}

                    {/* Top Row: Icon + State Badge */}
                    <div className="flex items-center justify-between w-full">
                      <div className={`p-2 rounded-xl border ${
                        isCurrent 
                          ? (isLightTheme ? 'bg-zinc-900 text-cyan-400 border-zinc-800' : 'bg-zinc-100 text-blue-600 border-zinc-200')
                          : isCompleted
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-zinc-900/40 text-zinc-600 border-white/5'
                      }`}>
                        <TopicIcon className="w-5 h-5" strokeWidth={2} />
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {isCompleted ? (
                          <>
                            <div className="w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-[0_1px_4px_rgba(16,185,129,0.4)]">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                            <span className="text-[10px] font-bold font-mono tracking-wider opacity-75">100%</span>
                          </>
                        ) : isLocked ? (
                          <>
                            <Lock className="w-3.5 h-3.5 text-zinc-500" />
                            <span className="text-[10px] font-bold font-mono opacity-65">🔒</span>
                          </>
                        ) : (
                          <>
                            <span className="text-[10px] font-extrabold font-mono text-cyan-400 tracking-wider bg-cyan-500/10 px-1.5 py-0.5 rounded animate-pulse">+150 XP</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Title Area */}
                    <div className="flex-1 my-2.5 flex items-center">
                      <p 
                        className={`text-xs font-bold leading-snug line-clamp-2 w-full text-left`}
                      >
                        {t(node.label || node.title)}
                      </p>
                    </div>

                    {/* Bottom Row: Progress */}
                    <div className="flex items-center justify-between w-full border-t border-white/5 pt-2 text-[9px] font-mono opacity-80">
                      <span>Уроков: {node.lessons || 3}</span>
                      {isCompleted && (
                        <span className="text-emerald-500 dark:text-emerald-400 font-bold">Очки: {masteryScore}%</span>
                      )}
                      {isCurrent && (
                        <span className="text-cyan-400 font-bold tracking-widest animate-pulse">АКТИВЕН</span>
                      )}
                    </div>

                    {/* Milestone badge indicator */}
                    {isMilestone && (
                      <div className="absolute top-0 right-10 translate-y-[-50%] bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black text-[7.5px] tracking-widest uppercase px-2 py-0.5 rounded shadow-[0_2px_5px_rgba(245,158,11,0.3)]">
                        MILESTONE
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
                        className={`absolute right-1 top-1/2 -translate-y-1/2 z-20 w-5.5 h-5.5 rounded-full flex items-center justify-center border text-[11px] font-extrabold shadow-[0_2px_6px_rgba(0,0,0,0.4)] transition-all ${
                          isFolded 
                            ? 'bg-gradient-to-r from-violet-600 to-indigo-600 border-violet-400 text-white animate-pulse' 
                            : 'bg-zinc-900 border-white/15 text-zinc-400 hover:text-white hover:border-white/30'
                        }`}
                      >
                        {isFolded ? '+' : '-'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </motion.div>
        </motion.div>

        {/* Right Detail Sidebar Panel */}
        <motion.div className="w-full lg:w-80 flex-shrink-0 flex flex-col">
          <AnimatePresence mode="wait">
            {selectedNode ? (
              <motion.div 
                key="course"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.15 }}
                className="w-full border border-white/10 bg-slate-900/50 backdrop-blur-xl flex flex-col overflow-hidden flex-shrink-0 rounded-[20px] h-full font-sans shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]"
              >
                {/* Header */}
                <div className="p-4 border-b border-white/10 bg-white/5">
                  {/* Level Badge */}
                  <span className="inline-flex items-center text-[9px] font-mono font-bold px-2 py-0.5 rounded-[6px] bg-violet-500/20 text-violet-300 border border-violet-500/30 mb-2 uppercase tracking-wider">
                    {selectedNode.level || 'Intermediate'}
                  </span>
                  
                  {/* Title */}
                  <h3 className="text-sm font-extrabold text-white leading-snug font-clash">
                    {t(selectedNode.label || selectedNode.title)}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed line-clamp-4">
                    {t(selectedNode.desc || selectedNode.description) || 'Нажми «Начать урок» чтобы сгенерировать материал'}
                  </p>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
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
                <div className="p-3 border-t border-white/10 bg-white/5 flex flex-col gap-2.5">
                  <button
                    onClick={() => setIsStudying(true)}
                    disabled={selectedNode.status === 'locked'}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-[12px] text-xs font-bold transition-all transform active:scale-95 duration-150 font-sans ${
                      selectedNode.status === 'locked'
                        ? 'bg-zinc-800/40 border border-white/5 text-zinc-500 cursor-not-allowed'
                        : selectedNode.status === 'completed'
                        ? 'bg-transparent border border-white/20 text-white hover:bg-white/5 hover:border-white'
                        : 'bg-white text-black hover:bg-zinc-200'
                    }`}
                  >
                    {selectedNode.status === 'locked' && <Lock className="w-3.5 h-3.5" />}
                    {selectedNode.status === 'locked' && 'Заблокировано'}
                    {selectedNode.status !== 'locked' && selectedNode.status === 'completed' && 'Повторить урок'}
                    {selectedNode.status !== 'locked' && selectedNode.status !== 'completed' && 'Начать урок'}
                  </button>

                  {/* AI Mentor CTA */}
                  <div className="relative overflow-hidden p-3 rounded-[12px] bg-gradient-to-br from-indigo-950/40 to-purple-950/40 border border-indigo-500/20 flex flex-col gap-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-300">
                        <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse" />
                        AI Наставник
                      </span>
                      <span className="text-[7px] font-black tracking-widest uppercase bg-indigo-500 text-white px-1.5 py-0.5 rounded-[4px] shadow-[0_2px_10px_rgba(99,102,241,0.3)]">PRO</span>
                    </div>
                    <p className="text-[9px] text-zinc-300 leading-normal">Хочешь узнать больше об этой теме? Спроси AI Mentor.</p>
                    <button
                      onClick={() => {
                        navigate('/mentor', { 
                          state: { 
                            query: `Привет! Я изучаю тему "${selectedNode.label || selectedNode.title}". Пожалуйста, объясни её основы и покажи типичные практические примеры по этой теме.` 
                          } 
                        });
                      }}
                      className="w-full py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-[10px] font-bold rounded-[8px] transition-all flex items-center justify-center gap-1 shadow-[0_4px_12px_rgba(99,102,241,0.2)]"
                    >
                      Спросить AI Наставника
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="placeholder"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-[20px] p-6 h-full flex flex-col items-center justify-center text-center text-zinc-400 font-sans shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] animate-fade-in-up"
              >
                <div className="w-16 h-16 bg-zinc-950/40 border border-white/5 rounded-[16px] flex items-center justify-center mb-6">
                  <Pointer className="w-6 h-6 text-white opacity-40" strokeWidth={1.5} />
                </div>
                <p className="text-sm font-semibold">{t('graph.details.placeholder') || 'Выберите тему на карте, чтобы увидеть детали'}</p>
                
                {/* Empty state AI Mentor CTA */}
                <div className="mt-8 w-full relative overflow-hidden p-4 rounded-[16px] bg-gradient-to-br from-indigo-950/40 to-purple-950/40 border border-indigo-500/20 flex flex-col gap-2.5 text-left shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-300">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      Твой план обучения
                    </span>
                    <span className="text-[8px] font-black tracking-widest uppercase bg-indigo-500 text-white px-1.5 py-0.5 rounded-[4px]">PRO</span>
                  </div>
                  <p className="text-[10px] text-zinc-300 leading-normal">Спланируй свой путь обучения. Получи советы по сложным темам у AI Mentor.</p>
                  <button
                    onClick={() => {
                      navigate('/mentor', { 
                        state: { 
                          query: `Привет! Помоги мне составить план обучения на основе моего графа знаний по курсу "${selectedCourse?.title || 'мои предметы'}".` 
                        } 
                      });
                    }}
                    className="w-full py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-[10px] font-bold rounded-[8px] transition-all flex items-center justify-center gap-1 shadow-[0_4px_12px_rgba(99,102,241,0.2)]"
                  >
                    Составить план с AI
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Expanded Lesson Panel */}
        <AnimatePresence>
          {isStudying && selectedNode && (
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`absolute right-0 z-50 bg-[#07080a] border-l border-white/10 flex flex-col transition-all duration-500 ease-in-out ${isZenMode ? 'inset-0 w-full h-full' : 'inset-y-0 w-full lg:w-[65%] xl:w-[70%]'}`}
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

      </div>
    </motion.div>
  );
}
