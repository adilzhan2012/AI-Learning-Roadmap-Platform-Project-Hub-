import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import { initTheme } from '../../theme.js';

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Force dark mode for admin panel, since it's designed only for dark mode
  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove('light');
    html.classList.add('dark');
    
    return () => {
      // Restore user's preferred theme on unmount
      initTheme();
    };
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex w-full min-h-screen bg-[#0A0A0B] text-zinc-100 font-sans selection:bg-indigo-500/30 overflow-hidden">
      {/* Sidebar with transition */}
      <div 
        className={`transition-all duration-300 ease-in-out flex-shrink-0 ${
          isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full overflow-hidden'
        }`}
      >
        <Sidebar onLogoClick={toggleSidebar} />
      </div>

      <main className="flex-1 overflow-y-auto relative h-screen w-full">
        <div className="w-full mx-auto p-6 lg:p-8">
          <Outlet context={{ isSidebarOpen, toggleSidebar }} />
        </div>
      </main>
    </div>
  );
}
