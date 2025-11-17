import { cn } from '../../lib/utils';

const Card = ({ className, ...props }) => (
  <div
    className={cn('rounded-3xl border border-blue-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow', className)}
    {...props}
  />
);

const CardHeader = ({ className, ...props }) => (
  <div className={cn('mb-4 space-y-1', className)} {...props} />
);

const CardTitle = ({ className, ...props }) => (
  <h3 className={cn('text-xl font-semibold tracking-tight text-blue-900', className)} {...props} />
);

const CardDescription = ({ className, ...props }) => (
  <p className={cn('text-sm text-blue-600', className)} {...props} />
);

export { Card, CardDescription, CardHeader, CardTitle };
