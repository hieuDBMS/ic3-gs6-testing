import { useEffect, useState, useCallback } from "react";
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { TrendingDown, AlertCircle, Loader2, BookOpen, Layers } from 'lucide-react';
import { stripHtml } from '../utils/text';
import { PageHeader } from '../components/shared/PageHeader';
import { EmptyState } from '../components/shared/EmptyState';

const QUESTION_TYPES = ['choice', 'multi', 'dragdrop', 'truefalse', 'hotspot'];

const Chip = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all duration-150 ${
      active ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:border-indigo-500'
    }`}
  >
    {label}
  </button>
);

const wrongPctColor = (pct) => {
  if (pct >= 60) return 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/40 dark:border-red-800/60';
  if (pct >= 35) return 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/40 dark:border-amber-800/60';
  return 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/40 dark:border-emerald-800/60';
};

export const QuestionStatsPage = () => {
  const { t } = useTranslation();
  const [levels, setLevels] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [minAttempts, setMinAttempts] = useState(5);
  const [levelId, setLevelId] = useState('');
  const [examType, setExamType] = useState('');
  const [questionType, setQuestionType] = useState('');

  useEffect(() => {
    supabase.from('exam_levels').select('*').order('version').order('level_number')
      .then(({ data }) => setLevels(data || []));
  }, []);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: rpcError } = await supabase.rpc('get_question_wrong_stats', {
        p_min_attempts: Number(minAttempts) || 0,
        p_level_id: levelId || null,
        p_exam_type: examType || null,
        p_question_type: questionType || null,
      });
      if (rpcError) throw rpcError;
      setRows(data || []);
    } catch (err) {
      setError(err.message || t('questionStats.errorLoadFailed'));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [minAttempts, levelId, examType, questionType, t]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <PageHeader
          icon={TrendingDown}
          title={t('questionStats.title')}
          description={t('questionStats.description')}
        />
      </div>

      {/* Filter bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-gray-100 dark:border-slate-700 mb-6 p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-200 dark:border-slate-600 px-3 py-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            <select value={levelId} onChange={e => setLevelId(e.target.value)}
              className="outline-hidden text-xs text-gray-700 dark:text-slate-300 bg-transparent cursor-pointer max-w-[220px]">
              <option value="">{t('questionStats.allLevels')}</option>
              {[...new Set(levels.map(l => l.version))].map(v => (
                <optgroup key={v} label={v}>
                  {levels.filter(l => l.version === v).map(l => (
                    <option key={l.id} value={l.id}>{v} · {l.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <Chip label={t('questionStats.allTypes')} active={!examType} onClick={() => setExamType('')} />
          <Chip label={t('questionStats.testing')} active={examType === 'testing'} onClick={() => setExamType('testing')} />
          <Chip label={t('questionStats.gmetrix')} active={examType === 'gmetrix'} onClick={() => setExamType('gmetrix')} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Chip label={t('questionStats.allQuestionTypes')} active={!questionType} onClick={() => setQuestionType('')} />
          {QUESTION_TYPES.map((k) => (
            <Chip key={k} label={t(`questionStats.questionType.${k}`)} active={questionType === k} onClick={() => setQuestionType(k)} />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-gray-500 dark:text-slate-400">{t('questionStats.minAttemptsLabel')}</label>
          <input
            type="number" min={0} value={minAttempts}
            onChange={e => setMinAttempts(e.target.value)}
            className="w-20 text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-300 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100"
          />
          <span className="text-[11px] text-gray-400 dark:text-slate-500">{t('questionStats.minAttemptsHint')}</span>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-gray-100 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500 dark:text-indigo-400" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-red-500 dark:text-red-400 gap-2">
            <AlertCircle className="w-8 h-8" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        ) : rows.length === 0 ? (
          <EmptyState icon={BookOpen} title={t('questionStats.emptyTitle')} />
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-700">
            {rows.map((r) => (
              <div key={r.question_id} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                <span className={`shrink-0 px-3 py-1.5 rounded-xl border text-sm font-bold ${wrongPctColor(r.wrong_pct)}`}>
                  {r.wrong_pct}%
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-slate-100 leading-relaxed line-clamp-2">
                    {stripHtml(r.content)}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs text-gray-400 dark:text-slate-500">
                    <span className="font-semibold text-gray-500 dark:text-slate-400">{r.level_label}</span>
                    <span>·</span>
                    <span>{r.exam_type === 'testing' ? t('questionStats.testing') : t('questionStats.gmetrix')} {r.exam_number}</span>
                    <span>·</span>
                    <span>{QUESTION_TYPES.includes(r.question_type) ? t(`questionStats.questionType.${r.question_type}`) : r.question_type}</span>
                    <span>·</span>
                    <span>{t('questionStats.wrongCount', { wrong: r.wrong_count, total: r.total_attempts })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
