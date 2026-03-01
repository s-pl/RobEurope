import { useTranslation } from 'react-i18next';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardContent } from '../components/ui/card';
import { Star } from 'lucide-react';

const StarRating = ({ count = 5 }) => (
  <div className="flex gap-0.5" aria-label={`${count} stars`}>
    {[...Array(count)].map((_, i) => (
      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
    ))}
  </div>
);

const ReviewCard = ({ name, role, review, avatarSrc }) => (
  <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
    <CardContent className="pt-6 space-y-4">
      <div className="flex items-start gap-4">
        <img
          src={avatarSrc}
          alt={name}
          className="h-12 w-12 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800 shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-50">{name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{role}</p>
            </div>
            <StarRating />
          </div>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        {review}
      </p>
    </CardContent>
  </Card>
);

const Feedback = () => {
  const { t } = useTranslation();

  const AVATAR = 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=1480&q=80';

  return (
    <div className="space-y-8">
      <PageHeader title={t('feedback.Title')} description={t('feedback.Description')} />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <ReviewCard
          name="Samuelillo Ponce"
          role={t('feedback.roleSamuel')}
          review={t('feedback.reviewSamuel')}
          avatarSrc={AVATAR}
        />
        <ReviewCard
          name="Ángel Lallave"
          role={t('feedback.roleSamuel')}
          review={t('feedback.reviewAngel')}
          avatarSrc={AVATAR}
        />
      </div>
    </div>
  );
};

export default Feedback;
