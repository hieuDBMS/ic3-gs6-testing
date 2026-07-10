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
      const [{ data: profiles, error: profileError }, { data: attempts, error: attemptsError }] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, email, created_at, is_active, school, class_name')
          .eq('role', 'student')
          .order('full_name'),
        supabase
          .from('exam_attempts')
          .select('user_id, score, started_at')
          .neq('status', 'in_progress'),
      ]);
      if (profileError) throw profileError;
      if (attemptsError) throw attemptsError;

      const enriched = (profiles || []).map(student => {
        const sa = (attempts || []).filter(a => a.user_id === student.id);
        const totalAttempts = sa.length;
        const avgScore = totalAttempts > 0
          ? sa.reduce((acc, a) => acc + Number(a.score), 0) / totalAttempts
          : 0;
        const last = [...sa].sort((a, b) => new Date(b.started_at) - new Date(a.started_at))[0];
        return { ...student, totalAttempts, avgScore, lastActiveAt: last?.started_at || null };
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
