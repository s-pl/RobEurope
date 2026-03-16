import { useEffect, useState } from 'react';
import { Star, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import { Label } from '../components/ui/label';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import { resolveMediaUrl } from '../lib/apiClient';

const StarRating = ({ value, onChange, readonly = false, hoverValue = 0 }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(n => (
      <button
        key={n}
        type="button"
        disabled={readonly}
        onClick={() => !readonly && onChange?.(n)}
        className={`transition-transform duration-150 ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
      >
        <Star className={`h-5 w-5 transition-colors duration-150 ${
          n <= (hoverValue || value)
            ? 'fill-blue-600 text-blue-600'
            : 'text-stone-300 dark:text-stone-600'
        }`} />
      </button>
    ))}
  </div>
);

const ReviewItem = ({ review, onDelete, currentUserId }) => {
  const [hovered, setHovered] = useState(false);
  const name = review.author
    ? `${review.author.first_name ?? ''} ${review.author.last_name ?? ''}`.trim() || review.author.username
    : '?';
  const photo = review.author?.profile_photo_url ? resolveMediaUrl(review.author.profile_photo_url) : null;
  const isOwn = review.author?.id === currentUserId;

  return (
    <div
      className="flex gap-4 py-5 border-b border-stone-200 dark:border-stone-800 last:border-b-0 group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Author info - left */}
      <div className="flex flex-col items-center shrink-0 w-20">
        {photo ? (
          <img src={photo} alt={name} className="w-9 h-9 rounded-full object-cover" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-500 font-bold text-xs border border-stone-200 dark:border-stone-700">
            {name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <p className="text-xs font-medium text-stone-900 dark:text-stone-50 mt-1.5 text-center leading-tight">{name}</p>
        <p className="text-xs text-stone-400 mt-0.5">{new Date(review.created_at).toLocaleDateString()}</p>
      </div>

      {/* Content - right */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <StarRating value={review.rating} readonly />
          {isOwn && (
            <button
              onClick={() => onDelete()}
              className={`p-1.5 rounded-md text-stone-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-150 ${
                hovered ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">{review.message}</p>
      </div>
    </div>
  );
};

const Feedback = () => {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const api = useApi();

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState({ rating: 0, message: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [myReview, setMyReview] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    api('/contact/reviews').then(data => {
      const arr = Array.isArray(data) ? data : [];
      setReviews(arr);
      if (user) setMyReview(arr.find(r => r.author?.id === user.id) ?? null);
    }).catch(() => {}).finally(() => setReviewsLoading(false));
  }, [api, user]); // eslint-disable-line

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (reviewForm.rating === 0) { setReviewError(t('contact.reviews.ratingRequired')); return; }
    setReviewSubmitting(true);
    setReviewError('');
    try {
      const saved = await api('/contact/reviews', { method: 'POST', body: reviewForm });
      setReviews(prev => [saved, ...prev.filter(r => r.author?.id !== user.id)]);
      setMyReview(saved);
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 3000);
      setReviewForm({ rating: 0, message: '' });
    } catch (err) {
      setReviewError(err.message || t('contact.reviews.submitError'));
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    setDeleteLoading(true);
    try {
      await api('/contact/reviews/me', { method: 'DELETE' });
      setReviews(prev => prev.filter(r => r.author?.id !== user.id));
      setMyReview(null);
    } catch { /* handled */ }
    finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Page header */}
      <div className="pt-2 pb-8">
        <h1 className="font-display text-3xl font-bold text-stone-900 dark:text-stone-50">
          {t('feedback.Title')}
        </h1>
        <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">
          {t('feedback.Description')}
        </p>
      </div>

      {/* Inline review form at top */}
      {isAuthenticated && !myReview && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="pb-8 mb-8 border-b border-stone-200 dark:border-stone-800"
        >
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50 mb-4">
            {t('contact.reviews.writeTitle')}
          </h3>
          <form onSubmit={handleReviewSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-stone-700 dark:text-stone-300">{t('contact.reviews.ratingLabel')}</Label>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    type="button"
                    onMouseEnter={() => setHoverRating(n)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setReviewForm(f => ({ ...f, rating: n }))}
                    className="cursor-pointer transition-transform duration-150 hover:scale-110"
                  >
                    <Star className={`h-6 w-6 transition-colors duration-150 ${
                      n <= (hoverRating || reviewForm.rating)
                        ? 'fill-blue-600 text-blue-600'
                        : 'text-stone-300 dark:text-stone-600'
                    }`} />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reviewMsg" className="text-sm font-medium text-stone-700 dark:text-stone-300">{t('contact.reviews.messageLabel')}</Label>
              <textarea
                id="reviewMsg"
                rows={3}
                value={reviewForm.message}
                onChange={e => setReviewForm(f => ({ ...f, message: e.target.value }))}
                required
                placeholder={t('contact.reviews.messagePlaceholder')}
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-50 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors resize-none"
              />
            </div>
            {reviewError && <p className="text-sm text-red-500">{reviewError}</p>}
            <AnimatePresence>
              {reviewSuccess && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="text-sm text-emerald-600 dark:text-emerald-400">
                  {t('contact.reviews.submitted')}
                </motion.p>
              )}
            </AnimatePresence>
            <button
              type="submit"
              disabled={reviewSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Star className="h-4 w-4" /> {t('contact.reviews.submit')}
            </button>
          </form>
        </motion.div>
      )}

      {/* Already reviewed banner */}
      {myReview && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-3 px-4 py-3 mb-8 border-b border-stone-200 dark:border-stone-800 text-sm text-emerald-700 dark:text-emerald-400"
        >
          <Star className="h-4 w-4 fill-emerald-500 text-emerald-500 shrink-0" />
          <span className="flex-1">{t('contact.reviews.alreadyReviewed')}</span>
          <button onClick={() => setDeleteDialogOpen(true)} className="text-xs text-stone-400 hover:text-red-500 transition-colors">
            {t('contact.reviews.deleteReview')}
          </button>
        </motion.div>
      )}

      {/* Reviews list / timeline */}
      {reviewsLoading ? (
        <div className="space-y-0 divide-y divide-stone-200 dark:divide-stone-800">
          {[1, 2, 3].map(i => (
            <div key={i} className="py-5 flex gap-4">
              <div className="w-9 h-9 rounded-full bg-stone-100 dark:bg-stone-800 animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 bg-stone-100 dark:bg-stone-800 rounded animate-pulse" />
                <div className="h-3 w-full bg-stone-100 dark:bg-stone-800 rounded animate-pulse" />
                <div className="h-3 w-2/3 bg-stone-100 dark:bg-stone-800 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-center text-stone-400 py-16 text-sm">{t('contact.reviews.empty')}</p>
      ) : (
        <div>
          <AnimatePresence>
            {reviews.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
              >
                <ReviewItem review={r} onDelete={handleDeleteReview} currentUserId={user?.id} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={t('contact.reviews.deleteReview')}
        description={t('contact.reviews.confirmDelete')}
        confirmLabel={t('actions.delete')}
        cancelLabel={t('actions.cancel')}
        onConfirm={handleDeleteReview}
        loading={deleteLoading}
      />
    </div>
  );
};

export default Feedback;
