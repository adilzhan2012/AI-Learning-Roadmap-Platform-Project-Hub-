import React, { useState, useEffect } from 'react';
import AdminHeader from '../../components/admin/AdminHeader.jsx';
import { AlertTriangle, ServerCrash, AlertCircle, CheckCircle } from 'lucide-react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase.js';

export default function ErrorsAdmin() {
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchErrors() {
      try {
        const q = query(collection(db, 'system_errors'), orderBy('lastSeen', 'desc'), limit(50));
        const snap = await getDocs(q);
        const data = [];
        snap.forEach(doc => {
          data.push({ id: doc.id, ...doc.data() });
        });
        setErrors(data);
      } catch (e) {
        console.error("Error fetching system errors:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchErrors();
  }, []);

  return (
    <div>
      <AdminHeader 
        title="Системные ошибки" 
        description="Мониторинг исключений и системных сбоев в базе данных в реальном времени." 
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#18181B] border border-rose-500/20 p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <ServerCrash className="w-16 h-16 text-rose-500" />
          </div>
          <h3 className="text-rose-400/80 text-sm font-medium mb-1">Критические ошибки (24ч)</h3>
          <p className="text-3xl font-bold text-rose-400">{errors.filter(e => e.severity === 'critical').length}</p>
        </div>
        
        <div className="bg-[#18181B] border border-amber-500/20 p-5 rounded-2xl relative overflow-hidden">
          <h3 className="text-amber-400/80 text-sm font-medium mb-1">Предупреждения (24ч)</h3>
          <p className="text-3xl font-bold text-amber-400">{errors.filter(e => e.severity === 'warning').length}</p>
        </div>
        
        <div className="bg-[#18181B] border border-emerald-500/20 p-5 rounded-2xl relative overflow-hidden">
          <h3 className="text-emerald-400/80 text-sm font-medium mb-1">Статус системы</h3>
          <p className="text-xl font-bold text-emerald-400 mt-2">Стабильно</p>
          <p className="text-xs text-emerald-400/60 mt-1">99.9% аптайм</p>
        </div>
      </div>

      <div className="bg-[#18181B] border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h3 className="font-medium text-white">Недавние инциденты</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#27272A]/50 text-zinc-400">
              <tr>
                <th className="px-6 py-3 font-medium">Тип</th>
                <th className="px-6 py-3 font-medium">Сообщение</th>
                <th className="px-6 py-3 font-medium">Событий</th>
                <th className="px-6 py-3 font-medium text-right">Последний раз</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-zinc-500">
                    <span className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin inline-block mb-2"></span>
                    <br/>Загрузка инцидентов...
                  </td>
                </tr>
              ) : errors.length > 0 ? (
                errors.map((error) => (
                  <tr key={error.id} className="hover:bg-white/[0.02] transition-colors cursor-pointer">
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-400 text-xs font-medium border border-rose-500/20">
                        <AlertTriangle className="w-3 h-3" />
                        {error.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white font-medium mb-0.5">{error.message}</p>
                      <p className="text-zinc-500 text-xs font-mono">{error.route}</p>
                    </td>
                    <td className="px-6 py-4 text-zinc-400">
                      <span className="bg-white/5 px-2 py-1 rounded text-xs">{error.count || 1}</span>
                    </td>
                    <td className="px-6 py-4 text-right text-zinc-500">
                      {error.lastSeen ? new Date(error.lastSeen).toLocaleString() : ''}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-16 text-center">
                    <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h3 className="text-white font-medium text-lg mb-1">Ошибок нет</h3>
                    <p className="text-zinc-500 text-sm">Система работает стабильно, инцидентов не зафиксировано.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
