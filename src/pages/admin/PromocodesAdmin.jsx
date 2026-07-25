import React from 'react';
import AdminHeader from '../../components/admin/AdminHeader.jsx';
import { Plus, Ticket } from 'lucide-react';

export default function PromocodesAdmin() {
  return (
    <div>
      <AdminHeader 
        title="Промокоды" 
        description="Создание и управление скидочными кодами."
      >
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(79,70,229,0.3)]">
          <Plus className="w-4 h-4" />
          Новый промокод
        </button>
      </AdminHeader>
      
      <div className="bg-[#18181B] border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-white/5">
            <Ticket className="w-8 h-8 text-zinc-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Пока нет промокодов</h2>
          <p className="text-zinc-400 max-w-sm mb-6">
            Вы еще не создали ни одного скидочного кода. Нажмите кнопку выше, чтобы создать свой первый промокод.
          </p>
          <button className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-white/10">
            Узнать больше о промокодах
          </button>
        </div>
      </div>
    </div>
  );
}
