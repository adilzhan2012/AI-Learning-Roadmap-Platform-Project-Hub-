import React, { useState } from 'react';
import { AreaChart, List, Calendar, ChevronRight, AlertCircle, CheckCircle } from 'lucide-react';

const MasteryBlock = ({ masteryScore, attempts = [], onViewHistory }) => {
  const [activeTab, setActiveTab] = useState('chart'); // 'chart' | 'list'

  if (masteryScore === null || masteryScore === undefined) return null;

  const getColor = (score) => {
    if (score >= 80) return { bar: 'bg-[#FFFFFF]', text: 'text-[#FFFFFF]', label: 'Отлично' };
    if (score >= 50) return { bar: 'bg-[#98989D]', text: 'text-[#98989D]', label: 'Повторить скоро' };
    return { bar: 'bg-[#FF453A]', text: 'text-[#FF453A]', label: 'Нужно повторение' };
  };

  const colors = getColor(masteryScore);

  // SVG Chart Setup
  const width = 300;
  const height = 120;
  const minX = 30;
  const maxX = 270;
  const minY = 25;
  const maxY = 95;

  const points = (attempts || []).map((a, i) => {
    const x = attempts.length === 1 
      ? 150 
      : minX + (i * (maxX - minX)) / (attempts.length - 1);
    const y = maxY - (a.score * (maxY - minY)) / 100;
    return { x, y, score: a.score, date: a.date };
  });

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${maxY} L ${points[0].x} ${maxY} Z`
    : '';

  const passingY = maxY - (60 * (maxY - minY)) / 100;

  const formatDate = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="bg-[#1C1C1E] border border-[rgba(255,255,255,0.08)] rounded-[16px] p-4 flex flex-col gap-4 font-sans text-[#F5F5F7]">
      {/* Current Mastery Score */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <p className="text-xs font-semibold text-[#98989D]">Прогресс усвоения</p>
          <span className="text-sm font-bold text-[#F5F5F7] font-mono">{masteryScore}%</span>
        </div>
        <div className="h-[3px] bg-[#2C2C2E] border border-[rgba(255,255,255,0.04)] rounded-sm overflow-hidden mb-1">
          <div
            className={`h-full rounded-sm transition-all duration-500 ${colors.bar}`}
            style={{ width: `${masteryScore}%` }}
          />
        </div>
        <span className={`text-xs font-bold ${colors.text}`}>{colors.label}</span>
      </div>

      {/* Attempts Dynamics Section */}
      {attempts && attempts.length > 0 && (
        <div className="border-t border-[rgba(255,255,255,0.08)] pt-3.5">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#F5F5F7]">Динамика тестов</span>
              {onViewHistory && (
                <button
                  onClick={onViewHistory}
                  className="text-[9px] font-bold text-[#FFFFFF] bg-[#2C2C2E]/60 hover:bg-[#FFFFFF]/10 border border-[rgba(255,255,255,0.08)] px-2 py-0.5 rounded-[5px] transition-all flex items-center gap-1"
                  title="Подробная история прохождений"
                >
                  <Calendar className="w-2.5 h-2.5" />
                  История
                </button>
              )}
            </div>
            
            {/* Tabs Toggle if > 1 attempt */}
            {attempts.length > 1 && (
              <div className="flex bg-[#2C2C2E] rounded-[8px] p-0.5 border border-[rgba(255,255,255,0.04)]">
                <button
                  onClick={() => setActiveTab('chart')}
                  className={`p-1.5 rounded-[6px] transition-all ${activeTab === 'chart' ? 'bg-[#FFFFFF] text-[#000000]' : 'text-[#98989D] hover:text-[#F5F5F7]'}`}
                  title="График"
                >
                  <AreaChart className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => setActiveTab('list')}
                  className={`p-1.5 rounded-[6px] transition-all ${activeTab === 'list' ? 'bg-[#FFFFFF] text-[#000000]' : 'text-[#98989D] hover:text-[#F5F5F7]'}`}
                  title="Список попыток"
                >
                  <List className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
              </div>
            )}
          </div>

          {/* Tab 1: Chart */}
          {activeTab === 'chart' || attempts.length === 1 ? (
            <div className="relative bg-[#2C2C2E]/40 rounded-[8px] p-2 border border-[rgba(255,255,255,0.04)] flex flex-col items-center">
              {attempts.length === 1 ? (
                // Single attempt layout
                <div className="py-4 text-center">
                  <CheckCircle className="w-8 h-8 text-[#FFFFFF] mx-auto mb-2" strokeWidth={1.5} />
                  <p className="text-xs font-bold text-[#F5F5F7]">Пройдена 1 попытка</p>
                  <p className="text-[11px] text-[#98989D] mt-0.5">Результат: <strong className="text-[#FFFFFF] font-mono">{attempts[0].score}%</strong></p>
                  <p className="text-[10px] text-[#98989D]/70 mt-1 font-mono">{formatDate(attempts[0].date)}</p>
                </div>
              ) : (
                // SVG Graph
                <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Guideline (Passing threshold 60%) */}
                  <line 
                    x1={minX - 10} 
                    y1={passingY} 
                    x2={maxX + 10} 
                    y2={passingY} 
                    stroke="rgba(255,255,255,0.08)" 
                    strokeDasharray="3 3" 
                    strokeWidth="1"
                  />
                  <text 
                    x={minX - 8} 
                    y={passingY - 3} 
                    fill="#98989D" 
                    fontSize="8" 
                    fontWeight="bold"
                    className="font-mono"
                  >
                    60% (Порог)
                  </text>

                  {/* Chart Line & Fill */}
                  {areaD && <path d={areaD} fill="url(#chartGrad)" />}
                  {pathD && (
                    <path 
                      d={pathD} 
                      fill="none" 
                      stroke="#FFFFFF" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                    />
                  )}

                  {/* Dots and Labels */}
                  {points.map((p, i) => (
                    <g key={i}>
                      {/* Outer Ring */}
                      <circle 
                        cx={p.x} 
                        cy={p.y} 
                        r="5" 
                        fill="#1C1C1E" 
                        stroke="#FFFFFF" 
                        strokeWidth="1.5" 
                      />
                      {/* Inner Dot */}
                      <circle 
                        cx={p.x} 
                        cy={p.y} 
                        r="2.5" 
                        fill="#FFFFFF" 
                      />
                      {/* Score Label above point */}
                      <rect
                        x={p.x - 11}
                        y={p.y - 17}
                        width="22"
                        height="11"
                        rx="2"
                        fill="#2C2C2E"
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth="0.5"
                      />
                      <text 
                        x={p.x} 
                        y={p.y - 9} 
                        fill="#F5F5F7" 
                        fontSize="7" 
                        fontWeight="black" 
                        textAnchor="middle"
                        className="font-mono"
                      >
                        {p.score}%
                      </text>
                    </g>
                  ))}
                </svg>
              )}
            </div>
          ) : (
            // Tab 2: Attempts List
            <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
              {[...attempts].reverse().map((attempt, index) => {
                const attemptNum = attempts.length - index;
                const isPassed = attempt.score >= 60;
                return (
                  <div 
                    key={index} 
                    className="flex justify-between items-center p-2 rounded-[8px] bg-[#2C2C2E]/40 border border-[rgba(255,255,255,0.04)] text-xs font-sans"
                  >
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${isPassed ? 'bg-[#FFFFFF]' : 'bg-[#FF453A]'}`} />
                      <span className="font-semibold text-[#F5F5F7]">Попытка #{attemptNum}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold font-mono ${isPassed ? 'text-[#FFFFFF]' : 'text-[#FF453A]'}`}>
                        {attempt.score}%
                      </span>
                      <span className="text-[10px] text-[#98989D]/60 font-mono">
                        {formatDate(attempt.date)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MasteryBlock;
