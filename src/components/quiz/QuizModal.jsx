import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import QuizQuestion from './QuizQuestion.jsx';
import QuizResults from './QuizResults.jsx';

export default function QuizModal({ questions, isOpen, onClose, onComplete, onAskMentor }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);

  if (!isOpen || !questions || questions.length === 0) return null;

  const currentQuestion = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;
  const selectedOption = answers[currentIndex];

  const handleSelect = (idx) => {
    setAnswers({ ...answers, [currentIndex]: idx });
  };

  const handleNext = () => {
    if (selectedOption === undefined) return;
    if (isLast) {
      setShowResults(true);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleRetry = () => {
    if (results) {
      onComplete(results.score, results.total, results.passed);
    }
  };

  const calculateScore = () => {
    let score = 0;
    const explanations = questions.map((q, i) => {
      const isCorrect = answers[i] === q.correctIndex;
      if (isCorrect) score++;
      return { 
        isCorrect, 
        text: q.explanation,
        questionText: q.question,
        userAnswer: q.options[answers[i]] || 'нет ответа',
        correctAnswer: q.options[q.correctIndex]
      };
    });
    return { score, total: questions.length, explanations, passed: (score / questions.length) >= 0.6 };
  };

  const results = showResults ? calculateScore() : null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ scale: 0.95, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 20, opacity: 0 }}
        className="w-full max-w-lg bg-surface border border-outline-variant rounded-[2rem] p-6 shadow-2xl relative z-10 flex flex-col max-h-[90vh]"
      >
        {!showResults && (
          <div className="flex justify-between items-center mb-6 border-b border-outline-variant/50 pb-4">
            <h2 className="text-xl font-bold text-on-surface">Вопрос {currentIndex + 1} из {questions.length}</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-container transition-colors">
              <X className="w-5 h-5 text-on-surface-variant" />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto relative min-h-[300px] flex items-center custom-scrollbar">
          <AnimatePresence mode="wait">
            {!showResults ? (
              <QuizQuestion 
                key={currentIndex} 
                question={currentQuestion} 
                selectedOption={selectedOption} 
                onSelect={handleSelect} 
              />
            ) : (
              <QuizResults 
                key="results"
                score={results.score}
                total={results.total}
                passed={results.passed}
                explanations={results.explanations}
                onRetry={handleRetry}
                onContinue={() => onComplete(results.score, results.total, results.passed)}
                onAskMentor={onAskMentor}
              />
            )}
          </AnimatePresence>
        </div>

        {!showResults && (
          <div className="mt-6 pt-4 border-t border-outline-variant/50 flex justify-end">
            <button
              onClick={handleNext}
              disabled={selectedOption === undefined}
              className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:hover:bg-indigo-500 text-on-surface px-8 py-3 rounded-xl font-bold transition-all"
            >
              {isLast ? 'Завершить' : 'Далее'}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
