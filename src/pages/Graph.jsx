import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Network, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Brain, 
  Activity, 
  Pointer, 
  ChevronRight, 
  BookOpen, 
  Clock, 
  Lock, 
  CheckCircle,
  Loader2,
  Trophy
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase.js';
import { getUserCourses, getCourseById, updateNodeStatus } from '../services/courseService.js';
import { calculateMastery } from '../hooks/useMastery.js';
import { t, useLocale } from '../i18n.js';
import LessonPanel from '../components/lessons/LessonPanel.jsx';
import MasteryBlock from '../components/shared/MasteryBlock.jsx';

const iconMap = {
  brain: Brain,
  cpu: Activity, // Use Activity for Cpu
  network: Network,
  languages: BookOpen,
  eye: Brain,
  gamepad: Trophy,
  sparkles: SparklesIcon,
  scale: ScaleIcon,
  cloud: CloudIcon,
};

function SparklesIcon(props) { return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>; }
function ScaleIcon(props) { return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>; }
function CloudIcon(props) { return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>; }

const getCssVar = (name, fallback) => {
  if (typeof window === 'undefined') return fallback;
  const val = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return val || fallback;
};

const getNodeVisuals = (node, quizResults) => {
  const result = quizResults?.[node.id];
  const isCompleted = result?.passed === true;
  const isCurrent = !node.locked && !isCompleted;

  const fontColor = getCssVar('--md-on-primary', '#ffffff');
  
  if (isCompleted) {
    const bg = getCssVar('--md-tertiary', '#1D9E75');
    const border = getCssVar('--md-on-tertiary-container', '#0F6E56');
    return {
      color: { background: bg, border: bg, highlight: { background: border, border: bg } },
      font: { color: getCssVar('--md-on-tertiary', '#ffffff'), size: 12, face: 'Inter, sans-serif' },
      borderWidth: 0,
      borderWidthSelected: 2,
      shape: 'box',
      widthConstraint: { minimum: 100, maximum: 140 },
      heightConstraint: { minimum: 36 },
      margin: { top: 10, bottom: 10, left: 12, right: 12 },
      shadow: false,
    };
  }

  if (isCurrent) {
    const bg = getCssVar('--md-primary', '#378ADD');
    const border = getCssVar('--md-primary-container', '#185FA5');
    return {
      color: { background: bg, border: bg, highlight: { background: border, border: bg } },
      font: { color: getCssVar('--md-on-primary', '#ffffff'), size: 12, face: 'Inter, sans-serif' },
      borderWidth: 0,
      borderWidthSelected: 2,
      shape: 'box',
      widthConstraint: { minimum: 100, maximum: 140 },
      heightConstraint: { minimum: 36 },
      margin: { top: 10, bottom: 10, left: 12, right: 12 },
      shadow: false,
    };
  }

  // Locked
  const bgLocked = getCssVar('--md-surface-variant', '#888780');
  const borderLocked = getCssVar('--md-outline-variant', '#5F5E5A');
  const textLocked = getCssVar('--md-on-surface-variant', 'rgba(255,255,255,0.5)');
  
  return {
    color: { background: bgLocked, border: borderLocked, highlight: { background: bgLocked, border: borderLocked } },
    font: { color: textLocked, size: 11, face: 'Inter, sans-serif' },
    borderWidth: 1,
    borderWidthSelected: 2,
    shape: 'box',
    widthConstraint: { minimum: 100, maximum: 140 },
    heightConstraint: { minimum: 36 },
    margin: { top: 10, bottom: 10, left: 12, right: 12 },
    opacity: 0.6,
    shadow: false,
    label: (node.title || node.label) + '\n🔒',
  };
};

const getEdgeStyle = (fromNode, toNode) => {
  const fromDone = fromNode?.completed;
  const toDone = toNode?.completed;

  if (fromDone && toDone) {
    return { color: { color: getCssVar('--md-tertiary', '#1D9E75'), highlight: getCssVar('--md-tertiary', '#5DCAA5') }, width: 2, dashes: false };
  }
  if (fromDone && !toDone) {
    return { color: { color: getCssVar('--md-primary', '#378ADD'), highlight: getCssVar('--md-primary', '#85B7EB') }, width: 2, dashes: false };
  }
  return { color: { color: getCssVar('--md-outline-variant', '#B4B2A9'), highlight: getCssVar('--md-outline', '#888780') }, width: 1, dashes: [4, 3] };
};

const getLevelBadgeClass = (level) => {
  switch (level) {
    case 'Beginner': return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
    case 'Intermediate': return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
    case 'Advanced': return 'bg-purple-500/10 text-purple-500 border border-purple-500/20';
    default: return 'bg-gray-500/10 text-gray-500 border border-gray-500/20';
  }
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function Graph() {
  const navigate = useNavigate();
  const locale = useLocale();
  const containerRef = useRef(null);
  const networkRef = useRef(null);
  
  const [user, setUser] = useState(auth.currentUser);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completingNode, setCompletingNode] = useState(false);
  const [markError, setMarkError] = useState('');
  const [quizResults, setQuizResults] = useState({});
  const [isStudying, setIsStudying] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [themeTrigger, setThemeTrigger] = useState(0);

  useEffect(() => {
    const handleThemeChange = () => setThemeTrigger(prev => prev + 1);
    window.addEventListener('theme:changed', handleThemeChange);
    return () => window.removeEventListener('theme:changed', handleThemeChange);
  }, []);

  useEffect(() => {
    if (!selectedCourse || !user) return;
    const fetchQuizData = async () => {
      try {
        const q = query(
          collection(db, 'quizResults'), 
          where('roadmapId', '==', selectedCourse.id), 
          where('userId', '==', user.uid)
        );
        const snap = await getDocs(q);
        const resultsMap = {};
        snap.forEach(doc => {
          const data = doc.data();
          if (!resultsMap[data.nodeId] || data.lastAttemptAt > resultsMap[data.nodeId].lastAttemptAt) {
            resultsMap[data.nodeId] = data;
          }
        });
        setQuizResults(resultsMap);
      } catch (e) {
        console.error("Failed to fetch quiz results for mastery:", e);
      }
    };
    fetchQuizData();
  }, [selectedCourse, user]);

  // 1. Authenticate and fetch courses
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userCourses = await getUserCourses(currentUser.uid);
          setCourses(userCourses);
          
          if (userCourses.length > 0) {
            // Check if there was a selected course saved in localStorage
            const savedId = localStorage.getItem('selected_course_id');
            const match = userCourses.find(c => c.id === savedId);
            
            if (match) {
              setSelectedCourse(match);
            } else {
              setSelectedCourse(userCourses[0]);
            }
          }
        } catch (e) {
          console.error("Error loading knowledge graph:", e);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Build or update Vis.js network when selectedCourse or theme changes
  useEffect(() => {
    if (!containerRef.current || !window.vis || !selectedCourse) return;

    const visNodes = selectedCourse.nodes.map(c => {
      const visuals = getNodeVisuals(c, quizResults);
      return {
        id: c.id,
        label: visuals.label || c.title || t(c.label),
        shape: visuals.shape,
        margin: visuals.margin,
        borderWidth: visuals.borderWidth,
        borderWidthSelected: visuals.borderWidthSelected,
        widthConstraint: visuals.widthConstraint,
        heightConstraint: visuals.heightConstraint,
        color: visuals.color,
        font: visuals.font,
        shadow: visuals.shadow,
        opacity: visuals.opacity
      };
    });

    const visEdges = selectedCourse.edges.map(e => {
      const fromNode = selectedCourse.nodes.find(n => n.id === e.from);
      const toNode = selectedCourse.nodes.find(n => n.id === e.to);
      const style = getEdgeStyle(
        { ...fromNode, completed: quizResults[fromNode?.id]?.passed },
        { ...toNode, completed: quizResults[toNode?.id]?.passed }
      );
      
      return {
        from: e.from,
        to: e.to,
        arrows: 'to',
        color: style.color,
        width: style.width,
        dashes: style.dashes,
      };
    });

    const data = {
      nodes: new window.vis.DataSet(visNodes),
      edges: new window.vis.DataSet(visEdges)
    };

    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const options = {
      physics: {
        enabled: true,
        hierarchicalRepulsion: { centralGravity: 0.1, springLength: 120, nodeDistance: 140 },
        solver: 'hierarchicalRepulsion',
      },
      layout: {
        hierarchical: { enabled: true, direction: 'DU', sortMethod: 'directed', levelSeparation: 90, nodeSpacing: 140 },
      },
      interaction: {
        hover: !isTouch,
        tooltipDelay: 200,
        zoomView: true,
        dragView: true,
        dragNodes: !isTouch,
      },
      nodes: {
        borderRadius: 10,
        chosen: true,
      },
      edges: {
        arrows: { to: { enabled: true, scaleFactor: 0.6 } },
        smooth: { type: 'cubicBezier', forceDirection: 'vertical', roundness: 0.4 },
      },
    };

    const network = new window.vis.Network(containerRef.current, data, options);
    networkRef.current = network;

    network.on('click', (params) => {
      if (params.nodes.length > 0) {
        const node = selectedCourse.nodes.find(c => String(c.id) === String(params.nodes[0]));
        setSelectedNode(node);
      } else {
        setSelectedNode(null);
      }
    });

    // If a node was previously selected, refresh its reference from the new course object
    if (selectedNode) {
      const refreshedNode = selectedCourse.nodes.find(n => String(n.id) === String(selectedNode.id));
      setSelectedNode(refreshedNode || null);
    }

    return () => {
       network.destroy();
      networkRef.current = null;
    };
  }, [selectedCourse, locale, quizResults, themeTrigger]);

  const handleZoomIn = () => networkRef.current?.moveTo({ scale: networkRef.current.getScale() * 1.25 });
  const handleZoomOut = () => networkRef.current?.moveTo({ scale: networkRef.current.getScale() * 0.8 });
  const handleReset = () => networkRef.current?.fit({ animation: { duration: 500, easingFunction: 'easeInOutQuad' } });

  const getPrereqs = (id) => {
    if (!selectedCourse) return [];
    return selectedCourse.edges
      .filter(e => String(e.to) === String(id))
      .map(e => t(selectedCourse.nodes.find(c => String(c.id) === String(e.from))?.label))
      .filter(Boolean);
  };

  const getLeadsTo = (id) => {
    if (!selectedCourse) return [];
    return selectedCourse.edges
      .filter(e => String(e.from) === String(id))
      .map(e => t(selectedCourse.nodes.find(c => String(c.id) === String(e.to))?.label))
      .filter(Boolean);
  };

  const handleCourseChange = (e) => {
    const targetCourse = courses.find(c => c.id === e.target.value);
    if (targetCourse) {
      setSelectedCourse(targetCourse);
      setSelectedNode(null);
      localStorage.setItem('selected_course_id', targetCourse.id);
    }
  };

  const handleMarkCompleted = async () => {
    if (!selectedCourse || !selectedNode || selectedNode.status !== 'active') return;
    setCompletingNode(true);
    setMarkError('');
    
    try {
      const updated = await updateNodeStatus(selectedCourse.id, selectedNode.id, 'completed');
      
      // Update local courses state
      setCourses(prev => prev.map(c => c.id === selectedCourse.id ? updated : c));
      
      // Update current selected course
      setSelectedCourse(updated);
      
      // Find the newly updated node to refresh details
      const node = updated.nodes.find(n => n.id === selectedNode.id);
      setSelectedNode(node);
    } catch (e) {
      console.error(e);
      if (e.message.includes('Quiz must be passed')) {
        setMarkError('Вы ещё не сдали тест для этого урока.');
      } else {
        setMarkError('Произошла ошибка при обновлении статуса.');
      }
    } finally {
      setCompletingNode(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-on-surface gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-medium tracking-wide">{t('graph.loading')}</p>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="p-8 max-w-7xl mx-auto h-[calc(100vh-4rem)] flex flex-col justify-center items-center text-center">
        <Network className="w-16 h-16 text-on-surface-variant/30 mb-4 animate-pulse" />
        <h2 className="text-2xl font-bold text-on-surface mb-2">{t('graph.noRoadmaps')}</h2>
        <p className="text-on-surface-variant max-w-md mb-6">{t('graph.noRoadmapsDesc')}</p>
        <button 
          onClick={() => navigate('/dashboard')}
          className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold shadow-md hover:bg-primary/95 transition-all"
        >
          {t('lessons.goDashboard')}
        </button>
      </div>
    );
  }

  const NodeIcon = selectedNode && (iconMap[selectedNode.iconName] || Brain);

  return (
    <motion.div initial="hidden" animate="show" variants={containerVariants} className="p-4 md:p-8 max-w-7xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
      <motion.div variants={itemVariants} className="mb-6 flex-shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4 px-5 py-4 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">{t('graph.title') || 'Knowledge graph'}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {selectedCourse ? t(selectedCourse.title) : ''} · {selectedCourse?.nodes?.length || 0} тем
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Легенда */}
          <div className="flex items-center gap-4">
            {[
              { color: 'bg-green-500', label: 'Пройдено' },
              { color: 'bg-blue-500', label: 'Доступно' },
              { color: 'bg-gray-400', label: 'Заблокировано' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{label}</span>
              </div>
            ))}
          </div>

          <select 
            value={selectedCourse?.id || ''} 
            onChange={handleCourseChange}
            className="w-full sm:w-64 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {courses.map(c => (
              <option key={c.id} value={c.id}>{t(c.title)}</option>
            ))}
          </select>
        </div>
      </motion.div>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-6">
        <motion.div variants={itemVariants} className="flex-1 bg-surface border border-outline-variant rounded-2xl overflow-hidden relative shadow-lg flex flex-col group">

          {/* Controls */}
          <div className="absolute bottom-4 right-4 z-10 flex gap-2">
            {[ { icon: ZoomIn, onClick: handleZoomIn }, { icon: ZoomOut, onClick: handleZoomOut }, { icon: RotateCcw, onClick: handleReset } ].map((btn, i) => (
              <motion.button key={i} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={btn.onClick} className="w-12 h-12 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors shadow-lg">
                <btn.icon className="w-5 h-5" />
              </motion.button>
            ))}
          </div>

          {/* Vis Container */}
          <div ref={containerRef} className="flex-1 w-full h-full cursor-grab active:cursor-grabbing outline-none" />
        </motion.div>

        {/* Right Detail Panel */}
        <motion.div variants={itemVariants} className="w-full lg:w-72 flex-shrink-0 flex flex-col">
          <AnimatePresence mode="wait">
            {selectedNode ? (
              <motion.div 
                key="course"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                transition={{ type: 'spring', damping: 20 }}
                className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex flex-col overflow-hidden flex-shrink-0 rounded-2xl shadow-lg h-full"
              >
                {/* Хедер панели */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  {/* Бейдж уровня */}
                  <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 mb-2">
                    {selectedNode.level || 'Intermediate'}
                  </span>
                  
                  {/* Название */}
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-snug">
                    {t(selectedNode.label || selectedNode.title)}
                  </h3>
                  
                  {/* Описание */}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed line-clamp-3">
                    {t(selectedNode.desc || selectedNode.description) || 'Нажми «Начать урок» чтобы сгенерировать материал'}
                  </p>
                </div>

                {/* Тело панели */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
                  {/* Мета: время и кол-во уроков */}
                  <div className="flex gap-2">
                    <div className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                      <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">⏱ Время</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">~{selectedNode.hours || selectedNode.estimatedTime || '2'} ч</p>
                    </div>
                    <div className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                      <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">📄 Уроков</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedNode.lessons || selectedNode.lessonsCount || '1'}</p>
                    </div>
                  </div>

                  {/* Mastery Score */}
                  {(() => {
                    const qResult = quizResults?.[selectedNode.id];
                    const mScore = qResult ? calculateMastery(qResult.score, qResult.lastAttemptAt?.toDate?.() || qResult.lastAttemptAt) : null;
                    return <MasteryBlock masteryScore={mScore} />;
                  })()}

                  {/* Зависимости — что нужно выполнить */}
                  {selectedCourse && selectedCourse.edges.filter(e => String(e.to) === String(selectedNode.id)).length > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mb-1.5">Требует завершить</p>
                      {selectedCourse.edges.filter(e => String(e.to) === String(selectedNode.id)).map(e => {
                        const preId = e.from;
                        const preNode = selectedCourse.nodes.find(n => String(n.id) === String(preId));
                        const isDone = quizResults?.[preId]?.passed;
                        return (
                          <div key={preId} className={`flex items-center gap-2 p-2 rounded-lg border text-xs mb-1 ${
                            isDone
                              ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
                              : 'bg-gray-50 border-gray-200 text-gray-500 dark:bg-gray-900 dark:border-gray-700'
                          }`}>
                            {isDone ? '✅' : '🔒'}
                            <span className="truncate">{t(preNode?.label || preNode?.title || preId)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Зависимости — что откроется */}
                  {selectedCourse && selectedCourse.edges.filter(e => String(e.from) === String(selectedNode.id)).length > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mb-1.5">Открывает доступ к</p>
                      {selectedCourse.edges.filter(e => String(e.from) === String(selectedNode.id)).map(e => {
                        const nextId = e.to;
                        const nextNode = selectedCourse.nodes.find(n => String(n.id) === String(nextId));
                        return (
                          <div key={nextId} className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs text-gray-500 dark:text-gray-400 mb-1">
                            <span className="text-blue-500">→</span>
                            <span className="truncate">{t(nextNode?.label || nextNode?.title || nextId)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Кнопка старта */}
                <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setIsStudying(true)}
                    disabled={selectedNode.status === 'locked'}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      selectedNode.status === 'locked'
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                        : selectedNode.status === 'completed'
                        ? 'bg-green-500 hover:bg-green-600 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    {selectedNode.status === 'locked' && '🔒 Заблокировано'}
                    {selectedNode.status !== 'locked' && selectedNode.status === 'completed' && '↩ Повторить урок'}
                    {selectedNode.status !== 'locked' && selectedNode.status !== 'completed' && '▶ Начать урок'}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="placeholder"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="bg-surface border border-outline-variant rounded-2xl p-6 shadow-lg h-full flex flex-col items-center justify-center text-center text-on-surface-variant"
              >
                <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <Pointer className="w-10 h-10 text-primary" />
                </motion.div>
                <p className="text-lg font-medium">{t('graph.details.placeholder')}</p>
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
              className={`absolute right-0 z-50 bg-surface shadow-2xl border-l border-outline-variant flex flex-col transition-all duration-500 ease-in-out ${isZenMode ? 'inset-0 w-full h-full' : 'inset-y-0 w-full lg:w-[65%] xl:w-[70%]'}`}
            >
              <LessonPanel 
                selectedCourse={selectedCourse}
                selectedNode={selectedNode}
                onClose={() => setIsStudying(false)}
                isZenMode={isZenMode}
                toggleZenMode={() => setIsZenMode(!isZenMode)}
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

      </div>
    </motion.div>
  );
}
