import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  BookOpen, 
  CheckCircle, 
  HelpCircle, 
  RefreshCw, 
  ChevronRight, 
  ChevronLeft, 
  AlertTriangle, 
  BookOpenCheck,
  Sparkles,
  Award
} from 'lucide-react';
import { auth } from '../firebase.js';
import { API_BASE_URL, fetcher, completeLessonOnBackend } from '../api.js';

// Custom lightweight Markdown renderer
function MarkdownRenderer({ content }) {
  if (!content) return null;
  
  const lines = content.split('\n');
  let insideCodeBlock = false;
  let codeContent = [];
  const elements = [];
  
  lines.forEach((line, idx) => {
    if (line.trim().startsWith('```')) {
      if (insideCodeBlock) {
        elements.push(
          <pre key={`code-${idx}`} className="bg-black/40 border border-white/5 rounded-xl p-4 font-mono text-xs overflow-x-auto my-4 text-emerald-400 shadow-inner">
            <code>{codeContent.join('\n')}</code>
          </pre>
        );
        codeContent = [];
        insideCodeBlock = false;
      } else {
        insideCodeBlock = true;
      }
      return;
    }
    
    if (insideCodeBlock) {
      codeContent.push(line);
      return;
    }
    
    const trimmed = line.trim();
    if (trimmed.startsWith('###')) {
      elements.push(<h4 key={idx} className="text-lg font-bold text-white mt-6 mb-3 tracking-tight">{trimmed.replace(/^###\s*/, '')}</h4>);
    } else if (trimmed.startsWith('##')) {
      elements.push(<h3 key={idx} className="text-xl font-bold text-white mt-8 mb-4 border-b border-white/10 pb-2 tracking-tight">{trimmed.replace(/^##\s*/, '')}</h3>);
    } else if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
      elements.push(
        <li key={idx} className="text-sm text-neutral-300 ml-6 list-disc my-1.5 font-light leading-relaxed">
          {trimmed.replace(/^[-*]\s*/, '')}
        </li>
      );
    } else if (trimmed.length > 0) {
      // Simple bold/italic regex fallback
      let parsedLine = trimmed
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
      
      elements.push(
        <p 
          key={idx} 
          className="text-sm text-neutral-300 font-light leading-relaxed my-4"
          dangerouslySetInnerHTML={{ __html: parsedLine }}
        />
      );
    }
  });
  
  return <div className="space-y-1">{elements}</div>;
}

export default function StudyRoom() {
  const { nodeId } = useParams();
  const navigate = useNavigate();
  const userId = auth.currentUser?.uid;

  const [lang, setLang] = useState('ru');
  const studyApiUrl = userId ? `${API_BASE_URL}/nodes/${nodeId}/content?userId=${userId}&lang=${lang}` : null;
  const { data: course, error, isLoading, mutate } = useSWR(studyApiUrl, fetcher);

  const [activeIdx, setActiveIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [courseCompleteOverlay, setCourseCompleteOverlay] = useState(false);

  // Reset quiz states when changing lessons
  useEffect(() => {
    setSelectedOption(null);
    setQuizSubmitted(false);
    setQuizCorrect(false);
  }, [activeIdx]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-on-background">
        <div className="text-center space-y-4">
          <RefreshCw className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="text-sm text-on-surface-variant font-medium">
            {lang === 'ru' ? 'Составляем программу обучения с помощью Gemini...' : 'Assembling dynamic learning curriculum via Gemini...'}
          </p>
        </div>
      </div>
    );
  }

  if (error || !course || !course.lessons) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-on-background px-6">
        <AlertTriangle className="w-12 h-12 text-error mb-4 opacity-75" />
        <h2 className="text-xl font-bold mb-2">
          {lang === 'ru' ? 'Ошибка генерации курса' : 'Error generating course'}
        </h2>
        <p className="text-sm text-on-surface-variant mb-6 text-center max-w-md">
          {error?.info || (lang === 'ru' 
            ? 'Не удалось связаться с сервисом генерации ИИ. Убедитесь, что GEMINI_API_KEY настроен в файле .env бэкенда.' 
            : 'Could not reach the AI generation service. Make sure GEMINI_API_KEY is configured in your backend .env.')}
        </p>
        <div className="flex gap-4">
          <button onClick={() => navigate('/graph')} className="px-5 py-2.5 bg-surface border border-outline-variant rounded-xl font-bold text-sm">
            {lang === 'ru' ? 'Назад к карте' : 'Back to Graph'}
          </button>
          <button onClick={() => mutate()} className="px-5 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-sm shadow">
            {lang === 'ru' ? 'Повторить попытку' : 'Retry Connection'}
          </button>
        </div>
      </div>
    );
  }

  const lessons = course.lessons;
  const completedLessons = course.completedLessons || [];
  const currentLesson = lessons[activeIdx];
  const quiz = currentLesson.quiz;

  const isCurrentCompleted = completedLessons.includes(currentLesson.id);

  const handleOptionSelect = (idx) => {
    if (quizSubmitted) return;
    setSelectedOption(idx);
  };

  const handleCheckAnswer = () => {
    if (selectedOption === null) return;
    const isCorrect = selectedOption === quiz.correctIndex;
    setQuizCorrect(isCorrect);
    setQuizSubmitted(true);
  };
  const handleCompleteLesson = async () => {
    if (!userId) return;
    setCompleting(true);
    try {
      await completeLessonOnBackend(nodeId, currentLesson.id, userId, lang);
      await mutate(); // Refresh course progress state
      if (activeIdx < lessons.length - 1) {
        // Go to next lesson
        setActiveIdx(prev => prev + 1);
      } else {
        // Last lesson completed! Trigger success overlay
        setCourseCompleteOverlay(true);
      }
    } catch (e) {
      console.error(e);
      alert('Error updating progress: ' + e.message);
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] text-gray-100 flex flex-col relative overflow-hidden">
      
      {/* Top Header */}
      <header className="h-16 border-b border-white/10 bg-black/60 backdrop-blur-md flex items-center justify-between px-6 z-10">
        <button 
          onClick={() => navigate('/graph')} 
          className="flex items-center gap-2 text-sm font-semibold text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> {lang === 'ru' ? 'Назад к карте' : 'Back to Graph'}
        </button>
        <div className="flex items-center gap-4">
          <div className="flex bg-neutral-900 border border-white/10 rounded-lg p-0.5">
            <button 
              onClick={() => setLang('ru')} 
              className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                lang === 'ru' ? 'bg-primary text-white shadow-sm' : 'text-neutral-500 hover:text-white'
              }`}
            >
              RU
            </button>
            <button 
              onClick={() => setLang('en')} 
              className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                lang === 'en' ? 'bg-primary text-white shadow-sm' : 'text-neutral-500 hover:text-white'
              }`}
            >
              EN
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold text-white tracking-tight hidden sm:inline">
              {lang === 'ru' ? 'ИИ Кабинет' : 'AI Workspace'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 relative z-10">
        
        {/* Left Theory Reading Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 border-r border-white/5">
          <div className="max-w-3xl mx-auto space-y-6">
            <div>
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                {lang === 'ru' ? `Урок ${activeIdx + 1} из ${lessons.length}` : `Lesson ${activeIdx + 1} of ${lessons.length}`}
              </span>
              <h1 className="text-3xl font-extrabold text-white mt-3 tracking-tight">{currentLesson.title}</h1>
            </div>

            {/* Render Theory Content */}
            <div className="bg-surface border border-outline-variant/50 rounded-3xl p-6 md:p-8 shadow-sm">
              <MarkdownRenderer content={currentLesson.content} />
            </div>

            {/* Interactive Quiz Box */}
            <div className="bg-surface-container/30 border border-outline-variant/60 rounded-3xl p-6 md:p-8">
              <h3 className="text-md font-bold text-white mb-6 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-400" /> {lang === 'ru' ? 'Тест для самопроверки' : 'Lesson Assessment Quiz'}
              </h3>

              <p className="text-sm text-neutral-200 mb-6 font-medium leading-relaxed">{quiz.question}</p>

              <div className="space-y-3">
                {quiz.options.map((opt, oIdx) => {
                  const isSelected = selectedOption === oIdx;
                  let optionClass = 'bg-surface border-outline-variant hover:border-white/20';
                  
                  if (quizSubmitted) {
                    if (oIdx === quiz.correctIndex) {
                      optionClass = 'bg-green-500/10 border-green-500 text-green-400';
                    } else if (isSelected) {
                      optionClass = 'bg-red-500/10 border-red-500 text-red-400';
                    } else {
                      optionClass = 'bg-surface/50 border-outline-variant/30 text-neutral-500 opacity-60';
                    }
                  } else if (isSelected) {
                    optionClass = 'bg-blue-500/10 border-blue-500 text-blue-400';
                  }

                  return (
                    <button
                      key={oIdx}
                      onClick={() => handleOptionSelect(oIdx)}
                      disabled={quizSubmitted}
                      className={`w-full text-left px-5 py-4 rounded-xl border text-sm font-medium transition-all ${optionClass}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons for Quiz */}
              <div className="mt-8 pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                
                {/* Result Feedback Text */}
                <div className="text-sm font-semibold flex-1">
                  {quizSubmitted && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={quizCorrect ? 'text-green-400' : 'text-red-400'}
                    >
                      {quizCorrect 
                        ? (lang === 'ru' ? '✔ Верный ответ!' : '✔ Correct Answer!') 
                        : (lang === 'ru' ? '❌ Неверно. Ознакомьтесь с объяснением ниже.' : '❌ Incorrect. Review explanation below.')}
                    </motion.div>
                  )}
                </div>

                {!quizSubmitted ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={selectedOption === null}
                    onClick={handleCheckAnswer}
                    className="px-6 py-3 bg-white text-black font-bold rounded-xl text-sm disabled:opacity-50 hover:bg-neutral-200 transition-colors shrink-0"
                  >
                    {lang === 'ru' ? 'Проверить ответ' : 'Submit Answer'}
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={(!quizCorrect && !isCurrentCompleted) || completing}
                    onClick={handleCompleteLesson}
                    className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shrink-0 ${
                      (quizCorrect || isCurrentCompleted) 
                        ? 'bg-primary text-on-primary hover:bg-primary/95 shadow-lg shadow-primary/20' 
                        : 'bg-neutral-800 text-neutral-500 cursor-not-allowed opacity-60'
                    }`}
                  >
                    {completing ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : activeIdx < lessons.length - 1 ? (
                      <><CheckCircle className="w-4 h-4" /> {lang === 'ru' ? 'Следующий урок' : 'Next Lesson'}</>
                    ) : (
                      <><Award className="w-4 h-4" /> {lang === 'ru' ? 'Завершить курс' : 'Complete Course'}</>
                    )}
                  </motion.button>
                )}
              </div>

              {/* Explanation section */}
              {quizSubmitted && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-6 p-4 rounded-xl bg-white/5 border border-white/5 text-xs text-neutral-400 leading-relaxed font-light"
                >
                  <span className="font-bold text-white uppercase block mb-1">
                    {lang === 'ru' ? 'Объяснение:' : 'Explanation:'}
                  </span>
                  {quiz.explanation}
                </motion.div>
              )}

            </div>
          </div>
        </main>

        {/* Right Sidebar navigation */}
        <aside className="w-full lg:w-80 bg-neutral-950/40 p-6 flex flex-col justify-between">
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpenCheck className="w-5 h-5 text-primary" /> {lang === 'ru' ? 'Список уроков' : 'Lessons Overview'}
            </h2>

            <div className="flex flex-col gap-2.5">
              {lessons.map((lesson, index) => {
                const isActive = activeIdx === index;
                const isCompleted = completedLessons.includes(lesson.id);

                return (
                  <button
                    key={lesson.id}
                    onClick={() => setActiveIdx(index)}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border text-sm font-semibold transition-all text-left ${
                      isActive 
                        ? 'bg-surface border-primary text-white shadow' 
                        : isCompleted
                          ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400'
                          : 'bg-surface/30 border-white/5 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] shrink-0 ${
                        isActive ? 'border-primary text-primary' : 'border-neutral-600 text-neutral-500'
                      }`}>
                        {index + 1}
                      </div>
                    )}
                    <span className="line-clamp-1">{lesson.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between text-xs text-neutral-500">
            <span>{lang === 'ru' ? 'Прогресс курса' : 'Course Progress'}</span>
            <span className="font-bold text-white">
              {Math.floor((completedLessons.length / lessons.length) * 100)}%
            </span>
          </div>
        </aside>

      </div>

      {/* Dynamic Course Completion Overlay Modal */}
      <AnimatePresence>
        {courseCompleteOverlay && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-surface border border-outline-variant max-w-md w-full rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-primary/10 blur-2xl rounded-full pointer-events-none"></div>
              
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                <Award className="w-10 h-10 text-emerald-400" />
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white tracking-tight">
                  {lang === 'ru' ? 'Курс завершен!' : 'Course Completed!'}
                </h3>
                <p className="text-sm text-neutral-400 font-light mt-2">
                  {lang === 'ru' 
                    ? 'Поздравляем! Вы прошли все уроки по этой теме. Новые темы на карте знаний теперь разблокированы!' 
                    : 'Congratulations! You have completed all lessons in this topic. The new nodes on your knowledge graph are now unlocked!'}
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/graph')}
                className="w-full py-3.5 bg-primary text-on-primary font-bold rounded-xl text-sm shadow hover:bg-primary/95 transition-all"
              >
                {lang === 'ru' ? 'Вернуться к карте знаний' : 'Return to Knowledge Graph'}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
