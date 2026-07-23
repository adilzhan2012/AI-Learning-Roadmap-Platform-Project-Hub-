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
import { t } from '../../i18n.js';

export default function QuizHistoryModal({ 
  isOpen, 
  onClose, 
  quizResults = {}, 
  selectedCourse = null, 
  initialNodeId = null,
  onSelectNode = null 
}) {
  const [filterNodeId, setFilterNodeId] = useState(initialNodeId || 'all');

  // Keep filter synced with initialNodeId when it changes
  React.useEffect(() => {
    setFilterNodeId(initialNodeId || 'all');
  }, [initialNodeId, isOpen]);

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
      return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }) + ' в ' + date.toLocaleTimeString(undefined, { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return isoString;
    }
  };

  // SVG Chart setup for single node trends
  const trendChart = useMemo(() => {
    if (filterNodeId === 'all' || filteredAttempts.length < 2) return null;

    const width = 500;
    const height = 150;
    const paddingX = 40;
    const paddingY = 25;

    const minX = paddingX;
    const maxX = width - paddingX;
    const minY = paddingY;
    const maxY = height - paddingY;

    const pts = filteredAttempts.map((att, i) => {
      const x = minX + (i * (maxX - minX)) / (filteredAttempts.length - 1);
      const y = maxY - (att.score * (maxY - minY)) / 100;
      return { x, y, score: att.score, attemptIndex: att.attemptIndex };
    });

    const pathD = pts.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    const areaD = `${pathD} L ${pts[pts.length - 1].x} ${maxY} L ${pts[0].x} ${maxY} Z`;
    const thresholdY = maxY - (60 * (maxY - minY)) / 100;

    return { width, height, pts, pathD, areaD, thresholdY, minX, maxX, maxY };
  }, [filteredAttempts, filterNodeId]);

  const handleRowClick = (nodeId) => {
    if (onSelectNode) {
      onSelectNode(nodeId);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
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
        className="w-full max-w-4xl bg-surface border border-outline rounded-[24px] shadow-[0_24px_80px_rgba(0,0,0,0.6)] relative z-10 flex flex-col max-h-[85vh] text-on-background overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-outline flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0 bg-surface">
          <div>
            <h2 className="text-xl font-bold font-clash text-on-surface flex items-center gap-2">
              <Clock className="w-5 h-5 text-on-surface-variant" />
              История прохождений тестов
            </h2>
            <p className="text-xs text-on-surface-variant mt-1 font-mono">
              Курс: {t(selectedCourse.title)}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter Dropdown */}
            <div className="flex items-center gap-2 bg-surface-container/40 border border-outline rounded-[12px] px-3 py-1.5">
              <Filter className="w-3.5 h-3.5 text-on-surface-variant" />
              <select
                value={filterNodeId}
                onChange={(e) => setFilterNodeId(e.target.value)}
                className="bg-transparent text-xs text-on-surface focus:outline-none pr-1 max-w-[200px] cursor-pointer"
              >
                <option value="all" className="bg-surface">Все темы</option>
                {(selectedCourse.nodes || []).map(n => {
                  const nodeResults = quizResults[n.id];
                  if (!nodeResults || !nodeResults.attempts || nodeResults.attempts.length === 0) return null;
                  return (
                    <option key={n.id} value={n.id} className="bg-surface">
                      {t(n.label || n.title)}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Close Button */}
            <button 
              onClick={onClose} 
              className="p-2 rounded-full hover:bg-surface-container/60 border border-outline-variant transition-colors"
            >
              <X className="w-4 h-4 text-on-surface-variant hover:text-on-surface" />
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar bg-[#111112]">
          
          {filteredAttempts.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-xl bg-surface-container/40 border border-outline-variant flex items-center justify-center mb-4">
                <BookOpen className="w-5 h-5 text-on-surface-variant" />
              </div>
              <p className="text-sm font-semibold text-on-background">Тесты еще не пройдены</p>
              <p className="text-xs text-on-surface-variant max-w-sm mt-1 leading-relaxed">
                Нажмите «Начать урок» на любой доступной теме графа, а затем завершите проверочный тест.
              </p>
            </div>
          ) : (
            <>
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Всего попыток', val: stats.total, icon: Clock, color: 'text-on-surface' },
                  { label: 'Лучший балл', val: `${stats.best}%`, icon: Trophy, color: 'text-[#FFD700]' },
                  { label: 'Средний балл', val: `${stats.avg}%`, icon: BarChart3, color: 'text-on-surface-variant' },
                  { label: 'Успешность', val: `${stats.passRate}%`, icon: CheckCircle, color: stats.passRate >= 60 ? 'text-on-surface' : 'text-[#FF453A]' }
                ].map((kpi, idx) => (
                  <div key={idx} className="bg-surface border border-outline rounded-[16px] p-4 flex flex-col gap-1">
                    <div className="flex justify-between items-center text-on-surface-variant">
                      <span className="text-[10px] font-semibold uppercase tracking-wider">{kpi.label}</span>
                      <kpi.icon className={`w-3.5 h-3.5 ${kpi.color}`} />
                    </div>
                    <span className="text-2xl font-bold font-clash text-on-surface mt-1">{kpi.val}</span>
                  </div>
                ))}
              </div>

              {/* Score Trend Chart for single topic */}
              {trendChart && (
                <div className="bg-surface border border-outline rounded-[16px] p-4">
                  <span className="text-xs font-bold text-on-surface mb-3 block">Динамика результатов (прогресс)</span>
                  <div className="w-full overflow-x-auto">
                    <svg viewBox={`0 0 ${trendChart.width} ${trendChart.height}`} className="w-full min-w-[450px] overflow-visible">
                      <defs>
                        <linearGradient id="modalChartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Horizontal Guideline (Passing threshold 60%) */}
                      <line 
                        x1={trendChart.minX} 
                        y1={trendChart.thresholdY} 
                        x2={trendChart.maxX} 
                        y2={trendChart.thresholdY} 
                        stroke="rgba(255,69,58,0.3)" 
                        strokeDasharray="4 4" 
                        strokeWidth="1.2"
                      />
                      <text 
                        x={trendChart.minX + 5} 
                        y={trendChart.thresholdY - 4} 
                        fill="#FF453A" 
                        fontSize="9" 
                        fontWeight="bold"
                        className="font-mono"
                      >
                        60% Порог
                      </text>

                      {/* Area and Line Path */}
                      <path d={trendChart.areaD} fill="url(#modalChartGrad)" />
                      <path 
                        d={trendChart.pathD} 
                        fill="none" 
                        stroke="#FFFFFF" 
                        strokeWidth="2.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                      />

                      {/* Nodes */}
                      {trendChart.pts.map((p, idx) => (
                        <g key={idx}>
                          <circle cx={p.x} cy={p.y} r="6" fill="#1C1C1E" stroke="#FFFFFF" strokeWidth="2" />
                          <circle cx={p.x} cy={p.y} r="3" fill="#FFFFFF" />
                          
                          {/* Floating score label */}
                          <rect 
                            x={p.x - 16} 
                            y={p.y - 22} 
                            width="32" 
                            height="14" 
                            rx="3" 
                            fill="#2C2C2E" 
                            stroke="rgba(255,255,255,0.1)" 
                            strokeWidth="0.5" 
                          />
                          <text 
                            x={p.x} 
                            y={p.y - 12} 
                            fill="#FFFFFF" 
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
                            fill="#98989D" 
                            fontSize="8" 
                            textAnchor="middle" 
                            className="font-sans"
                          >
                            Попытка {p.attemptIndex}
                          </text>
                        </g>
                      ))}
                    </svg>
                  </div>
                </div>
              )}

              {/* Attempts Table */}
              <div className="bg-surface border border-outline rounded-[16px] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-outline bg-surface-container/25 text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
                        <th className="px-5 py-3 font-sans">Дата и время</th>
                        {filterNodeId === 'all' && <th className="px-5 py-3 font-sans">Тема урока</th>}
                        <th className="px-5 py-3 font-sans">Попытка</th>
                        <th className="px-5 py-3 font-sans">Оценка</th>
                        <th className="px-5 py-3 font-sans text-center">Результат</th>
                        <th className="px-5 py-3 font-sans text-right">Действие</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(255,255,255,0.04)] text-xs text-on-background">
                      {/* For table view, display attempts newest to oldest */}
                      {((filterNodeId !== 'all') ? [...filteredAttempts].reverse() : filteredAttempts).map((att, idx) => (
                        <tr 
                          key={idx} 
                          className="hover:bg-surface-container/10 transition-colors group"
                        >
                          <td className="px-5 py-3.5 font-mono text-on-surface-variant">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 opacity-60" />
                              <span>{formatDate(att.date)}</span>
                            </div>
                          </td>
                          {filterNodeId === 'all' && (
                            <td className="px-5 py-3.5 font-semibold text-on-surface max-w-[220px] truncate">
                              <button 
                                onClick={() => handleRowClick(att.nodeId)}
                                className="hover:underline text-left"
                              >
                                {att.nodeTitle}
                              </button>
                            </td>
                          )}
                          <td className="px-5 py-3.5 text-on-surface-variant font-medium font-mono">
                            #{att.attemptIndex}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <span className="font-bold font-mono text-on-surface min-w-[32px]">{att.score}%</span>
                              <div className="w-20 h-1.5 bg-surface-container border border-[rgba(255,255,255,0.02)] rounded-full overflow-hidden hidden sm:block">
                                <div 
                                  className={`h-full rounded-full ${att.passed ? 'bg-on-surface' : 'bg-[#FF453A]'}`}
                                  style={{ width: `${att.score}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border bg-surface-container/40 border-outline">
                              {att.passed ? (
                                <>
                                  <CheckCircle className="w-3 h-3 text-on-surface" />
                                  <span className="text-on-surface">Сдано</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3 h-3 text-[#FF453A]" />
                                  <span className="text-[#FF453A]">Не сдано</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              onClick={() => handleRowClick(att.nodeId)}
                              className="text-xs font-bold text-on-surface border border-outline bg-surface-container/50 hover:bg-on-surface hover:text-inverse-on-surface px-3 py-1.5 rounded-[8px] transition-all inline-flex items-center gap-1 opacity-80 group-hover:opacity-100"
                            >
                              Перейти
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
