import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Calendar, 
  Trophy, 
  Clock, 
  CheckCircle, 
  XCircle, 
  BookOpen, 
  ArrowRight,
  Filter,
  BarChart3
} from 'lucide-react';
import { t, useLocale } from '../../i18n.js';

export default function QuizHistoryModal({ 
  isOpen, 
  onClose, 
  quizResults = {}, 
  selectedCourse = null, 
  initialNodeId = null,
  onSelectNode = null 
}) {
  const locale = useLocale();
  const [filterNodeId, setFilterNodeId] = useState(initialNodeId || 'all');

  // Keep filter synced with initialNodeId when it changes
  React.useEffect(() => {
    setFilterNodeId(initialNodeId || 'all');
  }, [initialNodeId, isOpen]);

  // Handle ESC and safe body scroll lock
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen || !selectedCourse) return null;

  // Map of nodes for easy label retrieval
  const nodesMap = useMemo(() => {
    const map = {};
    (selectedCourse.nodes || []).forEach(n => {
      map[n.id] = n;
    });
    return map;
  }, [selectedCourse]);

  // Aggregate all attempts
  const allAttempts = useMemo(() => {
    const list = [];
    Object.keys(quizResults).forEach(nodeId => {
      const nodeData = quizResults[nodeId];
      if (nodeData && nodeData.attempts && nodeData.attempts.length > 0) {
        nodeData.attempts.forEach((att, idx) => {
          list.push({
            nodeId,
            nodeTitle: nodesMap[nodeId]?.label || nodesMap[nodeId]?.title || nodeId,
            score: att.score,
            date: att.date,
            attemptIndex: idx + 1,
            passed: att.score >= 60
          });
        });
      }
    });

    // Sort by date descending
    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [quizResults, nodesMap]);

  // Filtered attempts
  const filteredAttempts = useMemo(() => {
    if (filterNodeId === 'all') return allAttempts;
    return allAttempts
      .filter(att => att.nodeId === filterNodeId)
      // Sort oldest to newest for single-node trend, but reverse for display table if needed.
      // We will reverse it when rendering the table so the newest attempt is on top.
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [allAttempts, filterNodeId]);

  // Stats calculation
  const stats = useMemo(() => {
    const attempts = filteredAttempts;
    if (attempts.length === 0) {
      return { total: 0, best: 0, avg: 0, passRate: 0 };
    }
    const scores = attempts.map(a => a.score);
    const total = attempts.length;
    const best = Math.max(...scores);
    const avg = Math.round(scores.reduce((acc, s) => acc + s, 0) / total);
    const passed = attempts.filter(a => a.score >= 60).length;
    const passRate = Math.round((passed / total) * 100);

    return { total, best, avg, passRate };
  }, [filteredAttempts]);

  const formatDate = (isoString) => {
    try {
      const date = new Date(isoString);
      const datePart = date.toLocaleDateString(locale === 'en' ? 'en-US' : 'ru-RU', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
      const timePart = date.toLocaleTimeString(locale === 'en' ? 'en-US' : 'ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      return locale === 'en' ? `${datePart} at ${timePart}` : `${datePart} в ${timePart}`;
    } catch {
      return isoString;
    }
  };

  // SVG Chart setup for single node trends
  const trendChart = useMemo(() => {
    if (filterNodeId === 'all' || filteredAttempts.length < 2) return null;

    // Limit to latest 15 attempts to prevent SVG point & label crowding
    const chartAttempts = filteredAttempts.length > 15
      ? filteredAttempts.slice(-15)
      : filteredAttempts;

    const width = 500;
    const height = 150;
    const paddingX = 40;
    const paddingY = 25;

    const minX = paddingX;
    const maxX = width - paddingX;
    const minY = paddingY;
    const maxY = height - paddingY;

    // Distribute X evenly
    const pts = chartAttempts.map((att, i) => {
      const x = minX + (i / (chartAttempts.length - 1)) * (maxX - minX);
      const y = maxY - (att.score / 100) * (maxY - minY);
      return { x, y, score: att.score, attemptIndex: att.attemptIndex };
    });

    // Generate smooth SVG path
    let pathD = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cpX = (p0.x + p1.x) / 2;
      pathD += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
    }

    // Area path for gradient fill
    const areaD = `${pathD} L ${pts[pts.length - 1].x} ${maxY} L ${pts[0].x} ${maxY} Z`;

    const thresholdY = maxY - (60 / 100) * (maxY - minY);

    return { pts, pathD, areaD, thresholdY, minX, maxX, minY, maxY, width, height };
  }, [filterNodeId, filteredAttempts]);

  const handleRowClick = (nodeId) => {
    if (onSelectNode) {
      onSelectNode(nodeId);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />

      {/* Dialog box */}
      <motion.div 
        initial={{ scale: 0.95, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 30, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-4xl bg-white dark:bg-[#111112] border border-zinc-200 dark:border-zinc-800 rounded-[24px] shadow-[0_24px_80px_rgba(0,0,0,0.4)] relative z-10 flex flex-col max-h-[85vh] text-zinc-900 dark:text-zinc-100 overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0 bg-white dark:bg-[#111112]">
          <div>
            <h2 className="text-xl font-bold font-clash text-zinc-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-500" />
              {locale === 'en' ? 'Quiz Assessment History' : 'История прохождений тестов'}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-mono">
              {locale === 'en' ? 'Course:' : 'Курс:'} {t(selectedCourse.title)}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter Dropdown */}
            <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[12px] px-3 py-1.5 shadow-sm">
              <Filter className="w-3.5 h-3.5 text-zinc-500" />
              <select
                value={filterNodeId}
                onChange={(e) => setFilterNodeId(e.target.value)}
                className="bg-transparent text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none pr-1 max-w-[200px] cursor-pointer"
              >
                <option value="all" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">{locale === 'en' ? 'All Topics' : 'Все темы'}</option>
                {(selectedCourse.nodes || []).map(n => {
                  const nodeResults = quizResults[n.id];
                  if (!nodeResults || !nodeResults.attempts || nodeResults.attempts.length === 0) return null;
                  return (
                    <option key={n.id} value={n.id} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">
                      {t(n.label || n.title)}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Close Button */}
            <button 
              onClick={onClose} 
              className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar bg-zinc-50 dark:bg-[#0B0F19]">
          
          {filteredAttempts.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400">
                <BookOpen className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-zinc-900 dark:text-white">
                {locale === 'en' ? 'No Quizzes Completed Yet' : 'Тесты еще не пройдены'}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mt-1.5 leading-relaxed">
                {locale === 'en'
                  ? 'Click "Start Lesson" on any unlocked topic in the graph, then complete the quiz to review results here.'
                  : 'Нажмите «Начать урок» на любой доступной теме графа, а затем завершите проверочный тест.'}
              </p>
            </div>
          ) : (
            <>
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: locale === 'en' ? 'Total Attempts' : 'Всего попыток', val: stats.total, icon: Clock, color: 'text-indigo-500' },
                  { label: locale === 'en' ? 'Best Score' : 'Лучший балл', val: `${stats.best}%`, icon: Trophy, color: 'text-amber-500' },
                  { label: locale === 'en' ? 'Average Score' : 'Средний балл', val: `${stats.avg}%`, icon: BarChart3, color: 'text-blue-500' },
                  { label: locale === 'en' ? 'Pass Rate' : 'Успешность', val: `${stats.passRate}%`, icon: CheckCircle, color: stats.passRate >= 60 ? 'text-emerald-500' : 'text-rose-500' }
                ].map((kpi, idx) => (
                  <div key={idx} className="bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-[16px] p-4 flex flex-col gap-1 shadow-sm">
                    <div className="flex justify-between items-center text-zinc-500 dark:text-zinc-400">
                      <span className="text-[10px] font-bold uppercase tracking-wider">{kpi.label}</span>
                      <kpi.icon className={`w-3.5 h-3.5 ${kpi.color}`} />
                    </div>
                    <span className="text-2xl font-black font-clash text-zinc-900 dark:text-white mt-1">{kpi.val}</span>
                  </div>
                ))}
              </div>

              {/* Score Trend Chart for single topic */}
              {trendChart && (
                <div className="bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-[16px] p-4 shadow-sm">
                  <span className="text-xs font-bold text-zinc-900 dark:text-white mb-3 block">
                    {locale === 'en' ? 'Score Performance Trend' : 'Динамика результатов (прогресс)'}
                  </span>
                  <div className="w-full overflow-x-auto">
                    <svg viewBox={`0 0 ${trendChart.width} ${trendChart.height}`} className="w-full min-w-[450px] overflow-visible">
                      <defs>
                        <linearGradient id="modalChartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Horizontal Guideline (Passing threshold 60%) */}
                      <line 
                        x1={trendChart.minX} 
                        y1={trendChart.thresholdY} 
                        x2={trendChart.maxX} 
                        y2={trendChart.thresholdY} 
                        stroke="rgba(239,68,68,0.4)" 
                        strokeDasharray="4 4" 
                        strokeWidth="1.2"
                      />
                      <text 
                        x={trendChart.minX + 5} 
                        y={trendChart.thresholdY - 4} 
                        fill="#ef4444" 
                        fontSize="9" 
                        fontWeight="bold"
                        className="font-mono"
                      >
                        {locale === 'en' ? '60% Pass Threshold' : '60% Порог'}
                      </text>

                      {/* Area and Line Path */}
                      <path d={trendChart.areaD} fill="url(#modalChartGrad)" />
                      <path 
                        d={trendChart.pathD} 
                        fill="none" 
                        stroke="#6366f1" 
                        strokeWidth="2.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                      />

                      {/* Nodes */}
                      {trendChart.pts.map((p, idx) => (
                        <g key={idx}>
                          <circle cx={p.x} cy={p.y} r="6" fill="#ffffff" stroke="#6366f1" strokeWidth="2" />
                          <circle cx={p.x} cy={p.y} r="3" fill="#6366f1" />
                          
                          {/* Floating score label */}
                          <rect 
                            x={p.x - 16} 
                            y={p.y - 22} 
                            width="32" 
                            height="14" 
                            rx="3" 
                            fill="#1e1b4b" 
                            stroke="rgba(99,102,241,0.4)" 
                            strokeWidth="0.5" 
                          />
                          <text 
                            x={p.x} 
                            y={p.y - 12} 
                            fill="#ffffff" 
                            fontSize="8" 
                            fontWeight="bold" 
                            textAnchor="middle" 
                            className="font-mono"
                          >
                            {p.score}%
                          </text>

                          {/* X-axis labels */}
                          <text 
                            x={p.x} 
                            y={trendChart.maxY + 15} 
                            fill="#71717a" 
                            fontSize="8" 
                            textAnchor="middle" 
                            className="font-sans"
                          >
                            {locale === 'en' ? `Attempt ${p.attemptIndex}` : `Попытка ${p.attemptIndex}`}
                          </text>
                        </g>
                      ))}
                    </svg>
                  </div>
                </div>
              )}

              {/* Attempts Table */}
              <div className="bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-[16px] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/70 dark:bg-zinc-800/40 text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold">
                        <th className="px-5 py-3 font-sans">{locale === 'en' ? 'Date & Time' : 'Дата и время'}</th>
                        {filterNodeId === 'all' && <th className="px-5 py-3 font-sans">{locale === 'en' ? 'Lesson Topic' : 'Тема урока'}</th>}
                        <th className="px-5 py-3 font-sans">{locale === 'en' ? 'Attempt' : 'Попытка'}</th>
                        <th className="px-5 py-3 font-sans">{locale === 'en' ? 'Score' : 'Оценка'}</th>
                        <th className="px-5 py-3 font-sans text-center">{locale === 'en' ? 'Result' : 'Результат'}</th>
                        <th className="px-5 py-3 font-sans text-right">{locale === 'en' ? 'Action' : 'Действие'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60 text-xs text-zinc-900 dark:text-zinc-100">
                      {/* For table view, display attempts newest to oldest */}
                      {((filterNodeId !== 'all') ? [...filteredAttempts].reverse() : filteredAttempts).map((att, idx) => (
                        <tr 
                          key={idx} 
                          className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group"
                        >
                          <td className="px-5 py-3.5 font-mono text-zinc-500 dark:text-zinc-400">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 opacity-60" />
                              <span>{formatDate(att.date)}</span>
                            </div>
                          </td>
                          {filterNodeId === 'all' && (
                            <td className="px-5 py-3.5 font-semibold text-zinc-900 dark:text-white max-w-[220px] truncate">
                              <button 
                                onClick={() => handleRowClick(att.nodeId)}
                                className="hover:underline text-left cursor-pointer"
                              >
                                {att.nodeTitle}
                              </button>
                            </td>
                          )}
                          <td className="px-5 py-3.5 text-zinc-500 dark:text-zinc-400 font-medium font-mono">
                            #{att.attemptIndex}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <span className="font-bold font-mono text-zinc-900 dark:text-white min-w-[32px]">{att.score}%</span>
                              <div className="w-20 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden hidden sm:block">
                                <div 
                                  className={`h-full rounded-full ${att.passed ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                  style={{ width: `${att.score}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border bg-zinc-100 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700">
                              {att.passed ? (
                                <>
                                  <CheckCircle className="w-3 h-3 text-emerald-500" />
                                  <span className="text-emerald-600 dark:text-emerald-400">{locale === 'en' ? 'Passed' : 'Сдано'}</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3 h-3 text-rose-500" />
                                  <span className="text-rose-600 dark:text-rose-400">{locale === 'en' ? 'Not passed' : 'Не сдано'}</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              onClick={() => handleRowClick(att.nodeId)}
                              className="text-xs font-bold text-zinc-700 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 px-3 py-1.5 rounded-[8px] transition-all inline-flex items-center gap-1 opacity-80 group-hover:opacity-100 cursor-pointer shadow-sm"
                            >
                              {locale === 'en' ? 'Go to' : 'Перейти'}
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

        </div>
      </motion.div>
    </div>
  );
}
