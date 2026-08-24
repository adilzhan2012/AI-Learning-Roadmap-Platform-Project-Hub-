import React, { useState, useEffect, useMemo, useRef } from "react";
import { Sparkles, Brain, Check, Lock, Loader2, ArrowDown } from "lucide-react";
import { useLocale } from "../../i18n.js";

/**
 * CourseGraphThinking
 * -------------------------------------------------------------
 * Premium AI Neural Network animation during course graph generation.
 * Full-width & full-height canvas on the /graph page.
 */

const VB_W = 900;
const SPINE_X = 450;
const TOP_Y = 70;
const DEST_Y = 320; // Single central convergence orb!

const THREAD_COUNT = 9;
const THREAD_STAGGER = 220;
const SEG_DUR = 500;
const BRANCH_HOLD = 600;

const MERGE_DUR = 800;
const SPINE_DUR = 600;
const CONVERGE_HOLD = 200;

const CARD_STAGGER = 320;

const BRANCH_MS = (THREAD_COUNT - 1) * THREAD_STAGGER + 2 * SEG_DUR + BRANCH_HOLD;
const CONVERGE_MS = MERGE_DUR + SPINE_DUR + CONVERGE_HOLD;

const STATUS_RU = {
  prompt: "Инициализация нейросети и анализ запроса…",
  branching: "Выстраивание логических связей и цепочек тем…",
  converging: "Сведение мыслей в единое ядро знаний…",
  cards: "Генерация обучающих модулей и карточек…",
  done: "Граф курса успешно сформирован!",
};

const STATUS_EN = {
  prompt: "Initializing neural network & analyzing request...",
  branching: "Building logical pathways and topic chains...",
  converging: "Synthesizing thoughts into core knowledge graph...",
  cards: "Generating learning modules and checkpoints...",
  done: "Course graph generated successfully!",
};

const THREAD_COLORS = [
  "#38BDF8", "#818CF8", "#C084FC", "#4ADE80", 
  "#F43F5E", "#FBBF24", "#60A5FA", "#A78BFA", "#34D399"
];

const BASE_THOUGHT_POOL_RU = [
  "Уровень сложности", "Анализ синтаксиса", "Базовые понятия", 
  "Простое → сложное", "Примеры и теория", "Логика программы", 
  "Практика на коде", "Модули курса", "Интервалы повторений", 
  "Тестирование знаний", "Реальный проект", "Фреймворки и стек", 
  "Паттерны проектирования", "Оптимизация кода", "Итоговый экзамен"
];

const BASE_THOUGHT_POOL_EN = [
  "Difficulty Level", "Syntax Analysis", "Core Concepts", 
  "Simple → Advanced", "Examples & Theory", "Logic & Architecture", 
  "Hands-on Coding", "Course Modules", "Spaced Repetition", 
  "Quiz & Assessment", "Real-world Project", "Frameworks & Stack", 
  "Design Patterns", "Code Optimization", "Final Exam"
];

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function shuffled(arr, rnd) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildThoughtPool(topic, locale = 'ru') {
  const basePool = locale === 'en' ? BASE_THOUGHT_POOL_EN : BASE_THOUGHT_POOL_RU;
  if (!topic) return basePool;
  const words = topic
    .replace(/[^\w\u0400-\u04FF\s]/gi, '')
    .split(/\s+/)
    .filter((w) => w.length > 3);
  
  const topicThoughts = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  return [...new Set([...topicThoughts, ...basePool])];
}

function buildNeuralThreads(seed, thoughtPool) {
  const rnd = seededRandom(seed);
  const threads = [];
  const labels = shuffled(thoughtPool, rnd);

  for (let i = 0; i < THREAD_COUNT; i++) {
    const t = (i - (THREAD_COUNT - 1) / 2) / ((THREAD_COUNT - 1) / 2); // -1.0 to +1.0
    const spreadX = t * 310 + (rnd() - 0.5) * 20;

    const p0 = { x: SPINE_X, y: TOP_Y };
    const p1 = { x: SPINE_X + spreadX * 0.7, y: 155, label: labels[(i * 2) % labels.length] };
    const p2 = { x: SPINE_X + spreadX, y: 245, label: labels[(i * 2 + 1) % labels.length] };
    const p3 = { x: SPINE_X, y: DEST_Y, label: null }; // All 9 threads converge directly to DEST_Y!

    threads.push({
      id: i,
      pts: [p0, p1, p2, p3],
      color: THREAD_COLORS[i % THREAD_COLORS.length],
      delay: i * THREAD_STAGGER,
    });
  }
  return threads;
}

function generateFallbackModules(topic, level, preferences, locale = 'ru') {
  const clean = topic ? topic.replace(/^(курс|курс по|course on|course)\s+/i, '').trim() : (locale === 'en' ? "Topics" : "Темы");
  const cap = clean.charAt(0).toUpperCase() + clean.slice(1);
  const dur = preferences?.duration || 'Standard';

  let count = 8;
  if (dur === 'Express') count = 5;
  else if (dur === 'Deep Dive' || dur === 'Masterclass') count = 12;
  else count = 8;

  const listRu = [
    `1. Введение и базовый контекст ${cap}`,
    `2. Фундаментальные понятия и синтаксис`,
    `3. Архитектура и структуры данных ${cap}`,
    `4. Обработка ошибок и отладка`,
    `5. Практический модуль: первая сборка`,
    `6. Финальный проект: Практическое применение`,
    `7. Оптимизация и производительность`,
    `8. Продвинутые паттерны и концепции`,
    `9. Безопасность и масштабируемость`,
    `10. Интеграции и внешние сервисы`,
    `11. Подготовка к реальным задачам`,
    `12. Итоговый проект и сертификация`,
    `13. Тестирование и ревью кода`,
  ];

  const listEn = [
    `1. Introduction & Core Concepts of ${cap}`,
    `2. Fundamental Principles and Syntax`,
    `3. Architecture and Data Structures of ${cap}`,
    `4. Error Handling and Debugging`,
    `5. Practical Hands-on Workshop`,
    `6. Milestone Project: Real-World Build`,
    `7. Performance & Optimization`,
    `8. Advanced Patterns & Techniques`,
    `9. Security and Scalability`,
    `10. Integrations & External APIs`,
    `11. Production Readiness & Workflow`,
    `12. Final Capstone Project & Certification`,
    `13. Testing and Code Review`,
  ];

  const list = locale === 'en' ? listEn : listRu;
  return list.slice(0, count);
}

export default function CourseGraphThinking({
  topic = "",
  level = "Beginner",
  preferences = null,
  nodes = null,
  isGenerating = false,
  onComplete = null,
  showReplay = false,
  isLightTheme = false,
}) {
  const locale = useLocale();
  const isLight = isLightTheme || (typeof document !== 'undefined' && document.documentElement.classList.contains('light'));
  const statusDict = locale === 'en' ? STATUS_EN : STATUS_RU;

  const [phase, setPhase] = useState("prompt");
  const [cycle, setCycle] = useState(0);
  const [chainStep, setChainStep] = useState(0);
  const cardsContainerRef = useRef(null);
  const activeCardRef = useRef(null);

  const thoughtPool = useMemo(() => buildThoughtPool(topic, locale), [topic, locale]);
  const threads = useMemo(() => buildNeuralThreads(cycle * 97 + 13, thoughtPool), [cycle, thoughtPool]);

  // Dynamic course nodes: uses exact AI nodes when available, or fallback preview list matching exact target mode
  const courseNodes = useMemo(() => {
    if (Array.isArray(nodes) && nodes.length > 0) {
      return nodes.map((n, i) => {
        const title = n.label || n.title || (locale === 'en' ? `Module ${i + 1}` : `Модуль ${i + 1}`);
        const isCheckpoint = title.toLowerCase().includes('checkpoint') || title.toLowerCase().includes('project') || title.toLowerCase().includes('проект');
        return {
          id: n.id || `node-${i}`,
          title: title,
          active: i === 0 || n.status === "active",
          isCheckpoint: isCheckpoint,
          isLocked: n.status === "locked",
        };
      });
    }
    const fallbacks = generateFallbackModules(topic, level, preferences, locale);
    return fallbacks.map((t, i) => {
      const isCheckpoint = t.toLowerCase().includes('project') || t.toLowerCase().includes('проект') || i === fallbacks.length - 1;
      return {
        id: `fallback-${i}`,
        title: t,
        active: i === 0,
        isCheckpoint: isCheckpoint,
        isLocked: i > 0,
      };
    });
  }, [nodes, topic, level, preferences, locale]);

  const promptText = useMemo(() => {
    if (!topic) return locale === 'en' ? "✨ \"Personalized Learning Path\"" : "✨ «Индивидуальный курс обучения»";
    const clean = topic.trim();
    if (locale === 'en') {
      if (clean.toLowerCase().startsWith("course")) return `✨ "${clean}"`;
      return `✨ "Course on ${clean}"`;
    }
    if (clean.toLowerCase().startsWith("курс")) return `✨ «${clean}»`;
    return `✨ «Курс по ${clean}»`;
  }, [topic, locale]);

  const calcHeight = Math.max(1050, DEST_Y + 120 + courseNodes.length * 95);

  useEffect(() => {
    const timers = [];
    setPhase("prompt");
    setChainStep(0);

    const tBranch = 700;
    const tConverge = tBranch + BRANCH_MS;
    const tCards = tConverge + CONVERGE_MS;
    const tDone = tCards + courseNodes.length * CARD_STAGGER + 500;

    timers.push(setTimeout(() => setPhase("branching"), tBranch));
    timers.push(setTimeout(() => setPhase("converging"), tConverge));
    timers.push(setTimeout(() => setPhase("cards"), tCards));
    timers.push(setTimeout(() => setPhase("done"), tDone));

    if (showReplay) {
      const tReplay = tDone + 3400;
      timers.push(setTimeout(() => setCycle((c) => c + 1), tReplay));
    }

    return () => timers.forEach(clearTimeout);
  }, [cycle, courseNodes.length, showReplay]);

  useEffect(() => {
    if (phase !== "branching") return;
    const timers = [];
    for (let i = 0; i < THREAD_COUNT; i++) {
      timers.push(setTimeout(() => setChainStep(i + 1), i * THREAD_STAGGER + 60));
    }
    return () => timers.forEach(clearTimeout);
  }, [phase]);

  // Auto-scroll downwards to center newly created cards as they appear
  useEffect(() => {
    if (phase === "cards" || phase === "done") {
      if (activeCardRef.current && cardsContainerRef.current) {
        activeCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [phase]);

  const hasCompletedRef = useRef(false);

  // Handle completion: when isGenerating becomes false (AI generation finished), complete immediately!
  useEffect(() => {
    if (!onComplete || hasCompletedRef.current) return;

    if (!isGenerating) {
      hasCompletedRef.current = true;
      setPhase("done");
      onComplete();
    }
  }, [isGenerating, onComplete]);

  const phaseIndex = ["prompt", "branching", "converging", "cards", "done"].indexOf(phase);

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-[#070913] text-white font-sans flex flex-col justify-between items-center py-6 px-4 relative overflow-hidden select-none">
      {/* Background ambient radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-indigo-600/10 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-600/10 blur-[120px] pointer-events-none rounded-full" />

      {/* Main Animation Stage */}
      <div className="w-full max-w-[850px] relative z-10 flex-1 flex flex-col items-center">
        {/* Scrollable Stage Wrapper */}
        <div 
          ref={cardsContainerRef}
          className="w-full relative overflow-y-auto max-h-[calc(100vh-12rem)] rounded-2xl border border-white/10 bg-[#0B0F19]/80 backdrop-blur-xl shadow-2xl custom-scrollbar"
          style={{ minHeight: '620px' }}
        >
          {/* Subtle Dot Grid */}
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

          {/* SVG Vector Layer for Neural Paths & Spine */}
          <svg 
            viewBox={`0 0 ${VB_W} ${calcHeight}`} 
            className="w-full h-auto block relative z-10"
            style={{ minHeight: `${calcHeight}px` }}
            preserveAspectRatio="xMidYMin meet"
          >
            <defs>
              <filter id="glow-neon" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Top Prompt Origin Dot */}
            <circle
              cx={SPINE_X}
              cy={TOP_Y}
              r={phase === "prompt" ? 10 : 4}
              className="fill-sky-400 transition-all duration-500"
              filter="url(#glow-neon)"
            />

            {/* 9 Sleek Organic Neural Threads Branching Out & Converging to Y=320 */}
            <g filter="url(#glow-neon)">
              {threads.map((thread) => (
                <g key={thread.id}>
                  {thread.pts.slice(1).map((pt, segIdx) => {
                    const prev = thread.pts[segIdx];
                    const drawDelay = thread.delay + segIdx * SEG_DUR;
                    
                    // Smooth curved Bezier segment
                    const d = segIdx === 0
                      ? `M ${prev.x} ${prev.y} Q ${prev.x + (pt.x - prev.x) * 0.5} ${prev.y + 40}, ${pt.x} ${pt.y}`
                      : segIdx === 1
                      ? `M ${prev.x} ${prev.y} L ${pt.x} ${pt.y}`
                      : `M ${prev.x} ${prev.y} Q ${pt.x + (prev.x - pt.x) * 0.5} ${pt.y - 30}, ${pt.x} ${pt.y}`;

                    return (
                      <g key={segIdx}>
                        <path
                          d={d}
                          fill="none"
                          stroke={thread.color}
                          strokeWidth="1.4"
                          strokeLinecap="round"
                          className={`transition-opacity duration-300 ${phaseIndex >= 1 ? "opacity-90" : "opacity-0"}`}
                          style={{
                            strokeDasharray: 300,
                            strokeDashoffset: phaseIndex >= 1 ? 0 : 300,
                            transition: `stroke-dashoffset ${SEG_DUR}ms ease-out ${drawDelay}ms, opacity 300ms ease`,
                          }}
                        />
                        {/* Node dots anchored at path joints */}
                        {pt.label && (
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r="3.5"
                            fill={thread.color}
                            className={`transition-all duration-300 ${phaseIndex >= 1 ? "opacity-100 scale-100" : "opacity-0 scale-0"}`}
                            style={{ transitionDelay: `${drawDelay + SEG_DUR - 60}ms` }}
                          />
                        )}
                      </g>
                    );
                  })}
                </g>
              ))}
            </g>

            {/* ONE Single Glowing Convergence Center Orb at Y=320 */}
            {phaseIndex >= 1 && (
              <g filter="url(#glow-neon)">
                <circle
                  cx={SPINE_X}
                  cy={DEST_Y}
                  r={phaseIndex >= 2 ? 14 : 7}
                  className={`transition-all duration-500 ${phaseIndex >= 2 ? "fill-amber-400 stroke-blue-500 orb-core-pulse" : "fill-blue-500 stroke-white"}`}
                  strokeWidth="3"
                />
                {phaseIndex >= 2 && (
                  <circle
                    cx={SPINE_X}
                    cy={DEST_Y}
                    fill="none"
                    stroke="#F5D949"
                    strokeWidth="1.5"
                    className="orb-halo"
                  />
                )}
              </g>
            )}

            {/* Central Y-Axis Spine Line Extending Downwards from Convergence Orb (Y=320 -> End) */}
            <line
              x1={SPINE_X}
              y1={DEST_Y}
              x2={SPINE_X}
              y2={calcHeight - 40}
              stroke="#3b82f6"
              strokeWidth="2.5"
              strokeDasharray="6 4"
              className={`transition-all duration-700 ${phaseIndex >= 3 ? "opacity-100" : "opacity-0"}`}
            />

            {/* Spine Connector Rectangles for Cards */}
            {phaseIndex >= 3 &&
              courseNodes.map((_, i) => {
                const y = DEST_Y + 75 + i * 95;
                return (
                  <rect
                    key={i}
                    x={SPINE_X - 3}
                    y={y - 8}
                    width="6"
                    height="16"
                    rx="3"
                    className="fill-sky-400 transition-all duration-300"
                  />
                );
              })}
          </svg>

          {/* HTML Overlay: Labels Anchored Directly Next to Node Dots */}
          <div className="absolute inset-0 pointer-events-none z-20">
            {threads.map((thread) =>
              thread.pts.slice(1).map((pt, segIdx) => {
                if (!pt.label) return null;
                const drawDelay = thread.delay + segIdx * SEG_DUR;
                const isLeft = pt.x < SPINE_X;
                const leftPct = (pt.x / VB_W) * 100;
                const topPct = (pt.y / calcHeight) * 100;

                return (
                  <div
                    key={`${thread.id}-lbl-${segIdx}`}
                    className={`absolute text-[11px] font-semibold tracking-wide px-2 py-0.5 rounded-md ${
                      isLight ? 'bg-white/95 border-zinc-200 shadow-md' : 'bg-[#0D1322]/90 border-white/10 shadow-lg'
                    } border whitespace-nowrap transition-all duration-300 ${
                      phaseIndex >= 1 ? "opacity-100 scale-100" : "opacity-0 scale-95"
                    }`}
                    style={{
                      left: `${leftPct}%`,
                      top: `${topPct}%`,
                      color: isLight ? '#1e293b' : thread.color,
                      transform: isLeft ? "translate(-100%, -50%) translateX(-8px)" : "translate(0, -50%) translateX(8px)",
                      transitionDelay: `${drawDelay + SEG_DUR - 60}ms`,
                    }}
                  >
                    {pt.label}
                  </div>
                );
              })
            )}
          </div>

          {/* Top Prompt Chip */}
          <div className={`absolute left-1/2 top-4 -translate-x-1/2 z-30 transition-all duration-500 ${
            isLight ? 'bg-white border-zinc-300 text-zinc-900 shadow-md' : 'bg-[#131B2E] border-slate-700 text-slate-100 shadow-xl'
          } border text-xs font-bold px-4 py-2 rounded-full flex items-center gap-2 ${phase === 'prompt' ? 'opacity-100 translate-y-0' : 'opacity-80 -translate-y-1'}`}>
            <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>{promptText}</span>
          </div>

          {/* Uniform Cards Feed: Materializing Downwards (Matches Graph Node Styling 100%!) */}
          <div className="absolute inset-0 pointer-events-none z-30">
            {courseNodes.map((node, i) => {
              const topY = DEST_Y + 75 + i * 95;
              const topPct = ((topY - 28) / calcHeight) * 100;
              const show = phaseIndex >= 3;

              const isCheckpoint = node.isCheckpoint || node.title.toLowerCase().includes('проект');
              
              let cardBgClasses = "bg-[#ffe100] text-black border-2 border-black font-bold shadow-md";
              if (isCheckpoint) {
                cardBgClasses = "bg-[#1a1a1a] text-slate-100 border-2 border-black font-bold shadow-md";
              } else if (node.isLocked) {
                cardBgClasses = isLight 
                  ? "bg-zinc-200 text-zinc-700 border border-zinc-300 font-semibold" 
                  : "bg-[#27272a] text-zinc-400 border border-zinc-800 font-semibold";
              }

              return (
                <div
                  key={node.id}
                  ref={i === Math.min(courseNodes.length - 1, phaseIndex >= 3 ? Math.floor((courseNodes.length) / 2) : 0) ? activeCardRef : null}
                  className={`absolute left-1/2 -translate-x-1/2 w-[88%] max-w-[620px] min-h-[56px] rounded-[14px] px-6 py-2.5 flex items-center justify-between gap-3 transition-all duration-500 shadow-xl pointer-events-auto ${
                    show ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95"
                  } ${cardBgClasses}`}
                  style={{ 
                    top: `${topPct}%`,
                    transitionDelay: `${i * CARD_STAGGER}ms` 
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${isCheckpoint ? 'bg-amber-400 text-black' : 'bg-black text-[#ffe100]'}`}>
                      {i + 1}
                    </div>
                    <span className="text-xs sm:text-sm font-black truncate leading-tight tracking-wide">
                      {node.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {node.active ? (
                      <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${isCheckpoint ? 'bg-amber-400/20 text-amber-300 border-amber-400/40' : 'bg-black/10 text-black border-black/30'}`}>
                        <Sparkles className="w-3 h-3 fill-current" />
                        {locale === 'en' ? 'Start' : 'Старт'}
                      </span>
                    ) : isCheckpoint ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-full">
                        ★ {locale === 'en' ? 'Project' : 'Проект'}
                      </span>
                    ) : (
                      <div className="p-1 rounded-md bg-black/10 text-black">
                        <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Status Bar */}
      <div className={`w-full max-w-[850px] mt-4 z-20 flex flex-col sm:flex-row items-center justify-between gap-3 ${
        isLight ? 'bg-white/95 border-zinc-200 text-zinc-900 shadow-md' : 'bg-[#0B0F19]/90 border-white/10 text-slate-200 shadow-lg'
      } border p-4 rounded-xl backdrop-blur-md font-sans`}>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${phase !== 'done' || isGenerating ? 'bg-blue-500 animate-ping' : 'bg-emerald-500'}`} />
          <span className={`text-xs sm:text-sm font-bold ${isLight ? 'text-zinc-900' : 'text-slate-200'} font-clash tracking-wide`}>
            {isGenerating && phase === 'done' 
              ? (locale === 'en' ? 'AI is finalizing course modules…' : 'ИИ завершает формирование модулей…') 
              : statusDict[phase]}
          </span>
        </div>

        {phase === "branching" && (
          <div className="text-xs font-semibold text-sky-500 bg-sky-500/10 border border-sky-500/20 px-3 py-1 rounded-full">
            {locale === 'en' ? `Neural thread: ${Math.min(chainStep, THREAD_COUNT)} / ${THREAD_COUNT}` : `Нейросеть: поток ${Math.min(chainStep, THREAD_COUNT)} / ${THREAD_COUNT}`}
          </div>
        )}

        {phase === "done" && (
          <div className="text-xs font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-1.5">
            {isGenerating ? (
              <Loader2 className="w-3.5 h-3.5 text-emerald-500 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            )}
            <span>{isGenerating ? (locale === 'en' ? 'Saving course…' : 'Сохранение курса…') : (locale === 'en' ? 'Opening graph…' : 'Переходим к графу…')}</span>
          </div>
        )}
      </div>

      <style>{`
        .orb-core-pulse {
          animation: orb-core 1.5s ease-in-out infinite alternate;
        }
        @keyframes orb-core {
          0% { r: 12px; filter: drop-shadow(0 0 8px rgba(245, 217, 73, 0.6)); }
          100% { r: 16px; filter: drop-shadow(0 0 20px rgba(245, 217, 73, 1)); }
        }
        .orb-halo {
          animation: orb-halo-ring 2s ease-in-out infinite;
          transform-origin: 450px 320px;
        }
        @keyframes orb-halo-ring {
          0% { r: 14px; opacity: 0.8; stroke-width: 2px; }
          50% { r: 28px; opacity: 0.3; stroke-width: 1px; }
          100% { r: 38px; opacity: 0; stroke-width: 0.5px; }
        }
      `}</style>
    </div>
  );
}
