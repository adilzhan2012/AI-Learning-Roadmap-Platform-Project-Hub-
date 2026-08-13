import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Clock, 
  Award, 
  Flame, 
  ArrowRight, 
  PlayCircle, 
  CheckCircle, 
  Trophy, 
  Users, 
  HelpCircle, 
  Activity, 
  Brain, 
  Sparkles, 
  Loader2,
  Lock,
  FileBadge,
  Crown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  getUserStats, 
  getUserCourses, 
  getRecentActivities,
  getUserAllCertificates
} from '../services/courseService.js';
import { usePlanLimits } from '../hooks/usePlanLimits.js';
import CourseGeneratorModal from '../components/CourseGeneratorModal.jsx';
import CertificatesModal from '../components/shared/CertificatesModal.jsx';
import RepeatReminder from '../components/shared/RepeatReminder.jsx';
import { t, useLocale } from '../i18n.js';
import { LeagueIcon } from './Leagues.jsx';
import MotivationalWidget from '../components/shared/MotivationalWidget.jsx';
import HeroBackground from '../components/shared/HeroBackground.jsx';
import { getSubjectTheme } from '../utils/courseSubjectClassifier.js';

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 250, damping: 22 } }
};

const iconMap = {
  school: BookOpen,
  check_circle: CheckCircle,
  emoji_events: Trophy,
  manage_accounts: Users,
  quiz: HelpCircle,
  trophy: Trophy,
  play: PlayCircle,
  activity: Activity
};

function getActivityBadgeStyle(iconType) {
  switch (iconType) {
    case 'check_circle':
    case 'school':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    case 'emoji_events':
    case 'trophy':
      return 'bg-reward-subtle text-reward-text border-reward-border';
    case 'quiz':
    case 'help':
      return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
    default:
      return 'bg-accent-subtle text-accent-text border-accent-border';
  }
}

function AnimatedNumber({ value }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = Math.round(parseFloat(value) || 0);
    if (end <= 0) {
      setCount(0);
      return;
    }
    if (start === end) return;

    const totalDuration = 800;
    let incrementTime = (totalDuration / end) * 2;
    if (incrementTime < 10) incrementTime = 10;

    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value]);

  return <span className="font-mono">{count}</span>;
}

const getGreetingKey = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'dashboard.welcome.morning';
  if (hour >= 12 && hour < 18) return 'dashboard.welcome.afternoon';
  if (hour >= 18 && hour < 23) return 'dashboard.welcome.evening';
  return 'dashboard.welcome.night';
};

export default function Dashboard() {
  const navigate = useNavigate();
  const locale = useLocale();
  const { plan, loading: planLoading } = usePlanLimits();
  const [user, setUser] = useState(auth.currentUser);
  const getCachedStats = () => {
    try {
      const cached = localStorage.getItem('cached_stats');
      if (cached && cached !== 'null' && cached !== 'undefined') {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (e) {}
    return {
      activeCoursesCount: 0,
      hoursLearned: 0,
      certificatesCount: 0,
      streakDays: 1,
      firstName: '',
      lastName: '',
      currentLeague: 'quartz',
      weeklyXP: 0
    };
  };

  const [stats, setStats] = useState(getCachedStats);
  const [timeLeft, setTimeLeft] = useState('');
  const [courses, setCourses] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // AI Generator modal state
  const [showGenModal, setShowGenModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const fetchedStats = await getUserStats(currentUser.uid);
          const fetchedCourses = await getUserCourses(currentUser.uid) || [];
          const fetchedCerts = await getUserAllCertificates(currentUser.uid) || [];
          
          if (fetchedStats) {
            fetchedStats.activeCoursesCount = fetchedCourses.length;
            fetchedStats.certificatesCount = fetchedCerts.length;
            
            setStats(fetchedStats);
            localStorage.setItem('cached_stats', JSON.stringify(fetchedStats));
            localStorage.setItem('cached_profile', JSON.stringify(fetchedStats));
          } else {
            setStats(getCachedStats());
          }

          setCourses(fetchedCourses);

          const fetchedActivities = await getRecentActivities(currentUser.uid);
          setActivities(fetchedActivities);
        } catch (e) {
          console.error("Error loading dashboard data:", e);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const endOfWeek = new Date();
      endOfWeek.setDate(now.getDate() + (7 - now.getDay() || 7) % 7);
      endOfWeek.setHours(23, 59, 59, 999);
      
      const diff = endOfWeek - now;
      if (diff <= 0) {
        setTimeLeft('Лига завершена');
        return;
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft(`${days}д ${hours}ч ${mins}м ${secs}с`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-on-background gap-4 font-sans w-full">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <p className="text-sm font-medium">{t('insights.loading')}</p>
      </div>
    );
  }

  const leagueNameMap = {
    silicon: 'Кремний',
    graphite: 'Графит',
    quartz: 'Кварц',
    obsidian: 'Обсидиан',
    platinum: 'Платина',
    titan: 'Титан'
  };

  const currentLeagueId = stats?.currentLeague || (plan === 'FREE' ? 'graphite' : 'quartz');
  const leagueName = leagueNameMap[currentLeagueId] || 'Кварц';

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={staggerContainer}
      className="w-full min-w-0 max-w-[2000px] mx-auto space-y-8 text-on-background font-sans"
    >
      <RepeatReminder />

      {/* Hero Banner with large abstract Apple Visual */}
      <motion.div 
        variants={itemVariants}
        className="relative overflow-hidden rounded-[18px] bg-white dark:bg-[#1A1A1C] border border-zinc-200 dark:border-white/10 p-6 md:p-12 shadow-sm"
      >
        <HeroBackground />
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 md:gap-8 relative z-10">
          <div className="flex-1 w-full max-w-2xl text-center md:text-left">
            <motion.h1 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-[52px] font-bold text-zinc-900 dark:text-white mb-4 tracking-tight leading-none font-clash"
            >
              {t(getGreetingKey(), { name: stats?.firstName || 'Learner', defaultValue: t('dashboard.welcome', { name: stats?.firstName || 'Learner' }) })}
            </motion.h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 md:mb-8 leading-relaxed mx-auto md:mx-0 max-w-lg">
              {t('dashboard.streakDesc', { streak: stats?.streakDays || 1 })}
            </p>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowGenModal(true)}
              className="bg-accent hover:bg-accent-hover text-white px-6 py-3 rounded-[12px] font-bold text-xs transition-colors mx-auto md:mx-0 flex items-center gap-2 shadow-md justify-center"
            >
              <Sparkles className="w-4 h-4 fill-current shrink-0" />
              <span>{t('dashboard.generateCourse')}</span>
            </motion.button>
          </div>

          <div className="w-[35%] max-w-[280px] aspect-square flex-shrink-0 hidden md:block select-none">
            <svg viewBox="0 0 200 200" className="w-full h-full text-zinc-900 dark:text-white opacity-25 stroke-current stroke-[0.5] fill-none overflow-visible">
              <defs>
                <linearGradient id="appleHeroGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.6" />
                  <stop offset="50%" stopColor="#8E8E93" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#1C1C1E" stopOpacity="0" />
                </linearGradient>
              </defs>
              <circle cx="100" cy="100" r="90" stroke="url(#appleHeroGrad)" />
              <circle cx="100" cy="100" r="70" stroke="url(#appleHeroGrad)" />
              <circle cx="100" cy="100" r="50" stroke="url(#appleHeroGrad)" />
              <circle cx="100" cy="100" r="30" stroke="url(#appleHeroGrad)" />
              <circle cx="100" cy="100" r="10" stroke="url(#appleHeroGrad)" />
              
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i * 30 * Math.PI) / 180;
                const x2 = 100 + 90 * Math.cos(angle);
                const y2 = 100 + 90 * Math.sin(angle);
                return (
                  <line key={i} x1="100" y1="100" x2={x2} y2={y2} stroke="url(#appleHeroGrad)" />
                );
              })}
            </svg>
          </div>
        </div>
      </motion.div>

      {/* Free tier upsell banner */}
      {plan === 'FREE' && (
        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-[#1A1A1C] border border-zinc-200 dark:border-white/10 border-l-[4px] border-l-accent rounded-[16px] p-6 flex flex-col md:flex-row gap-6 items-center justify-between shadow-sm"
        >
          <div className="flex-1 text-left">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-1.5 font-clash">
              {locale === 'en' ? 'Unlock Full Learning Potential with PRO' : 'Разблокируйте полную силу обучения с PRO подпиской'}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed max-w-xl">
              {locale === 'en' 
                ? 'Get unlimited course generation, AI mentor with session memory, comprehensive analytics, and access to top leagues.'
                : 'Получите безлимитную генерацию курсов, AI-ментора с памятью о сессиях, полную аналитику прогресса и доступ к высшим лигам.'}
            </p>
          </div>
          <button
            onClick={() => navigate('/pricing')}
            className="w-full md:w-auto bg-accent hover:bg-accent-hover text-white rounded-[12px] px-5 py-2.5 text-xs font-bold transition-all font-sans whitespace-nowrap self-start md:self-auto text-center shadow-sm"
          >
            {locale === 'en' ? 'Learn More' : 'Узнать больше'}
          </button>
        </motion.div>
      )}

      {/* Motivational Widget */}
      <motion.div variants={itemVariants}>
        <MotivationalWidget variant="dashboard" />
      </motion.div>

      {/* Asymmetric Metrics Grid */}
      <motion.div variants={staggerContainer} className="grid grid-cols-12 gap-6">
        {/* Large Active Courses Card */}
        <div className="col-span-12 lg:col-span-6 bg-white dark:bg-[#1A1A1C] border border-zinc-200 dark:border-white/10 rounded-[18px] p-6 flex flex-col justify-between h-44 relative overflow-hidden group shadow-sm">
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2 font-sans font-medium">
              {t('dashboard.stats.courses') || (locale === 'en' ? 'Active Courses' : 'Активные курсы')}
            </p>
            <h3 className="text-4xl font-bold text-accent font-mono">
              <AnimatedNumber value={stats?.activeCoursesCount || 0} />
            </h3>
          </div>
          
          <div className="h-8 w-full mt-4 opacity-40 group-hover:opacity-75 transition-opacity duration-300">
            <svg className="w-full h-full stroke-accent stroke-[1.5] fill-none overflow-visible" viewBox="0 0 100 20" preserveAspectRatio="none">
              <path d="M0,15 L15,10 L30,17 L45,5 L60,12 L75,3 L90,15 L100,8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Hours Learned */}
        <div className="col-span-12 sm:col-span-4 lg:col-span-2 bg-white dark:bg-[#1A1A1C] border border-zinc-200 dark:border-white/10 rounded-[18px] p-6 flex flex-col justify-between h-44 shadow-sm">
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2 font-sans font-medium">{t('dashboard.stats.hours') || (locale === 'en' ? 'Hours Learned' : 'Часы обучения')}</p>
            <h3 className="text-4xl font-bold text-zinc-900 dark:text-white font-mono">
              <AnimatedNumber value={stats?.hoursLearned || 0} />
            </h3>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-sans">{locale === 'en' ? 'Hours learned' : 'Часы обучения'}</p>
        </div>

        {/* Certificates */}
        <div className="col-span-12 sm:col-span-4 lg:col-span-2 bg-white dark:bg-[#1A1A1C] border border-zinc-200 dark:border-white/10 rounded-[18px] p-6 flex flex-col justify-between h-44 shadow-sm">
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2 font-sans font-medium">{t('dashboard.stats.certs') || (locale === 'en' ? 'Certificates' : 'Сертификаты')}</p>
            <h3 className="text-4xl font-bold text-zinc-900 dark:text-white font-mono">
              <AnimatedNumber value={stats?.certificatesCount || 0} />
            </h3>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-sans">{locale === 'en' ? 'Certificates' : 'Сертификаты'}</p>
        </div>

        {/* Streaks (Reward Amber Token) */}
        <div className="col-span-12 sm:col-span-4 lg:col-span-2 bg-white dark:bg-[#1A1A1C] border border-zinc-200 dark:border-white/10 rounded-[18px] p-6 flex flex-col justify-between h-44 shadow-sm">
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2 font-sans font-medium">{t('dashboard.stats.streak') || (locale === 'en' ? 'Day Streak' : 'Ударный режим')}</p>
            <h3 className="text-4xl font-bold text-reward-text font-mono flex items-center gap-1.5">
              <span>{stats?.streakDays || 1}</span>
              <Flame className="w-6 h-6 text-reward-text fill-reward-text" />
            </h3>
          </div>
          
          <div className="flex gap-1.5 mt-2">
            {Array.from({ length: 7 }).map((_, i) => {
              const isActive = i < (stats?.streakDays || 1);
              return (
                <div 
                  key={i} 
                  className={`w-2 h-2 rounded-full transition-all ${isActive ? 'bg-reward-text shadow-xs' : 'bg-zinc-200 dark:bg-white/10'}`}
                  title={`${locale === 'en' ? 'Day' : 'День'} ${i + 1}`}
                />
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Horizontal Custom Course CTA Card */}
      <motion.div 
        variants={itemVariants} 
        className="bg-white dark:bg-[#1A1A1C] border border-zinc-200 dark:border-white/10 rounded-[18px] p-6 flex flex-col md:flex-row gap-6 items-center justify-between shadow-sm"
      >
        <div className="flex-1">
          <h2 className="text-base font-bold text-zinc-900 dark:text-white font-clash">{t('dashboard.generateCustom')}</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{t('dashboard.generateCustomDesc')}</p>
        </div>
        <button 
          onClick={() => setShowGenModal(true)}
          className="w-full md:w-auto bg-accent hover:bg-accent-hover text-white px-6 py-3 rounded-[12px] font-bold text-xs transition-all whitespace-nowrap font-sans text-center shadow-sm"
        >
          {t('dashboard.buildRoadmap')}
        </button>
      </motion.div>

      {/* Courses Row */}
      <motion.div variants={itemVariants} className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
          <h2 className="text-xl sm:text-2xl font-bold font-clash text-zinc-900 dark:text-white">
            {t('dashboard.yourRoadmaps') || (locale === 'en' ? 'Your Roadmap Courses' : 'Ваши курсы дорожных карт')}
          </h2>
          <button onClick={() => navigate('/courses')} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 group font-sans">
            {t('dashboard.viewAllCatalog')} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        
        {courses.length === 0 ? (
          <div className="bg-white dark:bg-[#1A1A1C] border border-dashed border-zinc-300 dark:border-white/15 rounded-[18px] p-10 text-center flex flex-col items-center justify-center">
            <BookOpen className="w-12 h-12 text-zinc-400 mb-4 opacity-50" strokeWidth={1} />
            <p className="text-zinc-500 dark:text-zinc-400 font-medium mb-4">{t('dashboard.noCourses')}</p>
            <button 
              onClick={() => setShowGenModal(true)}
              className="bg-accent hover:bg-accent-hover text-white px-5 py-2.5 rounded-[12px] text-xs font-bold transition-colors shadow-sm"
            >
              {t('dashboard.generateFirst')}
            </button>
          </div>
        ) : (
          <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-none">
            {courses.map((course, idx) => {
              const theme = getSubjectTheme(course.subject, course.topic, course.title, course.nodes);
              const SubjectIcon = theme.icon;

              return (
                <motion.div 
                  key={course.id}
                  whileHover={{ y: -3 }}
                  onClick={() => {
                    if (plan === 'FREE' && idx > 0) {
                      navigate('/pricing');
                      return;
                    }
                    localStorage.setItem('selected_course_id', course.id);
                    navigate('/graph');
                  }}
                  className={`min-w-[300px] max-w-[300px] flex-shrink-0 bg-white dark:bg-[#1A1A1C] border ${theme.borderClass} border-zinc-200 dark:border-white/10 rounded-[20px] overflow-hidden transition-all duration-200 cursor-pointer snap-start relative shadow-sm hover:shadow-md`}
                >
                  {/* Lock overlay for archived courses on Free plan */}
                  {plan === 'FREE' && idx > 0 && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/75 backdrop-blur-[2px] p-6 text-center select-none text-white">
                      <Lock className="w-6 h-6 text-white mb-2" strokeWidth={1.5} />
                      <span className="text-[11px] font-bold uppercase tracking-wider mb-1">Архивировано (FREE)</span>
                      <p className="text-[10px] text-zinc-300 leading-tight">Перейдите на PRO, чтобы разблокировать этот курс</p>
                    </div>
                  )}

                  {/* Course Header Banner with Subject Theme */}
                  <div className="p-4 border-b border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.02] flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border shadow-2xs ${theme.bgBadgeClass}`}>
                      <SubjectIcon className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                      <span className="truncate max-w-[140px]">{theme.subject}</span>
                    </span>
                    <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 px-2 py-0.5 rounded-full">
                      {course.level || 'Beginner'}
                    </span>
                  </div>

                  <div className="p-5">
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white mt-0.5 mb-1 line-clamp-1 font-clash">{t(course.title)}</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5 font-sans line-clamp-2">{course.description || 'Интерактивная дорожная карта знания.'}</p>
                    
                    <div className="flex justify-between text-[11px] font-mono mb-2">
                      <span className="text-zinc-500 dark:text-zinc-400 font-sans">Прогресс</span>
                      <span className="text-zinc-900 dark:text-white font-bold font-mono">{course.progress || 0}%</span>
                    </div>
                    <div className="w-full h-[3px] bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${course.progress || 0}%` }}
                        transition={{ duration: 1, delay: 0.2 + (idx * 0.05) }}
                        className={`h-full bg-gradient-to-r ${theme.accentGradient} rounded-full`}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Dash placeholder to complete visual layout */}
            {courses.length > 0 && courses.length <= 2 && (
              <div 
                onClick={() => setShowGenModal(true)}
                className="min-w-[300px] max-w-[300px] flex-shrink-0 bg-transparent border-2 border-dashed border-zinc-300 dark:border-white/15 hover:border-indigo-400 rounded-[20px] flex flex-col items-center justify-center h-[208px] transition-colors cursor-pointer group"
              >
                <span className="text-3xl text-zinc-400 group-hover:text-indigo-500 transition-colors font-sans mb-1 font-light">+</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors font-sans font-medium">Создать новый курс</span>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Activity, Goal & Leagues Teaser Grid */}
      <motion.div variants={staggerContainer} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Activity */}
        <motion.div variants={itemVariants} className="lg:col-span-1 bg-white dark:bg-[#1A1A1C] border border-zinc-200 dark:border-white/10 rounded-[18px] p-6 flex flex-col justify-between min-h-[360px] shadow-sm">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white mb-5 font-sans">
              {t('dashboard.recentActivity') || (locale === 'en' ? 'Recent Activity' : 'Недавняя активность')}
            </h2>
            {activities.length === 0 ? (
              <p className="text-zinc-500 dark:text-zinc-400 text-xs py-4">
                {t('dashboard.noActivity') || (locale === 'en' ? 'No recent activity' : 'Активность отсутствует')}
              </p>
            ) : (
              <div className="space-y-3">
                {activities.slice(0, 4).map((activity, idx) => {
                  const IconComponent = iconMap[activity.icon] || Activity;
                  const badgeStyle = getActivityBadgeStyle(activity.icon);

                  return (
                    <div 
                      key={activity.id || idx}
                      className="flex items-center gap-3.5 p-2.5 rounded-[12px] border border-transparent hover:bg-zinc-50 dark:hover:bg-white/5 transition-all cursor-default"
                    >
                      <div className={`p-2 rounded-[10px] border shadow-2xs ${badgeStyle}`}>
                        <IconComponent className="w-4 h-4" strokeWidth={1.75} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-zinc-900 dark:text-white truncate">{activity.title}</h4>
                      </div>
                      <span className="text-[10px] text-zinc-400 font-mono whitespace-nowrap">
                        {new Date(activity.timestamp).toLocaleDateString(locale === 'en' ? 'en-US' : 'ru-RU', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* Certificates Card */}
        <motion.div 
          variants={itemVariants} 
          onClick={() => setShowCertModal(true)}
          className="lg:col-span-1 bg-white dark:bg-[#1A1A1C] border border-zinc-200 dark:border-white/10 hover:border-indigo-400/50 transition-all rounded-[18px] p-6 flex flex-col items-center justify-between text-center min-h-[360px] cursor-pointer group shadow-sm"
        >
          <div className="w-full flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white font-sans flex items-center gap-2">
              <FileBadge className="w-4 h-4 text-accent" strokeWidth={1.5} />
              {t('dashboard.myCertificates') || (locale === 'en' ? 'My Certificates' : 'Мои сертификаты')}
            </h2>
          </div>
          
          <div className="relative w-32 h-32 my-auto flex items-center justify-center">
            <div className="absolute inset-0 bg-accent-subtle rounded-full blur-2xl group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 w-24 h-24 rounded-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-center justify-center shadow-inner">
              <div className="flex flex-col items-center justify-center font-sans">
                <span className="text-3xl font-bold text-accent font-mono">{stats?.certificatesCount || 0}</span>
                <span className="text-[9px] font-bold text-zinc-400 mt-0.5 uppercase tracking-widest">
                  {locale === 'en' ? 'Earned' : 'Получено'}
                </span>
              </div>
            </div>
            {/* Decorative orbit circle */}
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full -rotate-90 animate-[spin_10s_linear_infinite]">
              <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" className="stroke-[1.5px] text-accent/40 stroke-dasharray-[4_8]" />
            </svg>
          </div>

          <div className="flex items-center justify-between w-full text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mt-4 border-t border-zinc-100 dark:border-white/5 pt-3">
            <span>{t('dashboard.viewAll') || (locale === 'en' ? 'View all' : 'Смотреть все')}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.div>

        {/* Leagues Teaser Widget */}
        <motion.div 
          variants={itemVariants} 
          onClick={() => navigate('/leagues')}
          className="lg:col-span-1 bg-white dark:bg-[#1A1A1C] border border-zinc-200 dark:border-white/10 hover:border-indigo-400/50 transition-all rounded-[18px] p-6 flex flex-col justify-between cursor-pointer group min-h-[360px] shadow-sm"
        >
          <div className="w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-zinc-900 dark:text-white font-sans flex items-center gap-2">
                <Trophy className="w-4 h-4 text-reward-text" strokeWidth={1.5} />
                {t('dashboard.competitiveLeague') || (locale === 'en' ? 'Competitive League' : 'Лига соревнований')}
              </h2>
              <span className="text-[10px] font-mono font-bold text-zinc-400 tabular-nums">{timeLeft}</span>
            </div>
            
            {/* Reward badge status for league */}
            <div className="bg-reward-subtle border border-reward-border rounded-xl p-3 flex items-center gap-3 mb-4 shadow-2xs">
              <div className="p-1.5 rounded-lg bg-white/60 dark:bg-black/40 text-reward-text shadow-2xs">
                <LeagueIcon leagueId={currentLeagueId} className="w-4 h-4" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-reward-text font-clash">
                    {locale === 'en' ? `${leagueName} League` : `Лига ${leagueName}`}
                  </p>
                  <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                </div>
                <p className="text-[10px] text-zinc-600 dark:text-zinc-300 truncate">
                  {locale === 'en' ? 'Click to open leaderboard' : 'Нажмите, чтобы открыть таблицу'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-xl text-xs bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-zinc-900 dark:text-white font-bold w-4">1</span>
                  <span className="text-zinc-900 dark:text-white font-bold truncate max-w-[110px]">{user?.displayName || (locale === 'en' ? 'You' : 'Вы')}</span>
                </div>
                <span className="font-mono tabular-nums text-indigo-600 dark:text-indigo-400 font-bold">{stats?.weeklyXP || 0} XP</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mt-4 border-t border-zinc-100 dark:border-white/5 pt-3">
            <span>{locale === 'en' ? 'View full group' : 'Смотреть всю группу'}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.div>

      </motion.div>

      {/* AI generator modal */}
      <CourseGeneratorModal 
        isOpen={showGenModal} 
        onClose={() => setShowGenModal(false)} 
        userUid={user?.uid} 
      />

      {/* Certificates modal */}
      <CertificatesModal 
        isOpen={showCertModal}
        onClose={() => setShowCertModal(false)}
      />
    </motion.div>
  );
}
