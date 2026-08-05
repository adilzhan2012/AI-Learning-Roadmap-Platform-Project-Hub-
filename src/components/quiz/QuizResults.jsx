import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, XCircle, RotateCcw, ArrowRight, Sparkles, BookOpen, CheckCircle2 } from 'lucide-react';

export default function QuizResults({ 
  score, 
  total, 
  passed, 
  explanations, 
  onRetry, 
  onContinue, 
  onAskMentor, 
  onForceRetry,
  onReviewSection 
}) {
  const percentage = Math.round((score / total) * 100);
  const failedExplanations = explanations.filter(e => !e.isCorrect);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center w-full"
    >
      <div className="w-20 h-20 mx-auto bg-surface-container rounded-full flex items-center justify-center mb-4 shadow-inner relative">
        {passed ? (
          <>
            <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse" />
            <Trophy className="w-10 h-10 text-green-500 drop-shadow-md relative z-10" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl animate-pulse" />
            <XCircle className="w-10 h-10 text-red-500 drop-shadow-md relative z-10" />
          </>
        )}
      </div>

      <h2 className="text-2xl font-black text-on-surface mb-1">
        {passed ? 'Отличная работа!' : 'Адаптивный разбор ошибок'}
      </h2>
      <p className="text-on-surface-variant font-medium text-sm mb-4">
        Ваш результат: <span className={`font-bold ${passed ? 'text-green-500' : 'text-red-500'}`}>{percentage}%</span> ({score} из {total})
      </p>

      {!passed && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-2xl p-4 mb-4 text-left">
          <div className="flex items-center gap-2 mb-1 text-amber-400 font-bold text-sm">
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>План работы над ошибками</span>
          </div>
          <p className="text-xs text-amber-200/90 leading-relaxed">
            Мы подобрали объяснения и целевые разделы урока. Перечитайте их, чтобы легко сдать адаптивный квиз при следующей попытке!
          </p>
        </div>
      )}

      {/* Question Details List */}
      <div className="space-y-3 mb-6 text-left max-h-64 overflow-y-auto pr-1.5 custom-scrollbar">
        {explanations.map((exp, i) => (
          <div 
            key={i} 
            className={`p-3.5 rounded-2xl border transition-all ${
              exp.isCorrect 
                ? 'bg-emerald-500/5 border-emerald-500/20' 
                : 'bg-rose-500/10 border-rose-500/30'
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                exp.isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              }`}>
                Вопрос {i + 1} • {exp.isCorrect ? 'Верно' : 'Неверно'}
              </span>
              {exp.sectionHeading && onReviewSection && !exp.isCorrect && (
                <button
                  onClick={() => onReviewSection(exp.sectionHeading)}
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 hover:underline shrink-0"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Перейти к разделу
                </button>
              )}
            </div>

            <p className="font-bold text-sm text-on-surface mb-2 leading-snug">
              {exp.questionText}
            </p>

            {!exp.isCorrect && (
              <div className="bg-black/30 rounded-xl p-2.5 mb-2 text-xs space-y-1">
                <p className="text-rose-300">
                  ❌ <strong>Ваш ответ:</strong> {exp.userAnswer}
                </p>
                <p className="text-emerald-300">
                  ✅ <strong>Правильный ответ:</strong> {exp.correctAnswer}
                </p>
              </div>
            )}

            <p className="text-xs text-on-surface-variant leading-relaxed bg-surface/50 p-2 rounded-lg border border-white/5">
              💡 <strong>Разбор:</strong> {exp.text}
            </p>

            {!exp.isCorrect && onAskMentor && (
              <button 
                onClick={() => onAskMentor(exp.questionText, exp.userAnswer, exp.correctAnswer, exp.text)}
                className="text-xs text-indigo-400 font-bold hover:underline flex items-center gap-1.5 pt-2"
              >
                <Sparkles className="w-3.5 h-3.5 animate-pulse text-indigo-400" />
                Спросить ментора об этой ошибке
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Footer Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        {!passed && (
          <>
            <button 
              onClick={onRetry}
              className="flex-1 bg-surface-container border border-outline-variant hover:bg-surface-container-high text-on-surface py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-sm"
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              Изучить теорию урока
            </button>
            <button 
              onClick={onForceRetry}
              className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-black py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20 text-sm"
            >
              <RotateCcw className="w-4 h-4 shrink-0" />
              Пройти адаптивный тест снова
            </button>
          </>
        )}

        {passed && (
          <button 
            onClick={onContinue}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-zinc-950 font-black py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 text-sm hover:scale-[1.02]"
          >
            Продолжить обучение
            <ArrowRight className="w-5 h-5 shrink-0" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

