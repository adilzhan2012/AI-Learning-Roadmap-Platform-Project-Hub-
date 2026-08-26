import React, { useState, useEffect } from 'react';
import AdminHeader from '../../components/admin/AdminHeader.jsx';
import UserAvatar from '../../components/shared/UserAvatar.jsx';
import { 
  Star, 
  Search, 
  Trash2, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Clock, 
  User, 
  AlertCircle 
} from 'lucide-react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  limit 
} from 'firebase/firestore';
import { db } from '../../firebase.js';
import { t, useLocale } from '../../i18n.js';

const STATUSES = {
  new: { label: 'Новые', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' },
  published: { label: 'Опубликованные', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
  hidden: { label: 'Скрытые', color: 'text-zinc-400', bg: 'bg-zinc-400/10', border: 'border-zinc-400/20' }
};

export default function ReviewsAdmin() {
  const locale = useLocale();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all'); // all, new, published, hidden
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    const q = query(
      collection(db, 'reviews'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const data = [];
      snap.forEach(docSnap => data.push({ id: docSnap.id, ...docSnap.data() }));
      setReviews(data);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching reviews in admin:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handlePublish = async (reviewId) => {
    setActionLoadingId(reviewId);
    try {
      await updateDoc(doc(db, 'reviews', reviewId), {
        status: 'published',
        publishedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Error publishing review:", err);
      alert("Ошибка при публикации отзыва: " + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleHide = async (reviewId) => {
    setActionLoadingId(reviewId);
    try {
      await updateDoc(doc(db, 'reviews', reviewId), {
        status: 'hidden'
      });
    } catch (err) {
      console.error("Error hiding review:", err);
      alert("Ошибка при скрытии отзыва: " + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm(t('admin.reviews.confirmDelete') || 'Вы уверены, что хотите безвозвратно удалить этот отзыв?')) {
      return;
    }

    setActionLoadingId(reviewId);
    try {
      await deleteDoc(doc(db, 'reviews', reviewId));
    } catch (err) {
      console.error("Error deleting review:", err);
      alert("Ошибка при удалении отзыва: " + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredReviews = reviews
    .filter(r => {
      if (filterStatus !== 'all' && r.status !== filterStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = (r.userName || '').toLowerCase().includes(q);
        const textMatch = (r.text || '').toLowerCase().includes(q);
        return nameMatch || textMatch;
      }
      return true;
    });

  const counts = {
    all: reviews.length,
    new: reviews.filter(r => r.status === 'new').length,
    published: reviews.filter(r => r.status === 'published').length,
    hidden: reviews.filter(r => r.status === 'hidden').length
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      <AdminHeader 
        title={t('admin.reviews.title')} 
        description={t('admin.reviews.subtitle')} 
      />

      <div className="flex-1 bg-[#18181B] border border-white/5 rounded-2xl flex flex-col min-h-0 overflow-hidden shadow-xl">
        {/* Filters & Search Header */}
        <div className="p-4 sm:p-5 border-b border-white/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 flex-shrink-0 bg-white/[0.01]">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('admin.reviews.searchPlaceholder')}
              className="w-full bg-[#09090B] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-zinc-500"
            />
          </div>

          {/* Status filter tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                filterStatus === 'all' 
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                  : 'bg-[#09090B] text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              <span>{t('admin.reviews.filter.all')}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/30">
                {counts.all}
              </span>
            </button>
            {Object.entries(STATUSES).map(([key, val]) => (
              <button
                key={key}
                onClick={() => setFilterStatus(key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors border flex items-center gap-1.5 ${
                  filterStatus === key 
                    ? `${val.bg} ${val.color} ${val.border} shadow-sm` 
                    : 'bg-[#09090B] text-zinc-400 hover:text-white border-white/5'
                }`}
              >
                <span>{t(`admin.reviews.filter.${key}`)}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/30">
                  {counts[key]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {loading ? (
            <div className="p-12 text-center text-zinc-500 flex flex-col items-center justify-center gap-3">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">Загрузка отзывов...</span>
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400">
                <Star className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium">{t('admin.reviews.noReviews')}</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredReviews.map(review => {
                const stat = STATUSES[review.status] || STATUSES.new;
                const isActionLoading = actionLoadingId === review.id;

                return (
                  <div 
                    key={review.id}
                    className="p-5 rounded-2xl bg-[#09090B] border border-white/5 hover:border-white/10 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div>
                      {/* Author Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <UserAvatar
                            photoURL={review.photoURL}
                            firstName={review.userName}
                            avatarColor={review.userAvatarColor}
                            className="w-10 h-10 text-xs border border-white/10"
                          />
                          <div className="min-w-0">
                            <h4 className="font-semibold text-sm text-white truncate">
                              {review.userName || 'Пользователь'}
                            </h4>
                            <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {review.createdAt 
                                ? new Date(review.createdAt.toDate ? review.createdAt.toDate() : review.createdAt).toLocaleString(locale === 'en' ? 'en-US' : 'ru-RU')
                                : '...'}
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${stat.bg} ${stat.color} ${stat.border}`}>
                          {t(`reviews.status.${review.status}`)}
                        </span>
                      </div>

                      {/* Rating Stars */}
                      <div className="flex items-center gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-4 h-4 ${
                              s <= (review.rating || 5)
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-zinc-700 fill-transparent'
                            }`}
                          />
                        ))}
                        <span className="text-xs font-bold text-zinc-300 ml-1.5">
                          {review.rating || 5}/5
                        </span>
                      </div>

                      {/* Review Text */}
                      <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                        {review.text}
                      </p>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                      <div className="text-[10px] text-zinc-500 font-mono">
                        {review.publishedAt && (
                          <span>Опубликован: {new Date(review.publishedAt.toDate ? review.publishedAt.toDate() : review.publishedAt).toLocaleDateString('ru-RU')}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Publish / Hide Buttons */}
                        {review.status !== 'published' ? (
                          <button
                            onClick={() => handlePublish(review.id)}
                            disabled={isActionLoading}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors disabled:opacity-50"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{t('admin.reviews.publish')}</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleHide(review.id)}
                            disabled={isActionLoading}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-500/10 hover:bg-zinc-500/20 text-zinc-400 border border-zinc-500/30 text-xs font-semibold transition-colors disabled:opacity-50"
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>{t('admin.reviews.hide')}</span>
                          </button>
                        )}

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDelete(review.id)}
                          disabled={isActionLoading}
                          className="p-1.5 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                          title={t('admin.reviews.delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
