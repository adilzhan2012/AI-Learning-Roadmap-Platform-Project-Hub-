import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Activity, Send, ChevronRight, ChevronLeft, Users, Sparkles, AlertTriangle } from 'lucide-react';
import { auth, db } from '../../firebase.js';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export default function GroupPanel({ 
  group, 
  messages = [], 
  onSendMessage, 
  onRemoveMember,
  onDeleteGroup,
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
  const currentUser = auth.currentUser;
  const isCreator = group.creatorId === currentUser?.uid;

  const currentMember = currentUser ? group.members?.[currentUser.uid] : null;
  const hasAcceptedRules = currentMember?.rulesAccepted === true;
  const [acceptingRules, setAcceptingRules] = useState(false);

  const handleAcceptRules = async () => {
    if (!currentUser || !group) return;
    setAcceptingRules(true);
    try {
      const groupRef = doc(db, 'groups', group.id);
      await updateDoc(groupRef, {
        [`members.${currentUser.uid}.rulesAccepted`]: true,
        [`members.${currentUser.uid}.rulesAcceptedAt`]: serverTimestamp()
      });
    } catch (err) {
      console.error("Error accepting rules:", err);
    } finally {
      setAcceptingRules(false);
    }
  };

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
              <div className="flex items-center gap-1">
                {hasAcceptedRules && (
                  <button
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                    title="Сообщить о проблеме"
                    onClick={() => alert('Форма жалоб и отправки репортов будет доступна в следующем обновлении!')}
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={onToggle}
                  className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-highest transition-colors"
                  title="Свернуть"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {!hasAcceptedRules ? (
              <div className="flex-1 overflow-y-auto p-5 flex flex-col text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 text-primary">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-on-surface mb-4">🛡️ Кодекс общения в группе</h3>
                <div className="text-left text-xs text-on-surface-variant space-y-4 bg-surface-container-low p-4 rounded-xl border border-outline-variant flex-1 overflow-y-auto shadow-inner">
                  <p className="font-medium text-on-surface">Привет! Наша платформа — это безопасное и дружелюбное пространство для всех. Чтобы обучение было комфортным, соблюдай эти правила:</p>
                  
                  <div>
                    <strong className="text-on-surface block mb-1">1. Уважение и дружелюбие 🤝</strong>
                    Мы общаемся вежливо. Любые оскорбления, буллинг, агрессия и переход на личности строго запрещены.
                  </div>
                  <div>
                    <strong className="text-on-surface block mb-1">2. Чистая речь 🙊</strong>
                    В чате действует полный запрет на мат и нецензурную лексику (в том числе завуалированную).
                  </div>
                  <div>
                    <strong className="text-on-surface block mb-1">3. Никакого спама и рекламы 🚫</strong>
                    Запрещено отправлять рекламу, спам, подозрительные ссылки и любой неподобающий контент (18+ и т.д.).
                  </div>
                  <div>
                    <strong className="text-on-surface block mb-1">4. Безопасность и приватность 🔒</strong>
                    Не делись чужой личной информацией и не пересылай сообщения из группы посторонним.
                  </div>
                </div>
                
                <button
                  onClick={handleAcceptRules}
                  disabled={acceptingRules}
                  className="w-full mt-4 py-3 bg-primary hover:bg-primary/90 text-on-primary font-bold text-xs rounded-xl transition-all shadow flex items-center justify-center gap-2"
                >
                  {acceptingRules ? 'Сохраняем...' : 'Я принимаю правила'}
                </button>
              </div>
            ) : (
              <>
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
                <span>Активность</span>
              </button>
              {isCreator && (
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${
                    activeTab === 'settings'
                      ? 'border-red-500 text-red-500'
                      : 'border-transparent text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Управление</span>
                </button>
              )}
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

              {activeTab === 'settings' && isCreator && (
                <div className="space-y-4">
                  <div className="text-xs font-bold text-on-surface">Участники</div>
                  <div className="space-y-2">
                    {membersList.map((m) => {
                      const isSelf = m.userId === auth.currentUser?.uid;
                      return (
                        <div key={m.userId} className="flex items-center justify-between p-2 rounded-xl bg-surface-container-high border border-outline-variant">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                              style={{ backgroundColor: m.avatarColor || '#3b82f6' }}
                            >
                              {(m.displayName || m.username || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-on-surface">
                                {m.displayName || m.username} {isSelf && '(Вы)'}
                              </span>
                            </div>
                          </div>
                          {!isSelf && onRemoveMember && (
                            <button
                              onClick={() => onRemoveMember(m.userId)}
                              className="px-3 py-1.5 rounded-lg text-[10px] font-bold border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors"
                            >
                              Удалить
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {onDeleteGroup && (
                    <div className="pt-4 border-t border-outline-variant mt-4">
                      <button
                        onClick={onDeleteGroup}
                        className="w-full px-4 py-2.5 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white font-bold text-xs transition-all flex items-center justify-center gap-2"
                      >
                        Удалить группу полностью
                      </button>
                    </div>
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
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
