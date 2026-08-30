import React, { useState, useEffect, useRef } from 'react';
import AdminHeader from '../../components/admin/AdminHeader.jsx';
import { 
  MessageSquare, 
  Search, 
  Filter,
  Bug,
  Lightbulb,
  HelpCircle,
  FileText,
  Clock,
  Send,
  User,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
  serverTimestamp,
  limit,
  writeBatch,
  where
} from 'firebase/firestore';
import { ref as storageRef, deleteObject } from 'firebase/storage';
import { db, storage } from '../../firebase.js';

const CATEGORIES = {
  bug: { label: 'Баг', icon: Bug, color: 'text-rose-400', bg: 'bg-rose-400/10' },
  idea: { label: 'Идея', icon: Lightbulb, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  question: { label: 'Вопрос', icon: HelpCircle, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  other: { label: 'Другое', icon: FileText, color: 'text-zinc-400', bg: 'bg-zinc-400/10' }
};

const STATUSES = {
  new: { label: 'Новое', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
  in_progress: { label: 'В работе', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' },
  waiting_user: { label: 'Ждет ответа', color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20' },
  closed: { label: 'Решено', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' }
};

export default function QuestionsAdmin() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTicket, setActiveTicket] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // all, new, in_progress, waiting_user, closed
  const [ticketLimit, setTicketLimit] = useState(50);
  const [hasMore, setHasMore] = useState(true);
  
  // Chat state
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [internalNote, setInternalNote] = useState('');
  const messagesEndRef = useRef(null);

  // Fetch tickets
  useEffect(() => {
    const q = query(
      collection(db, 'support_tickets'), 
      orderBy('createdAt', 'desc'),
      limit(ticketLimit)
    );
    
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = [];
      snap.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
      
      setTickets(data);
      setHasMore(data.length === ticketLimit);
      setLoading(false);

      // Update active ticket if it's open without depending on it
      setActiveTicket(prev => {
        if (!prev) return null;
        const updated = data.find(t => t.id === prev.id);
        return updated ? updated : prev;
      });
    });
    return () => unsubscribe();
  }, [ticketLimit]);

  // Fetch messages for active ticket
  useEffect(() => {
    if (!activeTicket) return;
    
    // Mark as read for admin
    if (activeTicket.unreadAdmin) {
      updateDoc(doc(db, 'support_tickets', activeTicket.id), { unreadAdmin: false });
    }

    const q = query(
      collection(db, 'support_tickets', activeTicket.id, 'messages'),
      orderBy('createdAt', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = [];
      snap.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
      setMessages(data);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return () => unsubscribe();
  }, [activeTicket?.id]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeTicket || isSending) return;

    setIsSending(true);
    const text = newMessage.trim();
    setNewMessage('');

    try {
      await addDoc(collection(db, 'support_tickets', activeTicket.id, 'messages'), {
        sender: 'admin',
        text: text,
        createdAt: serverTimestamp()
      });

      // Update ticket status to waiting_user and mark unread for user
      await updateDoc(doc(db, 'support_tickets', activeTicket.id), {
        status: activeTicket.status === 'new' ? 'waiting_user' : activeTicket.status,
        lastMessage: text,
        updatedAt: serverTimestamp(),
        unreadUser: true
      });
    } catch (error) {
      console.error("Ошибка при отправке:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!activeTicket) return;
    try {
      await updateDoc(doc(db, 'support_tickets', activeTicket.id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Ошибка обновления статуса:", error);
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    if (!ticketId) return;
    if (!window.confirm('Вы уверены, что хотите безвозвратно удалить этот тикет?')) return;
    try {
      const batch = writeBatch(db);
      const msgQ = query(collection(db, 'support_tickets', ticketId, 'messages'));
      const msgSnap = await getDocs(msgQ);

      for (const msgDoc of msgSnap.docs) {
        const msgData = msgDoc.data();
        if (msgData.attachmentUrl) {
          try {
            const fileRef = storageRef(storage, msgData.attachmentUrl);
            await deleteObject(fileRef);
          } catch (e) {
            console.error("Ошибка удаления вложения:", e);
          }
        }
        batch.delete(msgDoc.ref);
      }

      batch.delete(doc(db, 'support_tickets', ticketId));
      await batch.commit();

      if (activeTicket?.id === ticketId) {
        setActiveTicket(null);
      }
    } catch (error) {
      console.error("Ошибка при удалении тикета:", error);
      alert("Ошибка при удалении тикета: " + error.message);
    }
  };

  const handleSaveInternalNote = async () => {
    if (!activeTicket) return;
    try {
      await updateDoc(doc(db, 'support_tickets', activeTicket.id), {
        internalNotes: internalNote,
        updatedAt: serverTimestamp()
      });
      alert('Заметка сохранена');
    } catch (error) {
      console.error("Ошибка сохранения заметки:", error);
    }
  };

  useEffect(() => {
    if (activeTicket) setInternalNote(activeTicket.internalNotes || '');
  }, [activeTicket?.id]);

  const filteredTickets = tickets
    .filter(t => filterStatus === 'all' || t.status === filterStatus)
    .sort((a, b) => {
      const timeA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : (a.createdAt?.toMillis ? a.createdAt.toMillis() : 0);
      const timeB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : (b.createdAt?.toMillis ? b.createdAt.toMillis() : 0);
      return timeB - timeA;
    });

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      <AdminHeader title="Поддержка (Тикеты)" description="Обработка обращений пользователей, баг-репортов и вопросов." />
      
      <div className="flex-1 flex gap-6 min-h-0 overflow-hidden relative">
        {/* Left Sidebar: Ticket List */}
        <div className={`w-full md:w-1/3 bg-[#18181B] border border-white/5 rounded-2xl flex flex-col flex-shrink-0 ${activeTicket ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-white/5 space-y-4 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input 
                  type="text" 
                  placeholder="Поиск по теме или пользователю..."
                  className="w-full bg-[#09090B] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button 
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${filterStatus === 'all' ? 'bg-indigo-500 text-white' : 'bg-[#09090B] text-zinc-400 hover:text-white border border-white/5'}`}
              >
                Все
              </button>
              {Object.entries(STATUSES).map(([key, val]) => (
                <button 
                  key={key}
                  onClick={() => setFilterStatus(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${filterStatus === key ? `${val.bg} ${val.color} ${val.border}` : 'bg-[#09090B] text-zinc-400 hover:text-white border-white/5'}`}
                >
                  {val.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-zinc-500">Загрузка...</div>
            ) : filteredTickets.length === 0 ? (
              <div className="p-8 text-center text-zinc-500">Нет тикетов</div>
            ) : (
              <ul className="divide-y divide-white/5">
                {filteredTickets.map(ticket => {
                  const cat = CATEGORIES[ticket.category] || CATEGORIES.other;
                  const stat = STATUSES[ticket.status] || STATUSES.new;
                  const isActive = activeTicket?.id === ticket.id;

                  return (
                    <li 
                      key={ticket.id}
                      onClick={() => setActiveTicket(ticket)}
                      className={`p-4 cursor-pointer transition-colors border-l-2 ${isActive ? 'bg-white/[0.04] border-indigo-500' : 'border-transparent hover:bg-white/[0.02]'}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${cat.bg} ${cat.color}`}>
                            <cat.icon className="w-3 h-3" />
                            {cat.label}
                          </span>
                          {ticket.unreadAdmin && (
                            <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)] animate-pulse" />
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-500">
                          {ticket.updatedAt ? new Date(ticket.updatedAt.toDate()).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' }) : ''}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-white truncate mb-1">{ticket.subject}</h4>
                      <p className="text-xs text-zinc-400 truncate mb-3">{ticket.userName || ticket.userEmail}</p>
                      
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${stat.bg} ${stat.color} ${stat.border}`}>
                          {stat.label}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            
            {!loading && hasMore && filteredTickets.length > 0 && (
              <div className="p-4 flex justify-center border-t border-white/5">
                <button 
                  onClick={() => setTicketLimit(prev => prev + 50)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-xs text-white rounded-lg transition-colors border border-white/10 w-full"
                >
                  Загрузить еще
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Content: Ticket Details & Chat */}
        <div className={`w-full md:flex-1 bg-[#18181B] border border-white/5 rounded-2xl flex flex-col overflow-hidden ${!activeTicket ? 'hidden md:flex' : 'flex'}`}>
          {activeTicket ? (
            <>
              {/* Ticket Header */}
              <div className="p-4 sm:p-5 border-b border-white/5 flex-shrink-0 flex items-start justify-between bg-white/[0.01] gap-3">
                <div className="flex items-start gap-3">
                  <button 
                    onClick={() => setActiveTicket(null)}
                    className="p-1.5 -ml-1 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg md:hidden flex-shrink-0"
                    title="Назад к списку"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  </button>
                  <div>
                    <h2 className="text-base sm:text-xl font-bold text-white mb-1 line-clamp-1">{activeTicket.subject}</h2>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-zinc-400">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[120px] sm:max-w-none">{activeTicket.userName}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {activeTicket.createdAt ? new Date(activeTicket.createdAt.toDate()).toLocaleString('ru-RU') : ''}
                      </span>
                    </div>
                    {activeTicket.metadata?.userAgent && (
                      <div className="mt-2 text-[10px] text-zinc-500 font-mono flex gap-2">
                        <span className="px-1.5 py-0.5 bg-[#09090B] rounded border border-white/5">Browser: {activeTicket.metadata.userAgent.split(' ')[0]}</span>
                        {activeTicket.metadata.url && (
                          <a href={activeTicket.metadata.url} target="_blank" rel="noreferrer" className="px-1.5 py-0.5 bg-[#09090B] rounded border border-white/5 hover:text-indigo-400 transition-colors">
                            URL
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <select 
                    value={activeTicket.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border outline-none appearance-none cursor-pointer ${STATUSES[activeTicket.status]?.bg} ${STATUSES[activeTicket.status]?.color} ${STATUSES[activeTicket.status]?.border}`}
                  >
                    {Object.entries(STATUSES).map(([key, val]) => (
                      <option key={key} value={key} className="bg-[#09090B] text-white">{val.label}</option>
                    ))}
                  </select>
                  <button 
                    onClick={() => handleDeleteTicket(activeTicket.id)}
                    title="Удалить тикет"
                    className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-white/5 flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Chat & Notes Area */}
              <div className="flex-1 overflow-y-auto flex">
                <div className="flex-1 flex flex-col border-r border-white/5">
                  <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center text-zinc-500 text-sm mt-10">Загрузка сообщений...</div>
                    ) : (
                      messages.map(msg => {
                        const isAdmin = msg.sender === 'admin';
                        return (
                          <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                              isAdmin 
                                ? 'bg-indigo-500 text-white rounded-tr-sm' 
                                : 'bg-[#09090B] text-zinc-300 border border-white/5 rounded-tl-sm'
                            }`}>
                              <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                              
                              {msg.attachmentUrl && (
                                <div className="mt-3">
                                  <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer" className="block rounded-lg overflow-hidden border border-black/20 hover:opacity-90 transition-opacity">
                                    <img src={msg.attachmentUrl} alt="Вложение" className="max-w-full max-h-64 object-contain bg-black/20" />
                                  </a>
                                </div>
                              )}

                              <span className={`text-[10px] mt-2 block font-mono ${isAdmin ? 'text-white/60 text-right' : 'text-zinc-500'}`}>
                                {msg.createdAt ? new Date(msg.createdAt.toDate()).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-4 bg-[#09090B] border-t border-white/5">
                    <form onSubmit={handleSend} className="flex gap-2">
                      <input 
                        type="text" 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Ответить пользователю..."
                        className="flex-1 bg-[#18181B] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                      <button 
                        type="submit"
                        disabled={!newMessage.trim() || isSending}
                        className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl disabled:opacity-50 transition-colors flex items-center justify-center"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                </div>

                {/* Right Panel: Internal Notes */}
                <div className="w-64 bg-[#09090B] flex flex-col">
                  <div className="p-4 border-b border-white/5 text-sm font-semibold text-white flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    Заметки (только для админов)
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <textarea 
                      value={internalNote}
                      onChange={(e) => setInternalNote(e.target.value)}
                      placeholder="Оставьте заметку для других администраторов. Пользователь ее не увидит."
                      className="flex-1 w-full bg-[#18181B] border border-white/5 rounded-xl p-3 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors resize-none mb-3"
                    />
                    <button 
                      onClick={handleSaveInternalNote}
                      className="w-full py-2 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-medium rounded-xl transition-colors border border-white/5"
                    >
                      Сохранить заметку
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/5 flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-zinc-500" />
              </div>
              <h3 className="text-lg font-medium text-white mb-1">Выберите тикет</h3>
              <p className="text-sm text-zinc-500 max-w-sm">Выберите обращение из списка слева, чтобы начать переписку с пользователем.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
