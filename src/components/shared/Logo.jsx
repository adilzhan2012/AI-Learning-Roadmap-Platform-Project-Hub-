import React, { useState, useEffect } from 'react';

/**
 * Universal yourway.co Logo Component using PNG images with transparent backgrounds.
 * 
 * Supports:
 * - variant: 'full' | 'icon'
 * - theme: 'dark' | 'light' | 'auto'
 * - scale: number (optional scaling factor)
 */
export default function Logo({ 
  variant = 'full', 
  theme = 'auto', 
  className = '', 
  iconOnly = false,
  onClick,
  scale = 1
}) {
  const [isDark, setIsDark] = useState(() => {
    if (theme === 'dark') return true;
    if (theme === 'light') return false;
    if (typeof document !== 'undefined') {
      return !document.documentElement.classList.contains('light');
    }
    return true;
  });

  useEffect(() => {
    if (theme === 'dark') {
      setIsDark(true);
      return;
    }
    if (theme === 'light') {
      setIsDark(false);
      return;
    }

    const checkTheme = () => {
      const isLight = document.documentElement.classList.contains('light');
      setIsDark(!isLight);
    };

    const handler = (e) => {
      if (e.detail && e.detail.theme) {
        setIsDark(e.detail.theme === 'dark');
      } else {
        checkTheme();
      }
    };

    window.addEventListener('theme:changed', handler);
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => {
      window.removeEventListener('theme:changed', handler);
      observer.disconnect();
    };
  }, [theme]);

  const isIcon = variant === 'icon' || iconOnly;

  const imageSrc = isDark
    ? (isIcon ? '/logo-icon-dark.png' : '/logo-dark.png')
    : (isIcon ? '/logo-icon-light.png' : '/logo-light.png');

  const hasCustomHeight = /\bh-/.test(className);
  const defaultHeightClass = hasCustomHeight ? '' : (isIcon ? 'h-8 md:h-9' : 'h-8 md:h-9');

  return (
    <div 
      onClick={onClick}
      className={`inline-flex items-center justify-center flex-shrink-0 select-none ${defaultHeightClass} ${className} ${onClick ? 'cursor-pointer' : ''}`}
    >
      <img 
        src={imageSrc} 
        alt="yourway.co" 
        style={scale !== 1 ? {
          transform: `scale(${scale})`,
          transformOrigin: 'center center'
        } : undefined}
        className="w-auto h-full max-h-full object-contain object-center block my-auto" 
      />
    </div>
  );
}
