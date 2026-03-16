import { cn } from '../../lib/utils';

const badgeVariants = {
  default: 'bg-stone-900 text-white dark:bg-stone-50 dark:text-stone-900',
  secondary: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300',
  accent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  outline: 'border-2 border-stone-300 text-stone-700 dark:border-stone-600 dark:text-stone-300',
  success: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
};

const Badge = ({ className, variant = 'default', ...props }) => (
  <span
    className={cn(
      'inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold',
      badgeVariants[variant],
      className
    )}
    {...props}
  />
);

export { Badge };
