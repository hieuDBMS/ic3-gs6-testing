import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { Brain, Clock, ChevronRight, BookOpen, Zap, Layers, Hash, ChevronDown, Sparkles, Lock, CheckCircle, ShoppingCart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PaymentModal } from '../components/shared/PaymentModal';

/* ── Version config ── */
const VERSION_CFG = {
  GS6: { grad: 'linear-gradient(135deg,#7c3aed,#4f46e5)', heroBg: 'linear-gradient(135deg,#6d28d9,#4338ca,#1d4ed8)', badge: 'bg-violet-100 text-violet-700 border-violet-200', cardBorder: '#ddd6fe', cardBg: '#faf5ff', btn: 'linear-gradient(135deg,#7c3aed,#4f46e5)', name: 'Global Standard 6', emoji: '🟣' },
  GS7: { grad: 'linear-gradient(135deg,#e11d48,#db2777)', heroBg: 'linear-gradient(135deg,#be123c,#9d174d,#86198f)', badge: 'bg-rose-100 text-rose-700 border-rose-200', cardBorder: '#fecdd3', cardBg: '#fff1f2', btn: 'linear-gradient(135deg,#e11d48,#db2777)', name: 'Global Standard 7', emoji: '🔴' },
  GS8: { grad: 'linear-gradient(135deg,#0d9488,#059669)', heroBg: 'linear-gradient(135deg,#0f766e,#047857,#065f46)', badge: 'bg-teal-100 text-teal-700 border-teal-200', cardBorder: '#99f6e4', cardBg: '#f0fdfa', btn: 'linear-gradient(135deg,#0d9488,#059669)', name: 'Global Standard 8', emoji: '🟢' },
};
const DEFAULT_CFG = {
  grad: 'linear-gradient(135deg,#64748b,#475569)', heroBg: 'linear-gradient(135deg,#475569,#334155)',
  badge: 'bg-slate-100 text-slate-700 border-slate-200', cardBorder: '#e2e8f0', cardBg: '#f8fafc',
  btn: 'linear-gradient(135deg,#64748b,#475569)', name: 'IC3', emoji: '⚫',
};
const getCfg = v => VERSION_CFG[v] || DEFAULT_CFG;

const TYPE_BADGE = {
  testing: 'bg-blue-50 text-blue-600 border-blue-200',
  gmetrix: 'bg-purple-50 text-purple-600 border-purple-200',
};

export const FlashcardListPage = () => {
  const { isSelfRegistered, user } = useAuth();
  const navigate = useNavigate();
  const [allLevels,       setAllLevels]       = useState([]);
  const [versions,        setVersions]        = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [expandedLevel,   setExpandedLevel]   = useState(null);
  const [questionCounts,  setQuestionCounts]  = useState({});
  const [loading,         setLoading]         = useState(true);
  const [purchases,       setPurchases]       = useState({});
  const [paymentExam,     setPaymentExam]     = useState(null);

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { if (isSelfRegistered && user) fetchPurchases(); }, [isSelfRegistered, user]);

  const fetchData = async () => {
    try {
      const [levelsRes, qRes] = await Promise.all([
        supabase.from('exam_levels').select('*, exams(id,title,exam_type,exam_number,duration_seconds,required_amount)').order('level_number'),
        supabase.from('questions').select('exam_id'),
      ]);
      if (levelsRes.error) throw levelsRes.error;
      const counts = {};
      for (const row of (qRes.data||[])) counts[row.exam_id] = (counts[row.exam_id]||0) + 1;
      setQuestionCounts(counts);
      const sorted = levelsRes.data.map(l => ({
        ...l,
        exams: (l.exams||[]).sort((a,b) =>
          a.exam_type !== b.exam_type ? b.exam_type.localeCompare(a.exam_type) : a.exam_number - b.exam_number
        ),
      }));
      setAllLevels(sorted);
      const vs = [...new Set(sorted.map(l => l.version))].sort();
      setVersions(vs);
      if (vs.length > 0) setSelectedVersion(vs[0]);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchPurchases = async () => {
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
  };

  const cfg           = getCfg(selectedVersion);
  const filteredLevels = selectedVersion ? allLevels.filter(l => l.version === selectedVersion) : [];
  const totalCards    = filteredLevels.reduce((a,l) => a + l.exams.reduce((b,e) => b + (questionCounts[e.id]||0), 0), 0);

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg,#f0f6ff 0%,#e8f0fe 40%,#f1f5fb 100%)', fontFamily: 'Inter, sans-serif' }}>

      {/* ── HERO ── */}
      <div className="relative overflow-hidden" style={{ background: cfg.heroBg }}>
        {/* Subtle dot pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/8 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/25 mb-5">
            <Brain className="w-3.5 h-3.5 text-white/90" />
            <span className="text-white/90 text-[11px] font-semibold tracking-widest uppercase">Flashcard · IC3</span>
          </div>

          <div className="flex items-end justify-between gap-8 flex-wrap">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight tracking-tight">
                Ôn tập <span className="text-white/60 font-light">thông minh</span>
              </h1>
              <p className="mt-2 text-white/55 text-sm max-w-xs leading-relaxed">
                Luyện tập tương tác — chọn đáp án, xem kết quả ngay, ôn lại câu sai tự động.
              </p>
              {selectedVersion && !loading && (
                <div className="mt-5 flex items-center gap-2.5 flex-wrap">
                  <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur-sm">
                    <Sparkles className="w-3.5 h-3.5 text-white/80" />
                    <span className="text-white font-semibold text-sm">{totalCards.toLocaleString()}</span>
                    <span className="text-white/45 text-xs">thẻ</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur-sm">
                    <Layers className="w-3.5 h-3.5 text-white/80" />
                    <span className="text-white font-semibold text-sm">{filteredLevels.length}</span>
                    <span className="text-white/45 text-xs">cấp độ</span>
                  </div>
                </div>
              )}
            </div>

            {/* Version selector */}
            <div className="flex flex-col gap-2">
              <p className="text-white/35 text-[10px] font-semibold uppercase tracking-widest">Phiên bản</p>
              {versions.map(v => {
                const vc = getCfg(v);
                const active = selectedVersion === v;
                return (
                  <button key={v} onClick={() => { setSelectedVersion(v); setExpandedLevel(null); }}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 ${active ? '' : 'hover:bg-white/15'}`}
                    style={active
                      ? { background: '#fff', color: '#1e293b', borderColor: 'transparent', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }
                      : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.65)', borderColor: 'rgba(255,255,255,0.12)' }}>
                    <span className="text-base">{vc.emoji}</span>
                    <div className="text-left">
                      <div className="font-bold leading-none text-sm">{v}</div>
                      <div className="text-[10px] font-normal mt-0.5 opacity-60">{vc.name}</div>
                    </div>
                    {active && <div className="w-2 h-2 rounded-full bg-emerald-500 ml-auto" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── LEVELS ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {loading && (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-16 rounded-2xl animate-pulse bg-white shadow-sm" style={{ opacity: 1 - i*0.2 }} />)}
          </div>
        )}

        {!loading && (
          <div className="space-y-2.5">
            {filteredLevels.map(level => {
              const isOpen     = expandedLevel === level.id;
              const levelCards = level.exams.reduce((a,e) => a + (questionCounts[e.id]||0), 0);
              return (
                <div key={level.id}
                  className="rounded-2xl bg-white overflow-hidden transition-all duration-300"
                  style={{
                    border: `1.5px solid ${isOpen ? cfg.cardBorder : '#e2e8f0'}`,
                    boxShadow: isOpen ? '0 8px 32px rgba(15,23,42,0.1)' : '0 1px 4px rgba(15,23,42,0.05)',
                  }}>

                  <button onClick={() => setExpandedLevel(isOpen ? null : level.id)}
                    className="w-full flex items-center gap-4 px-5 py-4 sm:px-6 text-left group hover:bg-slate-50/50 transition-colors">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0 shadow-sm"
                      style={{ background: cfg.grad }}>
                      {level.level_number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-[14px] font-semibold text-slate-800">{level.label}</h2>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Hash className="w-3 h-3" />{level.exams.filter(e => questionCounts[e.id] > 0).length} bài thi
                        </span>
                        {levelCards > 0 && (
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.badge}`}>
                            🃏 {levelCards} thẻ
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all flex-shrink-0
                      ${isOpen ? 'text-white shadow-sm' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}
                      style={isOpen ? { background: cfg.grad } : {}}>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 sm:px-5" style={{ borderTop: `1.5px solid ${cfg.cardBorder}`, background: cfg.cardBg }}>
                      <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {level.exams.map(exam => {
                          const count = questionCounts[exam.id] || 0;
                          if (!count) return null;
                            const isGmetrix = exam.exam_type === 'gmetrix';
                            const purchase  = isSelfRegistered ? purchases[exam.id] : null;
                            const isPurchased = !isSelfRegistered || purchase?.status === 'SUCCESS';
                            const isPending   = isSelfRegistered && purchase && purchase.status !== 'SUCCESS';
                            return (
                              <div key={exam.id}
                                className="bg-white rounded-2xl p-4 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                                style={{ border: '1.5px solid #e2e8f0' }}>
                                <div className="flex items-start gap-2">
                                  <h3 className="text-sm font-semibold text-slate-800 leading-snug flex-1 line-clamp-2">{exam.title}</h3>
                                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border ${TYPE_BADGE[exam.exam_type]}`}>
                                      {isGmetrix ? '🎯' : '📝'} {isGmetrix ? 'Gmetrix' : 'Testing'}
                                    </span>
                                    {isSelfRegistered && (
                                      isPurchased
                                        ? <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold border border-emerald-200"><CheckCircle className="w-3 h-3" /> Đã mua</span>
                                        : <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold border border-amber-200"><Lock className="w-3 h-3" /> Chưa mua</span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-slate-400">
                                  <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{Math.floor(exam.duration_seconds/60)} phút</span>
                                  <span className="flex items-center gap-1.5 text-indigo-600 font-semibold"><Brain className="w-3 h-3" />{count} thẻ</span>
                                </div>
                                {isPurchased ? (
                                  <Link to={`/flashcard/${exam.id}`}
                                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-[0.97] transition-all mt-auto"
                                    style={{ background: cfg.btn }}>
                                    <Zap className="w-3.5 h-3.5" /> Ôn tập ngay <ChevronRight className="w-3.5 h-3.5 opacity-70" />
                                  </Link>
                                ) : (
                                  <button onClick={() => setPaymentExam(exam)}
                                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-white shadow-sm hover:shadow-md active:scale-[0.97] transition-all mt-auto bg-gradient-to-r from-amber-500 to-orange-400">
                                    {isPending ? <><Clock className="w-3.5 h-3.5" /> Chờ xác nhận</> : <><ShoppingCart className="w-3.5 h-3.5" /> Mua ngay &mdash; {new Intl.NumberFormat('vi-VN').format(exam.required_amount || 100000)}đ</>}
                                  </button>
                                )}
                              </div>
                            );
                        })}
                        {level.exams.every(e => !questionCounts[e.id]) && (
                          <div className="col-span-full py-8 text-center text-sm text-slate-400">
                            <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                            Chưa có câu hỏi nào trong cấp độ này.
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

      {/* Payment Modal */}
      {paymentExam && (
        <PaymentModal
          exam={paymentExam}
          onClose={() => setPaymentExam(null)}
          onSuccess={() => {
            fetchPurchases();
            setPaymentExam(null);
            navigate(`/flashcard/${paymentExam.id}`);
          }}
        />
      )}
    </div>
  );
};
