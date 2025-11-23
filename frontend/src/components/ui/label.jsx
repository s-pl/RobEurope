import * as React from 'react';
import { cn } from '../../lib/utils';

const Label = React.forwardRef(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn('text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400', className)}
    {...props}
  />
));
Label.displayName = 'Label';

export { Label };
