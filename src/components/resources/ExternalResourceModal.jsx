import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, PlayCircle, GitBranch, Sparkles, RefreshCw, Lock, Star, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ExternalResourceModal({ resource, externalData, loading, onClose, userPlan = 'FREE', onRefreshAlternative }) {
  const navigate = useNavigate();

  if (!resource) return null;

  const isVideo = resource.type === 'video';
  const candidates = externalData?.candidates || [];
  const isPersonalized = externalData?.isPersonalized || false;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-surface border border-outline w-full max-w-3xl max-h-[90vh] rounded-[24px] shadow-2xl flex flex-col overflow-hidden z-10"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-outline bg-surface shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 ${
              isVideo ? 'bg-red-500/10 text-red-400' : 'bg-purple-500/10 text-purple-400'
            }`}>
              {isVideo ? <PlayCircle className="w-5 h-5" /> : <GitBranch className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-on-surface-variant border border-[rgba(255,255,255,0.1)] px-2 py-0.5 rounded">
                  {isVideo ? 'ВИДЕО-ПОДБОРКА' : 'GITHUB РЕПОЗИТОРИЙ'}
                </span>
                {isPersonalized && (
                  <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> ИИ-АННОТАЦИИ
                  </span>
                )}
              </div>
              <h2 className="text-lg md:text-xl font-bold font-clash text-white mt-0.5">{resource.title}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {userPlan === 'ULTRA' && onRefreshAlternative && (
              <button 
                onClick={onRefreshAlternative}
                disabled={loading}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-high hover:bg-surface-variant text-white rounded-xl text-xs font-bold transition-all border border-outline"
                title="Подобрать другую подборку (ULTRA)"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Другие варианты
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-2 hover:bg-[rgba(255,255,255,0.05)] rounded-full text-on-surface-variant transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#09090B] custom-scrollbar">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-400 mb-3" />
              <p className="text-sm font-mono text-on-surface-variant">Подбираем лучшие материалы и формируем ИИ-аннотации...</p>
            </div>
          ) : (candidates.length === 0 || externalData?.fallbackToSearch) ? (
            <div className="py-16 text-center max-w-md mx-auto">
              <PlayCircle className="w-12 h-12 text-on-surface-variant mx-auto mb-3 opacity-30" />
              <h3 className="text-sm font-bold text-white mb-2">Автоматический поиск видео</h3>
              <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">
                В текущем окружении задействован честный режим поиска. Нажмите кнопку ниже для перехода к подборке уроков.
              </p>
              <a 
                href={externalData?.searchUrl || (isVideo 
                  ? `https://www.youtube.com/results?search_query=${encodeURIComponent(resource.tags?.[0] + ' ' + resource.title)}`
                  : `https://github.com/search?q=${encodeURIComponent(resource.title)}`)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-on-surface hover:bg-white text-inverse-on-surface rounded-xl font-bold text-xs shadow-md transition-all"
              >
                <ExternalLink className="w-4 h-4" /> Открыть поиск на {isVideo ? 'YouTube' : 'GitHub'}
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Banner for FREE user explaining PRO feature */}
              {userPlan === 'FREE' && (
                <div className="p-4 rounded-2xl bg-surface border border-outline flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Персональные ИИ-аннотации доступны в PRO</p>
                      <p className="text-[11px] text-on-surface-variant">Узнайте, почему именно этот видеоролик или код важен для вашего текущего прогресса.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { onClose(); navigate('/pricing'); }}
                    className="px-4 py-2 bg-on-surface text-inverse-on-surface rounded-xl text-xs font-bold shrink-0 hover:bg-white transition-colors"
                  >
                    Узнать о PRO
                  </button>
                </div>
              )}

              {/* Cards list */}
              {candidates.map((item, idx) => (
                <motion.div 
                  key={item.id || idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-surface border border-outline rounded-2xl p-5 hover:border-white/30 transition-all flex flex-col md:flex-row gap-5 items-start md:items-center justify-between group"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3 text-[10px] font-mono text-on-surface-variant">
                      <span className="text-white font-bold">{item.author}</span>
                      {item.metrics && (
                        <span className="flex items-center gap-1 text-amber-400/90">
                          {isVideo ? <Eye className="w-3 h-3" /> : <Star className="w-3 h-3" />}
                          {item.metrics}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors font-clash">
                      {item.title}
                    </h3>

                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {item.desc}
                    </p>

                    {/* AI Personalized Annotation */}
                    {item.aiAnnotation && (
                      <div className="mt-3 p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-200 flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-indigo-300">Почему это вам подходит: </span>
                          {item.aiAnnotation}
                        </div>
                      </div>
                    )}
                  </div>

                  <a 
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full md:w-auto px-5 py-2.5 bg-surface-container-high hover:bg-on-surface hover:text-inverse-on-surface text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 border border-outline shrink-0"
                  >
                    <span>{isVideo ? 'Смотреть' : 'Открыть код'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
