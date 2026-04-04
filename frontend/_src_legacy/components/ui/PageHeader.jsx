/**
 * Consistent page header used across all list/section pages.
 * Normalises title size, colour, and subtitle style in one place.
 */
export const PageHeader = ({ title, description, action }) => (
  <div className="space-y-4">
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-4xl font-black tracking-tighter text-stone-900 dark:text-stone-50">
          {title}
        </h1>
        <div className="mt-2 h-1 w-12 bg-stone-900 dark:bg-stone-50" />
        {description && (
          <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
    <div className="h-px bg-stone-200 dark:bg-stone-800" />
  </div>
);
