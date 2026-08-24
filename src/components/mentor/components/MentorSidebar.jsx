import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Lock, Edit2, Trash2 } from 'lucide-react';

export default function MentorSidebar({
  isOpen,
  onCloseMobile,
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateNewSession,
  onDeleteSession,
  onRenameSubmit,
  editingSessionId,
  setEditingSessionId,
  editingTitle,
  setEditingTitle,
  plan,
  locale,
  themeTokens,
  getCategoryTokens,
  onUpgrade,
}) {
  // Group sessions by relative date: Today, Yesterday, Previous 7 Days, Earlier
  const groupedSessions = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const startOfYesterday = startOfToday - oneDayMs;
    const startOf7DaysAgo = startOfToday - 7 * oneDayMs;

    const groups = {
      today: [],
      yesterday: [],
      last7Days: [],
      earlier: [],
    };

    sessions.forEach(session => {
      let timeMs = 0;
      if (session.createdAt?.toMillis) {
        timeMs = session.createdAt.toMillis();
      } else if (session.createdAt?.seconds) {
        timeMs = session.createdAt.seconds * 1000;
      } else if (session.createdAt) {
        timeMs = new Date(session.createdAt).getTime();
      } else {
        timeMs = parseInt(session.id, 10) || 0;
      }

      if (timeMs >= startOfToday) {
        groups.today.push(session);
      } else if (timeMs >= startOfYesterday) {
        groups.yesterday.push(session);
      } else if (timeMs >= startOf7DaysAgo) {
        groups.last7Days.push(session);
      } else {
        groups.earlier.push(session);
      }
    });

    return [
      { id: 'today', title: locale === 'en' ? 'Today' : 'Сегодня', items: groups.today },
      { id: 'yesterday', title: locale === 'en' ? 'Yesterday' : 'Вчера', items: groups.yesterday },
      { id: 'last7Days', title: locale === 'en' ? 'Previous 7 days' : 'Предыдущие 7 дней', items: groups.last7Days },
      { id: 'earlier', title: locale === 'en' ? 'Earlier' : 'Ранее', items: groups.earlier },
    ].filter(g => g.items.length > 0);
  }, [sessions, locale]);

  return (
    <>
      {/* Mobile Sidebar Backdrop Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-10 md:hidden backdrop-blur-xs"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <div 
        className={`
          absolute z-20 h-full flex flex-col shrink-0
          transition-all duration-300 ease-in-out overflow-hidden ${themeTokens.sidebarBg}
          ${isOpen ? 'translate-x-0 w-[240px] md:w-[220px] md:relative' : '-translate-x-full w-[240px] md:w-0 border-r-0 md:relative'}
        `}
      >
        {/* New Session Button */}
        <div className={`p-3 border-b ${themeTokens.subtleBorder} shrink-0`}>
          <button 
            type="button"
            onClick={onCreateNewSession}
            disabled={plan === 'FREE'}
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-150 ${themeTokens.newChatBtn}`}
          >
            <Plus className="w-4 h-4" />
            <span>{locale === 'en' ? 'New Chat' : 'Новый диалог'}</span>
          </button>
        </div>

        {/* Sessions List or FREE Lock State */}
        {plan === 'FREE' ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4 text-center text-zinc-500 gap-2 select-none">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-1">
              <Lock className="w-5 h-5 text-amber-500" />
            </div>
            <span className="text-xs leading-relaxed font-medium">
              {locale === 'en' 
                ? <>Chat history is available on <strong>PRO</strong> and <strong>ULTRA</strong></>
                : <>История диалогов доступна на тарифах <strong>PRO</strong> и <strong>ULTRA</strong></>}
            </span>
            <button 
              type="button"
              onClick={onUpgrade} 
              className="mt-2 text-xs bg-amber-500 hover:bg-amber-400 text-black px-3.5 py-1.5 rounded-lg font-bold transition-colors uppercase tracking-wider shadow-sm"
            >
              {locale === 'en' ? 'Upgrade to PRO' : 'Купить PRO'}
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-2 space-y-4 scrollbar-thin">
            {groupedSessions.map(group => (
              <div key={group.id} className="space-y-1">
                <div className="px-2.5 py-1 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider select-none">
                  {group.title}
                </div>

                {group.items.map(s => {
                  const isActive = activeSessionId === s.id;
                  const catTokens = getCategoryTokens(s.title);

                  return (
                    <div 
                      key={s.id}
                      onClick={() => onSelectSession(s.id)}
                      className={`group relative w-full px-2.5 py-2 rounded-xl flex items-center justify-between cursor-pointer transition-colors duration-150 border ${
                        isActive ? themeTokens.sessionActive : themeTokens.sessionInactive
                      }`}
                    >
                      {/* Active Session Indicator Highlight */}
                      {isActive && (
                        <motion.div
                          layoutId="activeSessionIndicator"
                          className="absolute inset-0 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-500/30 pointer-events-none"
                          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                        />
                      )}

                      <div className="flex items-center gap-2 min-w-0 flex-1 relative z-10">
                        {/* Theme Category Dot */}
                        <span className={`w-2 h-2 rounded-full shrink-0 ${catTokens.dot}`} />

                        {editingSessionId === s.id ? (
                          <input
                            autoFocus
                            value={editingTitle}
                            onChange={e => setEditingTitle(e.target.value)}
                            onBlur={() => onRenameSubmit(s.id)}
                            onKeyDown={e => { 
                              if (e.key === 'Enter') onRenameSubmit(s.id); 
                              if (e.key === 'Escape') setEditingSessionId(null); 
                            }}
                            onClick={e => e.stopPropagation()}
                            className="text-xs bg-transparent border-b border-indigo-500 outline-none text-inherit w-full font-medium"
                          />
                        ) : (
                          <span className="text-xs font-medium truncate">
                            {s.title || (locale === 'en' ? 'Dialogue' : 'Диалог')}
                          </span>
                        )}
                      </div>

                      {/* Edit / Delete Action Buttons */}
                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0 ml-1 relative z-10">
                        <button 
                          type="button"
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setEditingSessionId(s.id); 
                            setEditingTitle(s.title); 
                          }}
                          className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700/60 rounded text-zinc-400 hover:text-indigo-500"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          type="button"
                          onClick={(e) => onDeleteSession(e, s.id)}
                          className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700/60 rounded text-zinc-400 hover:text-rose-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
