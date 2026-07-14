import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { Activity, Users, AlertTriangle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { PageHeader } from '../components/shared/PageHeader';
import { EmptyState } from '../components/shared/EmptyState';

const PAGE_SIZE = 12;
// A live ping lands every ~4s (see ExamPage). No ping for this long means the
// tab was closed / navigated away without submitting — treat as zombie and
// drop it from the monitor instead of leaving a stale card on screen.
//
// This is the ONLY liveness signal we use — deliberately not `started_at` +
// exam duration. A resumed attempt (see ExamPage's ResumeModal) keeps its
// original `started_at`, so a duration-based cutoff would wrongly hide a
// student who just resumed hours after they first started, even though
// their ping is seconds old. `last_activity_at` freshness alone is correct
// in both the normal and the resumed case.
const ACTIVITY_TIMEOUT_SECONDS = 60;

const fmtElapsed = (startedAt, now) => {
  const secs = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
};

const fmtAgo = (isoString, now, t) => {
  if (!isoString) return '--';
  const secs = Math.max(0, Math.floor((now - new Date(isoString).getTime()) / 1000));
  if (secs < 5) return t('liveMonitor.justNow');
  if (secs < 60) return t('liveMonitor.secondsAgo', { secs });
  return t('liveMonitor.minutesAgo', { mins: Math.floor(secs / 60) });
};

export const LiveMonitorPage = () => {
  const { t } = useTranslation();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [page, setPage] = useState(0);
  const debounceRef = useRef(null);
  const maxWaitRef = useRef(null);

  const fetchLive = useCallback(async () => {
    // Server-side floor: same threshold as the zombie filter below, so the
    // query itself never returns a row this page would immediately drop.
    const cutoffISO = new Date(Date.now() - ACTIVITY_TIMEOUT_SECONDS * 1000).toISOString();

    const { data: attemptRows } = await supabase
      .from('exam_attempts')
      .select(`
        id, user_id, current_question_index, total_questions, started_at, last_activity_at,
        profiles ( full_name ),
        exams ( title, exam_type, exam_number, exam_levels ( label ) )
      `)
      .eq('status', 'in_progress')
      .gte('last_activity_at', cutoffISO)
      .order('started_at', { ascending: false })
      .limit(300);

    const rows = attemptRows || [];

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

  // Debounce with a hard ceiling: a full classroom pinging every 4s can keep
  // resetting a pure trailing-edge debounce forever, so the dashboard would
  // never refresh precisely when activity (and the need for live data) is
  // highest. maxWaitRef guarantees a refetch fires at least every 1.5s even
  // under continuous realtime traffic.
  const scheduleRefetch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const fire = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (maxWaitRef.current) clearTimeout(maxWaitRef.current);
      debounceRef.current = null;
      maxWaitRef.current = null;
      fetchLive();
    };
    debounceRef.current = setTimeout(fire, 500);
    if (!maxWaitRef.current) maxWaitRef.current = setTimeout(fire, 1500);
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

    return () => {
      supabase.removeChannel(channel);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (maxWaitRef.current) clearTimeout(maxWaitRef.current);
    };
  }, [fetchLive, scheduleRefetch]);

  useEffect(() => {
    const intervalId = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(intervalId);
  }, []);

  // `attempts` only updates on mount / realtime DB writes — a zombie session
  // (student gone, no more pings) produces no further writes, so nothing
  // would ever re-trigger fetchLive() to drop it. Re-filter against the
  // second-ticking `now` clock instead, so a card disappears the moment it
  // crosses ACTIVITY_TIMEOUT_SECONDS regardless of whether any DB event fires.
  const liveAttempts = useMemo(
    () => attempts.filter(a => now - new Date(a.last_activity_at || a.started_at).getTime() <= ACTIVITY_TIMEOUT_SECONDS * 1000),
    [attempts, now],
  );

  const totalPages = Math.max(1, Math.ceil(liveAttempts.length / PAGE_SIZE));
  useEffect(() => { if (page > totalPages - 1) setPage(0); }, [totalPages, page]);
  const paginated = useMemo(
    () => liveAttempts.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [liveAttempts, page],
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <PageHeader
          icon={Activity}
          title={t('liveMonitor.title')}
          description={t('liveMonitor.description')}
          actions={
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold dark:bg-emerald-950/40 dark:border-emerald-800/60 dark:text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> {t('liveMonitor.currentlyTaking', { count: liveAttempts.length })}
            </span>
          }
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500 dark:text-indigo-400" />
        </div>
      ) : liveAttempts.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
          <EmptyState icon={Users} title={t('liveMonitor.emptyTitle')} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginated.map(a => {
            const examLabel = a.exams
              ? `${a.exams.exam_levels?.label || ''} · ${a.exams.exam_type === 'testing' ? t('liveMonitor.testing') : t('liveMonitor.gmetrix')} ${a.exams.exam_number}`
              : t('liveMonitor.examFallback');
            const stale = now - new Date(a.last_activity_at || a.started_at).getTime() > (ACTIVITY_TIMEOUT_SECONDS / 2) * 1000;
            const progress = a.total_questions ? Math.round(((a.current_question_index + 1) / a.total_questions) * 100) : 0;

            return (
              <div key={a.id} className={`bg-white dark:bg-slate-800 rounded-2xl border shadow-xs p-4 space-y-3 transition-opacity ${stale ? 'opacity-60 border-gray-100 dark:border-slate-700' : 'border-gray-100 dark:border-slate-700'}`}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-gray-900 dark:text-slate-100 truncate">{a.profiles?.full_name || t('liveMonitor.studentFallback')}</p>
                  {a.cheatCount > 0 && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[11px] font-bold border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/60">
                      <AlertTriangle className="w-3 h-3" /> {a.cheatCount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{examLabel}</p>

                <div>
                  <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-slate-400 mb-1">
                    <span>{t('liveMonitor.questionProgress', { current: a.current_question_index + 1, total: a.total_questions })}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-400 dark:text-slate-500">
                  <span>{t('liveMonitor.elapsedLabel')} {fmtElapsed(a.started_at, now)}</span>
                  <span className={stale ? 'text-amber-500 dark:text-amber-400 font-semibold' : ''}>{fmtAgo(a.last_activity_at, now, t)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <p className="text-xs text-gray-400 dark:text-slate-500">{t('liveMonitor.pageInfo', { page: page + 1, totalPages, count: liveAttempts.length })}</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700/40">
              <ChevronLeft className="w-4 h-4" /> {t('liveMonitor.prev')}
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700/40">
              {t('liveMonitor.next')} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
