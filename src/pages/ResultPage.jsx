import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import {
  CheckCircle, XCircle, Calendar, ArrowLeft,
  RotateCcw, LayoutDashboard, Minus, ChevronDown, ChevronUp,
  Trophy, Timer, Download
} from 'lucide-react';
import { ZoomableImage } from '../components/shared/ImageLightbox';
import { formatDurationLabel } from '../utils/format';
import { isPassed as checkPassed } from '../utils/scoreUtils';
import { generateCertificatePdf } from '../utils/certificate';
import { EmptyState } from '../components/shared/EmptyState';
import { Skeleton } from '../components/shared/Skeleton';
import { sanitizeHtml } from '../utils/sanitizeHtml';

/* ─── Loading Skeleton ─── */
const ResultSkeleton = () => (
  <div className="min-h-screen bg-slate-50 dark:bg-slate-900 animate-pulse">
    <div className="h-64 bg-gray-200 dark:bg-slate-700" />
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
      <Skeleton variant="card" count={3} className="h-32 bg-gray-100 dark:bg-slate-700" />
    </div>
  </div>
);

/* ─── Score Ring ─── */
const ScoreRing = ({ score }) => {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
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
  const { t } = useTranslation();
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
    ? { label: t('result.status.skipped'), icon: <Minus className="w-3.5 h-3.5" />, cls: 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-400' }
    : isCorrect
      ? { label: t('result.status.correct'), icon: <CheckCircle className="w-3.5 h-3.5" />, cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' }
      : { label: t('result.status.wrong'), icon: <XCircle className="w-3.5 h-3.5" />, cls: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' };

  const borderCls = isCorrect ? 'border-emerald-200 dark:border-emerald-800/60' : isSkipped ? 'border-gray-200 dark:border-slate-700' : 'border-red-200 dark:border-red-800/60';

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl border-2 ${borderCls} overflow-hidden shadow-sm`}>
      {/* Header — always visible */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start gap-4 px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors"
      >
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0 mt-0.5 ${statusBadge.cls}`}>
          {statusBadge.icon} {statusBadge.label}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-1">
            {t('result.questionNumber', { number: index + 1 })} · {q.question_type === 'choice' ? t('result.questionTypes.choice') : q.question_type === 'multi' ? t('result.questionTypes.multi') : q.question_type === 'truefalse' ? t('result.questionTypes.truefalse') : t('result.questionTypes.dragdrop')}
          </p>
          <div
            className="text-sm font-medium text-gray-900 dark:text-slate-100 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(q.content) }}
          />
        </div>
        <span className="flex-shrink-0 mt-1 text-gray-400 dark:text-slate-500">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {/* Detail — collapsible */}
      {open && (
        <div className="px-5 pb-5 space-y-3 border-t border-gray-100 dark:border-slate-700/60">
          {/* Question image */}
          {q.image_url && (
            <ZoomableImage src={q.image_url} alt="" className="max-h-48 rounded-xl border border-gray-100 dark:border-slate-700/60 object-contain bg-gray-50 dark:bg-slate-700/50 mt-3" />
          )}

          {/* Choice / Multi answers */}
          {(q.question_type === 'choice' || q.question_type === 'multi') && (
            <div className="space-y-2 mt-3">
              {sortedAnswers.map(ans => {
                const wasSelected = selectedIds.includes(ans.id);
                const isAnsCorrect = ans.is_correct;

                let style = 'border-gray-100 bg-gray-50 text-gray-500 dark:border-slate-700/60 dark:bg-slate-700/50 dark:text-slate-500';
                if (wasSelected && isAnsCorrect) style = 'border-emerald-400 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300';
                else if (wasSelected && !isAnsCorrect) style = 'border-red-400 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-950/40 dark:text-red-300';
                else if (!wasSelected && isAnsCorrect) style = 'border-emerald-200 bg-emerald-50/60 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300';

                return (
                  <div key={ans.id} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 text-sm ${style}`}>
                    <span className="flex-shrink-0 w-5 flex justify-center">
                      {wasSelected && isAnsCorrect && <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                      {wasSelected && !isAnsCorrect && <XCircle className="w-4 h-4 text-red-500 dark:text-red-400" />}
                      {!wasSelected && isAnsCorrect && <CheckCircle className="w-4 h-4 text-emerald-400 dark:text-emerald-500" />}
                      {!wasSelected && !isAnsCorrect && <div className="w-4 h-4 rounded-full border-2 border-gray-200 dark:border-slate-600" />}
                    </span>
                    {ans.image_url && (
                      <ZoomableImage src={ans.image_url} alt="" className="h-10 w-14 object-contain rounded-lg bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700/60 flex-shrink-0" />
                    )}
                    <span
                      className="flex-1 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(ans.content) }}
                    />
                    <div className="flex gap-1.5 flex-shrink-0">
                      {wasSelected && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-white/70 dark:bg-slate-800/70 border font-medium">{t('result.yourAnswer')}</span>
                      )}
                      {isAnsCorrect && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800/60 font-medium">{t('result.correctAnswer')}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {q.question_type === 'dragdrop' && (
            <div className="space-y-2 mt-3">
              <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wide">{t('result.groupingResult')}</p>
              {sortedPairs.map(pair => {
                const userZone = ddResponse[pair.id];
                const correctZone = pair.drop_content;
                const ok = userZone === correctZone;
                return (
                  <div key={pair.id} className={`rounded-xl border-2 overflow-hidden ${ok ? 'border-emerald-200 dark:border-emerald-800/60' : 'border-red-200 dark:border-red-800/60'}`}>
                    {/* Drag item - full width header */}
                    <div className={`px-3 py-2 flex items-center gap-2 ${ok ? 'bg-emerald-50 dark:bg-emerald-950/40' : 'bg-red-50 dark:bg-red-950/40'}`}>
                      {pair.drag_image_url && (
                        <img src={pair.drag_image_url} alt="" className="w-8 h-8 object-contain rounded flex-shrink-0" />
                      )}
                      <span className="text-sm font-medium text-gray-800 dark:text-slate-100 leading-snug flex-1 min-w-0">
                        {pair.drag_content}
                      </span>
                      <span className="flex-shrink-0">
                        {ok ? <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400 dark:text-red-400" />}
                      </span>
                    </div>
                    {/* Answer zones */}
                    <div className="px-3 py-2 bg-white dark:bg-slate-800 flex flex-wrap gap-2 items-center">
                      <span className="text-[11px] text-gray-400 dark:text-slate-500 whitespace-nowrap">{t('result.yourAnswerColon')}</span>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${ok ? 'bg-emerald-100 border-emerald-200 text-emerald-800 dark:bg-emerald-900/40 dark:border-emerald-800/60 dark:text-emerald-300' : 'bg-red-100 border-red-200 text-red-700 dark:bg-red-900/40 dark:border-red-800/60 dark:text-red-300'}`}>
                        {userZone || <em className="opacity-50 font-normal">{t('result.emptyAnswer')}</em>}
                      </span>
                      {!ok && (
                        <>
                          <span className="text-[11px] text-gray-400 dark:text-slate-500 whitespace-nowrap">{t('result.correctAnswerArrow')}</span>
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full border bg-emerald-100 border-emerald-200 text-emerald-800 dark:bg-emerald-900/40 dark:border-emerald-800/60 dark:text-emerald-300">
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

          {/* True/False result */}
          {q.question_type === 'truefalse' && (() => {
            const sortedStmts = [...(q.truefalse_statements || [])].sort((a, b) => a.order_index - b.order_index);
            const tfResponse = detail.dragdrop_response || {};
            return (
              <div className="space-y-2 mt-3">
                <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wide">{t('result.statementResult')}</p>
                {sortedStmts.map((stmt, si) => {
                  const userAnswer = tfResponse[stmt.id]; // true | false | undefined
                  const correctAnswer = stmt.is_true;
                  const answered = userAnswer !== undefined && userAnswer !== null;
                  const ok = answered && userAnswer === correctAnswer;
                  return (
                    <div key={stmt.id} className={`rounded-xl border-2 px-4 py-3 ${
                      !answered ? 'border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-700/50'
                      : ok ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/40'
                      : 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950/40'
                    }`}>
                      <div className="flex items-start gap-3">
                        <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          !answered ? 'bg-gray-200 text-gray-500 dark:bg-slate-700 dark:text-slate-400'
                          : ok ? 'bg-emerald-200 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : 'bg-red-200 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                        }`}>{si + 1}</span>
                        <div
                          className="text-sm text-gray-800 dark:text-slate-100 flex-1 leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: sanitizeHtml(stmt.content) }}
                        />
                        {ok ? <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                          : answered ? <XCircle className="w-4 h-4 text-red-400 dark:text-red-400 flex-shrink-0 mt-0.5" />
                          : <Minus className="w-4 h-4 text-gray-400 dark:text-slate-500 flex-shrink-0 mt-0.5" />}
                      </div>
                      <div className="mt-2 ml-9 flex flex-wrap gap-2 items-center">
                        <span className="text-[11px] text-gray-400 dark:text-slate-500">{t('result.yourAnswerColon')}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                          !answered ? 'bg-gray-100 border-gray-200 text-gray-400 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-500'
                          : userAnswer ? 'bg-emerald-100 border-emerald-200 text-emerald-700 dark:bg-emerald-900/40 dark:border-emerald-800/60 dark:text-emerald-300' : 'bg-red-100 border-red-200 text-red-700 dark:bg-red-900/40 dark:border-red-800/60 dark:text-red-300'
                        }`}>
                          {!answered ? t('result.notAnswered') : userAnswer ? t('result.status.correct') : t('result.status.wrong')}
                        </span>
                        <span className="text-[11px] text-gray-400 dark:text-slate-500">{t('result.correctAnswerColon')}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                          correctAnswer ? 'bg-emerald-100 border-emerald-200 text-emerald-700 dark:bg-emerald-900/40 dark:border-emerald-800/60 dark:text-emerald-300' : 'bg-red-100 border-red-200 text-red-700 dark:bg-red-900/40 dark:border-red-800/60 dark:text-red-300'
                        }`}>
                          {correctAnswer ? t('result.status.correct') : t('result.status.wrong')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Hotspot result */}
          {q.question_type === 'hotspot' && (() => {
            const sortedRegions = [...(q.hotspot_regions || [])].sort((a, b) => a.order_index - b.order_index);
            const userSelected = detail.selected_answer_ids || []; // array of region IDs
            return (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wide">{t('result.hotspotResult')}</p>
                {/* Image with colored overlays */}
                {q.image_url && (
                  <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
                    <img src={q.image_url} alt={t('result.hotspotImageAlt')} className="w-full h-auto block" draggable={false} />
                    {sortedRegions.map((r) => {
                      const userChose = userSelected.includes(r.id);
                      const isCorrect = r.is_correct;
                      let cls = 'border-2 ';
                      if (isCorrect && userChose) cls += 'border-emerald-500 bg-emerald-400/25'; // đúng & chọn
                      else if (isCorrect && !userChose) cls += 'border-emerald-500 bg-emerald-400/15 border-dashed'; // đúng nhưng không chọn
                      else if (!isCorrect && userChose) cls += 'border-red-500 bg-red-400/25'; // sai mà chọn
                      else cls += 'border-transparent'; // không liên quan
                      return (
                        <div
                          key={r.id}
                          style={{ left: `${r.x}%`, top: `${r.y}%`, width: `${r.width}%`, height: `${r.height}%` }}
                          className={`absolute rounded-sm ${cls} transition-all`}
                        >
                          {(userChose || isCorrect) && (
                            <span className={`absolute top-0.5 left-0.5 text-[9px] font-bold px-1 py-0.5 rounded leading-none ${
                              isCorrect && userChose ? 'bg-emerald-500 text-white'
                              : isCorrect ? 'bg-emerald-300 text-emerald-900'
                              : 'bg-red-500 text-white'
                            }`}>
                              {isCorrect ? (userChose ? '✔' : '✔?') : '✘'}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                {/* Legend */}
                <div className="flex flex-wrap gap-3 text-xs">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-500/50 border border-emerald-500 inline-block" />{t('result.legend.correctSelected')}</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm border-2 border-dashed border-emerald-500 inline-block" />{t('result.legend.correctNotSelected')}</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-400/50 border border-red-500 inline-block" />{t('result.legend.wrongSelected')}</span>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

/* ─── Main ResultPage ─── */
export const ResultPage = () => {
  const { t } = useTranslation();
  const { examId } = useParams(); // actually attemptId
  const navigate = useNavigate();
  const { profile } = useAuth();
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
            dragdrop_pairs ( id, drag_content, drag_image_url, drop_content, drop_image_url, order_index ),
            truefalse_statements ( id, content, is_true, order_index ),
            hotspot_regions ( id, x, y, width, height, is_correct, label, order_index )
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
      <div className="min-h-screen flex items-center justify-center text-red-500 dark:text-red-400 dark:bg-slate-900">
        {t('result.notFound')}
      </div>
    );
  }

  const score = Number(attempt.score) || 0;
  const isPassed = checkPassed(score);

  const correctCount = details.filter(d => d.is_correct).length;
  const wrongCount = details.filter(d => !d.is_correct && (d.selected_answer_ids?.length > 0 || d.dragdrop_response)).length;
  const skippedCount = details.filter(d => !d.selected_answer_ids?.length && !d.dragdrop_response).length;

  const examTitle = attempt.exams
    ? `${attempt.exams.exam_levels?.label} · ${attempt.exams.exam_type === 'testing' ? 'Testing' : 'Gmetrix'} ${attempt.exams.exam_number}`
    : t('result.defaultExamTitle');

  const filteredDetails = details.filter(d => {
    if (filter === 'correct') return d.is_correct;
    if (filter === 'wrong') return !d.is_correct && (d.selected_answer_ids?.length > 0 || d.dragdrop_response);
    if (filter === 'skipped') return !d.selected_answer_ids?.length && !d.dragdrop_response;
    return true;
  });

  const FILTERS = [
    { key: 'all', label: t('result.filters.all', { count: details.length }) },
    { key: 'correct', label: t('result.filters.correct', { count: correctCount }) },
    { key: 'wrong', label: t('result.filters.wrong', { count: wrongCount }) },
    { key: 'skipped', label: t('result.filters.skipped', { count: skippedCount }) },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">

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
              <ArrowLeft className="w-4 h-4" /> {t('result.backToDashboard')}
            </Link>
            <button
              onClick={() => navigate(`/exam/${attempt.exam_id}`)}
              className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> {t('result.retakeExam')}
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
                  {isPassed ? t('result.passed') : t('result.notPassed')}
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="text-center sm:text-left text-white">
              <h1 className="text-2xl font-extrabold leading-tight mb-1">
                {isPassed ? t('result.congrats') : t('result.sorry')}
              </h1>
              <p className="text-white/70 text-sm mb-5">{examTitle}</p>

              {/* Quick stats */}
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 bg-white/15 backdrop-blur rounded-xl px-3 py-2">
                  <Trophy className="w-4 h-4 text-yellow-300" />
                  <span className="text-sm font-bold text-white">{attempt.correct_count} / {attempt.total_questions}</span>
                  <span className="text-white/60 text-xs">{t('result.correctAnswersCount')}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/15 backdrop-blur rounded-xl px-3 py-2">
                  <Timer className="w-4 h-4 text-white/70" />
                  <span className="text-sm font-bold text-white">{formatDurationLabel(attempt.time_spent_seconds)}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/15 backdrop-blur rounded-xl px-3 py-2">
                  <Calendar className="w-4 h-4 text-white/70 flex-shrink-0" />
                  <div className="flex flex-col leading-tight">
                    <span className="text-sm font-bold text-white">
                      {attempt.submitted_at
                        ? new Date(attempt.submitted_at).toLocaleDateString('vi-VN', {
                            timeZone: 'Asia/Ho_Chi_Minh',
                            day: '2-digit', month: '2-digit', year: 'numeric',
                          })
                        : '--'}
                    </span>
                    <span className="text-[11px] text-white/70 font-medium">
                      {attempt.submitted_at
                        ? new Date(attempt.submitted_at).toLocaleTimeString('vi-VN', {
                            timeZone: 'Asia/Ho_Chi_Minh',
                            hour: '2-digit', minute: '2-digit', hour12: false,
                          })
                        : ''}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative bg-black/10 backdrop-blur">
          <div className="max-w-3xl mx-auto px-4 grid grid-cols-3 divide-x divide-white/10">
            {[
              { label: t('result.status.correct'), value: correctCount, color: 'text-emerald-200' },
              { label: t('result.status.wrong'), value: wrongCount, color: 'text-red-200' },
              { label: t('result.status.skipped'), value: skippedCount, color: 'text-white/60' },
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
                  : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:border-indigo-500'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Question cards */}
        <div className="space-y-4">
          {filteredDetails.length === 0 ? (
            <EmptyState title={t('result.noQuestionsMatch')} />
          ) : (
            filteredDetails.map((detail) => {
              const globalIdx = details.indexOf(detail);
              return <QuestionCard key={detail.id} detail={detail} index={globalIdx} />;
            })
          )}
        </div>

        {/* Bottom actions */}
        <div className="flex flex-wrap gap-4 justify-center pt-4 border-t border-gray-200 dark:border-slate-700">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-2xl text-sm font-semibold hover:bg-gray-50 hover:border-gray-300 transition-colors dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700/40 dark:hover:border-slate-600"
          >
            <LayoutDashboard className="w-4 h-4" /> {t('result.backToDashboard')}
          </Link>
          <button
            onClick={() => navigate(`/exam/${attempt.exam_id}`)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-2xl text-sm font-bold transition-all shadow-md shadow-indigo-200"
          >
            <RotateCcw className="w-4 h-4" /> {t('result.retakeExam')}
          </button>
          {isPassed && (
            <button
              onClick={() => generateCertificatePdf({
                studentName: profile?.full_name,
                examLabel: examTitle,
                scorePct: score,
                submittedAtISO: attempt.submitted_at,
                attemptId: attempt.id,
              })}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl text-sm font-bold transition-all shadow-md shadow-emerald-200"
            >
              <Download className="w-4 h-4" /> {t('result.downloadCertificate')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
