import React, { useState, useEffect } from 'react';
import AdminHeader from '../../components/admin/AdminHeader.jsx';
import { Mail, Save, Loader2, Edit2, Trash2 } from 'lucide-react';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase.js';

export default function NewslettersAdmin() {
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [newsletters, setNewsletters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('create'); // 'create' | 'history'

  // Fetch newsletters
  useEffect(() => {
    const q = query(collection(db, 'newsletters'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const results = [];
      snapshot.forEach(doc => results.push({ id: doc.id, ...doc.data() }));
      setNewsletters(results);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching newsletters:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSaveDraft = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !content.trim()) {
      alert("Пожалуйста, заполните тему и текст рассылки.");
      return;
    }

    setIsSaving(true);
    try {
      await addDoc(collection(db, 'newsletters'), {
        subject: subject.trim(),
        content: content.trim(),
        status: 'draft', // draft, scheduled, sent
        createdAt: serverTimestamp(),
      });
      alert("Черновик рассылки успешно сохранен!");
      setSubject('');
      setContent('');
      setActiveTab('history');
    } catch (error) {
      console.error("Ошибка при сохранении рассылки:", error);
      alert("Не удалось сохранить рассылку. Проверьте консоль для деталей.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Вы уверены, что хотите удалить эту рассылку?")) {
      try {
        await deleteDoc(doc(db, 'newsletters', id));
      } catch (error) {
        console.error("Ошибка при удалении:", error);
      }
    }
  };

  return (
    <div>
      <AdminHeader 
        title="Управление рассылками" 
        description="Создавайте и планируйте email-рассылки для пользователей платформы." 
      />

      <div className="flex items-center gap-2 mb-6 bg-[#18181B] p-2 rounded-xl border border-white/5 inline-flex">
        <button 
          onClick={() => setActiveTab('create')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'create' ? 'bg-indigo-500 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
        >
          Создать рассылку
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'history' ? 'bg-indigo-500 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
        >
          История и черновики
        </button>
      </div>

      {activeTab === 'create' ? (
        <div className="bg-[#18181B] border border-white/5 rounded-2xl overflow-hidden max-w-4xl">
          <div className="p-6 border-b border-white/5">
            <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
              <Mail className="w-5 h-5 text-indigo-400" />
              Новая рассылка
            </h2>
            <p className="text-sm text-zinc-400">Напишите сообщение, которое будет отправлено подписанным пользователям. Система рассылки (SMTP) будет подключена позже.</p>
          </div>
          
          <form onSubmit={handleSaveDraft} className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Тема письма</label>
              <input 
                type="text" 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Например: Обновление платформы и новые ИИ-курсы!"
                className="w-full bg-[#09090B] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Текст рассылки (поддерживается HTML/Markdown в будущем)</label>
              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Здравствуйте! Мы рады сообщить..."
                rows="10"
                className="w-full bg-[#09090B] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors resize-y min-h-[200px]"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-4 pt-4 border-t border-white/5">
              <button 
                type="button" 
                className="px-6 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                onClick={() => { setSubject(''); setContent(''); }}
              >
                Очистить
              </button>
              <button 
                type="submit" 
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl text-sm font-medium bg-indigo-500 text-white hover:bg-indigo-600 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Сохранить черновик
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-[#18181B] border border-white/5 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Все рассылки</h2>
              <p className="text-sm text-zinc-400">Список ваших черновиков и отправленных сообщений.</p>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="bg-white/[0.02] text-zinc-300">
                <tr>
                  <th className="px-6 py-4 font-medium">Тема письма</th>
                  <th className="px-6 py-4 font-medium">Статус</th>
                  <th className="px-6 py-4 font-medium">Дата создания</th>
                  <th className="px-6 py-4 font-medium text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-zinc-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Загрузка рассылок...
                    </td>
                  </tr>
                ) : newsletters.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-zinc-500">
                      У вас пока нет сохраненных рассылок.
                    </td>
                  </tr>
                ) : (
                  newsletters.map((newsletter) => (
                    <tr key={newsletter.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-medium text-white">
                        {newsletter.subject}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {newsletter.status === 'draft' ? 'Черновик' : newsletter.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {newsletter.createdAt ? new Date(newsletter.createdAt.toDate()).toLocaleDateString('ru-RU', {
                          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        }) : 'Неизвестно'}
                      </td>
                      <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                        <button 
                          className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                          title="Редактировать (пока недоступно)"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(newsletter.id)}
                          className="p-2 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                          title="Удалить"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
