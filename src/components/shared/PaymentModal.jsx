import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { supabase } from '../../lib/supabase';
import { X, CheckCircle2, Copy, Check, Zap, AlertCircle, AlertTriangle, Loader2 } from 'lucide-react';

/* ─────────────────────────────────────────────────────────
   Module-level payment config cache
   Fetched once per browser session — never re-fetched on
   every modal open. Saves ~200-400ms each time.
───────────────────────────────────────────────────────── */
let _configCache    = null;
let _configFetching = null; // in-flight dedup

async function getPaymentConfig() {
  // Already cached
  if (_configCache !== null) return _configCache;
  // Deduplicate concurrent calls
  if (_configFetching) return _configFetching;
  _configFetching = supabase
    .from('payment_config')
    .select('*')
    .eq('id', 1)
    .single()
    .then(({ data }) => {
      _configCache    = data ?? {};   // store empty obj so truthiness works
      _configFetching = null;
      return _configCache;
    })
    .catch(() => {
      _configFetching = null;         // allow retry on error
      return {};
    });
  return _configFetching;
}

/* ─────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────── */
const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n ?? 0) + ' ₫';

/* SVG animated checkmark – memoised */
const AnimatedCheck = memo(() => (
  <svg viewBox="0 0 52 52" className="w-20 h-20 drop-shadow-sm">
    <circle cx="26" cy="26" r="24" fill="none" stroke="#10b981" strokeWidth="2.5"
      style={{ strokeDasharray: 151, strokeDashoffset: 151, animation: 'circ .55s ease forwards' }} />
    <path fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" d="M15 27l8 8 14-14"
      style={{ strokeDasharray: 46, strokeDashoffset: 46, animation: 'tick .35s .5s ease forwards' }} />
    <style>{`
      @keyframes circ { to { stroke-dashoffset: 0 } }
      @keyframes tick  { to { stroke-dashoffset: 0 } }
    `}</style>
  </svg>
));

/* Live pulsing dot */
const LiveDot = memo(({ color = 'bg-emerald-500' }) => (
  <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
    <span className={`animate-ping absolute inset-0 rounded-full ${color} opacity-50`} />
    <span className={`relative rounded-full h-2.5 w-2.5 ${color}`} />
  </span>
));

/* ═══════════════════════════════════════════════════════════
   PAYMENT MODAL
   Props: exam { id, title, required_amount }
          onClose()
          onSuccess()
═══════════════════════════════════════════════════════════ */
export const PaymentModal = ({ exam, onClose, onSuccess }) => {
  const [phase,    setPhase]    = useState('init');
  const [purchase, setPurchase] = useState(null);
  const [config,   setConfig]   = useState(() => _configCache || null);
  const [copied,   setCopied]   = useState(false);
  const [imgOk,    setImgOk]    = useState(false);
  const [errMsg,   setErrMsg]   = useState('');

  // Stable random suffix – prevents QR regeneration on every render
  const suffix = useRef(Math.random().toString(36).slice(2, 5).toUpperCase()).current;

  /* ── Boot ──────────────────────────────────────────────── */
  useEffect(() => { init(); }, []);

  const init = async () => {
    setPhase('init'); setErrMsg('');
    try {
      const [cfg, statusR] = await Promise.all([
        getPaymentConfig(),
        supabase.functions.invoke('manage-purchase', { body: { action: 'status', examId: exam.id } }),
      ]);
      setConfig(cfg);

      if (statusR.error) throw new Error(statusR.error.message || 'Không thể kiểm tra trạng thái');

      if (statusR.data?.purchase) {
        const p = statusR.data.purchase;
        setPurchase(p);
        if (p.status === 'SUCCESS') {
          setPhase('success');
          onSuccess?.();
        } else {
          setPhase('ready');
        }
      } else {
        await doCreate();
      }
    } catch (e) {
      setErrMsg(e.message);
      setPhase('error');
    }
  };

  const doCreate = async () => {
    try {
      const { data, error: fe } = await supabase.functions.invoke('manage-purchase', {
        body: { action: 'create', examId: exam.id },
      });
      if (fe || data?.error) throw new Error(fe?.message || data?.error);
      setPurchase(data.purchase);
      setPhase('ready');
    } catch (e) {
      setErrMsg(e.message);
      setPhase('error');
    }
  };

  /* ── Realtime – listen to this purchase row ────────────── */
  useEffect(() => {
    if (!purchase?.id || purchase.status === 'SUCCESS') return;
    const ch = supabase
      .channel(`pay:${purchase.id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'purchases',
        filter: `id=eq.${purchase.id}`,
      }, ({ new: row }) => {
        setPurchase(row);
        if (row.status === 'SUCCESS') {
          setPhase('success');
          supabase.removeChannel(ch);
          setTimeout(() => { onSuccess?.(); onClose(); }, 2800);
        }
      })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [purchase?.id]);

  /* ── Copy ─────────────────────────────────────────────── */
  const copy = useCallback(async () => {
    if (!purchase?.transaction_code) return;
    await navigator.clipboard.writeText(purchase.transaction_code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }, [purchase?.transaction_code]);

  /* ── Derived ─────────────────────────────────────────── */
  const total  = exam?.required_amount || 100_000;
  const paid   = purchase?.paid_amount || 0;
  const due    = Math.max(0, total - paid);
  const amount = purchase?.status === 'PARTIAL' ? due : total;
  const pct    = Math.min(100, Math.round((paid / total) * 100));
  const code   = purchase?.transaction_code || '';

  const bankId = config?.bank_id || '';
  const acctNo = config?.account_no || '';
  const acctNm = config?.account_name || '';
  const hasBnk = !!(bankId && acctNo && acctNm);

  const qrUrl = hasBnk
    ? `https://img.vietqr.io/image/${bankId}-${acctNo}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(code + suffix)}&accountName=${encodeURIComponent(acctNm)}`
    : '';

  /* ── Render ─────────────────────────────────────────── */
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(10px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white w-full sm:max-w-[380px] sm:rounded-3xl rounded-t-3xl flex flex-col relative overflow-hidden"
        style={{ maxHeight: '95dvh', boxShadow: '0 40px 100px rgba(0,0,0,.35)' }}
      >
        {/* close */}
        <button onClick={onClose}
          className="absolute top-3.5 right-3.5 z-20 w-8 h-8 rounded-full bg-black/[.06] hover:bg-black/10 flex items-center justify-center transition-colors">
          <X className="w-4 h-4 text-gray-500" />
        </button>

        {/* ══ INIT ══ */}
        {phase === 'init' && (
          <div className="flex flex-col items-center justify-center gap-3 py-20 px-8">
            <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
            <p className="text-sm text-gray-400">Đang chuẩn bị...</p>
          </div>
        )}

        {/* ══ ERROR ══ */}
        {phase === 'error' && (
          <div className="flex flex-col items-center justify-center gap-4 py-16 px-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">Đã xảy ra lỗi</p>
              <p className="text-xs text-gray-400 mt-1">{errMsg}</p>
            </div>
            <button onClick={init}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition active:scale-95">
              Thử lại
            </button>
          </div>
        )}

        {/* ══ SUCCESS ══ */}
        {phase === 'success' && (
          <div className="flex flex-col items-center py-12 px-8 gap-4 text-center">
            <AnimatedCheck />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Thanh toán thành công!</h2>
              <p className="text-sm text-gray-400 mt-1 leading-relaxed max-w-[240px] mx-auto">
                <strong className="text-gray-700">{exam?.title}</strong> đã được mở khoá cho bạn.
              </p>
            </div>
            <div className="w-full space-y-2 mt-2">
              {['Bài thi đã mở khoá', 'Flashcard đã mở khoá'].map(item => (
                <div key={item} className="flex items-center gap-2.5 px-4 py-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-emerald-800">{item}</span>
                </div>
              ))}
            </div>
            <button onClick={() => { onSuccess?.(); onClose(); }}
              className="w-full mt-2 py-3.5 rounded-2xl font-bold text-white text-sm transition-all active:scale-[.98]"
              style={{ background: 'linear-gradient(135deg,#059669,#10b981)', boxShadow: '0 6px 20px rgba(5,150,105,.3)' }}>
              Vào học ngay →
            </button>
          </div>
        )}

        {/* ══ READY ══ */}
        {phase === 'ready' && (
          <>
            {/* Header */}
            <div className="px-5 pt-5 pb-4 pr-12">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[.12em]">Thanh toán</p>
              <h2 className="text-[15px] font-bold text-gray-900 mt-0.5 leading-snug line-clamp-2">{exam?.title}</h2>

              {/* PARTIAL progress */}
              {purchase?.status === 'PARTIAL' && (
                <div className="mt-3 p-3 rounded-2xl bg-orange-50 border border-orange-100">
                  <div className="flex justify-between text-[11px] text-orange-700 mb-1.5">
                    <span>Đã chuyển {fmt(paid)}</span>
                    <span className="font-bold">{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-orange-100 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-400 rounded-full" style={{ width: `${pct}%`, transition: 'width .6s ease' }} />
                  </div>
                  <p className="text-[11px] text-orange-600 mt-1.5">Còn cần chuyển thêm <strong>{fmt(due)}</strong></p>
                </div>
              )}
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 px-5 space-y-4 pb-1">

              {/* Bank not configured */}
              {!hasBnk && (
                <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Chưa cấu hình thanh toán</p>
                    <p className="text-xs text-amber-600 mt-0.5">Liên hệ giáo viên để được hỗ trợ.</p>
                  </div>
                </div>
              )}

              {hasBnk && (
                <>
                  {/* Amount + QR */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="px-5 py-2 rounded-full bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100">
                      <span className="text-2xl font-extrabold text-gray-900 tracking-tight">{fmt(amount)}</span>
                    </div>

                    {/* QR */}
                    <div className="p-2 rounded-3xl bg-white border-2 border-gray-100 shadow"
                      style={{ boxShadow: '0 4px 24px rgba(0,0,0,.08)' }}>
                      {!imgOk && (
                        <div className="w-52 h-52 rounded-2xl bg-gray-50 animate-pulse" />
                      )}
                      <img src={qrUrl} alt="QR"
                        className={`w-52 h-52 rounded-2xl object-contain ${imgOk ? '' : 'hidden'}`}
                        onLoad={() => setImgOk(true)}
                        onError={e => { e.currentTarget.style.display = 'none'; setImgOk(true); }}
                      />
                    </div>
                    <p className="text-[11px] text-gray-400">Quét bằng app ngân hàng bất kỳ</p>
                  </div>

                  {/* Bank info */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-2xl">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-900 truncate">{acctNm}</p>
                      <p className="text-xs text-gray-500 font-mono">{bankId} · {acctNo}</p>
                    </div>
                  </div>

                  {/* Transfer content / copy */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-semibold text-gray-500">Nội dung chuyển khoản</p>
                      <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">Bắt buộc</span>
                    </div>

                    <button onClick={copy}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 border-dashed text-left select-none transition-all duration-200 active:scale-[.98]
                        ${copied
                          ? 'border-emerald-400 bg-emerald-50'
                          : 'border-gray-200 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50/40'
                        }`}>
                      <code className={`flex-1 text-sm font-mono font-bold break-all leading-snug ${copied ? 'text-emerald-700' : 'text-gray-800'}`}>
                        {code}
                      </code>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all
                        ${copied ? 'bg-emerald-500 scale-105' : 'bg-gray-200 hover:bg-gray-300'}`}>
                        {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-gray-500" />}
                      </div>
                    </button>
                    <p className="mt-1.5 text-center text-[11px] text-gray-400">
                      {copied ? '✓ Đã sao chép' : 'Nhấn để sao chép'}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 pb-6 pt-3 space-y-2">
              <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-100">
                <LiveDot />
                <p className="text-xs font-medium text-emerald-700 flex-1">Tự động mở khoá khi nhận được tiền</p>
                <Zap className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <button onClick={onClose}
                className="w-full py-3 rounded-2xl text-sm font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all active:scale-[.98]">
                Đóng
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
