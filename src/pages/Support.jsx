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
  MessageSquare,
  Star,
  Trash2
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
  deleteDoc,
  limit,
  writeBatch,
  getDocs
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, auth } from '../firebase.js';
import { t, useLocale } from '../i18n.js';
import ReviewModal from '../components/reviews/ReviewModal.jsx';

const getCategories = (locale) => [
  { id: 'bug', label: locale === 'en' ? 'Bug' : 'Баг', icon: Bug, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  { id: 'idea', label: locale === 'en' ? 'Improvement' : 'Улучшение', icon: Lightbulb, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { id: 'question', label: locale === 'en' ? 'Question' : 'Вопрос', icon: HelpCircle, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 'other', label: locale === 'en' ? 'Other' : 'Другое', icon: FileText, color: 'text-zinc-400', bg: 'bg-zinc-500/10' }
];

const getStatusLabels = (locale) => ({
  new: { text: locale === 'en' ? 'New' : 'Новое', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  in_progress: { text: locale === 'en' ? 'In Progress' : 'В работе', color: 'text-amber-400', bg: 'bg-amber-400/10' },
  waiting_user: { text: locale === 'en' ? 'Waiting Reply' : 'Ждет ответа', color: 'text-orange-400', bg: 'bg-orange-400/10' },
  closed: { text: locale === 'en' ? 'Resolved' : 'Решено', color: 'text-emerald-400', bg: 'bg-emerald-400/10' }
});

export default function Support() {
  const locale = useLocale();
  const [user, setUser] = useState(auth.currentUser);
  const [activeTab, setActiveTab] = useState('tickets'); // 'tickets' | 'reviews'
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTicket, setActiveTicket] = useState(null);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Listen to auth state
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubAuth();
  }, []);

  // Fetch support tickets
  useEffect(() => {
    if (!user) {
      setTickets([]);
      setLoading(false);
      return;
    }
    
    const q = query(
      collection(db, 'support_tickets'),
      where('userId', '==', user.uid),
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
  }, [user]);

  // Fetch user reviews
  useEffect(() => {
    if (!user) {
      setReviews([]);
      setReviewsLoading(false);
      return;
    }

    const q = query(
      collection(db, 'reviews'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const data = [];
      snap.forEach(docSnap => data.push({ id: docSnap.id, ...docSnap.data() }));

      data.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });

      setReviews(data);
      setReviewsLoading(false);
    }, (err) => {
      console.error("Error fetching user reviews:", err);
      setReviewsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="max-w-5xl mx-auto w-full flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-clash text-on-background tracking-tight">
            {t('support.title')}
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {t('support.subtitle')}
          </p>
        </div>

        {/* Action Button */}
        {activeTab === 'tickets' ? (
          !activeTicket && (
            <button 
              onClick={() => setShowNewTicketModal(true)}
              className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>
                {locale === 'en' ? 'New Ticket' : 'Новое обращение'}
              </span>
            </button>
          )
        ) : (
          <button 
            onClick={() => setShowReviewModal(true)}
            className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 self-start sm:self-auto"
          >
            <Star className="w-4 h-4 fill-current" />
            <span>
              {t('reviews.leaveReview')}
            </span>
          </button>
        )}
      </div>

      {/* Pill Segment Tab Control */}
      {!activeTicket && (
        <div className="mb-4">
          <div className="inline-flex items-center gap-1 p-1 bg-surface-container-high/60 border border-outline-variant/50 rounded-2xl shadow-inner">
            <button
              onClick={() => setActiveTab('tickets')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'tickets'
                  ? 'bg-surface text-on-surface shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>{t('support.tabs.tickets')}</span>
              {tickets.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-surface-container-highest text-on-surface-variant">
                  {tickets.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'reviews'
                  ? 'bg-surface text-on-surface shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Star className="w-4 h-4" />
              <span>{t('support.tabs.reviews')}</span>
              {reviews.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-surface-container-highest text-on-surface-variant">
                  {reviews.length}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 bg-surface-container border border-outline-variant rounded-2xl overflow-hidden flex shadow-sm relative">
        {activeTab === 'tickets' ? (
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
        ) : (
          <UserReviewsList
            reviews={reviews}
            loading={reviewsLoading}
            onOpenReviewModal={() => setShowReviewModal(true)}
          />
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showNewTicketModal && (
          <NewTicketModal 
            onClose={() => setShowNewTicketModal(false)} 
            onCreated={(ticketId) => {
              setShowNewTicketModal(false);
              setActiveTicket({ id: ticketId, status: 'new' }); 
            }}
          />
        )}
      </AnimatePresence>

      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onCreated={() => {
          setShowReviewModal(false);
        }}
      />
    </div>
  );
}

function UserReviewsList({ reviews, loading, onOpenReviewModal }) {
  const locale = useLocale();
  const [deletingId, setDeletingId] = useState(null);

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm(t('reviews.confirmDelete') || 'Вы уверены, что хотите удалить этот отзыв?')) {
      return;
    }
    setDeletingId(reviewId);
    try {
      await deleteDoc(doc(db, 'reviews', reviewId));
    } catch (err) {
      console.error("Error deleting review:", err);
      alert(locale === 'en' ? "Failed to delete review: " + err.message : "Не удалось удалить отзыв: " + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center p-12 my-auto">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-8 text-center my-auto">
        <div className="w-16 h-16 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center mb-4 text-on-surface-variant/50">
          <Star className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-on-surface mb-1">
          {t('reviews.noReviews')}
        </h3>
        <p className="text-sm text-on-surface-variant max-w-sm mb-6">
          {t('reviews.noReviewsDesc')}
        </p>
        <button
          onClick={onOpenReviewModal}
          className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
        >
          <Star className="w-4 h-4 fill-current" />
          <span>{t('reviews.leaveReview')}</span>
        </button>
      </div>
    );
  }

  const REVIEW_STATUS_LABELS = {
    new: { text: t('reviews.status.new'), color: 'text-amber-400', bg: 'bg-amber-400/10' },
    published: { text: t('reviews.status.published'), color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    hidden: { text: t('reviews.status.hidden'), color: 'text-zinc-400', bg: 'bg-zinc-400/10' }
  };

  return (
    <div className="w-full overflow-y-auto p-4 sm:p-6 space-y-4">
      {reviews.map(review => {
        const stat = REVIEW_STATUS_LABELS[review.status] || REVIEW_STATUS_LABELS.new;
        const isDeleting = deletingId === review.id;
        const canDelete = review.status !== 'new';

        return (
          <div 
            key={review.id}
            className="p-5 rounded-2xl bg-surface-container-high/40 border border-outline-variant hover:border-outline transition-all space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      s <= (review.rating || 5)
                        ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.3)]'
                        : 'text-on-surface-variant/20 fill-transparent'
                    }`}
                  />
                ))}
                <span className="text-xs font-bold text-on-surface ml-1.5">
                  {review.rating || 5} / 5
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${stat.bg} ${stat.color}`}>
                  {stat.text}
                </span>
                <span className="text-xs text-on-surface-variant flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {review.createdAt 
                    ? new Date(review.createdAt.toDate ? review.createdAt.toDate() : review.createdAt).toLocaleDateString(locale === 'en' ? 'en-US' : 'ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }) 
                    : (locale === 'en' ? 'Just now' : 'Только что')}
                </span>
                {canDelete && (
                  <button
                    onClick={() => handleDeleteReview(review.id)}
                    disabled={isDeleting}
                    className="p-1 rounded-lg text-on-surface-variant hover:text-red-500 hover:bg-red-500/10 transition-colors ml-1 disabled:opacity-50"
                    title={t('reviews.delete')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            <p className="text-sm text-on-surface whitespace-pre-wrap leading-relaxed">
              {review.text}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function TicketList({ tickets, loading, onSelect }) {
  const locale = useLocale();
  const CATEGORIES = getCategories(locale);
  const STATUS_LABELS = getStatusLabels(locale);

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
        <h3 className="text-lg font-bold text-on-surface mb-1">
          {locale === 'en' ? 'No Support Tickets' : 'Нет обращений'}
        </h3>
        <p className="text-sm text-on-surface-variant max-w-sm">
          {locale === 'en' 
            ? "You haven't submitted any support tickets yet. Feel free to reach out if you need assistance!"
            : 'Вы еще не создавали тикетов в службу поддержки. Если у вас возник вопрос или проблема — смело обращайтесь!'}
        </p>
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
                  {ticket.lastMessage || (locale === 'en' ? 'No messages' : 'Нет сообщений')}
                </p>
                <div className="flex items-center justify-between text-xs text-on-surface-variant">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {ticket.updatedAt ? new Date(ticket.updatedAt.toDate()).toLocaleDateString(locale === 'en' ? 'en-US' : 'ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : (locale === 'en' ? 'Just now' : 'Только что')}
                  </div>
                  {ticket.unreadUser && (
                    <span className="flex items-center gap-1 text-primary font-medium">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      {locale === 'en' ? 'New reply' : 'Новый ответ'}
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
  const locale = useLocale();
  const STATUS_LABELS = getStatusLabels(locale);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
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
            {locale === 'en' ? 'Ticket' : 'Тикет'} #{ticket.id.slice(0,6).toUpperCase()}
            <span className={`w-1.5 h-1.5 rounded-full ${status.bg.replace('/10', '')}`} />
            {status.text}
          </p>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-sm text-on-surface-variant my-8">
            {locale === 'en' ? 'Loading messages...' : 'Загрузка сообщений...'}
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
                        <img src={msg.attachmentUrl} alt="Attachment" className="max-w-full max-h-64 object-contain bg-black/20" />
                      </a>
                    </div>
                  )}

                  <span className={`text-[10px] mt-1 block font-mono ${isUser ? 'text-on-primary/70 text-right' : 'text-on-surface-variant'}`}>
                    {msg.createdAt ? new Date(msg.createdAt.toDate()).toLocaleTimeString(locale === 'en' ? 'en-US' : 'ru-RU', { hour: '2-digit', minute: '2-digit' }) : '...'}
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
            placeholder={locale === 'en' ? 'Type your message...' : 'Напишите сообщение...'}
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
            {locale === 'en' ? 'Ticket resolved. If you need more help, open a new ticket.' : 'Тикет закрыт. Если проблема актуальна, создайте новое обращение.'}
          </p>
        </div>
      )}
    </motion.div>
  );
}

function NewTicketModal({ onClose, onCreated }) {
  const locale = useLocale();
  const CATEGORIES = getCategories(locale);
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
      
      if (file && category === 'bug') {
        const fileRef = storageRef(storage, `support_attachments/${auth.currentUser.uid}_${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(fileRef, file);
        attachmentUrl = await getDownloadURL(snapshot.ref);
      }

      const ticketRef = await addDoc(collection(db, 'support_tickets'), {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || (locale === 'en' ? 'User' : 'Пользователь'),
        userEmail: auth.currentUser.email,
        category: category,
        subject: subject.trim(),
        status: 'new',
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

      await addDoc(collection(db, 'support_tickets', ticketRef.id, 'messages'), {
        sender: 'user',
        text: message.trim(),
        attachmentUrl: attachmentUrl,
        createdAt: serverTimestamp()
      });

      onCreated(ticketRef.id);
    } catch (error) {
      console.error("Error creating ticket:", error);
      alert(locale === 'en' ? "Failed to create support ticket. Please try again later." : "Не удалось создать обращение. Попробуйте позже.");
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
          <h2 className="text-lg font-bold text-on-surface">
            {locale === 'en' ? 'New Support Ticket' : 'Создать обращение'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex-1 overflow-y-auto space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              {locale === 'en' ? 'Category' : 'Категория'}
            </label>
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
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              {locale === 'en' ? 'Subject' : 'Тема'}
            </label>
            <input 
              type="text" 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={locale === 'en' ? 'Brief summary of the issue' : 'Кратко опишите суть'}
              className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              {locale === 'en' ? 'Description' : 'Описание'}
            </label>
            <textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={locale === 'en' ? 'Detailed description...' : 'Опишите подробно...'}
              rows="4"
              className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors resize-none"
              required
            />
          </div>

          {category === 'bug' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                {locale === 'en' ? 'Screenshot (optional)' : 'Скриншот ошибки (опционально)'}
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 px-4 py-2 rounded-xl border border-outline-variant bg-surface text-on-surface-variant hover:text-on-surface hover:border-outline cursor-pointer transition-all text-sm font-medium">
                  <Paperclip className="w-4 h-4" />
                  <span>{locale === 'en' ? 'Choose file' : 'Выбрать файл'}</span>
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
                {locale === 'en' 
                  ? 'Browser diagnostics will be automatically attached to help resolve the issue faster.'
                  : 'Мы автоматически прикрепим информацию о вашем браузере, чтобы быстрее найти проблему.'}
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
                {locale === 'en' ? 'Submitting...' : 'Отправка...'}
              </>
            ) : (
              locale === 'en' ? 'Submit Ticket' : 'Отправить обращение'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
