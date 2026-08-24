import React from 'react';
import { motion } from 'framer-motion';
import { X, Baby, Sparkles, Loader2, RefreshCw, Smile, Heart } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useLocale } from '../../../i18n.js';

export default function ELI5Modal({
  isOpen,
  onClose,
  topic = 'Урок',
  content = '',
  loading = false,
  onGenerate = null
}) {
  const locale = useLocale();

  if (!isOpen) return null;

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
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative z-10 bg-surface border border-purple-500/30 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl overflow-hidden text-on-surface flex flex-col max-h-[88vh]"
      >
        {/* Ambient Glow */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-outline-variant/50 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Baby className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-on-surface tracking-tight flex items-center gap-2">
                <span>{locale === 'en' ? 'Explain Like I’m 5' : 'Просто о сложном'}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">
                  ELI5
                </span>
              </h3>
              <p className="text-xs text-on-surface-variant font-medium">
                {topic}
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto my-4 pr-1.5 custom-scrollbar relative z-10">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center mb-4 text-purple-400 animate-pulse">
                <Sparkles className="w-7 h-7 animate-spin" />
              </div>
              <h4 className="font-bold text-base text-on-surface mb-1">
                {locale === 'en' ? 'Translating complex terms into simple analogies...' : 'Упрощаем сложные термины и формулировки...'}
              </h4>
              <p className="text-xs text-on-surface-variant max-w-sm">
                {locale === 'en' 
                  ? 'Creating fun, easy-to-understand metaphors to make the topic crystal clear.' 
                  : 'Подбираем яркие бытовые аналогии, чтобы тема стала понятной с первых секунд.'}
              </p>
            </div>
          ) : content ? (
            <div className="prose prose-sm dark:prose-invert max-w-none text-on-surface/90 leading-relaxed space-y-4">
              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 mb-4 flex items-start gap-3">
                <Smile className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <p className="text-xs text-purple-200/90 leading-relaxed font-medium m-0">
                  {locale === 'en'
                    ? 'ELI5 mode strips away heavy jargon and breaks down the core principle into simple intuition.'
                    : 'Режим «Просто о сложном» убирает сухой академический язык и передает саму суть простыми и наглядными образами.'}
                </p>
              </div>

              <div className="bg-surface-container/40 p-5 rounded-2xl border border-outline-variant/40">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content}
                </ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-surface-container border border-outline-variant flex items-center justify-center mb-3 text-on-surface-variant">
                <Baby className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm text-on-surface mb-1">
                {locale === 'en' ? 'Simplified explanation not ready' : 'Простое объяснение еще не создано'}
              </h4>
              <p className="text-xs text-on-surface-variant max-w-xs mb-4">
                {locale === 'en' ? 'Click below to generate a simple breakdown.' : 'Нажмите кнопку ниже, чтобы ИИ подготовил простое объяснение на пальцах.'}
              </p>
              {onGenerate && (
                <button
                  onClick={onGenerate}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-purple-500 hover:bg-purple-600 text-white text-xs shadow-lg shadow-purple-500/20 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{locale === 'en' ? 'Generate ELI5 Breakdown' : 'Объяснить просто'}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-outline-variant/40 flex items-center justify-between gap-3 relative z-10">
          <div className="text-[11px] text-on-surface-variant flex items-center gap-1.5">
            <Heart className="w-3 h-3 text-purple-400" />
            <span>AI Simplifier Engine</span>
          </div>

          <div className="flex items-center gap-2">
            {onGenerate && content && !loading && (
              <button
                onClick={onGenerate}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-surface-container hover:bg-surface-container-high border border-outline-variant transition-all text-on-surface"
                title={locale === 'en' ? 'Regenerate' : 'Сгенерировать заново'}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{locale === 'en' ? 'Update' : 'Обновить'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl font-bold bg-purple-500 hover:bg-purple-600 text-white text-xs shadow-lg shadow-purple-500/20 transition-all"
            >
              {locale === 'en' ? 'Understood!' : 'Всё понятно!'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
