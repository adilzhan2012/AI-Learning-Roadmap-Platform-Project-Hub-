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
        className="w-full max-w-4xl bg-[#1C1C1E] border border-[rgba(255,255,255,0.08)] rounded-[24px] shadow-[0_24px_80px_rgba(0,0,0,0.6)] relative z-10 flex flex-col max-h-[85vh] text-[#F5F5F7] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-[rgba(255,255,255,0.06)] flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0 bg-[#1C1C1E]">
          <div>
            <h2 className="text-xl font-bold font-clash text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#98989D]" />
              История прохождений тестов
            </h2>
            <p className="text-xs text-[#98989D] mt-1 font-mono">
              Курс: {t(selectedCourse.title)}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter Dropdown */}
            <div className="flex items-center gap-2 bg-[#2C2C2E]/40 border border-[rgba(255,255,255,0.06)] rounded-[12px] px-3 py-1.5">
              <Filter className="w-3.5 h-3.5 text-[#98989D]" />
              <select
                value={filterNodeId}
                onChange={(e) => setFilterNodeId(e.target.value)}
                className="bg-transparent text-xs text-white focus:outline-none pr-1 max-w-[200px] cursor-pointer"
              >
                <option value="all" className="bg-[#1C1C1E]">Все темы</option>
                {(selectedCourse.nodes || []).map(n => {
                  const nodeResults = quizResults[n.id];
                  if (!nodeResults || !nodeResults.attempts || nodeResults.attempts.length === 0) return null;
                  return (
                    <option key={n.id} value={n.id} className="bg-[#1C1C1E]">
                      {t(n.label || n.title)}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Close Button */}
            <button 
              onClick={onClose} 
              className="p-2 rounded-full hover:bg-[#2C2C2E]/60 border border-[rgba(255,255,255,0.04)] transition-colors"
            >
              <X className="w-4 h-4 text-[#98989D] hover:text-white" />
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar bg-[#111112]">
          
          {filteredAttempts.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-xl bg-[#2C2C2E]/40 border border-[rgba(255,255,255,0.04)] flex items-center justify-center mb-4">
                <BookOpen className="w-5 h-5 text-[#98989D]" />
              </div>
              <p className="text-sm font-semibold text-[#F5F5F7]">Тесты еще не пройдены</p>
              <p className="text-xs text-[#98989D] max-w-sm mt-1 leading-relaxed">
                Нажмите «Начать урок» на любой доступной теме графа, а затем завершите проверочный тест.
              </p>
            </div>
          ) : (
            <>
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Всего попыток', val: stats.total, icon: Clock, color: 'text-[#FFFFFF]' },
                  { label: 'Лучший балл', val: `${stats.best}%`, icon: Trophy, color: 'text-[#FFD700]' },
                  { label: 'Средний балл', val: `${stats.avg}%`, icon: BarChart3, color: 'text-[#98989D]' },
                  { label: 'Успешность', val: `${stats.passRate}%`, icon: CheckCircle, color: stats.passRate >= 60 ? 'text-[#FFFFFF]' : 'text-[#FF453A]' }
                ].map((kpi, idx) => (
                  <div key={idx} className="bg-[#1C1C1E] border border-[rgba(255,255,255,0.06)] rounded-[16px] p-4 flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[#98989D]">
                      <span className="text-[10px] font-semibold uppercase tracking-wider">{kpi.label}</span>
                      <kpi.icon className={`w-3.5 h-3.5 ${kpi.color}`} />
                    </div>
                    <span className="text-2xl font-bold font-clash text-white mt-1">{kpi.val}</span>
                  </div>
                ))}
              </div>

              {/* Score Trend Chart for single topic */}
              {trendChart && (
                <div className="bg-[#1C1C1E] border border-[rgba(255,255,255,0.06)] rounded-[16px] p-4">
                  <span className="text-xs font-bold text-white mb-3 block">Динамика результатов (прогресс)</span>
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
              <div className="bg-[#1C1C1E] border border-[rgba(255,255,255,0.06)] rounded-[16px] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[rgba(255,255,255,0.06)] bg-[#2C2C2E]/25 text-[10px] text-[#98989D] uppercase tracking-wider font-semibold">
                        <th className="px-5 py-3 font-sans">Дата и время</th>
                        {filterNodeId === 'all' && <th className="px-5 py-3 font-sans">Тема урока</th>}
                        <th className="px-5 py-3 font-sans">Попытка</th>
                        <th className="px-5 py-3 font-sans">Оценка</th>
                        <th className="px-5 py-3 font-sans text-center">Результат</th>
                        <th className="px-5 py-3 font-sans text-right">Действие</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(255,255,255,0.04)] text-xs text-[#F5F5F7]">
                      {/* For table view, display attempts newest to oldest */}
                      {((filterNodeId !== 'all') ? [...filteredAttempts].reverse() : filteredAttempts).map((att, idx) => (
                        <tr 
                          key={idx} 
                          className="hover:bg-[#2C2C2E]/10 transition-colors group"
                        >
                          <td className="px-5 py-3.5 font-mono text-[#98989D]">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 opacity-60" />
                              <span>{formatDate(att.date)}</span>
                            </div>
                          </td>
                          {filterNodeId === 'all' && (
                            <td className="px-5 py-3.5 font-semibold text-white max-w-[220px] truncate">
                              <button 
                                onClick={() => handleRowClick(att.nodeId)}
                                className="hover:underline text-left"
                              >
                                {att.nodeTitle}
                              </button>
                            </td>
                          )}
                          <td className="px-5 py-3.5 text-[#98989D] font-medium font-mono">
                            #{att.attemptIndex}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <span className="font-bold font-mono text-white min-w-[32px]">{att.score}%</span>
                              <div className="w-20 h-1.5 bg-[#2C2C2E] border border-[rgba(255,255,255,0.02)] rounded-full overflow-hidden hidden sm:block">
                                <div 
                                  className={`h-full rounded-full ${att.passed ? 'bg-white' : 'bg-[#FF453A]'}`}
                                  style={{ width: `${att.score}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border bg-[#2C2C2E]/40 border-[rgba(255,255,255,0.06)]">
                              {att.passed ? (
                                <>
                                  <CheckCircle className="w-3 h-3 text-white" />
                                  <span className="text-white">Сдано</span>
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
                              className="text-xs font-bold text-white border border-[rgba(255,255,255,0.08)] bg-[#2C2C2E]/50 hover:bg-[#FFFFFF] hover:text-[#000000] px-3 py-1.5 rounded-[8px] transition-all inline-flex items-center gap-1 opacity-80 group-hover:opacity-100"
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
