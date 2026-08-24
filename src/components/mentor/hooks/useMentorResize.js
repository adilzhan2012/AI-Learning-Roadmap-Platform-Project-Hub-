import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'yourway-mentor-modal-size';
const DEFAULT_SIZE = { width: 750, height: 620 };
const MIN_WIDTH = 480;
const MAX_WIDTH = 1100;
const MIN_HEIGHT = 480;
const MAX_HEIGHT = 860;

export function useMentorResize() {
  const [size, setSize] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          width: Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, parsed.width || DEFAULT_SIZE.width)),
          height: Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, parsed.height || DEFAULT_SIZE.height)),
        };
      }
    } catch (e) {}
    return DEFAULT_SIZE;
  });

  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef({ startX: 0, startY: 0, startWidth: 0, startHeight: 0 });

  const startResizing = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: size.width,
      startHeight: size.height,
    };
  }, [size]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      const deltaX = (e.clientX - resizeRef.current.startX) * 2; // symmetric expand
      const deltaY = (e.clientY - resizeRef.current.startY) * 2;

      const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, resizeRef.current.startWidth + deltaX));
      const newHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, resizeRef.current.startHeight + deltaY));

      setSize({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(size));
      } catch (e) {}
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, size]);

  return {
    size,
    isResizing,
    startResizing,
  };
}
