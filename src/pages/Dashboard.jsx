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
  FileBadge
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  getUserStats, 
  getUserCourses, 
  getRecentActivities 
} from '../services/courseService.js';
import { usePlanLimits } from '../hooks/usePlanLimits.js';
import CourseGeneratorModal from '../components/CourseGeneratorModal.jsx';
import CertificatesModal from '../components/shared/CertificatesModal.jsx';
import RepeatReminder from '../components/shared/RepeatReminder.jsx';
import { t, useLocale } from '../i18n.js';
import { LeagueIcon } from './Leagues.jsx';

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
      if (cached) return JSON.parse(cached);
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
          const fetchedCourses = await getUserCourses(currentUser.uid);
          
          // Dynamically compute active courses to fix any database desyncs
          fetchedStats.activeCoursesCount = fetchedCourses.length;
          
          setStats(fetchedStats);
          localStorage.setItem('cached_stats', JSON.stringify(fetchedStats));
          localStorage.setItem('cached_profile', JSON.stringify(fetchedStats));

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
        <Loader2 className="w-8 h-8 animate-spin text-on-surface" />
        <p className="text-sm font-medium">{t('insights.loading')}</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={staggerContainer}
      className="max-w-[2000px] mx-auto space-y-8 text-on-background font-sans"
    >
      <RepeatReminder />

      {/* Hero Banner with large abstract Apple Visual */}
      <motion.div 
        variants={itemVariants}
        className="relative overflow-hidden rounded-[16px] bg-surface border border-outline p-8 md:p-12"
      >
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
          <div className="flex-1 max-w-2xl">
            <motion.h1 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-[56px] font-bold text-on-surface mb-4 tracking-tight leading-none font-clash"
            >
              {t(getGreetingKey(), { name: stats.firstName || 'Learner', defaultValue: t('dashboard.welcome', { name: stats.firstName || 'Learner' }) })}
            </motion.h1>
            <p className="text-sm text-on-surface-variant mb-8 leading-relaxed">
              {t('dashboard.streakDesc', { streak: stats.streakDays || 1 })}
            </p>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowGenModal(true)}
              className="bg-on-surface hover:bg-surface-container text-inverse-on-surface px-6 py-3 rounded-[12px] font-bold text-xs transition-colors"
            >
              {t('dashboard.generateCourse')}
            </motion.button>
          </div>
          {/* Detailed abstract geometric mesh (35-40% width) */}
          <div className="w-[35%] max-w-[280px] aspect-square flex-shrink-0 hidden md:block select-none">
            <svg viewBox="0 0 200 200" className="w-full h-full text-on-surface opacity-30 stroke-current stroke-[0.5] fill-none overflow-visible">
              <defs>
                <linearGradient id="appleHeroGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
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
              
              <path d="M 10 100 Q 50 20 100 100 T 190 100" stroke="url(#appleHeroGrad)" strokeWidth="1" />
              <path d="M 10 100 Q 50 180 100 100 T 190 100" stroke="url(#appleHeroGrad)" strokeWidth="1" />
              <path d="M 100 10 Q 180 50 100 100 T 100 190" stroke="url(#appleHeroGrad)" strokeWidth="1" />
              <path d="M 100 10 Q 20 50 100 100 T 100 190" stroke="url(#appleHeroGrad)" strokeWidth="1" />
            </svg>
          </div>
        </div>
      </motion.div>

      {/* Free tier upsell banner */}
      {plan === 'FREE' && (
        <motion.div
          variants={itemVariants}
          className="bg-surface border border-outline border-l-[4px] border-l-[#FFFFFF] rounded-[16px] p-6 flex flex-col md:flex-row gap-6 items-center justify-between shadow-sm"
        >
          <div className="flex-1 text-left">
            <h3 className="text-sm font-bold text-on-surface flex items-center gap-1.5 font-clash">
              Разблокируйте полную силу обучения с PRO подпиской
            </h3>
            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed max-w-xl">
              Получите безлимитную генерацию курсов, AI-ментора с памятью о сессиях, полную аналитику прогресса и доступ к Diamond & Master лигам.
            </p>
          </div>
          <button
            onClick={() => navigate('/pricing')}
            className="bg-on-surface hover:bg-surface-container text-inverse-on-surface rounded-[12px] px-5 py-2.5 text-xs font-bold transition-all font-sans whitespace-nowrap self-start md:self-auto"
          >
            Узнать больше
          </button>
        </motion.div>
      )}

      {/* Asymmetric Metrics Grid (Stretched to 12 columns full width) */}
      <motion.div variants={staggerContainer} className="grid grid-cols-12 gap-6">
        {/* Large Active Courses Card (col-span-6) */}
        <div className="col-span-12 lg:col-span-6 bg-surface border border-outline rounded-[16px] p-6 flex flex-col justify-between h-44 relative overflow-hidden group">
          <div>
            <p className="text-xs text-on-surface-variant mb-2 font-sans">Активные курсы</p>
            <h3 className="text-4xl font-bold text-on-surface font-mono">
              <AnimatedNumber value={stats.activeCoursesCount || 0} />
            </h3>
          </div>
          
          <div className="h-8 w-full mt-4 opacity-40 group-hover:opacity-75 transition-opacity duration-300">
            <svg className="w-full h-full stroke-on-surface stroke-[1] fill-none overflow-visible" viewBox="0 0 100 20" preserveAspectRatio="none">
              <path d="M0,15 L15,10 L30,17 L45,5 L60,12 L75,3 L90,15 L100,8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Hours Learned (col-span-2) */}
        <div className="col-span-12 sm:col-span-4 lg:col-span-2 bg-surface border border-outline rounded-[16px] p-6 flex flex-col justify-between h-44">
          <div>
            <p className="text-xs text-on-surface-variant mb-2 font-sans">{t('dashboard.stats.hours')}</p>
            <h3 className="text-4xl font-bold text-on-surface font-mono">
              <AnimatedNumber value={stats.hoursLearned || 0} />
            </h3>
          </div>
          <p className="text-xs text-on-surface-variant font-sans">Часы обучения</p>
        </div>

        {/* Certificates (col-span-2) */}
        <div className="col-span-12 sm:col-span-4 lg:col-span-2 bg-surface border border-outline rounded-[16px] p-6 flex flex-col justify-between h-44">
          <div>
            <p className="text-xs text-on-surface-variant mb-2 font-sans">{t('dashboard.stats.certs')}</p>
            <h3 className="text-4xl font-bold text-on-surface font-mono">
              <AnimatedNumber value={stats.certificatesCount || 0} />
            </h3>
          </div>
          <p className="text-xs text-on-surface-variant font-sans">Сертификаты</p>
        </div>

        {/* Streaks (col-span-2) */}
        <div className="col-span-12 sm:col-span-4 lg:col-span-2 bg-surface border border-outline rounded-[16px] p-6 flex flex-col justify-between h-44">
          <div>
            <p className="text-xs text-on-surface-variant mb-2 font-sans">{t('dashboard.stats.streak')}</p>
            <h3 className="text-4xl font-bold text-on-surface font-mono">
              {stats.streakDays || 1}
            </h3>
          </div>
          
          <div className="flex gap-1.5 mt-2">
            {Array.from({ length: 7 }).map((_, i) => {
              const isActive = i < (stats.streakDays || 1);
              return (
                <div 
                  key={i} 
                  className={`w-2 h-2 rounded-full ${isActive ? 'bg-on-surface border border-[#FFFFFF]' : 'bg-transparent border border-outline'}`}
                  title={`День ${i + 1}`}
                />
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Horizontal Custom Course CTA Card */}
      <motion.div 
        variants={itemVariants} 
        className="bg-surface border border-outline rounded-[16px] p-6 flex flex-col md:flex-row gap-6 items-center justify-between"
      >
        <div className="flex-1">
          <h2 className="text-base font-bold text-on-background font-clash">{t('dashboard.generateCustom')}</h2>
          <p className="text-xs text-on-surface-variant mt-1">{t('dashboard.generateCustomDesc')}</p>
        </div>
        <button 
          onClick={() => setShowGenModal(true)}
          className="border border-[#FFFFFF] hover:bg-on-surface text-on-surface hover:text-inverse-on-surface px-6 py-3 rounded-[12px] font-bold text-xs transition-all whitespace-nowrap font-sans"
        >
          {t('dashboard.buildRoadmap')}
        </button>
      </motion.div>

      {/* Courses Row */}
      <motion.div variants={itemVariants} className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold font-clash text-on-surface">Ваши курсы дорожных карт</h2>
          <button onClick={() => navigate('/courses')} className="text-xs font-bold text-on-surface hover:text-on-surface/80 flex items-center gap-1 group font-sans">
            {t('dashboard.viewAllCatalog')} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        
        {courses.length === 0 ? (
          <div className="bg-surface border border-dashed border-outline rounded-[16px] p-10 text-center flex flex-col items-center justify-center">
            <BookOpen className="w-12 h-12 text-on-surface-variant mb-4 opacity-50" strokeWidth={1} />
            <p className="text-on-surface-variant font-medium mb-4">{t('dashboard.noCourses')}</p>
            <button 
              onClick={() => setShowGenModal(true)}
              className="bg-on-surface hover:bg-surface-container text-inverse-on-surface px-5 py-2.5 rounded-[12px] text-xs font-bold transition-colors"
            >
              {t('dashboard.generateFirst')}
            </button>
          </div>
        ) : (
          <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin">
            {courses.map((course, idx) => (
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
                className="min-w-[300px] max-w-[300px] flex-shrink-0 bg-surface border border-outline rounded-[16px] overflow-hidden transition-all duration-200 cursor-pointer snap-start relative"
              >
                {/* Lock overlay for archived courses on Free plan */}
                {plan === 'FREE' && idx > 0 && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/75 backdrop-blur-[2px] p-6 text-center select-none">
                    <Lock className="w-6 h-6 text-on-surface mb-2" strokeWidth={1.5} />
                    <span className="text-[11px] font-bold text-on-surface uppercase tracking-wider mb-1">Архивировано (FREE)</span>
                    <p className="text-[10px] text-on-surface-variant leading-tight">Перейдите на PRO, чтобы разблокировать этот курс</p>
                  </div>
                )}
                <div className="h-24 bg-surface-container/50 border-b border-outline relative overflow-hidden flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full text-on-surface opacity-10 stroke-current stroke-[0.5] fill-none" viewBox="0 0 100 40" preserveAspectRatio="none">
                    <line x1="0" y1="0" x2="100" y2="40" />
                    <line x1="0" y1="40" x2="100" y2="0" />
                    <line x1="50" y1="0" x2="50" y2="40" />
                    <circle cx="50" cy="20" r="8" />
                  </svg>
                  <Brain className="w-8 h-8 text-on-surface opacity-40 relative z-10" strokeWidth={1.5} />
                </div>
                <div className="p-6">
                  {/* Category tag: allowed uppercase, small tracking */}
                  <span className="text-[9px] font-mono font-bold text-on-surface-variant tracking-tight uppercase">
                    {course.category}
                  </span>
                  <h3 className="text-base font-bold text-on-surface mt-1 mb-1 line-clamp-1 font-clash">{t(course.title)}</h3>
                  <p className="text-xs text-on-surface-variant mb-6 font-sans">{course.level}</p>
                  
                  <div className="flex justify-between text-[11px] font-mono mb-2">
                    <span className="text-on-surface-variant font-sans">Прогресс</span>
                    <span className="text-on-surface font-bold font-mono">{course.progress || 0}%</span>
                  </div>
                  <div className="w-full h-[2px] bg-surface-container border border-outline-variant rounded-sm overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${course.progress || 0}%` }}
                      transition={{ duration: 1, delay: 0.2 + (idx * 0.05) }}
                      className="h-full bg-on-surface"
                    />
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Dash placeholder to complete visual layout on wide screens if courses <= 2 */}
            {courses.length > 0 && courses.length <= 2 && (
              <div 
                onClick={() => setShowGenModal(true)}
                className="min-w-[300px] max-w-[300px] flex-shrink-0 bg-transparent border-2 border-dashed border-outline hover:border-[rgba(255,255,255,0.3)] rounded-[16px] flex flex-col items-center justify-center h-[208px] transition-colors cursor-pointer group"
              >
                <span className="text-3xl text-on-surface-variant group-hover:text-on-surface transition-colors font-sans mb-1 font-light">+</span>
                <span className="text-xs text-on-surface-variant group-hover:text-on-surface transition-colors font-sans">Создать новый курс</span>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Activity, Goal & Leagues Teaser Grid (Stretched across full width) */}
      <motion.div variants={staggerContainer} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Activity (1/3 width) */}
        <motion.div variants={itemVariants} className="lg:col-span-1 bg-surface border border-outline rounded-[16px] p-6 flex flex-col justify-between min-h-[360px]">
          <div>
            <h2 className="text-base font-bold text-on-surface mb-6 font-sans">Недавняя активность</h2>
            {activities.length === 0 ? (
              <p className="text-on-surface-variant text-xs py-4">Активность отсутствует</p>
            ) : (
              <div className="space-y-3">
                {activities.slice(0, 4).map((activity, idx) => {
                  const IconComponent = iconMap[activity.icon] || Activity;
                  return (
                    <div 
                      key={activity.id || idx}
                      className="flex items-center gap-4 p-2.5 rounded-[12px] border border-transparent hover:bg-surface-container/40 transition-all cursor-default"
                    >
                      <div className="p-2 rounded-[8px] bg-surface-container border border-outline text-on-surface">
                        <IconComponent className="w-4 h-4" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-on-background truncate">{activity.title}</h4>
                      </div>
                      <span className="text-[10px] text-on-surface-variant font-mono whitespace-nowrap">
                        {new Date(activity.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* Certificates Card (1/3 width) replaces Weekly Goal */}
        <motion.div 
          variants={itemVariants} 
          onClick={() => setShowCertModal(true)}
          className="lg:col-span-1 bg-surface border border-outline hover:border-white/20 transition-all rounded-[16px] p-6 flex flex-col items-center justify-between text-center min-h-[360px] cursor-pointer group"
        >
          <div className="w-full flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-on-surface font-sans flex items-center gap-2">
              <FileBadge className="w-4 h-4 text-on-surface-variant" strokeWidth={1.5} />
              Мои сертификаты
            </h2>
          </div>
          
          <div className="relative w-32 h-32 my-auto flex items-center justify-center">
            <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors" />
            <div className="relative z-10 w-24 h-24 rounded-full bg-surface-container border border-outline flex items-center justify-center">
              <div className="flex flex-col items-center justify-center font-sans">
                <span className="text-3xl font-bold text-on-surface font-mono">{stats.certificatesCount || 0}</span>
                <span className="text-[10px] font-bold text-on-surface-variant mt-1 uppercase tracking-widest">Получено</span>
              </div>
            </div>
            {/* Decorative orbit circle */}
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full -rotate-90 animate-[spin_10s_linear_infinite]">
              <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" className="stroke-[1px] text-primary/30 stroke-dasharray-[4_8]" />
            </svg>
          </div>

          <div className="flex items-center justify-between w-full text-[10px] font-bold text-on-surface mt-4 border-t border-outline pt-3 group-hover:text-on-surface/80 transition-colors">
            <span>Смотреть все</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.div>

        {/* Leagues Teaser (1/3 width) */}
        <motion.div 
          variants={itemVariants} 
          onClick={() => navigate('/leagues')}
          className="lg:col-span-1 bg-surface border border-outline hover:border-white/20 transition-all rounded-[16px] p-6 flex flex-col justify-between cursor-pointer group min-h-[360px]"
        >
          <div className="w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-on-surface font-sans flex items-center gap-2">
                <Trophy className="w-4 h-4 text-on-surface-variant" strokeWidth={1.5} />
                Лига соревнований
              </h2>
              <span className="text-[10px] font-mono font-bold text-on-surface-variant tabular-nums">{timeLeft}</span>
            </div>
            
            <div className="bg-surface-container/20 border border-outline rounded-lg p-2 flex items-center gap-2 mb-4">
              <div className="p-1 rounded bg-surface border border-outline text-on-surface">
                <LeagueIcon leagueId={stats.currentLeague || (plan === 'FREE' ? 'graphite' : 'quartz')} className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-on-surface">
                  {stats.currentLeague === 'silicon' ? 'Кремний' : stats.currentLeague === 'graphite' ? 'Графит' : stats.currentLeague === 'quartz' ? 'Кварц' : stats.currentLeague === 'obsidian' ? 'Обсидиан' : stats.currentLeague === 'platinum' ? 'Платина' : 'Титан'}
                </p>
                <p className="text-[9px] text-on-surface-variant">Нажмите, чтобы открыть таблицу</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded-lg text-xs bg-surface-container/20 border border-outline">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-on-surface w-4">1</span>
                  <span className="text-on-surface font-bold truncate max-w-[100px]">{user?.displayName || 'Вы'}</span>
                </div>
                <span className="font-mono tabular-nums text-on-surface">{stats?.weeklyXP || 0} XP</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg text-xs bg-transparent border border-transparent opacity-50">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-on-surface-variant w-4">-</span>
                  <span className="text-on-surface-variant truncate max-w-[100px]">Ожидание игроков...</span>
                </div>
                <span className="font-mono tabular-nums text-on-surface-variant">0 XP</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] font-bold text-on-surface mt-4 border-t border-outline pt-3 group-hover:text-on-surface/80 transition-colors">
            <span>Смотреть всю группу</span>
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
