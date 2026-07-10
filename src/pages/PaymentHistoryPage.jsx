import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import {
  CreditCard, Clock, AlertCircle, X,
  RefreshCw, Search, Trash2, Zap, ArrowRight,
  TrendingUp, ShieldCheck, Loader2, AlertTriangle,
} from 'lucide-react';
import { PaymentModal } from '../components/shared/PaymentModal';
import { Toast, useToast } from '../components/shared/Toast';

/* ─── Formatters ───────────────────────────────────────── */
const fmtVND  = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n ?? 0);
const fmtDate = (d) => d ? new Date(d).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '—';

/* ─── Status config ─────────────────────────────────────── */
const S = {
  PENDING: { label: 'Chờ TT',      dot: 'bg-amber-400',   text: 'text-amber-700 dark:text-amber-300',   bg: 'bg-amber-50 dark:bg-amber-950/40',   border: 'border-amber-200 dark:border-amber-800/60'  },
  PARTIAL: { label: 'Một phần',    dot: 'bg-orange-400',  text: 'text-orange-700 dark:text-orange-300',  bg: 'bg-orange-50 dark:bg-orange-950/40',  border: 'border-orange-200 dark:border-orange-800/60' },
  SUCCESS: { label: 'Đã mở khoá', dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-200 dark:border-emerald-800/60'},
  FAILED:  { label: 'Thất bại',   dot: 'bg-red-400',     text: 'text-red-700 dark:text-red-300',     bg: 'bg-red-50 dark:bg-red-950/40',     border: 'border-red-200 dark:border-red-800/60'    },
};
const Badge = ({ status }) => {
  const c = S[status] ?? S.PENDING;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
      {c.label}
    </span>
  );
};

/* ─── Confirm Cancel Sheet ──────────────────────────────── */
const CancelSheet = ({ purchase, onClose, onDone }) => {
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState('');

  const confirm = async () => {
    setBusy(true); setErr('');
    try {
      const { data, error: fe } = await supabase.functions.invoke('manage-purchase', {
        body: { action: 'cancel', purchaseId: purchase.id },
      });
      if (fe || data?.error) throw new Error(fe?.message || data?.error);
      onDone();
    } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(8px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-slate-800 w-full sm:max-w-sm sm:rounded-3xl rounded-t-3xl overflow-hidden"
        style={{ boxShadow: '0 40px 80px rgba(0,0,0,.3)' }}>
        {/* drag pill */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-slate-600" />
        </div>

        <div className="px-6 pt-4 pb-6 space-y-4">
          {/* Icon + title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-slate-100">Huỷ giao dịch?</h3>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Thao tác này không thể hoàn tác</p>
            </div>
            <button onClick={onClose} className="ml-auto w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 flex items-center justify-center transition">
              <X className="w-3.5 h-3.5 text-gray-500 dark:text-slate-400" />
            </button>
          </div>

          {/* Info */}
          <div className="p-3.5 bg-gray-50 dark:bg-slate-700/50 rounded-2xl text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
            Giao dịch <code className="font-mono text-[11px] bg-gray-200 dark:bg-slate-600 px-1.5 py-0.5 rounded">{purchase?.transaction_code}</code> sẽ bị xoá.
            Bạn có thể mở lại và tạo giao dịch mới sau.
          </div>

          {err && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/40 rounded-xl text-xs text-red-700 dark:text-red-300">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> {err}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2.5">
            <button onClick={onClose}
              className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-700 font-semibold text-sm hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 transition active:scale-[.98]">
              Giữ lại
            </button>
            <button onClick={confirm} disabled={busy}
              className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[.98]">
              {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang huỷ...</> : <><Trash2 className="w-4 h-4" /> Xác nhận huỷ</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Purchase row (live updating via realtime) ─────────── */
const PurchaseRow = ({ p: initial, isTeacher, liveAmt, onResume, onCancel, onUpdated }) => {
  const [p, setP] = useState(initial);

  /* Realtime: update this row live when status changes (student view) */
  useEffect(() => {
    if (p.status === 'SUCCESS') return;
    const ch = supabase
      .channel(`row:${p.id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'purchases',
        filter: `id=eq.${p.id}`,
      }, ({ new: row }) => {
        setP(row);
        if (row.status === 'SUCCESS') { supabase.removeChannel(ch); onUpdated?.(); }
      })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [p.id, p.status]);

  // Keep in sync with parent data refreshes
  useEffect(() => { setP(initial); }, [initial]);

  const amt    = liveAmt(p);
  const paidN  = p.paid_amount || 0;
  const pct    = Math.min(100, Math.round((paidN / amt) * 100));
  const isLive = p.status !== 'SUCCESS';

  return (
    <tr className={`hover:bg-slate-50/60 dark:hover:bg-slate-700/40 transition-colors group ${p.status === 'SUCCESS' ? '' : ''}`}>
      {isTeacher && (
        <td className="px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-indigo-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
              {p.profiles?.full_name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate max-w-[140px]">{p.profiles?.full_name || '—'}</p>
              <p className="text-[11px] text-gray-400 dark:text-slate-500 truncate max-w-[140px]">
                {(p.profiles?.email || '').replace('@ic3fighter.local', '')}
              </p>
            </div>
          </div>
        </td>
      )}
      <td className="px-5 py-4">
        <p className="text-sm font-medium text-gray-900 dark:text-slate-100 line-clamp-1 max-w-[180px]">{p.exams?.title || '—'}</p>
        <code className="text-[10px] text-indigo-400 font-mono">{p.transaction_code}</code>
      </td>
      <td className="px-5 py-4 text-sm font-medium text-gray-600 dark:text-slate-300 tabular-nums">{fmtVND(amt)}</td>
      <td className="px-5 py-4">
        <span className={`text-sm font-bold tabular-nums ${paidN >= amt ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-500 dark:text-orange-400'}`}>
          {fmtVND(paidN)}
        </span>
        {p.status === 'PARTIAL' && (
          <div className="mt-1 w-16 h-1 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-orange-400 rounded-full" style={{ width: `${pct}%` }} />
          </div>
        )}
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-1.5">
          {isLive && !isTeacher && (
            <span className="relative flex h-2 w-2 flex-shrink-0">
              <span className="animate-ping absolute inset-0 rounded-full bg-amber-400 opacity-60" />
              <span className="relative rounded-full h-2 w-2 bg-amber-400" />
            </span>
          )}
          <Badge status={p.status} />
        </div>
      </td>
      <td className="px-5 py-4 text-[11px] text-gray-400 dark:text-slate-500 whitespace-nowrap">{fmtDate(p.created_at)}</td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-2 justify-end">
          {isTeacher && p.status === 'SUCCESS' && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 dark:text-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800/60">
              <Zap className="w-3 h-3" /> Auto
            </span>
          )}
          {!isTeacher && p.status !== 'SUCCESS' && (
            <>
              <button onClick={() => onResume(p)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-600 text-xs font-semibold hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-900/50 transition active:scale-95">
                <ArrowRight className="w-3.5 h-3.5" /> Tiếp tục
              </button>
              <button onClick={() => onCancel(p)}
                className="p-1.5 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-900/40 transition active:scale-95"
                title="Huỷ giao dịch">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
};

/* ─── Mobile purchase card (also live-updating) ─────────── */
const PurchaseCard = ({ p: initial, isTeacher, liveAmt, onResume, onCancel, onUpdated }) => {
  const [p, setP] = useState(initial);

  useEffect(() => {
    if (p.status === 'SUCCESS') return;
    const ch = supabase
      .channel(`card:${p.id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'purchases',
        filter: `id=eq.${p.id}`,
      }, ({ new: row }) => {
        setP(row);
        if (row.status === 'SUCCESS') { supabase.removeChannel(ch); onUpdated?.(); }
      })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [p.id, p.status]);

  useEffect(() => { setP(initial); }, [initial]);

  const amt  = liveAmt(p);
  const paid = p.paid_amount || 0;
  const pct  = Math.min(100, Math.round((paid / amt) * 100));

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden transition-all hover:shadow-md"
      style={{ boxShadow: '0 1px 8px rgba(15,23,42,.06)' }}>

      {/* header */}
      <div className="flex items-start gap-3 p-4">
        {isTeacher && (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {p.profiles?.full_name?.charAt(0)?.toUpperCase() || '?'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          {isTeacher && <p className="text-[11px] font-bold text-violet-600 dark:text-violet-400 mb-0.5 truncate">{p.profiles?.full_name}</p>}
          <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 line-clamp-2 leading-snug">{p.exams?.title || '—'}</p>
          <code className="text-[10px] font-mono text-gray-400 dark:text-slate-500 mt-0.5">{p.transaction_code}</code>
        </div>
        <Badge status={p.status} />
      </div>

      {/* partial progress */}
      {p.status === 'PARTIAL' && (
        <div className="px-4 pb-2">
          <div className="flex justify-between text-[10px] text-gray-400 dark:text-slate-500 mb-1">
            <span>Đã TT: {fmtVND(paid)}</span><span>{pct}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-orange-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {/* amounts */}
      <div className="flex divide-x divide-gray-100 dark:divide-slate-700 border-t border-gray-50 dark:border-slate-700 bg-gray-50/60 dark:bg-slate-700/30">
        <div className="flex-1 px-3.5 py-2.5">
          <p className="text-[10px] text-gray-400 dark:text-slate-500">Cần TT</p>
          <p className="text-sm font-bold text-gray-700 dark:text-slate-300">{fmtVND(amt)}</p>
        </div>
        <div className="flex-1 px-3.5 py-2.5">
          <p className="text-[10px] text-gray-400 dark:text-slate-500">Đã nhận</p>
          <p className={`text-sm font-bold ${paid >= amt ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-500 dark:text-orange-400'}`}>{fmtVND(paid)}</p>
        </div>
        <div className="flex-1 px-3.5 py-2.5">
          <p className="text-[10px] text-gray-400 dark:text-slate-500">Ngày tạo</p>
          <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-tight">{fmtDate(p.created_at)}</p>
        </div>
      </div>

      {/* actions */}
      {!isTeacher && p.status !== 'SUCCESS' && (
        <div className="flex gap-2 px-4 py-3 border-t border-gray-100 dark:border-slate-700">
          <button onClick={() => onResume(p)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-indigo-50 text-indigo-600 text-xs font-semibold hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-900/50 transition active:scale-95">
            <ArrowRight className="w-3.5 h-3.5" /> Tiếp tục thanh toán
          </button>
          <button onClick={() => onCancel(p)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 text-red-500 text-xs font-semibold hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-900/40 transition active:scale-95">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      {isTeacher && p.status === 'SUCCESS' && (
        <div className="px-4 py-2.5 border-t border-gray-100 dark:border-slate-700">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            <Zap className="w-3 h-3" /> Tự động qua SePay
          </span>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════ */
export const PaymentHistoryPage = () => {
  const { isTeacher, isSelfRegistered } = useAuth();

  const [purchases,   setPurchases]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState('all');
  const [search,      setSearch]      = useState('');
  const [cancelP,     setCancelP]     = useState(null);
  const [resumeExam,  setResumeExam]  = useState(null);
  const { toasts, showToast, dismissToast } = useToast();

  const fetchPurchases = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const action = isTeacher ? 'list-all' : 'list-mine';
      const { data, error: fe } = await supabase.functions.invoke('manage-purchase', { body: { action } });
      if (fe || data?.error) throw new Error(fe?.message || data?.error);
      setPurchases(data?.purchases || []);
    } catch (e) { showToast('Lỗi tải dữ liệu: ' + e.message, 'error'); }
    finally { setLoading(false); }
  }, [isTeacher, showToast]);

  useEffect(() => { fetchPurchases(); }, [fetchPurchases]);

  const liveAmt = (p) => p.exams?.required_amount || p.required_amount || 100_000;

  const FILTERS = [
    { key: 'all',     label: 'Tất cả' },
    { key: 'PENDING', label: 'Chờ TT' },
    { key: 'PARTIAL', label: 'Một phần' },
    { key: 'SUCCESS', label: 'Đã mở' },
  ];

  const filtered = purchases.filter(p => {
    if (filter !== 'all' && p.status !== filter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (p.exams?.title || '').toLowerCase().includes(q)
      || (p.profiles?.full_name || '').toLowerCase().includes(q)
      || (p.transaction_code || '').toLowerCase().includes(q);
  });

  const nSuccess = purchases.filter(p => p.status === 'SUCCESS').length;
  const nPending = purchases.filter(p => p.status !== 'SUCCESS').length;
  const revenue  = purchases.filter(p => p.status === 'SUCCESS').reduce((s, p) => s + (p.paid_amount || 0), 0);

  const handleCancelled = () => {
    setCancelP(null);
    fetchPurchases(true);
    showToast('Đã huỷ giao dịch', 'info');
  };

  const handleResume = (p) => {
    setResumeExam({ id: p.exam_id, title: p.exams?.title, required_amount: p.exams?.required_amount || p.required_amount });
  };

  const handleRowUpdated = () => {
    showToast('🎉 Thanh toán thành công!', 'success');
    fetchPurchases(true);
  };

  return (
    <div className="min-h-screen bg-[#f4f6fb] dark:bg-slate-900">

      {/* Toast */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* ── Hero ── */}
      <div className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#1e1b4b 0%,#312e81 55%,#1d4ed8 100%)' }}>
        <div className="absolute inset-0 opacity-[.07] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(#fff 1px,transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-9 pb-8">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-white tracking-tight">
                  {isTeacher ? 'Quản lý thanh toán' : 'Lịch sử thanh toán'}
                </h1>
                <p className="text-white/50 text-xs mt-0.5 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-emerald-400" />
                  {isTeacher ? 'Tự động xử lý qua SePay' : 'Mua bài và theo dõi trạng thái'}
                </p>
              </div>
            </div>
            {isTeacher && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/25">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                <span className="text-emerald-200 text-xs font-semibold">Tự động mở khi đủ tiền</span>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2.5 mt-6">
            {[
              { val: nSuccess,             label: 'Đã mở khoá',  color: 'text-emerald-300' },
              { val: nPending,             label: 'Chờ thanh toán', color: 'text-amber-300' },
              isTeacher
                ? { val: fmtVND(revenue),  label: 'Doanh thu',   color: 'text-blue-300' }
                : { val: purchases.length, label: 'Tổng GD',     color: 'text-blue-300' },
            ].map((s, i) => (
              <div key={i} className="bg-white/10 border border-white/15 rounded-2xl px-4 py-3 text-center">
                <p className={`text-xl font-extrabold ${s.color} truncate`}>{s.val}</p>
                <p className="text-[10px] text-white/50 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">

        {/* Teacher banner */}
        {isTeacher && (
          <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl dark:bg-emerald-950/30 dark:border-emerald-800/50">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Thanh toán tự động (SePay Webhook)</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">Khi học sinh chuyển đúng mã, bài thi sẽ <strong>tự mở khoá ngay lập tức</strong> — không cần xác nhận thủ công.</p>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {isTeacher && (
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 px-3 py-2.5 flex-1 sm:flex-none sm:w-60 shadow-sm">
              <Search className="w-4 h-4 text-gray-400 dark:text-slate-500 flex-shrink-0" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Tìm tên, bài thi, mã..."
                className="flex-1 outline-none text-sm text-gray-700 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 bg-transparent" />
              {search && (
                <button onClick={() => setSearch('')}>
                  <X className="w-3.5 h-3.5 text-gray-300 hover:text-gray-500 dark:text-slate-600 dark:hover:text-slate-400" />
                </button>
              )}
            </div>
          )}

          <div className="flex gap-1.5 flex-wrap">
            {FILTERS.map(f => {
              const cnt = f.key === 'all' ? purchases.length : purchases.filter(p => p.status === f.key).length;
              return (
                <button key={f.key} onClick={() => setFilter(f.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all active:scale-95
                    ${filter === f.key
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:border-indigo-500'
                    }`}>
                  {f.label}
                  {cnt > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${filter === f.key ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                      {cnt}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button onClick={() => fetchPurchases()} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs text-gray-500 hover:border-indigo-300 hover:text-indigo-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:border-indigo-500 dark:hover:text-indigo-400 transition ml-auto shadow-sm disabled:opacity-40 active:scale-95">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>
        </div>

        {/* ── List ── */}
        {loading ? (
          /* Skeleton */
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 animate-pulse" style={{ opacity: 1 - i * 0.25 }}>
                <div className="flex gap-3 mb-4">
                  <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-slate-700 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded-full w-1/2" />
                    <div className="h-2.5 bg-gray-100 dark:bg-slate-700/60 rounded-full w-1/3" />
                  </div>
                  <div className="h-6 w-20 bg-gray-100 dark:bg-slate-700 rounded-full" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[1,2,3].map(j => <div key={j} className="h-11 bg-gray-50 dark:bg-slate-700/40 rounded-xl" />)}
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <div className="w-16 h-16 rounded-3xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 flex items-center justify-center mb-4 shadow-sm">
              <CreditCard className="w-8 h-8 text-gray-300 dark:text-slate-600" />
            </div>
            <p className="font-semibold text-gray-700 dark:text-slate-300">
              {purchases.length === 0 ? 'Chưa có giao dịch nào' : 'Không tìm thấy giao dịch'}
            </p>
            <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">
              {purchases.length === 0
                ? (isSelfRegistered ? 'Mua nội dung để bắt đầu học.' : 'Chưa có học sinh nào thanh toán.')
                : 'Thử thay đổi bộ lọc.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden"
              style={{ boxShadow: '0 2px 16px rgba(15,23,42,.05)' }}>
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50/80 dark:bg-slate-700/30">
                    {isTeacher && <th className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Người dùng</th>}
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Bài thi</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Cần TT</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Đã nhận</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Trạng thái</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Ngày tạo</th>
                    <th className="px-5 py-3.5 text-right text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                  {filtered.map(p => (
                    <PurchaseRow key={p.id} p={p} isTeacher={isTeacher} liveAmt={liveAmt}
                      onResume={handleResume} onCancel={setCancelP} onUpdated={handleRowUpdated} />
                  ))}
                </tbody>
              </table>
              <div className="px-5 py-3 border-t border-gray-50 dark:border-slate-700 bg-gray-50/40 dark:bg-slate-700/20 flex items-center justify-between">
                <p className="text-xs text-gray-400 dark:text-slate-500">{filtered.length} giao dịch{search && ` · tìm "${search}"`}</p>
                {isTeacher && nSuccess > 0 && (
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> {fmtVND(revenue)}
                  </p>
                )}
              </div>
            </div>

            {/* Mobile cards */}
            <div className="flex flex-col gap-3 sm:hidden">
              {filtered.map(p => (
                <PurchaseCard key={p.id} p={p} isTeacher={isTeacher} liveAmt={liveAmt}
                  onResume={handleResume} onCancel={setCancelP} onUpdated={handleRowUpdated} />
              ))}
              <p className="text-center text-xs text-gray-400 dark:text-slate-500 pb-2">{filtered.length} giao dịch</p>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {cancelP && (
        <CancelSheet purchase={cancelP} onClose={() => setCancelP(null)} onDone={handleCancelled} />
      )}
      {resumeExam && (
        <PaymentModal
          exam={resumeExam}
          onClose={() => setResumeExam(null)}
          onSuccess={() => { setResumeExam(null); fetchPurchases(true); showToast('🎉 Thanh toán thành công!', 'success'); }}
        />
      )}
    </div>
  );
};
