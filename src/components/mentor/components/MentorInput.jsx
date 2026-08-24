import React, { useRef, useEffect } from 'react';
import { Send, Zap } from 'lucide-react';

export default function MentorInput({
  input,
  setInput,
  onSendMessage,
  generating,
  plan,
  isProSoftCapped,
  timeRemaining,
  locale,
  themeTokens,
  onUpgrade,
}) {
  const textareaRef = useRef(null);

  // Auto-resize textarea height on content change
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    const nextHeight = Math.min(Math.max(textarea.scrollHeight, 44), 125);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > 125 ? 'auto' : 'hidden';
  }, [input]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!generating && input.trim()) {
        onSendMessage(e);
      }
    }
  };

  return (
    <div className="shrink-0 w-full z-10">
      {/* Soft-Cap Notice for PRO users */}
      {isProSoftCapped && (
        <div className="px-4 py-2 bg-amber-500/10 border-t border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 flex items-center justify-between select-none shrink-0 w-full">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              {locale === 'en'
                ? `High-precision daily limit reached. Flash model active. Resets in ${timeRemaining}.`
                : `Дневной лимит повышенной точности исчерпан. Используется Flash-модель. Сброс через ${timeRemaining}.`}
            </span>
          </div>
          <button 
            type="button"
            onClick={onUpgrade} 
            className="font-bold underline hover:text-amber-500 dark:hover:text-amber-300 shrink-0 ml-2"
          >
            {locale === 'en' ? 'Get Ultra' : 'В Ultra'}
          </button>
        </div>
      )}

      {/* Input Bar Form */}
      <form 
        onSubmit={(e) => onSendMessage(e)} 
        className={`p-3 sm:p-4 border-t ${themeTokens.subtleBorder} flex items-end gap-2.5 w-full relative transition-all duration-200`}
      >
        <div 
          className={`flex-1 rounded-2xl border transition-all duration-200 px-3.5 py-2.5 flex items-center relative ${themeTokens.inputContainer} ${
            generating ? 'ring-2 ring-indigo-500/40 shadow-lg shadow-indigo-500/10 animate-pulse' : 'focus-within:ring-2 focus-within:ring-indigo-500/30'
          }`}
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            disabled={generating}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              plan === 'ULTRA' 
                ? (locale === 'en' ? 'Ask a question or request a learning roadmap...' : 'Задайте вопрос или составьте бриф...') 
                : (locale === 'en' ? 'Ask the mentor a question...' : 'Задайте вопрос наставнику...')
            }
            className={`w-full resize-none outline-none border-none p-0 text-sm leading-relaxed font-sans ${themeTokens.inputField}`}
            style={{
              maxHeight: '125px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            }}
          />
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={generating || !input.trim()}
          aria-label={locale === 'en' ? 'Send message' : 'Отправить сообщение'}
          className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-150 shrink-0 ${
            !generating && input.trim() 
              ? themeTokens.sendBtnActive 
              : themeTokens.sendBtnDisabled
          }`}
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
