import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Copy, Check, FileText, CheckSquare, Layers, Sparkles } from 'lucide-react';
import { useLocale } from '../../../i18n.js';

export default function ExportLessonModal({
  isOpen,
  onClose,
  topic = 'Урок',
  lessonContent = '',
  homework = null,
  flashcards = []
}) {
  const [activeTab, setActiveTab] = useState('full'); // 'full' | 'homework' | 'anki'
  const [copied, setCopied] = useState(false);
  const locale = useLocale();

  if (!isOpen) return null;

  // Generate content based on activeTab
  const getExportText = () => {
    if (activeTab === 'homework') {
      if (!homework) {
        return locale === 'en' 
          ? `# Homework: ${topic}\n\nNo self-study assignments generated yet.` 
          : `# Домашнее задание: ${topic}\n\nЗадания для самостоятельной практики пока не сформированы.`;
      }
      const title = homework.taskTitle || (locale === 'en' ? 'Practical Assignment' : 'Практическое задание');
      const desc = homework.taskDescription || homework.task || '';
      const criteria = Array.isArray(homework.criteria) 
        ? homework.criteria.map((c, i) => `${i + 1}. ${c}`).join('\n') 
        : (homework.criteria || '');
      const hint = homework.starterCode || homework.hint || '';
      const critHeader = locale === 'en' ? '### Evaluation Criteria:' : '### Критерии выполнения:';
      const hintHeader = locale === 'en' ? '### Hint:' : '### Подсказка:';
      return `# ${locale === 'en' ? 'Homework' : 'Домашнее задание'}: ${topic}\n## ${title}\n\n${desc}\n\n${criteria ? `${critHeader}\n${criteria}\n\n` : ''}${hint ? `${hintHeader}\n\`\`\`\n${hint}\n\`\`\`\n` : ''}`;
    }

    if (activeTab === 'anki') {
      if (!flashcards || flashcards.length === 0) {
        return locale === 'en'
          ? '# Anki Flashcards (CSV)\n# Term;Definition\nSample Term;Sample Definition'
          : '# Флешкарты Anki (CSV)\n# Термин;Определение\nТермин 1;Определение термина 1';
      }
      return flashcards.map(fc => {
        const front = (fc.term || fc.front || '').replace(/;/g, ',').replace(/\n/g, ' ');
        const back = (fc.definition || fc.back || '').replace(/;/g, ',').replace(/\n/g, ' ');
        return `"${front}";"${back}"`;
      }).join('\n');
    }

    // Default: full markdown
    return lessonContent || (locale === 'en' ? `# ${topic}\n\nLesson Notes` : `# ${topic}\n\nКонспект урока`);
  };

  const currentExportText = getExportText();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentExportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleDownload = () => {
    const ext = activeTab === 'anki' ? 'csv' : 'md';
    const mime = activeTab === 'anki' ? 'text/csv;charset=utf-8;' : 'text/markdown;charset=utf-8;';
    const cleanTopic = topic.replace(/[^a-zA-Zа-яА-Я0-9_-]/g, '_').toLowerCase();
    const filename = `${cleanTopic}_${activeTab}.${ext}`;

    const blob = new Blob([currentExportText], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
        className="relative z-10 bg-surface border border-outline-variant/60 rounded-3xl p-6 md:p-8 max-w-3xl w-full shadow-2xl overflow-hidden text-on-surface flex flex-col max-h-[88vh]"
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-outline-variant/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-on-surface tracking-tight">
                {locale === 'en' ? 'Export Lesson Materials' : 'Экспорт материалов урока'}
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

        {/* Tab Selector */}
        <div className="flex bg-surface-container p-1 rounded-2xl border border-outline-variant/40 mt-4 gap-1">
          <button
            onClick={() => setActiveTab('full')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'full' 
                ? 'bg-surface text-on-surface shadow-md border border-outline-variant/50' 
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{locale === 'en' ? 'Full Markdown' : 'Полный конспект'}</span>
          </button>
          <button
            onClick={() => setActiveTab('homework')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'homework' 
                ? 'bg-surface text-on-surface shadow-md border border-outline-variant/50' 
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>{locale === 'en' ? 'Homework (.md)' : 'Задания и ДЗ'}</span>
          </button>
          <button
            onClick={() => setActiveTab('anki')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'anki' 
                ? 'bg-surface text-on-surface shadow-md border border-outline-variant/50' 
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{locale === 'en' ? 'Anki Flashcards (.csv)' : 'Карточки Anki (.csv)'}</span>
          </button>
        </div>

        {/* Preview Content Area */}
        <div className="flex-1 overflow-hidden my-4 flex flex-col">
          <div className="flex justify-between items-center text-xs text-on-surface-variant mb-2">
            <span className="font-semibold">
              {locale === 'en' ? 'Preview' : 'Предпросмотр файла'}:
            </span>
            <span className="font-mono text-[11px] opacity-75">
              {currentExportText.length} {locale === 'en' ? 'characters' : 'символов'}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto bg-surface-container/60 border border-outline-variant/40 rounded-2xl p-4 font-mono text-xs text-on-surface/90 leading-relaxed custom-scrollbar whitespace-pre-wrap select-all">
            {currentExportText}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-outline-variant/50 flex items-center justify-between gap-3">
          <div className="text-[11px] text-on-surface-variant hidden sm:block">
            {activeTab === 'anki' 
              ? (locale === 'en' ? 'Ready for import into Anki / Quizlet' : 'Готово для импорта в Anki / Quizlet')
              : (locale === 'en' ? 'Compatible with Notion, Obsidian, GitHub' : 'Поддерживает Notion, Obsidian, GitHub')}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleCopy}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-surface-container border border-outline-variant hover:bg-surface-container-high transition-all text-xs text-on-surface"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">{locale === 'en' ? 'Copied!' : 'Скопировано!'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>{locale === 'en' ? 'Copy to Clipboard' : 'Копировать'}</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-600 text-zinc-950 shadow-lg shadow-emerald-500/20 transition-all text-xs"
            >
              <Download className="w-4 h-4" />
              <span>{locale === 'en' ? 'Download File' : 'Скачать файл'}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
