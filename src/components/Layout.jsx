import React, { useEffect, useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Topbar from './Topbar.jsx';
import { auth } from '../firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import CookieBanner from './shared/CookieBanner.jsx';

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

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-[#000000] text-[#F5F5F7]">Loading...</div>;
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
      <div className="w-full h-screen overflow-y-auto">
        <Outlet />
        <CookieBanner />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#000000] text-[#F5F5F7] font-sans">
      <div id="topbar-container"><Topbar /></div>
      <main id="page-content" className="flex-1 pt-14 overflow-y-auto bg-[#000000] transition-all duration-150 relative w-full max-w-[2000px] mx-auto px-12 md:px-16 pb-12">
        <Outlet />
      </main>
      <CookieBanner />
    </div>
  );
}
