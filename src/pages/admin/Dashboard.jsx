import React, { useState, useEffect } from 'react';
import { collection, collectionGroup, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db, functions } from '../../firebase.js';
import { httpsCallable } from 'firebase/functions';
import AdminHeader from '../../components/admin/AdminHeader.jsx';
import StatusBadge from '../../components/admin/ui/StatusBadge.jsx';
import { Users, UserPlus, CreditCard, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import DateRangePicker from '../../components/admin/ui/DateRangePicker.jsx';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

// Custom Tooltip for charts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0A0A0B] border border-white/10 p-3 rounded-xl shadow-xl">
        <p className="text-zinc-400 text-xs mb-1">{label}</p>
        <p className="text-white font-medium">
          {payload[0].name}: {payload[0].value}
        </p>
        <p className="text-emerald-400 text-xs mt-1">
          +8% к прошлой неделе
        </p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [realStats, setRealStats] = useState({
    online: 0,
    total: 0,
    premium: 0
  });
  const [liveActivity, setLiveActivity] = useState([]);
  const [userGrowthData, setUserGrowthData] = useState([]);
  const [dateRange, setDateRange] = useState(7);

  useEffect(() => {
    async function fetchStats() {
      try {
        const getAdminStatsFn = httpsCallable(functions, 'getAdminDashboardStats');
        const res = await getAdminStatsFn();
        if (res.data) {
          const { total, premium, online, growthChart } = res.data;
          setRealStats({ online, total, premium });
          setUserGrowthData(growthChart);
        }
      } catch (e) {
        console.error('Error fetching dashboard stats:', e);
      }
    }

    async function fetchActivities() {
      try {
        const thresholdDate = new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000).toISOString();
        // Fallback simple query since we might not have composite index on timestamp
        const q = query(collectionGroup(db, 'activities'), orderBy('timestamp', 'desc'), limit(15));
        const snap = await getDocs(q);
        const acts = [];
        snap.forEach(doc => {
          const data = doc.data();
          if (data.timestamp >= thresholdDate) {
            acts.push({ id: doc.id, ...data });
          }
        });
        setLiveActivity(acts.slice(0, 5));
      } catch (e) {
        // Silently catch permission/index errors for live activity feed if user lacks collectionGroup permissions
        if (e.code !== 'permission-denied') {
          console.warn('Could not fetch live activities:', e.message);
        }
      }
    }

    fetchStats();
    fetchActivities();
  }, [dateRange]);

  const sparklineData = [
    { value: 400 }, { value: 300 }, { value: 550 }, { value: 450 }, { value: 600 }, { value: 700 }
  ];

  // Revenue chart will be empty state since payments aren't integrated yet
  const revenueData = [];

  const stats = [
    { name: 'Онлайн', value: realStats.online.toString(), icon: Users, color: '#10B981' },
    { name: 'Новые регистрации', value: realStats.total.toString(), icon: UserPlus, color: '#6366F1' },
    { name: 'Подписки', value: realStats.premium.toString(), icon: CreditCard, color: '#F59E0B' },
    { name: 'Доход', value: '$0', icon: DollarSign, color: '#EC4899' },
    { name: 'Конверсия', value: realStats.total > 0 ? ((realStats.premium / realStats.total) * 100).toFixed(1) + '%' : '0%', icon: TrendingUp, color: '#06B6D4' },
  ];

  return (
    <div>
      <AdminHeader 
        title="Обзор Дашборда" 
        description="Ключевые метрики и показатели в реальном времени." 
      >
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </AdminHeader>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-[#18181B] border border-white/5 p-5 rounded-2xl relative overflow-hidden group hover:border-white/10 transition-colors">
              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-zinc-300 group-hover:text-white transition-colors" />
                </div>
              </div>
              
              <div className="relative z-10">
                <h3 className="text-zinc-400 text-sm font-medium">{stat.name}</h3>
                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue Chart */}
        <div className="bg-[#18181B] border border-white/5 p-6 rounded-2xl">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-white">График Дохода</h3>
            <p className="text-sm text-zinc-400">Общий доход за выбранный период.</p>
          </div>
          <div className="h-[300px] w-full relative flex items-center justify-center">
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818CF8" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#818CF8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="#52525B" tick={{fill: '#A1A1AA', fontSize: 12}} axisLine={false} tickLine={false} />
                  <YAxis stroke="#52525B" tick={{fill: '#A1A1AA', fontSize: 12}} axisLine={false} tickLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
                  <Area type="monotone" dataKey="revenue" name="Доход" stroke="#818CF8" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center">
                <DollarSign className="w-8 h-8 text-zinc-600 mx-auto mb-2 opacity-50" />
                <p className="text-zinc-500 text-sm">Модуль оплат еще не подключен</p>
              </div>
            )}
          </div>
        </div>

        {/* User Growth Chart */}
        <div className="bg-[#18181B] border border-white/5 p-6 rounded-2xl">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-white">Прирост пользователей</h3>
            <p className="text-sm text-zinc-400">Новые регистрации по месяцам.</p>
          </div>
          <div className="h-[300px] w-full relative flex items-center justify-center">
            {userGrowthData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="#52525B" tick={{fill: '#A1A1AA', fontSize: 12}} axisLine={false} tickLine={false} />
                  <YAxis stroke="#52525B" tick={{fill: '#A1A1AA', fontSize: 12}} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
                  <Line type="monotone" dataKey="users" name="Пользователи" stroke="#34D399" strokeWidth={3} dot={{ fill: '#09090B', stroke: '#34D399', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, strokeWidth: 0, fill: '#34D399' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-zinc-500 text-sm">Нет данных для графика</p>
            )}
          </div>
        </div>
      </div>

      {/* Live Activity Feed */}
      <div className="bg-[#18181B] border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-white">Активность в реальном времени</h3>
            <p className="text-sm text-zinc-400">Последние действия на платформе</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-medium text-zinc-300">Live</span>
          </div>
        </div>
        <div className="divide-y divide-white/5">
          {liveActivity.length > 0 ? liveActivity.map((activity) => (
            <div key={activity.id} className="p-4 hover:bg-white/[0.02] transition-colors flex items-center gap-4">
              <div className={`flex-shrink-0 w-10 h-10 rounded-xl bg-[#09090B] border border-white/5 flex items-center justify-center ${activity.color || 'text-emerald-400'}`}>
                {activity.icon === 'school' && <Users className="w-4 h-4" />}
                {activity.icon === 'check_circle' && <TrendingUp className="w-4 h-4" />}
                {activity.icon === 'manage_accounts' && <UserPlus className="w-4 h-4" />}
                {activity.icon === 'emoji_events' && <CreditCard className="w-4 h-4" />}
                {!activity.icon && <AlertTriangle className="w-4 h-4" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{activity.title}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{new Date(activity.timestamp).toLocaleString()}</p>
              </div>
            </div>
          )) : (
            <div className="p-8 text-center text-zinc-500 text-sm">
              Нет недавней активности
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
