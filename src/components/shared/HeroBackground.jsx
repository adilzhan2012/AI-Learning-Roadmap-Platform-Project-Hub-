import React, { useEffect, useRef, useState } from 'react';

export default function HeroBackground() {
  const containerRef = useRef(null);
  const path1Ref = useRef(null);
  const path2Ref = useRef(null);
  const path3Ref = useRef(null);

  const [dimensions, setDimensions] = useState({ width: 800, height: 220 });
  const [reducedMotion, setReducedMotion] = useState(false);

  // ResizeObserver to track container dimension changes
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({
          width: width || 800,
          height: height || 220,
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Listen for prefers-reduced-motion system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handleMotionPreferenceChange = (e) => {
      setReducedMotion(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMotionPreferenceChange);
    } else {
      mediaQuery.addListener(handleMotionPreferenceChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMotionPreferenceChange);
      } else {
        mediaQuery.removeListener(handleMotionPreferenceChange);
      }
    };
  }, []);

  // Animate waves using requestAnimationFrame by direct path mutation for high performance
  useEffect(() => {
    const path1 = path1Ref.current;
    const path2 = path2Ref.current;
    const path3 = path3Ref.current;

    if (!path1 || !path2 || !path3) return;

    const { width, height } = dimensions;
    const step = 12; // Point step in pixels (highly optimized for performance on mobile)

    // Wave parameters: [amplitude, frequency, speed, verticalOffsetFraction]
    const wave1 = { amp: height * 0.32, freq: 0.005, speed: 0.0016, offset: height * 0.38 };
    const wave2 = { amp: height * 0.24, freq: 0.008, speed: -0.0024, offset: height * 0.50 };
    const wave3 = { amp: height * 0.16, freq: 0.003, speed: 0.0010, offset: height * 0.62 };

    let animationFrameId;
    let phase = 0;

    const render = () => {
      // Calculate path 1 (primary accent)
      let d1 = `M 0 ${wave1.offset + Math.sin(phase * wave1.speed) * wave1.amp}`;
      // Calculate path 2 (tertiary accent/contrast)
      let d2 = `M 0 ${wave2.offset + Math.sin(phase * wave2.speed) * wave2.amp}`;
      // Calculate path 3 (subtle accent layer)
      let d3 = `M 0 ${wave3.offset + Math.sin(phase * wave3.speed) * wave3.amp}`;

      for (let x = step; x <= width; x += step) {
        const y1 = wave1.offset + Math.sin(x * wave1.freq + phase * wave1.speed) * wave1.amp;
        const y2 = wave2.offset + Math.sin(x * wave2.freq + phase * wave2.speed) * wave2.amp;
        const y3 = wave3.offset + Math.sin(x * wave3.freq + phase * wave3.speed) * wave3.amp;

        d1 += ` L ${x} ${y1}`;
        d2 += ` L ${x} ${y2}`;
        d3 += ` L ${x} ${y3}`;
      }

      path1.setAttribute('d', d1);
      path2.setAttribute('d', d2);
      path3.setAttribute('d', d3);

      if (!reducedMotion) {
        phase += 1;
        animationFrameId = requestAnimationFrame(render);
      }
    };

    // Render initial static / starting frame
    render();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [dimensions, reducedMotion]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden z-0"
      style={{ filter: 'blur(1.5px)' }}
    >
      <svg
        width={dimensions.width}
        height={dimensions.height}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        className="w-full h-full fill-none opacity-75 dark:opacity-55"
      >
        {/* Wave 1: primary accent */}
        <path
          ref={path1Ref}
          stroke="var(--color-accent)"
          strokeWidth="2.2"
          strokeOpacity="0.9"
          strokeLinecap="round"
        />
        {/* Wave 2: tertiary/secondary color */}
        <path
          ref={path2Ref}
          stroke="var(--md-tertiary, #1D4ED8)"
          strokeWidth="1.8"
          strokeOpacity="0.75"
          strokeLinecap="round"
        />
        {/* Wave 3: subtle accent layer */}
        <path
          ref={path3Ref}
          stroke="var(--color-accent)"
          strokeWidth="1.4"
          strokeOpacity="0.6"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
