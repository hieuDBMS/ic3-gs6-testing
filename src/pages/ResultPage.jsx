import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  CheckCircle, XCircle, Clock, Calendar, ArrowLeft,
  RotateCcw, LayoutDashboard, Minus, ChevronDown, ChevronUp,
  Trophy, Target, Timer
} from 'lucide-react';
import { ZoomableImage } from '../components/shared/ImageLightbox';

/* ─── Helpers ─── */
const formatTime = (secs) => {
  if (!secs && secs !== 0) return '--';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
};

/* ─── Loading Skeleton ─── */
const ResultSkeleton = () => (
  <div className="min-h-screen bg-slate-50 animate-pulse">
    <div className="h-64 bg-gray-200" />
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
      {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl" />)}
    </div>
  </div>
);

/* ─── Score Ring ─── */
const ScoreRing = ({ score }) => {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  const isPassed = score >= 70;
  return (
    <svg width="140" height="140" className="-rotate-90">
      <circle cx="70" cy="70" r={r} strokeWidth="10" fill="none" stroke="rgba(255,255,255,0.2)" />
      <circle
        cx="70" cy="70" r={r}
        strokeWidth="10" fill="none"
        stroke="white"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease-out' }}
      />
    </svg>
  );
};

/* ─── Question Detail Card ─── */
const QuestionCard = ({ detail, index }) => {
  const [open, setOpen] = useState(!detail.is_correct); // expand wrong answers by default
  const q = detail.questions;
  if (!q) return null;

  const isCorrect = detail.is_correct;
  const isSkipped = !detail.selected_answer_ids?.length && !detail.dragdrop_response;

  const sortedAnswers = [...(q.answers || [])].sort((a, b) => a.order_index - b.order_index);
  const selectedIds = detail.selected_answer_ids || [];
  const sortedPairs = [...(q.dragdrop_pairs || [])].sort((a, b) => a.order_index - b.order_index);
  const ddResponse = detail.dragdrop_response || {};

  const statusBadge = isSkipped
    ? { label: 'Bỏ qua', icon: <Minus className="w-3.5 h-3.5" />, cls: 'bg-gray-100 text-gray-500' }
    : isCorrect
      ? { label: 'Đúng', icon: <CheckCircle className="w-3.5 h-3.5" />, cls: 'bg-emerald-100 text-emerald-700' }
      : { label: 'Sai', icon: <XCircle className="w-3.5 h-3.5" />, cls: 'bg-red-100 text-red-700' };

  const borderCls = isCorrect ? 'border-emerald-200' : isSkipped ? 'border-gray-200' : 'border-red-200';

  return (
    <div className={`bg-white rounded-2xl border-2 ${borderCls} overflow-hidden shadow-sm`}>
      {/* Header — always visible */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0 mt-0.5 ${statusBadge.cls}`}>
          {statusBadge.icon} {statusBadge.label}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
            Câu {index + 1} · {q.question_type === 'choice' ? 'Chọn một' : q.question_type === 'multi' ? 'Chọn nhiều' : 'Kéo thả'}
          </p>
          <p className="text-sm font-medium text-gray-900 line-clamp-2">{q.content}</p>
        </div>
        <span className="flex-shrink-0 mt-1 text-gray-400">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {/* Detail — collapsible */}
      {open && (
        <div className="px-5 pb-5 space-y-3 border-t border-gray-100">
          {/* Question image */}
          {q.image_url && (
            <ZoomableImage src={q.image_url} alt="" className="max-h-48 rounded-xl border border-gray-100 object-contain bg-gray-50 mt-3" />
          )}

          {/* Choice / Multi answers */}
          {(q.question_type === 'choice' || q.question_type === 'multi') && (
            <div className="space-y-2 mt-3">
              {sortedAnswers.map(ans => {
                const wasSelected = selectedIds.includes(ans.id);
                const isAnsCorrect = ans.is_correct;

                let style = 'border-gray-100 bg-gray-50 text-gray-500';
                if (wasSelected && isAnsCorrect) style = 'border-emerald-400 bg-emerald-50 text-emerald-800';
                else if (wasSelected && !isAnsCorrect) style = 'border-red-400 bg-red-50 text-red-800';
                else if (!wasSelected && isAnsCorrect) style = 'border-emerald-200 bg-emerald-50/60 text-emerald-700';

                return (
                  <div key={ans.id} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 text-sm ${style}`}>
                    <span className="flex-shrink-0 w-5 flex justify-center">
                      {wasSelected && isAnsCorrect && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                      {wasSelected && !isAnsCorrect && <XCircle className="w-4 h-4 text-red-500" />}
                      {!wasSelected && isAnsCorrect && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                      {!wasSelected && !isAnsCorrect && <div className="w-4 h-4 rounded-full border-2 border-gray-200" />}
                    </span>
                    {ans.image_url && (
                      <ZoomableImage src={ans.image_url} alt="" className="h-10 w-14 object-contain rounded-lg bg-white border border-gray-100 flex-shrink-0" />
                    )}
                    <span className="flex-1">{ans.content}</span>
                    <div className="flex gap-1.5 flex-shrink-0">
                      {wasSelected && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-white/70 border font-medium">Bạn chọn</span>
                      )}
                      {isAnsCorrect && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 border border-emerald-200 font-medium">Đáp án đúng</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {q.question_type === 'dragdrop' && (
            <div className="space-y-2 mt-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Kết quả xếp nhóm</p>
              {sortedPairs.map(pair => {
                const userZone = ddResponse[pair.id];
                const correctZone = pair.drop_content;
                const ok = userZone === correctZone;
                return (
                  <div key={pair.id} className={`rounded-xl border-2 overflow-hidden ${ok ? 'border-emerald-200' : 'border-red-200'}`}>
                    {/* Drag item - full width header */}
                    <div className={`px-3 py-2 flex items-center gap-2 ${ok ? 'bg-emerald-50' : 'bg-red-50'}`}>
                      {pair.drag_image_url && (
                        <img src={pair.drag_image_url} alt="" className="w-8 h-8 object-contain rounded flex-shrink-0" />
                      )}
                      <span className="text-sm font-medium text-gray-800 leading-snug flex-1 min-w-0">
                        {pair.drag_content}
                      </span>
                      <span className="flex-shrink-0">
                        {ok ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-400" />}
                      </span>
                    </div>
                    {/* Answer zones */}
                    <div className="px-3 py-2 bg-white flex flex-wrap gap-2 items-center">
                      <span className="text-[11px] text-gray-400 whitespace-nowrap">Bạn chọn:</span>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${ok ? 'bg-emerald-100 border-emerald-200 text-emerald-800' : 'bg-red-100 border-red-200 text-red-700'}`}>
                        {userZone || <em className="opacity-50 font-normal">Bỏ trống</em>}
                      </span>
                      {!ok && (
                        <>
                          <span className="text-[11px] text-gray-400 whitespace-nowrap">→ Đáp án đúng:</span>
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full border bg-emerald-100 border-emerald-200 text-emerald-800">
                            {pair.drop_image_url && <img src={pair.drop_image_url} alt="" className="h-4 w-auto inline mr-1 object-contain" />}
                            {correctZone}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── Main ResultPage ─── */
export const ResultPage = () => {
  const { examId } = useParams(); // actually attemptId
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(null);
  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'correct' | 'wrong' | 'skipped'

  useEffect(() => { fetchResult(); }, [examId]);

  const fetchResult = async () => {
    try {
      const { data: attemptData, error: attemptError } = await supabase
        .from('exam_attempts')
        .select('*, exams (id, title, exam_type, exam_number, exam_levels(label))')
        .eq('id', examId)
        .single();
      if (attemptError) throw attemptError;
      setAttempt(attemptData);

      const { data: ansData, error: ansError } = await supabase
        .from('attempt_answers')
        .select(`
          *,
          questions (
            id, content, image_url, question_type,
            answers ( id, content, image_url, is_correct, order_index ),
            dragdrop_pairs ( id, drag_content, drag_image_url, drop_content, drop_image_url, order_index )
          )
        `)
        .eq('attempt_id', examId)
        .order('created_at');
      if (ansError) throw ansError;
      setDetails(ansData || []);
    } catch (err) {
      console.error('Error fetching result:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ResultSkeleton />;
  if (!attempt) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        Không tìm thấy kết quả bài thi.
      </div>
    );
  }

  const score = Number(attempt.score) || 0;
  const isPassed = score >= 70;

  const correctCount = details.filter(d => d.is_correct).length;
  const wrongCount = details.filter(d => !d.is_correct && (d.selected_answer_ids?.length > 0 || d.dragdrop_response)).length;
  const skippedCount = details.filter(d => !d.selected_answer_ids?.length && !d.dragdrop_response).length;

  const examTitle = attempt.exams
    ? `${attempt.exams.exam_levels?.label} · ${attempt.exams.exam_type === 'testing' ? 'Testing' : 'Gmetrix'} ${attempt.exams.exam_number}`
    : 'Bài thi';

  const filteredDetails = details.filter(d => {
    if (filter === 'correct') return d.is_correct;
    if (filter === 'wrong') return !d.is_correct && (d.selected_answer_ids?.length > 0 || d.dragdrop_response);
    if (filter === 'skipped') return !d.selected_answer_ids?.length && !d.dragdrop_response;
    return true;
  });

  const FILTERS = [
    { key: 'all', label: `Tất cả (${details.length})` },
    { key: 'correct', label: `✓ Đúng (${correctCount})` },
    { key: 'wrong', label: `✗ Sai (${wrongCount})` },
    { key: 'skipped', label: `— Bỏ qua (${skippedCount})` },
  ];

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ─── Hero Score Banner ─── */}
      <div className={`relative overflow-hidden ${isPassed
        ? 'bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600'
        : 'bg-gradient-to-br from-red-500 via-rose-500 to-pink-600'
        }`}>
        {/* Decorative blobs */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-8 -left-8 w-48 h-48 rounded-full bg-white/10 blur-2xl" />

        <div className="relative max-w-3xl mx-auto px-4 py-10">
          {/* Top nav */}
          <div className="flex items-center justify-between mb-8">
            <Link to="/dashboard" className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium transition-colors">
              <ArrowLeft className="w-4 h-4" /> Về Dashboard
            </Link>
            <button
              onClick={() => navigate(`/exam/${attempt.exam_id}`)}
              className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Làm lại bài này
            </button>
          </div>

          {/* Score center */}
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
            {/* Ring */}
            <div className="relative flex-shrink-0">
              <ScoreRing score={score} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-white leading-none">{score.toFixed(0)}%</span>
                <span className="text-white/70 text-xs font-semibold mt-1">
                  {isPassed ? 'ĐẠT' : 'CHƯA ĐẠT'}
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="text-center sm:text-left text-white">
              <h1 className="text-2xl font-extrabold leading-tight mb-1">
                {isPassed ? '🎉 Chúc mừng! Bạn đã vượt qua.' : '😔 Rất tiếc, bạn chưa đạt.'}
              </h1>
              <p className="text-white/70 text-sm mb-5">{examTitle}</p>

              {/* Quick stats */}
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 bg-white/15 backdrop-blur rounded-xl px-3 py-2">
                  <Trophy className="w-4 h-4 text-yellow-300" />
                  <span className="text-sm font-bold text-white">{attempt.correct_count} / {attempt.total_questions}</span>
                  <span className="text-white/60 text-xs">câu đúng</span>
                </div>
                <div className="flex items-center gap-2 bg-white/15 backdrop-blur rounded-xl px-3 py-2">
                  <Timer className="w-4 h-4 text-white/70" />
                  <span className="text-sm font-bold text-white">{formatTime(attempt.time_spent_seconds)}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/15 backdrop-blur rounded-xl px-3 py-2">
                  <Calendar className="w-4 h-4 text-white/70" />
                  <span className="text-sm font-bold text-white">
                    {attempt.submitted_at
                      ? new Date(attempt.submitted_at).toLocaleDateString('vi-VN')
                      : '--'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative bg-black/10 backdrop-blur">
          <div className="max-w-3xl mx-auto px-4 grid grid-cols-3 divide-x divide-white/10">
            {[
              { label: 'Đúng', value: correctCount, color: 'text-emerald-200' },
              { label: 'Sai', value: wrongCount, color: 'text-red-200' },
              { label: 'Bỏ qua', value: skippedCount, color: 'text-white/60' },
            ].map(s => (
              <div key={s.label} className="py-4 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-white/50 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Detail Section ─── */}
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${filter === f.key
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Question cards */}
        <div className="space-y-4">
          {filteredDetails.length === 0 ? (
            <div className="text-center py-12 text-gray-400 font-medium">
              Không có câu hỏi nào phù hợp.
            </div>
          ) : (
            filteredDetails.map((detail, idx) => {
              const globalIdx = details.indexOf(detail);
              return <QuestionCard key={detail.id} detail={detail} index={globalIdx} />;
            })
          )}
        </div>

        {/* Bottom actions */}
        <div className="flex gap-4 justify-center pt-4 border-t border-gray-200">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-2xl text-sm font-semibold hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" /> Về Dashboard
          </Link>
          <button
            onClick={() => navigate(`/exam/${attempt.exam_id}`)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-2xl text-sm font-bold transition-all shadow-md shadow-indigo-200"
          >
            <RotateCcw className="w-4 h-4" /> Làm lại bài này
          </button>
        </div>
      </div>
    </div>
  );
};
