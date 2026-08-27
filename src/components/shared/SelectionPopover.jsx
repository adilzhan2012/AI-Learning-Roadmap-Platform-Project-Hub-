import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2 } from 'lucide-react';
import { t, useLocale } from '../../i18n.js';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase.js';
import { callGeminiWithRetry } from '../../services/courseService.js';

const PROMPTS = {
  explain: (ctx, sel) =>
    `Тема курса: "${ctx.topic}". Контекст: "${ctx.nodeDesc}". Выделенный текст: "${sel}". Объясни это максимально просто — как будто объясняешь другу. Без воды, 2-3 предложения.`,
  example: (ctx, sel) =>
    `Тема курса: "${ctx.topic}". Выделенный текст: "${sel}". Приведи один конкретный пример из реального мира или индустрии. 2-3 предложения.`,
  analogy: (ctx, sel) =>
    `Тема курса: "${ctx.topic}". Выделенный текст: "${sel}". Придумай одну запоминающуюся аналогию. 1-2 предложения.`,
};

async function askGeminiSimulatedStream(prompt, onChunk) {
  const fullResponse = await callGeminiWithRetry(null, prompt, 'ai_question');
  
  // Simulate streaming effect
  const chunkSize = 3;
  for (let i = 0; i < fullResponse.length; i += chunkSize) {
    onChunk(fullResponse.slice(i, i + chunkSize));
    await new Promise(r => setTimeout(r, 15)); // 15ms delay per chunk
  }
}

export default function SelectionPopover({ selection, context, onClose, userId, nodeId }) {
  const locale = useLocale();
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const popoverRef = useRef(null);
  const hasClaimedRef = useRef(false);

  const style = {
    position: 'absolute', // We use absolute inside the relative container or fixed. Let's use fixed based on the prompt.
    top: Math.max(10, selection.rect.top + window.scrollY - 8),
    left: Math.max(10, selection.rect.left + selection.rect.width / 2),
    transform: 'translate(-50%, -100%)',
    zIndex: 9999,
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleAction = async (type) => {
    setLoading(true);
    setError('');
    setResponse('');
    const prompt = PROMPTS[type](context, selection.text);
    
    let isFirstChunk = true;
    try {
      await askGeminiSimulatedStream(prompt, (chunk) => {
        if (isFirstChunk && !hasClaimedRef.current && userId && nodeId) {
          hasClaimedRef.current = true;
          // Award XP
          const awardXPFn = httpsCallable(functions, 'awardXP');
          awardXPFn({ userId, activityType: 'selection_ask', details: { nodeId } }).catch(console.error);
        }
        isFirstChunk = false;
        setResponse((prev) => prev + chunk);
      });
    } catch (e) {
      console.error(e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Adjust position if it goes offscreen
  useEffect(() => {
    if (popoverRef.current) {
      const rect = popoverRef.current.getBoundingClientRect();
      if (rect.top < 0) {
        popoverRef.current.style.top = `${selection.rect.bottom + window.scrollY + 8}px`;
        popoverRef.current.style.transform = 'translate(-50%, 0)';
      }
      if (rect.left < 0) {
        popoverRef.current.style.left = '10px';
        popoverRef.current.style.transform = 'translate(0, -100%)';
      } else if (rect.right > window.innerWidth) {
        popoverRef.current.style.left = `${window.innerWidth - 10}px`;
        popoverRef.current.style.transform = 'translate(-100%, -100%)';
      }
    }
  }, [selection, response]);

  return (
    <div 
      ref={popoverRef}
      style={style}
      className="bg-surface border border-outline-variant rounded-xl shadow-2xl p-3 w-[300px] flex flex-col gap-2 transition-all"
    >
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">AI Assistant</span>
        <button onClick={onClose} className="p-1 hover:bg-surface-container rounded-full text-on-surface-variant transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      
      {!response && !loading && !error && (
        <div className="flex flex-col gap-2">
          <button onClick={() => handleAction('explain')} className="text-sm bg-primary/10 hover:bg-primary/20 text-primary py-1.5 px-3 rounded-lg font-medium transition-colors text-left">
            ✨ {t('selection.explain')}
          </button>
          <button onClick={() => handleAction('example')} className="text-sm bg-secondary/10 hover:bg-secondary/20 text-secondary py-1.5 px-3 rounded-lg font-medium transition-colors text-left">
            🌍 {t('selection.example')}
          </button>
          <button onClick={() => handleAction('analogy')} className="text-sm bg-tertiary/10 hover:bg-tertiary/20 text-tertiary py-1.5 px-3 rounded-lg font-medium transition-colors text-left">
            🧠 {t('selection.analogy')}
          </button>
        </div>
      )}

      {loading && !response && (
        <div className="flex items-center gap-2 text-primary p-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm font-medium animate-pulse">{t('selection.thinking')}</span>
        </div>
      )}

      {(response || error) && (
        <div className="text-sm text-on-surface max-h-[200px] overflow-y-auto custom-scrollbar p-1">
          {error ? <span className="text-error">{error}</span> : response}
        </div>
      )}
    </div>
  );
}
