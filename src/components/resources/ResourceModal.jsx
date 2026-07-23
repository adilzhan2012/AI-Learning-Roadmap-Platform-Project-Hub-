import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Code2, Sparkles, Network } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { callGroqWithRetry } from '../../services/courseService.js';
import { useNavigate } from 'react-router-dom';
import { useXP } from '../../hooks/useXP.js';

export default function ResourceModal({ resource, onClose }) {
  const navigate = useNavigate();
  const { addXP } = useXP();
  
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Project specific states
  const [code, setCode] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState('');

  useEffect(() => {
    if (!resource) return;
    generateContent();
  }, [resource]);

  const generateContent = async () => {
    setLoading(true);
    setError('');
    setContent('');
    setReviewResult('');
    
    try {
      let prompt = '';
      if (resource.type === 'project') {
        prompt = `You are a strict programming mentor. Generate a single realistic, practical coding task or mini-project based on the topic: "${resource.title}" (${resource.desc}).
CRITICAL INSTRUCTION: Generate the response entirely in Russian. Provide a clear task description and a small starter code template snippet at the very end. Format using Markdown.`;
      } else if (resource.type === 'cheatsheet') {
        prompt = `Create a dense, high-quality technical cheatsheet for the topic: "${resource.title}" (${resource.desc}).
CRITICAL INSTRUCTION: Generate the response entirely in Russian. Include code snippets, key concepts, formulas, or command lines. Format beautifully using Markdown.`;
      } else {
        prompt = `Write a comprehensive, engaging article about the topic: "${resource.title}" (${resource.desc}).
CRITICAL INSTRUCTION: Generate the response entirely in Russian. Use Markdown formatting, headings, and clear explanations. Include examples where appropriate.`;
      }

      const generated = await callGroqWithRetry(null, prompt, 'ai_question');
      setContent(generated);
    } catch (e) {
      console.error(e);
      setError('Не удалось сгенерировать контент. Пожалуйста, попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  const handleRunCodeReview = async () => {
    if (!code.trim() || reviewing) return;
    setReviewing(true);
    setReviewResult('');
    try {
      const prompt = `You are an expert software developer and security auditor.
Analyze the following code submitted by a student for the task: "${resource.title}".
Student Code:
\`\`\`
${code}
\`\`\`
INSTRUCTIONS:
Provide a highly thorough, detailed code review in the Russian language. Include sections for Correctness, Code Style, Security, and Final Verdict (Passed / Failed). Format using Markdown.`;
      const result = await callGroqWithRetry(null, prompt, 'ai_question');
      setReviewResult(result);
      addXP(50, 'AI Проверка проекта пройдена');
    } catch (e) {
      console.error(e);
      setReviewResult('❌ Не удалось сгенерировать рецензию ИИ.');
    } finally {
      setReviewing(false);
    }
  };

  const handleGoToGraph = () => {
    localStorage.setItem('selected_course_id', resource.courseId);
    localStorage.setItem('selected_node_id', resource.nodeId);
    onClose();
    navigate('/graph');
  };

  if (!resource) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
<<<<<<< HEAD
        className="relative bg-[#1C1C1E] border border-[rgba(255,255,255,0.08)] w-full max-w-4xl max-h-[90vh] rounded-[24px] shadow-2xl flex flex-col overflow-y-auto"
=======
        className="relative bg-surface border border-outline w-full max-w-4xl max-h-[90vh] rounded-[24px] shadow-2xl flex flex-col overflow-hidden"
>>>>>>> 1a9ad0df5c5074cda19a0eb897e16e4af9f6052c
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-outline bg-surface shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-on-surface-variant border border-[rgba(255,255,255,0.1)] px-2 py-0.5 rounded">
                {resource.type === 'project' ? 'ПРОЕКТ' : resource.type === 'cheatsheet' ? 'ШПАРГАЛКА' : 'СТАТЬЯ'}
              </span>
              <span className="text-[10px] font-mono text-on-surface-variant">{resource.tags?.[0]}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold font-clash text-white">{resource.title}</h2>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handleGoToGraph}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] rounded-[10px] text-xs font-bold text-white transition-colors border border-[rgba(255,255,255,0.05)]"
            >
              <Network className="w-4 h-4" />
              В Граф знаний
            </button>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-[rgba(255,255,255,0.05)] rounded-full text-on-surface-variant transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 bg-[#09090B]">
          {loading ? (
             <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
                <Loader2 className="w-10 h-10 animate-spin text-white mb-4" />
                <p className="text-sm font-mono text-on-surface-variant">ИИ-ментор генерирует материал...</p>
             </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
              <p className="text-red-400 mb-4">{error}</p>
              <button 
                onClick={generateContent}
                className="px-6 py-2 bg-white text-black rounded-[10px] text-sm font-bold hover:bg-gray-200 transition-colors"
              >
                Попробовать снова
              </button>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-8 h-full">
              {/* Markdown Content */}
              <div className={`prose prose-invert prose-p:text-[#D1D1D6] prose-headings:text-white max-w-none ${resource.type === 'project' ? 'lg:w-1/2' : 'w-full mx-auto max-w-3xl'}`}>
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>

              {/* Project Code Editor Pane */}
              {resource.type === 'project' && (
                <div className="lg:w-1/2 flex flex-col gap-4 border-t lg:border-t-0 lg:border-l border-outline pt-6 lg:pt-0 lg:pl-8">
                  <div className="flex items-center gap-2 mb-2">
                    <Code2 className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-sm font-bold text-white">Зона решения</h3>
                  </div>
                  
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="// Напишите ваш код здесь..."
                    className="flex-1 w-full min-h-[250px] bg-surface border border-outline rounded-[12px] p-4 text-xs font-mono text-emerald-400 focus:outline-none focus:border-indigo-500 transition-colors custom-scrollbar"
                    style={{ tabSize: 2 }}
                  />

                  <button
                    onClick={handleRunCodeReview}
                    disabled={reviewing || !code.trim()}
                    className="w-full px-5 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    {reviewing ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Проверка ИИ...</>
                    ) : (
                      <><Sparkles className="w-4 h-4" /> Отправить на AI Code Review</>
                    )}
                  </button>

                  {reviewResult && (
                    <div className="mt-4 p-5 bg-indigo-950/20 border border-indigo-500/20 rounded-xl">
                       <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-wider mb-3">Результат проверки</h4>
                       <div className="prose prose-invert prose-xs max-w-none prose-p:text-zinc-300">
                         <ReactMarkdown>{reviewResult}</ReactMarkdown>
                       </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Mobile action bar */}
        <div className="md:hidden p-4 border-t border-outline bg-surface">
          <button 
            onClick={handleGoToGraph}
            className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] rounded-[12px] text-sm font-bold text-white transition-colors border border-[rgba(255,255,255,0.05)]"
          >
            <Network className="w-5 h-5" />
            В Граф знаний
          </button>
        </div>
      </motion.div>
    </div>
  );
}
