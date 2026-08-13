import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Activity, Send, ChevronRight, ChevronLeft, Users, Sparkles } from 'lucide-react';
import { auth } from '../../firebase.js';

export default function GroupPanel({ 
  group, 
  messages = [], 
  onSendMessage, 
  isOpen, 
  onToggle 
}) {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'activity'
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  if (!group) return null;

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const membersList = Object.values(group.members || {});
  const activityList = group.activityFeed || [];

  return (
    <>
      {/* Floating Toggle Button when closed */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed right-4 bottom-20 z-40 px-4 py-3 rounded-2xl bg-surface-container border border-outline-variant text-on-surface shadow-2xl flex items-center gap-2 hover:bg-surface-container-high transition-all group font-sans"
        >
          <div className="flex -space-x-2">
            {membersList.slice(0, 3).map((m, idx) => (
              <div
                key={m.userId || idx}
                className="w-6 h-6 rounded-full border-2 border-surface flex items-center justify-center text-[9px] font-bold text-white shadow"
                style={{ backgroundColor: m.avatarColor || '#3b82f6' }}
              >
                {(m.displayName || m.username || 'U').charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
          <span className="text-xs font-bold text-on-surface">Чат группы</span>
          <ChevronLeft className="w-4 h-4 text-on-surface-variant group-hover:-translate-x-0.5 transition-transform" />
        </button>
      )}

      {/* Slide-out Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="fixed right-0 top-[70px] bottom-0 w-80 sm:w-96 bg-surface-container border-l border-outline-variant z-40 flex flex-col font-sans shadow-2xl"
          >
            {/* Panel Header */}
            <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
              <div className="flex items-center gap-2 min-w-0">
                <Users className="w-4 h-4 text-primary shrink-0" />
                <h3 className="font-bold text-on-surface text-sm truncate">
                  Группа: «{group.courseTitle}»
                </h3>
              </div>
              <button
                onClick={onToggle}
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-highest transition-colors"
                title="Свернуть"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Members summary bar */}
            <div className="px-4 py-2 bg-surface-container-high border-b border-outline-variant flex items-center justify-between">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                Участники ({membersList.length}):
              </span>
              <div className="flex -space-x-1.5">
                {membersList.map((m) => (
                  <div
                    key={m.userId}
                    className="w-5 h-5 rounded-full border border-surface flex items-center justify-center text-[8px] font-bold text-white"
                    style={{ backgroundColor: m.avatarColor || '#3b82f6' }}
                    title={m.displayName || m.username}
                  >
                    {(m.displayName || m.username || 'U').charAt(0).toUpperCase()}
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-outline-variant bg-surface-container-low">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${
                  activeTab === 'chat'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Чат ({messages.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${
                  activeTab === 'activity'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Активность ({activityList.length})</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activeTab === 'chat' && (
                <div className="space-y-3">
                  {messages.length === 0 ? (
                    <div className="text-center py-8 text-xs text-on-surface-variant font-medium">
                      Пока нет сообщений. Напишите первым! 👋
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isSelf = msg.senderId === auth.currentUser?.uid;
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
                        >
                          <span className="text-[10px] text-on-surface-variant/70 mb-0.5 px-1 font-mono">
                            {msg.senderName}
                          </span>
                          <div
                            className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed break-words shadow-sm ${
                              isSelf
                                ? 'bg-primary text-on-primary rounded-tr-none'
                                : 'bg-surface-container-high text-on-surface border border-outline-variant rounded-tl-none'
                            }`}
                          >
                            {msg.text}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="space-y-2.5">
                  {activityList.length === 0 ? (
                    <div className="text-center py-8 text-xs text-on-surface-variant font-medium">
                      Лента активности пока пуста.
                    </div>
                  ) : (
                    [...activityList].reverse().map((act) => (
                      <div
                        key={act.id}
                        className="p-3 rounded-xl bg-surface-container-high border border-outline-variant flex items-start gap-2.5"
                      >
                        <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-on-surface font-medium leading-snug">{act.text}</p>
                          <p className="text-[9px] text-on-surface-variant/70 mt-1 font-mono">
                            {act.timestamp ? new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Chat Input Footer */}
            {activeTab === 'chat' && (
              <form onSubmit={handleSend} className="p-3 border-t border-outline-variant bg-surface-container-low flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Сообщение для группы..."
                  className="flex-1 px-3.5 py-2.5 bg-surface-container-high border border-outline-variant rounded-xl text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="px-3.5 py-2.5 bg-primary hover:bg-primary/90 text-on-primary rounded-xl font-bold transition-all disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
