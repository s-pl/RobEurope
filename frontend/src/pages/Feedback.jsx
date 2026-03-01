import { useEffect, useState } from 'react';
import { Star, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { PageHeader } from '../components/ui/PageHeader';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import { resolveMediaUrl } from '../lib/apiClient';

const StarRating = ({ value, onChange, readonly = false }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map(n => (
      <button
        key={n}
        type="button"
        disabled={readonly}
        onClick={() => !readonly && onChange?.(n)}
        className={`transition-transform ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
      >
        <Star className={`h-5 w-5 transition-colors ${n <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
      </button>
    ))}
  </div>
);

const ReviewCard = ({ review, onDelete, currentUserId }) => {
  const name = review.author
    ? `${review.author.first_name ?? ''} ${review.author.last_name ?? ''}`.trim() || review.author.username
    : '?';
  const photo = review.author?.profile_photo_url ? resolveMediaUrl(review.author.profile_photo_url) : null;
  const isOwn = review.author?.id === currentUserId;
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3 h-full">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {photo
            ? <img src={photo} alt={name} className="w-9 h-9 rounded-full object-cover shrink-0" />
            : <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0">{name.slice(0, 2).toUpperCase()}</div>
          }
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{name}</p>
            <p className="text-xs text-slate-400">{new Date(review.created_at).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StarRating value={review.rating} readonly />
          {isOwn && (
            <button onClick={() => onDelete()} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{review.message}</p>
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
    <div className="space-y-8">
      <PageHeader title={t('feedback.Title')} description={t('feedback.Description')} />

      {isAuthenticated && !myReview && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">{t('contact.reviews.writeTitle')}</h3>
          <form onSubmit={handleReviewSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t('contact.reviews.ratingLabel')}</Label>
              <StarRating value={reviewForm.rating} onChange={r => setReviewForm(f => ({ ...f, rating: r }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reviewMsg">{t('contact.reviews.messageLabel')}</Label>
              <Textarea id="reviewMsg" rows={3} value={reviewForm.message} onChange={e => setReviewForm(f => ({ ...f, message: e.target.value }))} required placeholder={t('contact.reviews.messagePlaceholder')} />
            </div>
            {reviewError && <p className="text-sm text-red-500">{reviewError}</p>}
            <AnimatePresence>
              {reviewSuccess && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm text-emerald-600 dark:text-emerald-400">
                  {t('contact.reviews.submitted')}
                </motion.p>
              )}
            </AnimatePresence>
            <Button type="submit" size="sm" className="gap-2" disabled={reviewSubmitting}>
              <Star className="h-4 w-4" /> {t('contact.reviews.submit')}
            </Button>
          </form>
        </motion.div>
      )}

      {myReview && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-sm text-emerald-700 dark:text-emerald-400">
          <Star className="h-4 w-4 fill-emerald-500 text-emerald-500 shrink-0" />
          <span className="flex-1">{t('contact.reviews.alreadyReviewed')}</span>
          <button onClick={() => setDeleteDialogOpen(true)} className="text-xs underline opacity-70 hover:opacity-100">{t('contact.reviews.deleteReview')}</button>
        </motion.div>
      )}

      {reviewsLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <div key={i} className="h-36 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />)}
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-center text-slate-400 py-10">{t('contact.reviews.empty')}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {reviews.map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.05 }}>
                <ReviewCard review={r} onDelete={handleDeleteReview} currentUserId={user?.id} />
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

