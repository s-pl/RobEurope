import * as React from 'react';
import { cn } from '../../lib/utils';

const Input = React.forwardRef(({ className, type = 'text', ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input };
