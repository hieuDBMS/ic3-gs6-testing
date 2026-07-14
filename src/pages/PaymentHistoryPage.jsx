import { useEffect, useState, useCallback } from "react";
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import {
  CreditCard, X,
  RefreshCw, Search, Trash2, Zap, ArrowRight,
  TrendingUp, ShieldCheck, Loader2, AlertTriangle,
} from 'lucide-react';
import { PaymentModal } from '../components/shared/PaymentModal';
import { Toast, useToast } from '../components/shared/Toast';
import { useMediaQuery } from '../hooks/useMediaQuery';

/* ─── Formatters ───────────────────────────────────────── */
const fmtVND  = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n ?? 0);
const fmtDate = (d) => d ? new Date(d).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '—';

/* ─── Status config ─────────────────────────────────────── */
const S = {
  PENDING: { dot: 'bg-amber-400',   text: 'text-amber-700 dark:text-amber-300',   bg: 'bg-amber-50 dark:bg-amber-950/40',   border: 'border-amber-200 dark:border-amber-800/60'  },
  PARTIAL: { dot: 'bg-orange-400',  text: 'text-orange-700 dark:text-orange-300',  bg: 'bg-orange-50 dark:bg-orange-950/40',  border: 'border-orange-200 dark:border-orange-800/60' },
  SUCCESS: { dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-200 dark:border-emerald-800/60'},
  FAILED:  { dot: 'bg-red-400',     text: 'text-red-700 dark:text-red-300',     bg: 'bg-red-50 dark:bg-red-950/40',     border: 'border-red-200 dark:border-red-800/60'    },
};
const Badge = ({ status }) => {
  const { t } = useTranslation();
  const c = S[status] ?? S.PENDING;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />
      {t(`paymentHistory.status.${status}`)}
    </span>
  );
};

/* ─── Confirm Cancel Sheet ──────────────────────────────── */
const CancelSheet = ({ purchase, onClose, onDone }) => {
  const { t } = useTranslation();
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
    <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center"
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
            <div className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-slate-100">{t('paymentHistory.cancelSheet.title')}</h3>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{t('paymentHistory.cancelSheet.subtitle')}</p>
            </div>
            <button onClick={onClose} className="ml-auto w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 flex items-center justify-center transition">
              <X className="w-3.5 h-3.5 text-gray-500 dark:text-slate-400" />
            </button>
          </div>

          {/* Info */}
          <div className="p-3.5 bg-gray-50 dark:bg-slate-700/50 rounded-2xl text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
            {t('paymentHistory.cancelSheet.infoPrefix')} <code className="font-mono text-[11px] bg-gray-200 dark:bg-slate-600 px-1.5 py-0.5 rounded-sm">{purchase?.transaction_code}</code>{' '}
            {t('paymentHistory.cancelSheet.infoSuffix')}
          </div>

          {err && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/40 rounded-xl text-xs text-red-700 dark:text-red-300">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {err}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2.5">
            <button onClick={onClose}
              className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-700 font-semibold text-sm hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 transition active:scale-[.98]">
              {t('paymentHistory.cancelSheet.keep')}
            </button>
            <button onClick={confirm} disabled={busy}
              className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[.98]">
              {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('paymentHistory.cancelSheet.cancelling')}</> : <><Trash2 className="w-4 h-4" /> {t('paymentHistory.cancelSheet.confirm')}</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Purchase row (live updating via realtime) ─────────── */
const PurchaseRow = ({ p: initial, isTeacher, liveAmt, onResume, onCancel, onUpdated }) => {
  const { t } = useTranslation();
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
            <div className="w-8 h-8 rounded-full bg-linear-to-br from-violet-400 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
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
            <span className="relative flex h-2 w-2 shrink-0">
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
              <Zap className="w-3 h-3" /> {t('paymentHistory.row.auto')}
            </span>
          )}
          {!isTeacher && p.status !== 'SUCCESS' && (
            <>
              <button onClick={() => onResume(p)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-600 text-xs font-semibold hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-900/50 transition active:scale-95">
                <ArrowRight className="w-3.5 h-3.5" /> {t('paymentHistory.row.resume')}
              </button>
              <button onClick={() => onCancel(p)}
                className="p-1.5 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-900/40 transition active:scale-95"
                title={t('paymentHistory.row.cancelTitle')}>
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
  const { t } = useTranslation();
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
          <div className="w-9 h-9 rounded-full bg-linear-to-br from-violet-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
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
            <span>{t('paymentHistory.card.paidPrefix', { amount: fmtVND(paid) })}</span><span>{pct}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-orange-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {/* amounts */}
      <div className="flex divide-x divide-gray-100 dark:divide-slate-700 border-t border-gray-50 dark:border-slate-700 bg-gray-50/60 dark:bg-slate-700/30">
        <div className="flex-1 px-3.5 py-2.5">
          <p className="text-[10px] text-gray-400 dark:text-slate-500">{t('paymentHistory.card.required')}</p>
          <p className="text-sm font-bold text-gray-700 dark:text-slate-300">{fmtVND(amt)}</p>
        </div>
        <div className="flex-1 px-3.5 py-2.5">
          <p className="text-[10px] text-gray-400 dark:text-slate-500">{t('paymentHistory.card.received')}</p>
          <p className={`text-sm font-bold ${paid >= amt ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-500 dark:text-orange-400'}`}>{fmtVND(paid)}</p>
        </div>
        <div className="flex-1 px-3.5 py-2.5">
          <p className="text-[10px] text-gray-400 dark:text-slate-500">{t('paymentHistory.card.createdDate')}</p>
          <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-tight">{fmtDate(p.created_at)}</p>
        </div>
      </div>

      {/* actions */}
      {!isTeacher && p.status !== 'SUCCESS' && (
        <div className="flex gap-2 px-4 py-3 border-t border-gray-100 dark:border-slate-700">
          <button onClick={() => onResume(p)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-indigo-50 text-indigo-600 text-xs font-semibold hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-900/50 transition active:scale-95">
            <ArrowRight className="w-3.5 h-3.5" /> {t('paymentHistory.card.resume')}
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
            <Zap className="w-3 h-3" /> {t('paymentHistory.card.autoViaSePay')}
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
  const { t } = useTranslation();
  const { isTeacher, isSelfRegistered } = useAuth();

  const [purchases,   setPurchases]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState('all');
  const [search,      setSearch]      = useState('');
  const [cancelP,     setCancelP]     = useState(null);
  const [resumeExam,  setResumeExam]  = useState(null);
  const { toasts, showToast, dismissToast } = useToast();
  // Matches Tailwind's `sm` breakpoint — decides which of PurchaseRow/PurchaseCard
  // to mount. Only rendering one (not both + CSS-hiding the other) matters here
  // because each row/card opens its own realtime channel for live payment status;
  // mounting both would double the open channels for every pending purchase.
  const isDesktop = useMediaQuery('(min-width: 640px)');

  const fetchPurchases = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const action = isTeacher ? 'list-all' : 'list-mine';
      const { data, error: fe } = await supabase.functions.invoke('manage-purchase', { body: { action } });
      if (fe || data?.error) throw new Error(fe?.message || data?.error);
      setPurchases(data?.purchases || []);
    } catch (e) { showToast(t('paymentHistory.toast.loadError', { message: e.message }), 'error'); }
    finally { setLoading(false); }
  }, [isTeacher, showToast, t]);

  useEffect(() => { fetchPurchases(); }, [fetchPurchases]);

  const liveAmt = (p) => p.exams?.required_amount || p.required_amount || 100_000;

  const FILTERS = [
    { key: 'all',     label: t('paymentHistory.filters.all') },
    { key: 'PENDING', label: t('paymentHistory.filters.pending') },
    { key: 'PARTIAL', label: t('paymentHistory.filters.partial') },
    { key: 'SUCCESS', label: t('paymentHistory.filters.success') },
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
    showToast(t('paymentHistory.toast.cancelled'), 'info');
  };

  const handleResume = (p) => {
    setResumeExam({ id: p.exam_id, title: p.exams?.title, required_amount: p.exams?.required_amount || p.required_amount });
  };

  const handleRowUpdated = () => {
    showToast(t('paymentHistory.toast.paymentSuccess'), 'success');
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
                  {isTeacher ? t('paymentHistory.header.titleTeacher') : t('paymentHistory.header.titleStudent')}
                </h1>
                <p className="text-white/50 text-xs mt-0.5 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-emerald-400" />
                  {isTeacher ? t('paymentHistory.header.subtitleTeacher') : t('paymentHistory.header.subtitleStudent')}
                </p>
              </div>
            </div>
            {isTeacher && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/25">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                <span className="text-emerald-200 text-xs font-semibold">{t('paymentHistory.header.autoUnlockBadge')}</span>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2.5 mt-6">
            {[
              { val: nSuccess,             label: t('paymentHistory.stats.unlocked'),  color: 'text-emerald-300' },
              { val: nPending,             label: t('paymentHistory.stats.pending'), color: 'text-amber-300' },
              isTeacher
                ? { val: fmtVND(revenue),  label: t('paymentHistory.stats.revenue'),   color: 'text-blue-300' }
                : { val: purchases.length, label: t('paymentHistory.stats.totalTransactions'),     color: 'text-blue-300' },
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
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0 mt-0.5">
              <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">{t('paymentHistory.teacherBanner.title')}</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">{t('paymentHistory.teacherBanner.descPrefix')} <strong>{t('paymentHistory.teacherBanner.descStrong')}</strong> {t('paymentHistory.teacherBanner.descSuffix')}</p>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {isTeacher && (
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 px-3 py-2.5 flex-1 sm:flex-none sm:w-60 shadow-xs">
              <Search className="w-4 h-4 text-gray-400 dark:text-slate-500 shrink-0" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder={t('paymentHistory.toolbar.searchPlaceholder')}
                className="flex-1 outline-hidden text-sm text-gray-700 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 bg-transparent" />
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
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs text-gray-500 hover:border-indigo-300 hover:text-indigo-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:border-indigo-500 dark:hover:text-indigo-400 transition ml-auto shadow-xs disabled:opacity-40 active:scale-95">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{t('paymentHistory.toolbar.refresh')}</span>
          </button>
        </div>

        {/* ── List ── */}
        {loading ? (
          /* Skeleton */
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 animate-pulse" style={{ opacity: 1 - i * 0.25 }}>
                <div className="flex gap-3 mb-4">
                  <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-slate-700 shrink-0" />
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
            <div className="w-16 h-16 rounded-3xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 flex items-center justify-center mb-4 shadow-xs">
              <CreditCard className="w-8 h-8 text-gray-300 dark:text-slate-600" />
            </div>
            <p className="font-semibold text-gray-700 dark:text-slate-300">
              {purchases.length === 0 ? t('paymentHistory.empty.noneTitle') : t('paymentHistory.empty.notFoundTitle')}
            </p>
            <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">
              {purchases.length === 0
                ? (isSelfRegistered ? t('paymentHistory.empty.noneSelfRegistered') : t('paymentHistory.empty.noneOther'))
                : t('paymentHistory.empty.tryFilter')}
            </p>
          </div>
        ) : (
          isDesktop ? (
            /* Desktop table */
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden"
              style={{ boxShadow: '0 2px 16px rgba(15,23,42,.05)' }}>
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50/80 dark:bg-slate-700/30">
                    {isTeacher && <th className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">{t('paymentHistory.table.user')}</th>}
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">{t('paymentHistory.table.exam')}</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">{t('paymentHistory.table.required')}</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">{t('paymentHistory.table.received')}</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">{t('paymentHistory.table.status')}</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">{t('paymentHistory.table.createdDate')}</th>
                    <th className="px-5 py-3.5 text-right text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">{t('paymentHistory.table.actions')}</th>
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
                <p className="text-xs text-gray-400 dark:text-slate-500">{t('paymentHistory.resultsCount', { count: filtered.length })}{search && ` · ${t('paymentHistory.searchFor', { query: search })}`}</p>
                {isTeacher && nSuccess > 0 && (
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> {fmtVND(revenue)}
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* Mobile cards */
            <div className="flex flex-col gap-3">
              {filtered.map(p => (
                <PurchaseCard key={p.id} p={p} isTeacher={isTeacher} liveAmt={liveAmt}
                  onResume={handleResume} onCancel={setCancelP} onUpdated={handleRowUpdated} />
              ))}
              <p className="text-center text-xs text-gray-400 dark:text-slate-500 pb-2">{t('paymentHistory.resultsCount', { count: filtered.length })}</p>
            </div>
          )
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
          onSuccess={() => { setResumeExam(null); fetchPurchases(true); showToast(t('paymentHistory.toast.paymentSuccess'), 'success'); }}
        />
      )}
    </div>
  );
};
