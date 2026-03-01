/**
 * Consistent page header used across all list/section pages.
 * Normalises title size, colour, and subtitle style in one place.
 */
export const PageHeader = ({ title, description, action }) => (
  <div className="space-y-4">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
    <div className="h-px bg-slate-200 dark:bg-slate-800" />
  </div>
);
