import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Timer } from '../components/exam/Timer';
import { QuestionNavigator } from '../components/exam/QuestionNavigator';
import { QuestionRenderer } from '../components/exam/QuestionRenderer';
import {
  Flag, CheckCircle2, AlertTriangle, X,
  BookOpen, ShieldAlert, Send, LayoutGrid,
  ChevronLeft, ChevronRight, Maximize, Minimize,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────
   useExamFullscreen hook
   — calls requestFullscreen() on the exam container
   — navbar disappears because it's outside the fullscreen element
───────────────────────────────────────────────────────── */
const useExamFullscreen = (ref) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
    };
  }, []);

  const toggle = useCallback(() => {
    if (!document.fullscreenElement) {
      // Request fullscreen on the exam container itself
      const el = ref.current;
      if (!el) return;
      (el.requestFullscreen?.() ||
       el.webkitRequestFullscreen?.() ||
       Promise.resolve()).catch(() => {});
    } else {
      (document.exitFullscreen?.() ||
       document.webkitExitFullscreen?.() ||
       Promise.resolve()).catch(() => {});
    }
  }, [ref]);

  return { isFullscreen, toggle };
};

/* ─────────────────────────────────────────────────────────
   Skeleton
───────────────────────────────────────────────────────── */
const ExamSkeleton = () => (
  <div className="flex flex-col md:flex-row overflow-hidden animate-pulse" style={{ height: 'calc(100vh - 64px)' }}>
    {/* Aside Skeleton (top bar on mobile, left column on desktop) */}
    <div className="flex-shrink-0 bg-slate-800 flex items-center px-4 h-14 md:h-full md:w-[280px] md:flex-col md:px-0" />
    
    {/* Main Content Skeleton */}
    <div className="flex-1 flex flex-col bg-[#EEF2FF]">
      <div className="h-[3px] bg-slate-200" />
      <div className="h-16 bg-white border-b border-gray-100 flex-shrink-0" />
      <div className="flex-1 p-5 md:p-8 space-y-5">
        <div className="h-6 bg-gray-200 rounded-xl w-2/3" />
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-14 bg-white rounded-2xl border-2 border-gray-100" />
        ))}
      </div>
      <div className="h-16 bg-white border-t border-gray-100 flex-shrink-0" />
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────
   Confirm Submit Modal
───────────────────────────────────────────────────────── */
const ConfirmModal = ({ onConfirm, onCancel, unansweredCount }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={onCancel} />
    <div
      className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden"
      style={{ animation: 'modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1) both' }}
    >
      {/* Top accent */}
      <div className={`h-1.5 w-full ${unansweredCount > 0
        ? 'bg-gradient-to-r from-amber-400 to-orange-500'
        : 'bg-gradient-to-r from-emerald-400 to-teal-500'}`}
      />

      <div className="p-7 space-y-5">
        {/* Icon + title */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${unansweredCount > 0 ? 'bg-amber-50' : 'bg-emerald-50'}`}>
            {unansweredCount > 0
              ? <AlertTriangle className="w-8 h-8 text-amber-500" />
              : <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            }
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Xác nhận nộp bài</h2>
            {unansweredCount > 0 ? (
              <p className="text-sm text-gray-500 mt-1">
                Còn <span className="font-bold text-amber-600">{unansweredCount} câu chưa trả lời</span>. Bạn vẫn muốn nộp?
              </p>
            ) : (
              <p className="text-sm text-gray-500 mt-1">
                Bạn đã trả lời tất cả câu hỏi. Xác nhận nộp bài?
              </p>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors text-sm"
          >
            Kiểm tra lại
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all"
            style={{
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
            }}
          >
            <Send className="w-4 h-4" /> Nộp bài
          </button>
        </div>
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────
   Refresh Warning Modal (preserved from original)
───────────────────────────────────────────────────────── */
const RefreshWarningModal = ({ onStay, onLeave }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
    <div
      className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden"
      style={{ animation: 'refreshModalIn 0.25s cubic-bezier(0.34,1.56,0.64,1) both' }}
    >
      <div className="h-1.5 w-full bg-gradient-to-r from-orange-400 via-red-500 to-rose-500" />
      <div className="p-7 space-y-5">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#fff7ed,#fee2e2)' }}>
            <ShieldAlert className="w-8 h-8 text-rose-500" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-extrabold text-gray-900 tracking-tight">Tải lại trang?</h2>
            <p className="text-xs font-semibold uppercase tracking-widest text-rose-400">Cảnh báo quan trọng</p>
          </div>
        </div>
        <div className="rounded-2xl p-4 space-y-2 text-sm" style={{ background: 'linear-gradient(135deg,#fff7ed,#fef2f2)' }}>
          <p className="font-semibold text-orange-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" /> Bài làm sẽ bị mất toàn bộ!
          </p>
          <ul className="text-gray-600 space-y-1 pl-6 list-disc leading-relaxed">
            <li>Tất cả câu trả lời đã chọn sẽ biến mất</li>
            <li>Thời gian đang chạy không được lưu lại</li>
            <li>Bạn phải bắt đầu lại từ đầu</li>
          </ul>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onLeave}
            className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-500 text-sm font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all"
          >
            Vẫn tải lại
          </button>
          <button
            onClick={onStay}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold transition-all shadow-lg"
            style={{ background: 'linear-gradient(135deg,#f97316,#ef4444)', boxShadow: '0 4px 14px rgba(239,68,68,0.35)' }}
          >
            Tiếp tục làm bài
          </button>
        </div>
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────
   Mobile Navigator Bottom Sheet
───────────────────────────────────────────────────────── */
const MobileNavSheet = ({ questions, currentIndex, answers, flagged, onSelect, onClose }) => (
  <div className="fixed inset-0 z-50 flex flex-col justify-end">
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
    <div
      className="relative bg-white rounded-t-3xl shadow-2xl max-h-[65vh] flex flex-col"
      style={{ animation: 'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1) both' }}
    >
      {/* Handle */}
      <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
        <div className="w-10 h-1 rounded-full bg-gray-300" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
        <h3 className="font-bold text-gray-900 text-sm">Danh sách câu hỏi</h3>
        <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
          <X className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Navigator */}
      <div className="overflow-y-auto flex-1">
        <QuestionNavigator
          questions={questions}
          currentIndex={currentIndex}
          answers={answers}
          flagged={flagged}
          onSelect={(i) => { onSelect(i); onClose(); }}
        />
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   MAIN EXAM PAGE
═══════════════════════════════════════════════════════════════ */
export const ExamPage = () => {
  const { examId }  = useParams();
  const navigate    = useNavigate();
  const { user, isSelfRegistered }    = useAuth();

  const [exam,              setExam]              = useState(null);
  const [questions,         setQuestions]         = useState([]);
  const [currentIndex,      setCurrentIndex]      = useState(0);
  const [answers,           setAnswers]           = useState({});
  const [flagged,           setFlagged]           = useState([]);
  const [loading,           setLoading]           = useState(true);
  const [submitting,        setSubmitting]        = useState(false);
  const [attemptId,         setAttemptId]         = useState(null);
  const [showConfirm,       setShowConfirm]       = useState(false);
  const [showRefreshWarn,   setShowRefreshWarn]   = useState(false);
  const [showMobileNav,     setShowMobileNav]     = useState(false);

  const pendingReloadRef  = useRef(false);
  const isSubmittingRef   = useRef(false);
  const timerRef          = useRef(null);
  const startTimeRef      = useRef(Date.now());
  const containerRef      = useRef(null);
  const { isFullscreen, toggle: toggleFullscreen } = useExamFullscreen(containerRef);

  /* ── Access check for self-registered users ── */
  useEffect(() => {
    if (!isSelfRegistered || !user || !examId) return;
    supabase.rpc('user_can_access_exam', { p_user_id: user.id, p_exam_id: examId })
      .then(({ data: canAccess }) => {
        if (!canAccess) {
          navigate('/exam', { replace: true, state: { toast: 'Bạn chưa mua bài thi này.' } });
        }
      });
  }, [isSelfRegistered, user, examId]);

  /* ── Init ── */
  useEffect(() => { initExam(); }, [examId]);

  /* ── Keyboard & beforeunload ── */
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isF5    = e.key === 'F5';
      const isCtrlR = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r';
      if (isF5 || isCtrlR) { e.preventDefault(); e.stopPropagation(); setShowRefreshWarn(true); return; }

      if (showConfirm || showRefreshWarn) return;

      const tag       = document.activeElement?.tagName ?? '';
      const inputType = (document.activeElement?.type ?? '').toLowerCase();

      // Block navigation for text-entry inputs (but NOT for radio/checkbox —
      // those get focused when the user clicks an answer, and we still want
      // arrow keys to navigate questions, not cycle through radio options).
      const isTextEntry = tag === 'TEXTAREA' || tag === 'SELECT'
        || (tag === 'INPUT' && !['radio', 'checkbox'].includes(inputType));
      if (isTextEntry) return;

      const isNext = e.key === 'ArrowRight' || e.key === 'ArrowDown'
        || e.key === 'Enter'
        || e.key === 'd' || e.key === 'D'
        || e.key === 's' || e.key === 'S';
      const isPrev = e.key === 'ArrowLeft' || e.key === 'ArrowUp'
        || e.key === 'a' || e.key === 'A'
        || e.key === 'w' || e.key === 'W';

      if (isNext || isPrev) {
        // Prevent radio/checkbox from responding to arrow keys
        e.preventDefault();
        if (isNext) setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1));
        else        setCurrentIndex(prev => Math.max(0, prev - 1));
      }
    };
    const handleBeforeUnload = (e) => {
      if (!pendingReloadRef.current) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [questions.length, showConfirm, showRefreshWarn]);

  const initExam = async () => {
    try {
      const [examResult, qResult] = await Promise.all([
        supabase
          .from('exams')
          .select('*, exam_levels(label)')
          .eq('id', examId)
          .single(),
        supabase
          .from('questions')
          .select(`
            id, content, image_url, question_type, order_index, hotspot_multi,
            answers ( id, content, image_url, is_correct, order_index ),
            dragdrop_pairs ( id, drag_content, drag_image_url, drop_content, drop_image_url, order_index ),
            truefalse_statements ( id, content, is_true, order_index ),
            hotspot_regions ( id, x, y, width, height, is_correct, label, order_index )
          `)
          .eq('exam_id', examId)
          .order('order_index'),
      ]);

      if (examResult.error) throw examResult.error;
      if (qResult.error)    throw qResult.error;

      setExam(examResult.data);
      setQuestions(qResult.data || []);

      const { data: attempt, error: attemptError } = await supabase
        .from('exam_attempts')
        .insert({
          user_id:         user.id,
          exam_id:         examId,
          total_questions: qResult.data?.length || 0,
          status:          'in_progress',
        })
        .select('id')
        .single();
      if (attemptError) throw attemptError;
      setAttemptId(attempt.id);
    } catch (error) {
      console.error('Failed to init exam:', error);
      navigate('/exam');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (val) => {
    const currentQ = questions[currentIndex];
    setAnswers(prev => {
      const next = { ...prev };
      if (val === undefined) delete next[currentQ.id];
      else next[currentQ.id] = val;
      return next;
    });
  };

  const toggleFlag = () => {
    const id = questions[currentIndex].id;
    setFlagged(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const doSubmit = useCallback(async (isAutoSubmit = false) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setSubmitting(true);
    setShowConfirm(false);

    try {
      const timeLeft  = timerRef.current?.getTimeLeft?.() ?? 0;
      const timeSpent = Math.max(0, (exam?.duration_seconds ?? 0) - timeLeft) ||
        Math.floor((Date.now() - startTimeRef.current) / 1000);

      const p_answers   = {};
      const p_tf_answers = {};
      const p_dd_answers = {};

      for (const q of questions) {
        const userAnswer = answers[q.id];
        if (userAnswer === undefined) continue;
        if (q.question_type === 'choice' || q.question_type === 'multi') {
          p_answers[q.id] = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
        } else if (q.question_type === 'hotspot') {
          p_answers[q.id] = Array.isArray(userAnswer) ? userAnswer : [];
        } else if (q.question_type === 'truefalse') {
          p_tf_answers[q.id] = userAnswer;
        } else if (q.question_type === 'dragdrop') {
          p_dd_answers[q.id] = userAnswer;
        }
      }

      const { data: result, error: rpcError } = await supabase.rpc('submit_exam_attempt', {
        p_attempt_id: attemptId,
        p_time_spent: timeSpent,
        p_answers:    p_answers,
        p_tf_answers: p_tf_answers,
        p_dd_answers: p_dd_answers,
        p_is_auto:    isAutoSubmit,
      });

      if (rpcError) throw rpcError;
      navigate(`/exam/${attemptId}/result`);
    } catch (error) {
      console.error('Error submitting:', error);
      if (error?.message?.includes('already_submitted')) {
        navigate(`/exam/${attemptId}/result`);
      } else {
        alert('Lỗi khi nộp bài! Vui lòng thử lại.');
        isSubmittingRef.current = false;
      }
    } finally {
      setSubmitting(false);
    }
  }, [answers, attemptId, questions, navigate, exam]);

  /* ── Guards ── */
  if (loading) return <ExamSkeleton />;

  if (!exam || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3 p-8">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto" />
          <p className="text-gray-500 font-medium">Bài thi này chưa có câu hỏi.</p>
        </div>
      </div>
    );
  }

  /* ── Computed ── */
  const currentQ     = questions[currentIndex];
  const isFlagged    = flagged.includes(currentQ.id);
  const answeredCount = Object.keys(answers).length;
  const unanswered   = questions.length - answeredCount;
  const progressPct  = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  const examLabel = exam.exam_levels?.label
    ? `${exam.exam_levels.label} · ${exam.exam_type === 'testing' ? 'Testing' : 'Gmetrix'} ${exam.exam_number}`
    : exam.title;

  const TYPE_LABEL = {
    choice:    'Chọn một',
    multi:     'Chọn nhiều',
    truefalse: 'Đúng / Sai',
    hotspot:   'Chọn vùng ảnh',
    dragdrop:  'Kéo thả',
  };
  const TYPE_COLOR = {
    choice:    'bg-indigo-100 text-indigo-700 border-indigo-200',
    multi:     'bg-violet-100 text-violet-700 border-violet-200',
    truefalse: 'bg-teal-100 text-teal-700 border-teal-200',
    hotspot:   'bg-orange-100 text-orange-700 border-orange-200',
    dragdrop:  'bg-blue-100 text-blue-700 border-blue-200',
  };

  /* ── Render ── */
  return (
    <div
      ref={containerRef}
      className="flex flex-col md:flex-row overflow-hidden"
      style={{
        background: '#EEF2FF',
        height: 'calc(100vh - 64px)',
        transform: 'translateZ(0)',
        willChange: 'contents',
      }}
    >

      {/* ═══ MODALS ═══ */}
      {showRefreshWarn && (
        <RefreshWarningModal
          onStay={() => setShowRefreshWarn(false)}
          onLeave={() => { pendingReloadRef.current = true; setShowRefreshWarn(false); window.location.reload(); }}
        />
      )}
      {showConfirm && (
        <ConfirmModal
          unansweredCount={unanswered}
          onConfirm={() => doSubmit(false)}
          onCancel={() => setShowConfirm(false)}
        />
      )}
      {showMobileNav && (
        <MobileNavSheet
          questions={questions}
          currentIndex={currentIndex}
          answers={answers}
          flagged={flagged}
          onSelect={setCurrentIndex}
          onClose={() => setShowMobileNav(false)}
        />
      )}

      {/* ═══════════════════════════════════════════════════════
          ASIDE — dark sidebar (desktop) / top bar (mobile)
      ═══════════════════════════════════════════════════════ */}
      <aside className="
        flex-shrink-0 bg-slate-900 z-20
        flex flex-row items-center gap-3 px-4
        md:flex-col md:w-[280px] md:h-full md:overflow-hidden md:px-0 md:gap-0
      ">

        {/* ── Branding — DESKTOP ONLY ── */}
        <div className="hidden md:flex items-center gap-3 px-5 h-[76px] flex-shrink-0 w-full border-b border-white/10">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Đang làm bài</p>
            <h1 className="text-sm font-bold text-white truncate mt-0.5">{examLabel}</h1>
          </div>
        </div>

        {/* ── Exam title — MOBILE ONLY ── */}
        <div className="flex md:hidden items-center gap-2 flex-1 min-w-0 py-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
            <BookOpen className="w-3.5 h-3.5 text-white" />
          </div>
          <p className="text-sm font-bold text-white truncate">{examLabel}</p>
        </div>

        {/* ── Timer — ONE INSTANCE, responsive internally ── */}
        <div className="md:px-5 md:py-5 md:w-full md:border-b md:border-white/10 md:flex-shrink-0 py-2">
          <Timer
            ref={timerRef}
            durationSeconds={exam.duration_seconds}
            onTimeUp={() => doSubmit(true)}
          />
        </div>

        {/* ── Question Navigator — DESKTOP ONLY ── */}
        <div className="hidden md:flex flex-1 min-h-0 flex-col w-full border-t border-white/10">
          <QuestionNavigator
            questions={questions}
            currentIndex={currentIndex}
            answers={answers}
            flagged={flagged}
            onSelect={setCurrentIndex}
            dark
          />
        </div>

        {/* ── Stats + Submit — DESKTOP ONLY ── */}
        <div className="hidden md:block p-5 border-t border-white/10 w-full flex-shrink-0">
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="rounded-xl py-2.5 text-center" style={{ background: 'rgba(16,185,129,0.12)' }}>
              <p className="text-xl font-bold text-emerald-400 leading-none">{answeredCount}</p>
              <p className="text-[10px] text-emerald-600/70 mt-0.5">Đã làm</p>
            </div>
            <div className="rounded-xl py-2.5 text-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <p className="text-xl font-bold leading-none" style={{ color: '#64748B' }}>{unanswered}</p>
              <p className="text-[10px] mt-0.5" style={{ color: '#475569' }}>Chưa làm</p>
            </div>
          </div>
          <button
            onClick={() => setShowConfirm(true)}
            disabled={submitting}
            className="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            style={{
              background: submitting ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #10B981, #059669)',
              boxShadow:  submitting ? 'none' : '0 4px 20px rgba(16,185,129,0.35)',
            }}
          >
            {submitting
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang nộp...</>
              : <><Send className="w-4 h-4" /> Nộp bài</>
            }
          </button>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════
          MAIN CONTENT
      ═══════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── Animated progress bar ── */}
        <div className="h-[3px] flex-shrink-0" style={{ background: 'rgba(203,213,225,0.6)' }}>
          <div
            className="h-full transition-all duration-700 ease-out"
            style={{
              width: `${progressPct}%`,
              background: 'linear-gradient(90deg, #6366F1, #8B5CF6, #A855F7)',
            }}
          />
        </div>

        {/* ── Question header bar ── */}
        <div className="flex-shrink-0 flex items-center gap-3 px-5 md:px-7 h-[73px] bg-white border-b border-gray-100 shadow-sm">
          {/* Number + counter */}
          <div className="flex items-center gap-2.5">
            <span
              className="w-9 h-9 rounded-xl text-white text-sm font-bold flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', boxShadow: '0 4px 12px rgba(99,102,241,0.35)' }}
            >
              {currentIndex + 1}
            </span>
            <span className="text-sm text-gray-400 font-medium hidden sm:inline">/ {questions.length}</span>
          </div>

          {/* Type badge */}
          <span className={`hidden sm:inline text-xs px-2.5 py-1 rounded-full font-semibold border ${TYPE_COLOR[currentQ.question_type] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
            {TYPE_LABEL[currentQ.question_type] || ''}
          </span>

          {/* Flag button */}
          <button
            onClick={toggleFlag}
            className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              isFlagged
                ? 'bg-amber-50 border-amber-300 text-amber-700 shadow-sm'
                : 'bg-white border-gray-200 text-gray-400 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50'
            }`}
          >
            <Flag className={`w-3.5 h-3.5 ${isFlagged ? 'fill-amber-400' : ''}`} />
            <span className="hidden sm:inline">{isFlagged ? 'Đã đánh dấu' : 'Đánh dấu'}</span>
          </button>

          {/* Fullscreen toggle */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Thoát toàn màn hình (F11)' : 'Toàn màn hình'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 border ${
              isFullscreen
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm'
                : 'bg-white border-gray-200 text-gray-400 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50'
            }`}
          >
            {isFullscreen
              ? <><Minimize className="w-3.5 h-3.5" /><span className="hidden sm:inline">Thu nhỏ</span></>
              : <><Maximize className="w-3.5 h-3.5" /><span className="hidden sm:inline">Toàn màn hình</span></>
            }
          </button>
        </div>

        {/* ── Question content (scrollable) ── */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-6 md:px-8 md:py-8" style={{ WebkitOverflowScrolling: 'touch' }}>
          {/* key triggers re-mount → animation plays on every question change */}
          <div key={currentIndex} style={{ animation: 'questionIn 0.22s ease-out both', willChange: 'opacity, transform' }}>
            <QuestionRenderer
              question={currentQ}
              currentAnswer={answers[currentQ.id]}
              onChange={handleAnswerChange}
            />
          </div>
        </div>

        {/* ── Navigation footer ── */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 md:px-7 py-3.5 bg-white border-t border-gray-100 gap-3">

          {/* Prev */}
          <button
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            title="Câu trước (←)"
            className="flex items-center gap-2 px-4 md:px-5 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 bg-white hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Trước</span>
          </button>

          {/* Mobile centre: counter + nav sheet + submit */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setShowMobileNav(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              {currentIndex + 1}/{questions.length}
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              disabled={submitting}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs font-bold disabled:opacity-50 transition-all"
              style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
            >
              <Send className="w-3.5 h-3.5" />
              Nộp
            </button>
          </div>

          {/* Desktop centre: keyboard hints */}
          <div className="hidden md:flex items-center gap-1.5 text-[11px] text-gray-400 select-none">
            <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-gray-100 border border-gray-200">←</kbd>
            <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-gray-100 border border-gray-200">→</kbd>
            <span className="text-gray-300">để chuyển câu</span>
          </div>

          {/* Next */}
          <button
            onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
            disabled={currentIndex === questions.length - 1}
            title="Câu tiếp theo (→)"
            className="flex items-center gap-2 px-4 md:px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={currentIndex === questions.length - 1
              ? { background: '#E5E7EB', color: '#9CA3AF' }
              : { background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#fff', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }
            }
          >
            <span className="hidden sm:inline">Tiếp</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ═══ Global animation keyframes ═══ */}
      <style>{`
        @keyframes questionIn {
          from { opacity: 0; transform: translate3d(0, 14px, 0); }
          to   { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.88) translate3d(0, 16px, 0); }
          to   { opacity: 1; transform: scale(1) translate3d(0, 0, 0); }
        }
        @keyframes slideUp {
          from { transform: translate3d(0, 100%, 0); }
          to   { transform: translate3d(0, 0, 0); }
        }
        @keyframes refreshModalIn {
          from { opacity: 0; transform: scale(0.85) translate3d(0, 12px, 0); }
          to   { opacity: 1; transform: scale(1) translate3d(0, 0, 0); }
        }
        /* Fullscreen: fill entire screen including notch areas */
        :fullscreen .exam-container,
        :-webkit-full-screen .exam-container {
          width: 100vw !important;
          height: 100vh !important;
        }
        /* Smooth scrollbar in fullscreen */
        :fullscreen *,
        :-webkit-full-screen * {
          scrollbar-width: thin;
        }
      `}</style>
    </div>
  );
};
