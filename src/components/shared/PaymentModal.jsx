import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import {
  X, QrCode, CheckCircle, Clock, AlertCircle,
  Copy, RefreshCw, Building2, Hash, User, DollarSign, AlertTriangle, Zap,
} from 'lucide-react';

const formatVND = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n ?? 0);

const StatusBadge = ({ status }) => {
  const map = {
    PENDING: { label: 'Chờ thanh toán',      color: 'bg-amber-100 text-amber-700 border border-amber-200' },
    PARTIAL: { label: 'Thanh toán một phần', color: 'bg-orange-100 text-orange-700 border border-orange-200' },
    SUCCESS: { label: 'Đã mở khoá',           color: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
  };
  const cfg = map[status] || map.PENDING;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
      {cfg.label}
    </span>
  );
};

export const PaymentModal = ({ exam, onClose, onSuccess }) => {
  const [purchase,   setPurchase]   = useState(null);
  const [payConfig,  setPayConfig]  = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [creating,   setCreating]   = useState(false);
  const [copied,     setCopied]     = useState(false);
  const [error,      setError]      = useState('');
  const [justUnlocked, setJustUnlocked] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => { init(); }, [exam?.id]);

  // Polling: check payment status every 4s while PENDING/PARTIAL
  useEffect(() => {
    const shouldPoll = purchase && purchase.status !== 'SUCCESS' && !loading && !creating;
    if (!shouldPoll) {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      return;
    }
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await supabase.functions.invoke('manage-purchase', {
          body: { action: 'status', examId: exam.id },
        });
        if (data?.purchase?.status === 'SUCCESS') {
          setPurchase(data.purchase);
          setJustUnlocked(true);
          clearInterval(pollRef.current);
          pollRef.current = null;
          // Auto navigate after 2s
          setTimeout(() => onSuccess?.(), 2000);
        } else if (data?.purchase) {
          setPurchase(data.purchase);
        }
      } catch {}
    }, 4000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [purchase?.status, loading, creating]);

  const init = async () => {
    setLoading(true); setError('');
    try {
      // Load payment config + purchase status in parallel
      const [cfgRes, statusRes] = await Promise.all([
        supabase.from('payment_config').select('*').eq('id', 1).single(),
        supabase.functions.invoke('manage-purchase', {
          body: { action: 'status', examId: exam.id },
        }),
      ]);

      setPayConfig(cfgRes.data || null);

      if (statusRes.data?.purchase) {
        setPurchase(statusRes.data.purchase);
        if (statusRes.data.purchase.status === 'SUCCESS') onSuccess?.();
      } else {
        await createPurchase();
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const createPurchase = async () => {
    setCreating(true);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('manage-purchase', {
        body: { action: 'create', examId: exam.id },
      });
      if (fnErr || data?.error) throw new Error(fnErr?.message || data?.error);
      setPurchase(data.purchase);
    } catch (e) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  };

  const copyCode = async () => {
    if (!purchase?.transaction_code) return;
    await navigator.clipboard.writeText(purchase.transaction_code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Always use live exam.required_amount (admin can update it)
  const examAmount  = exam?.required_amount || 100000;
  const remaining   = purchase ? Math.max(0, examAmount - (purchase.paid_amount || 0)) : examAmount;
  
  const qrAmount     = purchase?.status === 'PARTIAL' ? remaining : examAmount;
  
  // Add a tiny random alphanumeric suffix to the transfer content.
  // This bypasses MB Bank's duplicate transaction filter (same amount + same content within 3 mins)
  // without changing the actual price the user has to pay.
  // sepay-webhook uses `.includes()` so it will still match the base PAY_IC3_... code perfectly.
  const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
  const qrContent    = purchase?.transaction_code ? `${purchase.transaction_code}${randomSuffix}` : '';

  const bankId      = payConfig?.bank_id      || '';
  const accountNo   = payConfig?.account_no   || '';
  const accountName = payConfig?.account_name || '';
  const isConfigured = bankId && accountNo && accountName;

  const qrUrl = isConfigured
    ? `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${qrAmount}&addInfo=${encodeURIComponent(qrContent)}&accountName=${encodeURIComponent(accountName)}`
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-500 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Mua nội dung</h2>
              <p className="text-xs text-gray-500 truncate max-w-[200px]">{exam?.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          {/* Bank not configured warning */}
          {!loading && !isConfigured && (
            <div className="flex items-start gap-3 px-4 py-3.5 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-0.5">Chưa có thông tin thanh toán</p>
                <p className="text-xs text-amber-600">Giáo viên chưa cài đặt tài khoản ngân hàng. Vui lòng liên hệ giáo viên.</p>
              </div>
            </div>
          )}

          {/* What you unlock */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2">Bạn sẽ mở khoá</p>
            <div className="space-y-1.5">
              {[
                `📝 Bài thi: ${exam?.title}`,
                `🧠 Flashcard: ${exam?.title}`,
              ].map(t => (
                <div key={t} className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Price */}
          {purchase?.status === 'PARTIAL' ? (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Đã thanh toán</span>
                <span className="font-bold text-emerald-600">{formatVND(purchase.paid_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Còn thiếu</span>
                <span className="font-bold text-orange-600 text-base">{formatVND(remaining)}</span>
              </div>
              <p className="text-xs text-orange-600 pt-1">
                ⚠️ Chuyển thêm <strong>{formatVND(remaining)}</strong> để mở khoá nội dung.
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <span className="text-sm font-medium text-gray-600">Số tiền cần chuyển</span>
              <span className="text-xl font-extrabold text-violet-700">{formatVND(qrAmount)}</span>
            </div>
          )}

          {/* Loading */}
          {(loading || creating) && (
            <div className="flex flex-col items-center py-8 text-gray-400">
              <RefreshCw className="w-8 h-8 animate-spin mb-2 text-violet-400" />
              <span className="text-sm">Đang tạo mã thanh toán...</span>
            </div>
          )}

          {/* QR + bank details */}
          {!loading && !creating && purchase && purchase.status !== 'SUCCESS' && isConfigured && (
            <div className="space-y-4">
              {/* QR */}
              <div className="flex flex-col items-center">
                <div className="bg-white p-3 rounded-2xl border-2 border-gray-100 shadow-sm inline-block">
                  <img
                    src={qrUrl}
                    alt="QR Thanh toán"
                    className="w-52 h-52 object-contain rounded-xl"
                    onError={e => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">Quét bằng app ngân hàng để thanh toán</p>
              </div>

              {/* Bank info */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2.5 text-sm">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-gray-500">
                    <Building2 className="w-3.5 h-3.5" /> Ngân hàng
                  </span>
                  <span className="font-bold text-gray-900">{bankId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-gray-500">
                    <Hash className="w-3.5 h-3.5" /> Số tài khoản
                  </span>
                  <span className="font-mono font-bold text-gray-900 text-base tracking-wide">{accountNo}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-gray-500">
                    <User className="w-3.5 h-3.5" /> Chủ tài khoản
                  </span>
                  <span className="font-semibold text-gray-900">{accountName}</span>
                </div>
                <div className="flex justify-between items-center border-t border-gray-200 pt-2">
                  <span className="flex items-center gap-1.5 text-gray-500">
                    <DollarSign className="w-3.5 h-3.5" /> Số tiền
                  </span>
                  <span className="font-bold text-violet-700 text-base">{formatVND(qrAmount)}</span>
                </div>
              </div>

              {/* Transaction code */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Nội dung chuyển khoản <span className="text-red-500">(bắt buộc)</span>
                </p>
                <div className="flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-xl px-4 py-3">
                  <code className="flex-1 text-sm font-mono font-bold text-violet-800 break-all">
                    {purchase.transaction_code}
                  </code>
                  <button
                    onClick={copyCode}
                    className="flex-shrink-0 p-1.5 rounded-lg bg-violet-100 hover:bg-violet-200 transition text-violet-600"
                    title="Sao chép"
                  >
                    {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">⚡ Ghi đúng nội dung này — hệ thống tự nhận diện và mở khoá tức thì</p>
              </div>

              {/* Status + note */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" /> Trạng thái:
                </div>
                <StatusBadge status={purchase.status} />
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800">
                <div className="flex items-center gap-1.5 font-bold mb-1.5">
                  <span>⚡</span> Thanh toán tự động:
                </div>
                <ol className="space-y-1 list-decimal list-inside text-emerald-700">
                  <li>Chuyển khoản <strong>đúng số tiền</strong> và <strong>đúng nội dung</strong> mã bên trên</li>
                  <li>Hệ thống tự nhận diện giao dịch (vài giây)</li>
                  <li>Nội dung <strong>tự động mở khoá ngay lập tức</strong> ✅</li>
                </ol>
              </div>
            </div>
          )}

          {/* Just-unlocked success banner */}
          {justUnlocked && (
            <div className="flex items-center gap-2.5 px-4 py-3 bg-emerald-500 rounded-xl text-white text-sm font-semibold animate-bounce">
              <Zap className="w-5 h-5" />
              <span>Thanh toán thành công! Đang mở khoá...
              </span>
            </div>
          )}

          {/* Success */}
          {!loading && purchase?.status === 'SUCCESS' && (
            <div className="flex flex-col items-center py-6 text-emerald-600">
              <CheckCircle className="w-14 h-14 mb-3" />
              <p className="text-lg font-bold">Đã mở khoá!</p>
              <p className="text-sm text-gray-500 mt-1">Bạn có thể truy cập nội dung ngay bây giờ.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold text-sm hover:bg-gray-200 transition">
            Đóng
          </button>
          {purchase?.status === 'SUCCESS' && (
            <button onClick={() => { onSuccess?.(); onClose(); }}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm hover:opacity-90 transition shadow-sm">
              Bắt đầu học →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
