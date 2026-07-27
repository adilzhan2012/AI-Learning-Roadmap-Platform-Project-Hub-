import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bug, 
  Lightbulb, 
  HelpCircle, 
  FileText, 
  Plus, 
  X, 
  Send, 
  Paperclip,
  ChevronLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  doc,
  updateDoc,
  limit,
  writeBatch,
  getDocs
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, auth } from '../firebase.js';

const CATEGORIES = [
  { id: 'bug', label: 'Баг', icon: Bug, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  { id: 'idea', label: 'Улучшение', icon: Lightbulb, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { id: 'question', label: 'Вопрос', icon: HelpCircle, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 'other', label: 'Другое', icon: FileText, color: 'text-zinc-400', bg: 'bg-zinc-500/10' }
];

const STATUS_LABELS = {
  new: { text: 'Новое', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  in_progress: { text: 'В работе', color: 'text-amber-400', bg: 'bg-amber-400/10' },
  waiting_user: { text: 'Ждет ответа', color: 'text-orange-400', bg: 'bg-orange-400/10' },
  closed: { text: 'Решено', color: 'text-emerald-400', bg: 'bg-emerald-400/10' }
};

export default function Support() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTicket, setActiveTicket] = useState(null);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;
    
    const q = query(
      collection(db, 'support_tickets'),
      where('userId', '==', auth.currentUser.uid),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const data = [];
      snap.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
      
      // Сортировка на клиенте (чтобы избежать ошибки индексов в Firestore)
      data.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      
      setTickets(data);
      setLoading(false);
      
      // Update active ticket if it's open without depending on it
      setActiveTicket(prev => {
        if (!prev) return null;
        const updated = data.find(t => t.id === prev.id);
        return updated ? updated : prev;
      });
    });

    return () => unsubscribe();
  }, []); // Пустой массив зависимостей предотвращает бесконечный цикл!

  // Фоновая очистка старых закрытых тикетов (старше 24 часов) на стороне клиента
  useEffect(() => {
    if (!auth.currentUser) return;
    const cleanupOldTickets = async () => {
      try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        // Получаем тикеты пользователя
        const q = query(
          collection(db, 'support_tickets'),
          where('userId', '==', auth.currentUser.uid)
        );
        
        const snap = await getDocs(q);
        
        for (const ticketDoc of snap.docs) {
          const data = ticketDoc.data();
          const updatedAt = data.updatedAt?.toMillis ? data.updatedAt.toMillis() : 0;
          
          // Если тикет закрыт и обновлялся больше 24 часов назад
          if (data.status === 'closed' && updatedAt > 0 && updatedAt < twentyFourHoursAgo.getTime()) {
            const batch = writeBatch(db);
            
            // Удаляем сообщения и вложения
            const msgQ = query(collection(db, 'support_tickets', ticketDoc.id, 'messages'));
            const msgSnap = await getDocs(msgQ);
            
            for (const msgDoc of msgSnap.docs) {
              const msgData = msgDoc.data();
              if (msgData.attachmentUrl) {
                try {
                  const fileRef = storageRef(storage, msgData.attachmentUrl);
                  await deleteObject(fileRef);
                } catch (e) {
                  // Игнорируем ошибку удаления файла (мог быть удален ранее)
                }
              }
              batch.delete(msgDoc.ref);
            }
            
            // Удаляем сам тикет
            batch.delete(ticketDoc.ref);
            await batch.commit();
          }
        }
      } catch (error) {
        console.error("Ошибка при фоновой очистке:", error);
      }
    };

    cleanupOldTickets();
  }, []);

  return (
    <div className="max-w-5xl mx-auto w-full flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-clash text-on-background tracking-tight">Поддержка</h1>
          <p className="text-sm text-on-surface-variant mt-1">Здесь вы можете задать вопрос, сообщить об ошибке или предложить идею.</p>
        </div>
        {!activeTicket && (
          <button 
            onClick={() => setShowNewTicketModal(true)}
            className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Новое обращение</span>
          </button>
        )}
      </div>

      <div className="flex-1 bg-surface-container border border-outline-variant rounded-2xl overflow-hidden flex shadow-sm relative">
        <AnimatePresence mode="wait">
          {activeTicket ? (
            <TicketChat 
              key="chat" 
              ticket={activeTicket} 
              onBack={() => setActiveTicket(null)} 
            />
          ) : (
            <TicketList 
              key="list" 
              tickets={tickets} 
              loading={loading} 
              onSelect={setActiveTicket} 
            />
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showNewTicketModal && (
          <NewTicketModal 
            onClose={() => setShowNewTicketModal(false)} 
            onCreated={(ticketId) => {
              setShowNewTicketModal(false);
              // Optimistically set active ticket to load the chat view immediately (it will update from snapshot)
              setActiveTicket({ id: ticketId, status: 'new' }); 
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function TicketList({ tickets, loading, onSelect }) {
  if (loading) {
    return (
      <div className="w-full flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center mb-4">
          <MessageSquare className="w-8 h-8 text-on-surface-variant/50" />
        </div>
        <h3 className="text-lg font-bold text-on-surface mb-1">Нет обращений</h3>
        <p className="text-sm text-on-surface-variant max-w-sm">Вы еще не создавали тикетов в службу поддержки. Если у вас возник вопрос или проблема — смело обращайтесь!</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-y-auto">
      <ul className="divide-y divide-outline-variant">
        {tickets.map(ticket => {
          const category = CATEGORIES.find(c => c.id === ticket.category) || CATEGORIES[3];
          const Icon = category.icon;
          const status = STATUS_LABELS[ticket.status] || STATUS_LABELS.new;

          return (
            <li 
              key={ticket.id} 
              onClick={() => onSelect(ticket)}
              className="p-4 sm:p-5 hover:bg-surface-container-high transition-colors cursor-pointer flex items-start gap-4 relative group"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${category.bg} ${category.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-1">
                  <h4 className="font-semibold text-on-surface text-base truncate">{ticket.subject}</h4>
                  <span className={`flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${status.bg} ${status.color}`}>
                    {status.text}
                  </span>
                </div>
                <p className="text-sm text-on-surface-variant line-clamp-1 mb-2">
                  {ticket.lastMessage || 'Нет сообщений'}
                </p>
                <div className="flex items-center justify-between text-xs text-on-surface-variant">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {ticket.updatedAt ? new Date(ticket.updatedAt.toDate()).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Только что'}
                  </div>
                  {ticket.unreadUser && (
                    <span className="flex items-center gap-1 text-primary font-medium">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      Новый ответ
                    </span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function TicketChat({ ticket, onBack }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Mark as read for user
    if (ticket.unreadUser) {
      updateDoc(doc(db, 'support_tickets', ticket.id), {
        unreadUser: false
      });
    }

    const q = query(
      collection(db, 'support_tickets', ticket.id, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const data = [];
      snap.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
      setMessages(data);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return () => unsubscribe();
  }, [ticket.id]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    const text = newMessage.trim();
    setNewMessage('');

    try {
      await addDoc(collection(db, 'support_tickets', ticket.id, 'messages'), {
        sender: 'user',
        text: text,
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, 'support_tickets', ticket.id), {
        lastMessage: text,
        updatedAt: serverTimestamp(),
        unreadAdmin: true
      });
    } catch (error) {
      console.error("Ошибка при отправке:", error);
    } finally {
      setIsSending(false);
    }
  };

  const status = STATUS_LABELS[ticket.status] || STATUS_LABELS.new;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="w-full flex flex-col h-full absolute inset-0 bg-surface-container"
    >
      {/* Chat Header */}
      <div className="h-16 flex items-center px-4 border-b border-outline-variant bg-surface-container-low flex-shrink-0">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 mr-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-on-surface truncate pr-4">{ticket.subject}</h3>
          <p className="text-xs text-on-surface-variant flex items-center gap-2">
            Тикет #{ticket.id.slice(0,6).toUpperCase()}
            <span className={`w-1.5 h-1.5 rounded-full ${status.bg.replace('/10', '')}`} />
            {status.text}
          </p>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-sm text-on-surface-variant my-8">
            Загрузка сообщений...
          </div>
        ) : (
          messages.map(msg => {
            const isUser = msg.sender === 'user';
            return (
              <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                  isUser 
                    ? 'bg-primary text-on-primary rounded-tr-sm' 
                    : 'bg-surface-container-highest text-on-surface rounded-tl-sm border border-outline-variant'
                }`}>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  
                  {msg.attachmentUrl && (
                    <div className="mt-3">
                      <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer" className="block rounded-lg overflow-hidden border border-black/10 hover:opacity-90 transition-opacity">
                        <img src={msg.attachmentUrl} alt="Вложение" className="max-w-full max-h-64 object-contain bg-black/20" />
                      </a>
                    </div>
                  )}

                  <span className={`text-[10px] mt-1 block font-mono ${isUser ? 'text-on-primary/70 text-right' : 'text-on-surface-variant'}`}>
                    {msg.createdAt ? new Date(msg.createdAt.toDate()).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '...'}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      {ticket.status !== 'closed' ? (
        <form onSubmit={handleSend} className="p-4 border-t border-outline-variant bg-surface-container-low flex gap-2 flex-shrink-0">
          <input 
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Напишите сообщение..."
            className="flex-1 bg-surface border border-outline-variant rounded-xl px-4 py-2 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
          />
          <button 
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center disabled:opacity-50 transition-colors hover:bg-primary/90"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      ) : (
        <div className="p-4 border-t border-outline-variant bg-surface-container-low text-center flex-shrink-0">
          <p className="text-sm text-emerald-500 font-medium flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Тикет закрыт. Если проблема актуальна, создайте новое обращение.
          </p>
        </div>
      )}
    </motion.div>
  );
}

function NewTicketModal({ onClose, onCreated }) {
  const [category, setCategory] = useState('question');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    
    setIsSubmitting(true);
    try {
      let attachmentUrl = null;
      
      // Upload file if exists and category is bug
      if (file && category === 'bug') {
        const fileRef = storageRef(storage, `support_attachments/${auth.currentUser.uid}_${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(fileRef, file);
        attachmentUrl = await getDownloadURL(snapshot.ref);
      }

      // 1. Create the ticket document
      const ticketRef = await addDoc(collection(db, 'support_tickets'), {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'Пользователь',
        userEmail: auth.currentUser.email,
        category: category,
        subject: subject.trim(),
        status: 'new', // new, in_progress, waiting_user, closed
        lastMessage: message.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        unreadAdmin: true,
        unreadUser: false,
        metadata: {
          userAgent: navigator.userAgent,
          url: window.location.href
        }
      });

      // 2. Create the first message in the subcollection
      await addDoc(collection(db, 'support_tickets', ticketRef.id, 'messages'), {
        sender: 'user',
        text: message.trim(),
        attachmentUrl: attachmentUrl,
        createdAt: serverTimestamp()
      });

      onCreated(ticketRef.id);
    } catch (error) {
      console.error("Error creating ticket:", error);
      alert("Не удалось создать обращение. Попробуйте позже.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-surface-container rounded-2xl shadow-2xl border border-outline-variant overflow-hidden flex flex-col max-h-full"
      >
        <div className="flex items-center justify-between p-5 border-b border-outline-variant bg-surface-container-low">
          <h2 className="text-lg font-bold text-on-surface">Создать обращение</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex-1 overflow-y-auto space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Категория</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(c => {
                const Icon = c.icon;
                const isSelected = category === c.id;
                return (
                  <div 
                    key={c.id} 
                    onClick={() => setCategory(c.id)}
                    className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-primary bg-primary/10 text-primary' 
                        : 'border-outline-variant bg-surface hover:border-outline text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{c.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Тема</label>
            <input 
              type="text" 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Кратко опишите суть"
              className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Описание</label>
            <textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Опишите подробно..."
              rows="4"
              className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors resize-none"
              required
            />
          </div>

          {category === 'bug' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Скриншот ошибки (опционально)</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 px-4 py-2 rounded-xl border border-outline-variant bg-surface text-on-surface-variant hover:text-on-surface hover:border-outline cursor-pointer transition-all text-sm font-medium">
                  <Paperclip className="w-4 h-4" />
                  <span>Выбрать файл</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => setFile(e.target.files[0])} 
                  />
                </label>
                {file && <span className="text-sm text-on-surface truncate flex-1">{file.name}</span>}
              </div>
              <p className="text-[10px] text-on-surface-variant flex items-start gap-1 mt-1">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                Мы автоматически прикрепим информацию о вашем браузере, чтобы быстрее найти проблему.
              </p>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full py-3.5 bg-primary text-on-primary rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                Отправка...
              </>
            ) : (
              'Отправить обращение'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
