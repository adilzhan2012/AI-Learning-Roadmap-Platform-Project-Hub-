import React, { useState } from 'react';
import AdminHeader from '../../components/admin/AdminHeader.jsx';
import { CreditCard, ArrowRightLeft, RefreshCcw } from 'lucide-react';
import DateRangePicker from '../../components/admin/ui/DateRangePicker.jsx';

export default function PaymentsAdmin() {
  const [dateRange, setDateRange] = useState(7);

  return (
    <div>
      <AdminHeader 
        title="Платежи и подписки" 
        description="Управление транзакциями Stripe, покупками и возвратами. (Скоро)" 
      >
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </AdminHeader>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#18181B] border border-white/5 p-6 rounded-2xl flex items-center gap-4 opacity-70">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <CreditCard className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-white font-medium">Дашборд Stripe</h3>
            <p className="text-zinc-500 text-sm">Ожидает интеграции</p>
          </div>
        </div>
        
        <div className="bg-[#18181B] border border-white/5 p-6 rounded-2xl flex items-center gap-4 opacity-70">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <ArrowRightLeft className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-white font-medium">Покупки</h3>
            <p className="text-zinc-500 text-sm">0 недавних транзакций</p>
          </div>
        </div>

        <div className="bg-[#18181B] border border-white/5 p-6 rounded-2xl flex items-center gap-4 opacity-70">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
            <RefreshCcw className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <h3 className="text-white font-medium">Возвраты (Refunds)</h3>
            <p className="text-zinc-500 text-sm">Требуется API Stripe</p>
          </div>
        </div>
      </div>

      <div className="bg-[#18181B] border border-white/5 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
        <CreditCard className="w-16 h-16 text-zinc-700 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Модуль платежей неактивен</h2>
        <p className="text-zinc-400 max-w-md">
          Инфраструктура платежей находится в стадии планирования. После подключения Stripe вы сможете управлять всеми транзакциями и подписками здесь.
        </p>
      </div>
    </div>
  );
}
