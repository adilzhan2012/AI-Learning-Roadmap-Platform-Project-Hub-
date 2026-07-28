import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { LEGAL_DOCS } from '../../constants/legalDocs.js';
import { useLocale } from '../../i18n.js';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase.js';

export default function LegalDocModal({ isOpen, onClose, docKey }) {
  const locale = useLocale();
  const [content, setContent] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!isOpen) return;
    
    let isMounted = true;
    const fetchContent = async () => {
      setLoading(true);
      const lang = locale === 'ru' ? 'ru' : 'en';
      
      try {
        const docSnap = await getDoc(doc(db, 'settings', 'legal'));
        if (docSnap.exists() && isMounted) {
          const data = docSnap.data();
          const fieldKey = `${docKey}_${lang}`;
          
          if (data[fieldKey]) {
            setContent(data[fieldKey]);
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.error("Error fetching legal docs from Firestore:", e);
      }
      
      // Fallback to static if Firestore fails or doesn't have the field
      if (isMounted) {
        setContent(LEGAL_DOCS[lang]?.[docKey] || '');
        setLoading(false);
      }
    };
    
    fetchContent();
    return () => { isMounted = false; };
  }, [isOpen, docKey, locale]);

  if (!isOpen) return null;

  const lang = locale === 'ru' ? 'ru' : 'en';

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
        className="w-full max-w-3xl bg-surface border border-outline rounded-[24px] shadow-[0_24px_80px_rgba(0,0,0,0.6)] relative z-10 flex flex-col max-h-[85vh] text-on-background overflow-y-auto font-sans"
      >
        {/* Header */}
        <div className="p-5 border-b border-outline flex items-center justify-between flex-shrink-0 bg-surface">
          <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider font-mono">
            {docKey === 'terms' ? (lang === 'ru' ? 'Соглашение' : 'Agreement') :
             docKey === 'privacy' ? (lang === 'ru' ? 'Конфиденциальность' : 'Privacy') : 
             (lang === 'ru' ? 'Файлы Cookie' : 'Cookie Policy')}
          </span>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-container/60 border border-outline-variant transition-colors"
          >
            <X className="w-4 h-4 text-on-surface-variant hover:text-on-surface" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-surface custom-scrollbar">
          <div className="prose prose-sm max-w-none text-on-surface-variant dark:prose-invert
            prose-headings:text-on-surface prose-headings:font-clash prose-headings:font-bold
            prose-h1:text-2xl prose-h1:mb-6
            prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-3
            prose-h3:text-sm prose-h3:mt-4 prose-h3:mb-2
            prose-p:leading-relaxed prose-p:mb-4 prose-p:text-xs prose-p:text-on-surface-variant
            prose-li:text-xs prose-li:text-on-surface-variant prose-li:mb-2 prose-ul:list-disc prose-ul:pl-5
            prose-table:w-full prose-table:text-left prose-table:border-collapse prose-table:my-6
            prose-th:border-b prose-th:border-outline prose-th:pb-2 prose-th:text-[10px] prose-th:font-semibold prose-th:text-on-surface-variant prose-th:uppercase
            prose-td:border-b prose-td:border-outline-variant prose-td:py-3 prose-td:text-xs prose-td:text-on-surface
          ">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <ReactMarkdown>{content}</ReactMarkdown>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-outline flex justify-end flex-shrink-0 bg-surface">
          <button
            onClick={onClose}
            className="bg-on-surface hover:bg-surface-container text-black px-6 py-2 rounded-xl text-xs font-bold transition-colors"
          >
            {lang === 'ru' ? 'Закрыть' : 'Close'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
