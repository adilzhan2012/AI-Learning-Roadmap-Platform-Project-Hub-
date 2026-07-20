import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Sparkles, Loader2, X, ChevronDown, ChevronUp, Settings, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { generateCourseAndSave, getGroqApiKey } from '../services/courseService.js';
import { t } from '../i18n.js';
import { usePlanLimits } from '../hooks/usePlanLimits.js';
import UpgradeModal from './shared/UpgradeModal.jsx';

export default function CourseGeneratorModal({ isOpen, onClose, userUid }) {
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('Beginner');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');

  // Advanced settings state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [duration, setDuration] = useState('Standard'); // Express, Standard, Deep Dive
  const [focus, setFocus] = useState('Theory'); // Theory, Practice, Code
  const [goal, setGoal] = useState('General'); // Interview, Project, General
  const [tone, setTone] = useState('Academic'); // Academic, Friendly, Gamified
  const [prerequisites, setPrerequisites] = useState('');
  const [stack, setStack] = useState('');

  const hasApiKey = !!getGroqApiKey();
  const { plan, usage, checkLimit, incrementUsage, isUpgradeModalOpen, setUpgradeModalOpen } = usePlanLimits();

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    const trimmedTopic = topic.trim();
    if (!trimmedTopic) return;

    // Validate that the topic is not just random gibberish or too short
    if (trimmedTopic.length < 2) {
      setGenError(t('dashboard.modal.errorTooShort') || 'Topic is too short. Please be more specific.');
      return;
    }
    
    // Check for repetitive characters (e.g. "ваываываываыва")
    const hasRepetitiveChars = /(.)\1{4,}/.test(trimmedTopic) || /(.{2,})\1{3,}/.test(trimmedTopic);
    if (hasRepetitiveChars) {
      setGenError(t('dashboard.modal.errorInvalid') || 'Please enter a real learning topic, not random characters.');
      return;
    }
    
    if (!checkLimit('roadmap')) {
      return; // stops generation, opens modal
    }

    setGenError('');
    setGenerating(true);

    try {
      const preferences = { duration, focus, goal, tone, prerequisites, stack };
      const generated = await generateCourseAndSave(userUid, topic, level, preferences);
      await incrementUsage('roadmap');
      onClose();
      setTopic('');
      setLevel('Beginner');
      // Redirect to the newly generated course's Knowledge Graph
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

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !generating && onClose()}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="w-full max-w-lg bg-surface border border-outline-variant rounded-3xl p-6 md:p-8 shadow-2xl relative z-10 overflow-hidden"
          >
            {generating && (
              <div className="absolute inset-0 bg-surface/90 backdrop-blur-md z-20 flex flex-col items-center justify-center p-6 text-center">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                  className="mb-6"
                >
                  <Brain className="w-16 h-16 text-primary" />
                </motion.div>
                <h3 className="text-xl font-bold text-on-surface mb-2">{t('dashboard.modal.generatingTitle')}</h3>
                <p className="text-sm text-on-surface-variant max-w-sm">
                  {t('dashboard.modal.generatingSubtitle')}
                </p>
                <Loader2 className="w-6 h-6 animate-spin text-primary mt-6" />
              </div>
            )}

            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-on-surface flex items-center gap-2">
                  <Brain className="w-6 h-6 text-primary" /> {t('dashboard.modal.title')}
                </h3>
                <p className="text-sm text-on-surface-variant mt-1">{t('dashboard.modal.subtitle')}</p>
              </div>
              <button 
                disabled={generating} 
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>



            <form onSubmit={handleCreateCourse} className="space-y-6">
              {genError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl p-4 text-sm font-semibold">
                  {genError}
                </div>
              )}

              <div>
                <label htmlFor="topic" className="block text-sm font-bold text-on-surface mb-2">{t('dashboard.modal.topicLabel')}</label>
                <input 
                  type="text" 
                  id="topic" 
                  required 
                  disabled={generating}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={t('dashboard.modal.topicPlaceholder')}
                  className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">{t('dashboard.modal.levelLabel')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Beginner', 'Intermediate', 'Advanced'].map(lvl => (
                    <button
                      key={lvl}
                      type="button"
                      disabled={generating}
                      onClick={() => setLevel(lvl)}
                      className={`py-3.5 rounded-xl text-sm font-bold transition-all ${
                        level === lvl 
                          ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' 
                          : 'bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                      }`}
                    >
                      {t('level.' + lvl)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Advanced Settings Accordion */}
              <div className="border border-outline-variant rounded-xl overflow-hidden bg-surface-container-lowest">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full flex items-center justify-between p-4 bg-surface-container-lowest hover:bg-surface-container transition-colors"
                >
                  <span className="flex items-center gap-2 text-sm font-bold text-on-surface">
                    <Settings className="w-4 h-4 text-primary" /> Продвинутые настройки
                  </span>
                  {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                
                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-outline-variant"
                    >
                      <div className="p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-on-surface-variant mb-1">Длительность</label>
                            <select value={duration} onChange={e => setDuration(e.target.value)} disabled={generating} className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary">
                              <option value="Express">Экспресс (3-5 тем)</option>
                              <option value="Standard">Стандарт (6-10 тем)</option>
                              <option value="Deep Dive">Мастер-класс (12-15 тем)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-on-surface-variant mb-1">Стиль обучения</label>
                            <select value={focus} onChange={e => setFocus(e.target.value)} disabled={generating} className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary">
                              <option value="Theory">Академический (Теория)</option>
                              <option value="Practice">Практический (Проекты)</option>
                              <option value="Code">Программирование (Код)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-on-surface-variant mb-1">Цель курса</label>
                            <select value={goal} onChange={e => setGoal(e.target.value)} disabled={generating} className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary">
                              <option value="General">Общее развитие</option>
                              <option value="Interview">Подготовка к собеседованию</option>
                              <option value="Project">Создание пет-проекта</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-on-surface-variant mb-1">Тон ментора</label>
                            <select value={tone} onChange={e => setTone(e.target.value)} disabled={generating} className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary">
                              <option value="Academic">Строгий и научный</option>
                              <option value="Friendly">Дружелюбный с юмором</option>
                              <option value="Gamified">Игровой / Фэнтези</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-on-surface-variant mb-1">Что вы уже знаете? (чтобы ИИ это пропустил)</label>
                          <input type="text" value={prerequisites} onChange={e => setPrerequisites(e.target.value)} disabled={generating} placeholder="Например: HTML, CSS, базовый JS" className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-on-surface-variant mb-1">Стек технологий (опционально)</label>
                          <input type="text" value={stack} onChange={e => setStack(e.target.value)} disabled={generating} placeholder="Например: React, Node.js" className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="pt-4 border-t border-outline-variant flex justify-end gap-3">
                <button 
                  type="button" 
                  disabled={generating} 
                  onClick={onClose}
                  className="px-5 py-3 rounded-xl text-sm font-bold text-on-surface hover:bg-surface-container-high transition-colors"
                >
                  {t('settings.profile.cancel')}
                </button>
                <button 
                  type="submit" 
                  disabled={generating || !hasApiKey} 
                  className="bg-primary text-on-primary px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/95 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {t('dashboard.buildRoadmap')} <Sparkles className="w-4 h-4 fill-white" />
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    
    <AnimatePresence>
      {isUpgradeModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setUpgradeModalOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="relative bg-[#1C1C1E] border border-[rgba(255,255,255,0.08)] w-full max-w-sm rounded-[2rem] p-6 shadow-2xl z-10 text-center"
          >
            <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-5 h-5 text-white" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Достигнут лимит генераций</h3>
            <p className="text-xs text-[#98989D] mb-6 leading-relaxed">
              Вы исчерпали лимит генерации дорожных карт (максимум 2 курса на бесплатном тарифе). Перейдите на тариф Pro для безлимитной генерации.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setUpgradeModalOpen(false);
                  onClose();
                  navigate('/pricing');
                }}
                className="w-full py-3 rounded-xl font-bold bg-[#FFFFFF] text-[#000000] hover:bg-[#F5F5F7] transition-all text-xs"
              >
                Перейти на Pro
              </button>
              <button
                onClick={() => setUpgradeModalOpen(false)}
                className="w-full py-3 rounded-xl font-bold bg-transparent border border-[rgba(255,255,255,0.08)] text-[#FFFFFF] hover:bg-[rgba(255,255,255,0.04)] transition-all text-xs"
              >
                Понятно
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
}
