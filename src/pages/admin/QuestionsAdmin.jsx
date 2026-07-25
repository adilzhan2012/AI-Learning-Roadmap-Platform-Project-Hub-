import React, { useState, useEffect } from 'react';
import AdminHeader from '../../components/admin/AdminHeader.jsx';
import { MessageSquare, CheckCircle2 } from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase.js';

export default function QuestionsAdmin() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const q = query(collection(db, 'support_tickets'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const data = [];
        snap.forEach(doc => {
          data.push({ id: doc.id, ...doc.data() });
        });
        setQuestions(data);
      } catch (e) {
        console.error("Error fetching questions:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchQuestions();
  }, []);

  return (
    <div>
      <AdminHeader title="Вопросы пользователей" description="Управление заявками в поддержку и запросами." />
      
      <div className="bg-[#18181B] border border-white/5 rounded-2xl overflow-hidden">
        <ul className="divide-y divide-white/5">
          {loading ? (
            <div className="p-12 text-center text-zinc-500 text-sm flex flex-col items-center">
              <span className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></span>
              Загрузка вопросов...
            </div>
          ) : questions.length > 0 ? (
            questions.map(q => (
              <li key={q.id} className="p-4 hover:bg-white/[0.02] transition-colors flex items-start gap-4">
                <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${q.status === 'open' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.15)]' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.15)]'}`}>
                  {q.status === 'open' ? <MessageSquare className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-white">{q.user || 'Неизвестный'}</span>
                    <span className="text-xs text-zinc-500">{q.createdAt ? new Date(q.createdAt).toLocaleString() : ''}</span>
                  </div>
                  <p className="text-zinc-400 text-sm">{q.text}</p>
                </div>
              </li>
            ))
          ) : (
            <div className="p-16 text-center">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                <MessageSquare className="w-8 h-8 text-zinc-500" />
              </div>
              <h3 className="text-white font-medium text-lg mb-1">Вопросов нет</h3>
              <p className="text-zinc-500 text-sm">Пользователи еще не задавали вопросов в поддержку.</p>
            </div>
          )}
        </ul>
      </div>
    </div>
  );
}
