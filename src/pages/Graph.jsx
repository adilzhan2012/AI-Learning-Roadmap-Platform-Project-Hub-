import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, ZoomIn, ZoomOut, RotateCcw, Brain, Activity, Pointer, ChevronRight, BookOpen, Clock } from 'lucide-react';

const graphCourses = [
  { id: 1, title: 'Introduction to AI', level: 'Beginner', hours: '8h', lessons: 24, icon: <Brain />, category: 'AI Fundamentals', desc: 'Learn the foundational concepts of artificial intelligence, history, and basic terminology.' },
  { id: 2, title: 'Machine Learning Fundamentals', level: 'Beginner', hours: '12h', lessons: 36, icon: <Activity />, category: 'Machine Learning', desc: 'Dive into supervised and unsupervised learning, regressions, classification models, and algorithms.' },
  { id: 3, title: 'Neural Networks Deep Dive', level: 'Intermediate', hours: '15h', lessons: 42, icon: <Network />, category: 'Deep Learning', desc: 'Understand artificial neural networks, backpropagation, and training deep learning models.' },
  { id: 4, title: 'NLP with Transformers', level: 'Intermediate', hours: '10h', lessons: 28, icon: <BookOpen />, category: 'NLP', desc: 'Explore natural language processing techniques, tokenization, and state-of-the-art Transformer architectures.' },
  { id: 5, title: 'Computer Vision Fundamentals', level: 'Intermediate', hours: '14h', lessons: 38, icon: <EyeIcon />, category: 'Computer Vision', desc: 'Learn to process images, apply convolutions, and build models for object detection and classification.' },
  { id: 6, title: 'Reinforcement Learning', level: 'Advanced', hours: '18h', lessons: 48, icon: <Activity />, category: 'Machine Learning', desc: 'Master Markov decision processes, Q-learning, policy gradients, and decision making under uncertainty.' },
  { id: 7, title: 'GANs & Generative AI', level: 'Advanced', hours: '16h', lessons: 44, icon: <SparklesIcon />, category: 'Deep Learning', desc: 'Learn about Generative Adversarial Networks, image generation, autoencoders, and diffusion models.' },
  { id: 8, title: 'AI Ethics & Governance', level: 'Beginner', hours: '6h', lessons: 18, icon: <ScaleIcon />, category: 'AI Fundamentals', desc: 'Analyze bias in AI, ethical frameworks, privacy, regulations, and responsible deployment models.' },
  { id: 9, title: 'MLOps & Deployment', level: 'Advanced', hours: '20h', lessons: 52, icon: <CloudIcon />, category: 'Machine Learning', desc: 'Bridge the gap between model development and deployment. Setup pipelines, monitoring, and scaling.' }
];

const prerequisiteEdges = [
  { from: 1, to: 2 }, { from: 1, to: 8 }, { from: 2, to: 3 }, { from: 2, to: 6 },
  { from: 2, to: 9 }, { from: 3, to: 4 }, { from: 3, to: 5 }, { from: 3, to: 7 }, { from: 4, to: 7 }
];

function EyeIcon() { return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>; }
function SparklesIcon() { return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>; }
function ScaleIcon() { return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>; }
function CloudIcon() { return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>; }

const getNodeColors = (level) => {
  const isDark = document.documentElement.classList.contains('dark') || true; // Force dark for now to match premium look
  switch (level) {
    case 'Beginner': return { bg: '#064e3b', border: '#10b981', text: '#ecfdf5', hoverBg: '#047857' };
    case 'Intermediate': return { bg: '#1e3a8a', border: '#3b82f6', text: '#eff6ff', hoverBg: '#1d4ed8' };
    case 'Advanced': return { bg: '#4c1d95', border: '#8b5cf6', text: '#f5f3ff', hoverBg: '#5b21b6' };
    default: return { bg: '#1f2937', border: '#6b7280', text: '#f3f4f6', hoverBg: '#374151' };
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
  const containerRef = useRef(null);
  const networkRef = useRef(null);
  const [selectedCourse, setSelectedCourse] = useState(null);

  useEffect(() => {
    if (!containerRef.current || !window.vis) return;

    const visNodes = graphCourses.map(c => {
      const colors = getNodeColors(c.level);
      return {
        id: c.id,
        label: c.title,
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

    const visEdges = prerequisiteEdges.map(e => ({
      from: e.from,
      to: e.to,
      arrows: 'to',
      color: { color: '#4b5563', highlight: '#93c5fd', hover: '#93c5fd' },
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
        solver: 'barnesHut',
        barnesHut: { gravitationalConstant: -2000, centralGravity: 0.3, springLength: 150, springConstant: 0.04, damping: 0.09, avoidOverlap: 1 }
      }
    };

    networkRef.current = new window.vis.Network(containerRef.current, data, options);

    networkRef.current.on('click', (params) => {
      if (params.nodes.length > 0) {
        const course = graphCourses.find(c => c.id === params.nodes[0]);
        setSelectedCourse(course);
      } else {
        setSelectedCourse(null);
      }
    });

    return () => {
      if (networkRef.current) networkRef.current.destroy();
    };
  }, []);

  const handleZoomIn = () => networkRef.current?.moveTo({ scale: networkRef.current.getScale() * 1.25 });
  const handleZoomOut = () => networkRef.current?.moveTo({ scale: networkRef.current.getScale() * 0.8 });
  const handleReset = () => networkRef.current?.fit({ animation: { duration: 500, easingFunction: 'easeInOutQuad' } });

  const getPrereqs = (id) => prerequisiteEdges.filter(e => e.to === id).map(e => graphCourses.find(c => c.id === e.from).title);
  const getLeadsTo = (id) => prerequisiteEdges.filter(e => e.from === id).map(e => graphCourses.find(c => c.id === e.to).title);

  return (
    <motion.div initial="hidden" animate="show" variants={containerVariants} className="p-4 md:p-8 max-w-7xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
      <motion.div variants={itemVariants} className="mb-6 flex-shrink-0">
        <h1 className="text-4xl font-bold text-on-surface mb-2 tracking-tight">Knowledge Graph</h1>
        <p className="text-lg text-on-surface-variant">Explore the interconnected AI curriculum roadmap. Interactive nodes simulate learning paths.</p>
      </motion.div>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-6">
        <motion.div variants={itemVariants} className="flex-1 bg-surface border border-outline-variant rounded-2xl overflow-hidden relative shadow-lg flex flex-col group">
          {/* Legend */}
          <div className="absolute top-4 left-4 z-10 bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-xl flex flex-col gap-3 pointer-events-auto">
            <div className="flex items-center gap-3"><span className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-emerald-400"></span><span className="text-sm font-medium text-white">Beginner</span></div>
            <div className="flex items-center gap-3"><span className="w-4 h-4 rounded-full bg-blue-500 border-2 border-blue-400"></span><span className="text-sm font-medium text-white">Intermediate</span></div>
            <div className="flex items-center gap-3"><span className="w-4 h-4 rounded-full bg-purple-500 border-2 border-purple-400"></span><span className="text-sm font-medium text-white">Advanced</span></div>
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
            {selectedCourse ? (
              <motion.div 
                key="course"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                transition={{ type: 'spring', damping: 20 }}
                className="bg-surface border border-outline-variant rounded-2xl p-6 shadow-lg h-full flex flex-col overflow-y-auto"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className={`p-4 rounded-2xl ${getLevelBadgeClass(selectedCourse.level)}`}>
                    {React.cloneElement(selectedCourse.icon, { className: 'w-8 h-8' })}
                  </div>
                  <div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-md mb-2 inline-block ${getLevelBadgeClass(selectedCourse.level)}`}>{selectedCourse.level}</span>
                    <h3 className="text-xl font-bold text-on-surface leading-snug">{selectedCourse.title}</h3>
                  </div>
                </div>

                <p className="text-on-surface-variant leading-relaxed mb-6">{selectedCourse.desc}</p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-surface-container rounded-xl p-3 border border-outline-variant/50">
                    <span className="text-xs text-on-surface-variant uppercase tracking-wider font-bold mb-1 block">Duration</span>
                    <span className="text-sm font-semibold text-on-surface flex items-center gap-1"><Clock className="w-4 h-4 text-primary" /> {selectedCourse.hours}</span>
                  </div>
                  <div className="bg-surface-container rounded-xl p-3 border border-outline-variant/50">
                    <span className="text-xs text-on-surface-variant uppercase tracking-wider font-bold mb-1 block">Lessons</span>
                    <span className="text-sm font-semibold text-on-surface flex items-center gap-1"><BookOpen className="w-4 h-4 text-primary" /> {selectedCourse.lessons}</span>
                  </div>
                </div>

                {getPrereqs(selectedCourse.id).length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 flex items-center gap-2"><ChevronRight className="w-4 h-4 text-primary" /> Prerequisites</h4>
                    <div className="flex flex-col gap-2">
                      {getPrereqs(selectedCourse.id).map(p => <div key={p} className="text-sm font-medium text-on-surface bg-surface-container py-2 px-3 rounded-lg border border-outline-variant/50">{p}</div>)}
                    </div>
                  </div>
                )}

                {getLeadsTo(selectedCourse.id).length > 0 && (
                  <div className="mb-8">
                    <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 flex items-center gap-2"><ChevronRight className="w-4 h-4 text-emerald-500" /> Leads To</h4>
                    <div className="flex flex-col gap-2">
                      {getLeadsTo(selectedCourse.id).map(l => <div key={l} className="text-sm font-medium text-on-surface bg-surface-container py-2 px-3 rounded-lg border border-outline-variant/50">{l}</div>)}
                    </div>
                  </div>
                )}

                <div className="mt-auto pt-4 border-t border-outline-variant/50">
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full py-3 rounded-xl bg-primary text-on-primary font-bold shadow-lg shadow-primary/20">
                    Go to Course Catalog
                  </motion.button>
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
