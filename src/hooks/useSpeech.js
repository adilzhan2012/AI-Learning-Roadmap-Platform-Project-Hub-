import { useState, useCallback, useRef } from 'react';

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(1);

  const stripMarkdown = (text) =>
    text.replace(/[#*_`>[\]()!]/g, '').replace(/\n+/g, ' ').trim();

  const utterRef = useRef(null);

  const speak = useCallback((text, lang = 'ru-RU', rate = 1) => {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(stripMarkdown(text));
    utterRef.current = utter; // Save to prevent garbage collection in Chrome
    utter.lang = lang;
    utter.rate = rate;
    utter.onstart = () => { setIsSpeaking(true); setIsPaused(false); };
    utter.onend = () => { setIsSpeaking(false); setIsPaused(false); };
    utter.onerror = (e) => { 
      console.error("SpeechSynthesis error:", e);
      setIsSpeaking(false); setIsPaused(false); 
    };
    window.speechSynthesis.speak(utter);
  }, []);

  const pause = () => { window.speechSynthesis.pause(); setIsPaused(true); setIsSpeaking(false); };
  const resume = () => { window.speechSynthesis.resume(); setIsPaused(false); setIsSpeaking(true); };
  const stop = () => { window.speechSynthesis.cancel(); setIsSpeaking(false); setIsPaused(false); };

  return { speak, pause, resume, stop, isSpeaking, isPaused, speed, setSpeed };
}
