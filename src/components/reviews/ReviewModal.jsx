import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, X, AlertCircle, Sparkles } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, auth, functions } from '../../firebase.js';
import { t, useLocale } from '../../i18n.js';
import { getUserStats } from '../../services/courseService.js';

export default function ReviewModal({ isOpen, onClose, onCreated }) {
  const locale = useLocale();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingLimit, setIsCheckingLimit] = useState(true);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [monthlyCount, setMonthlyCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  // Check 30-day limit on modal open
  useEffect(() => {
    if (!isOpen || !auth.currentUser) return;

    let isMounted = true;
    const checkLimit = async () => {
      setIsCheckingLimit(true);
      try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const q = query(
          collection(db, 'reviews'),
          where('userId', '==', auth.currentUser.uid)
        );
        const snap = await getDocs(q);
        
        let count = 0;
        snap.forEach(docSnap => {
          const data = docSnap.data();
          const createdAt = data.createdAt?.toMillis 
            ? data.createdAt.toMillis() 
            : (data.createdAt?.seconds ? data.createdAt.seconds * 1000 : Date.now());
          if (createdAt >= thirtyDaysAgo.getTime()) {
            count++;
          }
        });

        if (isMounted) {
          setMonthlyCount(count);
          setIsLimitReached(count >= 5);
        }
      } catch (err) {
        console.error("Error checking review limit:", err);
      } finally {
        if (isMounted) {
          setIsCheckingLimit(false);
        }
      }
    };

    checkLimit();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isTextValid = text.trim().length >= 10;
  const isFormValid = rating >= 1 && rating <= 5 && isTextValid && !isLimitReached;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting || !auth.currentUser) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      let userName = auth.currentUser.displayName || (locale === 'en' ? 'Learner' : 'Ученик');
      let userAvatarColor = null;
      let photoURL = auth.currentUser.photoURL || null;

      try {
        const stats = await getUserStats(auth.currentUser.uid);
        const fullName = `${stats.firstName || ''} ${stats.lastName || ''}`.trim();
        if (fullName) userName = fullName;
        else if (stats.firstName) userName = stats.firstName;
        else if (stats.username) userName = stats.username;

        if (stats.avatarColor) userAvatarColor = stats.avatarColor;
        if (stats.photoURL) photoURL = stats.photoURL;
      } catch (err) {
        console.warn("Could not load user stats for review, using auth defaults:", err);
      }

      const submitReviewFn = httpsCallable(functions, 'submitReview');
      const res = await submitReviewFn({
        rating: Number(rating),
        text: text.trim(),
        userName,
        userAvatarColor,
        photoURL
      });

      setText('');
      setRating(5);

      if (onCreated && res.data?.reviewId) {
        onCreated(res.data.reviewId);
      }
      onClose();
    } catch (err) {
      console.error("Error submitting review:", err);
      if (err.message && err.message.includes('лимита')) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg(t('reviews.error') || 'Error submitting review');
      }
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
        className="w-full max-w-lg bg-surface-container rounded-2xl shadow-2xl border border-outline-variant overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-outline-variant bg-surface-container-low">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-on-surface leading-none">
                {t('reviews.modalTitle')}
              </h2>
              <p className="text-xs text-on-surface-variant mt-1">
                {t('reviews.modalSubtitle')}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {isCheckingLimit ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-on-surface-variant">{t('common.loading')}</span>
          </div>
        ) : isLimitReached ? (
          <div className="p-6 sm:p-8 flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-bold text-on-surface">
                {t('reviews.limitReached')}
              </h3>
              <p className="text-xs text-on-surface-variant max-w-sm leading-relaxed">
                {locale === 'en'
                  ? `You have already submitted ${monthlyCount} reviews in the past 30 days. Thank you for your active participation!`
                  : `Вы уже отправили ${monthlyCount} отзывов за последние 30 дней. Спасибо за вашу обратную связь!`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-sm font-medium rounded-xl border border-outline-variant transition-colors"
            >
              {t('common.close')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 flex-1 overflow-y-auto space-y-5">
            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-500 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Stars Rating Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">
                {t('reviews.ratingLabel')}
              </label>
              <div className="flex items-center gap-1.5 py-1">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = (hoverRating || rating) >= star;
                  return (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 rounded-lg transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      aria-label={`${star} star`}
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          isFilled
                            ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]'
                            : 'text-on-surface-variant/25 fill-transparent hover:text-amber-400/50'
                        }`}
                      />
                    </button>
                  );
                })}
                <span className="text-sm font-bold text-on-surface ml-3">
                  {hoverRating || rating} / 5
                </span>
              </div>
            </div>

            {/* Review Text */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  {t('reviews.textLabel')}
                </label>
                <span className={`text-[10px] font-mono ${text.trim().length >= 10 ? 'text-on-surface-variant' : 'text-amber-500 font-bold'}`}>
                  {text.trim().length} / {t('reviews.minCharsNotice')}
                </span>
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t('reviews.textPlaceholder')}
                rows="4"
                className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors resize-none placeholder:text-on-surface-variant/50"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="w-full py-3.5 bg-primary text-on-primary rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                  <span>{t('reviews.submitting')}</span>
                </>
              ) : (
                <span>{t('reviews.submit')}</span>
              )}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
