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
            setSvg(`<div class="text-red-500 text-sm">Failed to render diagram</div>`);
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
