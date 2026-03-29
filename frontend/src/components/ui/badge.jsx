import { cn } from '../../lib/utils';

const badgeVariants = {
  default:   'bg-stone-900 text-white dark:bg-stone-50 dark:text-stone-900',
  secondary: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300',
  accent:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  outline:   'border-2 border-stone-300 text-stone-700 dark:border-stone-600 dark:text-stone-300',
  success:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  emerald:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  amber:     'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  violet:    'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  cyan:      'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  orange:    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

const Badge = ({ className, variant = 'default', ...props }) => (
  <span
    className={cn(
      'inline-flex items-center px-2.5 py-0.5 text-xs font-semibold tracking-wide',
      badgeVariants[variant],
      className
    )}
    {...props}
  />
);

export { Badge };
