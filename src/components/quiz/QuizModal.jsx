import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, BrainCircuit } from 'lucide-react';
import QuizQuestion from './QuizQuestion.jsx';
import QuizResults from './QuizResults.jsx';
import Flashcard from '../lessons/Flashcard.jsx';

export default function QuizModal({ questions, flashcards = [], isOpen, onClose, onComplete, onAskMentor }) {
  const [mode, setMode] = useState('quiz'); // 'flashcards' | 'intermission' | 'quiz'
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(flashcards && flashcards.length > 0 ? 'flashcards' : 'quiz');
      setFlashcardIndex(0);
      setCurrentIndex(0);
      setAnswers({});
      setShowResults(false);
    }
  }, [isOpen, flashcards]);

  if (!isOpen || !questions || questions.length === 0) return null;

  const handleFlashcardRated = (quality) => {
    if (flashcardIndex < flashcards.length - 1) {
      setFlashcardIndex(prev => prev + 1);
    } else {
      setMode('intermission');
    }
  };

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
        {mode === 'quiz' && !showResults && (
          <div className="flex justify-between items-center mb-6 border-b border-outline-variant/50 pb-4">
            <h2 className="text-xl font-bold text-on-surface">Вопрос {currentIndex + 1} из {questions.length}</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-container transition-colors">
              <X className="w-5 h-5 text-on-surface-variant" />
            </button>
          </div>
        )}
        
        {mode === 'flashcards' && (
          <div className="flex justify-between items-center mb-6 border-b border-outline-variant/50 pb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-on-surface">Запоминание ({flashcardIndex + 1}/{flashcards.length})</h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-container transition-colors">
              <X className="w-5 h-5 text-on-surface-variant" />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto relative min-h-[300px] flex items-center justify-center custom-scrollbar">
          <AnimatePresence mode="wait">
            {mode === 'flashcards' && (
              <motion.div
                key={`fc-${flashcardIndex}`}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="w-full flex items-center justify-center py-4"
              >
                <Flashcard 
                  term={flashcards[flashcardIndex].term} 
                  definition={flashcards[flashcardIndex].definition} 
                  onRated={handleFlashcardRated}
                />
              </motion.div>
            )}

            {mode === 'intermission' && (
              <motion.div
                key="intermission"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full flex flex-col items-center justify-center text-center py-10"
              >
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 border border-green-500/20">
                  <Sparkles className="w-10 h-10 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold text-on-surface mb-3">Отличная память!</h3>
                <p className="text-on-surface-variant mb-8 text-sm max-w-xs leading-relaxed">
                  Все термины урока успешно закреплены. Теперь пришло время проверить, как вы усвоили логику и теорию.
                </p>
                <button
                  onClick={() => setMode('quiz')}
                  className="bg-primary hover:bg-primary-hover text-on-primary px-8 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-primary/25 flex items-center gap-2"
                >
                  <BrainCircuit className="w-5 h-5" />
                  Перейти к тесту
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
                onContinue={() => onComplete(results.score, results.total, results.passed)}
                onAskMentor={onAskMentor}
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
