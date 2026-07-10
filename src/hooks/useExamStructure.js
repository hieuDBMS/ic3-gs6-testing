import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const SS_KEY = 'examStructure_cache';
const CACHE_TTL_MS = 5 * 60 * 1000;

const readCache = () => {
  try {
    const raw = sessionStorage.getItem(SS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.timestamp || Date.now() - parsed.timestamp > CACHE_TTL_MS) return null;
    return parsed;
  } catch { return null; }
};

const writeCache = (levels, exams) => {
  try {
    sessionStorage.setItem(SS_KEY, JSON.stringify({ levels, exams, timestamp: Date.now() }));
  } catch { /* sessionStorage unavailable — ignore */ }
};

/**
 * Fetch exam_levels + exams once and cache in sessionStorage for 5 minutes,
 * so ExamListPage / QuestionFormPage / QuestionsPage / ExamStructurePage
 * don't each issue their own duplicate queries for the same reference data.
 *
 * Call refetch() after mutating exam_levels/exams (ExamStructurePage) to
 * force a fresh fetch and refresh the shared cache for other pages.
 */
export const useExamStructure = () => {
  const cached = readCache();
  const [levels, setLevels] = useState(cached?.levels || []);
  const [exams, setExams] = useState(cached?.exams || []);
  const [loading, setLoading] = useState(!cached);

  const fetchData = useCallback(async (force = false) => {
    if (!force) {
      const c = readCache();
      if (c) {
        setLevels(c.levels);
        setExams(c.exams);
        setLoading(false);
        return;
      }
    }
    setLoading(true);
    const [{ data: lvls }, { data: exs }] = await Promise.all([
      supabase.from('exam_levels').select('*').order('version').order('level_number'),
      supabase.from('exams').select('*').order('exam_type').order('exam_number'),
    ]);
    setLevels(lvls || []);
    setExams(exs || []);
    writeCache(lvls || [], exs || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(false); }, [fetchData]);

  const refetch = useCallback(() => fetchData(true), [fetchData]);

  return { levels, exams, loading, refetch };
};
