import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Timer } from '../components/exam/Timer';
import { QuestionNavigator } from '../components/exam/QuestionNavigator';
import { QuestionRenderer } from '../components/exam/QuestionRenderer';
import { Flag, ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle, X, BookOpen, RefreshCw, ShieldAlert } from 'lucide-react';

/* ─── Skeleton Loader ─── */
const ExamSkeleton = () => (
  <div className="h-screen bg-slate-50 flex flex-col animate-pulse overflow-hidden">
    <div className="h-16 flex-shrink-0 bg-white border-b border-gray-200 flex items-center px-6 gap-4">
      <div className="h-6 bg-gray-200 rounded-lg w-48" />
      <div className="ml-auto h-10 bg-gray-200 rounded-2xl w-32" />
    </div>
    <div className="flex-1 min-h-0 flex gap-6 p-6 max-w-7xl mx-auto w-full">
      <div className="flex-1 min-h-0 bg-white rounded-2xl shadow-sm p-6 space-y-4">
        <div className="h-5 bg-gray-200 rounded w-1/4" />
        <div className="h-8 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
        {[1, 2, 3, 4].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl" />)}
      </div>
      <div className="w-72 flex-shrink-0 space-y-4">
        <div className="h-48 bg-white rounded-2xl shadow-sm" />
        <div className="h-64 bg-white rounded-2xl shadow-sm" />
        <div className="h-20 bg-white rounded-2xl shadow-sm" />
      </div>
    </div>
  </div>
);

/* ─── Confirm Modal ─── */
const ConfirmModal = ({ onConfirm, onCancel, unansweredCount }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
    <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
      <button
        onClick={onCancel}
        className="absolute top-4 right-4 p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex flex-col items-center text-center space-y-3">
        {unansweredCount > 0 ? (
          <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
        )}

        <h2 className="text-xl font-bold text-gray-900">Xác nhận nộp bài</h2>

        {unansweredCount > 0 ? (
          <p className="text-sm text-gray-500 leading-relaxed">
            Bạn còn{' '}
            <span className="font-bold text-amber-600">{unansweredCount} câu chưa trả lời</span>.
            Bạn vẫn muốn nộp bài?
          </p>
        ) : (
          <p className="text-sm text-gray-500 leading-relaxed">
            Bạn đã trả lời tất cả câu hỏi. Xác nhận nộp bài?
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors text-sm"
        >
          Kiểm tra lại
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold hover:from-indigo-700 hover:to-violet-700 transition-all shadow-md shadow-indigo-200 text-sm"
        >
          Nộp bài ngay
        </button>
      </div>
    </div>
  </div>
);

/* ─── Refresh Warning Modal ─── */
const RefreshWarningModal = ({ onStay, onLeave }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
    {/* Backdrop */}
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

    {/* Modal card */}
    <div
      className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden"
      style={{ animation: 'refreshModalIn 0.25s cubic-bezier(0.34,1.56,0.64,1) both' }}
    >
      {/* Top accent gradient */}
      <div className="h-1.5 w-full bg-gradient-to-r from-orange-400 via-red-500 to-rose-500" />

      {/* Body */}
      <div className="p-7 space-y-5">
        {/* Icon + heading */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#fff7ed,#fee2e2)' }}
          >
            <ShieldAlert className="w-8 h-8 text-rose-500" />
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-extrabold text-gray-900 tracking-tight">
              Tải lại trang?
            </h2>
            <p className="text-xs font-semibold uppercase tracking-widest text-rose-400">
              Cảnh báo quan trọng
            </p>
          </div>
        </div>

        {/* Warning message */}
        <div
          className="rounded-2xl p-4 space-y-2 text-sm"
          style={{ background: 'linear-gradient(135deg,#fff7ed,#fef2f2)' }}
        >
          <p className="font-semibold text-orange-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            Bài làm sẽ bị mất toàn bộ!
          </p>
          <ul className="text-gray-600 space-y-1 pl-6 list-disc leading-relaxed">
            <li>Tất cả câu trả lời đã chọn sẽ biến mất</li>
            <li>Thời gian đang chạy không được lưu lại</li>
            <li>Bạn phải bắt đầu lại từ đầu</li>
          </ul>
        </div>

        {/* Buttons */}
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
            style={{
              background: 'linear-gradient(135deg,#f97316,#ef4444)',
              boxShadow: '0 4px 14px rgba(239,68,68,0.35)'
            }}
          >
            Tiếp tục làm bài
          </button>
        </div>
      </div>
    </div>

    <style>{`
      @keyframes refreshModalIn {
        from { opacity: 0; transform: scale(0.85) translateY(12px); }
        to   { opacity: 1; transform: scale(1)   translateY(0);     }
      }
    `}</style>
  </div>
);

/* ─── Main ExamPage ─── */
export const ExamPage = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [attemptId, setAttemptId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showRefreshWarning, setShowRefreshWarning] = useState(false);
  const pendingReloadRef = useRef(false);

  // Ref to read remaining time from Timer on submit
  const timerRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  useEffect(() => { initExam(); }, [examId]);

  // ── Intercept F5 / Ctrl+R to show custom popup ──
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isF5 = e.key === 'F5';
      const isCtrlR = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r';
      if (isF5 || isCtrlR) {
        e.preventDefault();
        e.stopPropagation();
        setShowRefreshWarning(true);
      }
    };

    // Fallback: browser native dialog (tab close, address-bar navigation, etc.)
    const handleBeforeUnload = (e) => {
      if (!pendingReloadRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const initExam = async () => {
    try {
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*, exam_levels(label)')
        .eq('id', examId)
        .single();
      if (examError) throw examError;
      setExam(examData);

      const { data: qData, error: qError } = await supabase
        .from('questions')
        .select(`
          id, content, image_url, question_type, order_index,
          answers ( id, content, image_url, order_index ),
          dragdrop_pairs ( id, drag_content, drag_image_url, drop_content, drop_image_url, order_index )
        `)
        .eq('exam_id', examId)
        .order('order_index');
      if (qError) throw qError;
      setQuestions(qData || []);

      const { data: attempt, error: attemptError } = await supabase
        .from('exam_attempts')
        .insert({
          user_id: user.id,
          exam_id: examId,
          total_questions: qData?.length || 0,
          status: 'in_progress'
        })
        .select()
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
    setSubmitting(true);
    setShowConfirm(false);
    try {
      const timeLeft = timerRef.current?.getTimeLeft?.() ?? 0;
      const timeSpent = Math.max(0, (exam?.duration_seconds ?? 0) - timeLeft) ||
        Math.floor((Date.now() - startTimeRef.current) / 1000);

      const { data: correctAnswers } = await supabase
        .from('answers')
        .select('id, question_id, is_correct');

      const { data: dragDropPairs } = await supabase
        .from('dragdrop_pairs')
        .select('*');

      let correctCount = 0;
      const payload = [];

      for (const q of questions) {
        const userAnswer = answers[q.id];
        let isCorrect = false;

        if (q.question_type === 'choice' || q.question_type === 'multi') {
          const correctIds = (correctAnswers || [])
            .filter(a => a.question_id === q.id && a.is_correct)
            .map(a => a.id);

          if (userAnswer && Array.isArray(userAnswer)) {
            if (q.question_type === 'multi') {
              isCorrect = JSON.stringify([...userAnswer].sort()) === JSON.stringify([...correctIds].sort());
            } else {
              isCorrect = correctIds.includes(userAnswer[0]);
            }
          }
          payload.push({
            attempt_id: attemptId,
            question_id: q.id,
            selected_answer_ids: userAnswer || [],
            dragdrop_response: null,
            is_correct: isCorrect
          });
        } else if (q.question_type === 'dragdrop') {
          const pairs = (dragDropPairs || []).filter(p => p.question_id === q.id);
          if (userAnswer) {
            isCorrect = pairs.every(pair => userAnswer[pair.id] === pair.drop_content);
          }
          payload.push({
            attempt_id: attemptId,
            question_id: q.id,
            selected_answer_ids: null,
            dragdrop_response: userAnswer || {},
            is_correct: isCorrect
          });
        }

        if (isCorrect) correctCount++;
      }

      const score = questions.length > 0 ? (correctCount / questions.length) * 100 : 0;

      await supabase.from('exam_attempts').update({
        status: isAutoSubmit ? 'auto_submitted' : 'submitted',
        submitted_at: new Date().toISOString(),
        time_spent_seconds: timeSpent,
        correct_count: correctCount,
        score
      }).eq('id', attemptId);

      if (payload.length > 0) {
        await supabase.from('attempt_answers').insert(payload);
      }

      navigate(`/exam/${attemptId}/result`);
    } catch (error) {
      console.error('Error submitting:', error);
      alert('Lỗi khi nộp bài!');
    } finally {
      setSubmitting(false);
    }
  }, [answers, attemptId, questions, navigate, exam]);

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

  const currentQ = questions[currentIndex];
  const isFlagged = flagged.includes(currentQ.id);
  const answeredCount = Object.keys(answers).length;
  const unanswered = questions.length - answeredCount;

  const examLabel = exam.exam_levels?.label
    ? `${exam.exam_levels.label} · ${exam.exam_type === 'testing' ? 'Testing' : 'Gmetrix'} ${exam.exam_number}`
    : exam.title;

  return (
    /*
     * Layout strategy:
     *   mobile  → min-h-screen, normal page scroll, sticky header keeps timer visible
     *   desktop → h-screen overflow-hidden, body splits into 2 internal-scroll panels
     *             → header never scrolls off screen → timer always visible
     */
    <div className="min-h-screen md:h-screen bg-slate-50 flex flex-col md:overflow-hidden">
      {/* Refresh Warning Modal */}
      {showRefreshWarning && (
        <RefreshWarningModal
          onStay={() => setShowRefreshWarning(false)}
          onLeave={() => {
            pendingReloadRef.current = true;
            setShowRefreshWarning(false);
            window.location.reload();
          }}
        />
      )}

      {/* Confirm Submit Modal */}
      {showConfirm && (
        <ConfirmModal
          unansweredCount={unanswered}
          onConfirm={() => doSubmit(false)}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      {/* ── Header ── always visible (sticky on mobile, flex-shrink-0 on desktop) */}
      <header className="sticky top-0 z-30 flex-shrink-0 bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          {/* Exam info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide leading-none">Đang làm bài</p>
              <h1 className="text-sm font-bold text-gray-900 truncate">{examLabel}</h1>
            </div>
          </div>

          {/* Progress pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full text-xs font-semibold text-gray-600">
            <span className="text-indigo-600">{answeredCount}</span>
            <span className="text-gray-300">/</span>
            <span>{questions.length}</span>
            <span className="text-gray-400">câu</span>
          </div>

          {/*
           * Timer compact pill — primary timer for all devices.
           * Placed in the sticky header so it is always visible without covering content.
           */}
          <div className="ml-auto">
            <Timer
              ref={timerRef}
              durationSeconds={exam.duration_seconds}
              onTimeUp={() => doSubmit(true)}
              variant="compact"
            />
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex-1 min-h-0 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex flex-col md:flex-row gap-6">

        {/* ── Main question panel ── */}
        <div className="flex-1 min-h-0 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

          {/* Question header */}
          <div className="flex-shrink-0 px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-600 text-white text-sm font-bold">
                {currentIndex + 1}
              </span>
              <span className="text-sm text-gray-400 font-medium">/ {questions.length}</span>
              <span className="hidden sm:inline text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-semibold border border-indigo-100">
                {currentQ.question_type === 'choice' ? 'Chọn một'
                  : currentQ.question_type === 'multi' ? 'Chọn nhiều'
                    : 'Kéo thả'}
              </span>
            </div>
            <button
              onClick={toggleFlag}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${isFlagged
                ? 'bg-amber-50 border-amber-200 text-amber-600'
                : 'bg-white border-gray-200 text-gray-400 hover:border-amber-200 hover:text-amber-500'
                }`}
            >
              <Flag className={`w-3.5 h-3.5 ${isFlagged ? 'fill-amber-400' : ''}`} />
              {isFlagged ? 'Đã đánh dấu' : 'Đánh dấu'}
            </button>
          </div>

          {/* Question content — scrolls internally on desktop */}
          <div className="flex-1 min-h-0 p-6 overflow-y-auto">
            <QuestionRenderer
              question={currentQ}
              currentAnswer={answers[currentQ.id]}
              onChange={handleAnswerChange}
            />
          </div>

          {/* Navigation footer */}
          <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 bg-slate-50 flex items-center justify-between gap-3">
            <button
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 bg-white hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Trước
            </button>

            {/* Mobile progress */}
            <span className="sm:hidden text-sm font-medium text-gray-500">
              {currentIndex + 1} / {questions.length}
            </span>

            <button
              onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
              disabled={currentIndex === questions.length - 1}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Tiếp <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Sidebar ── scrolls independently on desktop */}
        <div className="w-full md:w-72 flex-shrink-0 flex flex-col gap-4 md:min-h-0">

          <div className="flex-1 min-h-0 flex flex-col">
            <QuestionNavigator
              questions={questions}
              currentIndex={currentIndex}
              answers={answers}
              flagged={flagged}
              onSelect={setCurrentIndex}
            />
          </div>

          {/* Submit card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3 flex-shrink-0">
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="bg-emerald-50 rounded-xl py-2 px-3">
                <p className="text-xl font-bold text-emerald-600">{answeredCount}</p>
                <p className="text-emerald-500">Đã làm</p>
              </div>
              <div className="bg-gray-50 rounded-xl py-2 px-3">
                <p className="text-xl font-bold text-gray-400">{unanswered}</p>
                <p className="text-gray-400">Chưa làm</p>
              </div>
            </div>

            <button
              onClick={() => setShowConfirm(true)}
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md shadow-emerald-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Đang nộp...</>
              ) : (
                <><CheckCircle2 className="w-4 h-4" /> Nộp bài</>
              )}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};


