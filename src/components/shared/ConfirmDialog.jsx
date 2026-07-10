import { Trash2, Loader2 } from 'lucide-react';

/**
 * Shared confirm dialog replacing the near-identical implementations that
 * used to live in StudentManagementPage / QuestionsPage / ExamStructurePage.
 */
export const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel = 'Xoá',
  cancelLabel = 'Huỷ',
  onConfirm,
  onCancel,
  danger = true,
  loading = false,
}) => {
  if (!open) return null;
  const accent = danger
    ? { icon: 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400', btn: 'bg-red-600 hover:bg-red-700' }
    : { icon: 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400', btn: 'bg-indigo-600 hover:bg-indigo-700' };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
        <div className="flex items-start gap-3 mb-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${accent.icon}`}>
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-slate-100">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex items-center gap-2 px-5 py-2 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60 ${accent.btn}`}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {loading ? 'Đang xử lý...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
