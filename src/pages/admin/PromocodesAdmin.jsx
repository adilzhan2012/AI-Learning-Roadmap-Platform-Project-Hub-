import React, { useState, useEffect } from 'react';
import AdminHeader from '../../components/admin/AdminHeader.jsx';
import { Plus, Ticket, Loader2, Trash2, Power, PowerOff, X } from 'lucide-react';
import { db } from '../../firebase.js';
import { collection, doc, setDoc, deleteDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

export default function PromocodesAdmin() {
  const [promocodes, setPromocodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [newCode, setNewCode] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newActive, setNewActive] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'promocodes'), (snapshot) => {
      const codes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPromocodes(codes);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleCreate = async () => {
    if (!newCode.trim()) {
      setError('Код не может быть пустым');
      return;
    }
    const codeId = newCode.trim().toUpperCase();
    if (promocodes.some(p => p.id === codeId)) {
      setError('Такой промокод уже существует');
      return;
    }

    setSaving(true);
    try {
      await setDoc(doc(db, 'promocodes', codeId), {
        description: newDescription.trim(),
        active: newActive,
        createdAt: serverTimestamp()
      });
      setIsModalOpen(false);
      setNewCode('');
      setNewDescription('');
      setNewActive(true);
      setError('');
    } catch (e) {
      setError('Ошибка при сохранении: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      await setDoc(doc(db, 'promocodes', id), { active: !currentStatus }, { merge: true });
    } catch (e) {
      alert('Ошибка: ' + e.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Вы уверены, что хотите безвозвратно удалить промокод ${id}?`)) return;
    try {
      await deleteDoc(doc(db, 'promocodes', id));
    } catch (e) {
      alert('Ошибка при удалении: ' + e.message);
    }
  };

  return (
    <div>
      <AdminHeader 
        title="Промокоды" 
        description="Создание и управление инвайт-кодами для бета-теста."
      >
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(79,70,229,0.3)]"
        >
          <Plus className="w-4 h-4" />
          Новый промокод
        </button>
      </AdminHeader>
      
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
        </div>
      ) : promocodes.length === 0 ? (
        <div className="bg-[#18181B] border border-white/5 rounded-2xl overflow-hidden">
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-white/5">
              <Ticket className="w-8 h-8 text-zinc-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Пока нет промокодов</h2>
            <p className="text-zinc-400 max-w-sm mb-6">
              Вы еще не создали ни одного скидочного кода. Нажмите кнопку выше, чтобы создать свой первый промокод.
            </p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-white/10"
            >
              Создать промокод
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-[#18181B] border border-white/5 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#27272A] text-zinc-400">
              <tr>
                <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">Промокод</th>
                <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">Описание</th>
                <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">Статус</th>
                <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {promocodes.map(promo => (
                <tr key={promo.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono text-white font-bold tracking-wider">{promo.id}</span>
                  </td>
                  <td className="px-6 py-4 text-zinc-400">
                    {promo.description || '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${promo.active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${promo.active ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                      {promo.active ? 'Активен' : 'Отключен'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleToggleActive(promo.id, promo.active)}
                        title={promo.active ? 'Отключить' : 'Включить'}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      >
                        {promo.active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={() => handleDelete(promo.id)}
                        title="Удалить"
                        className="p-2 text-red-400 hover:text-white hover:bg-red-500 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-[#18181B] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Новый промокод</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1 uppercase tracking-wider">Код (без пробелов)</label>
                <input 
                  type="text" 
                  value={newCode}
                  onChange={e => setNewCode(e.target.value.toUpperCase())}
                  placeholder="Код промокода"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white font-mono uppercase outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1 uppercase tracking-wider">Описание (опционально)</label>
                <input 
                  type="text" 
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="Описание"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer pt-2">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    checked={newActive} 
                    onChange={e => setNewActive(e.target.checked)}
                    className="sr-only" 
                  />
                  <div className={`block w-10 h-6 rounded-full transition-colors ${newActive ? 'bg-emerald-500' : 'bg-zinc-700'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${newActive ? 'translate-x-4' : ''}`}></div>
                </div>
                <span className="text-sm font-medium text-zinc-300">Активен сразу</span>
              </label>
            </div>

            <div className="mt-8 flex gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-white/5 hover:bg-white/10 text-white transition-colors"
              >
                Отмена
              </button>
              <button 
                onClick={handleCreate}
                disabled={saving}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Создать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
