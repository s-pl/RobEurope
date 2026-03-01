const Skeleton = ({ className = '', ...props }) => (
  <div
    className={`animate-pulse rounded-md bg-slate-200 dark:bg-slate-800 ${className}`}
    {...props}
  />
);

export { Skeleton };
