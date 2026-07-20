import React, { useEffect, useRef } from 'react';
import { Play, Pause, Square, Volume2 } from 'lucide-react';
import { useSpeech } from '../../hooks/useSpeech.js';
import { t, useLocale } from '../../i18n.js';

export default function SpeechPlayer({ text, onEnd }) {
  const locale = useLocale();
  const { speak, pause, resume, stop, isSpeaking, isPaused, speed, setSpeed } = useSpeech();
  
  // Track onEnd call to avoid stale closures if text changes
  const onEndRef = useRef(onEnd);
  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  const handlePlay = () => {
    if (isPaused) {
      resume();
    } else if (!isSpeaking) {
      let lang = 'en-US';
      if (locale === 'ru') lang = 'ru-RU';
      else if (locale === 'kk') lang = 'kk-KZ';
      else if (locale === 'zh') lang = 'zh-CN';
      
      speak(text, lang, speed);
      
      // Monkey patch utterance end to call onEnd
      const interval = setInterval(() => {
        if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
          clearInterval(interval);
          if (isSpeaking || isPaused) {
             // Let the hook handle state updates, just notify parent
          }
        }
      }, 1000);
      
      // Actual onend is handled in useSpeech, but we don't have access to the utterance here to attach our custom onEnd.
      // So we will watch the state.
    } else {
      pause();
    }
  };
  
  // Watch state to trigger onEnd
  const wasSpeaking = useRef(false);
  useEffect(() => {
    if (isSpeaking) {
      wasSpeaking.current = true;
    } else if (!isSpeaking && !isPaused && wasSpeaking.current) {
      wasSpeaking.current = false;
      if (onEndRef.current) onEndRef.current();
    }
  }, [isSpeaking, isPaused]);

  return (
    <div className="flex items-center justify-between w-full p-3 bg-surface-container/50 border-t border-outline-variant/30 rounded-b-3xl">
      <div className="flex items-center gap-2">
        <Volume2 className="w-4 h-4 text-on-surface-variant ml-2 hidden sm:block" />
        <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider hidden sm:block">
          {t('speech.label') || 'Voice'}
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Speed Controls */}
        <div className="flex items-center bg-surface border border-outline-variant rounded-full overflow-hidden">
          {[0.75, 1, 1.5].map(s => (
            <button
              key={s}
              onClick={() => {
                setSpeed(s);
                if (isSpeaking && !isPaused) {
                  stop();
                  setTimeout(() => handlePlay(), 100);
                }
              }}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                speed === s 
                  ? 'bg-primary text-on-primary' 
                  : 'text-on-surface-variant hover:bg-surface-container-highest'
              }`}
            >
              {s}×
            </button>
          ))}
        </div>

        {/* Play/Stop Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePlay}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-on-primary shadow-md hover:bg-primary/90 transition-transform active:scale-95"
          >
            {(isSpeaking && !isPaused) ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
          </button>
          <button
            onClick={stop}
            disabled={!isSpeaking && !isPaused}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-surface border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Square className="w-4 h-4 fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
}
