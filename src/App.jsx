import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Layout from './components/layout/Layout.jsx';
import PageTransition from './components/shared/PageTransition.jsx';
import { GamificationProvider } from './context/GamificationContext.jsx';

// Lazy load public and dashboard pages
const Landing = lazy(() => import('./pages/Landing.jsx'));
const Auth = lazy(() => import('./pages/Auth.jsx'));
const AuthAction = lazy(() => import('./pages/AuthAction.jsx'));
const DashboardComponent = lazy(() => import('./pages/Dashboard.jsx'));
const CoursesComponent = lazy(() => import('./pages/Courses.jsx'));
const GraphComponent = lazy(() => import('./pages/Graph.jsx'));
const ResourcesComponent = lazy(() => import('./pages/Resources.jsx'));
const InsightsComponent = lazy(() => import('./pages/Insights.jsx'));
const SettingsComponent = lazy(() => import('./pages/Settings.jsx'));
const SupportComponent = lazy(() => import('./pages/Support.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));
const AchievementsPage = lazy(() => import('./components/gamification/AchievementsPage.jsx'));
const MentorComponent = lazy(() => import('./pages/Mentor.jsx'));
const PricingComponent = lazy(() => import('./pages/Pricing.jsx'));
const LeaguesComponent = lazy(() => import('./pages/Leagues.jsx'));
const VerifyCertificate = lazy(() => import('./pages/VerifyCertificate.jsx'));
const AboutComponent = lazy(() => import('./pages/About.jsx'));

// Admin Pages
import AdminRoute from './components/admin/AdminRoute.jsx';
import AdminLayout from './components/admin/AdminLayout.jsx';
const DashboardAdmin = lazy(() => import('./pages/admin/Dashboard.jsx'));
const UsersAdmin = lazy(() => import('./pages/admin/UsersAdmin.jsx'));
const AnalyticsAdmin = lazy(() => import('./pages/admin/AnalyticsAdmin.jsx'));
const PaymentsAdmin = lazy(() => import('./pages/admin/PaymentsAdmin.jsx'));
const PromocodesAdmin = lazy(() => import('./pages/admin/PromocodesAdmin.jsx'));
const QuestionsAdmin = lazy(() => import('./pages/admin/QuestionsAdmin.jsx'));
const ReviewsAdmin = lazy(() => import('./pages/admin/ReviewsAdmin.jsx'));
const ErrorsAdmin = lazy(() => import('./pages/admin/ErrorsAdmin.jsx'));
const LogsAdmin = lazy(() => import('./pages/admin/LogsAdmin.jsx'));
const PoliciesAdmin = lazy(() => import('./pages/admin/PoliciesAdmin.jsx'));
const NewslettersAdmin = lazy(() => import('./pages/admin/NewslettersAdmin.jsx'));

import { auth } from './firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { logPageView } from './lib/analytics.js';

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh] w-full bg-transparent">
    <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
  </div>
);

function AppRoutes() {
  const location = useLocation();

  React.useEffect(() => {
    logPageView(location.pathname + location.search);
  }, [location]);

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/verify/:certId" element={<VerifyCertificate />} />
        <Route element={<Layout />}>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/about" element={<AboutComponent />} />
          <Route path="/login" element={<Auth type="login" />} />
          <Route path="/register" element={<Auth type="register" />} />
          <Route path="/auth/action" element={<AuthAction />} />
          
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
            <Route path="reviews" element={<ReviewsAdmin />} />
            <Route path="newsletters" element={<NewslettersAdmin />} />
            <Route path="errors" element={<ErrorsAdmin />} />
            <Route path="logs" element={<LogsAdmin />} />
            <Route path="policies" element={<PoliciesAdmin />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
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
      <div className="flex items-center justify-center min-h-screen bg-background w-full">
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
