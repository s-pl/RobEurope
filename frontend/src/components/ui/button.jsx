import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '../../lib/utils';

const buttonVariants = {
  default:
    'inline-flex items-center justify-center rounded-full border border-transparent bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-900',
  ghost:
    'inline-flex items-center justify-center rounded-full border border-slate-200 bg-transparent px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-900',
  link: 'inline-flex items-center gap-2 text-sm font-semibold text-slate-900 underline-offset-4 hover:underline'
};

const sizes = {
  default: 'h-10',
  sm: 'h-9 px-3',
  lg: 'h-12 px-6 text-base'
};

const Button = React.forwardRef(({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      className={cn(buttonVariants[variant], sizes[size], className)}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = 'Button';

export { Button };
