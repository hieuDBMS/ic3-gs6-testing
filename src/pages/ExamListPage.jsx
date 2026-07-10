import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { Book, Clock, ChevronDown, ChevronRight, Monitor, Search, BookOpen, Zap, Lock, CheckCircle, ShoppingCart, Trash2, X, Loader2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PaymentModal } from '../components/shared/PaymentModal';
import { useExamStructure } from '../hooks/useExamStructure';

/* ── Version pill colors ── */
const VERSION_STYLES = {
  GS6: { from: 'from-primary-600', to: 'to-primary-400', ring: 'ring-primary-200', text: 'text-primary-700 dark:text-primary-300', bg: 'bg-primary-50 dark:bg-primary-950/30', border: 'border-primary-200 dark:border-primary-900/50', activeBg: 'bg-gradient-to-r from-primary-600 to-primary-500' },
  GS7: { from: 'from-violet-600', to: 'to-violet-400', ring: 'ring-violet-200', text: 'text-violet-700 dark:text-violet-300', bg: 'bg-violet-50 dark:bg-violet-950/30', border: 'border-violet-200 dark:border-violet-900/50', activeBg: 'bg-gradient-to-r from-violet-600 to-violet-500' },
  GS8: { from: 'from-accent-600', to: 'to-accent-400', ring: 'ring-accent-200', text: 'text-accent-700 dark:text-accent-300', bg: 'bg-accent-50 dark:bg-accent-900/30', border: 'border-accent-200 dark:border-accent-800/50', activeBg: 'bg-gradient-to-r from-accent-600 to-accent-500' },
};
const DEFAULT_STYLE = { from: 'from-gray-600', to: 'to-gray-400', ring: 'ring-gray-200', text: 'text-gray-700 dark:text-slate-300', bg: 'bg-gray-50 dark:bg-slate-800', border: 'border-gray-200 dark:border-slate-700', activeBg: 'bg-gradient-to-r from-gray-600 to-gray-500' };
const getStyle = (v) => VERSION_STYLES[v] || DEFAULT_STYLE;

/* ── Exam Type Badge ── */
const TypeBadge = ({ type }) => (
  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
    ${type === 'testing'
      ? 'bg-blue-100 text-blue-700 border border-blue-200'
      : 'bg-purple-100 text-purple-700 border border-purple-200'}`}>
    {type === 'testing' ? '📝 Testing' : '🎯 Gmetrix'}
  </span>
);

/* ─── Skeleton loader ───────────────────────────── */
const Skeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3].map(i => (
      <div key={i} className="h-16 rounded-2xl shimmer" />
    ))}
  </div>
);

/* ─── Inline Cancel Sheet ────────────────────────────────── */
const CancelSheet = ({ txCode, purchaseId, onClose, onDone }) => {
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState('');
  const confirm = async () => {
    setBusy(true); setErr('');
    try {
      const { data, error: fe } = await supabase.functions.invoke('manage-purchase', {
        body: { action: 'cancel', purchaseId },
      });
      if (fe || data?.error) throw new Error(fe?.message || data?.error);
      onDone();
    } catch (e) { setErr(e.message); setBusy(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(8px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-slate-800 w-full sm:max-w-sm sm:rounded-3xl rounded-t-3xl overflow-hidden"
        style={{ boxShadow: '0 40px 80px rgba(0,0,0,.3)' }}>
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-slate-600" />
        </div>
        <div className="px-6 pt-4 pb-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 dark:text-slate-100 text-sm">Huỷ giao dịch?</h3>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Thao tác này không thể hoàn tác</p>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 flex items-center justify-center transition">
              <X className="w-3.5 h-3.5 text-gray-500 dark:text-slate-400" />
            </button>
          </div>
          <div className="p-3.5 bg-gray-50 dark:bg-slate-700/50 rounded-2xl text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
            Giao dịch <code className="font-mono text-[11px] bg-gray-200 dark:bg-slate-600 px-1.5 py-0.5 rounded">{txCode}</code> sẽ bị xoá.
            Bạn có thể mua lại bất kỳ lúc nào.
          </div>
          {err && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/40 rounded-xl text-xs text-red-700 dark:text-red-300">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> {err}
            </div>
          )}
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

export const ExamListPage = () => {
  const { isSelfRegistered, user } = useAuth();
  const navigate = useNavigate();
  const { levels, exams, loading } = useExamStructure();
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [expandedLevel, setExpandedLevel] = useState(null);
  const [purchases, setPurchases] = useState({}); // examId -> purchase
  const [purchasesLoaded, setPurchasesLoaded] = useState(false);
  const [paymentExam, setPaymentExam] = useState(null); // exam for PaymentModal
  const [cancelExam,  setCancelExam]  = useState(null); // { purchaseId, txCode }

  /* Group flat levels/exams into the shape this page renders, with the
     testing-before-gmetrix ordering the UI relies on. */
  const allLevels = useMemo(() => (
    [...levels]
      .sort((a, b) => a.level_number - b.level_number)
      .map(level => ({
        ...level,
        exams: exams
          .filter(e => e.level_id === level.id)
          .sort((a, b) => {
            if (a.exam_type !== b.exam_type) return b.exam_type.localeCompare(a.exam_type);
            return a.exam_number - b.exam_number;
          }),
      }))
  ), [levels, exams]);

  const availableVersions = useMemo(
    () => [...new Set(allLevels.map(l => l.version))].sort(),
    [allLevels]
  );

  // Seed selected version / expanded level from localStorage once data first arrives.
  const initializedRef = useRef(false);
  useEffect(() => {
    if (initializedRef.current || allLevels.length === 0) return;
    initializedRef.current = true;

    const saved = localStorage.getItem('ic3_preferred_version');
    if (saved && availableVersions.includes(saved)) {
      setSelectedVersion(saved);
    } else if (availableVersions.length > 0) {
      setSelectedVersion(availableVersions[0]);
    }

    const savedLevel = localStorage.getItem('ic3_expanded_level');
    if (savedLevel) setExpandedLevel(isNaN(savedLevel) ? savedLevel : Number(savedLevel));
  }, [allLevels, availableVersions]);

  // Re-fetch purchases when isSelfRegistered becomes true (after profile loads)
  useEffect(() => {
    if (isSelfRegistered && user && !purchasesLoaded) fetchPurchases();
    // Non-selfRegistered users don't need purchases at all
    if (!isSelfRegistered && user !== null) setPurchasesLoaded(true);
  }, [isSelfRegistered, user]);

  const fetchPurchases = useCallback(async () => {
    try {
      const { data } = await supabase.functions.invoke('manage-purchase', {
        body: { action: 'list-mine' },
      });
      if (data?.purchases) {
        const map = {};
        data.purchases.forEach(p => { map[p.exam_id] = p; });
        setPurchases(map);
      }
    } catch {}
    finally { setPurchasesLoaded(true); }
  }, []);

  const handleSelectVersion = useCallback((v) => {
    setSelectedVersion(v);
    setExpandedLevel(null);
    localStorage.setItem('ic3_preferred_version', v);
    localStorage.removeItem('ic3_expanded_level');
  }, []);

  const toggleLevel = useCallback((id) => {
    const newVal = expandedLevel === id ? null : id;
    setExpandedLevel(newVal);
    if (newVal) localStorage.setItem('ic3_expanded_level', newVal);
    else localStorage.removeItem('ic3_expanded_level');
  }, [expandedLevel]);

  const filteredLevels = useMemo(
    () => selectedVersion ? allLevels.filter(l => l.version === selectedVersion) : [],
    [selectedVersion, allLevels]
  );
  const style = getStyle(selectedVersion);
  const totalExams = useMemo(
    () => filteredLevels.reduce((acc, l) => acc + l.exams.length, 0),
    [filteredLevels]
  );

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
      {/* ── Page hero header ── */}
      <div className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #182e89 60%, #0e7490 100%)' }}>
        {/* Decorative blobs */}
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-primary-400/20 blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-48 h-48 rounded-full bg-accent-400/15 blur-[60px] pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-400/20 border border-accent-400/25 mb-4">
                <BookOpen className="w-3.5 h-3.5 text-accent-300" />
                <span className="text-accent-300 text-xs font-semibold tracking-wide">IC3 Certification</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Chọn bài thi
              </h1>
              <p className="mt-2 text-white/50 text-sm max-w-md">
                Chọn phiên bản IC3, sau đó chọn cấp độ và bài thi phù hợp để bắt đầu.
              </p>
            </div>

            {selectedVersion && (
              <div className="hidden sm:flex flex-col items-end gap-1">
                <div className="text-white/40 text-xs font-medium uppercase tracking-wider">Đang chọn</div>
                <div className="text-2xl font-black text-white">{selectedVersion}</div>
                <div className="text-white/50 text-xs">{filteredLevels.length} cấp · {totalExams} bài thi</div>
              </div>
            )}
          </div>

          {/* ── Version selector ── */}
          <div className="mt-8">
            <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3">Phiên bản IC3</p>
            <div className="flex flex-wrap gap-3">
              {availableVersions.map(v => {
                const s = getStyle(v);
                const active = selectedVersion === v;
                return (
                  <button
                    key={v}
                    onClick={() => handleSelectVersion(v)}
                    className={`relative flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200
                      ${active
                        ? `${s.activeBg} text-white shadow-xl scale-[1.03]`
                        : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white border border-white/15 hover:scale-[1.02]'
                      }`}
                  >
                    <Monitor className={`w-4 h-4 ${active ? 'text-white' : 'text-white/60'}`} />
                    <div className="text-left">
                      <div className="leading-none">{v}</div>
                      <div className={`text-[10px] font-normal mt-0.5 ${active ? 'text-white/75' : 'text-white/40'}`}>
                        IC3 {v === 'GS6' ? 'Global Standard 6' : v === 'GS7' ? 'Global Standard 7' : 'Global Standard 8'}
                      </div>
                    </div>
                    {active && (
                      <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-green-400 border-2 border-white shadow-sm" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && <Skeleton />}

        {!loading && !selectedVersion && (
          <div className="mt-4 flex flex-col items-center justify-center py-20 text-center animate-fade-in">
            <div className="w-20 h-20 rounded-3xl bg-primary-50 dark:bg-primary-950/30 border-2 border-primary-100 dark:border-primary-900/40 flex items-center justify-center mb-5">
              <Monitor className="w-9 h-9 text-primary-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-slate-200 mb-2">Chọn phiên bản để bắt đầu</h3>
            <p className="text-gray-400 dark:text-slate-500 text-sm max-w-xs">
              Chọn một phiên bản IC3 (GS6, GS7, GS8) ở trên để xem danh sách cấp độ và bài thi.
            </p>
          </div>
        )}

        {!loading && selectedVersion && (
          <div className="space-y-4 animate-fade-in">
            {filteredLevels.length === 0 && (
              <p className="text-gray-400 dark:text-slate-500 text-sm italic py-8 text-center">Không có cấp độ nào.</p>
            )}

            {filteredLevels.map((level, idx) => {
              const isOpen = expandedLevel === level.id;
              const testingCount = level.exams.filter(e => e.exam_type === 'testing').length;
              const gmetrixCount = level.exams.filter(e => e.exam_type === 'gmetrix').length;

              return (
                <div
                  key={level.id}
                  className={`bg-white dark:bg-slate-800 rounded-2xl border overflow-hidden transition-all duration-200
                    ${isOpen ? 'border-primary-200 dark:border-primary-800/60 shadow-card-hover' : 'border-gray-100 dark:border-slate-700 shadow-card hover:border-primary-100 dark:hover:border-primary-900/50 hover:shadow-card-hover'}`}
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  {/* Level header */}
                  <button
                    onClick={() => toggleLevel(level.id)}
                    className="w-full flex items-center gap-4 px-5 py-4 sm:px-6 sm:py-5 text-left hover:bg-gray-50/70 dark:hover:bg-slate-700/40 transition-colors group"
                  >
                    {/* Level number badge */}
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${style.from} ${style.to} flex items-center justify-center text-white font-black text-lg flex-shrink-0 shadow-md`}>
                      {level.level_number}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base font-bold text-gray-900 dark:text-slate-100">
                          {level.version} — {level.label}
                        </h2>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        {testingCount > 0 && (
                          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">📝 {testingCount} Testing</span>
                        )}
                        {gmetrixCount > 0 && (
                          <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">🎯 {gmetrixCount} Gmetrix</span>
                        )}
                      </div>
                    </div>

                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0
                      ${isOpen ? `${style.bg} ${style.text}` : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-500 dark:group-hover:bg-slate-600'}`}>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {/* Exam cards */}
                  {isOpen && (
                    <div className={`border-t ${style.border} px-5 py-5 sm:px-6 ${style.bg} animate-slide-up`}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {level.exams.map(exam => {
                          // For self-registered users, wait until purchases are loaded
                          // to avoid flash of wrong state (showing "buy" for already-bought exams)
                          const purchase = isSelfRegistered ? purchases[exam.id] : null;
                          const isPurchased = !isSelfRegistered || purchase?.status === 'SUCCESS';
                          const isPending = isSelfRegistered && purchase && purchase.status !== 'SUCCESS';
                          const showSkeleton = isSelfRegistered && !purchasesLoaded;

                          return (
                           <div
                            key={exam.id}
                            className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 flex flex-col gap-3 hover:shadow-card transition-all duration-150 group"
                            style={isPending ? { borderColor: '#fbbf24' } : undefined}
                           >
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 leading-snug">{exam.title}</h3>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <TypeBadge type={exam.exam_type} />
                                {isSelfRegistered && !showSkeleton && (
                                  isPurchased
                                    ? <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60"><CheckCircle className="w-3 h-3" /> Đã mua</span>
                                    : isPending
                                      ? <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60"><Clock className="w-3 h-3" /> Chờ TT</span>
                                      : <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold border border-gray-200 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600"><Lock className="w-3 h-3" /> Chưa mua</span>
                                )}
                                {showSkeleton && <div className="w-14 h-5 bg-gray-100 dark:bg-slate-700 rounded-full animate-pulse" />}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-slate-500">
                              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>{Math.floor(exam.duration_seconds / 60)} phút</span>
                            </div>

                            {/* Action button — render only after purchases confirmed */}
                            {showSkeleton ? (
                              <div className="w-full h-9 bg-gray-100 dark:bg-slate-700 rounded-xl animate-pulse mt-auto" />
                            ) : isPurchased ? (
                              <Link
                                to={`/exam/${exam.id}`}
                                className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white
                                  bg-gradient-to-r ${style.from} ${style.to}
                                  hover:opacity-90 hover:shadow-md active:scale-[0.97]
                                  transition-all duration-150 shadow-sm mt-auto`}
                              >
                                <Zap className="w-3.5 h-3.5" />
                                Bắt đầu làm bài
                              </Link>
                            ) : isPending ? (
                              <div className="flex gap-2 mt-auto">
                                <button onClick={() => setPaymentExam(exam)}
                                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-400 hover:opacity-90 active:scale-[.97] transition-all shadow-sm">
                                  <Clock className="w-3.5 h-3.5" /> Tiếp tục TT
                                </button>
                                <button onClick={() => setCancelExam({ purchaseId: purchase.id, txCode: purchase.transaction_code })}
                                  className="flex items-center justify-center px-3 py-2.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 active:scale-[.97] transition-all border border-red-100"
                                  title="Huỷ giao dịch">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setPaymentExam(exam)}
                                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold
                                  bg-gradient-to-r from-indigo-600 to-violet-600 text-white
                                  hover:opacity-90 hover:shadow-md active:scale-[0.97]
                                  transition-all duration-150 shadow-sm mt-auto"
                              >
                                <ShoppingCart className="w-3.5 h-3.5" />
                                Mua ngay — {new Intl.NumberFormat('vi-VN').format(exam.required_amount || 100000)}đ
                              </button>
                            )}
                           </div>
                          );
                         })}

                        {level.exams.length === 0 && (
                          <div className="col-span-full py-6 text-center text-sm text-gray-400 dark:text-slate-500 italic">
                            Chưa có bài thi nào trong cấp độ này.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>

    {/* Payment Modal */}
    {paymentExam && (
      <PaymentModal
        exam={paymentExam}
        onClose={() => { setPaymentExam(null); fetchPurchases(); }}
        onSuccess={() => {
          fetchPurchases();
          setPaymentExam(null);
          navigate(`/exam/${paymentExam.id}`);
        }}
      />
    )}

    {/* Cancel Sheet */}
    {cancelExam && (
      <CancelSheet
        txCode={cancelExam.txCode}
        purchaseId={cancelExam.purchaseId}
        onClose={() => setCancelExam(null)}
        onDone={() => { setCancelExam(null); fetchPurchases(); }}
      />
    )}
  </>
  );
};

