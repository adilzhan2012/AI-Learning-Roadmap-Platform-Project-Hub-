import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Trophy, ShieldAlert, ArrowRight, Loader2 } from 'lucide-react';
import { auth, db } from '../firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import { getUserStats, updateUserProfile } from '../services/courseService.js';
import { usePlanLimits } from '../hooks/usePlanLimits.js';
import { useGamification } from '../context/GamificationContext.jsx';
import { useNavigate } from 'react-router-dom';

const LEAGUES_DATA = [
  { id: 'silicon', name: 'Кремний', isPro: false, xpRequired: 0, desc: 'Стартовая лига. Понижение невозможно.' },
  { id: 'graphite', name: 'Графит', isPro: false, xpRequired: 500, desc: 'Лига для активных студентов. Требуется стабильность.' },
  { id: 'quartz', name: 'Кварц', isPro: true, xpRequired: 1500, desc: 'Первый элитный уровень. Доступна с подпиской Pro.' },
  { id: 'obsidian', name: 'Обсидиан', isPro: true, xpRequired: 3000, desc: 'Лига для глубокого погружения. Доступна с подпиской Pro.' },
  { id: 'platinum', name: 'Платина', isPro: true, xpRequired: 5000, desc: 'Лига экспертов. Доступна с подпиской Pro.' },
  { id: 'titan', name: 'Титан', isPro: true, xpRequired: 10000, desc: 'Легендарная вершина. Высший соревновательный уровень.' }
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

export default function Leagues() {
  const navigate = useNavigate();
  const { plan } = usePlanLimits();
  const { showLeagueToast } = useGamification();
  const [user, setUser] = useState(auth.currentUser);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLeagueId, setSelectedLeagueId] = useState('quartz');
  const [timeLeft, setTimeLeft] = useState('');
  const [dbUsers, setDbUsers] = useState([]);

  // 1. Load User Stats
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const s = await getUserStats(currentUser.uid);
          // Set default league based on plan if none in db
          const defaultLg = s.currentLeague || (plan === 'FREE' ? 'graphite' : 'quartz');
          setSelectedLeagueId(defaultLg);
          
          // Make sure currentLeague is initialized in stats object
          setStats({
            ...s,
            currentLeague: defaultLg,
            weeklyXP: s.weeklyXP || 0,
            demotionProtected: s.demotionProtected !== false
          });

          // Fetch other users from Firestore
          const usersRef = collection(db, 'users');
          const snap = await getDocs(usersRef);
          const uList = [];
          snap.forEach((docSnap) => {
            const data = docSnap.data();
            if (docSnap.id !== currentUser.uid) {
              uList.push({
                id: docSnap.id,
                name: data.username || data.firstName || 'Learner',
                avatar: (data.username || data.firstName || 'L').charAt(0).toUpperCase(),
                weeklyXP: data.weeklyXP || 0,
                isCurrentUser: false
              });
            }
          });
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

  // 3. Trigger motivation toast on mount as requested in specifications
  useEffect(() => {
    if (!loading && stats) {
      const lgName = LEAGUES_DATA.find(l => l.id === stats.currentLeague)?.name || 'Кварц';
      setTimeout(() => {
        if (showLeagueToast) {
          showLeagueToast(`Ещё 40 очков, чтобы остаться в лиге ${lgName}`);
        }
      }, 1500);
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#000000] text-[#F5F5F7] gap-4 font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-[#FFFFFF]" />
        <p className="text-sm font-medium">Загрузка лиг...</p>
      </div>
    );
  }

  // Get active league properties
  const activeUserLeague = stats?.currentLeague || 'quartz';
  const selectedLeague = LEAGUES_DATA.find(l => l.id === selectedLeagueId) || LEAGUES_DATA[2];

  // Helper to generate seed-based mock leaderboard of 29 participants
  const generateMockLeaderboard = (leagueId) => {
    const list = [...dbUsers];
    const names = [
      'Alexander', 'Elena', 'Dmitry', 'Maria', 'Ivan', 'Olga', 'Maxim', 'Anna', 
      'Sergey', 'Tatiana', 'Andrey', 'Natalia', 'Alexey', 'Svetlana', 'Roman', 
      'Irina', 'Vladislav', 'Yulia', 'Artem', 'Marina', 'Pavel', 'Ekaterina', 
      'Denis', 'Galina', 'Egor', 'Vera', 'Kirill', 'Nadezhda', 'Anton'
    ];
    
    // Seed generator
    let seed = leagueId.charCodeAt(0) + leagueId.charCodeAt(1) || 42;
    const random = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    // Base XP bounds per league
    let minXP = 20;
    let maxXP = 200;
    if (leagueId === 'graphite') { minXP = 60; maxXP = 380; }
    if (leagueId === 'quartz') { minXP = 120; maxXP = 550; }
    if (leagueId === 'obsidian') { minXP = 250; maxXP = 800; }
    if (leagueId === 'platinum') { minXP = 400; maxXP = 1200; }
    if (leagueId === 'titan') { minXP = 600; maxXP = 2000; }

    // Pad with mock users up to 29
    while (list.length < 29) {
      const name = names[list.length % names.length];
      const xp = Math.round(minXP + random() * (maxXP - minXP));
      list.push({
        id: `mock-user-${list.length}`,
        name,
        avatar: name.charAt(0).toUpperCase(),
        weeklyXP: xp,
        isCurrentUser: false
      });
    }

    // Insert current user in their active league
    if (leagueId === activeUserLeague) {
      list.push({
        id: 'current-user',
        name: stats?.username || stats?.firstName || 'Learner',
        avatar: (stats?.username || stats?.firstName || 'L').charAt(0).toUpperCase(),
        weeklyXP: stats?.weeklyXP || 0,
        isCurrentUser: true
      });
    }

    // Sort descending
    return list.sort((a, b) => b.weeklyXP - a.weeklyXP);
  };

  const leaderboard = generateMockLeaderboard(selectedLeagueId);
  const currentUserIndex = leaderboard.findIndex(u => u.isCurrentUser);
  const currentUserRank = currentUserIndex !== -1 ? currentUserIndex + 1 : null;

  // Promotion limits (top 20% of 30 is top 6)
  const isUserInPromotionZone = currentUserRank && currentUserRank <= 6;
  const isFreePlanBlocked = plan === 'FREE' && selectedLeagueId === 'graphite' && isUserInPromotionZone;

  return (
    <div className="max-w-[2000px] mx-auto min-h-[calc(100vh-4.5rem)] text-[#F5F5F7] font-sans p-4 md:p-6 space-y-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[rgba(255,255,255,0.06)] pb-6">
        <div>
          <h1 className="text-4xl font-bold font-clash text-white flex items-center gap-3">
            Лиги
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <div className="p-1 rounded bg-[#2C2C2E]/40 border border-[rgba(255,255,255,0.06)] text-white">
              <LeagueIcon leagueId={activeUserLeague} className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold text-white">Ваша лига: {LEAGUES_DATA.find(l => l.id === activeUserLeague)?.name}</span>
          </div>
          {stats?.demotionProtected && activeUserLeague === selectedLeagueId && (
            <p className="text-[11px] text-[#8E8E93] mt-1">Защита от понижения активна на этой неделе</p>
          )}
        </div>
        <div className="bg-[#1C1C1E] border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-2 text-right">
          <p className="text-[10px] text-[#8E8E93] uppercase tracking-wider">До конца недели</p>
          <p className="text-sm font-mono font-semibold tabular-nums text-white mt-0.5">{timeLeft}</p>
        </div>
      </div>

      {/* Free user paywall block if they are in graphite promotion zone */}
      {isFreePlanBlocked && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1C1C1E] border border-[rgba(255,255,255,0.08)] border-l-[4px] border-l-[#FFFFFF] rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-center justify-between shadow-lg"
        >
          <div className="flex-1 text-left">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-white" strokeWidth={1.5} />
              Достигнута граница бесплатного плана
            </h3>
            <p className="text-xs text-[#98989D] mt-1.5 leading-relaxed max-w-xl">
              Вы находитесь в зоне продвижения лиги Графит. Чтобы продолжить соревнование и перейти в лигу Кварц на следующей неделе, разблокируйте тариф PRO.
            </p>
          </div>
          <button
            onClick={() => navigate('/pricing')}
            className="bg-white hover:bg-[#E8E8ED] text-black rounded-xl px-5 py-2.5 text-xs font-bold transition-all font-sans whitespace-nowrap self-start md:self-auto"
          >
            Перейти на Pro
          </button>
        </motion.div>
      )}

      {/* Main Grid: Leaderboard (Left) + League Progress (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Leaderboard Table (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#1C1C1E] border border-[rgba(255,255,255,0.08)] rounded-[20px] overflow-hidden">
            <div className="p-4 bg-[#2C2C2E]/20 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
              <span className="text-xs font-semibold text-[#8E8E93]">Лига: {selectedLeague.name}</span>
              {selectedLeagueId !== activeUserLeague && (
                <span className="text-[10px] bg-[#2C2C2E]/40 border border-[rgba(255,255,255,0.06)] px-2 py-0.5 rounded text-[#8E8E93]">Режим просмотра</span>
              )}
            </div>

            <div className="divide-y divide-[rgba(255,255,255,0.03)] bg-[#121214] p-2">
              {leaderboard.map((item, idx) => {
                const rank = idx + 1;
                const isPromotionZoneBorder = rank === 6;
                const isDemotionZoneBorder = rank === 24;
                
                return (
                  <React.Fragment key={item.id}>
                    <div
                      className={`flex items-center justify-between p-3.5 rounded-[12px] transition-all ${
                        item.isCurrentUser
                          ? 'bg-[#1C1C1E] border-[1.5px] border-[#FFFFFF] font-bold shadow-md z-10 relative'
                          : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {/* Position (Tabular numbers) */}
                        <span className={`w-6 text-center font-mono tabular-nums text-xs ${
                          rank <= 3 ? 'text-sm font-bold text-white' : 'text-[#8E8E93]'
                        }`}>
                          {rank}
                        </span>

                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${
                          item.isCurrentUser
                            ? 'bg-white text-black border-white'
                            : 'bg-[#2C2C2E] text-white border-[rgba(255,255,255,0.08)]'
                        }`}>
                          {item.avatar}
                        </div>

                        {/* Name */}
                        <span className={`text-xs ${
                          item.isCurrentUser ? 'text-white font-bold' : 'text-[#F5F5F7]'
                        }`}>
                          {item.name} {item.isCurrentUser && ' (Вы)'}
                        </span>
                      </div>

                      {/* XP (Tabular numbers) */}
                      <span className="font-mono tabular-nums text-xs font-semibold text-white">
                        {item.weeklyXP} XP
                      </span>
                    </div>

                    {/* Zone markers */}
                    {isPromotionZoneBorder && (
                      <div className="py-2.5 px-4 flex items-center gap-4 select-none">
                        <div className="flex-1 h-[1px] bg-white/20" />
                        <span className="text-[10px] font-sans font-medium text-[#8E8E93] whitespace-nowrap uppercase tracking-wider">Зона повышения</span>
                        <div className="flex-1 h-[1px] bg-white/20" />
                      </div>
                    )}

                    {isDemotionZoneBorder && (
                      <div className="py-2.5 px-4 flex items-center gap-4 select-none">
                        <div className="flex-1 h-[1px] bg-white/10" />
                        <span className="text-[10px] font-sans font-medium text-[#8E8E93] whitespace-nowrap uppercase tracking-wider">Зона понижения</span>
                        <div className="flex-1 h-[1px] bg-white/10" />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>

        {/* League Hierarchy Progress Bar (1/3 width) */}
        <div className="space-y-6">
          <div className="bg-[#1C1C1E] border border-[rgba(255,255,255,0.08)] rounded-[20px] p-6 space-y-6">
            <h2 className="text-sm font-bold text-white font-clash uppercase tracking-wider">Иерархия лиг</h2>
            
            <div className="flex flex-col gap-3">
              {LEAGUES_DATA.map((lg) => {
                const isSelected = selectedLeagueId === lg.id;
                const isUserActiveLeague = activeUserLeague === lg.id;
                const isLocked = lg.isPro && plan === 'FREE';

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
                        ? 'bg-[#2C2C2E]/60 border-white'
                        : isLocked
                        ? 'border-transparent opacity-40 hover:opacity-50'
                        : 'bg-[#2C2C2E]/20 border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.15)]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg border ${
                        isSelected ? 'bg-white text-black border-white' : 'bg-[#1C1C1E] text-white border-[rgba(255,255,255,0.08)]'
                      }`}>
                        <LeagueIcon leagueId={lg.id} className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <p className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-[#F5F5F7]'}`}>{lg.name}</p>
                          {isUserActiveLeague && (
                            <span className="text-[9px] font-sans font-bold bg-white text-black px-1.5 py-0.5 rounded uppercase">Вы здесь</span>
                          )}
                        </div>
                        <p className="text-[10px] text-[#8E8E93] mt-0.5">{lg.desc}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {lg.isPro && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#2C2C2E] border border-[rgba(255,255,255,0.08)] text-white uppercase">
                          Pro
                        </span>
                      )}
                      {isLocked && (
                        <Lock className="w-3.5 h-3.5 text-[#8E8E93]" strokeWidth={1.5} />
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
