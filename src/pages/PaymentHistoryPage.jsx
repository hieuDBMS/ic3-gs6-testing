import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import {
  CreditCard, CheckCircle, Clock, AlertCircle, X,
  RefreshCw, DollarSign, Search, AlertTriangle,
  RotateCcw, Trash2, Info, Zap, ArrowRight,
} from 'lucide-react';
import { PaymentModal } from '../components/shared/PaymentModal';

const formatVND = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n ?? 0);

const formatDate = (d) =>
  d ? new Date(d).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '—';

const STATUS_CFG = {
  PENDING: { label: 'Chờ thanh toán', color: 'bg-amber-100 text-amber-700 border border-amber-200',   icon: <Clock className="w-3.5 h-3.5" /> },
  PARTIAL: { label: 'Một phần',       color: 'bg-orange-100 text-orange-700 border border-orange-200', icon: <AlertCircle className="w-3.5 h-3.5" /> },
  SUCCESS: { label: 'Đã mở khoá',     color: 'bg-emerald-100 text-emerald-700 border border-emerald-200', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  FAILED:  { label: 'Thất bại',       color: 'bg-red-100 text-red-700 border border-red-200',           icon: <X className="w-3.5 h-3.5" /> },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CFG[status] || STATUS_CFG.PENDING;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
};

/* ── Cancel Confirm Dialog ── */
const CancelDialog = ({ purchase, onClose, onCancelled }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const handleCancel = async () => {
    setLoading(true); setError('');
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('manage-purchase', {
        body: { action: 'cancel', purchaseId: purchase.id },
      });
      if (fnErr || data?.error) throw new Error(fnErr?.message || data?.error);
      onCancelled();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <h2 className="text-base font-bold text-gray-900">Huỷ giao dịch</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 text-sm text-amber-800">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Bạn chắc chắn muốn huỷ?</p>
              <p>Giao dịch <strong>{purchase?.transaction_code}</strong> sẽ bị xoá. Bạn có thể tạo lại sau.</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold text-sm hover:bg-gray-200 transition">
            Giữ lại
          </button>
          <button onClick={handleCancel} disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <><RotateCcw className="w-4 h-4 animate-spin" /> Đang xoá...</> : <><Trash2 className="w-4 h-4" /> Xác nhận huỷ</>}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════ */
export const PaymentHistoryPage = () => {
  const { isTeacher, isSelfRegistered } = useAuth();

  const [purchases, setPurchases]    = useState([]);
  const [loading,   setLoading]      = useState(true);
  const [filter,    setFilter]       = useState('all');
  const [search,    setSearch]       = useState('');
  const [cancelPurchase, setCancelPurchase] = useState(null);
  const [resumePaymentExam, setResumePaymentExam] = useState(null);
  const [toast,    setToast]         = useState('');

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  }, []);

  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    try {
      const action = isTeacher ? 'list-all' : 'list-mine';
      const { data, error: fnErr } = await supabase.functions.invoke('manage-purchase', {
        body: { action },
      });
      if (fnErr || data?.error) throw new Error(fnErr?.message || data?.error);
      setPurchases(data?.purchases || []);
    } catch (err) {
      showToast('Lỗi tải dữ liệu: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [isTeacher, showToast]);

  useEffect(() => { fetchPurchases(); }, [fetchPurchases]);

  const filtered = purchases.filter(p => {
    const matchStatus = filter === 'all' || p.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || (
      p.exams?.title?.toLowerCase().includes(q) ||
      p.profiles?.full_name?.toLowerCase().includes(q) ||
      p.transaction_code?.toLowerCase().includes(q)
    );
    return matchStatus && matchSearch;
  });

  const totalSuccess = purchases.filter(p => p.status === 'SUCCESS').length;
  const totalPending = purchases.filter(p => p.status === 'PENDING' || p.status === 'PARTIAL').length;
  const totalRevenue = purchases.filter(p => p.status === 'SUCCESS').reduce((s, p) => s + (p.paid_amount || 0), 0);

  const handleCancelled = () => {
    setCancelPurchase(null);
    fetchPurchases();
    showToast('🗑️ Đã huỷ giao dịch.');
  };

  // Always use live exam price
  const liveAmt = (p) => p.exams?.required_amount || p.required_amount || 100000;

  // ── Row component (desktop) ──
  const Row = ({ p }) => {
    const amt = liveAmt(p);
    return (
      <tr className="hover:bg-gray-50/80 transition-colors">
        {isTeacher && (
          <td className="px-5 py-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-indigo-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                {p.profiles?.full_name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">{p.profiles?.full_name || '—'}</div>
                <div className="text-xs text-gray-400">
                  {p.profiles?.email?.replace('@ic3fighter.local', '') || p.profiles?.email || ''}
                </div>
              </div>
            </div>
          </td>
        )}
        <td className="px-5 py-4">
          <div className="text-sm font-medium text-gray-900 line-clamp-1">{p.exams?.title || '—'}</div>
          {p.transaction_code && (
            <code className="text-[10px] text-violet-600 font-mono">{p.transaction_code}</code>
          )}
        </td>
        <td className="px-5 py-4 text-sm font-medium text-gray-700">{formatVND(amt)}</td>
        <td className="px-5 py-4">
          <span className={`text-sm font-bold ${p.paid_amount >= amt ? 'text-emerald-600' : 'text-orange-600'}`}>
            {formatVND(p.paid_amount)}
          </span>
          {p.status === 'PARTIAL' && (
            <div className="text-xs text-orange-500 mt-0.5">Còn {formatVND(amt - p.paid_amount)}</div>
          )}
        </td>
        <td className="px-5 py-4"><StatusBadge status={p.status} /></td>
        <td className="px-5 py-4 text-xs text-gray-400">{formatDate(p.created_at)}</td>
        <td className="px-5 py-4">
          <div className="flex items-center gap-2 justify-end">
            {/* Auto badge for teacher view */}
            {isTeacher && p.status === 'SUCCESS' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                <Zap className="w-3 h-3" /> Tự động
              </span>
            )}
            {isTeacher && p.status !== 'SUCCESS' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                <Clock className="w-3 h-3" /> Chờ TT
              </span>
            )}
            {/* Student action buttons */}
            {!isTeacher && p.status !== 'SUCCESS' && (
              <>
                <button onClick={() => setResumePaymentExam({ id: p.exam_id, title: p.exams?.title, required_amount: p.exams?.required_amount || p.required_amount })}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-semibold hover:bg-blue-100 transition">
                  <ArrowRight className="w-3.5 h-3.5" /> Tiếp tục
                </button>
                <button onClick={() => setCancelPurchase(p)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition">
                  <Trash2 className="w-3.5 h-3.5" /> Huỷ
                </button>
              </>
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-[100] bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #182e89 60%, #0e7490 100%)' }}>
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-blue-400/20 blur-[80px] pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-white">Lịch sử thanh toán</h1>
                <p className="text-white/50 text-sm flex items-center gap-1.5 mt-0.5">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  {isTeacher ? 'Thanh toán tự động qua SePay' : 'Theo dõi trạng thái mua nội dung'}
                </p>
              </div>
            </div>
            {/* Auto info badge for teacher */}
            {isTeacher && (
              <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 px-3.5 py-2 rounded-xl text-sm font-semibold text-emerald-200">
                <Zap className="w-4 h-4" /> Bài tự mở khi nhận đủ tiền
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            {[
              { label: 'Đã mở khoá',    value: totalSuccess,           color: 'text-emerald-300' },
              { label: 'Chờ thanh toán',  value: totalPending,         color: 'text-amber-300' },
              isTeacher
                ? { label: 'Tổng doanh thu', value: formatVND(totalRevenue), color: 'text-blue-300' }
                : { label: 'Tổng giao dịch', value: purchases.length,        color: 'text-blue-300' },
            ].map((s, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/15 px-4 py-3 text-center">
                <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-white/50 text-xs mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Auto-unlock info banner */}
        {isTeacher && (
          <div className="flex items-start gap-3 mb-5 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
            <Zap className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-emerald-800">
              <p className="font-bold mb-0.5">Hệ thống tự động (SePay)</p>
              <p className="text-emerald-700">Khi học sinh chuyển khoản đúng nội dung mã, bài thi sẽ <strong>tự động mở khoá ngay lập tức</strong> — không cần xác nhận thủ công.</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          {isTeacher && (
            <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-3 py-2 flex-1 sm:flex-none min-w-[200px]">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Tìm người dùng, bài thi, mã..."
                className="outline-none text-sm text-gray-700 placeholder-gray-400 flex-1"
              />
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all',     label: 'Tất cả' },
              { key: 'PENDING', label: '⏳ Chờ' },
              { key: 'PARTIAL', label: '⚡ Một phần' },
              { key: 'SUCCESS', label: '✅ Đã mở' },
            ].map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  filter === f.key
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                }`}>
                {f.label}
              </button>
            ))}
          </div>
          <button onClick={fetchPurchases}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs text-gray-500 hover:border-blue-300 hover:text-blue-600 transition bg-white ml-auto">
            <RefreshCw className="w-3.5 h-3.5" /> Làm mới
          </button>
        </div>

        {/* Table / Cards */}
        {loading ? (
          <div className="flex flex-col items-center py-20 text-gray-400">
            <RotateCcw className="w-8 h-8 animate-spin mb-3 text-blue-400" />
            <p className="text-sm">Đang tải...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-gray-400">
            <CreditCard className="w-12 h-12 mb-3 text-gray-200" />
            <p className="font-semibold text-gray-500">
              {purchases.length === 0 ? 'Chưa có giao dịch nào' : 'Không tìm thấy giao dịch'}
            </p>
            <p className="text-sm mt-1">
              {purchases.length === 0
                ? (isSelfRegistered ? 'Mua nội dung để bắt đầu học.' : 'Chưa có học sinh nào thanh toán.')
                : 'Thử thay đổi bộ lọc.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {isTeacher && <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Người dùng</th>}
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Bài thi</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Cần TT</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Đã nhận</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Trạng thái</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Ngày tạo</th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(p => <Row key={p.id} p={p} />)}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="flex flex-col gap-3 sm:hidden">
              {filtered.map(p => (
                <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      {isTeacher && (
                        <div className="text-xs font-semibold text-violet-600 mb-0.5">{p.profiles?.full_name}</div>
                      )}
                      <div className="text-sm font-semibold text-gray-900 line-clamp-2">{p.exams?.title}</div>
                      {p.transaction_code && (
                        <code className="text-[10px] text-gray-400 font-mono">{p.transaction_code}</code>
                      )}
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div className="bg-gray-50 rounded-xl p-2.5">
                      <div className="text-gray-400 mb-0.5">Cần TT</div>
                      <div className="font-bold text-gray-800">{formatVND(liveAmt(p))}</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-2.5">
                      <div className="text-gray-400 mb-0.5">Đã nhận</div>
                      <div className={`font-bold ${p.paid_amount >= liveAmt(p) ? 'text-emerald-600' : 'text-orange-500'}`}>
                        {formatVND(p.paid_amount)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-400">{formatDate(p.created_at)}</span>
                    <div className="flex gap-2">
                      {/* Auto badge for teacher */}
                      {isTeacher && p.status === 'SUCCESS' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                          <Zap className="w-3 h-3" /> Tự động
                        </span>
                      )}
                      {/* Student action buttons */}
                      {!isTeacher && p.status !== 'SUCCESS' && (
                        <>
                          <button onClick={() => setResumePaymentExam({ id: p.exam_id, title: p.exams?.title, required_amount: p.exams?.required_amount || p.required_amount })}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-semibold hover:bg-blue-100 transition">
                            <ArrowRight className="w-3 h-3" /> Tiếp tục
                          </button>
                          <button onClick={() => setCancelPurchase(p)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition">
                            <Trash2 className="w-3 h-3" /> Huỷ
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-4 text-center text-xs text-gray-400">{filtered.length} giao dịch</p>
          </>
        )}
      </div>

      {/* Cancel Modal */}
      {cancelPurchase && (
        <CancelDialog purchase={cancelPurchase} onClose={() => setCancelPurchase(null)} onCancelled={handleCancelled} />
      )}

      {/* Resume Payment Modal */}
      {resumePaymentExam && (
        <PaymentModal 
          exam={resumePaymentExam} 
          onClose={() => setResumePaymentExam(null)} 
          onSuccess={() => {
            setResumePaymentExam(null);
            fetchPurchases();
          }} 
        />
      )}
    </div>
  );
};
