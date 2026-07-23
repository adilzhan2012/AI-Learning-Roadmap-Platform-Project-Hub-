import React, { useEffect, useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Topbar from './Topbar.jsx';
import { auth } from '../firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import CookieBanner from './shared/CookieBanner.jsx';
import MentorWidget from './MentorWidget.jsx';

export default function Layout() {
  const [user, setUser] = useState(auth.currentUser);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Reset scroll to top on page navigation
  useEffect(() => {
    window.scrollTo(0, 0);
    const pageEl = document.getElementById('page-content');
    if (pageEl) pageEl.scrollTop = 0;
  }, [location.pathname]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-background text-on-background">Loading...</div>;
  }

  // Route protection
  const isPublicRoute = ['/', '/login', '/register'].includes(location.pathname);
  if (!user && !isPublicRoute) {
    return <Navigate to="/login" replace />;
  }
  if (user && (location.pathname === '/login' || location.pathname === '/register')) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isPublicRoute && location.pathname !== '/dashboard') {
    return (
      <div className="w-full h-full overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12, ease: 'easeInOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
        <CookieBanner />
      </div>
    );
  }

  const isGraphPage = location.pathname === '/graph';

  return (
    <div className="flex flex-col min-h-screen w-full overflow-y-auto bg-background text-on-background font-sans transition-colors duration-200">
      <div id="topbar-container"><Topbar /></div>
      <main 
        id="page-content" 
        className={`flex-1 relative w-full max-w-[2000px] mx-auto ${
          isGraphPage 
            ? 'h-[calc(100vh-3.5rem)] pt-14 overflow-y-auto px-4 pb-4 flex flex-col' 
            : 'overflow-y-auto pt-20 md:pt-22 px-6 sm:px-12 md:px-16 pb-12'
        }`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12, ease: 'easeInOut' }}
            className="w-full flex flex-col flex-1"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <MentorWidget />
      <CookieBanner />
    </div>
  );
}
