import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import { initTheme } from '../../theme.js';

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Force dark mode for admin panel, since it's designed only for dark mode
  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove('light');
    html.classList.add('dark');
    
    // Auto-open sidebar on larger screens
    if (window.innerWidth >= 1024) {
      setIsSidebarOpen(true);
    }

    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      // Restore user's preferred theme on unmount
      initTheme();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="flex w-full min-h-screen bg-[#0A0A0B] text-zinc-100 font-sans selection:bg-indigo-500/30 overflow-x-hidden relative">
      {/* Mobile backdrop */}
      {isSidebarOpen && (
        <div 
          onClick={closeSidebar}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar with responsive positioning */}
      <div 
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 transition-transform duration-300 ease-in-out flex-shrink-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:-translate-x-full lg:w-0'
        } ${isSidebarOpen ? 'w-64' : 'w-64 lg:w-0'}`}
      >
        <Sidebar onLogoClick={toggleSidebar} onNavigate={closeSidebar} />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative h-screen w-full min-w-0">
        <div className="w-full mx-auto p-4 sm:p-6 lg:p-8 max-w-7xl">
          <Outlet context={{ isSidebarOpen, toggleSidebar, closeSidebar }} />
        </div>
      </main>
    </div>
  );
}
