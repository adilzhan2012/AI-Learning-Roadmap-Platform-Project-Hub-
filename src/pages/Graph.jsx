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
  Trophy,
  Users,
  HelpCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { getUserCourses, getCourseById, updateNodeStatus } from '../services/courseService.js';
import { t, useLocale } from '../i18n.js';

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

const getNodeColors = (status, level) => {
  if (status === 'completed') {
    return { bg: '#064e3b', border: '#10b981', text: '#ecfdf5', hoverBg: '#047857' };
  } else if (status === 'active') {
    return { bg: '#1e3a8a', border: '#3b82f6', text: '#eff6ff', hoverBg: '#1d4ed8' };
  } else {
    // Locked
    return { bg: '#18181b', border: '#3f3f46', text: '#71717a', hoverBg: '#18181b' };
  }
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

  // 2. Build or update Vis.js network when selectedCourse changes
  useEffect(() => {
    if (!containerRef.current || !window.vis || !selectedCourse) return;

    const visNodes = selectedCourse.nodes.map(c => {
      const colors = getNodeColors(c.status, c.level);
      return {
        id: c.id,
        label: t(c.label),
        shape: 'box',
        margin: 16,
        borderWidth: 2,
        shapeProperties: { borderRadius: 12 },
        color: {
          background: colors.bg,
          border: colors.border,
          hover: { background: colors.hoverBg, border: colors.border },
          highlight: { background: colors.hoverBg, border: '#ffffff' }
        },
        font: { color: colors.text, face: 'Inter', size: 14, bold: true },
        shadow: { enabled: true, color: 'rgba(0,0,0,0.5)', size: 10, x: 0, y: 5 }
      };
    });

    const visEdges = selectedCourse.edges.map(e => ({
      from: e.from,
      to: e.to,
      arrows: 'to',
      color: { color: '#3f3f46', highlight: '#93c5fd', hover: '#93c5fd' },
      width: 2,
      smooth: { type: 'cubicBezier', roundness: 0.4 }
    }));

    const data = {
      nodes: new window.vis.DataSet(visNodes),
      edges: new window.vis.DataSet(visEdges)
    };

    const options = {
      interaction: { hover: true, zoomView: true, dragView: true, dragNodes: true },
      physics: {
        enabled: true,
        solver: 'forceAtlas2Based',
        forceAtlas2Based: {
          gravitationalConstant: -50,
          centralGravity: 0.01,
          springConstant: 0.08,
          springLength: 100,
          damping: 0.4,
          avoidOverlap: 1
        },
        maxVelocity: 50,
        minVelocity: 0.1,
        stabilization: {
          enabled: true,
          iterations: 1000,
          updateInterval: 100,
          onlyDynamicEdges: false,
          fit: true
        }
      }
    };

    networkRef.current = new window.vis.Network(containerRef.current, data, options);

    networkRef.current.on('click', (params) => {
      if (params.nodes.length > 0) {
        const node = selectedCourse.nodes.find(c => c.id === params.nodes[0]);
        setSelectedNode(node);
      } else {
        setSelectedNode(null);
      }
    });

    // If a node was previously selected, refresh its reference from the new course object
    if (selectedNode) {
      const refreshedNode = selectedCourse.nodes.find(n => n.id === selectedNode.id);
      setSelectedNode(refreshedNode || null);
    }

    return () => {
      if (networkRef.current) networkRef.current.destroy();
    };
  }, [selectedCourse, locale]);

  const handleZoomIn = () => networkRef.current?.moveTo({ scale: networkRef.current.getScale() * 1.25 });
  const handleZoomOut = () => networkRef.current?.moveTo({ scale: networkRef.current.getScale() * 0.8 });
  const handleReset = () => networkRef.current?.fit({ animation: { duration: 500, easingFunction: 'easeInOutQuad' } });

  const getPrereqs = (id) => {
    if (!selectedCourse) return [];
    return selectedCourse.edges
      .filter(e => e.to === id)
      .map(e => t(selectedCourse.nodes.find(c => c.id === e.from)?.label))
      .filter(Boolean);
  };

  const getLeadsTo = (id) => {
    if (!selectedCourse) return [];
    return selectedCourse.edges
      .filter(e => e.from === id)
      .map(e => t(selectedCourse.nodes.find(c => c.id === e.to)?.label))
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
    } finally {
      setCompletingNode(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#000000] text-white gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-medium tracking-wide">Loading Knowledge Graph...</p>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="p-8 max-w-7xl mx-auto h-[calc(100vh-4rem)] flex flex-col justify-center items-center text-center">
        <Network className="w-16 h-16 text-on-surface-variant/30 mb-4 animate-pulse" />
        <h2 className="text-2xl font-bold text-on-surface mb-2">No roadmaps generated yet</h2>
        <p className="text-on-surface-variant max-w-md mb-6">Create a personalized learning roadmap on the Dashboard to explore the interactive prerequisite graph.</p>
        <button 
          onClick={() => navigate('/dashboard')}
          className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold shadow-md hover:bg-primary/95 transition-all"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  const NodeIcon = selectedNode && (iconMap[selectedNode.iconName] || Brain);

  return (
    <motion.div initial="hidden" animate="show" variants={containerVariants} className="p-4 md:p-8 max-w-7xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
      <motion.div variants={itemVariants} className="mb-6 flex-shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-on-surface mb-2 tracking-tight">Knowledge Graph</h1>
          <p className="text-lg text-on-surface-variant">Explore the interconnected AI curriculum roadmap. Interactive nodes simulate learning paths.</p>
        </div>
        <div>
          <select 
            value={selectedCourse?.id || ''} 
            onChange={handleCourseChange}
            className="w-full md:w-72 bg-surface border border-outline-variant rounded-xl px-4 py-3 text-sm font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary outline-none"
          >
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>
      </motion.div>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-6">
        <motion.div variants={itemVariants} className="flex-1 bg-surface border border-outline-variant rounded-2xl overflow-hidden relative shadow-lg flex flex-col group">
          {/* Legend */}
          <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-xl flex flex-col gap-3 pointer-events-auto">
            <div className="flex items-center gap-3"><span className="w-4 h-4 rounded-full bg-emerald-700 border border-emerald-500"></span><span className="text-sm font-medium text-white">Completed</span></div>
            <div className="flex items-center gap-3"><span className="w-4 h-4 rounded-full bg-blue-900 border border-blue-500"></span><span className="text-sm font-medium text-white">Available</span></div>
            <div className="flex items-center gap-3"><span className="w-4 h-4 rounded-full bg-zinc-900 border border-zinc-700"></span><span className="text-sm font-medium text-white">Locked</span></div>
          </div>

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
        <motion.div variants={itemVariants} className="w-full lg:w-96 flex-shrink-0">
          <AnimatePresence mode="wait">
            {selectedNode ? (
              <motion.div 
                key="course"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                transition={{ type: 'spring', damping: 20 }}
                className="bg-surface border border-outline-variant rounded-2xl p-6 shadow-lg h-full flex flex-col overflow-y-auto"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className={`p-4 rounded-2xl ${getLevelBadgeClass(selectedNode.level || 'Beginner')}`}>
                    {NodeIcon ? <NodeIcon className="w-8 h-8 text-primary" /> : <Brain className="w-8 h-8 text-primary" />}
                  </div>
                  <div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-md mb-2 inline-block ${getLevelBadgeClass(selectedNode.level || 'Beginner')}`}>
                      {selectedNode.level || 'Beginner'}
                    </span>
                    <h3 className="text-xl font-bold text-on-surface leading-snug">{t(selectedNode.label)}</h3>
                  </div>
                </div>

                <p className="text-on-surface-variant leading-relaxed mb-6">{t(selectedNode.desc)}</p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-surface-container rounded-xl p-3 border border-outline-variant/50">
                    <span className="text-xs text-on-surface-variant uppercase tracking-wider font-bold mb-1 block">Duration</span>
                    <span className="text-sm font-semibold text-on-surface flex items-center gap-1"><Clock className="w-4 h-4 text-primary" /> {selectedNode.hours || '1.5h'}</span>
                  </div>
                  <div className="bg-surface-container rounded-xl p-3 border border-outline-variant/50">
                    <span className="text-xs text-on-surface-variant uppercase tracking-wider font-bold mb-1 block">Lessons</span>
                    <span className="text-sm font-semibold text-on-surface flex items-center gap-1"><BookOpen className="w-4 h-4 text-primary" /> {selectedNode.lessons || 3}</span>
                  </div>
                </div>

                {getPrereqs(selectedNode.id).length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 flex items-center gap-2"><ChevronRight className="w-4 h-4 text-primary" /> Prerequisites</h4>
                    <div className="flex flex-col gap-2">
                      {getPrereqs(selectedNode.id).map(p => <div key={p} className="text-sm font-medium text-on-surface bg-surface-container py-2 px-3 rounded-lg border border-outline-variant/50">{p}</div>)}
                    </div>
                  </div>
                )}

                {getLeadsTo(selectedNode.id).length > 0 && (
                  <div className="mb-8">
                    <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 flex items-center gap-2"><ChevronRight className="w-4 h-4 text-emerald-500" /> Leads To</h4>
                    <div className="flex flex-col gap-2">
                      {getLeadsTo(selectedNode.id).map(l => <div key={l} className="text-sm font-medium text-on-surface bg-surface-container py-2 px-3 rounded-lg border border-outline-variant/50">{l}</div>)}
                    </div>
                  </div>
                )}

                <div className="mt-auto pt-4 border-t border-outline-variant/50">
                  {selectedNode.status === 'completed' ? (
                    <div className="w-full py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 font-bold flex items-center justify-center gap-2">
                      <CheckCircle className="w-5 h-5" /> Completed
                    </div>
                  ) : selectedNode.status === 'active' ? (
                    <motion.button 
                      whileHover={{ scale: 1.02 }} 
                      whileTap={{ scale: 0.98 }}
                      onClick={handleMarkCompleted}
                      disabled={completingNode}
                      className="w-full py-3 rounded-xl bg-primary text-on-primary font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                    >
                      {completingNode ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Mark as Completed'}
                    </motion.button>
                  ) : (
                    <div className="w-full py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-500 font-bold flex items-center justify-center gap-2 cursor-not-allowed">
                      <Lock className="w-4 h-4" /> Locked
                    </div>
                  )}
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
                <p className="text-lg font-medium">Click on any node in the graph to explore its details and prerequisites.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
}
