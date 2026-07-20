import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { t } from '../../i18n.js';
import SpeechPlayer from './SpeechPlayer.jsx';
import SelectionPopover from '../shared/SelectionPopover.jsx';
import { useTextSelection } from '../../hooks/useTextSelection.js';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase.js';

export default function SlideViewer({ slides, onClose, topic, nodeDesc, apiKey, userId, nodeId }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const contentRef = useRef(null);
  const { selection, clear } = useTextSelection(contentRef);
  const hasClaimedCompleteRef = useRef(false);

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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, slides.length, onClose]);

  if (!slides || slides.length === 0) return null;

  const currentSlide = slides[currentIndex];
  const progress = ((currentIndex + 1) / slides.length) * 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-surface w-full max-w-4xl h-[90vh] md:h-auto md:max-h-[85vh] rounded-3xl shadow-2xl flex flex-col relative overflow-hidden"
      >
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-surface-container">
          <motion.div 
            className="h-full bg-primary"
            animate={{ width: `${progress}%` }}
            transition={{ ease: "easeOut" }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between p-4 md:px-8 md:py-6 border-b border-outline-variant/30">
          <div className="flex items-center gap-3">
            <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">
              {t('slides.open') || 'Slide'} {currentIndex + 1} / {slides.length}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-highest transition-colors"
          >
            <X className="w-5 h-5 text-on-surface" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar relative" ref={contentRef}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="max-w-3xl mx-auto"
            >
              <h2 className="text-3xl md:text-5xl font-extrabold text-on-surface mb-8 leading-tight bg-gradient-to-br from-primary to-tertiary bg-clip-text text-transparent">
                {currentSlide.title}
              </h2>
              <div className="prose prose-lg dark:prose-invert max-w-none text-on-surface-variant leading-relaxed">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                >
                  {currentSlide.body}
                </ReactMarkdown>
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

        {/* Footer & Controls */}
        <div className="flex-shrink-0 flex flex-col sm:flex-row items-center justify-between p-4 md:px-8 border-t border-outline-variant/30 gap-4 bg-surface-container/20">
          <div className="w-full sm:w-auto flex-1">
            <SpeechPlayer 
              text={currentSlide.body} 
              onEnd={nextSlide} 
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end shrink-0">
            <button
              onClick={prevSlide}
              disabled={currentIndex === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-container text-on-surface-variant"
            >
              <ChevronLeft className="w-5 h-5" /> {t('slides.prev') || 'Prev'}
            </button>
            <button
              onClick={nextSlide}
              disabled={currentIndex === slides.length - 1}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold bg-primary text-on-primary hover:bg-primary/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-md"
            >
              {t('slides.next') || 'Next'} <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
