import React, { useState, useEffect } from 'react';
import { Search, Bell, Calendar, ChevronDown, UserCircle2, Menu, LogOut, ShieldAlert, FileText, Globe } from 'lucide-react';
import { auth, db } from '../../firebase.js';
import { signOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { useOutletContext, Link, useNavigate } from 'react-router-dom';
import MaintenanceModal from './MaintenanceModal.jsx';

export default function AdminHeader({ title, description, children }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [maintenance, setMaintenance] = useState(null);
  
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [adminName, setAdminName] = useState('Загрузка...');
  
  const context = useOutletContext();
  const toggleSidebar = context?.toggleSidebar;
  const isSidebarOpen = context?.isSidebarOpen;
  const navigate = useNavigate();

  // Listen for maintenance status
  useEffect(() => {
    const docRef = doc(db, 'settings', 'maintenance');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setMaintenance(docSnap.data());
      } else {
        setMaintenance(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Real-time admin notifications listener
  useEffect(() => {
    const q = query(
      collection(db, 'admin_notifications'), 
      orderBy('createdAt', 'desc'), 
      limit(20)
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      const notifs = [];
      snap.forEach(doc => {
        notifs.push({ id: doc.id, ...doc.data() });
      });
      setNotifications(notifs);
    }, (e) => {
      console.error('Error listening to admin notifications:', e);
    });
    return () => unsubscribe();
  }, []);

  // Cmd+K and ESC Shortcut Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.notifications-dropdown-container')) {
        setIsNotificationsOpen(false);
      }
      if (!e.target.closest('.profile-dropdown-container')) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Fetch admin name
  useEffect(() => {
    const fetchAdminProfile = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        setAdminName('Admin');
        return;
      }
      try {
        const docSnap = await getDoc(doc(db, 'users', uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setAdminName(`${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Admin');
        } else {
          setAdminName('Admin');
        }
      } catch (e) {
        console.error("Error fetching admin profile:", e);
        setAdminName('Admin');
      }
    };
    fetchAdminProfile();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-white/5">
        
        {/* Left: Title & Description */}
        <div className="flex items-start gap-3 sm:gap-4">
          {toggleSidebar && (
            <button 
              onClick={toggleSidebar}
              className="mt-0.5 p-2 bg-white/5 border border-white/10 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors lg:hidden"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">{title}</h1>
            {description && (
              <p className="text-zinc-400 text-xs sm:text-sm mt-0.5 sm:mt-1 line-clamp-2">{description}</p>
            )}
          </div>
        </div>

        {/* Right: Tools & Profile */}
        <div className="flex flex-wrap items-center gap-4">
          {children}

          {/* Search Stub */}
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 bg-[#09090B] border border-white/10 hover:border-white/20 text-zinc-400 px-3 py-2 rounded-lg text-sm transition-all shadow-sm"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Поиск...</span>
            <kbd className="hidden sm:inline-flex items-center gap-1 bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-[10px] font-mono text-zinc-500 ml-4">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>


          {/* Divider */}
          <div className="hidden sm:block w-px h-6 bg-white/10"></div>

          {/* Notifications */}
          <div className="relative notifications-dropdown-container">
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-[#0A0A0B] shadow-[0_0_8px_rgba(244,63,94,0.6)]"></span>
              )}
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl bg-[#09090B] border border-white/10 shadow-2xl z-50 overflow-hidden text-left flex flex-col max-h-96">
                <div className="p-3 border-b border-white/10 font-medium text-white flex items-center justify-between">
                  <span>Уведомления</span>
                </div>
                <div className="overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map(n => (
                      <div key={n.id} className="p-3 border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <p className="text-sm text-white mb-1">{n.title}</p>
                        <p className="text-xs text-zinc-400">{n.message}</p>
                        <span className="text-[10px] text-zinc-500 mt-2 block">{n.createdAt ? new Date(n.createdAt).toLocaleString() : 'Недавно'}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-zinc-500 text-sm">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      Нет новых уведомлений
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile & Maintenance */}
          <div className="relative profile-dropdown-container">
            <div 
              className="flex items-center gap-3 pl-2 group cursor-pointer" 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-sm font-medium text-white group-hover:text-indigo-400 transition-colors">{adminName}</span>
                <div className="flex items-center gap-1.5">
                  {maintenance?.isActive ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-pulse"></span>
                      <span className="text-xs text-amber-500">Тех. работы</span>
                    </>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></span>
                      <span className="text-xs text-zinc-500">Система работает</span>
                    </>
                  )}
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500/30 transition-colors">
                <UserCircle2 className="w-6 h-6" />
              </div>
            </div>

            {/* Profile Dropdown Menu */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#09090B] border border-white/10 shadow-2xl z-50 overflow-hidden text-left py-1">
                <Link 
                  to="/"
                  className="w-full px-4 py-2.5 text-sm hover:bg-white/5 transition-colors flex items-center gap-3 text-zinc-300"
                  onClick={() => setIsProfileOpen(false)}
                >
                  <Globe className="w-4 h-4 text-zinc-400" />
                  На публичный сайт
                </Link>
                <div className="h-px bg-white/10 my-1"></div>
                <Link 
                  to="/admin/policies"
                  className="w-full px-4 py-2.5 text-sm hover:bg-white/5 transition-colors flex items-center gap-3 text-zinc-300"
                  onClick={() => setIsProfileOpen(false)}
                >
                  <FileText className="w-4 h-4 text-indigo-400" />
                  Изменение политик
                </Link>
                <button 
                  onClick={() => { setIsMaintenanceModalOpen(true); setIsProfileOpen(false); }}
                  className="w-full px-4 py-2.5 text-sm hover:bg-white/5 transition-colors flex items-center gap-3 text-amber-500 text-left"
                >
                  <ShieldAlert className="w-4 h-4" />
                  Технические работы
                </button>
                <div className="h-px bg-white/10 my-1"></div>
                <button 
                  onClick={handleLogout}
                  className="w-full px-4 py-2.5 text-sm hover:bg-white/5 transition-colors flex items-center gap-3 text-rose-500 text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Выйти из аккаунта
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Modal Visual Stub */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-black/60 backdrop-blur-sm">
          <div 
            className="w-full max-w-xl bg-[#09090B] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="flex items-center px-4 py-3 border-b border-white/10">
              <Search className="w-5 h-5 text-zinc-400 mr-3" />
              <input 
                autoFocus
                type="text" 
                placeholder="Поиск пользователей, транзакций..." 
                className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-zinc-500 text-lg"
              />
              <button 
                onClick={() => setIsSearchOpen(false)}
                className="text-xs bg-white/10 hover:bg-white/20 text-zinc-300 px-2 py-1 rounded transition-colors"
              >
                ESC
              </button>
            </div>
            <div className="p-4 text-center text-sm text-zinc-500 py-12">
              Начните печатать для поиска по платформе.
            </div>
          </div>
        </div>
      )}

      {/* Maintenance Modal */}
      {isMaintenanceModalOpen && (
        <MaintenanceModal onClose={() => setIsMaintenanceModalOpen(false)} />
      )}
    </>
  );
}
