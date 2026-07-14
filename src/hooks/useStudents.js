import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Fetch the student list (profiles + attempt stats) once, then apply
 * search/activity/school/class filters and pagination client-side —
 * matching the original StudentManagementPage / StudentOverviewTable
 * behavior (both filtered the fully-loaded list in memory).
 *
 * Returns canonical field names on each student: totalAttempts, avgScore,
 * lastActiveAt (previously named totalExams/lastActive in one of the two
 * call sites — unified here).
 *
 * Attempt stats come from the `get_student_attempt_stats()` RPC (1 row per
 * student who has attempts) instead of fetching the raw `exam_attempts`
 * table (1 row per attempt, unbounded growth over time regardless of how
 * many students are viewing this page) — see supabase/sql/2026-07-13_concurrency_indexes.sql.
 */
export const useStudents = (options = {}) => {
  const {
    search = '',
    activityFilter = 'all', // 'all' | 'active' | 'inactive'
    schoolFilter = '',
    classFilter = '',
    classMatchMode = 'exact', // 'exact' | 'contains'
    sortBy = 'full_name', // 'full_name' | 'created_at_desc'
    page = 0, // 0-based
    pageSize = 10,
  } = options;

  const [rawStudents, setRawStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ data: profiles, error: profileError }, { data: stats, error: statsError }] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, email, created_at, is_active, school, class_name')
          .eq('role', 'student')
          .order('full_name'),
        supabase.rpc('get_student_attempt_stats'),
      ]);
      if (profileError) throw profileError;
      if (statsError) throw statsError;

      const statsByUser = (stats || []).reduce((acc, s) => {
        acc[s.user_id] = s;
        return acc;
      }, {});

      const enriched = (profiles || []).map(student => {
        const s = statsByUser[student.id];
        return {
          ...student,
          totalAttempts: s ? Number(s.total_attempts) : 0,
          avgScore: s ? Number(s.avg_score) || 0 : 0,
          lastActiveAt: s?.last_active || null,
        };
      });

      setRawStudents(enriched);
    } catch (err) {
      console.error('useStudents error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const filtered = rawStudents.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (s.full_name || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q);
    const matchActivity =
      activityFilter === 'all' ||
      (activityFilter === 'active' && s.totalAttempts > 0) ||
      (activityFilter === 'inactive' && s.totalAttempts === 0);
    const matchSchool = !schoolFilter || s.school === schoolFilter;
    const matchClass = !classFilter || (classMatchMode === 'contains'
      ? (s.class_name || '').toLowerCase().includes(classFilter.toLowerCase())
      : s.class_name === classFilter);
    return matchSearch && matchActivity && matchSchool && matchClass;
  });

  if (sortBy === 'created_at_desc') {
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  const totalCount = filtered.length;
  const students = pageSize ? filtered.slice(page * pageSize, (page + 1) * pageSize) : filtered;

  return { students, rawStudents, totalCount, loading, error, refetch: fetchStudents };
};
