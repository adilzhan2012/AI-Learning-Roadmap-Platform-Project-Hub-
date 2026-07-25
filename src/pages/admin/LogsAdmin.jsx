import React, { useState, useEffect } from 'react';
import AdminHeader from '../../components/admin/AdminHeader.jsx';
import { Terminal } from 'lucide-react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase.js';

export default function LogsAdmin() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const q = query(collection(db, 'system_logs'), orderBy('timestamp', 'desc'), limit(50));
        const snap = await getDocs(q);
        const data = [];
        snap.forEach(doc => {
          data.push({ id: doc.id, ...doc.data() });
        });
        setLogs(data);
      } catch (e) {
        console.error("Error fetching logs:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  return (
    <div className="flex flex-col h-full">
      <AdminHeader 
        title="Системные логи" 
        description="Сырые логи сервера и аудит действий." 
      />
      
      <div className="flex-1 bg-[#09090B] border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-2xl font-mono text-sm relative">
        <div className="h-10 bg-[#18181B] border-b border-white/10 flex items-center px-4 gap-2">
          <Terminal className="w-4 h-4 text-zinc-500" />
          <span className="text-zinc-400 text-xs">server.log</span>
          <div className="ml-auto flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-rose-500/20 border border-rose-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50"></div>
          </div>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto">
          {loading ? (
            <div className="text-zinc-500 animate-pulse">Loading system logs...</div>
          ) : logs.length > 0 ? (
            <>
              {logs.map((log) => (
                <div key={log.id} className="flex gap-4 mb-1.5 hover:bg-white/[0.02] px-2 py-0.5 rounded">
                  <span className="text-zinc-600 shrink-0 w-20">{log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ''}</span>
                  <span className={`shrink-0 w-16 font-semibold ${
                    log.level === 'INFO' ? 'text-indigo-400' :
                    log.level === 'WARN' ? 'text-amber-400' :
                    'text-rose-400'
                  }`}>
                    [{log.level}]
                  </span>
                  <span className="text-zinc-300 break-all">{log.message}</span>
                </div>
              ))}
              <div className="flex gap-4 mt-4 px-2">
                <span className="text-zinc-500 shrink-0 w-20">Live</span>
                <span className="text-emerald-500 w-16 font-semibold animate-pulse">_</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500">
              <span className="text-emerald-500 font-semibold mb-2">Система работает штатно</span>
              <span>Логи пусты</span>
              <div className="flex gap-4 mt-4 px-2">
                <span className="text-zinc-500 shrink-0 w-20">Live</span>
                <span className="text-emerald-500 w-16 font-semibold animate-pulse">_</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
