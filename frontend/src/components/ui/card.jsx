import { createElement } from 'react';
import { cn } from '../../lib/utils';

const Card = ({ className, ...props }) => (
  <div
    className={cn(
      'border-2 border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900 transition-colors duration-100 hover:border-stone-900 dark:hover:border-stone-50',
      className
    )}
    {...props}
  />
);

const CardHeader = ({ className, ...props }) => (
  <div className={cn('mb-4 space-y-1', className)} {...props} />
);

const CardTitle = ({ className, as: Component = 'h3', ...props }) =>
  createElement(Component, {
    className: cn('font-display text-xl font-semibold tracking-tight text-stone-900 dark:text-stone-50', className),
    ...props,
  });

const CardDescription = ({ className, ...props }) => (
  <p className={cn('text-sm text-stone-500 dark:text-stone-400', className)} {...props} />
);

const CardContent = ({ className, ...props }) => (
  <div className={cn('', className)} {...props} />
);

const CardFooter = ({ className, ...props }) => (
  <div className={cn('mt-4 flex items-center', className)} {...props} />
);

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
