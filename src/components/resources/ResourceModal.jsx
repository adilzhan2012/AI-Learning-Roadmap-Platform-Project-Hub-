import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Loader2, 
  Code2, 
  Sparkles, 
  Network, 
  ThumbsUp, 
  ThumbsDown, 
  RefreshCw, 
  Lock, 
  CheckCircle2, 
  AlertTriangle,
  ShieldCheck,
  FileCode,
  Send,
  MessageSquare
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import { useXP } from '../../hooks/useXP.js';
import { usePlanLimits } from '../../hooks/usePlanLimits.js';
import { auth } from '../../firebase.js';
import { 
  fetchResourceContext, 
  generatePersonalizedResourceContent, 
  runRigorousCodeReview, 
  saveResourceRating, 
  getResourceRatings,
  canRegenerateResource 
} from '../../services/resourceService.js';

export default function ResourceModal({ resource, onClose, userProfile = {} }) {
  const navigate = useNavigate();
  const { addXP } = useXP();
  const { plan, setUpgradeModalOpen } = usePlanLimits();
  
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [generationStep, setGenerationStep] = useState(1);
  const [error, setError] = useState('');
  
  // Project & Code Review states
  const [code, setCode] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState(null);
  
  // ULTRA follow-up dialog state
  const [ultraDialog, setUltraDialog] = useState([]);
  const [ultraInput, setUltraInput] = useState('');
  const [ultraAsking, setUltraAsking] = useState(false);

  // Ratings state
  const [userRating, setUserRating] = useState(null); // 'like' | 'dislike'
  const [ratingsInfo, setRatingsInfo] = useState({ total: 0, utilityPercentage: null });
  const [dailyRegenCount, setDailyRegenCount] = useState(0);

  useEffect(() => {
    if (!resource) return;
    loadResourceAndContent();
    loadRatings();
  }, [resource]);

  const loadRatings = async () => {
    if (!resource) return;
    const resId = resource.id || `${resource.courseId}_${resource.nodeId}`;
    const info = await getResourceRatings(resId);
    setRatingsInfo(info);
  };

  const loadResourceAndContent = async () => {
    setLoading(true);
    setError('');
    setContent('');
    setReviewResult(null);
    setUltraDialog([]);
    setGenerationStep(1);

    try {
      const userId = auth.currentUser?.uid;
      
      // Step 1: Analyzing lesson
      setGenerationStep(1);
      const ctx = await fetchResourceContext(userId, resource.courseId, resource.nodeId, plan);

      // Step 2: Checking quiz progress (Skip visually for FREE)
      if (plan !== 'FREE') {
        setGenerationStep(2);
        await new Promise(r => setTimeout(r, 400));
      }

      // Step 3: Generating material
      setGenerationStep(3);
      const generated = await generatePersonalizedResourceContent({
        resource,
        lessonContent: ctx.lessonContent,
        quizContext: ctx.quizContext,
        userPlan: plan,
        userProfile
      });

      setContent(generated);
    } catch (e) {
      console.error("Resource generation error:", e);
      setError('Не удалось сгенерировать контент. Пожалуйста, попробуйте ещё раз.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    const check = canRegenerateResource(plan, dailyRegenCount);
    if (!check.allowed) {
      setUpgradeModalOpen(true);
      return;
    }
    setDailyRegenCount(prev => prev + 1);
    await loadResourceAndContent();
  };

  const handleRating = async (type) => {
    if (!auth.currentUser || !resource) return;
    const resId = resource.id || `${resource.courseId}_${resource.nodeId}`;
    setUserRating(type);
    await saveResourceRating(auth.currentUser.uid, resId, type);
    await loadRatings();
  };

  const handleRunCodeReview = async () => {
    if (!code.trim() || reviewing) return;

    if (plan === 'FREE') {
      setUpgradeModalOpen(true);
      return;
    }

    setReviewing(true);
    setReviewResult(null);

    try {
      const result = await runRigorousCodeReview(
        resource.title,
        code,
        content,
        plan,
        ultraDialog
      );
      setReviewResult(result);

      if (result?.passed) {
        await addXP(50, 'AI Проверка проекта пройдена', 'project_verified', { nodeId: resource.id || 'project_node' });
      }
    } catch (e) {
      console.error(e);
      setReviewResult({
        scores: { correctness: 0, codeStyle: 0, edgeCases: 0, security: 0 },
        overallScore: 0,
        passed: false,
        verdict: 'Ошибка проверки',
        criteriaFeedback: { correctness: 'Не удалось сгенерировать рецензию ИИ.' },
        improvements: ['Попробуйте еще раз']
      });
    } finally {
      setReviewing(false);
    }
  };

  const handleSendUltraQuestion = async () => {
    if (!ultraInput.trim() || ultraAsking || ultraDialog.length >= 3) return;
    const qText = ultraInput;
    setUltraInput('');
    setUltraAsking(true);

    try {
      const updatedHistory = [...ultraDialog, { question: qText, answer: 'Анализируем код...' }];
      setUltraDialog(updatedHistory);

      const reviewRes = await runRigorousCodeReview(
        resource.title,
        code,
        content,
        plan,
        updatedHistory
      );
      setReviewResult(reviewRes);

      const latestComment = reviewRes?.criteriaFeedback?.correctness || reviewRes?.verdict || 'Ответ предоставлен';
      setUltraDialog(prev => {
        const copy = [...prev];
        copy[copy.length - 1].answer = latestComment;
        return copy;
      });
    } catch (err) {
      console.warn("Ultra dialog error:", err);
    } finally {
      setUltraAsking(false);
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
        className="relative bg-surface border border-outline w-full max-w-5xl max-h-[92vh] rounded-[24px] shadow-2xl flex flex-col overflow-hidden z-10"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between p-6 border-b border-outline bg-surface shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-on-surface-variant border border-[rgba(255,255,255,0.1)] px-2 py-0.5 rounded">
                {resource.type === 'project' ? 'ПРОЕКТ-ПРАКТИКУМ' : resource.type === 'cheatsheet' ? 'ШПАРГАЛКА' : 'ИНТЕРАКТИВНАЯ СТАТЬЯ'}
              </span>
              <span className="text-[10px] font-mono text-on-surface-variant">{resource.tags?.[0]}</span>
              
              {/* Utility Rating Badge if total >= 5 */}
              {ratingsInfo.utilityPercentage !== null && (
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">
                  {ratingsInfo.utilityPercentage}% полезности
                </span>
              )}
            </div>
            <h2 className="text-xl md:text-2xl font-bold font-clash text-white">{resource.title}</h2>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Regenerate Button */}
            <button 
              onClick={handleRegenerate}
              disabled={loading}
              className="p-2 hover:bg-[rgba(255,255,255,0.05)] rounded-xl text-on-surface-variant hover:text-white transition-colors border border-outline"
              title="Перегенерировать ресурс"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

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
             <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-400 mb-6" />
                
                {/* Stepper Progress */}
                <div className="w-full space-y-3 font-mono text-xs text-left">
                  <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${generationStep >= 1 ? 'bg-indigo-950/40 border-indigo-500/30 text-white' : 'border-outline text-on-surface-variant'}`}>
                    <div className={`w-2 h-2 rounded-full ${generationStep >= 1 ? 'bg-indigo-400 animate-ping' : 'bg-gray-600'}`} />
                    <span>1. Анализируем пройденный урок...</span>
                  </div>

                  {plan !== 'FREE' && (
                    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${generationStep >= 2 ? 'bg-indigo-950/40 border-indigo-500/30 text-white' : 'border-outline text-on-surface-variant'}`}>
                      <div className={`w-2 h-2 rounded-full ${generationStep >= 2 ? 'bg-indigo-400 animate-ping' : 'bg-gray-600'}`} />
                      <span>2. Учитываем прогресс и ошибки квизов...</span>
                    </div>
                  )}

                  <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${generationStep >= 3 ? 'bg-indigo-950/40 border-indigo-500/30 text-white' : 'border-outline text-on-surface-variant'}`}>
                    <div className={`w-2 h-2 rounded-full ${generationStep >= 3 ? 'bg-indigo-400 animate-ping' : 'bg-gray-600'}`} />
                    <span>3. ИИ-ментор формирует персонализированный материал...</span>
                  </div>
                </div>
             </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-red-400 mb-4">{error}</p>
              <button 
                onClick={loadResourceAndContent}
                className="px-6 py-2.5 bg-white text-black rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors"
              >
                Попробовать снова
              </button>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-8 h-full">
              {/* Markdown Content */}
              <div className={`prose prose-invert prose-p:text-[#D1D1D6] prose-headings:text-white max-w-none ${resource.type === 'project' ? 'lg:w-1/2' : 'w-full mx-auto max-w-3xl'}`}>
                <ReactMarkdown>{content}</ReactMarkdown>
                
                {/* Rating Bar */}
                <div className="mt-8 pt-6 border-t border-outline flex items-center justify-between text-xs text-on-surface-variant">
                  <span>Был ли этот материал полезен?</span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleRating('like')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-colors ${
                        userRating === 'like' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'border-outline hover:bg-surface-container'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" /> Да
                    </button>
                    <button 
                      onClick={() => handleRating('dislike')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-colors ${
                        userRating === 'dislike' ? 'bg-red-500/20 border-red-500 text-red-400' : 'border-outline hover:bg-surface-container'
                      }`}
                    >
                      <ThumbsDown className="w-3.5 h-3.5" /> Нет
                    </button>
                  </div>
                </div>
              </div>

              {/* Project Code Editor & Review Pane */}
              {resource.type === 'project' && (
                <div className="lg:w-1/2 flex flex-col gap-4 border-t lg:border-t-0 lg:border-l border-outline pt-6 lg:pt-0 lg:pl-8">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Code2 className="w-5 h-5 text-indigo-400" />
                      <h3 className="text-sm font-bold text-white">Решение проекта</h3>
                    </div>
                    {plan === 'FREE' && (
                      <span className="text-[9px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded font-bold">
                        PRO-ФУНКЦИЯ
                      </span>
                    )}
                  </div>
                  
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="// Напишите ваш код решения здесь..."
                    className="flex-1 w-full min-h-[220px] bg-surface border border-outline rounded-[12px] p-4 text-xs font-mono text-emerald-400 focus:outline-none focus:border-indigo-500 transition-colors custom-scrollbar"
                    style={{ tabSize: 2 }}
                  />

                  {/* FREE Plan Upgrade Banner instead of review button */}
                  {plan === 'FREE' ? (
                    <div className="p-5 rounded-2xl bg-surface border border-outline space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                          <Lock className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white">Автоматический AI Code Review</h4>
                          <p className="text-[11px] text-on-surface-variant">Проверка корректности, стиля, уязвимостей и крайних случаев с рекомендациями.</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setUpgradeModalOpen(true)}
                        className="w-full py-2.5 rounded-xl font-bold bg-on-surface text-inverse-on-surface hover:bg-white transition-all text-xs flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-4 h-4" /> Разблокировать в PRO
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleRunCodeReview}
                      disabled={reviewing || !code.trim()}
                      className="w-full px-5 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      {reviewing ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Автономный ИИ-аудит...</>
                      ) : (
                        <><Sparkles className="w-4 h-4" /> Запустить AI Code Review</>
                      )}
                    </button>
                  )}

                  {/* 4-Criteria Rubric Review Result */}
                  {reviewResult && (
                    <div className="p-5 bg-indigo-950/20 border border-indigo-500/20 rounded-2xl space-y-4">
                       <div className="flex items-center justify-between">
                         <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Результаты аудита</h4>
                         <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                           reviewResult.passed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                         }`}>
                           {reviewResult.verdict || (reviewResult.passed ? 'Зачтено' : 'Требует доработки')} ({reviewResult.overallScore}%)
                         </span>
                       </div>

                       {/* 4 Rubric Progress Bars */}
                       {reviewResult.scores && (
                         <div className="space-y-2 text-xs">
                           <div>
                             <div className="flex justify-between text-[11px] mb-1">
                               <span className="text-gray-300">Корректность:</span>
                               <span className="font-mono text-indigo-300">{reviewResult.scores.correctness}%</span>
                             </div>
                             <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                               <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${reviewResult.scores.correctness}%` }} />
                             </div>
                           </div>

                           <div>
                             <div className="flex justify-between text-[11px] mb-1">
                               <span className="text-gray-300">Чистота и стиль кода:</span>
                               <span className="font-mono text-indigo-300">{reviewResult.scores.codeStyle}%</span>
                             </div>
                             <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                               <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${reviewResult.scores.codeStyle}%` }} />
                             </div>
                           </div>

                           <div>
                             <div className="flex justify-between text-[11px] mb-1">
                               <span className="text-gray-300">Крайние случаи и ошибки:</span>
                               <span className="font-mono text-indigo-300">{reviewResult.scores.edgeCases}%</span>
                             </div>
                             <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                               <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${reviewResult.scores.edgeCases}%` }} />
                             </div>
                           </div>

                           <div>
                             <div className="flex justify-between text-[11px] mb-1">
                               <span className="text-gray-300">Безопасность:</span>
                               <span className="font-mono text-indigo-300">{reviewResult.scores.security}%</span>
                             </div>
                             <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                               <div className="h-full bg-purple-500 transition-all duration-500" style={{ width: `${reviewResult.scores.security}%` }} />
                             </div>
                           </div>
                         </div>
                       )}

                       {/* Specific Feedback */}
                       <div className="text-xs text-gray-300 space-y-2 pt-2 border-t border-indigo-500/20">
                         {reviewResult.criteriaFeedback && (
                           <p><span className="font-bold text-white">Вывод ревьюера: </span>{reviewResult.criteriaFeedback.correctness}</p>
                         )}
                         {reviewResult.improvements && reviewResult.improvements.length > 0 && (
                           <div>
                             <span className="font-bold text-white">Советы по улучшению:</span>
                             <ul className="list-disc list-inside text-gray-400 mt-1 space-y-0.5">
                               {reviewResult.improvements.map((imp, idx) => <li key={idx}>{imp}</li>)}
                             </ul>
                           </div>
                         )}
                       </div>

                       {/* ULTRA Plan: Iterative dialogue round with reviewer */}
                       {userPlan === 'ULTRA' && (
                         <div className="pt-3 border-t border-indigo-500/20 space-y-3">
                           <div className="flex items-center gap-1.5 text-[10px] font-bold text-purple-300 uppercase tracking-wider">
                             <MessageSquare className="w-3.5 h-3.5" /> Уточнения у ревьюера (ULTRA)
                           </div>

                           {ultraDialog.map((d, idx) => (
                             <div key={idx} className="p-3 rounded-xl bg-surface/60 border border-outline text-xs space-y-1">
                               <p className="font-bold text-white">Вы: {d.question}</p>
                               <p className="text-gray-300">ИИ-Ревьюер: {d.answer}</p>
                             </div>
                           ))}

                           {ultraDialog.length < 3 && (
                             <div className="flex gap-2">
                               <input 
                                 type="text" 
                                 placeholder="Задайте уточняющий вопрос..." 
                                 value={ultraInput}
                                 onChange={e => setUltraInput(e.target.value)}
                                 className="flex-1 bg-surface border border-outline rounded-xl px-3 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-indigo-500"
                               />
                               <button 
                                 onClick={handleSendUltraQuestion}
                                 disabled={ultraAsking || !ultraInput.trim()}
                                 className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                               >
                                 {ultraAsking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                               </button>
                             </div>
                           )}
                         </div>
                       )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
