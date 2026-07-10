/**
 * Shared teacher-page header (icon + title + description + optional actions
 * on the right) replacing the near-identical header markup repeated across
 * QuestionStatsPage / LiveMonitorPage / AnalyticsPage / etc.
 */
export const PageHeader = ({ icon: Icon, title, description, actions }) => (
  <div className="flex flex-wrap items-start justify-between gap-3">
    <div>
      <h1 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
        {Icon && <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600 dark:text-indigo-400" />}
        {title}
      </h1>
      {description && (
        <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-slate-400">{description}</p>
      )}
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);
