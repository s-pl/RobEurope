import { cn } from '../../lib/utils';

const Card = ({ className, ...props }) => (
  <div
    className={cn('rounded-3xl border border-slate-200 bg-white p-6 shadow-sm', className)}
    {...props}
  />
);

const CardHeader = ({ className, ...props }) => (
  <div className={cn('mb-4 space-y-1', className)} {...props} />
);

const CardTitle = ({ className, ...props }) => (
  <h3 className={cn('text-xl font-semibold tracking-tight text-slate-900', className)} {...props} />
);

const CardDescription = ({ className, ...props }) => (
  <p className={cn('text-sm text-slate-500', className)} {...props} />
);

export { Card, CardDescription, CardHeader, CardTitle };
