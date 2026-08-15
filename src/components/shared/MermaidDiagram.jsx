import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
});

export default function MermaidDiagram({ chart }) {
  const containerRef = useRef(null);
  const [svg, setSvg] = useState('');
  
  useEffect(() => {
    let isMounted = true;
    if (chart && containerRef.current) {
      const renderChart = async () => {
        try {
          const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
          const { svg: renderedSvg } = await mermaid.render(id, chart);
          if (isMounted) {
            setSvg(renderedSvg);
          }
        } catch (error) {
          console.error('Mermaid render error:', error);
          if (isMounted) {
            setSvg(`<div class="text-red-500 text-sm font-medium p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800/30 text-center">Failed to render diagram</div>`);
          }
        }
      };
      renderChart();
    }
    return () => { isMounted = false; };
  }, [chart]);

  return (
    <div 
      className="my-8 flex justify-center bg-white dark:bg-zinc-900 rounded-xl p-6 overflow-x-auto border border-outline shadow-sm"
      ref={containerRef}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
