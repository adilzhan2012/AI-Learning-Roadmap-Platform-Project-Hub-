import React, { useEffect, useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Topbar from './Topbar.jsx';
import { auth, db } from '../../firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import CookieBanner from '../shared/CookieBanner.jsx';
import MentorWidget from '../mentor/MentorWidget.jsx';
import MaintenancePage from '../shared/MaintenancePage.jsx';
import BannedModal from '../shared/BannedModal.jsx';
import Footer from '../shared/Footer.jsx';

const VersionBadge = () => (
  <div className="fixed bottom-2 left-2 z-[9999] pointer-events-none">
    <span className="text-[10px] font-mono font-bold text-on-surface-variant/50 select-none bg-surface-container/50 px-1.5 py-0.5 rounded backdrop-blur-md border border-outline/20">
      alpha/v1.1.0
    </span>
  </div>
);

export default function Layout() {
  const [user, setUser] = useState(auth.currentUser);
  const [loading, setLoading] = useState(true);
  const [maintenance, setMaintenance] = useState({ isActive: false, endTime: null });
  const [isBanned, setIsBanned] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Listen to maintenance mode
  useEffect(() => {
    const docRef = doc(db, 'settings', 'maintenance');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Only activate if endTime is in the future
        if (data.isActive && data.endTime) {
          const endTime = data.endTime.toDate ? data.endTime.toDate() : new Date(data.endTime);
          if (endTime.getTime() > Date.now()) {
            setMaintenance(data);
            return;
          }
        }
      }
      setMaintenance({ isActive: false, endTime: null });
    }, (err) => {
      // Catch transient permission errors
    });
    return () => unsubscribe();
  }, []);

  // Listen to user profile for ban status and profile completion
  useEffect(() => {
    if (!user) {
      setIsBanned(false);
      setHasProfile(false);
      setIsProfileLoaded(true);
      return;
    }
    setIsProfileLoaded(false);
    const docRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      setIsProfileLoaded(true);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setIsBanned(data.isBanned === true);
        // User profile is complete if it has username, firstName, or displayName
        setHasProfile(!!data.username || !!data.firstName || !!data.displayName || !!user.displayName);
      } else {
        setHasProfile(false);
      }
    }, (err) => {
      // Catch transient permission errors
      setIsProfileLoaded(true);
    });
    return () => unsubscribe();
  }, [user]);

  // Reset scroll to top on page navigation
  useEffect(() => {
    window.scrollTo(0, 0);
    const pageEl = document.getElementById('page-content');
    if (pageEl) pageEl.scrollTop = 0;
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-background text-on-background">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (maintenance.isActive) {
    return <MaintenancePage endTime={maintenance.endTime} />;
  }

  // Route protection
  const isPublicRoute = ['/', '/login', '/register'].includes(location.pathname);
  const currentUser = user || auth.currentUser;

  // Wait for profile data before deciding on protected routes
  if (currentUser && !isPublicRoute && !isProfileLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-full bg-background text-on-background gap-3">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-zinc-400">Загрузка профиля...</p>
      </div>
    );
  }

  if (!currentUser && !isPublicRoute) {
    return <Navigate to="/login" replace />;
  }

  // If user is authenticated on a protected route but has no complete profile, redirect to register wizard
  if (currentUser && !isPublicRoute && !hasProfile) {
    return <Navigate to="/register" replace />;
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
        <Footer />
        <CookieBanner />
        {isBanned && <BannedModal />}
        <VersionBadge />
      </div>
    );
  }

  const isGraphPage = location.pathname === '/graph';

  return (
    <div className="flex flex-col min-h-screen w-full overflow-x-hidden bg-background text-on-background font-sans transition-colors duration-200">
      <div id="topbar-container"><Topbar /></div>
      <main 
        id="page-content" 
        className={`flex-1 relative w-full max-w-[2000px] mx-auto ${
          isGraphPage 
            ? 'h-[calc(100vh-3.5rem)] pt-14 overflow-y-auto px-2 sm:px-3 md:px-4 pb-4 flex flex-col' 
            : 'overflow-y-auto pt-20 md:pt-22 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 pb-12'
        }`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12, ease: 'easeInOut' }}
            className="w-full flex flex-col flex-1 min-h-0"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
        {!isGraphPage && <Footer />}
      </main>
      <MentorWidget />
      <CookieBanner />
      {isBanned && <BannedModal />}
      <VersionBadge />
    </div>
  );
}
