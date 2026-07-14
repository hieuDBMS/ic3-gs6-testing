/**
 * Shared animate-pulse placeholder replacing the ad-hoc skeleton blocks
 * repeated in DashboardPage / StudentOverviewTable / AttemptHistoryTable /
 * ResultPage.
 *
 * variant:
 *  - 'card'      → bare rounded block(s); pass full sizing/color via
 *                  `className` (caller supplies its own wrapping layout —
 *                  grid, space-y, etc.)
 *  - 'table-row' → avatar circle + two lines + trailing column, divided list
 *  - 'text'      → one or more text lines, stacked
 *  - 'circle'    → circular avatar placeholder
 */
export const Skeleton = ({ variant = 'text', count = 1, className = '' }) => {
  if (variant === 'card') {
    return (
      <>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={`animate-pulse rounded-2xl ${className || 'h-20 bg-gray-100 dark:bg-slate-700'}`} />
        ))}
      </>
    );
  }

  if (variant === 'table-row') {
    return (
      <div className="divide-y divide-gray-100 dark:divide-slate-700 animate-pulse">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <div className="w-11 h-11 rounded-2xl bg-gray-200 dark:bg-slate-700 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded-sm w-1/3" />
              <div className="h-3 bg-gray-100 dark:bg-slate-700 rounded-sm w-1/2" />
            </div>
            <div className="w-24 h-3 bg-gray-100 dark:bg-slate-700 rounded-sm" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'circle') {
    return <div className={`animate-pulse rounded-full bg-gray-200 dark:bg-slate-700 ${className || 'w-11 h-11'}`} />;
  }

  return (
    <div className="animate-pulse space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`h-3 bg-gray-100 dark:bg-slate-700 rounded-sm ${className || 'w-full'}`} />
      ))}
    </div>
  );
};
