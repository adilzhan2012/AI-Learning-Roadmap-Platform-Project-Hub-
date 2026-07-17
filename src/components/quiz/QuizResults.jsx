import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, XCircle, RotateCcw, ArrowRight } from 'lucide-react';

export default function QuizResults({ score, total, passed, explanations, onRetry, onContinue }) {
  const percentage = Math.round((score / total) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center w-full"
    >
      <div className="w-24 h-24 mx-auto bg-surface-container rounded-full flex items-center justify-center mb-6 shadow-inner relative">
        {passed ? (
          <>
            <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse" />
            <Trophy className="w-12 h-12 text-green-500 drop-shadow-md relative z-10" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl animate-pulse" />
            <XCircle className="w-12 h-12 text-red-500 drop-shadow-md relative z-10" />
          </>
        )}
      </div>

      <h2 className="text-3xl font-black text-on-surface mb-2">
        {passed ? 'Отличная работа!' : 'Нужно повторить'}
      </h2>
      <p className="text-on-surface-variant font-medium mb-4">
        Ваш результат: <span className={`font-bold ${passed ? 'text-green-500' : 'text-red-500'}`}>{percentage}%</span> ({score} из {total})
      </p>

      {!passed && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl p-3 mb-6 flex flex-col items-center justify-center">
          <p className="font-bold text-sm">Повторная попытка будет доступна через 10 минут</p>
        </div>
      )}

      <div className="space-y-4 mb-8 text-left max-h-60 overflow-y-auto pr-2 custom-scrollbar">
        {explanations.map((exp, i) => (
          <div key={i} className={`p-4 rounded-xl border ${exp.isCorrect ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
            <p className="font-bold text-sm text-on-surface mb-1">Вопрос {i + 1}: {exp.isCorrect ? 'Верно' : 'Ошибка'}</p>
            <p className="text-xs text-on-surface-variant">{exp.text}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button 
          onClick={onRetry}
          className="flex-1 bg-surface-container border border-outline-variant hover:bg-surface-container-high text-on-surface py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
        >
          <RotateCcw className="w-5 h-5" />
          {passed ? 'Закрыть' : 'Повторить материал'}
        </button>
        {passed && (
          <button 
            onClick={onContinue}
            className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:shadow-lg hover:shadow-indigo-500/25 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
          >
            Продолжить
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
