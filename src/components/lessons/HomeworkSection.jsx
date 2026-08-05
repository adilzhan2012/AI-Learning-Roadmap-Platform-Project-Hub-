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
  Zap
} from 'lucide-react';
import { 
  generateHomeworkWithRubric, 
  reviewHomeworkSubmission, 
  getHomeworkState 
} from '../../services/courseService.js';
import { useXP } from '../../hooks/useXP.js';
import { usePlanLimits } from '../../hooks/usePlanLimits.js';
import { PLAN_LIMITS } from '../../constants/planLimits.js';
import UpgradeModal from '../shared/UpgradeModal.jsx';

export default function HomeworkSection({ courseId, nodeId, lessonContent, topicLabel, topicDesc }) {
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

        const hwData = await generateHomeworkWithRubric(courseId, nodeId, lessonContent, topicLabel, topicDesc);
        if (isMounted) {
          setPromptData(hwData);
        }
      } catch (err) {
        console.error("Homework init error:", err);
        if (isMounted) setError("Не удалось загрузить домашнее задание.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (courseId && nodeId && lessonContent) {
      initHomework();
    }
  }, [courseId, nodeId, lessonContent, topicLabel, topicDesc]);

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

      // Proportional XP Award Scheme
      if (res.score === 100) {
        await addXP(15, 'Домашка сдана на 100% ⭐', 'homework_passed', { nodeId });
      } else if (res.score >= 80) {
        await addXP(10, 'Домашка сдана (отличный результат)', 'homework_passed', { nodeId });
      } else if (res.score >= 60) {
        await addXP(5, 'Домашка сдана (хороший результат)', 'homework_passed', { nodeId });
      }

    } catch (err) {
      console.error("Homework submission review failed:", err);
      if (err.userMessage) {
        setError(err.userMessage);
      } else {
        setError("Ошибка при проверке домашнего задания ИИ. Попробуйте еще раз.");
      }
    } finally {
      setReviewing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-surface/50 border border-white/10 rounded-2xl p-6 text-center my-6">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-400 mb-2" />
        <p className="text-xs text-on-surface-variant">Подготовка интерактивного задания...</p>
      </div>
    );
  }

  return (
    <div className="bg-surface/80 border border-white/10 rounded-3xl p-5 md:p-7 my-8 shadow-xl relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-on-surface">Интерактивная Домашка</h3>
            <p className="text-xs text-on-surface-variant">Проверка ИИ-ревьюером по критериям</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
      </div>

      {/* Assignment Task Prompt */}
      {promptData?.prompt && (
        <div className="bg-black/30 rounded-2xl p-4 mb-5 border border-white/5 text-sm leading-relaxed text-zinc-200">
          <p className="font-bold text-xs uppercase tracking-wider text-indigo-400 mb-2">📌 Задание</p>
          <div className="whitespace-pre-wrap">{promptData.prompt}</div>
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
        <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">
          Ваше решение / Ответ
        </label>
        <textarea
          rows={5}
          value={submission}
          onChange={(e) => setSubmission(e.target.value)}
          placeholder="Напишите ваш ответ, код или разбор решения здесь..."
          className="w-full bg-surface-container/60 border border-white/10 focus:border-indigo-500/50 rounded-2xl p-4 text-sm text-on-surface placeholder:text-zinc-500 focus:outline-none transition-all resize-y font-mono"
        />

        {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}

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

      <UpgradeModal 
        isOpen={isUpgradeModalOpen} 
        onClose={() => setUpgradeModalOpen(false)} 
        onUpgrade={() => alert("Backend payment integration is pending.")} 
      />
    </div>
  );
}
