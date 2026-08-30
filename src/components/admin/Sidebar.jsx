import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  LineChart, 
  CreditCard, 
  Ticket, 
  MessageSquare, 
  AlertTriangle, 
  Terminal,
  LogOut,
  Sparkles,
  Mail,
  Star
} from 'lucide-react';
import { auth } from '../../firebase.js';
import { signOut } from 'firebase/auth';

export default function Sidebar({ onLogoClick, onNavigate }) {
  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'Analytics', path: '/admin/analytics', icon: LineChart },
    { name: 'Payments', path: '/admin/payments', icon: CreditCard },
    { name: 'Promocodes', path: '/admin/promocodes', icon: Ticket },
    { name: 'Поддержка (Тикеты)', path: '/admin/questions', icon: MessageSquare },
    { name: 'Отзывы', path: '/admin/reviews', icon: Star },
    { name: 'Newsletters', path: '/admin/newsletters', icon: Mail },
    { name: 'Errors (Sentry)', path: '/admin/errors', icon: AlertTriangle },
    { name: 'Logs', path: '/admin/logs', icon: Terminal },
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  return (
    <aside className="w-64 flex flex-col h-screen bg-[#09090b] border-r border-white/5 text-zinc-100 flex-shrink-0 shadow-2xl">
      <div className="h-20 flex items-center justify-between px-6 border-b border-white/5">
        <button 
          onClick={onLogoClick}
          className="flex items-center gap-3 group text-left"
          title="Toggle sidebar"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center relative overflow-hidden shadow-[0_0_15px_rgba(99,102,241,0.15)] group-hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-shadow">
            <Sparkles className="w-5 h-5 text-indigo-400 relative z-10" />
            <div className="absolute inset-0 bg-indigo-500/20 blur-xl"></div>
          </div>
          <div>
            <span className="block text-lg font-bold tracking-tight text-white leading-none">YourWay</span>
            <span className="block text-[10px] text-indigo-400 font-medium tracking-widest uppercase mt-1">Admin Panel</span>
          </div>
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => onNavigate && onNavigate()}
              className={({ isActive }) => 
                `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                    ? 'text-white bg-indigo-600/10 border border-indigo-500/20 shadow-[0_0_12px_rgba(99,102,241,0.15)]' 
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-indigo-500/10 text-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.2)] border border-indigo-500/20'
                      : 'text-zinc-500 group-hover:text-zinc-300'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {item.name}
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      <div className="p-4 border-t border-white/5">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-rose-400/80 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-inherit">
            <LogOut className="w-4 h-4" />
          </div>
          Sign out
        </button>
      </div>
    </aside>
  );
}
