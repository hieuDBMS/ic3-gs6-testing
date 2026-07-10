import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Activity, Users, AlertTriangle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { PageHeader } from '../components/shared/PageHeader';
import { EmptyState } from '../components/shared/EmptyState';

const PAGE_SIZE = 12;
// No exam on the platform runs longer than this — used as a server-side
// floor so we never fetch/join the full history of abandoned `in_progress`
// rows (students who closed the tab without submitting pile up over months).
const MAX_EXAM_DURATION_SECONDS = 6000;
const GRACE_SECONDS = 120; // buffer for the final ping / auto-submit round-trip

const fmtElapsed = (startedAt, now) => {
  const secs = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
};

const fmtAgo = (isoString, now) => {
  if (!isoString) return '--';
  const secs = Math.max(0, Math.floor((now - new Date(isoString).getTime()) / 1000));
  if (secs < 5) return 'vừa xong';
  if (secs < 60) return `${secs}s trước`;
  return `${Math.floor(secs / 60)}p trước`;
};

export const LiveMonitorPage = () => {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [page, setPage] = useState(0);
  const debounceRef = useRef(null);

  const fetchLive = useCallback(async () => {
    // Server-side floor: never fetch attempts older than the longest exam
    // on the platform could possibly still be running — this is what keeps
    // months of abandoned `in_progress` rows out of the query entirely.
    const cutoffISO = new Date(Date.now() - (MAX_EXAM_DURATION_SECONDS + GRACE_SECONDS) * 1000).toISOString();

    const { data: attemptRows } = await supabase
      .from('exam_attempts')
      .select(`
        id, user_id, current_question_index, total_questions, started_at, last_activity_at,
        profiles ( full_name ),
        exams ( title, exam_type, exam_number, duration_seconds, exam_levels ( label ) )
      `)
      .eq('status', 'in_progress')
      .gte('started_at', cutoffISO)
      .order('started_at', { ascending: false });

    // Precise per-exam cutoff (each exam has its own duration_seconds) —
    // an attempt whose allotted time has already elapsed isn't "live"
    // anymore even if it never got auto-submitted (e.g. tab closed).
    const nowMs = Date.now();
    const rows = (attemptRows || []).filter(r => {
      const durationMs = ((r.exams?.duration_seconds ?? MAX_EXAM_DURATION_SECONDS) + GRACE_SECONDS) * 1000;
      return nowMs - new Date(r.started_at).getTime() < durationMs;
    });

    let cheatCounts = {};
    if (rows.length) {
      const { data: cheatRows } = await supabase
        .from('exam_cheat_events')
        .select('attempt_id')
        .in('attempt_id', rows.map(r => r.id));
      cheatCounts = (cheatRows || []).reduce((acc, r) => {
        acc[r.attempt_id] = (acc[r.attempt_id] || 0) + 1;
        return acc;
      }, {});
    }

    setAttempts(rows.map(r => ({ ...r, cheatCount: cheatCounts[r.id] || 0 })));
    setLoading(false);
  }, []);

  const scheduleRefetch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchLive, 500);
  }, [fetchLive]);

  useEffect(() => {
    fetchLive();

    const channel = supabase
      .channel('exam-monitor')
      // No server-side `status=eq.in_progress` filter: once an attempt is
      // submitted, the UPDATE's new-row values no longer match that filter,
      // so Realtime would never deliver the event and the card would be
      // stuck on screen forever. Filter client-side instead (via refetch).
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exam_attempts' }, scheduleRefetch)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'exam_cheat_events' }, scheduleRefetch)
      .subscribe();

    return () => { supabase.removeChannel(channel); if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [fetchLive, scheduleRefetch]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const totalPages = Math.max(1, Math.ceil(attempts.length / PAGE_SIZE));
  useEffect(() => { if (page > totalPages - 1) setPage(0); }, [totalPages, page]);
  const paginated = useMemo(
    () => attempts.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [attempts, page],
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <PageHeader
          icon={Activity}
          title="Giám sát trực tiếp"
          description="Theo dõi học sinh đang làm bài Testing trong thời gian thực."
          actions={
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold dark:bg-emerald-950/40 dark:border-emerald-800/60 dark:text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> {attempts.length} đang thi
            </span>
          }
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500 dark:text-indigo-400" />
        </div>
      ) : attempts.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
          <EmptyState icon={Users} title="Hiện không có học sinh nào đang làm bài Testing." />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginated.map(a => {
            const examLabel = a.exams
              ? `${a.exams.exam_levels?.label || ''} · ${a.exams.exam_type === 'testing' ? 'Testing' : 'Gmetrix'} ${a.exams.exam_number}`
              : 'Bài thi';
            const stale = now - new Date(a.last_activity_at || a.started_at).getTime() > 30000;
            const progress = a.total_questions ? Math.round(((a.current_question_index + 1) / a.total_questions) * 100) : 0;

            return (
              <div key={a.id} className={`bg-white dark:bg-slate-800 rounded-2xl border shadow-sm p-4 space-y-3 transition-opacity ${stale ? 'opacity-60 border-gray-100 dark:border-slate-700' : 'border-gray-100 dark:border-slate-700'}`}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-gray-900 dark:text-slate-100 truncate">{a.profiles?.full_name || 'Học sinh'}</p>
                  {a.cheatCount > 0 && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[11px] font-bold border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/60">
                      <AlertTriangle className="w-3 h-3" /> {a.cheatCount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{examLabel}</p>

                <div>
                  <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-slate-400 mb-1">
                    <span>Câu {a.current_question_index + 1}/{a.total_questions}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-400 dark:text-slate-500">
                  <span>Đã làm: {fmtElapsed(a.started_at, now)}</span>
                  <span className={stale ? 'text-amber-500 dark:text-amber-400 font-semibold' : ''}>{fmtAgo(a.last_activity_at, now)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <p className="text-xs text-gray-400 dark:text-slate-500">Trang {page + 1}/{totalPages} · {attempts.length} học sinh</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700/40">
              <ChevronLeft className="w-4 h-4" /> Trước
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700/40">
              Sau <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
