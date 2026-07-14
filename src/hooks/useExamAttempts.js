import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

const DEFAULT_SELECT = `
  id, score, correct_count, total_questions, time_spent_seconds,
  started_at, submitted_at, status,
  exams ( id, title, exam_type, exam_number, exam_levels ( label ) )
`;

async function fetchExamAttempts({ userId, status, excludeStatus, examType, dateFrom, dateTo, passFilter, page, pageSize, select, withCheatCounts }) {
  const needsCount = page !== undefined;
  let query = supabase
    .from('exam_attempts')
    .select(select, needsCount ? { count: 'exact' } : undefined)
    .order('started_at', { ascending: false });

  if (userId) query = query.eq('user_id', userId);
  if (status) query = Array.isArray(status) ? query.in('status', status) : query.eq('status', status);
  if (excludeStatus) query = query.neq('status', excludeStatus);
  if (examType) query = query.eq('exams.exam_type', examType);
  if (dateFrom) query = query.gte('started_at', dateFrom + 'T00:00:00');
  if (dateTo) query = query.lte('started_at', dateTo + 'T23:59:59');
  if (passFilter === 'pass') query = query.gte('score', 70);
  if (passFilter === 'fail') query = query.lt('score', 70);
  if (page !== undefined) query = query.range(page * pageSize, (page + 1) * pageSize - 1);

  const { data, error: err, count } = await query;
  if (err) throw err;

  let cheatCounts = {};
  if (withCheatCounts && data?.length) {
    const { data: cheatRows } = await supabase
      .from('exam_cheat_events')
      .select('attempt_id')
      .in('attempt_id', data.map(a => a.id));
    cheatCounts = (cheatRows || []).reduce((acc, r) => {
      acc[r.attempt_id] = (acc[r.attempt_id] || 0) + 1;
      return acc;
    }, {});
  }

  return { attempts: data || [], totalCount: needsCount ? (count || 0) : 0, cheatCounts };
}

/**
 * Fetch exam_attempts with common filters, optional pagination and optional
 * cheat-event counts. Centralizes the query logic duplicated across
 * DashboardPage / AttemptHistoryTable / StudentProgressPage.
 */
export const useExamAttempts = (userId, options = {}) => {
  const {
    status,
    excludeStatus,
    examType,
    dateFrom,
    dateTo,
    passFilter,
    page,
    pageSize = 8,
    select = DEFAULT_SELECT,
    withCheatCounts = false,
    enabled = true,
  } = options;

  const params = { userId, status, excludeStatus, examType, dateFrom, dateTo, passFilter, page, pageSize, select, withCheatCounts };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['examAttempts', params],
    queryFn: () => fetchExamAttempts(params),
    enabled,
    placeholderData: (prev) => prev,
  });

  return {
    attempts: data?.attempts || [],
    totalCount: data?.totalCount || 0,
    cheatCounts: data?.cheatCounts || {},
    loading: enabled && isLoading,
    error,
    refetch,
  };
};
