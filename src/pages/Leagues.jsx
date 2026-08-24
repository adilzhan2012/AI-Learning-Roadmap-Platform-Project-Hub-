import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Trophy, ShieldAlert, ArrowRight, Loader2 } from 'lucide-react';
import { auth, db, functions } from '../firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { collection, getDocs } from 'firebase/firestore';
import { getUserStats, updateUserProfile } from '../services/courseService.js';
import { usePlanLimits } from '../hooks/usePlanLimits.js';
import { useGamification } from '../context/GamificationContext.jsx';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '../i18n.js';
import UserAvatar from '../components/shared/UserAvatar.jsx';

const LEAGUES_DATA = [
  { id: 'silicon', nameRu: 'Кремний', nameEn: 'Silicon', planRequired: 'FREE', xpRequired: 0, descRu: 'Стартовая лига. Понижение невозможно.', descEn: 'Starting league. Demotion is not possible.' },
  { id: 'graphite', nameRu: 'Графит', nameEn: 'Graphite', planRequired: 'FREE', xpRequired: 500, descRu: 'Лига для активных студентов. Требуется стабильность.', descEn: 'League for active students. Stability is required.' },
  { id: 'quartz', nameRu: 'Кварц', nameEn: 'Quartz', planRequired: 'PRO', xpRequired: 1500, descRu: 'Первый элитный уровень. Доступна с подпиской Pro.', descEn: 'First elite level. Available with Pro subscription.' },
  { id: 'obsidian', nameRu: 'Обсидиан', nameEn: 'Obsidian', planRequired: 'PRO', xpRequired: 3000, descRu: 'Лига для глубокого погружения. Доступна с подпиской Pro.', descEn: 'Deep immersion league. Available with Pro subscription.' },
  { id: 'platinum', nameRu: 'Платина', nameEn: 'Platinum', planRequired: 'ULTRA', xpRequired: 5000, descRu: 'Лига экспертов. Доступна с подпиской Ultra.', descEn: 'Experts league. Available with Ultra subscription.' },
  { id: 'titan', nameRu: 'Титан', nameEn: 'Titan', planRequired: 'ULTRA', xpRequired: 10000, descRu: 'Легендарная вершина. Высший соревновательный уровень. Требуется Ultra.', descEn: 'Legendary peak. Ultimate competitive level. Ultra required.' }
];

export function LeagueIcon({ leagueId, className = "w-5 h-5" }) {
  switch (leagueId) {
    case 'silicon':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
        </svg>
      );
    case 'graphite':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" />
        </svg>
      );
    case 'quartz':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <polygon points="12 2 20 10 12 22 4 10" />
          <line x1="12" y1="2" x2="12" y2="22" />
          <line x1="4" y1="10" x2="20" y2="10" />
        </svg>
      );
    case 'obsidian':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M12 2L3 7v6c0 5.5 4.5 10 9 10s9-4.5 9-10V7l-9-5z" />
          <path d="M12 6l5 4v4c0 3-2 5.5-5 7-3-1.5-5-4-5-7v-4l5-4z" />
        </svg>
      );
    case 'platinum':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="6" />
        </svg>
      );
    case 'titan':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M8 11h8M12 7v8" />
        </svg>
      );
    default:
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}

export default function Leagues({ embedded = false }) {
  const navigate = useNavigate();
  const locale = useLocale();
  const { plan } = usePlanLimits();
  const { showLeagueToast } = useGamification();
  const [user, setUser] = useState(auth.currentUser);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLeagueId, setSelectedLeagueId] = useState('quartz');
  const [visibleUserCount, setVisibleUserCount] = useState(10);
  const [timeLeft, setTimeLeft] = useState('');
  const [dbUsers, setDbUsers] = useState([]);

  useEffect(() => {
    setVisibleUserCount(10);
  }, [selectedLeagueId]);

  // Helper to determine dynamic league based on XP if user document has no explicit currentLeague
  const determineLeagueFromXP = (xp = 0, currentLeague) => {
    if (currentLeague && ['silicon', 'graphite', 'quartz', 'obsidian', 'platinum', 'titan'].includes(currentLeague)) {
      return currentLeague;
    }
    if (xp >= 10000) return 'titan';
    if (xp >= 5000) return 'platinum';
    if (xp >= 3000) return 'obsidian';
    if (xp >= 1500) return 'quartz';
    if (xp >= 500) return 'graphite';
    return 'silicon';
  };

  // 1. Load User Stats & Leaderboard Users
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const s = await getUserStats(currentUser.uid);
          const userXP = s.xp || s.totalXPEarned || s.weeklyXP || 0;
          const defaultLg = s.currentLeague || determineLeagueFromXP(userXP, s.currentLeague);
          setSelectedLeagueId(defaultLg);
          
          setStats({
            ...s,
            currentLeague: defaultLg,
            weeklyXP: s.weeklyXP || 0,
            demotionProtected: s.demotionProtected !== false
          });

          let uList = [];

          // Try fetching via Cloud Function first
          try {
            const getLeaderboard = httpsCallable(functions, 'getLeaderboard');
            const lbRes = await getLeaderboard();
            
            if (lbRes.data && lbRes.data.success && Array.isArray(lbRes.data.users)) {
              uList = lbRes.data.users
                .filter(u => u.uid !== currentUser.uid)
                .map(u => {
                  const xpVal = u.weeklyXP || u.xp || u.totalXPEarned || 0;
                  return {
                    id: u.uid,
                    name: u.username || (u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : 'Студент'),
                    avatar: (u.username || u.firstName || 'S').charAt(0).toUpperCase(),
                    photoURL: u.photoURL,
                    avatarColor: u.avatarColor,
                    weeklyXP: xpVal,
                    currentLeague: determineLeagueFromXP(xpVal, u.currentLeague),
                    isCurrentUser: false
                  };
                });
            }
          } catch (cfErr) {
            console.warn("Cloud function getLeaderboard failed, falling back to direct Firestore fetch:", cfErr);
          }

          // Fallback: Direct Firestore collection fetch if Cloud Function yielded no users or failed
          if (uList.length === 0) {
            try {
              const snap = await getDocs(collection(db, 'users'));
              snap.forEach(docSnap => {
                if (docSnap.id !== currentUser.uid) {
                  const u = docSnap.data();
                  const xpVal = u.weeklyXP || u.xp || u.totalXPEarned || 0;
                  uList.push({
                    id: docSnap.id,
                    name: u.username || (u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : 'Студент'),
                    avatar: (u.username || u.firstName || 'S').charAt(0).toUpperCase(),
                    photoURL: u.photoURL,
                    avatarColor: u.avatarColor,
                    weeklyXP: xpVal,
                    currentLeague: determineLeagueFromXP(xpVal, u.currentLeague),
                    isCurrentUser: false
                  });
                }
              });
            } catch (fsErr) {
              console.error("Firestore user fetch error:", fsErr);
            }
          }

          setDbUsers(uList);
        } catch (e) {
          console.error("Error loading league data:", e);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [plan]);

  // 2. Countdown Timer
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const endOfWeek = new Date();
      // Sunday 23:59:59
      endOfWeek.setDate(now.getDate() + (7 - now.getDay() || 7) % 7);
      endOfWeek.setHours(23, 59, 59, 999);
      
      const diff = endOfWeek - now;
      if (diff <= 0) {
        setTimeLeft(locale === 'ru' ? 'Лига завершена' : 'League ended');
        return;
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft(locale === 'ru' 
        ? `${days}д ${hours}ч ${mins}м ${secs}с` 
        : `${days}d ${hours}h ${mins}m ${secs}s`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  // 3. Trigger motivation toast on mount as requested in specifications
  useEffect(() => {
    if (!loading && stats) {
      const lg = LEAGUES_DATA.find(l => l.id === stats.currentLeague);
      const lgName = locale === 'ru' ? (lg?.nameRu || 'Кварц') : (lg?.nameEn || 'Quartz');
      setTimeout(() => {
        if (showLeagueToast) {
          showLeagueToast(
            locale === 'ru'
              ? `Ещё 40 очков, чтобы остаться в лиге ${lgName}`
              : `40 more XP to stay in the ${lgName} league`
          );
        }
      }, 1500);
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-on-background gap-4 font-sans w-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-medium">{locale === 'ru' ? 'Загрузка лиг...' : 'Loading leagues...'}</p>
      </div>
    );
  }

  // Get active league properties
  const activeUserLeague = stats?.currentLeague || 'quartz';
  const selectedLeague = LEAGUES_DATA.find(l => l.id === selectedLeagueId) || LEAGUES_DATA[2];

  // Helper to generate real leaderboard of participants in the selected league
  const generateLeaderboard = (leagueId) => {
    // Filter dbUsers by currentLeague === leagueId
    const list = dbUsers.filter(u => (u.currentLeague || 'silicon') === leagueId);

    // Insert current user in their active league
    if (leagueId === activeUserLeague) {
      list.push({
        id: 'current-user',
        name: stats?.username || stats?.firstName || 'Learner',
        avatar: (stats?.username || stats?.firstName || 'L').charAt(0).toUpperCase(),
        photoURL: stats?.photoURL,
        avatarColor: stats?.avatarColor,
        weeklyXP: stats?.weeklyXP || 0,
        currentLeague: activeUserLeague,
        isCurrentUser: true
      });
    }

    // Sort descending
    return list.sort((a, b) => b.weeklyXP - a.weeklyXP);
  };

  const leaderboard = generateLeaderboard(selectedLeagueId);
  const currentUserIndex = leaderboard.findIndex(u => u.isCurrentUser);
  const currentUserRank = currentUserIndex !== -1 ? currentUserIndex + 1 : null;

  // Promotion limits (top 20% of 30 is top 6)
  const isUserInPromotionZone = currentUserRank && currentUserRank <= 6;
  const isFreePlanBlocked = plan === 'FREE' && selectedLeagueId === 'graphite' && isUserInPromotionZone;

  const isRu = locale === 'ru';
  const selectedLeagueName = isRu ? selectedLeague.nameRu : selectedLeague.nameEn;

  return (
    <div className={`${embedded ? 'w-full px-4 md:px-6' : 'max-w-[2000px] mx-auto min-h-[calc(100vh-4.5rem)] p-4 md:p-6'} text-on-surface font-sans space-y-8`}>
      {/* Header section */}
      {!embedded && (
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-outline-variant pb-6">
        <div>
          <h1 className="text-4xl font-bold font-clash text-on-background flex items-center gap-3">
            {isRu ? 'Лиги' : 'Leagues'}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <div className="p-1 rounded bg-surface-container-high/40 border border-outline-variant text-on-surface">
              <LeagueIcon leagueId={activeUserLeague} className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold text-on-surface">
              {isRu ? 'Ваша лига' : 'Your league'}: {isRu ? LEAGUES_DATA.find(l => l.id === activeUserLeague)?.nameRu : LEAGUES_DATA.find(l => l.id === activeUserLeague)?.nameEn}
            </span>
          </div>
          {stats?.demotionProtected && activeUserLeague === selectedLeagueId && (
            <p className="text-[11px] text-on-surface-variant mt-1">
              {isRu ? 'Защита от понижения активна на этой неделе' : 'Demotion protection is active this week'}
            </p>
          )}
        </div>
        <div className="bg-surface-container border border-outline-variant rounded-xl px-4 py-2 text-right">
          <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">
            {isRu ? 'До конца недели' : 'Until end of week'}
          </p>
          <p className="text-sm font-mono font-semibold tabular-nums text-on-surface mt-0.5">{timeLeft}</p>
        </div>
      </div>
      )}

      {/* Free user paywall block if they are in graphite promotion zone */}
      {isFreePlanBlocked && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-container border border-outline border-l-[4px] border-l-primary rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-center justify-between shadow-lg"
        >
          <div className="flex-1 text-left">
            <h3 className="text-sm font-bold text-on-surface flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-on-surface" strokeWidth={1.5} />
              {isRu ? 'Достигнута граница бесплатного плана' : 'Free plan limit reached'}
            </h3>
            <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed max-w-xl">
              {isRu 
                ? 'Вы находитесь в зоне продвижения лиги Графит. Чтобы продолжить соревнование и перейти в лигу Кварц на следующей неделе, разблокируйте тариф PRO.' 
                : 'You are in the promotion zone of the Graphite league. To continue competing and advance to the Quartz league next week, unlock PRO.'}
            </p>
          </div>
          <button
            onClick={() => navigate('/pricing')}
            className="bg-primary hover:bg-primary/95 text-on-primary rounded-xl px-5 py-2.5 text-xs font-bold transition-all font-sans whitespace-nowrap self-start md:self-auto"
          >
            {isRu ? 'Перейти на Pro' : 'Upgrade to Pro'}
          </button>
        </motion.div>
      )}

      {/* Main Grid: Leaderboard (Left) + League Progress (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Leaderboard Table (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-surface-container border border-outline rounded-[20px] overflow-hidden">
            <div className="p-4 bg-surface-container-high/20 border-b border-outline-variant flex items-center justify-between">
              <span className="text-xs font-semibold text-on-surface-variant">
                {isRu ? 'Лига' : 'League'}: {selectedLeagueName}
              </span>
              {selectedLeagueId !== activeUserLeague && (
                <span className="text-[10px] bg-surface-container-high/40 border border-outline-variant px-2 py-0.5 rounded text-on-surface-variant">
                  {isRu ? 'Режим просмотра' : 'Preview Mode'}
                </span>
              )}
            </div>

            <div className="divide-y divide-outline-variant/30 bg-surface-container-low p-2">
              {leaderboard.length === 0 ? (
                <div className="p-8 text-center text-on-surface-variant text-sm">
                  {isRu 
                    ? 'В этой лиге пока нет участников. Проходите тесты, чтобы занять первое место!' 
                    : 'No participants in this league yet. Take quizzes to claim the top spot!'}
                </div>
              ) : (
                <>
                  {leaderboard.slice(0, visibleUserCount).map((item, idx) => {
                    const rank = idx + 1;
                    const isPromotionZoneBorder = rank === 6;
                    const isDemotionZoneBorder = rank === 24;
                    
                    return (
                      <React.Fragment key={item.id}>
                        <div
                          className={`flex items-center justify-between p-3.5 rounded-[12px] transition-all ${
                            item.isCurrentUser
                              ? 'bg-surface-container-highest border-[1.5px] border-primary font-bold shadow-md z-10 relative'
                              : 'hover:bg-on-surface/[0.02]'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            {/* Position (Tabular numbers) */}
                            <span className={`w-6 text-center font-mono tabular-nums text-xs ${
                              rank <= 3 ? 'text-sm font-bold text-on-surface' : 'text-on-surface-variant'
                            }`}>
                              {rank}
                            </span>

                            {/* Avatar */}
                            <UserAvatar 
                              photoURL={item.photoURL}
                              firstName={item.name}
                              avatarColor={item.avatarColor}
                              className={`w-8 h-8 text-xs font-bold border ${
                                item.isCurrentUser
                                  ? 'border-primary shadow-[0_0_10px_rgba(var(--primary),0.3)]'
                                  : 'border-outline'
                              }`}
                            />

                            {/* Name */}
                            <span className={`text-xs ${
                              item.isCurrentUser ? 'text-on-surface font-bold' : 'text-on-surface'
                            }`}>
                              {item.name} {item.isCurrentUser && (isRu ? ' (Вы)' : ' (You)')}
                            </span>
                          </div>

                          {/* XP (Tabular numbers) */}
                          <span className="font-mono tabular-nums text-xs font-semibold text-on-surface">
                            {item.weeklyXP} XP
                          </span>
                        </div>

                        {/* Zone markers */}
                        {isPromotionZoneBorder && (
                          <div className="py-2.5 px-4 flex items-center gap-4 select-none">
                            <div className="flex-1 h-[1px] bg-outline/50" />
                            <span className="text-[10px] font-sans font-medium text-on-surface-variant whitespace-nowrap uppercase tracking-wider">
                              {isRu ? 'Зона повышения' : 'Promotion zone'}
                            </span>
                            <div className="flex-1 h-[1px] bg-outline/50" />
                          </div>
                        )}

                        {isDemotionZoneBorder && (
                          <div className="py-2.5 px-4 flex items-center gap-4 select-none">
                            <div className="flex-1 h-[1px] bg-outline/30" />
                            <span className="text-[10px] font-sans font-medium text-on-surface-variant whitespace-nowrap uppercase tracking-wider">
                              {isRu ? 'Зона понижения' : 'Demotion zone'}
                            </span>
                            <div className="flex-1 h-[1px] bg-outline/30" />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}

                  {leaderboard.length > visibleUserCount && (
                    <div className="p-4 text-center border-t border-outline-variant/30">
                      <button
                        onClick={() => setVisibleUserCount(prev => prev + 10)}
                        className="px-6 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant text-xs font-bold text-on-surface transition-all shadow-sm"
                      >
                        {isRu ? `Показать ещё (осталось ${leaderboard.length - visibleUserCount})` : `Show More (${leaderboard.length - visibleUserCount} remaining)`}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* League Hierarchy Progress Bar (1/3 width) */}
        <div className="space-y-6">
          <div className="bg-surface-container border border-outline rounded-[20px] p-6 space-y-6">
            <h2 className="text-sm font-bold text-on-surface font-clash uppercase tracking-wider">
              {isRu ? 'Иерархия лиг' : 'League Hierarchy'}
            </h2>
            
            <div className="flex flex-col gap-3">
              {LEAGUES_DATA.map((lg) => {
                const isSelected = selectedLeagueId === lg.id;
                const isUserActiveLeague = activeUserLeague === lg.id;
                const isLocked = 
                  (lg.planRequired === 'PRO' && plan === 'FREE') || 
                  (lg.planRequired === 'ULTRA' && (plan === 'FREE' || plan === 'PRO'));
                const lgName = isRu ? lg.nameRu : lg.nameEn;
                const lgDesc = isRu ? lg.descRu : lg.descEn;

                return (
                  <div
                    key={lg.id}
                    onClick={() => {
                      if (isLocked) {
                        navigate('/pricing');
                      } else {
                        setSelectedLeagueId(lg.id);
                      }
                    }}
                    className={`p-4 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-surface-container-highest border-primary'
                        : isLocked
                        ? 'border-transparent opacity-40 hover:opacity-50'
                        : 'bg-surface-container-low border-outline hover:border-outline-variant/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg border ${
                        isSelected ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container text-on-surface border-outline'
                      }`}>
                        <LeagueIcon leagueId={lg.id} className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <p className={`text-xs font-bold ${isSelected ? 'text-on-surface' : 'text-on-surface'}`}>{lgName}</p>
                          {isUserActiveLeague && (
                            <span className="text-[9px] font-sans font-bold bg-primary text-on-primary px-1.5 py-0.5 rounded uppercase">
                              {isRu ? 'Вы здесь' : 'You are here'}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-on-surface-variant mt-0.5">{lgDesc}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {lg.planRequired !== 'FREE' && (
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border uppercase tracking-widest ${
                          lg.planRequired === 'ULTRA'
                            ? 'bg-indigo-500/10 border-indigo-500/35 text-indigo-400'
                            : 'bg-amber-500/10 border-amber-500/35 text-amber-500'
                        }`}>
                          {lg.planRequired}
                        </span>
                      )}
                      {isLocked && (
                        <Lock className="w-3.5 h-3.5 text-on-surface-variant" strokeWidth={1.5} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
