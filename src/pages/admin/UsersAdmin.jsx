import React, { useState, useEffect } from 'react';
import AdminHeader from '../../components/admin/AdminHeader.jsx';
import { Search, MoreVertical, ShieldBan, Crown, ShieldCheck, UserMinus, Loader2 } from 'lucide-react';
import { collection, getDocs, doc, updateDoc, query, limit, startAfter, orderBy } from 'firebase/firestore';
import { db } from '../../firebase.js';

export default function UsersAdmin() {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const USERS_PER_PAGE = 10;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const q = query(collection(db, 'users'), limit(USERS_PER_PAGE));
      const snap = await getDocs(q);
      const fetchedUsers = [];
      snap.forEach(docSnap => {
        fetchedUsers.push({ id: docSnap.id, ...docSnap.data() });
      });
      
      setUsers(fetchedUsers);
      
      if (snap.docs.length > 0) {
        setLastDoc(snap.docs[snap.docs.length - 1]);
      }
      if (snap.docs.length < USERS_PER_PAGE) {
        setHasMore(false);
      }
    } catch (e) {
      console.error("Error fetching users:", e);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);
    try {
      const q = query(collection(db, 'users'), startAfter(lastDoc), limit(USERS_PER_PAGE));
      const snap = await getDocs(q);
      const fetchedUsers = [];
      snap.forEach(docSnap => {
        fetchedUsers.push({ id: docSnap.id, ...docSnap.data() });
      });
      
      setUsers(prev => [...prev, ...fetchedUsers]);
      
      if (snap.docs.length > 0) {
        setLastDoc(snap.docs[snap.docs.length - 1]);
      }
      if (snap.docs.length < USERS_PER_PAGE) {
        setHasMore(false);
      }
    } catch (e) {
      console.error("Error fetching more users:", e);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSetTariff = async (userId, planName) => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      const isPremium = planName !== 'Базовый';
      await updateDoc(doc(db, 'users', userId), { 
        isPremium,
        subscriptionPlan: planName === 'Базовый' ? null : planName
      });
      setUsers(users.map(u => u.id === userId ? { 
        ...u, 
        isPremium, 
        subscriptionPlan: planName === 'Базовый' ? null : planName 
      } : u));
    } catch (e) {
      console.error("Error updating tariff:", e);
    } finally {
      setIsUpdating(false);
      setOpenDropdownId(null);
    }
  };

  const handleToggleBan = async (userId, currentBanned) => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, 'users', userId), { isBanned: !currentBanned });
      setUsers(users.map(u => u.id === userId ? { ...u, isBanned: !currentBanned } : u));
    } catch (e) {
      console.error("Error toggling ban:", e);
    } finally {
      setIsUpdating(false);
      setOpenDropdownId(null);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.dropdown-container')) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const filteredUsers = users.filter(u => {
    const term = searchTerm.toLowerCase();
    const name = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
    const email = (u.email || '').toLowerCase();
    const username = (u.username || '').toLowerCase();
    return name.includes(term) || email.includes(term) || username.includes(term) || u.id.toLowerCase().includes(term);
  });

  return (
    <div className="pb-24">
      <AdminHeader title="Управление пользователями" description="Поиск, блокировка, управление премиум статусом и история." />

      <div className="bg-[#18181B] border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Поиск по имени, email или ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0A0A0B] border border-white/10 text-white rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#27272A]/50 text-zinc-400">
              <tr>
                <th className="px-6 py-3 font-medium">Пользователь</th>
                <th className="px-6 py-3 font-medium">Статус</th>
                <th className="px-6 py-3 font-medium">Тариф</th>
                <th className="px-6 py-3 font-medium">Дата регистрации</th>
                <th className="px-6 py-3 font-medium text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-zinc-500">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-2" />
                    Загрузка пользователей...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-zinc-500">
                    Ничего не найдено
                  </td>
                </tr>
              ) : filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-white/[0.02] transition-colors relative">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-white font-medium">{user.firstName} {user.lastName} {user.username ? `(@${user.username})` : ''}</span>
                      <span className="text-zinc-500 text-xs">{user.email || 'Нет email'} • ID: <span className="font-mono">{user.id.substring(0,8)}...</span></span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {!user.isBanned ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                        Активен
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.15)]">
                        Забанен
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {user.isPremium ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-yellow-500/10 text-yellow-500 text-xs font-medium border border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.15)]">
                        <Crown className="w-3 h-3" />
                        {user.subscriptionPlan || 'Pro'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-white/5 text-zinc-400 text-xs font-medium border border-white/10">
                        Базовый
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-zinc-400">
                    {user.lastActiveDate ? new Date(user.lastActiveDate).toLocaleDateString() : 'Неизвестно'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="relative inline-block text-left dropdown-container">
                      <button 
                        onClick={() => setOpenDropdownId(openDropdownId === user.id ? null : user.id)}
                        className="text-zinc-500 hover:text-white transition-colors p-1"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {openDropdownId === user.id && (
                        <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#09090B] border border-white/10 shadow-2xl z-50 overflow-hidden text-left py-1">
                          {!user.isPremium ? (
                            <>
                              <button 
                                onClick={() => handleSetTariff(user.id, 'Pro')}
                                disabled={isUpdating}
                                className="w-full px-4 py-2 text-sm text-left hover:bg-white/5 transition-colors flex items-center gap-2 text-yellow-500 disabled:opacity-50"
                              >
                                <Crown className="w-4 h-4 text-yellow-500" />
                                Выдать Pro
                              </button>
                              <button 
                                onClick={() => handleSetTariff(user.id, 'Ultra')}
                                disabled={isUpdating}
                                className="w-full px-4 py-2 text-sm text-left hover:bg-white/5 transition-colors flex items-center gap-2 text-purple-400 disabled:opacity-50"
                              >
                                <Crown className="w-4 h-4 text-purple-400" />
                                Выдать Ultra
                              </button>
                            </>
                          ) : (
                            <button 
                              onClick={() => handleSetTariff(user.id, 'Базовый')}
                              disabled={isUpdating}
                              className="w-full px-4 py-2 text-sm text-left hover:bg-white/5 transition-colors flex items-center gap-2 text-zinc-400 disabled:opacity-50"
                            >
                              <UserMinus className="w-4 h-4 text-zinc-500" />
                              Забрать тариф
                            </button>
                          )}
                          
                          <div className="h-px bg-white/5 my-1"></div>
                          
                          <button 
                            onClick={() => handleToggleBan(user.id, user.isBanned)}
                            disabled={isUpdating}
                            className={`w-full px-4 py-2 text-sm text-left hover:bg-white/5 transition-colors flex items-center gap-2 disabled:opacity-50 ${user.isBanned ? 'text-emerald-400 hover:text-emerald-300' : 'text-rose-400 hover:text-rose-300'}`}
                          >
                            {user.isBanned ? (
                              <>
                                <ShieldCheck className="w-4 h-4" />
                                Разбанить пользователя
                              </>
                            ) : (
                              <>
                                <ShieldBan className="w-4 h-4" />
                                Забанить пользователя
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {hasMore && !searchTerm && (
          <div className="p-4 border-t border-white/5 text-center">
            <button 
              onClick={loadMore}
              disabled={loadingMore}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 inline-flex items-center gap-2"
            >
              {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
              {loadingMore ? 'Загрузка...' : 'Показать еще'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
