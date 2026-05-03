import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import {
  ExternalLink, Clock, Calendar, BookOpen,
  ChevronLeft, ChevronRight, Filter, X,
} from 'lucide-react';

const PAGE_SIZE = 8;

const formatTime = (secs) => {
  if (!secs && secs !== 0) return '--';
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
};

const AttemptSkeleton = () => (
  <div className="space-y-3 p-4 animate-pulse">
    {[1, 2, 3].map(i => (
      <div key={i} className="h-20 bg-gray-100 rounded-2xl" />
    ))}
  </div>
);

const Chip = ({ label, active, onClick, colorActive = 'bg-indigo-600 text-white border-indigo-600' }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all duration-150 ${
      active ? colorActive : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
    }`}
  >
    {label}
  </button>
);

export const AttemptHistoryTable = ({ studentId }) => {
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [passFilter, setPassFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showDate, setShowDate] = useState(false);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const hasActiveFilters = passFilter !== 'all' || typeFilter !== 'all' || dateFrom || dateTo;

  const resetFilters = () => {
    setPassFilter('all'); setTypeFilter('all');
    setDateFrom(''); setDateTo(''); setPage(0);
  };

  const setFilter = (setter, value) => { setter(value); setPage(0); };

  const fetchAttempts = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('exam_attempts')
        .select(`
          id, score, correct_count, total_questions, time_spent_seconds,
          started_at, submitted_at, status,
          exams ( id, title, exam_type, exam_number, exam_levels ( label ) )
        `, { count: 'exact' })
        .neq('status', 'in_progress')
        .order('started_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (studentId) query = query.eq('user_id', studentId);
      if (typeFilter !== 'all') query = query.eq('exams.exam_type', typeFilter);
      if (dateFrom) query = query.gte('started_at', dateFrom + 'T00:00:00');
      if (dateTo) query = query.lte('started_at', dateTo + 'T23:59:59');
      if (passFilter === 'pass') query = query.gte('score', 70);
      if (passFilter === 'fail') query = query.lt('score', 70);

      const { data, error, count } = await query;
      if (error) throw error;
      setAttempts(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error fetching attempts:', err);
    } finally {
      setLoading(false);
    }
  }, [studentId, page, passFilter, typeFilter, dateFrom, dateTo]);

  useEffect(() => { fetchAttempts(); }, [fetchAttempts]);

  return (
    <div>
      {/* ── Filter bar ── */}
      <div className="px-5 py-3 border-b border-gray-100 space-y-2.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Chip label="Tất cả" active={passFilter === 'all'} onClick={() => setFilter(setPassFilter, 'all')} />
            <Chip label="✓ Đạt" active={passFilter === 'pass'} onClick={() => setFilter(setPassFilter, 'pass')}
              colorActive="bg-emerald-600 text-white border-emerald-600" />
            <Chip label="✗ Chưa đạt" active={passFilter === 'fail'} onClick={() => setFilter(setPassFilter, 'fail')}
              colorActive="bg-red-500 text-white border-red-500" />
            <span className="w-px h-4 bg-gray-200 mx-1" />
            <Chip label="Tất cả loại" active={typeFilter === 'all'} onClick={() => setFilter(setTypeFilter, 'all')} />
            <Chip label="Testing" active={typeFilter === 'testing'} onClick={() => setFilter(setTypeFilter, 'testing')} />
            <Chip label="GMetrix" active={typeFilter === 'gmetrix'} onClick={() => setFilter(setTypeFilter, 'gmetrix')} />
          </div>

          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button onClick={resetFilters}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-semibold">
                <X className="w-3.5 h-3.5" /> Xóa lọc
              </button>
            )}
            <button onClick={() => setShowDate(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                showDate || dateFrom || dateTo
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'
              }`}>
              <Filter className="w-3.5 h-3.5" /> Ngày
            </button>
          </div>
        </div>

        {showDate && (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs text-gray-500 font-medium">Từ:</span>
            <input type="date" value={dateFrom}
              onChange={e => setFilter(setDateFrom, e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50" />
            <span className="text-xs text-gray-500 font-medium">Đến:</span>
            <input type="date" value={dateTo}
              onChange={e => setFilter(setDateTo, e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50" />
            {(dateFrom || dateTo) && (
              <button onClick={() => { setFilter(setDateFrom, ''); setFilter(setDateTo, ''); }}>
                <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Result count ── */}
      {!loading && (
        <div className="px-5 py-2 text-xs text-gray-400 font-medium border-b border-gray-50">
          {totalCount} kết quả{hasActiveFilters ? ' (đã lọc)' : ''}
          {totalPages > 1 && ` · Trang ${page + 1}/${totalPages}`}
        </div>
      )}

      {/* ── Rows ── */}
      {loading ? (
        <AttemptSkeleton />
      ) : attempts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-gray-400 space-y-3">
          <BookOpen className="w-10 h-10 text-gray-200" />
          <p className="text-sm font-medium">
            {hasActiveFilters ? 'Không có kết quả nào phù hợp.' : 'Chưa có bài thi nào được nộp.'}
          </p>
          {hasActiveFilters && (
            <button onClick={resetFilters} className="text-xs text-indigo-500 hover:underline">
              Xóa bộ lọc
            </button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {attempts.map((attempt) => {
            const score = Number(attempt.score) || 0;
            const isPassed = score >= 70;
            const examLabel = attempt.exams
              ? `${attempt.exams.exam_levels?.label || ''} · ${attempt.exams.exam_type === 'testing' ? 'Testing' : 'GMetrix'} ${attempt.exams.exam_number}`
              : 'Bài thi';

            return (
              <div key={attempt.id}
                className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors group">
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
                  <p className="text-sm font-bold text-gray-800 truncate">{attempt.exams?.title || 'Bài thi'}</p>
                  <p className="text-xs text-gray-400 truncate">{examLabel}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(attempt.started_at).toLocaleDateString('vi-VN')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(attempt.time_spent_seconds)}
                    </span>
                    <span className={`font-semibold ${isPassed ? 'text-emerald-500' : 'text-red-400'}`}>
                      {attempt.correct_count}/{attempt.total_questions} đúng
                    </span>
                  </div>
                </div>

                {/* Action */}
                <button
                  onClick={() => navigate(`/exam/${attempt.id}/result`)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 transition-colors opacity-0 group-hover:opacity-100">
                  <ExternalLink className="w-3.5 h-3.5" /> Xem kết quả
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
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
                    p === page ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'
                  }`}>
                  {p + 1}
                </button>
              );
            })}
          </div>

          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            Sau <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
