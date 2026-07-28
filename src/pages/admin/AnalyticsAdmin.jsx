import React, { useState } from 'react';
import AdminHeader from '../../components/admin/AdminHeader.jsx';
import DateRangePicker from '../../components/admin/ui/DateRangePicker.jsx';
import { ExternalLink, Activity, Eye, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

export default function AnalyticsAdmin() {
  const [dateRange, setDateRange] = useState(7);

  const gaConnected = !!import.meta.env.VITE_GA_MEASUREMENT_ID;
  const clarityConnected = !!import.meta.env.VITE_CLARITY_PROJECT_ID;
  const sentryConnected = !!import.meta.env.VITE_SENTRY_DSN;

  const StatusBadge = ({ connected }) => (
    <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
      connected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
    }`}>
      {connected ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
      {connected ? 'Подключено' : 'Ожидает настройки'}
    </div>
  );

  return (
    <div>
      <AdminHeader 
        title="Аналитика и Мониторинг" 
        description="Инсайты Google Analytics, Clarity и отслеживание ошибок в Sentry." 
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 mt-6">
        {/* Google Analytics Card */}
        <div className="bg-[#18181B] border border-white/5 rounded-2xl p-6 flex flex-col hover:border-indigo-500/30 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 mb-4">
              <Activity className="w-6 h-6" />
            </div>
            <StatusBadge connected={gaConnected} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Google Analytics</h3>
          <p className="text-zinc-400 text-sm mb-6 flex-1">
            Отслеживание посещаемости, источников трафика и конверсий пользователей.
          </p>
          <a 
            href="https://analytics.google.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white text-sm font-medium transition-colors"
          >
            Открыть дашборд GA4 <ExternalLink className="w-4 h-4" />
          </a>
        </div>
        
        {/* Microsoft Clarity Card */}
        <div className="bg-[#18181B] border border-white/5 rounded-2xl p-6 flex flex-col hover:border-indigo-500/30 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500 mb-4">
              <Eye className="w-6 h-6" />
            </div>
            <StatusBadge connected={clarityConnected} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Microsoft Clarity</h3>
          <p className="text-zinc-400 text-sm mb-6 flex-1">
            Тепловые карты кликов, записи сессий пользователей и анализ UX.
          </p>
          <a 
            href="https://clarity.microsoft.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white text-sm font-medium transition-colors"
          >
            Открыть дашборд Clarity <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Sentry Card */}
        <div className="bg-[#18181B] border border-white/5 rounded-2xl p-6 flex flex-col hover:border-indigo-500/30 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-500 mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <StatusBadge connected={sentryConnected} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Sentry Errors</h3>
          <p className="text-zinc-400 text-sm mb-6 flex-1">
            Мониторинг критических ошибок, багов фронтенда и производительности.
          </p>
          <a 
            href="https://sentry.io/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white text-sm font-medium transition-colors"
          >
            Открыть дашборд Sentry <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
      
      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6">
        <h4 className="text-indigo-400 font-semibold mb-2 flex items-center gap-2">
          <Activity className="w-5 h-5" /> Как настроить аналитику?
        </h4>
        <p className="text-indigo-200/70 text-sm leading-relaxed mb-4">
          Политика безопасности современных браузеров не позволяет встраивать полноценные дашборды аналитики (через iframe) прямо в админку. Поэтому мы используем прямые ссылки на официальные панели управления. 
        </p>
        <p className="text-indigo-200/70 text-sm leading-relaxed mb-0">
          Убедитесь, что ключи <code className="bg-black/20 px-1.5 py-0.5 rounded text-indigo-300">VITE_GA_MEASUREMENT_ID</code>, <code className="bg-black/20 px-1.5 py-0.5 rounded text-indigo-300">VITE_CLARITY_PROJECT_ID</code> и <code className="bg-black/20 px-1.5 py-0.5 rounded text-indigo-300">VITE_SENTRY_DSN</code> прописаны в настройках вашего GitHub репозитория в разделе <strong>Settings / Secrets and variables / Actions</strong>.
        </p>
      </div>
    </div>
  );
}
