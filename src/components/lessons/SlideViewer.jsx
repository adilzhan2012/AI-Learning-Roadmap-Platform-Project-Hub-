import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Minimize2, 
  Lock, 
  Mic, 
  Sparkles, 
  Volume2, 
  RotateCcw, 
  CheckCircle2, 
  Presentation,
  Radio,
  Clock,
  Layers
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { useLocale } from '../../i18n.js';
import SelectionPopover from '../shared/SelectionPopover.jsx';
import { useTextSelection } from '../../hooks/useTextSelection.js';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase.js';

export default function SlideViewer({ 
  slides = [], 
  onClose, 
  topic = 'Презентация урока', 
  nodeDesc, 
  apiKey, 
  userId, 
  nodeId 
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isDeckFullscreen, setIsDeckFullscreen] = useState(false);
  const contentRef = useRef(null);
  const deckRef = useRef(null);
  const { selection, clear } = useTextSelection(contentRef);
  const hasClaimedCompleteRef = useRef(false);
  const locale = useLocale();

  const isFirst = currentIndex === 0;
  const isLast = currentIndex === slides.length - 1;
  const currentSlide = slides[currentIndex] || slides[0];
  const progressPercent = Math.round(((currentIndex + 1) / (slides.length || 1)) * 100);

  const nextSlide = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Award XP when reaching the end of slides
      if (!hasClaimedCompleteRef.current && userId && nodeId) {
        hasClaimedCompleteRef.current = true;
        const awardXPFn = httpsCallable(functions, 'awardXP');
        awardXPFn({ userId, activityType: 'slide_completed', details: { nodeId } }).catch(console.error);
      }
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  };

  const toggleDeckFullscreen = () => {
    if (!deckRef.current) return;
    if (!document.fullscreenElement) {
      deckRef.current.requestFullscreen().then(() => setIsDeckFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsDeckFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsDeckFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isVoiceModalOpen) {
        if (e.key === 'Escape') setIsVoiceModalOpen(false);
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        e.preventDefault();
        nextSlide();
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
      }
      if (e.key === 'f' || e.key === 'F') {
        toggleDeckFullscreen();
      }
      if (e.key === 'Escape' && !document.fullscreenElement) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, slides.length, onClose, isVoiceModalOpen]);

  if (!slides || slides.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/90 backdrop-blur-xl select-none">
      {/* Background Dim Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-gradient-to-t from-black via-zinc-950/80 to-black pointer-events-auto"
      />

      {/* Main Slide Deck Canvas */}
      <motion.div
        ref={deckRef}
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="relative z-10 w-full max-w-5xl h-[92vh] md:h-[86vh] bg-[#0c0e17] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-zinc-100 font-sans"
      >
        {/* Ambient Presentation Glow */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Progress Bar */}
        <div className="w-full h-1 bg-white/5 relative z-20">
          <motion.div 
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
            animate={{ width: `${progressPercent}%` }}
            transition={{ ease: "easeOut", duration: 0.25 }}
          />
        </div>

        {/* Presentation Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 relative z-20 bg-[#0c0e17]/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Presentation className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                  {locale === 'en' ? `Slide ${currentIndex + 1} of ${slides.length}` : `Слайд ${currentIndex + 1} из ${slides.length}`}
                </span>
                <span className="text-xs text-zinc-400 font-medium hidden sm:inline truncate max-w-xs">
                  {topic}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Fullscreen Toggle */}
            <button
              onClick={toggleDeckFullscreen}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-all border border-white/5 cursor-pointer"
              title={isDeckFullscreen ? (locale === 'en' ? "Exit Fullscreen" : "Свернуть") : (locale === 'en' ? "Presentation Fullscreen (F)" : "Полноэкранный режим (F)")}
            >
              {isDeckFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button 
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-all border border-white/5 cursor-pointer"
              title={locale === 'en' ? "Close Presentation" : "Закрыть презентацию"}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Slide Body Canvas (Keynote Styled) */}
        <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar relative z-10 flex flex-col justify-center" ref={contentRef}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.98 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="w-full max-w-3xl mx-auto my-auto"
            >
              {/* Slide Number Watermark */}
              <div className="text-[10px] font-mono font-bold tracking-widest text-indigo-400/60 uppercase mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span>{topic} • #{currentIndex + 1}</span>
              </div>

              {/* Grand Slide Title */}
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight mb-6 sm:mb-8 bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent drop-shadow-sm">
                {currentSlide.title}
              </h2>

              {/* Slide Card Content */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white/[0.03] border border-white/10 shadow-2xl backdrop-blur-md">
                <div className="prose prose-base sm:prose-lg prose-invert max-w-none text-zinc-300 leading-relaxed font-normal">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                  >
                    {currentSlide.body}
                  </ReactMarkdown>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {selection && (
            <SelectionPopover
              selection={selection}
              context={{ topic, nodeDesc }}
              apiKey={apiKey}
              onClose={clear}
              userId={userId}
              nodeId={nodeId}
            />
          )}
        </div>

        {/* Footer Navigation Bar */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-t border-white/10 bg-[#0c0e17]/90 backdrop-blur-md relative z-20 gap-4">
          
          {/* Left: Locked AI Voiceover Feature */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsVoiceModalOpen(true)}
              className="group flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 transition-all cursor-pointer shadow-sm active:scale-95"
              title={locale === 'en' ? 'AI Voiceover Narration (Locked)' : 'ИИ-Озвучка спикера (Скоро)'}
            >
              <div className="w-5 h-5 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <Lock className="w-3 h-3" />
              </div>
              <span className="text-xs font-bold">{locale === 'en' ? 'AI Speaker Voiceover' : 'ИИ-Озвучка спикера'}</span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded-md">
                {locale === 'en' ? 'Soon' : 'Скоро'}
              </span>
            </button>
          </div>

          {/* Center: Slide Preview Dot Strip */}
          <div className="hidden md:flex items-center gap-1.5">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`transition-all rounded-full cursor-pointer ${
                  idx === currentIndex 
                    ? 'w-6 h-2 bg-indigo-500 shadow-md shadow-indigo-500/50' 
                    : 'w-2 h-2 bg-white/20 hover:bg-white/40'
                }`}
                title={`${locale === 'en' ? 'Slide' : 'Слайд'} ${idx + 1}`}
              />
            ))}
          </div>

          {/* Right: Slide Prev / Next Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prevSlide}
              disabled={isFirst}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{locale === 'en' ? 'Prev' : 'Назад'}</span>
            </button>

            <button
              type="button"
              onClick={nextSlide}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg shadow-indigo-500/25 cursor-pointer"
            >
              <span>{isLast ? (locale === 'en' ? 'Finish' : 'Завершить') : (locale === 'en' ? 'Next' : 'Далее')}</span>
              {!isLast && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>

        </div>
      </motion.div>

      {/* "Coming Soon in Next Update" Voiceover Modal */}
      <AnimatePresence>
        {isVoiceModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsVoiceModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 320 }}
              className="relative z-10 max-w-md w-full rounded-3xl bg-[#11131f] border border-indigo-500/30 p-6 sm:p-8 shadow-2xl text-center text-zinc-100 overflow-hidden"
            >
              {/* Ambient Glow */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsVoiceModalOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Feature Icon Header */}
              <div className="relative mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 mb-5 shadow-lg shadow-indigo-500/20">
                <Mic className="w-8 h-8 text-indigo-400" />
                <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-500 border-2 border-[#11131f] flex items-center justify-center text-zinc-950 shadow-md">
                  <Lock className="w-3 h-3" />
                </div>
              </div>

              {/* Feature Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 mb-3 uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                <span>{locale === 'en' ? 'Coming in Next Update v1.2.0' : 'Скоро в следующем обновлении v1.2.0'}</span>
              </div>

              {/* Title */}
              <h3 className="text-xl sm:text-2xl font-black mb-3 text-white tracking-tight">
                {locale === 'en' ? 'AI Speaker Voiceover' : 'ИИ-Озвучка живым голосом'}
              </h3>

              {/* Description */}
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed mb-6">
                {locale === 'en'
                  ? 'We are training neural models with natural studio intonation, tone, and pacing to narrate each slide seamlessly in real-time!'
                  : 'Мы обучаем нейросеть студийного качества с естественной интонацией, тембром и темпом для синхронной озвучки каждого слайда презентации.'}
              </p>

              {/* Feature Highlights */}
              <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 text-left space-y-2.5 mb-6 text-xs text-zinc-300">
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span>{locale === 'en' ? 'Natural voice without robotic artifacts' : 'Живая речь без роботизированного акцента'}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span>{locale === 'en' ? 'Synchronized auto-sliding as narration plays' : 'Синхронное переключение слайдов по ходу речи'}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span>{locale === 'en' ? 'Supports English & Russian phonetics' : 'Естественное русское и английское произношение'}</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => setIsVoiceModalOpen(false)}
                className="w-full py-3 px-6 rounded-2xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white text-xs shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all cursor-pointer"
              >
                {locale === 'en' ? "Got it, I'll be waiting!" : 'Отлично, буду ждать!'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
