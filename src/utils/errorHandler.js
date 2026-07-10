/**
 * Centralized error message resolver.
 * Maps Supabase/Postgres error codes to Vietnamese user-friendly messages.
 * Use this everywhere instead of inline `err.message || 'Đã có lỗi xảy ra'`.
 *
 * Usage:
 *   import { getErrorMessage } from '../utils/errorHandler';
 *   catch (err) { showToast(getErrorMessage(err), 'error'); }
 */

/** @param {unknown} error - any thrown value (Error, Supabase error obj, string...) */
export const getErrorMessage = (error) => {
  if (!error) return 'Đã có lỗi xảy ra';

  // Supabase PostgREST error codes
  const code = error?.code ?? error?.error?.code;
  if (code) {
    switch (code) {
      case 'PGRST116': return 'Không tìm thấy dữ liệu';
      case '23505':    return 'Dữ liệu đã tồn tại (trùng lặp)';
      case '23503':    return 'Không thể xoá — dữ liệu đang được tham chiếu';
      case '23502':    return 'Thiếu thông tin bắt buộc';
      case '42501':    return 'Bạn không có quyền thực hiện thao tác này';
      case 'PGRST301': return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại';
      default: break;
    }
  }

  // Auth errors
  const msg = (error?.message ?? String(error ?? '')).toLowerCase();
  if (msg.includes('invalid login credentials'))  return 'Email hoặc mật khẩu không đúng';
  if (msg.includes('email not confirmed'))         return 'Email chưa được xác nhận';
  if (msg.includes('already registered'))          return 'Email này đã được đăng ký';
  if (msg.includes('network'))                     return 'Lỗi kết nối mạng. Vui lòng thử lại';
  if (msg.includes('already_submitted'))           return 'Bài thi đã được nộp trước đó';
  if (msg.includes('timeout'))                     return 'Yêu cầu quá thời gian chờ. Vui lòng thử lại';

  // Fallback to raw message (keep it if it's already Vietnamese)
  return error?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại';
};

/**
 * Logs error to console (dev-only) and returns a user-friendly message.
 * Drop-in for `catch (err) { console.error(err); return getErrorMessage(err); }`
 */
export const logAndGetMessage = (err, context = '') => {
  if (import.meta.env.DEV) {
    console.error(`[${context || 'Error'}]`, err);
  }
  return getErrorMessage(err);
};
