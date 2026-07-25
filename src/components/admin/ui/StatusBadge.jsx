import React from 'react';

export default function StatusBadge({ status, text }) {
  const getStyles = () => {
    switch (status) {
      case 'success':
      case 'active':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]';
      case 'error':
      case 'critical':
      case 'failed':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.15)]';
      case 'warning':
      case 'pending':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.15)]';
      default:
        return 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 shadow-[0_0_15px_rgba(113,113,122,0.15)]';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium tracking-wide ${getStyles()}`}>
      {text || status}
    </span>
  );
}
