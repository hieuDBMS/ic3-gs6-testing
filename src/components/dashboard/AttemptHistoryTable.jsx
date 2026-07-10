import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ExternalLink, Clock, Calendar, BookOpen,
  ChevronLeft, ChevronRight, Filter, X, AlertTriangle,
} from 'lucide-react';
import { formatDurationLabel } from '../../utils/format';
import { useExamAttempts } from '../../hooks/useExamAttempts';
import { Skeleton } from '../shared/Skeleton';

const PAGE_SIZE = 8;

const formatDateTime = (isoString) => {
  if (!isoString) return '--';
  return new Date(isoString).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

const formatDateOnly = (isoString) => {
  if (!isoString) return '--';
  return new Date(isoString).toLocaleDateString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const AttemptSkeleton = () => (
  <div className="space-y-3 p-4">
    <Skeleton variant="card" count={3} className="h-20 bg-gray-100 dark:bg-slate-700" />
  </div>
);

const Chip = ({ label, active, onClick, colorActive = 'bg-indigo-600 text-white border-indigo-600' }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all duration-150 ${
      active ? colorActive : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500'
    }`}
  >
    {label}
  </button>
);

const AttemptHistoryTableImpl = ({ studentId, showCheatFlags = false }) => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [passFilter, setPassFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showDate, setShowDate] = useState(false);

  const { attempts, totalCount, cheatCounts, loading } = useExamAttempts(studentId, {
    excludeStatus: 'in_progress',
    examType: typeFilter !== 'all' ? typeFilter : undefined,
    dateFrom, dateTo, passFilter,
    page, pageSize: PAGE_SIZE,
    withCheatCounts: showCheatFlags,
  });

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const hasActiveFilters = passFilter !== 'all' || typeFilter !== 'all' || dateFrom || dateTo;

  const resetFilters = () => {
    setPassFilter('all'); setTypeFilter('all');
    setDateFrom(''); setDateTo(''); setPage(0);
  };

  const setFilter = (setter, value) => { setter(value); setPage(0); };

  return (
    <div>
      {/* ── Filter bar ── */}
      <div className="px-5 py-3 border-b border-gray-100 dark:border-slate-700 space-y-2.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Chip label="Tất cả" active={passFilter === 'all'} onClick={() => setFilter(setPassFilter, 'all')} />
            <Chip label="✓ Đạt" active={passFilter === 'pass'} onClick={() => setFilter(setPassFilter, 'pass')}
              colorActive="bg-emerald-600 text-white border-emerald-600" />
            <Chip label="✗ Chưa đạt" active={passFilter === 'fail'} onClick={() => setFilter(setPassFilter, 'fail')}
              colorActive="bg-red-500 text-white border-red-500" />
            <span className="w-px h-4 bg-gray-200 dark:bg-slate-600 mx-1" />
            <Chip label="Tất cả loại" active={typeFilter === 'all'} onClick={() => setFilter(setTypeFilter, 'all')} />
            <Chip label="Testing" active={typeFilter === 'testing'} onClick={() => setFilter(setTypeFilter, 'testing')} />
            <Chip label="GMetrix" active={typeFilter === 'gmetrix'} onClick={() => setFilter(setTypeFilter, 'gmetrix')} />
          </div>

          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button onClick={resetFilters}
                className="flex items-center gap-1 text-xs text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-semibold">
                <X className="w-3.5 h-3.5" /> Xóa lọc
              </button>
            )}
            <button onClick={() => setShowDate(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                showDate || dateFrom || dateTo
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-950/40 dark:border-indigo-800/60 dark:text-indigo-300'
                  : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-500'
              }`}>
              <Filter className="w-3.5 h-3.5" /> Ngày
            </button>
          </div>
        </div>

        {showDate && (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">Từ:</span>
            <input type="date" value={dateFrom}
              onChange={e => setFilter(setDateFrom, e.target.value)}
              className="text-xs border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50 dark:bg-slate-700/50 dark:text-slate-100" />
            <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">Đến:</span>
            <input type="date" value={dateTo}
              onChange={e => setFilter(setDateTo, e.target.value)}
              className="text-xs border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50 dark:bg-slate-700/50 dark:text-slate-100" />
            {(dateFrom || dateTo) && (
              <button onClick={() => { setFilter(setDateFrom, ''); setFilter(setDateTo, ''); }}>
                <X className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Result count ── */}
      {!loading && (
        <div className="px-5 py-2 text-xs text-gray-400 dark:text-slate-500 font-medium border-b border-gray-50 dark:border-slate-700/60">
          {totalCount} kết quả{hasActiveFilters ? ' (đã lọc)' : ''}
          {totalPages > 1 && ` · Trang ${page + 1}/${totalPages}`}
        </div>
      )}

      {/* ── Rows ── */}
      {loading ? (
        <AttemptSkeleton />
      ) : attempts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-gray-400 dark:text-slate-500 space-y-3">
          <BookOpen className="w-10 h-10 text-gray-200 dark:text-slate-600" />
          <p className="text-sm font-medium">
            {hasActiveFilters ? 'Không có kết quả nào phù hợp.' : 'Chưa có bài thi nào được nộp.'}
          </p>
          {hasActiveFilters && (
            <button onClick={resetFilters} className="text-xs text-indigo-500 dark:text-indigo-400 hover:underline">
              Xóa bộ lọc
            </button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-slate-700">
          {attempts.map((attempt) => {
            const score = Number(attempt.score) || 0;
            const isPassed = score >= 70;
            const examLabel = attempt.exams
              ? `${attempt.exams.exam_levels?.label || ''} · ${attempt.exams.exam_type === 'testing' ? 'Testing' : 'GMetrix'} ${attempt.exams.exam_number}`
              : 'Bài thi';

            return (
              <div key={attempt.id}
                className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors group">
                {/* Score badge */}
                <div className={`flex-shrink-0 w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-bold shadow-sm ${
                  isPassed
                    ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white'
                    : 'bg-gradient-to-br from-red-400 to-rose-500 text-white'
                }`}>
                  <span className="text-lg leading-none">{score.toFixed(0)}</span>
                  <span className="text-[10px] opacity-80 font-semibold">%</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-800 dark:text-slate-100 truncate">{attempt.exams?.title || 'Bài thi'}</p>
                    {showCheatFlags && cheatCounts[attempt.id] > 0 && (
                      <span className="flex-shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-bold border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800/60">
                        <AlertTriangle className="w-2.5 h-2.5" /> {cheatCounts[attempt.id]}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{examLabel}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 dark:text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDateOnly(attempt.started_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDurationLabel(attempt.time_spent_seconds)}
                    </span>
                    {attempt.submitted_at && (
                      <span className="flex items-center gap-1 text-gray-500 dark:text-slate-400">
                        <span className="text-gray-300 dark:text-slate-600">·</span>
                        Nộp lúc{' '}
                        <span className="font-semibold text-gray-600 dark:text-slate-300">
                          {new Date(attempt.submitted_at).toLocaleTimeString('vi-VN', {
                            timeZone: 'Asia/Ho_Chi_Minh',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                          })}
                        </span>
                      </span>
                    )}
                    <span className={`font-semibold ${isPassed ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-400 dark:text-red-400'}`}>
                      {attempt.correct_count}/{attempt.total_questions} đúng
                    </span>
                  </div>
                </div>

                {/* Action */}
                <button
                  onClick={() => navigate(`/exam/${attempt.id}/result`)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 transition-colors opacity-0 group-hover:opacity-100 dark:text-indigo-300 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 dark:border-indigo-800/60">
                  <ExternalLink className="w-3.5 h-3.5" /> Xem kết quả
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 dark:border-slate-700">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            <ChevronLeft className="w-4 h-4" /> Trước
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p;
              if (totalPages <= 5) p = i;
              else if (page < 3) p = i;
              else if (page > totalPages - 4) p = totalPages - 5 + i;
              else p = page - 2 + i;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                    p === page ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                  }`}>
                  {p + 1}
                </button>
              );
            })}
          </div>

          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            Sau <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export const AttemptHistoryTable = React.memo(AttemptHistoryTableImpl);
