import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

try {
  mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose',
    suppressErrorRendering: true
  });
} catch (e) {
  console.warn("Mermaid initialization warning:", e);
}

export default function MermaidDiagram({ chart }) {
  const containerRef = useRef(null);
  const [svg, setSvg] = useState('');
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setHasError(false);

    if (!chart || typeof chart !== 'string' || !chart.trim()) {
      return;
    }

    const renderChart = async () => {
      const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
      try {
        if (typeof mermaid.parse === 'function') {
          const isValid = await mermaid.parse(chart).catch(() => false);
          if (isValid === false && isMounted) {
            setHasError(true);
            return;
          }
        }

        const { svg: renderedSvg } = await mermaid.render(id, chart);
        if (isMounted) {
          setSvg(renderedSvg);
          setHasError(false);
        }
      } catch (error) {
        console.warn('Mermaid render error caught safely:', error);
        const tempEl = document.getElementById(id);
        if (tempEl) tempEl.remove();

        if (isMounted) {
          setHasError(true);
        }
      }
    };

    renderChart();
    return () => { isMounted = false; };
  }, [chart]);

  if (hasError) {
    return (
      <div className="my-6 p-4 bg-zinc-900/40 rounded-xl border border-zinc-800 text-xs font-mono text-zinc-400 overflow-x-auto">
        <div className="text-zinc-500 mb-2 font-sans font-medium">📊 Диаграмма (текстовый формат):</div>
        <pre className="whitespace-pre-wrap">{chart}</pre>
      </div>
    );
  }

  return (
    <div 
      className="my-8 flex justify-center bg-white dark:bg-zinc-900/80 rounded-xl p-6 overflow-x-auto border border-outline shadow-sm"
      ref={containerRef}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
