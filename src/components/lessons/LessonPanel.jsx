import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  Loader2, 
  Sparkles, 
  AlertCircle, 
  BrainCircuit,
  X,
  Maximize2,
  Minimize2,
  Baby,
  Lightbulb
} from 'lucide-react';
import { t } from '../../i18n.js';
import { useXP } from '../../hooks/useXP.js';
import { useQuiz } from '../../hooks/useQuiz.js';
import { usePlanLimits } from '../../hooks/usePlanLimits.js';
import QuizModal from '../quiz/QuizModal.jsx';
import UpgradeModal from '../shared/UpgradeModal.jsx';
import { generateLessonContent, updateNodeStatus, generateELI5Content, generateRealWorldExample } from '../../services/courseService.js';
import ReactMarkdown from 'react-markdown';
import Flashcard from './Flashcard.jsx';

export default function LessonPanel({ 
  selectedCourse, 
  selectedNode, 
  onClose,
  onNodeUpdated, // Callback when node content is generated or status changes to completed
  isZenMode,
  toggleZenMode
}) {
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  const { addXP } = useXP();
  
  // Quiz state
  const { generateQuiz, saveQuizResult, checkCooldown, generating: quizGenerating, error: quizError } = useQuiz();
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizData, setQuizData] = useState([]);
  
  // Plan limits
  const { plan, checkLimit, incrementUsage, isUpgradeModalOpen, setUpgradeModalOpen } = usePlanLimits();

  // New UX States
  const [isELI5, setIsELI5] = useState(false);
  const [eli5Generating, setEli5Generating] = useState(false);
  const [insight, setInsight] = useState('');
  const [insightGenerating, setInsightGenerating] = useState(false);

  // Auto-generate content when a new empty node is selected
  useEffect(() => {
    if (selectedCourse && selectedNode && !selectedNode.content && !generating && !genError) {
      handleGenerateContent();
    }
    // Reset local view states
    setIsELI5(false);
    setInsight('');
  }, [selectedCourse?.id, selectedNode?.id]);

  // Clear error when node changes
  useEffect(() => {
    setGenError('');
  }, [selectedNode?.id]);

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
        selectedNode.desc,
        selectedCourse.preferences || {}
      );
      
      const updatedNode = { ...selectedNode, content: markdown };
      onNodeUpdated(updatedNode); // Pass to parent Graph.jsx to update course state
      
    } catch (err) {
      console.error(err);
      if (err.message === 'MISSING_API_KEY') {
        setGenError('Gemini API Key is missing. Please set it in Settings.');
      } else {
        setGenError(err.message || 'Failed to generate lesson content. Please try again.');
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleOpenQuiz = async () => {
    if (!selectedNode?.content) return;
    
    if (!checkLimit('ai_question')) {
      return;
    }

    const { allowed, cooldownUntil } = await checkCooldown(selectedNode.id);
    if (!allowed) {
      const minutesLeft = Math.ceil((cooldownUntil.getTime() - Date.now()) / 60000);
      setGenError(`Повторная попытка будет доступна через ${minutesLeft} мин.`);
      return;
    }

    const questions = await generateQuiz(selectedNode.content);
    if (questions) {
      await incrementUsage('ai_question');
      setQuizData(questions);
      setQuizOpen(true);
    }
  };

  const handleQuizComplete = async (score, total, passed) => {
    setQuizOpen(false);
    
    await saveQuizResult(selectedCourse.id, selectedNode.id, score, passed);
    
    if (passed) {
      addXP(25, 'Пройден квиз');
      if (score === total) {
        addXP(50, 'Идеальный результат');
      }
      
      if (selectedNode.status !== 'completed') {
        const updatedCourse = await updateNodeStatus(selectedCourse.id, selectedNode.id, 'completed');
        if (updatedCourse) {
           const updatedNode = updatedCourse.nodes.find(n => n.id === selectedNode.id);
           if (updatedNode) {
             onNodeUpdated(updatedNode, updatedCourse);
           }
        }
      }
    }
  };

  const handleELI5Toggle = async () => {
    if (!selectedNode?.content) return;
    if (isELI5) {
      setIsELI5(false);
      return;
    }
    if (selectedNode.eli5Content) {
      setIsELI5(true);
      return;
    }
    setEli5Generating(true);
    try {
      const simplified = await generateELI5Content(selectedNode.content);
      const updatedNode = { ...selectedNode, eli5Content: simplified };
      onNodeUpdated(updatedNode);
      setIsELI5(true);
    } catch (e) {
      console.error(e);
      setGenError('Не удалось упростить текст.');
    } finally {
      setEli5Generating(false);
    }
  };

  const handleRealWorldInsight = async () => {
    if (!selectedNode?.content) return;
    if (selectedNode.insight) {
      setInsight(selectedNode.insight);
      return;
    }
    setInsightGenerating(true);
    try {
      const generatedInsight = await generateRealWorldExample(selectedNode.label, selectedNode.desc);
      const updatedNode = { ...selectedNode, insight: generatedInsight };
      onNodeUpdated(updatedNode);
      setInsight(generatedInsight);
    } catch (e) {
      console.error(e);
      setGenError('Не удалось сгенерировать пример.');
    } finally {
      setInsightGenerating(false);
    }
  };

  if (!selectedNode) return null;

  // Parse Flashcards
  let displayContent = isELI5 ? (selectedNode.eli5Content || '') : (selectedNode.content || '');
  const flashcardRegex = /---FLASHCARD---\nTerm:\s*(.*?)\nDef:\s*(.*?)\n---/gs;
  const flashcards = [];
  let match;
  while ((match = flashcardRegex.exec(displayContent)) !== null) {
    flashcards.push({ term: match[1].trim(), definition: match[2].trim() });
  }
  displayContent = displayContent.replace(flashcardRegex, '').trim();

  return (
    <div className="flex-1 bg-surface border-l border-outline-variant shadow-2xl flex flex-col relative h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 md:p-6 border-b border-outline-variant bg-surface-container-lowest flex-shrink-0">
        <div>
          <span className="text-xs font-bold px-2 py-1 bg-primary/10 text-primary rounded-md mb-2 inline-block">
            {t(selectedCourse.title)}
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-on-surface line-clamp-1">{t(selectedNode.label)}</h2>
        </div>
        <div className="flex items-center gap-2">
          {selectedNode.content && (
            <>
              <button 
                onClick={handleRealWorldInsight}
                disabled={insightGenerating}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-full transition-colors font-medium text-sm border border-yellow-500/20 disabled:opacity-50"
                title="Зачем мне это знать?"
              >
                {insightGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />}
                <span className="hidden md:inline">Зачем мне это?</span>
              </button>

              <button 
                onClick={handleELI5Toggle}
                disabled={eli5Generating}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors font-medium text-sm border disabled:opacity-50 ${isELI5 ? 'bg-primary text-on-primary border-primary' : 'hover:bg-primary/10 text-primary border-primary/20'}`}
                title="Объясни как 5-летнему"
              >
                {eli5Generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Baby className="w-4 h-4" />}
                <span className="hidden md:inline">Просто о сложном</span>
              </button>
            </>
          )}

          {toggleZenMode && (
            <button 
              onClick={toggleZenMode}
              className="p-2 hover:bg-surface-container rounded-full text-on-surface-variant transition-colors flex-shrink-0"
              title={isZenMode ? "Свернуть" : "На весь экран"}
            >
              {isZenMode ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          )}
          <button 
            onClick={onClose}
            className="p-2 hover:bg-surface-container rounded-full text-on-surface-variant transition-colors flex-shrink-0"
            title="Закрыть"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto relative custom-scrollbar bg-surface">
        {selectedNode.content ? (
          <div className="flex flex-col min-h-full">
            {insight && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                className="mx-6 md:mx-10 mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex gap-4 items-start"
              >
                <div className="p-2 bg-yellow-500/20 rounded-xl text-yellow-600 dark:text-yellow-400">
                  <Lightbulb className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-yellow-800 dark:text-yellow-200 mb-1">Реальное применение</h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 leading-relaxed">{insight}</p>
                </div>
              </motion.div>
            )}

            <div className={`p-6 md:p-10 flex-1 w-full mx-auto prose dark:prose-invert prose-primary lg:prose-lg font-sans ${isZenMode ? 'max-w-3xl' : 'max-w-4xl'}`}>
              <ReactMarkdown>{displayContent}</ReactMarkdown>
              
              {flashcards.length > 0 && (
                <div className="mt-12 mb-8 not-prose">
                  <div className="flex items-center gap-3 mb-6">
                    <Sparkles className="w-6 h-6 text-primary" />
                    <h3 className="text-2xl font-bold text-on-surface m-0">Карточки для запоминания</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {flashcards.map((fc, i) => (
                      <Flashcard key={i} term={fc.term} definition={fc.definition} />
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Footer actions */}
            <div className="p-6 md:p-8 mt-auto border-t border-outline-variant bg-surface-container-lowest flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <p className="text-base font-bold text-on-surface mb-1">Завершили изучение материала?</p>
                <p className="text-sm text-on-surface-variant">Пройдите тест, чтобы закрепить знания и разблокировать следующие уроки.</p>
                {quizError && <p className="text-sm text-red-500 mt-2">{quizError}</p>}
                {genError && <p className="text-sm text-red-500 mt-2">{genError}</p>}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <button
                  onClick={handleOpenQuiz}
                  disabled={quizGenerating || selectedNode.status === 'completed'}
                  className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/25 whitespace-nowrap"
                >
                  {quizGenerating ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : selectedNode.status === 'completed' ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <BrainCircuit className="w-5 h-5" />
                  )}
                  {selectedNode.status === 'completed' ? 'Тест сдан' : 'Проверить знания'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
            <div className="max-w-md w-full bg-surface-container-lowest border border-outline-variant p-8 rounded-3xl shadow-xl flex flex-col items-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 border border-primary/20">
                {generating ? (
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                ) : (
                  <Sparkles className="w-10 h-10 text-primary" />
                )}
              </div>
              <h3 className="text-2xl font-bold text-on-surface mb-3">{t(selectedNode.label)}</h3>
              <p className="text-on-surface-variant mb-8 text-sm leading-relaxed">
                {t(selectedNode.desc)}
                <br/><br/>
                {generating ? 'Создаем персональный урок для вас...' : 'ИИ-ментор готовит материал...'}
              </p>
              
              {genError && (
                <>
                  <div className="w-full bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl mb-6 flex items-center gap-3 text-sm text-left">
                    <AlertCircle className="w-6 h-6 flex-shrink-0" />
                    <span>{genError}</span>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGenerateContent}
                    className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-primary/25 transition-all flex items-center justify-center gap-3"
                  >
                    Повторить попытку
                  </motion.button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <QuizModal 
        isOpen={quizOpen} 
        onClose={() => setQuizOpen(false)} 
        questions={quizData} 
        onComplete={handleQuizComplete} 
      />

      <UpgradeModal 
        isOpen={isUpgradeModalOpen} 
        onClose={() => setUpgradeModalOpen(false)} 
        onUpgrade={() => alert("Backend payment integration is pending.")} 
      />
    </div>
  );
}
