import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { LEGAL_DOCS } from '../../constants/legalDocs.js';
import { useLocale } from '../../i18n.js';

export default function LegalDocModal({ isOpen, onClose, docKey }) {
  const locale = useLocale();

  if (!isOpen) return null;

  // Detect current language (default to 'en' for non-ru locales)
  const lang = locale === 'ru' ? 'ru' : 'en';
  const markdownContent = LEGAL_DOCS[lang]?.[docKey] || '';

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/85 backdrop-blur-md"
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ scale: 0.95, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 30, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-3xl bg-[#1C1C1E] border border-[rgba(255,255,255,0.08)] rounded-[24px] shadow-[0_24px_80px_rgba(0,0,0,0.6)] relative z-10 flex flex-col max-h-[85vh] text-[#F5F5F7] overflow-hidden font-sans"
      >
        {/* Header */}
        <div className="p-5 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between flex-shrink-0 bg-[#1C1C1E]">
          <span className="text-xs font-semibold text-[#98989D] uppercase tracking-wider font-mono">
            {docKey === 'terms' ? (lang === 'ru' ? 'Соглашение' : 'Agreement') :
             docKey === 'privacy' ? (lang === 'ru' ? 'Конфиденциальность' : 'Privacy') : 
             (lang === 'ru' ? 'Файлы Cookie' : 'Cookie Policy')}
          </span>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#2C2C2E]/60 border border-[rgba(255,255,255,0.04)] transition-colors"
          >
            <X className="w-4 h-4 text-[#98989D] hover:text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#111112] custom-scrollbar">
          <div className="prose prose-invert prose-sm max-w-none text-[#E5E5EA] 
            prose-headings:text-white prose-headings:font-clash prose-headings:font-bold
            prose-h1:text-2xl prose-h1:mb-6
            prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-3
            prose-h3:text-sm prose-h3:mt-4 prose-h3:mb-2
            prose-p:leading-relaxed prose-p:mb-4 prose-p:text-xs prose-p:text-[#98989D]
            prose-li:text-xs prose-li:text-[#98989D] prose-li:mb-2 prose-ul:list-disc prose-ul:pl-5
            prose-table:w-full prose-table:text-left prose-table:border-collapse prose-table:my-6
            prose-th:border-b prose-th:border-[rgba(255,255,255,0.08)] prose-th:pb-2 prose-th:text-[10px] prose-th:font-semibold prose-th:text-[#98989D] prose-th:uppercase
            prose-td:border-b prose-td:border-[rgba(255,255,255,0.04)] prose-td:py-3 prose-td:text-xs prose-td:text-[#E5E5EA]
          ">
            <ReactMarkdown>{markdownContent}</ReactMarkdown>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[rgba(255,255,255,0.06)] flex justify-end flex-shrink-0 bg-[#1C1C1E]">
          <button
            onClick={onClose}
            className="bg-white hover:bg-[#E8E8ED] text-black px-6 py-2 rounded-xl text-xs font-bold transition-colors"
          >
            {lang === 'ru' ? 'Закрыть' : 'Close'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
