import * as React from 'react';

const alertVariants = {
  default: 'bg-slate-50 border-slate-200 text-slate-900 dark:bg-slate-900/40 dark:border-slate-700 dark:text-slate-100 [&>svg]:text-slate-600 dark:[&>svg]:text-slate-400',
  destructive: 'bg-red-50 border-red-200 text-red-900 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200 [&>svg]:text-red-600 dark:[&>svg]:text-red-400',
  success: 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-200 [&>svg]:text-emerald-600 dark:[&>svg]:text-emerald-400',
  warning: 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-200 [&>svg]:text-amber-600 dark:[&>svg]:text-amber-400',
};

const Alert = React.forwardRef(({ className = '', variant = 'default', ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={`relative w-full rounded-lg border px-4 py-3 text-sm [&>svg~*]:pl-7 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-3.5 [&>svg]:h-4 [&>svg]:w-4 ${alertVariants[variant] ?? alertVariants.default} ${className}`}
    {...props}
  />
));
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef(({ className = '', ...props }, ref) => (
  <h5
    ref={ref}
    className={`mb-1 font-semibold leading-none tracking-tight ${className}`}
    {...props}
  />
));
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef(({ className = '', ...props }, ref) => (
  <div
    ref={ref}
    className={`text-sm [&_p]:leading-relaxed ${className}`}
    {...props}
  />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };
