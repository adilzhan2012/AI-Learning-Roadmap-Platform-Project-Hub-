import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Send, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  RotateCcw, 
  Sparkles, 
  Award,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Zap,
  Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../firebase.js';
import { doc, getDoc } from 'firebase/firestore';
import { 
  generateHomeworkWithRubric, 
  reviewHomeworkSubmission, 
  getHomeworkState,
  saveHomeworkChatHistory,
  callGeminiWithRetry
} from '../../services/courseService.js';
import { getUserGroupForCourse } from '../../services/groupService.js';
import { useXP } from '../../hooks/useXP.js';
import { usePlanLimits } from '../../hooks/usePlanLimits.js';
import { PLAN_LIMITS } from '../../constants/planLimits.js';
import UpgradeModal from '../shared/UpgradeModal.jsx';
import { AIParsingError } from '../../utils/aiResponseParser.js';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function HomeworkSection({ courseId, nodeId, lessonContent, topicLabel, topicDesc }) {
  const navigate = useNavigate();
  const { addXP } = useXP();
  const { plan, usage, checkLimit, incrementUsage, setUpgradeModalOpen, isUpgradeModalOpen } = usePlanLimits();

  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [promptData, setPromptData] = useState(null); // { prompt, rubric }
  const [submission, setSubmission] = useState('');
  const [reviewResult, setReviewResult] = useState(null); // { score, passed, feedback, overallComment, attempts }
  const [status, setStatus] = useState('not_started'); // 'not_started' | 'submitted' | 'reviewed'
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [isHomeworkOpen, setIsHomeworkOpen] = useState(false);
  const [isMentorOpen, setIsMentorOpen] = useState(false);
  const [peerSubmissions, setPeerSubmissions] = useState([]);

  const monthlyLimit = PLAN_LIMITS[plan]?.homeworkReviewsPerMonth ?? 2;
  const reviewsUsed = usage?.homeworkReviewsUsed || 0;
  const isLimitReached = monthlyLimit !== Infinity && reviewsUsed >= monthlyLimit;

  useEffect(() => {
    let isMounted = true;
    async function initHomework() {
      setLoading(true);
      setError('');
      try {
        const existingState = await getHomeworkState(courseId, nodeId);
        if (existingState && isMounted) {
          setSubmission(existingState.submission || '');
          setStatus(existingState.status || 'not_started');
          if (existingState.chatHistory) {
            setChatHistory(existingState.chatHistory);
          }
          if (existingState.feedback) {
            setReviewResult({
              score: existingState.score,
              passed: existingState.passed,
              feedback: existingState.feedback,
              overallComment: existingState.overallComment,
              attempts: existingState.attempts || []
            });
          }
        }

        // Fetch peer submissions if user is in an active group
        if (auth.currentUser && courseId) {
          try {
            const group = await getUserGroupForCourse(auth.currentUser.uid, courseId);
            if (group && group.status === 'active' && group.members) {
              const peers = Object.values(group.members).filter(m => m.userId !== auth.currentUser.uid);
              const list = [];
              for (const peer of peers) {
                const hwRef = doc(db, 'users', peer.userId, 'homeworkSubmissions', `${courseId}_${nodeId}`);
                const hwSnap = await getDoc(hwRef);
                if (hwSnap.exists()) {
                  list.push({ peer, ...hwSnap.data() });
                }
              }
              if (isMounted) setPeerSubmissions(list);
            }
          } catch (peerErr) {
            console.error("Peer HW fetch error:", peerErr);
          }
        }

        const hwData = await generateHomeworkWithRubric(courseId, nodeId, lessonContent, topicLabel, topicDesc);
        if (isMounted) {
          setPromptData(hwData);
        }
      } catch (err) {
        console.error("Homework init error:", err);
        if (isMounted) {
          if (err instanceof AIParsingError || err?.name === 'AIParsingError') {
            setError("Ошибка парсинга ответа ИИ при создании домашки. Попробуйте еще раз.");
          } else {
            setError("Не удалось загрузить домашнее задание.");
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (courseId && nodeId && lessonContent) {
      initHomework();
    }
  }, [courseId, nodeId, lessonContent, topicLabel, topicDesc]);

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;
    
    const userMessage = chatInput.trim();
    setChatInput('');
    const newHistory = [...chatHistory, { role: 'user', content: userMessage }];
    setChatHistory(newHistory);
    setChatLoading(true);

    try {
      const prompt = `You are a Socratic AI mentor for a user doing their homework. 
The user is currently studying the following topic: "${topicLabel}".
Here is the lesson content they just read:
${lessonContent.substring(0, 2000)}...

Here is the homework task they need to complete:
${promptData?.prompt}

The user's question:
"${userMessage}"

CRITICAL INSTRUCTION: You MUST act as a Socratic mentor. Do NOT solve the homework for them. Do NOT give them the direct answer. Instead, give them hints, point out where to look, or ask them a leading question to guide them to the answer. Answer in Russian, be very supportive, friendly, and concise.`;

      const resText = await callGeminiWithRetry(null, prompt, 'ai_chat');
      const updatedHistory = [...newHistory, { role: 'assistant', content: resText }];
      setChatHistory(updatedHistory);
      await saveHomeworkChatHistory(courseId, nodeId, updatedHistory);
    } catch (err) {
      console.error("Chat error:", err);
      setChatHistory([...newHistory, { role: 'assistant', content: "Произошла ошибка при обращении к ИИ-наставнику. Попробуйте еще раз." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!submission.trim() || reviewing || !promptData) return;
    setError('');

    // Plan monthly limit check
    if (!checkLimit('homework_review')) {
      return;
    }

    setReviewing(true);

    try {
      const res = await reviewHomeworkSubmission(
        courseId, 
        nodeId, 
        submission, 
        lessonContent, 
        promptData.prompt, 
        promptData.rubric
      );

      // Increment plan usage locally
      incrementUsage('homework_review');

      setReviewResult(res);
      setStatus(res.passed ? 'reviewed' : 'submitted');

      // fix/critical-round1: XP вычисляется СЕРВЕРОМ по score из homeworkSubmissions.
      try {
        await addXP(
          0,
          'Домашка проверена ИИ',
          'homework_passed',
          { nodeId, courseId }
        );
      } catch (xpErr) {
        console.error('[HomeworkSection] Failed to award XP for homework_passed:', xpErr);
      }

    } catch (err) {
      console.error("Homework submission review failed:", err);
      if (err.userMessage) {
        setError(err.userMessage);
      } else if (err instanceof AIParsingError || err?.name === 'AIParsingError') {
        setError("Не удалось обработать ответ ИИ при проверке ответа. Нажмите «Попробовать снова».");
      } else {
        setError("Ошибка при проверке домашнего задания ИИ. Попробуйте еще раз.");
      }
    } finally {
      setReviewing(false);
    }
  };

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-100 dark:border-indigo-500/20 rounded-3xl p-10 text-center my-6 relative overflow-hidden"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute -top-12 -right-12 text-indigo-500/5 dark:text-indigo-400/5"
        >
          <Sparkles className="w-48 h-48" />
        </motion.div>
        <motion.div 
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-5 relative z-10"
        >
          <Sparkles className="w-8 h-8 text-white" />
        </motion.div>
        <h4 className="font-extrabold text-lg text-zinc-900 dark:text-white mb-2 relative z-10">Генерируем индивидуальное задание</h4>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 relative z-10">Искусственный интеллект анализирует материал и составляет вопросы...</p>
        
        <div className="mt-8 flex justify-center gap-2.5 relative z-10">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-indigo-500"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="bg-surface/80 border border-white/10 rounded-3xl p-5 md:p-7 my-8 shadow-xl relative overflow-hidden transition-all duration-300">
      {/* Header (Clickable Toggle) */}
      <button 
        onClick={() => setIsHomeworkOpen(!isHomeworkOpen)}
        className="w-full text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10 mb-5 hover:bg-white/5 p-3 rounded-2xl transition-colors -m-3"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-on-surface flex items-center gap-2">
              Интерактивная Домашка
              {isHomeworkOpen ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
            </h3>
            <p className="text-xs text-on-surface-variant">Проверка ИИ-ревьюером по критериям</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Monthly plan limit indicator */}
          {monthlyLimit !== Infinity && (
            <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
              isLimitReached 
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' 
                : 'bg-white/5 text-zinc-300 border-white/10'
            }`}>
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              <span>Проверок в этом месяце: {reviewsUsed} из {monthlyLimit}</span>
            </div>
          )}

          {/* Status Badge */}
          {reviewResult?.score === 100 ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" /> Домашка сдана на отлично ⭐
            </span>
          ) : reviewResult?.passed ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" /> Домашка сдана ✓
            </span>
          ) : status === 'submitted' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <RotateCcw className="w-3.5 h-3.5" /> Требуется доработка
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/5 text-zinc-400 border border-white/10">
              Не сдано
            </span>
          )}
        </div>
      </button>

      {isHomeworkOpen && (
        <div className="mt-5 animate-in fade-in slide-in-from-top-4 duration-300">
          {/* Assignment Task Prompt */}
          {promptData?.prompt && (
        <div className="bg-zinc-100 dark:bg-black/30 rounded-2xl p-4 mb-5 border border-zinc-200 dark:border-white/5 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
          <p className="font-bold text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2">📌 Задание</p>
          <div className="prose prose-sm dark:prose-invert prose-indigo max-w-none prose-p:leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{promptData.prompt}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Limit Reached Banner for FREE / PRO */}
      {isLimitReached && (
        <div className="bg-gradient-to-r from-violet-900/40 to-indigo-900/40 border border-violet-500/30 rounded-2xl p-4 mb-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-300 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-white">Месячный лимит проверок исчерпан ({reviewsUsed}/{monthlyLimit})</p>
              <p className="text-[11px] text-zinc-300 mt-0.5">
                Перейдите на более высокий тариф, чтобы получать неограниченный ИИ-аудит домашних заданий.
              </p>
            </div>
          </div>
          <button
            onClick={() => setUpgradeModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-zinc-950 font-black text-xs rounded-xl shadow-md transition-all shrink-0 cursor-pointer whitespace-nowrap"
          >
            Увеличить лимит
          </button>
        </div>
      )}

      {/* Student Submission Text Area */}
      <div className="space-y-3 mb-5">
        <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-400 uppercase tracking-wider">
          Ваше решение / Ответ
        </label>
        <textarea
          rows={5}
          value={submission}
          onChange={(e) => setSubmission(e.target.value)}
          placeholder="Напишите ваш ответ, код или разбор решения здесь..."
          className="w-full bg-white dark:bg-zinc-900/60 border border-zinc-300 dark:border-zinc-700/50 focus:border-indigo-500 rounded-2xl p-4 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:placeholder:text-zinc-600 focus:outline-none transition-all resize-y font-mono shadow-inner"
        />

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 mb-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-rose-300">
            <span>{error}</span>
            <button
              onClick={handleSubmit}
              disabled={reviewing}
              className="px-3.5 py-2 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 rounded-xl font-bold text-rose-200 shrink-0 flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Попробовать снова
            </button>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <p className="text-[11px] text-zinc-400">
            💡 Оценка выставляется ИИ по критериям урока. Награды: 60-79% (+5 XP), 80-99% (+10 XP), 100% (+15 XP).
          </p>

          <button
            onClick={handleSubmit}
            disabled={!submission.trim() || reviewing}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 text-white font-black text-xs px-5 py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2 shrink-0 cursor-pointer"
          >
            {reviewing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                ИИ проверяет...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                {reviewResult ? 'Пересдать на проверку' : 'Сдать на проверку'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Review Feedback Result Block */}
      <AnimatePresence>
        {reviewResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl p-5 border ${
              reviewResult.passed
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-amber-500/10 border-amber-500/30'
            }`}
          >
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                {reviewResult.passed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-amber-400 shrink-0" />
                )}
                <span className="font-extrabold text-sm text-on-surface">
                  {reviewResult.score === 100 ? 'Идеальный результат (100%) ⭐' : reviewResult.passed ? 'Результат: Сдано успешно!' : 'Результат: Нужна доработка'}
                </span>
              </div>
              <span className={`text-base font-black px-3 py-1 rounded-xl ${
                reviewResult.score >= 80 ? 'bg-emerald-500/20 text-emerald-400' :
                reviewResult.score >= 60 ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
              }`}>
                {reviewResult.score} / 100 б.
              </span>
            </div>

            {reviewResult.overallComment && (
              <p className="text-xs text-zinc-300 leading-relaxed mb-4 italic bg-black/20 p-3 rounded-xl">
                "{reviewResult.overallComment}"
              </p>
            )}

            {/* Criteria Breakdown */}
            <div className="space-y-2 mb-3">
              <p className="text-xs font-bold text-on-surface uppercase tracking-wider mb-2">
                Разбор по критериям:
              </p>
              {(reviewResult.feedback || []).map((item, idx) => (
                <div key={idx} className="bg-surface/60 rounded-xl p-3 border border-white/5 flex items-start gap-2.5">
                  {item.met ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="text-xs">
                    <p className={`font-bold ${item.met ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {item.criterion}: {item.met ? 'Выполнено' : 'Не выполнено'}
                    </p>
                    <p className="text-zinc-300 mt-1 leading-normal">{item.comment}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Previous Attempts Dropdown toggle */}
            {reviewResult.attempts && reviewResult.attempts.length > 1 && (
              <div className="pt-2">
                <button
                  onClick={() => setShowHistory(prev => !prev)}
                  className="text-xs font-bold text-indigo-400 hover:underline flex items-center gap-1"
                >
                  {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  История попыток ({reviewResult.attempts.length})
                </button>

                {showHistory && (
                  <div className="mt-3 space-y-2 max-h-40 overflow-y-auto pr-1">
                    {reviewResult.attempts.map((att, i) => (
                      <div key={i} className="text-[11px] bg-black/40 p-2.5 rounded-lg border border-white/5 flex justify-between items-center">
                        <span className="text-zinc-400">Попытка #{i + 1} ({new Date(att.timestamp).toLocaleDateString()})</span>
                        <span className={`font-bold ${att.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {att.score} баллов
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      </div>
      )}

      {/* Peer Submissions Section for Group Lessons */}
      {peerSubmissions.length > 0 && (
        <div className="mt-6 border-t border-zinc-200 dark:border-zinc-800 pt-5">
          <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-500" />
            <span>Работы участников вашей группы ({peerSubmissions.length})</span>
          </h4>
          <div className="space-y-3">
            {peerSubmissions.map(({ peer, submission: peerSub, score, passed, feedback }) => (
              <div key={peer.userId} className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-xs"
                      style={{ backgroundColor: peer.avatarColor || '#3b82f6' }}
                    >
                      {(peer.displayName || peer.username || 'U').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-bold text-zinc-900 dark:text-white">{peer.displayName}</span>
                  </div>
                  {typeof score === 'number' && (
                    <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full border ${passed ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                      {score}% ({passed ? 'Сдано' : 'Не сдано'})
                    </span>
                  )}
                </div>
                {peerSub && (
                  <div className="p-3 rounded-xl bg-white dark:bg-black/40 border border-zinc-200 dark:border-zinc-800 text-xs font-mono text-zinc-700 dark:text-zinc-300 max-h-32 overflow-y-auto whitespace-pre-wrap">
                    {peerSub}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ULTRA AI Mentor Chat */}
      {promptData?.prompt && (
        <div className="mt-8 border-t border-white/10 pt-6">
          <button 
            onClick={() => setIsMentorOpen(!isMentorOpen)}
            className="w-full text-left flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2 hover:bg-white/5 p-3 -mx-3 rounded-2xl transition-colors"
          >
            <h3 className="font-extrabold text-sm text-on-surface flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              ИИ-Наставник (ULTRA)
              {isMentorOpen ? <ChevronUp className="w-4 h-4 text-zinc-500 ml-1" /> : <ChevronDown className="w-4 h-4 text-zinc-500 ml-1" />}
            </h3>
            {plan !== 'ULTRA' && (
              <span className="text-[10px] font-bold px-2 py-1 bg-amber-500/20 text-amber-400 rounded-md border border-amber-500/30">
                Доступно на тарифе ULTRA
              </span>
            )}
          </button>
          
          {isMentorOpen && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
              {plan === 'ULTRA' ? (
            <div className="bg-surface/50 border border-white/5 rounded-2xl overflow-hidden flex flex-col h-[300px]">
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {chatHistory.length === 0 ? (
                  <p className="text-xs text-zinc-500 text-center mt-10">Задайте вопрос по домашнему заданию, и ИИ-наставник поможет вам (но не решит за вас!).</p>
                ) : (
                  chatHistory.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-zinc-800 text-zinc-200 rounded-bl-sm border border-white/5'}`}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
                  ))
                )}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-zinc-800 border border-white/5 p-3 rounded-2xl rounded-bl-sm flex items-center gap-2 text-zinc-400">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span className="text-[10px]">Наставник думает...</span>
                    </div>
                  </div>
                )}
              </div>
              <form onSubmit={handleChatSubmit} className="p-3 bg-black/40 border-t border-white/5 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Задайте вопрос по заданию..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  disabled={chatLoading}
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="w-10 h-10 shrink-0 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-black/30 border border-white/5 p-6 rounded-2xl text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed relative z-10 mb-4">
                На тарифе ULTRA вы можете задавать любые вопросы по домашнему заданию персональному ИИ-ментору, который выступит в роли вашего личного преподавателя.
              </p>
              <button
                onClick={() => setUpgradeModalOpen(true)}
                className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-bold text-xs rounded-xl transition-all relative z-10 border border-white/5"
              >
                Подключить ULTRA
              </button>
            </div>
              )}
            </div>
          )}
        </div>
      )}

      <UpgradeModal 
        isOpen={isUpgradeModalOpen} 
        onClose={() => setUpgradeModalOpen(false)} 
        onUpgrade={() => navigate('/pricing')} 
      />
    </div>
  );
}
