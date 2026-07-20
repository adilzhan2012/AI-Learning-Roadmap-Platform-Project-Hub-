import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Network, 
  Loader2, 
  BookOpen, 
  Clock, 
  Brain, 
  Pointer,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Lock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, doc, updateDoc, setDoc } from 'firebase/firestore';
import { getUserCourses } from '../services/courseService.js';
import { t } from '../i18n.js';
import LessonPanel from '../components/lessons/LessonPanel.jsx';
import MasteryBlock from '../components/shared/MasteryBlock.jsx';
import { calculateMastery } from '../hooks/useMastery.js';
import QuizHistoryModal from '../components/quiz/QuizHistoryModal.jsx';
import { usePlanLimits } from '../hooks/usePlanLimits.js';

// Simple vis-network map icons
const iconMap = {
  school: BookOpen,
  activity: Clock,
  brain: Brain,
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 250, damping: 22 } }
};

const getNodeVisuals = (node, quizResults, isLight) => {
  const result = quizResults?.[node.id];
  const isCompleted = result?.passed === true;
  const isCurrent = !node.locked && !isCompleted;
  
  const masteryScore = result ? calculateMastery(result.score, result.lastAttemptAt?.toDate?.() || result.lastAttemptAt) : 0;
  const baseTitle = node.title || (node.label ? t(node.label) : '');

  // Mastered / Completed Node
  if (isCompleted) {
    const sizeOffset = Math.round(masteryScore / 20); // 0 to 5px font size scaling
    const widthOffset = Math.round(masteryScore / 2); // 0 to 50px width scaling
    const heightOffset = Math.round(masteryScore / 5); // 0 to 20px height scaling
    return {
      color: { 
        background: isLight ? '#FFFFFF' : '#1C1C1E', 
        border: isLight ? '#000000' : '#FFFFFF', 
        highlight: { 
          background: isLight ? '#FFFFFF' : '#1C1C1E', 
          border: isLight ? '#000000' : '#FFFFFF' 
        }
      },
      font: { color: isLight ? '#000000' : '#F5F5F7', size: 11 + sizeOffset, face: 'SF Pro Text, Inter, sans-serif' },
      borderWidth: 1.5,
      borderWidthSelected: 3,
      shape: 'box',
      widthConstraint: { minimum: 110 + widthOffset, maximum: 140 + widthOffset },
      heightConstraint: { minimum: 36 + heightOffset },
      margin: { top: 8, bottom: 8, left: 12, right: 12 },
      shadow: false,
      label: baseTitle + `\n${masteryScore}%`,
    };
  }

  // Recommended / Active Node
  if (isCurrent) {
    return {
      color: { 
        background: isLight ? '#000000' : '#FFFFFF', 
        border: isLight ? '#000000' : '#FFFFFF', 
        highlight: { 
          background: isLight ? '#000000' : '#FFFFFF', 
          border: isLight ? '#000000' : '#FFFFFF' 
        }
      },
      font: { color: isLight ? '#FFFFFF' : '#000000', size: 12, face: 'SF Pro Text, Inter, sans-serif', bold: true },
      borderWidth: 1.5,
      borderWidthSelected: 3,
      shape: 'box',
      widthConstraint: { minimum: 120, maximum: 150 },
      heightConstraint: { minimum: 40 },
      margin: { top: 8, bottom: 8, left: 12, right: 12 },
      shadow: false,
      label: baseTitle + ' •',
    };
  }

  // Locked Node
  return {
    color: { 
      background: isLight ? '#E5E5EA' : '#2C2C2E', 
      border: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)', 
      highlight: { 
        background: isLight ? '#E5E5EA' : '#2C2C2E', 
        border: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)' 
      }
    },
    font: { color: isLight ? '#8E8E93' : '#98989D', size: 11, face: 'SF Pro Text, Inter, sans-serif' },
    borderWidth: 1,
    borderWidthSelected: 2,
    shape: 'box',
    widthConstraint: { minimum: 120, maximum: 150 },
    heightConstraint: { minimum: 40 },
    margin: { top: 8, bottom: 8, left: 12, right: 12 },
    opacity: 0.35,
    shadow: false,
    label: baseTitle + ' 🔒',
  };
};

const getEdgeStyle = (fromNode, toNode, isLight) => {
  const fromDone = fromNode?.completed;
  const toDone = toNode?.completed;

  // Completed connections are thin and subtle
  if (fromDone && toDone) {
    return { 
      color: { 
        color: isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)', 
        highlight: isLight ? '#000000' : '#FFFFFF' 
      }, 
      width: 1, 
      dashes: false 
    };
  }
  // Recommended path leads from a completed node to the current active node
  if (fromDone && !toDone) {
    return { 
      color: { 
        color: isLight ? '#000000' : '#FFFFFF', 
        highlight: isLight ? '#000000' : '#FFFFFF' 
      }, 
      width: 2.5, 
      dashes: false 
    };
  }
  return { 
    color: { 
      color: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)', 
      highlight: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)' 
    }, 
    width: 1, 
    dashes: [3, 4] 
  };
};

export default function Graph() {
  const navigate = useRef(useNavigate()).current;
  const { plan } = usePlanLimits();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [quizResults, setQuizResults] = useState({});
  const [isStudying, setIsStudying] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [quizRefreshTrigger, setQuizRefreshTrigger] = useState(0);
  const [isLightTheme, setIsLightTheme] = useState(document.documentElement.classList.contains('light'));
  const [visError, setVisError] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyModalFilterNodeId, setHistoryModalFilterNodeId] = useState(null);

  const containerRef = useRef(null);
  const networkRef = useRef(null);

  // Sync theme changes
  useEffect(() => {
    const handleThemeChange = (e) => {
      setIsLightTheme(e.detail.theme === 'light');
    };
    window.addEventListener('theme:changed', handleThemeChange);
    return () => window.removeEventListener('theme:changed', handleThemeChange);
  }, []);

  // Load courses
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          let fetched = await getUserCourses(user.uid);
          if (plan === 'FREE') {
            // Free видит граф только для своего одного активного курса
            fetched = fetched.length > 0 ? [fetched[0]] : [];
          }
          setCourses(fetched);
          
          // Select initial course from localStorage or take the first one
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

  // Load quiz results for current course nodes
  useEffect(() => {
    const user = auth.currentUser;
    if (!user || !selectedCourse) return;

    const loadQuizResults = async () => {
      try {
        const snap = await getDocs(collection(db, 'users', user.uid, 'quizResults'));
        const resultsMap = {};
        snap.forEach(doc => {
          const data = doc.data();
          // Filter quiz results for current course
          if (selectedCourse.nodes.some(n => n.id === data.nodeId)) {
            // Keep the latest quiz attempt
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

  // Build Vis Network
  useEffect(() => {
    if (!containerRef.current || !selectedCourse) return;

    if (!window.vis) {
      setVisError(true);
      return;
    }

    const visNodes = selectedCourse.nodes.map(node => {
      const visual = getNodeVisuals(node, quizResults, isLightTheme);
      return {
        id: node.id,
        ...visual
      };
    });

    const visEdges = selectedCourse.edges.map(edge => {
      const fromNode = selectedCourse.nodes.find(n => n.id === edge.from);
      const toNode = selectedCourse.nodes.find(n => n.id === edge.to);
      const style = getEdgeStyle(
        { ...fromNode, completed: quizResults?.[edge.from]?.passed },
        { ...toNode, completed: quizResults?.[edge.to]?.passed },
        isLightTheme
      );
      return {
        from: edge.from,
        to: edge.to,
        arrows: 'to',
        ...style
      };
    });

    const data = { nodes: visNodes, edges: visEdges };
    const options = {
      physics: {
        enabled: true,
        solver: 'barnesHut',
        barnesHut: {
          gravitationalConstant: -1800,
          centralGravity: 0.15,
          springLength: 95,
          springConstant: 0.04,
          damping: 0.09,
        }
      },
      interaction: {
        hover: true,
        tooltipDelay: 200,
        zoomView: plan !== 'FREE',
        dragView: plan !== 'FREE'
      }
    };

    const network = new window.vis.Network(containerRef.current, data, options);
    networkRef.current = network;

    network.on('click', (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        const node = selectedCourse.nodes.find(n => n.id === nodeId);
        setSelectedNode(node || null);
      } else {
        setSelectedNode(null);
      }
    });

    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
        networkRef.current = null;
      }
    };
  }, [selectedCourse, quizResults, isLightTheme]);

  const handleCourseChange = (e) => {
    const courseId = e.target.value;
    const course = courses.find(c => c.id === courseId);
    setSelectedCourse(course || null);
    setSelectedNode(null);
    localStorage.setItem('selected_course_id', courseId);
  };

  const handleSelectNodeFromHistory = (nodeId) => {
    const node = selectedCourse?.nodes?.find(n => String(n.id) === String(nodeId));
    if (node) {
      setSelectedNode(node);
      if (networkRef.current) {
        networkRef.current.selectNodes([nodeId]);
        networkRef.current.focus(nodeId, {
          scale: 1.1,
          animation: {
            duration: 1000,
            easingFunction: 'easeInOutQuad'
          }
        });
      }
    }
  };

  const handleZoomIn = () => {
    if (networkRef.current) {
      const scale = networkRef.current.getScale();
      networkRef.current.moveTo({ scale: scale * 1.2 });
    }
  };

  const handleZoomOut = () => {
    if (networkRef.current) {
      const scale = networkRef.current.getScale();
      networkRef.current.moveTo({ scale: scale / 1.2 });
    }
  };

  const handleReset = () => {
    if (networkRef.current) {
      networkRef.current.fit({ animation: true });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#000000] text-[#F5F5F7] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#FFFFFF]" />
        <p className="text-sm font-medium tracking-wide font-clash">{t('graph.loading')}</p>
      </div>
    );
  }

  if (visError) {
    return (
      <div className="p-8 max-w-7xl mx-auto h-[calc(100vh-4rem)] flex flex-col justify-center items-center text-center">
        <Network className="w-16 h-16 text-[#FF453A] mb-4 opacity-75 animate-pulse" />
        <h2 className="text-xl font-bold text-[#FFFFFF] mb-2 font-clash">
          {t('graph.loadErrorTitle') || 'Ошибка загрузки графа'}
        </h2>
        <p className="text-xs text-[#98989D] max-w-md mb-6 leading-relaxed">
          {t('graph.loadErrorDesc') || 'Не удалось загрузить библиотеку визуализации. Пожалуйста, проверьте подключение к интернету и обновите страницу.'}
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-[#FFFFFF] hover:bg-[#E8E8ED] text-[#000000] px-6 py-3 rounded-[12px] font-bold text-xs uppercase tracking-wider transition-all"
        >
          {t('graph.reloadPage') || 'Обновить страницу'}
        </button>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="p-8 max-w-7xl mx-auto h-[calc(100vh-4rem)] flex flex-col justify-center items-center text-center">
        <Network className="w-16 h-16 text-[#98989D] mb-4 opacity-30 animate-pulse" />
        <h2 className="text-xl font-bold text-[#FFFFFF] mb-2 font-clash">{t('graph.noRoadmaps')}</h2>
        <p className="text-xs text-[#98989D] max-w-md mb-6">{t('graph.noRoadmapsDesc')}</p>
        <button 
          onClick={() => navigate('/dashboard')}
          className="bg-[#FFFFFF] hover:bg-[#E8E8ED] text-[#000000] px-6 py-3 rounded-[12px] font-bold text-xs uppercase tracking-wider transition-all"
        >
          {t('lessons.goDashboard')}
        </button>
      </div>
    );
  }

  return (
    <motion.div initial="hidden" animate="show" variants={containerVariants} className="max-w-[2000px] mx-auto h-[calc(100vh-4.5rem)] flex flex-col text-[#F5F5F7] font-sans">
      {/* Top Header Card */}
      <motion.div variants={itemVariants} className="mb-6 flex-shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4 px-5 py-4 border border-[rgba(255,255,255,0.08)] bg-[#1C1C1E] rounded-[16px] font-sans">
        <div>
          <h2 className="text-lg font-bold text-[#FFFFFF] font-clash">{t('graph.title') || 'Knowledge graph'}</h2>
          <p className="text-xs text-[#98989D] mt-1 font-mono">
            {selectedCourse ? t(selectedCourse.title) : ''} · {selectedCourse?.nodes?.length || 0} тем
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Legend in monochrome */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {[
              { color: 'bg-transparent border border-[#FFFFFF]', label: 'Изучено' },
              { color: 'bg-[#FFFFFF]', label: 'Рекомендуется' },
              { color: 'bg-[#2C2C2E] opacity-35 border border-[rgba(255,255,255,0.04)]', label: 'Заблокировано' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5 font-sans">
                <div className={`w-2.5 h-2.5 rounded-sm ${color}`} />
                <span className="text-[11px] font-medium text-[#98989D]">{label}</span>
              </div>
            ))}
          </div>

          <div className="flex w-full sm:w-auto items-center gap-3">
            <button
              onClick={() => {
                setHistoryModalFilterNodeId(null);
                setHistoryModalOpen(true);
              }}
              className="flex items-center justify-center gap-1.5 bg-[#2C2C2E]/60 hover:bg-[#FFFFFF]/10 border border-[rgba(255,255,255,0.08)] text-[#FFFFFF] px-3.5 py-2 rounded-[12px] text-xs font-bold transition-all w-full sm:w-auto"
            >
              <Clock className="w-3.5 h-3.5 text-[#98989D]" />
              История тестов
            </button>

            <select 
              value={selectedCourse?.id || ''} 
              onChange={handleCourseChange}
              className="w-full sm:w-64 bg-[#1C1C1E] border border-[rgba(255,255,255,0.08)] rounded-[12px] px-4 py-2 text-xs font-mono text-[#F5F5F7] focus:outline-none focus:border-[#FFFFFF]"
            >
              {courses.map(c => (
                <option key={c.id} value={c.id}>{t(c.title)}</option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-6">
        {/* Canvas Wrapper */}
        <motion.div variants={itemVariants} className="flex-1 bg-[#000000] border border-[rgba(255,255,255,0.08)] rounded-[16px] overflow-hidden relative flex flex-col group">

          {/* Floating Dock Zoom Controls */}
          {plan !== 'FREE' && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2 bg-[#1C1C1E]/80 backdrop-blur-md px-3 py-2 rounded-full border border-[rgba(255,255,255,0.08)] shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
              {[ { icon: ZoomIn, onClick: handleZoomIn }, { icon: ZoomOut, onClick: handleZoomOut }, { icon: RotateCcw, onClick: handleReset } ].map((btn, i) => (
                <motion.button key={i} whileTap={{ scale: 0.95 }} onClick={btn.onClick} className="w-9 h-9 rounded-full hover:bg-[#FFFFFF]/10 flex items-center justify-center text-[#F5F5F7] transition-colors">
                  <btn.icon className="w-4 h-4" strokeWidth={1.5} />
                </motion.button>
              ))}
            </div>
          )}

          {/* Vis Container */}
          <div ref={containerRef} className="flex-1 w-full h-full cursor-grab active:cursor-grabbing outline-none" />
        </motion.div>

        {/* Right Detail Panel */}
        <motion.div variants={itemVariants} className="w-full lg:w-80 flex-shrink-0 flex flex-col">
          <AnimatePresence mode="wait">
            {selectedNode ? (
              <motion.div 
                key="course"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.15 }}
                className="w-full border border-[rgba(255,255,255,0.08)] bg-[#1C1C1E]/95 backdrop-blur-md flex flex-col overflow-hidden flex-shrink-0 rounded-[16px] h-full font-sans shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
              >
                {/* Header */}
                <div className="p-4 border-b border-[rgba(255,255,255,0.08)]">
                  {/* Badge */}
                  <span className="inline-flex items-center text-[9px] font-mono font-bold px-2 py-0.5 rounded-[6px] bg-[#2C2C2E] text-[#98989D] border border-[rgba(255,255,255,0.04)] mb-2 uppercase tracking-wider">
                    {selectedNode.level || 'Intermediate'}
                  </span>
                  
                  {/* Title */}
                  <h3 className="text-sm font-bold text-[#FFFFFF] leading-snug font-clash">
                    {t(selectedNode.label || selectedNode.title)}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-xs text-[#98989D] mt-2 leading-relaxed line-clamp-3">
                    {t(selectedNode.desc || selectedNode.description) || 'Нажми «Начать урок» чтобы сгенерировать материал'}
                  </p>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
                  {/* Meta stats */}
                  <div className="flex gap-2">
                    <div className="flex-1 bg-[#2C2C2E]/40 border border-[rgba(255,255,255,0.04)] rounded-[12px] p-2">
                      <p className="text-[10px] text-[#98989D] mb-0.5 font-sans">⏱ Время</p>
                      <p className="text-xs font-bold text-[#F5F5F7] font-mono">~{selectedNode.hours || selectedNode.estimatedTime || '2'} ч</p>
                    </div>
                    <div className="flex-1 bg-[#2C2C2E]/40 border border-[rgba(255,255,255,0.04)] rounded-[12px] p-2">
                      <p className="text-[10px] text-[#98989D] mb-0.5 font-sans">📄 Уроков</p>
                      <p className="text-xs font-bold text-[#F5F5F7] font-mono">{selectedNode.lessons || selectedNode.lessonsCount || '1'}</p>
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

                  {/* Dependencies Required */}
                  {selectedCourse && selectedCourse.edges.filter(e => String(e.to) === String(selectedNode.id)).length > 0 && (
                    <div>
                      <p className="text-[10px] text-[#98989D] mb-1.5 font-sans">Требует завершить</p>
                      {selectedCourse.edges.filter(e => String(e.to) === String(selectedNode.id)).map(e => {
                        const preId = e.from;
                        const preNode = selectedCourse.nodes.find(n => String(n.id) === String(preId));
                        const isDone = quizResults?.[preId]?.passed;
                        return (
                          <div key={preId} className={`flex items-center gap-2 p-2 rounded-[10px] border text-xs mb-1 font-sans ${
                            isDone
                              ? 'bg-[#2C2C2E]/50 border-[rgba(255,255,255,0.08)] text-[#FFFFFF]'
                              : 'bg-[#2C2C2E]/10 border-[rgba(255,255,255,0.02)] text-[#98989D]'
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
                      <p className="text-[10px] text-[#98989D] mb-1.5 font-sans">Открывает доступ к</p>
                      {selectedCourse.edges.filter(e => String(e.from) === String(selectedNode.id)).map(e => {
                        const nextId = e.to;
                        const nextNode = selectedCourse.nodes.find(n => String(n.id) === String(nextId));
                        return (
                          <div key={nextId} className="flex items-center gap-2 p-2 rounded-[10px] border border-[rgba(255,255,255,0.04)] bg-[#2C2C2E]/20 text-xs text-[#98989D] mb-1 font-sans">
                            <span className="text-[#FFFFFF]">→</span>
                            <span className="truncate">{t(nextNode?.label || nextNode?.title || nextId)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Start Button */}
                <div className="p-3 border-t border-[rgba(255,255,255,0.08)]">
                  <button
                    onClick={() => setIsStudying(true)}
                    disabled={selectedNode.status === 'locked'}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-[12px] text-xs font-bold transition-colors font-sans ${
                      selectedNode.status === 'locked'
                        ? 'bg-[#2C2C2E]/40 border border-[rgba(255,255,255,0.04)] text-[#98989D] cursor-not-allowed'
                        : selectedNode.status === 'completed'
                        ? 'border border-[#FFFFFF] text-[#FFFFFF] hover:bg-[#FFFFFF]/10'
                        : 'bg-[#FFFFFF] text-[#000000] hover:bg-[#E8E8ED]'
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
                className="bg-[#1C1C1E] border border-[rgba(255,255,255,0.08)] rounded-[16px] p-6 h-full flex flex-col items-center justify-center text-center text-[#98989D] font-sans shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
              >
                <div className="w-16 h-16 bg-[#2C2C2E]/40 border border-[rgba(255,255,255,0.08)] rounded-[12px] flex items-center justify-center mb-6">
                  <Pointer className="w-6 h-6 text-[#FFFFFF] opacity-40" strokeWidth={1.5} />
                </div>
                <p className="text-sm font-semibold">{t('graph.details.placeholder')}</p>
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
              className={`absolute right-0 z-50 bg-[#000000] border-l border-[rgba(255,255,255,0.08)] flex flex-col transition-all duration-500 ease-in-out ${isZenMode ? 'inset-0 w-full h-full' : 'inset-y-0 w-full lg:w-[65%] xl:w-[70%]'}`}
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
