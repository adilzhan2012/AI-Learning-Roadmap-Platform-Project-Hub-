import React from 'react';
import { useLocation } from 'react-router-dom';

const titles = {
  '/dashboard': 'Dashboard',
  '/courses': 'Courses',
  '/graph': 'Knowledge Graph',
  '/resources': 'Resources',
  '/insights': 'Insights',
  '/settings': 'Settings'
};

export default function Topbar() {
  const location = useLocation();
  const title = titles[location.pathname] || 'Dashboard';

  return (
    <header className="h-16 border-b border-outline-variant bg-surface/80 backdrop-blur flex items-center justify-between px-4 sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <button className="md:hidden p-2 -ml-2 text-on-surface hover:bg-surface-container rounded-full transition-colors">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <h1 className="text-title-lg font-semibold text-on-surface">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-[20px]">search</span>
          <input type="text" placeholder="Search..." className="w-64 h-10 pl-10 pr-4 bg-surface-container-high border-none rounded-full text-body-md focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-on-surface-variant/70 text-on-surface" />
        </div>
        <button className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors relative">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full"></span>
        </button>
      </div>
    </header>
  );
}
