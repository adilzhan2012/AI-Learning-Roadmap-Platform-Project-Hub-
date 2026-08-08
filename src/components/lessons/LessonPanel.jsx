import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle,
  PlayCircle, 
  Loader2, 
  Sparkles, 
  AlertCircle, 
  BrainCircuit,
  X,
  Maximize2,
  Minimize2,
  Baby,
  Lightbulb,
  Clock
} from 'lucide-react';
import { t } from '../../i18n.js';
import { useNavigate } from 'react-router-dom';
import { useXP } from '../../hooks/useXP.js';
import { useQuiz } from '../../hooks/useQuiz.js';
import { usePlanLimits } from '../../hooks/usePlanLimits.js';
import QuizModal from '../quiz/QuizModal.jsx';
import UpgradeModal from '../shared/UpgradeModal.jsx';
import { generateLessonContent, updateNodeStatus, generateELI5Content, generateRealWorldExample, updateNodeFields, rebuildGraphForFailedNode, callGroqWithRetry } from '../../services/courseService.js';
// fix/critical-round1: санитизация user input перед вставкой в промпты
import { sanitizeUserInput, sanitizeCode } from '../../utils/sanitizeUserInput.js';
import { AIParsingError } from '../../utils/aiResponseParser.js';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import MermaidDiagram from '../shared/MermaidDiagram.jsx';
import Flashcard from './Flashcard.jsx';
import ContextualMentor from './ContextualMentor.jsx';
import HomeworkSection from './HomeworkSection.jsx';
import { markdownToSlides } from '../../services/courseService.js';
import SlideViewer from './SlideViewer.jsx';
import DynamicImage from './DynamicImage.jsx';
import SelectionPopover from '../shared/SelectionPopover.jsx';
import { useTextSelection } from '../../hooks/useTextSelection.js';
import MotivationalWidget from '../shared/MotivationalWidget.jsx';

const cleanContentText = (text) => {
  if (!text) return '';
  return text
    .replace(/---FLASHCARD---[\s\S]*?(?=(?:---FLASHCARD---|##|\n\s*\n\s*##|$))/gi, '')
    .replace(/\n\s*---\s*$/g, '')
    .replace(/\[IMAGE:.*?\]/gi, '')
    .trim();
};

export default function LessonPanel({ 
  selectedCourse, 
  selectedNode, 
  onClose,
  onNodeUpdated, // Callback when node content is generated or status changes to completed
  isZenMode,
  toggleZenMode,
  onQuizComplete
}) {
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  const { addXP } = useXP();
  
  // Quiz state
  const { generateQuiz, saveQuizResult, resetConsecutiveFails, generating: quizGenerating, error: quizError } = useQuiz();
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizData, setQuizData] = useState([]);
  const [failedConcepts, setFailedConcepts] = useState([]);
  const [consecutiveFailsCount, setConsecutiveFailsCount] = useState(0);

  const contentRef = useRef(null);
  const { plan, checkLimit, incrementUsage, usage } = usePlanLimits();
  const { selection, clear } = useTextSelection(contentRef);

  // Added missing states
  const [isELI5, setIsELI5] = useState(false);
  const [eli5Generating, setEli5Generating] = useState(false);
  const [insight, setInsight] = useState('');
  const [insightGenerating, setInsightGenerating] = useState(false);
  const [showSlides, setShowSlides] = useState(false);
  const [adaptationBanner, setAdaptationBanner] = useState(false);
  const [nonUltraAdaptationHint, setNonUltraAdaptationHint] = useState(false);
  const [practiceCode, setPracticeCode] = useState('');
  const [practiceAssignment, setPracticeAssignment] = useState('');
  const [reviewingCode, setReviewingCode] = useState(false);
  const [codeReviewResult, setCodeReviewResult] = useState('');
  const [generatingAssignment, setGeneratingAssignment] = useState(false);
  const [showPractice, setShowPractice] = useState(false);
  const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [isMobileMentorOpen, setIsMobileMentorOpen] = useState(false);

  const handleReviewSection = (headingText) => {
    if (!contentRef.current || !headingText) return;
    const elements = contentRef.current.querySelectorAll('h1, h2, h3, h4');
    const target = Array.from(elements).find(el => 
      el.textContent.toLowerCase().includes(headingText.toLowerCase()) || 
      headingText.toLowerCase().includes(el.textContent.toLowerCase())
    );

    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.classList.add('bg-indigo-500/20', 'rounded-lg', 'transition-all', 'duration-500');
      setTimeout(() => {
        target.classList.remove('bg-indigo-500/20');
      }, 3000);
    }
  };

  const handleGenerateContent = async () => {
    if (generating || !selectedNode || !selectedCourse) return;
    setGenerating(true);
    setGenError('');
    try {
      const content = await generateLessonContent(
        selectedCourse.id, 
        selectedNode.id, 
        selectedCourse.title, 
        selectedNode.label, 
        selectedNode.desc
      );
      if (content) {
        const updatedNode = { ...selectedNode, content };
        // Pass the updated node up so the UI re-renders with the new content
        onNodeUpdated(updatedNode, selectedCourse);
      }
    } catch (e) {
      console.error("Error generating lesson:", e);
      setGenError("Не удалось сгенерировать урок. Пожалуйста, попробуйте еще раз.");
    } finally {
      setGenerating(false);
    }
  };

  const handleOpenQuiz = async (forceFresh = false, customFailedConcepts = null) => {
    if (!selectedNode?.content) return;
    
    if (!checkLimit('ai_question')) {
      return;
    }

    const conceptsToPass = customFailedConcepts || failedConcepts;
    const questions = await generateQuiz(
      selectedCourse.id, 
      selectedNode.id, 
      selectedNode.content, 
      conceptsToPass,
      forceFresh || conceptsToPass.length > 0
    );

    if (questions) {
      await incrementUsage('ai_question');
      setQuizData(questions);
      setQuizOpen(true);
    }
  };

  const handleQuizComplete = async (score, total, passed, failedDetails = []) => {
    setQuizOpen(false);
    
    const saveRes = await saveQuizResult(selectedCourse.id, selectedNode.id, score, total, passed, failedDetails);
    
    if (saveRes) {
      setConsecutiveFailsCount(saveRes.consecutiveFails || 0);
    }

    if (failedDetails && failedDetails.length > 0) {
      const newConcepts = failedDetails.map(d => d.sectionHeading || d.questionText);
      setFailedConcepts(newConcepts);
    }

    if (onQuizComplete) {
      onQuizComplete();
    }
    
    if (passed) {
      setFailedConcepts([]);
      setNonUltraAdaptationHint(false);
      await addXP(25, 'Пройден квиз', 'quiz_passed', { nodeId: selectedNode.id });
      if (score === total) {
        await addXP(50, 'Идеальный результат', 'quiz_perfect', { nodeId: selectedNode.id });
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
    } else {
      if (plan === 'ULTRA') {
        setAdaptationBanner(true);
        try {
          const updatedCourse = await rebuildGraphForFailedNode(selectedCourse.id, selectedNode.id);
          if (updatedCourse) {
            const updatedNode = updatedCourse.nodes.find(n => n.id === selectedNode.id);
            if (updatedNode) {
              onNodeUpdated(updatedNode, updatedCourse);
            }
          }
        } catch (e) {
          console.error("Adaptive graph rebuild failed:", e);
        }
      } else {
        // UI signal for FREE/PRO users instead of silent no-op/console.warn
        setNonUltraAdaptationHint(true);
      }
    }
  };

  const handleRunCodeReview = async () => {
    if (!practiceCode.trim() || reviewingCode) return;
    setReviewingCode(true);
    setCodeReviewResult('');
    try {
      const prompt = `You are an expert software developer and security auditor.
Analyze the following code submitted by a student for the lesson: "${sanitizeUserInput(selectedNode.label, 200)}".
Topic description: "${sanitizeUserInput(selectedNode.desc, 400)}"
Practice assignment: "${sanitizeUserInput(practiceAssignment, 500)}"

Student Code:
\`\`\`
${sanitizeCode(practiceCode)}
\`\`\`

INSTRUCTIONS:
Provide a thorough code review.
1. "passed": boolean (true ONLY if the student's code is correct, compiles logically, and satisfies the assignment without critical bugs; false otherwise).
2. "feedback": A detailed code review in Russian formatted in Markdown including:
   - **Корректность и логика**: Проверьте на синтаксические и логические ошибки.
   - **Стиль и стандарты (Code-Style)**: Оцените читаемость и стиль.
   - **Безопасность и уязвимости**: Укажите на возможные баги или состояния гонки.
   - **Вердикт**: Окончательный вердикт (Пройдено / Не пройдено) и краткое резюме.

Return ONLY a valid JSON object:
{
  "passed": true,
  "feedback": "Full markdown text of code review..."
}`;

      const result = await callGroqWithRetry(null, prompt, 'ai_question');
      let parsed;
      try {
        parsed = parseAIJson(result);
      } catch (parseErr) {
        const isPassed = /пройдено/i.test(result) && !/не пройдено/i.test(result);
        parsed = { passed: isPassed, feedback: result };
      }

      const feedbackText = parsed.feedback || result;
      setCodeReviewResult(feedbackText);

      // Award XP ONLY if verdict is passed (true)
      if (parsed.passed) {
        await addXP(40, 'AI Code Review пройден', 'code_review_passed', { nodeId: selectedNode.id });
      }
    } catch (e) {
      console.error(e);
      if (e instanceof AIParsingError || e?.name === 'AIParsingError') {
        setCodeReviewResult('❌ Не удалось обработать ответ от ИИ при проверке кода. Пожалуйста, попробуйте еще раз.');
      } else {
        setCodeReviewResult('❌ Не удалось сгенерировать рецензию ИИ. Пожалуйста, попробуйте еще раз.');
      }
    } finally {
      setReviewingCode(false);
    }
  };

  const generatePracticeAssignment = async () => {
    setGeneratingAssignment(true);
    try {
      const prompt = `You are a technical mentor. Generate a short, realistic, 1-paragraph programming exercise in the Russian language matching this lesson's topic: "${selectedNode.label}" (${selectedNode.desc}). Focus on core Go concepts.
Provide a code boilerplate template at the end.`;
      const result = await callGroqWithRetry(null, prompt, 'ai_question');
      setPracticeAssignment(result);
    } catch (e) {
      console.error(e);
      setPracticeAssignment('Напишите простую функцию на Go, демонстрирующую концепты этого урока.');
    } finally {
      setGeneratingAssignment(false);
    }
  };

  const handleExportNotion = () => {
    const header = `# ${selectedNode.label}\n\n`;
    const cleanContent = cleanContentText(selectedNode.content);
    const blob = new Blob([header + cleanContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${selectedNode.label.replace(/\s+/g, '_')}_notion.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportHomework = () => {
    const homeworkRegex = /##\s*(?:Практика|Домашнее задание|Homework)[\s\S]*/i;
    const cleanContent = cleanContentText(selectedNode.content);
    const hwMatch = cleanContent.match(homeworkRegex);
    
    let hwText = hwMatch ? hwMatch[0] : "Практическое задание для этого урока не сгенерировано.";
    const header = `# Практика: ${selectedNode.label}\n\n`;
    const blob = new Blob([header + hwText], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Practice_${selectedNode.label.replace(/\s+/g, '_')}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportAnki = () => {
    if (flashcards.length === 0) return;
    let csvContent = "Question;Answer\n";
    flashcards.forEach(fc => {
      const q = fc.term.replace(/"/g, '""');
      const a = fc.definition.replace(/"/g, '""');
      csvContent += `"${q}";"${a}"\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${selectedNode.label.replace(/\s+/g, '_')}_anki.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      const rawNodeId = selectedNode.rawNodeId || selectedNode.id;
      const simplified = await generateELI5Content(selectedNode.content, selectedCourse?.courseTemplateId, rawNodeId);
      const updatedNode = { ...selectedNode, eli5Content: simplified };
      onNodeUpdated(updatedNode);
      setIsELI5(true);
      await updateNodeFields(selectedCourse.id, selectedNode.id, { eli5Content: simplified });
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
      await updateNodeFields(selectedCourse.id, selectedNode.id, { insight: generatedInsight });
    } catch (e) {
      console.error(e);
      setGenError('Не удалось сгенерировать пример.');
    } finally {
      setInsightGenerating(false);
    }
  };

  const handleOpenSlides = async () => {
    if (!selectedNode?.content) return;
    if (selectedNode.slides && selectedNode.slides.length > 0) {
      setShowSlides(true);
      return;
    }
    const generatedSlides = markdownToSlides(selectedNode.content);
    if (generatedSlides.length === 0) return;
    try {
      const updatedNode = { ...selectedNode, slides: generatedSlides };
      onNodeUpdated(updatedNode);
      await updateNodeFields(selectedCourse.id, selectedNode.id, { slides: generatedSlides });
    } catch (e) {
      console.error("Error saving slides", e);
    }
    setShowSlides(true);
  };

  if (!selectedNode) return null;

  // Parse Flashcards
  let displayContent = isELI5 ? (selectedNode.eli5Content || '') : (selectedNode.content || '');
  const flashcardRegex = /---FLASHCARD---\s*(?:Term|Термин)\s*:\s*(.*?)\s*(?:Def|Definition|Определение|Объяснение)\s*:\s*(.*?)(?=\s*---FLASHCARD---|\s*---|\s*##|\s*$)/gi;
  const flashcards = [];
  let match;
  while ((match = flashcardRegex.exec(displayContent)) !== null) {
    const term = match[1].replace(/---+$/, '').trim();
    const definition = match[2].replace(/---+$/, '').trim();
    if (term && definition) {
      flashcards.push({ term, definition });
    }
  }

  // Parse Images
  const imageRegex = /\[IMAGE:\s*(.*?)\]/gi;
  const images = [];
  let imgMatch;
  while ((imgMatch = imageRegex.exec(displayContent)) !== null) {
    images.push(imgMatch[1].trim());
  }

  // Reliably strip all raw tags and delimiters
  displayContent = cleanContentText(displayContent);

  // Calculate Reading Time
  const wordCount = displayContent.split(/\s+/).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  const isCodingCourse = selectedCourse && (
    selectedCourse.title.toLowerCase().includes('go') ||
    selectedCourse.title.toLowerCase().includes('python') ||
    selectedCourse.title.toLowerCase().includes('rust') ||
    selectedCourse.title.toLowerCase().includes('compiler') ||
    selectedCourse.title.toLowerCase().includes('разработ') ||
    selectedCourse.title.toLowerCase().includes('программ') ||
    selectedCourse.title.toLowerCase().includes('code') ||
    selectedCourse.title.toLowerCase().includes('js') ||
    selectedCourse.title.toLowerCase().includes('c++') ||
    selectedCourse.title.toLowerCase().includes('java')
  );

  return (
    <div className="flex w-full h-full bg-background overflow-hidden">
      <div className="flex-1 border-l border-white/10 shadow-2xl flex flex-col relative h-full text-zinc-300 min-w-0 min-h-0 overflow-hidden">
        {/* Header */}
      <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/10 bg-background flex-shrink-0">
        <div>
          <span className="text-xs font-bold px-2 py-1 bg-primary/10 text-primary rounded-md mb-2 inline-block">
            {t(selectedCourse.title)}
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1">{t(selectedNode.label)}</h2>
        </div>
        <div className="flex items-center gap-2">
          {selectedNode.content && (
            <>
              {/* Notion/Anki Export */}
              {plan === 'ULTRA' && (
                <div className="relative group flex-shrink-0">
                  <button 
                    className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 rounded-full transition-colors font-medium text-sm"
                    title="Экспорт урока"
                  >
                    <span>📥 Экспорт</span>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-surface border border-white/10 rounded-xl py-1.5 shadow-xl hidden group-hover:block z-50 text-left">
                    <button 
                      onClick={handleExportNotion}
                      className="w-full text-left px-4 py-2 hover:bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-200 transition-colors"
                    >
                      📓 Экспорт конспекта (.md)
                    </button>
                    <button 
                      onClick={handleExportHomework}
                      className="w-full text-left px-4 py-2 hover:bg-zinc-100 dark:bg-zinc-800 text-xs text-emerald-400 font-bold transition-colors"
                    >
                      💻 Скачать ДЗ (.md)
                    </button>
                    {flashcards.length > 0 && (
                      <button 
                        onClick={handleExportAnki}
                        className="w-full text-left px-4 py-2 hover:bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-200 transition-colors"
                      >
                        📇 Карточки в Anki (.csv)
                      </button>
                    )}
                  </div>
                </div>
              )}

              <button 
                onClick={() => setIsMobileMentorOpen(true)}
                className="lg:hidden flex items-center gap-2 px-3 py-1.5 hover:bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 rounded-full transition-colors font-medium text-sm"
                title="Ментор"
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden md:inline">Ментор</span>
              </button>

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
                onClick={() => alert('В разработке! Опция "Просто о сложном" скоро будет добавлена.')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors font-medium text-sm border opacity-70 hover:bg-primary/10 text-primary border-primary/20`}
                title="Объясни как 5-летнему (В разработке)"
              >
                <Baby className="w-4 h-4" />
                <span className="hidden md:inline">Просто о сложном (Скоро)</span>
              </button>

              <button 
                onClick={() => alert('В разработке! Слайды скоро будут добавлены.')}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-100 dark:bg-zinc-800 rounded-full transition-colors font-medium text-sm border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 opacity-70"
                title="Слайды (В разработке)"
              >
                <PlayCircle className="w-4 h-4" />
                <span className="hidden md:inline">Слайды (Скоро)</span>
              </button>
            </>
          )}

          {toggleZenMode && (
            <button 
              onClick={toggleZenMode}
              className="p-2 hover:bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-500 dark:text-zinc-400 transition-colors flex-shrink-0"
              title={isZenMode ? "Свернуть" : "На весь экран"}
            >
              {isZenMode ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          )}
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-500 dark:text-zinc-400 transition-colors flex-shrink-0"
            title="Закрыть"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto relative custom-scrollbar bg-background text-left">
        {selectedNode.content ? (
          <div className="flex flex-col min-h-full">
            {adaptationBanner && (
              <div className="mx-6 md:mx-10 mt-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex gap-3 items-center text-xs text-indigo-300">
                <span>🧬 <strong>AI-Наставник:</strong> Обнаружены пробелы по теме. Граф знаний перестроен, добавлен микро-модуль для закрытия пробелов.</span>
                <button onClick={() => setAdaptationBanner(false)} className="ml-auto text-indigo-400 hover:text-zinc-900 dark:text-zinc-100">✕</button>
              </div>
            )}

            {nonUltraAdaptationHint && (
              <div className="mx-6 md:mx-10 mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-3 items-center text-xs text-amber-300">
                <span>⚡ <strong>Адаптивный курс:</strong> Автоматическая перестройка графа и подбор микро-модулей для закрытия пробелов доступны на подписке ULTRA.</span>
                <button 
                  type="button"
                  onClick={() => setUpgradeModalOpen(true)}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-[11px] shrink-0 transition-colors ml-auto"
                >
                  Улучшить
                </button>
                <button onClick={() => setNonUltraAdaptationHint(false)} className="text-amber-400 hover:text-zinc-900 dark:text-zinc-100">✕</button>
              </div>
            )}

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

            <div className={`p-8 md:p-12 flex-1 w-full mx-auto prose dark:prose-invert prose-primary prose-base md:prose-lg prose-p:leading-[1.8] prose-li:leading-[1.8] tracking-normal font-sans max-w-none`}>
              <MotivationalWidget variant="lesson" />

              <div className="flex items-center gap-2 mb-6 opacity-70 border-b border-white/10 pb-4">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium tracking-wide">Время на чтение: ~{readingTime} мин</span>
              </div>
              
              {images.map((keyword, idx) => <DynamicImage key={idx} keyword={keyword} />)}

              <div ref={contentRef} className="relative">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      if (!inline && match && match[1] === 'mermaid') {
                        return <MermaidDiagram chart={String(children).replace(/\n$/, '')} />;
                      }
                      return (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    }
                  }}
                >
                  {displayContent}
                </ReactMarkdown>
                {selection && (
                  <SelectionPopover
                    selection={selection}
                    context={{ topic: selectedCourse.title, nodeDesc: selectedNode.desc }}
                    onClose={clear}
                    onAskMentor={(sel, q, ans) => {
                      clear();
                      onClose();
                      window.dispatchEvent(new CustomEvent('mentor:open', { 
                        detail: { 
                          prompt: `У меня вопрос по теме "${selectedCourse.title}" -> "${selectedNode.label}".\nЯ выделил текст: "${sel}"\nМой вопрос: "${q}"\nОтвет ИИ: "${ans}"\n\nДавай обсудим это подробнее.` 
                        } 
                      }));
                    }}
                  />
                )}
              </div>
            </div>

            {/* ULTRA Code Practice and AI Code Review Workspace */}
            {plan === 'ULTRA' && isCodingCourse && (
              <div className="mx-6 md:mx-10 mb-8 p-6 bg-slate-950/40 border border-indigo-500/20 rounded-2xl not-prose text-left">
                <div className="flex items-center justify-between mb-4 border-b border-indigo-500/10 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">💻</span>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 m-0">Практическая зона: AI Code Review</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPractice(!showPractice);
                      if (!showPractice && !practiceAssignment) {
                        generatePracticeAssignment();
                      }
                    }}
                    className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 rounded-lg text-xs font-bold transition-all border border-indigo-500/25"
                  >
                    {showPractice ? 'Свернуть практику' : 'Открыть практику'}
                  </button>
                </div>

                {showPractice && (
                  <div className="space-y-4">
                    {generatingAssignment ? (
                      <div className="flex items-center gap-2 text-zinc-400 text-xs italic">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                        Составляем задание...
                      </div>
                    ) : (
                      <div className="bg-indigo-950/20 border border-indigo-500/5 p-4 rounded-xl text-zinc-300 text-xs leading-relaxed">
                        <strong>Задание:</strong> {practiceAssignment || 'Напишите код на Go, решающий задачу из данного урока. Нажмите "Отправить на AI Code Review", чтобы получить полный аудит от AI.'}
                      </div>
                    )}

                    <div className="relative">
                      <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1 font-bold">Код (Go / Другое)</label>
                      <textarea
                        rows={12}
                        value={practiceCode}
                        onChange={(e) => setPracticeCode(e.target.value)}
                        className="w-full bg-surface border border-white/10 rounded-xl p-4 text-xs font-mono text-emerald-400 focus:outline-none focus:border-indigo-500 transition-colors leading-relaxed"
                        style={{ tabSize: 4 }}
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        disabled={reviewingCode || generatingAssignment}
                        onClick={handleRunCodeReview}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                      >
                        {reviewingCode ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Код-ревью в процессе...
                          </>
                        ) : (
                          <>
                            <span>Отправить на AI Code Review</span>
                            <Sparkles className="w-3.5 h-3.5 text-white" />
                          </>
                        )}
                      </button>
                    </div>

                    {codeReviewResult && (
                      <div className="bg-indigo-950/10 border border-indigo-500/10 p-5 rounded-xl text-zinc-300 text-xs leading-relaxed text-left mt-4">
                        <div className="flex items-center gap-1.5 mb-3 border-b border-indigo-500/10 pb-2">
                          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Результат AI Code Review</span>
                        </div>
                        <div className="prose prose-invert prose-xs text-left">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {codeReviewResult}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Interactive Homework Section */}
            {selectedCourse && selectedNode && selectedNode.content && (
              <HomeworkSection
                courseId={selectedCourse.id}
                nodeId={selectedNode.id}
                lessonContent={selectedNode.content}
                topicLabel={selectedNode.label}
                topicDesc={selectedNode.desc}
              />
            )}

            {/* Footer actions */}
            <div className="p-6 md:p-8 mt-auto border-t border-white/10 bg-background flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <p className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">Завершили изучение материала?</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Пройдите тест, чтобы закрепить знания и разблокировать следующие уроки.</p>
                {quizError && (
                  <div className="mt-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 text-xs text-rose-300">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span className="flex-1">{quizError}</span>
                    <button
                      type="button"
                      onClick={() => handleOpenQuiz(true)}
                      disabled={quizGenerating}
                      className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 rounded-lg text-xs font-bold text-rose-200 shrink-0 transition-colors cursor-pointer"
                    >
                      Попробовать снова
                    </button>
                  </div>
                )}
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
                  {selectedNode.status === 'completed' ? 'Материал закреплен' : 'Закрепить знания'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center z-50 bg-background/90 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-md w-full bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-100 dark:border-indigo-500/20 p-10 rounded-[2rem] shadow-2xl flex flex-col items-center relative overflow-hidden"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute -top-12 -right-12 text-indigo-500/5 dark:text-indigo-400/5"
              >
                <Sparkles className="w-48 h-48" />
              </motion.div>

              <motion.div 
                animate={generating ? { y: [0, -10, 0] } : {}}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-6 relative z-10"
              >
                {generating ? (
                  <Sparkles className="w-10 h-10 text-white" />
                ) : (
                  <BrainCircuit className="w-10 h-10 text-white" />
                )}
              </motion.div>
              
              <h3 className="text-xl font-bold font-clash text-zinc-900 dark:text-white mb-3 relative z-10 leading-tight">
                {generating ? 'Создаем персональный урок...' : t(selectedNode.label)}
              </h3>
              
              <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed relative z-10">
                {generating ? (
                  <p>Искусственный интеллект анализирует материал и готовит индивидуальную программу...</p>
                ) : (
                  <p>{t(selectedNode.desc)}</p>
                )}
              </div>

              {generating && (
                <div className="flex justify-center gap-2.5 relative z-10 mb-4">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="w-2.5 h-2.5 rounded-full bg-indigo-500"
                      animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              )}

              
              {genError && (
                <div className="w-full relative z-10">
                  <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl mb-6 flex items-center gap-3 text-sm text-left">
                    <AlertCircle className="w-6 h-6 flex-shrink-0" />
                    <span>{genError}</span>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGenerateContent}
                    className="w-full bg-primary text-on-primary py-3.5 rounded-xl font-bold text-sm shadow-lg hover:shadow-primary/25 transition-all flex items-center justify-center gap-2"
                  >
                    Повторить попытку
                  </motion.button>
                </div>
              )}
              
              {!generating && !genError && (
                <motion.button 
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGenerateContent}
                  className="w-full relative z-10 bg-on-surface text-inverse-on-surface py-3.5 rounded-xl font-bold text-sm shadow-xl transition-all flex items-center justify-center gap-2 font-sans"
                >
                  <Sparkles className="w-4 h-4" />
                  Сгенерировать урок
                </motion.button>
              )}
            </motion.div>
          </div>
        )}
      </div>

      <QuizModal 
        isOpen={quizOpen} 
        onClose={() => setQuizOpen(false)} 
        questions={quizData} 
        flashcards={flashcards}
        onComplete={handleQuizComplete} 
        onForceRetry={(failedDetails) => handleOpenQuiz(true, failedDetails?.map(d => d.sectionHeading || d.questionText))}
        onReviewSection={handleReviewSection}
        onAskMentor={(questionText, userAnswer, correctAnswer, explanation) => {
          setQuizOpen(false);
          onClose(); // Close lesson panel
          window.dispatchEvent(new CustomEvent('mentor:open', { 
            detail: { 
              prompt: `Я прохожу тест по теме "${selectedNode.label}". Я ошибся в вопросе:\n"${questionText}"\nМой ответ: "${userAnswer}"\nПравильный ответ: "${correctAnswer}"\nПояснение: "${explanation}"\n\nОбъясни мне, пожалуйста, простыми словами, почему мой ответ неверный и как правильно рассуждать в этом случае.` 
            } 
          }));
        }}
      />

      <UpgradeModal 
        isOpen={isUpgradeModalOpen} 
        onClose={() => setUpgradeModalOpen(false)} 
        onUpgrade={() => navigate('/pricing')} 
      />

      {/* Slide Viewer Overlay */}
      {showSlides && (
        <SlideViewer
          slides={selectedNode.slides || markdownToSlides(selectedNode.content || '')}
          onClose={() => setShowSlides(false)}
        />
      )}
      </div>

      {/* Contextual AI Mentor Panel (Hidden in Zen Mode) */}
      {!isZenMode && (
        <div className={`
          fixed inset-0 z-50 lg:static lg:block
          ${isMobileMentorOpen ? 'block' : 'hidden'}
        `}>
          <ContextualMentor 
            selectedNode={selectedNode}
            selectedCourse={selectedCourse}
            plan={plan}
            usage={usage}
            checkLimit={checkLimit}
            incrementUsage={incrementUsage}
            setUpgradeModalOpen={setUpgradeModalOpen}
            onClose={() => setIsMobileMentorOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
