import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { getUserCourses, getCourseById, generateLessonContent } from '../services/courseService.js';
import ReactMarkdown from 'react-markdown';
import { BookOpen, CheckCircle, ChevronRight, Loader2, PlayCircle, Sparkles, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { t, useLocale } from '../i18n.js';

export default function Lessons() {
  const navigate = useNavigate();
  const locale = useLocale();
  const [user, setUser] = useState(auth.currentUser);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');

  // 1. Authenticate and fetch courses
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userCourses = await getUserCourses(currentUser.uid);
          setCourses(userCourses);
          
          if (userCourses.length > 0) {
            const savedId = localStorage.getItem('selected_course_id');
            const match = userCourses.find(c => c.id === savedId);
            if (match) {
              setSelectedCourse(match);
              if (match.nodes && match.nodes.length > 0) {
                // Pre-select the first active or completed node
                const activeNode = match.nodes.find(n => n.status === 'active' || n.status === 'completed') || match.nodes[0];
                setSelectedNode(activeNode);
              }
            } else {
              setSelectedCourse(userCourses[0]);
              setSelectedNode(userCourses[0].nodes?.[0]);
            }
          }
        } catch (e) {
          console.error("Error loading courses:", e);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleCourseChange = async (e) => {
    const courseId = e.target.value;
    const targetCourse = courses.find(c => c.id === courseId);
    if (targetCourse) {
      setSelectedCourse(targetCourse);
      const activeNode = targetCourse.nodes.find(n => n.status === 'active' || n.status === 'completed') || targetCourse.nodes[0];
      setSelectedNode(activeNode);
      localStorage.setItem('selected_course_id', targetCourse.id);
    }
  };

  const handleNodeSelect = (node) => {
    if (node.status === 'locked') return; // Cannot access locked lessons
    setSelectedNode(node);
    setGenError('');
  };

  const handleGenerateContent = async () => {
    if (!selectedCourse || !selectedNode) return;
    setGenerating(true);
    setGenError('');
    try {
      const markdown = await generateLessonContent(
        selectedCourse.id, 
        selectedNode.id, 
        selectedCourse.title, 
        selectedNode.label, 
        selectedNode.desc
      );
      
      // Update local state
      const updatedNode = { ...selectedNode, content: markdown };
      setSelectedNode(updatedNode);
      
      const updatedNodes = selectedCourse.nodes.map(n => n.id === selectedNode.id ? updatedNode : n);
      const updatedCourse = { ...selectedCourse, nodes: updatedNodes };
      setSelectedCourse(updatedCourse);
      setCourses(courses.map(c => c.id === updatedCourse.id ? updatedCourse : c));
      
    } catch (err) {
      console.error(err);
      if (err.message === 'MISSING_API_KEY') {
        setGenError('Gemini API Key is missing. Please set it in Settings.');
      } else {
        setGenError('Failed to generate lesson content. Please try again.');
      }
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#000000] text-white gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-medium tracking-wide">Loading Lessons...</p>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="p-8 max-w-7xl mx-auto h-[calc(100vh-4rem)] flex flex-col justify-center items-center text-center">
        <BookOpen className="w-16 h-16 text-on-surface-variant/30 mb-4 animate-pulse" />
        <h2 className="text-2xl font-bold text-on-surface mb-2">No active lessons</h2>
        <p className="text-on-surface-variant max-w-md mb-6">Create a personalized learning roadmap on the Dashboard to start taking lessons.</p>
        <button 
          onClick={() => navigate('/dashboard')}
          className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold shadow-md hover:bg-primary/95 transition-all"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto h-[calc(100vh-4rem)] flex flex-col">
      <div className="mb-6 flex-shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-on-surface mb-2 tracking-tight">Interactive Lessons</h1>
          <p className="text-lg text-on-surface-variant">Deep dive into your curriculum topics with AI-powered tutoring.</p>
        </div>
        <div>
          <select 
            value={selectedCourse?.id || ''} 
            onChange={handleCourseChange}
            className="w-full md:w-72 bg-surface border border-outline-variant rounded-xl px-4 py-3 text-sm font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary outline-none"
          >
            {courses.map(c => (
              <option key={c.id} value={c.id}>{t(c.title)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-6">
        
        {/* Left Sidebar - Lesson Navigation */}
        <div className="w-full lg:w-80 flex-shrink-0 flex flex-col bg-surface border border-outline-variant rounded-2xl shadow-lg overflow-hidden">
          <div className="p-4 border-b border-outline-variant bg-surface-container-lowest">
            <h3 className="font-bold text-on-surface flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Course Syllabus
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {selectedCourse?.nodes.map((node, index) => {
              const isSelected = selectedNode?.id === node.id;
              const isLocked = node.status === 'locked';
              const isCompleted = node.status === 'completed';
              
              return (
                <button
                  key={node.id}
                  onClick={() => handleNodeSelect(node)}
                  disabled={isLocked}
                  className={`w-full text-left px-4 py-3 rounded-xl flex items-start gap-3 transition-all duration-200 ${
                    isSelected 
                      ? 'bg-primary/10 border-primary border' 
                      : isLocked 
                        ? 'opacity-50 cursor-not-allowed hover:bg-transparent border border-transparent' 
                        : 'hover:bg-surface-container border border-transparent cursor-pointer'
                  }`}
                >
                  <div className="mt-0.5">
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    ) : isLocked ? (
                      <div className="w-5 h-5 rounded-full border-2 border-on-surface-variant flex items-center justify-center">
                        <span className="w-2 h-2 bg-on-surface-variant rounded-full"></span>
                      </div>
                    ) : (
                      <PlayCircle className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-blue-500'}`} />
                    )}
                  </div>
                  <div className="flex-1">
                      <div className={`font-semibold text-sm leading-tight ${isSelected ? 'text-primary' : 'text-on-surface'}`}>
                        {index + 1}. {t(node.label)}
                      </div>
                    <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">{t(node.desc)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-surface border border-outline-variant rounded-2xl shadow-lg overflow-hidden flex flex-col relative">
          {selectedNode ? (
            <div className="flex-1 overflow-y-auto relative">
              {selectedNode.content ? (
                <div className="p-8 max-w-4xl mx-auto prose prose-invert prose-primary lg:prose-lg font-sans">
                  <ReactMarkdown>{selectedNode.content}</ReactMarkdown>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center p-8 text-center bg-surface-container-lowest">
                  <div className="max-w-md w-full bg-surface border border-outline-variant p-8 rounded-3xl shadow-2xl flex flex-col items-center">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 border border-primary/20">
                      <Sparkles className="w-10 h-10 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-on-surface mb-3">{t(selectedNode.label)}</h2>
                    <p className="text-on-surface-variant mb-8 text-sm leading-relaxed">
                      {t(selectedNode.desc)}
                      <br/><br/>
                      Click below to instantly generate a comprehensive, highly detailed lesson for this topic using the Gemini AI tutor.
                    </p>
                    
                    {genError && (
                      <div className="w-full bg-error-container text-on-error-container p-3 rounded-lg mb-6 flex items-center gap-2 text-sm text-left">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span>{genError}</span>
                      </div>
                    )}

                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleGenerateContent}
                      disabled={generating}
                      className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-primary/25 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {generating ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin" />
                          Crafting Lesson...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-6 h-6" />
                          Generate Lesson Content
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-on-surface-variant">
              Select a lesson from the syllabus to begin learning.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
