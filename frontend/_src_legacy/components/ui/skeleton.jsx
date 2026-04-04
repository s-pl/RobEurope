const Skeleton = ({ className = '', ...props }) => (
  <div
    className={`animate-pulse rounded-md bg-stone-200 dark:bg-stone-800 ${className}`}
    {...props}
  />
);

export { Skeleton };
