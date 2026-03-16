import * as React from 'react';
import { cn } from '../../lib/utils';

const Label = React.forwardRef(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn('text-sm font-medium text-stone-700 dark:text-stone-300', className)}
    {...props}
  />
));
Label.displayName = 'Label';

export { Label };
