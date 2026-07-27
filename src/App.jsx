import React from 'react';
import { HashRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
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
import SupportComponent from './pages/Support.jsx';
import NotFound from './pages/NotFound.jsx';
import AchievementsPage from './components/gamification/AchievementsPage.jsx';
import MentorComponent from './pages/Mentor.jsx';
import PricingComponent from './pages/Pricing.jsx';
import LeaguesComponent from './pages/Leagues.jsx';

// Admin Pages
import AdminRoute from './components/admin/AdminRoute.jsx';
import AdminLayout from './components/admin/AdminLayout.jsx';
import DashboardAdmin from './pages/admin/Dashboard.jsx';
import UsersAdmin from './pages/admin/UsersAdmin.jsx';
import AnalyticsAdmin from './pages/admin/AnalyticsAdmin.jsx';
import PaymentsAdmin from './pages/admin/PaymentsAdmin.jsx';
import PromocodesAdmin from './pages/admin/PromocodesAdmin.jsx';
import QuestionsAdmin from './pages/admin/QuestionsAdmin.jsx';
import ErrorsAdmin from './pages/admin/ErrorsAdmin.jsx';
import LogsAdmin from './pages/admin/LogsAdmin.jsx';
import PoliciesAdmin from './pages/admin/PoliciesAdmin.jsx';
import NewslettersAdmin from './pages/admin/NewslettersAdmin.jsx';

import { auth } from './firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { logPageView } from './lib/analytics.js';

function AppRoutes() {
  const location = useLocation();

  React.useEffect(() => {
    logPageView(location.pathname + location.search);
  }, [location]);

  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Auth type="login" />} />
        <Route path="/register" element={<Auth type="register" />} />
        
        {/* Protected Dashboard Routes */}
        <Route path="/dashboard" element={<DashboardComponent />} />
        <Route path="/courses" element={<CoursesComponent />} />
        <Route path="/graph" element={<GraphComponent />} />
        <Route path="/resources" element={<ResourcesComponent />} />
        <Route path="/insights" element={<InsightsComponent />} />
        <Route path="/settings" element={<SettingsComponent />} />
        <Route path="/support" element={<SupportComponent />} />
        <Route path="/achievements" element={<AchievementsPage />} />
        <Route path="/mentor" element={<MentorComponent />} />
        <Route path="/pricing" element={<PricingComponent />} />
        <Route path="/leagues" element={<LeaguesComponent />} />
        
        {/* Catch-all 404 */}
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardAdmin />} />
          <Route path="users" element={<UsersAdmin />} />
          <Route path="analytics" element={<AnalyticsAdmin />} />
          <Route path="payments" element={<PaymentsAdmin />} />
          <Route path="promocodes" element={<PromocodesAdmin />} />
          <Route path="questions" element={<QuestionsAdmin />} />
          <Route path="newsletters" element={<NewslettersAdmin />} />
          <Route path="errors" element={<ErrorsAdmin />} />
          <Route path="logs" element={<LogsAdmin />} />
          <Route path="policies" element={<PoliciesAdmin />} />
        </Route>
      </Route>
    </Routes>
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
        <AppRoutes />
      </HashRouter>
    </GamificationProvider>
  );
}
