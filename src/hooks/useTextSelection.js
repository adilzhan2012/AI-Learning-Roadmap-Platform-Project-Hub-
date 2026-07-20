import { useState, useEffect, useCallback } from 'react';

export function useTextSelection(containerRef) {
  const [selection, setSelection] = useState(null);

  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection();
    const text = sel?.toString().trim();
    if (!text || text.split(' ').length < 3) {
      setSelection(null);
      return;
    }
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    setSelection({ text, rect });
  }, []);

  useEffect(() => {
    const el = containerRef?.current;
    if (!el) return;
    el.addEventListener('mouseup', handleMouseUp);
    el.addEventListener('touchend', handleMouseUp);
    return () => {
      el.removeEventListener('mouseup', handleMouseUp);
      el.removeEventListener('touchend', handleMouseUp);
    };
  }, [containerRef, handleMouseUp]);

  return { selection, clear: () => setSelection(null) };
}
