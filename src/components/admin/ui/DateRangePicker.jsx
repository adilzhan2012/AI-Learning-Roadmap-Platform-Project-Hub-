import React, { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

const RANGES = [
  { label: 'За 1 день', days: 1 },
  { label: 'За 3 дня', days: 3 },
  { label: 'За 7 дней', days: 7 },
  { label: 'За месяц', days: 30 },
  { label: 'За 3 месяца', days: 90 },
];

export default function DateRangePicker({ value = 7, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedRange = RANGES.find(r => r.days === value) || RANGES[2];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-[#09090B] border border-white/10 hover:border-white/20 text-zinc-300 px-3 py-2 rounded-lg text-sm transition-all shadow-sm"
      >
        <Calendar className="w-4 h-4 text-zinc-400" />
        <span className="hidden sm:inline">{selectedRange.label}</span>
        <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-[#09090B] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
          {RANGES.map((range) => (
            <button
              key={range.days}
              onClick={() => {
                onChange(range.days);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors ${
                value === range.days ? 'text-white bg-white/5 font-medium' : 'text-zinc-400'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
