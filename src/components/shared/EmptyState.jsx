/**
 * Shared "no data" placeholder replacing the inline empty-state blocks
 * repeated across pages (icon + title + description, centered, py-16).
 */
export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center px-4">
    {Icon && <Icon className="w-10 h-10 text-gray-200 dark:text-slate-600 mb-3" />}
    {title && <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">{title}</p>}
    {description && (
      <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 max-w-sm">{description}</p>
    )}
    {action && <div className="mt-4">{action}</div>}
  </div>
);
