import React from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Layout from './components/Layout.jsx';
import PageTransition from './components/PageTransition.jsx';
import { GamificationProvider } from './context/GamificationContext.jsx';

// Import fully rewritten React pages
import Landing from './pages/Landing.jsx';
import Auth from './pages/Auth.jsx';
import DashboardComponent from './pages/Dashboard.jsx';
import CoursesComponent from './pages/Courses.jsx';
import GraphComponent from './pages/Graph.jsx';
import ResourcesComponent from './pages/Resources.jsx';
import InsightsComponent from './pages/Insights.jsx';
import SettingsComponent from './pages/Settings.jsx';
import NotFound from './pages/NotFound.jsx';
import AchievementsPage from './components/gamification/AchievementsPage.jsx';

import { auth } from './firebase.js';
import { onAuthStateChanged } from 'firebase/auth';

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route element={<Layout />}>
          {/* Public Routes */}
          <Route path="/" element={<PageTransition><Landing /></PageTransition>} />
          <Route path="/login" element={<PageTransition><Auth type="login" /></PageTransition>} />
          <Route path="/register" element={<PageTransition><Auth type="register" /></PageTransition>} />
          
          {/* Protected Dashboard Routes */}
          <Route path="/dashboard" element={<PageTransition><DashboardComponent /></PageTransition>} />
          <Route path="/courses" element={<PageTransition><CoursesComponent /></PageTransition>} />
          <Route path="/graph" element={<PageTransition><GraphComponent /></PageTransition>} />
          <Route path="/resources" element={<PageTransition><ResourcesComponent /></PageTransition>} />
          <Route path="/insights" element={<PageTransition><InsightsComponent /></PageTransition>} />
          <Route path="/settings" element={<PageTransition><SettingsComponent /></PageTransition>} />
          <Route path="/achievements" element={<PageTransition><AchievementsPage /></PageTransition>} />
          
          {/* Catch-all 404 */}
          <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  const [isAuthLoading, setIsAuthLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, () => {
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <GamificationProvider>
      <HashRouter>
        <AnimatedRoutes />
      </HashRouter>
    </GamificationProvider>
  );
}
