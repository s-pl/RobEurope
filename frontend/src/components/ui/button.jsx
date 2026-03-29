import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '../../lib/utils';

const variants = {
  default:
    'inline-flex items-center justify-center bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-stone-900 dark:bg-stone-50 dark:text-stone-900 dark:hover:bg-stone-200 dark:focus-visible:ring-stone-50',
  accent:
    'inline-flex items-center justify-center bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-600 dark:bg-blue-500 dark:hover:bg-blue-600',
  outline:
    'inline-flex items-center justify-center border-2 border-stone-900 bg-transparent px-4 py-2 text-sm font-semibold text-stone-900 transition-colors hover:bg-stone-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-stone-900 dark:border-stone-50 dark:text-stone-50 dark:hover:bg-stone-50 dark:hover:text-stone-900',
  ghost:
    'inline-flex items-center justify-center rounded-lg bg-transparent px-4 py-2 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-stone-900 dark:text-stone-300 dark:hover:bg-stone-800',
  destructive:
    'inline-flex items-center justify-center bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-600 dark:bg-red-600 dark:hover:bg-red-700',
  link:
    'inline-flex items-center gap-1 text-sm font-semibold text-stone-900 underline-offset-4 hover:underline dark:text-stone-50',
};

const sizes = {
  default: 'h-10',
  sm: 'h-9 px-3 text-xs',
  lg: 'h-12 px-6 text-base',
  icon: 'h-10 w-10 p-0',
};

const Button = React.forwardRef(
  ({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
