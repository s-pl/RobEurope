/**
 * Consistent page header used across all list/section pages.
 * Normalises title size, colour, and subtitle style in one place.
 */
export const PageHeader = ({ title, description, action }) => (
  <div className="space-y-4">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 text-sm text-stone-500 dark:text-stone-400">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
    <div className="h-px bg-stone-200 dark:bg-stone-800" />
  </div>
);
