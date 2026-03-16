import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Bot, Home, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const NotFound = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const title = t('notFound.title');
  const description = t('notFound.description');
  const subtitle = t('notFound.subtitle');
  const message = t('notFound.message');

  const fadeProps = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3, ease: 'easeOut' },
      };

  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-center px-4 py-12 text-center">
      {/* 404 */}
      <motion.h1
        {...fadeProps}
        className="font-display text-[8rem] sm:text-[10rem] font-black leading-none tracking-tighter text-stone-900 dark:text-stone-50"
        aria-label="404"
      >
        404
      </motion.h1>

      {/* Robot icon */}
      <motion.div
        {...(reduceMotion ? {} : { ...fadeProps, transition: { ...fadeProps.transition, delay: 0.05 } })}
        className="my-6 flex h-24 w-24 items-center justify-center rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900"
      >
        <Bot className="h-12 w-12 text-blue-600 dark:text-blue-500" />
      </motion.div>

      {/* Title */}
      {title && (
        <motion.h2
          {...(reduceMotion ? {} : { ...fadeProps, transition: { ...fadeProps.transition, delay: 0.1 } })}
          className="font-display text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-50 mb-1"
        >
          {title}
        </motion.h2>
      )}

      {/* Subtitle */}
      {subtitle && (
        <motion.h3
          {...(reduceMotion ? {} : { ...fadeProps, transition: { ...fadeProps.transition, delay: 0.12 } })}
          className="text-lg font-medium text-stone-700 dark:text-stone-300 mb-3"
        >
          {subtitle}
        </motion.h3>
      )}

      {/* Description */}
      <motion.p
        {...(reduceMotion ? {} : { ...fadeProps, transition: { ...fadeProps.transition, delay: 0.14 } })}
        className="text-base text-stone-500 dark:text-stone-400 mb-2 max-w-md leading-relaxed"
      >
        {description || message}
      </motion.p>

      {message && description && (
        <motion.p
          {...(reduceMotion ? {} : { ...fadeProps, transition: { ...fadeProps.transition, delay: 0.16 } })}
          className="text-sm text-stone-400 dark:text-stone-500 mb-8 max-w-md"
        >
          {message}
        </motion.p>
      )}

      {/* Buttons */}
      <motion.div
        {...(reduceMotion ? {} : { ...fadeProps, transition: { ...fadeProps.transition, delay: 0.18 } })}
        className="flex flex-wrap items-center justify-center gap-4 mt-4"
      >
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-6 py-3 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800"
        >
          <ArrowLeft size={18} />
          {t('notFound.goBack')}
        </button>

        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          <Home size={18} />
          {t('notFound.goHome') || t('notFound.backHome')}
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;
