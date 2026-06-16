import React from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Layout from './components/Layout.jsx';
import PageTransition from './components/PageTransition.jsx';

// Import fully rewritten React pages
import Landing from './pages/Landing.jsx';
import Auth from './pages/Auth.jsx';
import DashboardComponent from './pages/Dashboard.jsx';
import CoursesComponent from './pages/Courses.jsx';
import GraphComponent from './pages/Graph.jsx';
import ResourcesComponent from './pages/Resources.jsx';
import InsightsComponent from './pages/Insights.jsx';
import SettingsComponent from './pages/Settings.jsx';
import LessonsComponent from './pages/Lessons.jsx';

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
          <Route path="/lessons" element={<PageTransition><LessonsComponent /></PageTransition>} />
          <Route path="/resources" element={<PageTransition><ResourcesComponent /></PageTransition>} />
          <Route path="/insights" element={<PageTransition><InsightsComponent /></PageTransition>} />
          <Route path="/settings" element={<PageTransition><SettingsComponent /></PageTransition>} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AnimatedRoutes />
    </HashRouter>
  );
}
