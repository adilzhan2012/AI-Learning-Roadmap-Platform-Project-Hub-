import React, { useState } from 'react';
import AdminHeader from '../../components/admin/AdminHeader.jsx';
import DateRangePicker from '../../components/admin/ui/DateRangePicker.jsx';

export default function AnalyticsAdmin() {
  const [dateRange, setDateRange] = useState(7);

  return (
    <div>
      <AdminHeader 
        title="Аналитика" 
        description="Инсайты Google Analytics, Clarity и пользовательские графики." 
      >
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </AdminHeader>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-[#18181B] border border-white/5 rounded-2xl p-6 min-h-[400px] flex flex-col">
          <h3 className="text-lg font-medium text-white mb-4">Google Analytics (Обзор)</h3>
          <div className="flex-1 flex items-center justify-center border border-dashed border-white/10 rounded-xl bg-[#0A0A0B]">
            <p className="text-zinc-500 text-sm">Здесь будет интеграция GA</p>
          </div>
        </div>
        
        <div className="bg-[#18181B] border border-white/5 rounded-2xl p-6 min-h-[400px] flex flex-col">
          <h3 className="text-lg font-medium text-white mb-4">Microsoft Clarity (Тепловые карты)</h3>
          <div className="flex-1 flex items-center justify-center border border-dashed border-white/10 rounded-xl bg-[#0A0A0B]">
            <p className="text-zinc-500 text-sm">Здесь будет интеграция Clarity</p>
          </div>
        </div>
      </div>
    </div>
  );
}
