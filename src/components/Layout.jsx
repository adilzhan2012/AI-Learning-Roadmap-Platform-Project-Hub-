import React, { useEffect, useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import { auth } from '../firebase.js';
import { onAuthStateChanged } from 'firebase/auth';

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
    return <Outlet />;
  }

  return (
    <div className="flex w-full h-full">
      <div id="sidebar-container"><Sidebar /></div>
      <div className="flex-1 flex flex-col ml-0 md:ml-64 w-full h-screen overflow-hidden">
        <div id="topbar-container"><Topbar /></div>
        <main id="page-content" className="flex-1 overflow-y-auto bg-background transition-all duration-150 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
