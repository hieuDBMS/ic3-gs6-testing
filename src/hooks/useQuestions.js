import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * QuestionsPage only ever renders counts/booleans from the nested relations
 * (answer count + correct count, pairs/statements count, hotspot correct
 * count) — never their content/image/geometry — so we select just enough
 * columns for that list view instead of `*` + full nested rows.
 */
const DEFAULT_SELECT = `
  id, exam_id, content, image_url, question_type, order_index, created_at,
  exams (
    exam_type, exam_number,
    exam_levels (label, version)
  ),
  answers (id, is_correct),
  dragdrop_pairs (id),
  truefalse_statements (id),
  hotspot_regions (id, is_correct)
`;

/**
 * Fetch questions with filter + sort + pagination. Mirrors QuestionsPage's
 * original fetch logic 1:1 so behavior is unchanged.
 *
 * filters.examIds: null = no restriction, [] = force-empty result, [...] = restrict.
 * Caller is responsible for memoizing examIds so its identity is stable.
 */
export const useQuestions = (filters = {}, pagination = {}, enabled = true) => {
  const {
    examIds = null,
    questionType,
    search,
    orderExact,
    orderFrom,
    orderTo,
  } = filters;
  const { page = 1, pageSize = 20, sortColumn = 'created_at', ascending = false } = pagination;

  const [questions, setQuestions] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);

  const fetchQuestions = useCallback(async () => {
    if (!enabled) { setLoading(false); return; }
    if (examIds !== null && examIds.length === 0) {
      setQuestions([]);
      setTotalCount(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('questions')
        .select(DEFAULT_SELECT, { count: 'exact' })
        .order(sortColumn, { ascending })
        .range(from, to);

      if (examIds !== null) query = query.in('exam_id', examIds);
      if (questionType) query = query.eq('question_type', questionType);
      if (search?.trim()) query = query.ilike('content', `%${search.trim()}%`);

      const orderExactNum = parseInt(orderExact, 10);
      if (!isNaN(orderExactNum) && orderExact !== '' && orderExact !== undefined) {
        query = query.eq('order_index', orderExactNum);
      } else {
        const orderFromNum = parseInt(orderFrom, 10);
        const orderToNum = parseInt(orderTo, 10);
        if (!isNaN(orderFromNum) && orderFrom !== '' && orderFrom !== undefined) query = query.gte('order_index', orderFromNum);
        if (!isNaN(orderToNum) && orderTo !== '' && orderTo !== undefined) query = query.lte('order_index', orderToNum);
      }

      const { data, error: err, count } = await query;
      if (err) throw err;
      setQuestions(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [examIds, questionType, search, orderExact, orderFrom, orderTo, page, pageSize, sortColumn, ascending, enabled]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  return { questions, totalCount, loading, error, refetch: fetchQuestions };
};
