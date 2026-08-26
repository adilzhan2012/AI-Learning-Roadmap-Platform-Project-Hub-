import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, BrainCircuit } from 'lucide-react';
import QuizQuestion from './QuizQuestion.jsx';
import QuizResults from './QuizResults.jsx';
import Flashcard from '../lessons/Flashcard.jsx';

export default function QuizModal({ 
  questions, 
  flashcards = [], 
  isOpen, 
  onClose, 
  onComplete, 
  onAskMentor, 
  onForceRetry,
  onReviewSection 
}) {
  const [mode, setMode] = useState('quiz'); // 'flashcards' | 'intermission' | 'quiz'
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (flashcards && flashcards.length > 0) {
        setMode('flashcards');
      } else {
        setMode('quiz');
      }
      setFlashcardIndex(0);
      setCurrentIndex(0);
      setAnswers({});
      setShowResults(false);
    }
  }, [isOpen, questions, flashcards]);

  if (!isOpen || ((!questions || questions.length === 0) && (!flashcards || flashcards.length === 0))) return null;

  const handleFlashcardRated = (quality) => {
    if (flashcardIndex < flashcards.length - 1) {
      setFlashcardIndex(prev => prev + 1);
    } else {
      setMode('intermission');
    }
  };

  const currentQuestion = questions?.[currentIndex];
  const selectedOption = answers[currentIndex];
  const isLast = !questions || currentIndex === questions.length - 1;
  const isLastFlashcard = flashcardIndex === flashcards.length - 1;

  const handleSelect = (index) => {
    setAnswers(prev => ({ ...prev, [currentIndex]: index }));
  };

  const handleNext = () => {
    if (isLast) {
      setShowResults(true);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleRetry = () => {
    if (results) {
      onComplete(results.score, results.total, results.passed, results.failedDetails, questions, answers);
    }
  };

  const handleForceRetry = () => {
    if (results) {
      onComplete(results.score, results.total, results.passed, results.failedDetails, questions, answers);
    }
    if (onForceRetry) {
      onClose();
      onForceRetry(results?.failedDetails);
    }
  };

  const calculateScore = () => {
    let score = 0;
    const failedDetails = [];
    const explanations = questions.map((q, i) => {
      const correctIdx = typeof q.correctIndex === 'number' 
        ? q.correctIndex 
        : (typeof q.correctAnswer === 'number' ? q.correctAnswer : 0);
      const isCorrect = answers[i] === correctIdx;
      const qText = q.question || q.questionText || q.prompt || q.title || `Вопрос ${i + 1}`;
      const correctOption = q.options?.[correctIdx] || '';
      const userOption = q.options?.[answers[i]] || 'нет ответа';

      if (isCorrect) {
        score++;
      } else {
        failedDetails.push({
          questionText: qText,
          userAnswer: userOption,
          correctAnswer: correctOption,
          sectionHeading: q.sectionHeading || ''
        });
      }
      return { 
        isCorrect, 
        text: q.explanation || '',
        questionText: qText,
        userAnswer: userOption,
        correctAnswer: correctOption,
        sectionHeading: q.sectionHeading || ''
      };
    });
    return { score, total: questions.length, explanations, failedDetails, passed: (score / questions.length) >= 0.6 };
  };

  const results = showResults ? calculateScore() : null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose} 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative z-10 bg-surface border border-outline-variant/50 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl overflow-hidden text-on-surface flex flex-col max-h-[90vh]"
      >
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-outline-variant/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-on-surface tracking-tight">
                {mode === 'flashcards' ? 'Карточки для запоминания' : 'Проверка знаний'}
              </h3>
              <p className="text-xs text-on-surface-variant font-medium">
                {mode === 'flashcards' 
                  ? `Карточка ${flashcardIndex + 1} из ${flashcards.length}`
                  : (showResults ? 'Итоги теста' : `Вопрос ${currentIndex + 1} из ${questions.length}`)
                }
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
          <AnimatePresence mode="wait">
            {mode === 'flashcards' && flashcards[flashcardIndex] && (
              <motion.div
                key={`fc-${flashcardIndex}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col items-center justify-center py-2 w-full"
              >
                <Flashcard 
                  term={flashcards[flashcardIndex].term || flashcards[flashcardIndex].front} 
                  definition={flashcards[flashcardIndex].definition || flashcards[flashcardIndex].back} 
                  onRated={handleFlashcardRated}
                />
                
                <div className="flex items-center gap-4 mt-8 w-full max-w-md">
                  <button
                    onClick={() => setFlashcardIndex(prev => Math.max(0, prev - 1))}
                    disabled={flashcardIndex === 0}
                    className="flex-1 py-3 px-4 rounded-xl font-bold bg-surface-container border border-outline-variant hover:bg-surface-container-high disabled:opacity-40 disabled:hover:bg-surface-container transition-all text-sm"
                  >
                    Назад
                  </button>
                  <button
                    onClick={() => {
                      if (isLastFlashcard) {
                        setMode('intermission');
                      } else {
                        setFlashcardIndex(prev => prev + 1);
                      }
                    }}
                    className="flex-1 py-3 px-4 rounded-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all text-sm"
                  >
                    {isLastFlashcard ? 'К тесту →' : 'Далее'}
                  </button>
                </div>
              </motion.div>
            )}

            {mode === 'intermission' && (
              <motion.div
                key="intermission"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center py-8 px-4"
              >
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Sparkles className="w-10 h-10 animate-pulse" />
                </div>
                <h3 className="text-2xl font-black mb-2 text-white">Теория изучена!</h3>
                <p className="text-zinc-400 max-w-md mx-auto mb-8 text-sm leading-relaxed">
                  Вы отлично поработали с карточками. Теперь давайте проверим, насколько хорошо вы усвоили материал на практике с помощью небольшого теста.
                </p>
                <button
                  onClick={() => setMode('quiz')}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 text-zinc-950 font-black px-8 py-4 rounded-2xl shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-105 transition-all flex items-center gap-2 mx-auto"
                >
                  🚀 Начать тестирование
                </button>
              </motion.div>
            )}

            {mode === 'quiz' && !showResults && (
              <QuizQuestion 
                key={currentIndex} 
                question={currentQuestion} 
                selectedOption={selectedOption} 
                onSelect={handleSelect} 
              />
            )}
            
            {mode === 'quiz' && showResults && (
              <QuizResults 
                key="results"
                score={results.score}
                total={results.total}
                passed={results.passed}
                explanations={results.explanations}
                onRetry={handleRetry}
                onForceRetry={handleForceRetry}
                onContinue={() => onComplete(results.score, results.total, results.passed, results.failedDetails, questions, answers)}
                onAskMentor={onAskMentor}
                onReviewSection={(headingText) => {
                  if (onReviewSection) {
                    onClose();
                    onReviewSection(headingText);
                  }
                }}
              />
            )}
          </AnimatePresence>
        </div>

        {mode === 'quiz' && !showResults && (
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
