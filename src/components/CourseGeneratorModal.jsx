import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, Sparkles, Loader2, X, ChevronRight, ChevronLeft, 
  Settings, Lock, FileText, Video, Target, Compass, 
  Zap, Clock, BookOpen, User, Briefcase
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { generateCourseAndSave } from '../services/courseService.js';
import { t, useLocale } from '../i18n.js';
import { usePlanLimits } from '../hooks/usePlanLimits.js';

export default function CourseGeneratorModal({ isOpen, onClose, userUid }) {
  const navigate = useNavigate();
  const locale = useLocale();
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');

  // Step 1: Topic & RAG
  const [generationMode, setGenerationMode] = useState('topic'); // 'topic' | 'rag'
  const [ragType, setRagType] = useState('pdf'); // 'pdf' | 'url'
  const [topic, setTopic] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Step 2: Level & Prerequisites
  const [level, setLevel] = useState('Beginner'); // Beginner, Intermediate, Advanced
  const [prerequisites, setPrerequisites] = useState('');

  // Step 3: Goal & Need
  const [goal, setGoal] = useState('Interview'); // Interview, Project, General
  const [customGoal, setCustomGoal] = useState('');

  // Step 4: Depth & Time
  const [duration, setDuration] = useState('Express'); // Express, Standard, Deep Dive
  const [dailyTime, setDailyTime] = useState('15m'); // '15m' | '30m' | '60m'

  // Step 5: Focus & Retention
  const [focus, setFocus] = useState('Theory'); // Theory, Practice, Code
  const [tone, setTone] = useState('Academic'); // Academic, Friendly, Gamified
  const [flashcardCount, setFlashcardCount] = useState('3'); // '3' | '5' | '8'

  const { plan, checkLimit, incrementUsage, isUpgradeModalOpen, setUpgradeModalOpen } = usePlanLimits();
  const [upgradeReason, setUpgradeReason] = useState(null);

  const hasApiKey = true;

  const handleNext = () => {
    // Validation per step
    if (step === 1) {
      if (generationMode === 'topic' && topic.trim().length < 2) {
        setGenError(locale === 'ru' ? 'Введите корректную тему курса.' : 'Enter a valid course topic.');
        return;
      }
      if (generationMode === 'rag' && ragType === 'pdf' && !uploadedFileName) {
        setGenError(locale === 'ru' ? 'Загрузите PDF файл.' : 'Upload a PDF file.');
        return;
      }
      if (generationMode === 'rag' && ragType === 'url' && !youtubeUrl.trim()) {
        setGenError(locale === 'ru' ? 'Вставьте ссылку.' : 'Paste a valid link.');
        return;
      }
    }
    
    if (step === 2) {
      const isLocked = (level === 'Advanced' && plan !== 'ULTRA') || (level === 'Intermediate' && plan === 'FREE');
      if (isLocked) {
        setUpgradeReason(level === 'Advanced' ? 'level_advanced' : 'level_intermediate');
        setUpgradeModalOpen(true);
        return;
      }
    }

    setGenError('');
    if (step < totalSteps) {
      setStep(s => s + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(s => s - 1);
  };

  const handleGenerate = async () => {
    let finalTopic = topic.trim();
    
    if (plan === 'ULTRA' && generationMode === 'rag') {
      if (!finalTopic) {
        finalTopic = ragType === 'pdf' 
          ? `Курс на основе: ${uploadedFileName || 'книги'}` 
          : `Курс на основе: YouTube лекции`;
      }
    }

    if (!checkLimit('roadmap')) {
      setUpgradeReason('limit');
      setUpgradeModalOpen(true);
      return;
    }

    setGenError('');
    setGenerating(true);

    try {
      const actualGoal = customGoal.trim() ? customGoal.trim() : goal;
      
      const preferences = {
        duration, focus, goal: actualGoal, tone, prerequisites,
        dailyTime, flashcardCount, courseStyle: tone
      };
        
      if (plan === 'ULTRA' && generationMode === 'rag') {
        preferences.ragMode = true;
        preferences.ragType = ragType;
        preferences.source = ragType === 'pdf' ? uploadedFileName : youtubeUrl;
      }

      const generated = await generateCourseAndSave(userUid, finalTopic, level, preferences);
      await incrementUsage('roadmap');
      
      // Reset state
      setTopic(''); setLevel('Beginner'); setStep(1); setUploadedFileName(''); setYoutubeUrl('');
      
      onClose();
      localStorage.setItem('selected_course_id', generated.id);
      navigate('/graph');
    } catch (err) {
      console.error(err);
      if (err.message === 'MISSING_API_KEY') {
        setGenError(t('settings.profile.apiKeyMissing'));
      } else if (err.message === 'API_OVERLOADED') {
        setGenError('The Groq API is currently experiencing extremely high demand. Please try again in a few minutes.');
      } else {
        setGenError(err.message || 'Failed to generate course. Please try again.');
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      setUploadedFileName(e.dataTransfer.files[0].name);
    }
  };

  // --- RENDERING WIZARD STEPS ---

  const renderStep1 = () => (
    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-5">
      <div className="mb-2">
        <h4 className="text-lg font-bold text-on-surface">Что будем изучать?</h4>
        <p className="text-xs text-on-surface-variant">Введите тему или загрузите свои материалы (для ULTRA).</p>
      </div>

      {plan === 'ULTRA' && (
        <div className="bg-surface-container-high border border-outline-variant p-1 rounded-xl flex gap-1 text-xs shrink-0 select-none">
          <button type="button" onClick={() => setGenerationMode('topic')} className={`flex-1 py-2 font-bold rounded-lg transition-all ${generationMode === 'topic' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}>
            💡 Своя тема
          </button>
          <button type="button" onClick={() => setGenerationMode('rag')} className={`flex-1 py-2 font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${generationMode === 'rag' ? 'bg-indigo-600 text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface animate-pulse'}`}>
            <Sparkles className="w-3 h-3 text-indigo-300" /> Из материалов
          </button>
        </div>
      )}

      {plan === 'ULTRA' && generationMode === 'rag' ? (
        <div className="bg-indigo-950/20 border border-indigo-500/20 p-4 rounded-2xl space-y-4 text-left">
          <div className="flex gap-2 text-xs">
            <button type="button" onClick={() => setRagType('pdf')} className={`px-3 py-1.5 rounded-lg border font-bold flex items-center gap-1 transition-all ${ragType === 'pdf' ? 'bg-indigo-600 border-indigo-500 text-on-surface' : 'bg-surface-container border-outline-variant text-zinc-400'}`}>
              <FileText className="w-3.5 h-3.5" /> PDF / Документ
            </button>
            <button type="button" onClick={() => setRagType('url')} className={`px-3 py-1.5 rounded-lg border font-bold flex items-center gap-1 transition-all ${ragType === 'url' ? 'bg-indigo-600 border-indigo-500 text-on-surface' : 'bg-surface-container border-outline-variant text-zinc-400'}`}>
              <Video className="w-3.5 h-3.5" /> YouTube / Ссылка
            </button>
          </div>
          {ragType === 'pdf' ? (
            <div onDragOver={e => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop} className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all ${isDragging ? 'border-indigo-400 bg-indigo-500/10' : 'border-indigo-500/25 bg-surface-container-lowest hover:bg-surface-container'}`} onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = '.pdf,.txt,.doc,.docx'; input.onchange = (e) => { if (e.target.files.length > 0) setUploadedFileName(e.target.files[0].name); }; input.click(); }}>
              <FileText className="w-8 h-8 text-indigo-400 mb-2" />
              <p className="text-[11px] font-bold text-center text-zinc-300">{uploadedFileName ? `Выбран файл: ${uploadedFileName}` : 'Перетащите PDF сюда или нажмите для выбора'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-[10px] text-zinc-400 font-bold block">Ссылка на лекцию</label>
              <input type="text" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." className="w-full bg-surface-container border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:border-indigo-500" />
            </div>
          )}
        </div>
      ) : (
        <div>
          <label className="block text-sm font-bold text-on-surface mb-2">Название темы</label>
          <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') handleNext(); }} placeholder="Например: Архитектура высоконагруженных систем" className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-4 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-200 font-medium" />
        </div>
      )}
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-5">
      <div className="mb-2">
        <h4 className="text-lg font-bold text-on-surface">Точка А: Ваш текущий уровень</h4>
        <p className="text-xs text-on-surface-variant">От этого зависит, насколько базовые концепции будет объяснять ИИ.</p>
      </div>

      <div className="space-y-3">
        {[
          { id: 'Beginner', title: 'Абсолютный новичок', desc: 'Ничего не знаю в этой теме, нужно с самых основ.', icon: <User className="w-5 h-5 text-emerald-400" /> },
          { id: 'Intermediate', title: 'Базовое понимание', desc: 'Знаком с теорией, но мало практики. Нужна структура.', icon: <BookOpen className="w-5 h-5 text-amber-400" /> },
          { id: 'Advanced', title: 'Практик (Продвинутый)', desc: 'Уже работаю с этим, нужно углубить знания под капотом.', icon: <Zap className="w-5 h-5 text-rose-400" /> }
        ].map(lvl => {
          const isLocked = (lvl.id === 'Advanced' && plan !== 'ULTRA') || (lvl.id === 'Intermediate' && plan === 'FREE');
          return (
            <div 
              key={lvl.id} 
              onClick={() => { if (!isLocked) setLevel(lvl.id); else { setUpgradeReason(lvl.id === 'Advanced' ? 'level_advanced' : 'level_intermediate'); setUpgradeModalOpen(true); } }}
              className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-4 ${level === lvl.id ? 'bg-primary/10 border-primary shadow-sm' : 'bg-surface-container border-outline-variant hover:bg-surface-container-high'}`}
            >
              <div className={`p-2 rounded-lg ${level === lvl.id ? 'bg-primary/20' : 'bg-surface-container-high'}`}>
                {lvl.icon}
              </div>
              <div className="flex-1">
                <h5 className="font-bold text-sm text-on-surface flex items-center gap-2">
                  {lvl.title} {isLocked && <Lock className="w-3.5 h-3.5 text-on-surface-variant/60" />}
                </h5>
                <p className="text-xs text-on-surface-variant mt-0.5">{lvl.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-2">
        <label className="block text-xs font-bold text-on-surface-variant mb-2">Что вы уже точно знаете? (ИИ пропустит это)</label>
        <input type="text" value={prerequisites} onChange={e => setPrerequisites(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') handleNext(); }} placeholder="Например: знаю Python, базовую математику" className="w-full bg-surface-container border border-outline-variant rounded-lg px-4 py-3 text-sm text-on-surface focus:ring-1 focus:ring-primary" />
      </div>
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-5">
      <div className="mb-2">
        <h4 className="text-lg font-bold text-on-surface">Точка Б: Глобальная цель</h4>
        <p className="text-xs text-on-surface-variant">Зачем вам этот курс? Это определит фокус уроков.</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {[
          { id: 'Interview', title: 'Подготовка к собеседованию', desc: 'Упор на теорию, частые вопросы и алгоритмы.', icon: <Briefcase className="w-4 h-4" /> },
          { id: 'Project', title: 'Создание продукта / Решение задачи', desc: 'Упор на практику, архитектуру и реальный код.', icon: <Target className="w-4 h-4" /> },
          { id: 'General', title: 'Общее развитие / Академический интерес', desc: 'Сбалансированное фундаментальное понимание.', icon: <Compass className="w-4 h-4" /> }
        ].map((g, idx) => {
          const isLocked = plan === 'FREE' && idx > 0;
          return (
          <div 
            key={g.id} 
            onClick={() => { if (isLocked) { setUpgradeReason('goal'); setUpgradeModalOpen(true); } else setGoal(g.id); }}
            className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${goal === g.id ? 'bg-primary/10 border-primary' : 'bg-surface-container border-outline-variant hover:bg-surface-container-high'}`}
          >
            <div className={`p-2 rounded-lg ${goal === g.id ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>{g.icon}</div>
            <div>
              <h5 className="font-bold text-sm text-on-surface flex items-center gap-2">
                {g.title} {isLocked && <Lock className="w-3.5 h-3.5 text-on-surface-variant/60" />}
              </h5>
              <p className="text-[11px] text-on-surface-variant mt-0.5">{g.desc}</p>
            </div>
          </div>
        )})}
      </div>

      <div className="pt-2">
        <label className="block text-xs font-bold text-on-surface-variant mb-2">Своя конкретная задача (опционально)</label>
        <input type="text" value={customGoal} onChange={e => setCustomGoal(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') handleNext(); }} placeholder="Например: Мне нужно перевести проект с React на Vue" className="w-full bg-surface-container border border-outline-variant rounded-lg px-4 py-3 text-sm text-on-surface focus:ring-1 focus:ring-primary" />
      </div>
    </motion.div>
  );

  const renderStep4 = () => (
    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-5">
      <div className="mb-2">
        <h4 className="text-lg font-bold text-on-surface">Глубина и Интенсивность</h4>
        <p className="text-xs text-on-surface-variant">Настройте объем курса под ваше расписание.</p>
      </div>

      <div>
        <label className="block text-xs font-bold text-on-surface-variant mb-2">Глубина курса (Длительность)</label>
        <div className="space-y-2">
          {[
            { id: 'Express', title: 'Экспресс-погружение', desc: 'Только суть. 3-5 самых важных тем.' },
            { id: 'Standard', title: 'Стандартный трек', desc: 'Сбалансированный курс. 6-10 тем.' },
            { id: 'Deep Dive', title: 'Мастер-класс (Deep Dive)', desc: 'Глубокий разбор с механикой под капотом. 12-15 тем.' }
          ].map((d, idx) => {
            const isLocked = plan === 'FREE' && idx > 0;
            return (
             <div 
               key={d.id} onClick={() => { if (isLocked) { setUpgradeReason('duration'); setUpgradeModalOpen(true); } else setDuration(d.id); }}
               className={`p-3 rounded-xl border cursor-pointer transition-all ${duration === d.id ? 'bg-primary/10 border-primary shadow-sm' : 'bg-surface-container border-outline-variant hover:bg-surface-container-high'}`}
             >
               <h5 className="font-bold text-sm text-on-surface flex items-center gap-2">
                 {d.title} {isLocked && <Lock className="w-3.5 h-3.5 text-on-surface-variant/60" />}
               </h5>
               <p className="text-[11px] text-on-surface-variant">{d.desc}</p>
             </div>
          )})}
        </div>
      </div>

      <div className="pt-2">
        <label className="block text-xs font-bold text-on-surface-variant mb-2 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Дневная норма времени</label>
        <div className="grid grid-cols-3 gap-2">
          {['15m', '30m', '60m'].map((t, idx) => {
            const isLocked = plan === 'FREE' && idx > 0;
            return (
            <button
              key={t} type="button" onClick={() => { if (isLocked) { setUpgradeReason('time'); setUpgradeModalOpen(true); } else setDailyTime(t); }}
              className={`py-2.5 flex items-center justify-center gap-1 rounded-lg text-xs font-bold border transition-all ${dailyTime === t ? 'bg-primary/10 border-primary text-primary' : 'bg-surface-container border-outline-variant text-on-surface-variant hover:text-on-surface'}`}
            >
              {t === '60m' ? '1 час' : t + 'ин'} / день
              {isLocked && <Lock className="w-3 h-3 opacity-60" />}
            </button>
          )})}
        </div>
      </div>
    </motion.div>
  );

  const renderStep5 = () => (
    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-5">
      <div className="mb-2">
        <h4 className="text-lg font-bold text-on-surface">Финальные штрихи</h4>
        <p className="text-xs text-on-surface-variant">Стиль общения и параметры запоминания.</p>
      </div>

      <div>
        <label className="block text-xs font-bold text-on-surface-variant mb-2">Фокус материала</label>
        <div className="grid grid-cols-2 gap-2">
           {[
             { id: 'Theory', label: 'Теория и концепции' },
             { id: 'Practice', label: 'Практика и задачи' },
             { id: 'Code', label: 'Только код и кейсы' }
           ].map((f, idx) => {
             const isLocked = plan === 'FREE' && idx > 1;
             return (
             <button key={f.id} type="button" onClick={() => { if (isLocked) { setUpgradeReason('focus'); setUpgradeModalOpen(true); } else setFocus(f.id); }} className={`py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border transition-all ${focus === f.id ? 'bg-primary/10 border-primary text-primary' : 'bg-surface-container border-outline-variant text-on-surface-variant hover:text-on-surface'}`}>
               {f.label}
               {isLocked && <Lock className="w-3 h-3 opacity-60" />}
             </button>
           )})}
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-on-surface-variant mb-2">Тон ментора (Стиль текста)</label>
        <div className="grid grid-cols-3 gap-2">
           {[
             { id: 'Academic', label: 'Строгий' },
             { id: 'Friendly', label: 'Дружелюбный' },
             { id: 'Gamified', label: 'Игровой' }
           ].map((t, idx) => {
             const isLocked = false;
             return (
             <button key={t.id} type="button" onClick={() => { if (isLocked) { setUpgradeReason('tone'); setUpgradeModalOpen(true); } else setTone(t.id); }} className={`py-2.5 flex items-center justify-center gap-1 rounded-lg text-xs font-bold border transition-all ${tone === t.id ? 'bg-primary/10 border-primary text-primary' : 'bg-surface-container border-outline-variant text-on-surface-variant hover:text-on-surface'}`}>
               {t.label}
               {isLocked && <Lock className="w-3 h-3 opacity-60" />}
             </button>
           )})}
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-on-surface-variant mb-2">Сколько карточек (Anki) генерировать на урок?</label>
        <div className="grid grid-cols-3 gap-2">
          {['3', '5', '8'].map((c, idx) => {
            const isLocked = plan === 'FREE' && idx > 0;
            return (
              <button
                key={c} type="button" 
                onClick={() => { if (isLocked) { setUpgradeReason('cards'); setUpgradeModalOpen(true); } else setFlashcardCount(c); }}
                className={`py-2.5 rounded-lg text-xs font-bold border flex items-center justify-center gap-1 transition-all ${flashcardCount === c ? 'bg-primary/10 border-primary text-primary' : 'bg-surface-container border-outline-variant text-on-surface-variant hover:text-on-surface'}`}
              >
                {c} штук {isLocked && <Lock className="w-3 h-3 opacity-60" />}
              </button>
            )
          })}
        </div>
      </div>

    </motion.div>
  );

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !generating && onClose()} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            
            <motion.div 
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="w-full max-w-lg bg-surface border border-outline-variant rounded-3xl overflow-hidden shadow-2xl relative z-10 flex flex-col text-on-surface"
            >
              {generating && (
                <div className="absolute inset-0 bg-surface/95 backdrop-blur-md z-20 flex flex-col items-center justify-center p-6 text-center">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 4, ease: "linear" }} className="mb-6">
                    <Brain className="w-16 h-16 text-primary" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-on-surface mb-2">Архитектура курса создается...</h3>
                  <p className="text-sm text-on-surface-variant max-w-sm">
                    Анализируем ваши потребности, подбираем оптимальную глубину и формируем индивидуальный путь.
                  </p>
                  <Loader2 className="w-6 h-6 animate-spin text-primary mt-6" />
                </div>
              )}

              {/* Header */}
              <div className="p-6 border-b border-outline-variant bg-surface-container-lowest flex justify-between items-center shrink-0">
                <div className="w-full pr-4">
                  <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
                    <Brain className="w-5 h-5 text-primary" /> Генератор Курсов
                  </h3>
                  {/* Progress Bar */}
                  <div className="flex items-center gap-1.5 mt-3 w-full">
                    {Array.from({length: totalSteps}).map((_, i) => (
                      <div key={i} className={`h-1.5 rounded-full flex-1 transition-colors duration-300 ${i < step ? 'bg-primary' : 'bg-surface-container-highest'}`} />
                    ))}
                  </div>
                </div>
                <button disabled={generating} onClick={onClose} className="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors self-start -mt-2 -mr-2">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto max-h-[60vh] scrollbar-thin">
                {genError && (
                  <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl p-4 text-sm font-semibold">
                    {genError}
                  </div>
                )}
                
                <AnimatePresence mode="wait">
                  {step === 1 && <motion.div key="1">{renderStep1()}</motion.div>}
                  {step === 2 && <motion.div key="2">{renderStep2()}</motion.div>}
                  {step === 3 && <motion.div key="3">{renderStep3()}</motion.div>}
                  {step === 4 && <motion.div key="4">{renderStep4()}</motion.div>}
                  {step === 5 && <motion.div key="5">{renderStep5()}</motion.div>}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-outline-variant bg-surface-container-lowest flex justify-between items-center shrink-0">
                <button 
                  type="button" disabled={generating || step === 1} onClick={handleBack}
                  className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-1 transition-all ${step === 1 ? 'opacity-0 pointer-events-none' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'}`}
                >
                  <ChevronLeft className="w-4 h-4" /> Назад
                </button>
                
                {step < totalSteps ? (
                  <button 
                    type="button" onClick={handleNext}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold bg-on-surface text-surface hover:opacity-90 transition-all flex items-center gap-1"
                  >
                    Далее <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button 
                    type="button" onClick={handleGenerate} disabled={generating || !hasApiKey}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold bg-primary text-on-primary shadow-lg shadow-primary/20 hover:bg-primary/95 transition-all flex items-center gap-1.5"
                  >
                    Создать <Sparkles className="w-4 h-4 fill-white" />
                  </button>
                )}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Upgrade Modal */}
      <AnimatePresence>
        {isUpgradeModalOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setUpgradeModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="relative bg-surface-container border border-outline w-full max-w-sm rounded-[2rem] p-6 shadow-2xl z-10 text-center">
              <div className="w-12 h-12 bg-on-surface/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Lock className="w-5 h-5 text-on-surface" />
              </div>
              
              {upgradeReason === 'level_advanced' && (
                <>
                  <h3 className="text-lg font-bold text-on-surface mb-2">Доступно на тарифе ULTRA</h3>
                  <p className="text-xs text-on-surface-variant mb-6">Продвинутый уровень доступен только на тарифе ULTRA. Обновите тариф для углубленного обучения.</p>
                </>
              )}
              {upgradeReason === 'level_intermediate' && (
                <>
                  <h3 className="text-lg font-bold text-on-surface mb-2">Доступно на тарифе PRO</h3>
                  <p className="text-xs text-on-surface-variant mb-6">Средний уровень доступен на тарифе PRO и выше.</p>
                </>
              )}
              {['goal', 'duration', 'time', 'focus', 'tone', 'cards'].includes(upgradeReason) && (
                <>
                  <h3 className="text-lg font-bold text-on-surface mb-2">Доступно на тарифе PRO</h3>
                  <p className="text-xs text-on-surface-variant mb-6">Расширенные настройки курса доступны только пользователям с PRO подпиской.</p>
                </>
              )}
              {upgradeReason === 'limit' && (
                <>
                  <h3 className="text-lg font-bold text-on-surface mb-2">Достигнут лимит</h3>
                  <p className="text-xs text-on-surface-variant mb-6">Вы исчерпали бесплатный лимит курсов.</p>
                </>
              )}

              <div className="space-y-3">
                <button onClick={() => { setUpgradeModalOpen(false); onClose(); navigate('/pricing'); }} className="w-full py-3 rounded-xl font-bold bg-primary text-on-primary hover:bg-primary/90 transition-all text-xs">
                  Обновить тариф
                </button>
                <button onClick={() => setUpgradeModalOpen(false)} className="w-full py-3 rounded-xl font-bold border border-outline text-on-surface hover:bg-surface-container-high transition-all text-xs">
                  Отмена
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
