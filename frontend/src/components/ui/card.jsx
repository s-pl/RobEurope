import { cn } from '../../lib/utils';

const Card = ({ className, ...props }) => (
  <div
    className={cn('rounded-3xl border border-blue-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow dark:bg-slate-900 dark:border-slate-800', className)}
    {...props}
  />
);

const CardHeader = ({ className, ...props }) => (
  <div className={cn('mb-4 space-y-1', className)} {...props} />
);

const CardTitle = ({ className, ...props }) => (
  <h3 className={cn('text-xl font-semibold tracking-tight text-blue-900 dark:text-blue-100', className)} {...props} />
);

const CardDescription = ({ className, ...props }) => (
  <p className={cn('text-sm text-blue-600 dark:text-blue-400', className)} {...props} />
);

const CardContent = ({ className, ...props }) => (
  <div className={cn('', className)} {...props} />
);

const CardFooter = ({ className, ...props }) => (
  <div className={cn('mt-4 flex items-center', className)} {...props} />
);

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
