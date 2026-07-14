import React from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';
import { captureException } from '../../lib/sentry.js';

/**
 * Top-level crash guard. Without this, any render error in the tree (typo,
 * null deref, third-party lib throw) is a blank white screen with no recovery
 * path — worst case during a timed exam where a student would otherwise lose
 * their in-progress attempt with zero explanation.
 */
export class ErrorBoundary extends React.Component {
  state = { hasError: false, eventId: null };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled render error:', error, info);
    const eventId = captureException(error, { contexts: { react: { componentStack: info.componentStack } } });
    if (eventId) this.setState({ eventId });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
          <div className="max-w-sm w-full text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-red-500 dark:text-red-400" />
            </div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
              Đã có lỗi xảy ra
            </h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">
              Ứng dụng gặp lỗi không mong muốn. Vui lòng tải lại trang. Nếu bạn đang làm bài thi,
              tiến trình đã lưu sẽ được khôi phục khi tải lại.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
            >
              <RotateCw className="w-4 h-4" />
              Tải lại trang
            </button>
            {this.state.eventId && (
              <p className="mt-3 text-xs text-gray-400 dark:text-slate-500">
                Mã lỗi: {this.state.eventId}
              </p>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
