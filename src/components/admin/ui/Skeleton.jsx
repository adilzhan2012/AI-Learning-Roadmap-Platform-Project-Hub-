import React from 'react';

export default function Skeleton({ className = "" }) {
  return (
    <div className={`bg-zinc-800/50 rounded-lg animate-pulse ${className}`}></div>
  );
}
