import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  BarChart3, Building2, School, Calendar, X, Sparkles, Loader2, AlertCircle, TrendingDown, Layers,
} from 'lucide-react';
import { stripHtml } from '../utils/text';
import { ScoreDistributionChart } from '../components/analytics/ScoreDistributionChart';
import { GroupBreakdownChart } from '../components/analytics/GroupBreakdownChart';
import { PageHeader } from '../components/shared/PageHeader';

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

const Card = ({ title, action, children }) => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
    <div className="px-5 py-3 border-b border-gray-100 dark:border-slate-700/60 flex items-center justify-between">
      <h2 className="text-sm font-bold text-gray-700 dark:text-slate-300">{title}</h2>
      {action}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

export const AnalyticsPage = () => {
  const [levels, setLevels] = useState([]);
  const [schools, setSchools] = useState([]);
  const [classes, setClasses] = useState([]);

  const [levelId, setLevelId] = useState('');
  const [examType, setExamType] = useState('');
  const [passFilter, setPassFilter] = useState('all'); // all | pass | fail
  const [schoolId, setSchoolId] = useState('');
  const [className, setClassName] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minAttempts, setMinAttempts] = useState(5);
  const [groupBy, setGroupBy] = useState('class'); // class | school | level

  const [distribution, setDistribution] = useState([]);
  const [breakdown, setBreakdown] = useState([]);
  const [worstQuestions, setWorstQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState('');
  const [aiError, setAiError] = useState('');

  useEffect(() => {
    supabase.from('exam_levels').select('*').order('version').order('level_number')
      .then(({ data }) => setLevels(data || []));
    supabase.from('schools').select('*').order('name')
      .then(({ data }) => setSchools(data || []));
    supabase.from('profiles').select('class_name').eq('role', 'student')
      .then(({ data }) => setClasses([...new Set((data || []).map(p => p.class_name).filter(Boolean))].sort()));
  }, []);

  const filters = { levelId, examType, passFilter, schoolId, className, dateFrom, dateTo, minAttempts, groupBy };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const dateFromISO = dateFrom ? dateFrom + 'T00:00:00' : null;
      const dateToISO = dateTo ? dateTo + 'T23:59:59' : null;

      const [distRes, breakdownRes, questionsRes] = await Promise.all([
        supabase.rpc('get_exam_score_distribution', {
          p_level_id: levelId || null, p_exam_type: examType || null,
          p_date_from: dateFromISO, p_date_to: dateToISO,
          p_school_id: schoolId || null, p_class_name: className || null,
          p_pass_filter: passFilter === 'all' ? null : passFilter,
        }),
        supabase.rpc('get_exam_group_breakdown', {
          p_group_by: groupBy, p_level_id: levelId || null, p_exam_type: examType || null,
          p_date_from: dateFromISO, p_date_to: dateToISO,
          p_pass_filter: passFilter === 'all' ? null : passFilter,
        }),
        supabase.rpc('get_question_wrong_stats', {
          p_min_attempts: Number(minAttempts) || 0, p_level_id: levelId || null, p_exam_type: examType || null,
        }),
      ]);
      if (distRes.error) throw distRes.error;
      if (breakdownRes.error) throw breakdownRes.error;
      if (questionsRes.error) throw questionsRes.error;

      setDistribution(distRes.data || []);
      setBreakdown(breakdownRes.data || []);
      setWorstQuestions((questionsRes.data || []).slice(0, 8));
    } catch (err) {
      setError(err.message || 'Không tải được dữ liệu phân tích');
    } finally {
      setLoading(false);
    }
  }, [levelId, examType, passFilter, schoolId, className, dateFrom, dateTo, minAttempts, groupBy]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const hasActiveFilters = levelId || examType || passFilter !== 'all' || schoolId || className || dateFrom || dateTo;
  const resetFilters = () => {
    setLevelId(''); setExamType(''); setPassFilter('all'); setSchoolId(''); setClassName('');
    setDateFrom(''); setDateTo('');
  };

  const runAiAnalysis = async () => {
    setAiLoading(true);
    setAiError('');
    setAiInsight('');
    try {
      const { data, error: fnError } = await supabase.functions.invoke('analyze-exam-stats', {
        body: { filters, distribution, breakdown },
      });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      setAiInsight(data?.insight || 'Không có nhận xét nào được trả về.');
    } catch (err) {
      setAiError(err.message || 'Không thể phân tích lúc này');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <PageHeader
        icon={BarChart3}
        title="Phân tích nâng cao"
        description="Phân bố điểm, so sánh theo lớp/trường/level, và nhận xét từ AI."
      />

      {/* Filter bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-200 dark:border-slate-600 px-3 py-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            <select value={levelId} onChange={e => setLevelId(e.target.value)}
              className="outline-none text-xs text-gray-700 dark:text-slate-300 bg-transparent cursor-pointer max-w-[220px]">
              <option value="">Tất cả Level</option>
              {[...new Set(levels.map(l => l.version))].map(v => (
                <optgroup key={v} label={v}>
                  {levels.filter(l => l.version === v).map(l => (
                    <option key={l.id} value={l.id}>{v} · {l.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <Chip label="Tất cả loại bài" active={!examType} onClick={() => setExamType('')} />
          <Chip label="Testing" active={examType === 'testing'} onClick={() => setExamType('testing')} />
          <Chip label="Gmetrix" active={examType === 'gmetrix'} onClick={() => setExamType('gmetrix')} />
          <span className="w-px h-4 bg-gray-200 dark:bg-slate-700 mx-1" />
          <Chip label="Tất cả" active={passFilter === 'all'} onClick={() => setPassFilter('all')} />
          <Chip label="✓ Đạt" active={passFilter === 'pass'} onClick={() => setPassFilter('pass')} />
          <Chip label="✗ Chưa đạt" active={passFilter === 'fail'} onClick={() => setPassFilter('fail')} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-200 dark:border-slate-600 px-3 py-1.5">
            <Building2 className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />
            <select value={schoolId} onChange={e => setSchoolId(e.target.value)}
              className="outline-none text-xs text-gray-700 dark:text-slate-300 bg-transparent cursor-pointer">
              <option value="">Tất cả trường</option>
              {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-200 dark:border-slate-600 px-3 py-1.5">
            <School className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            <select value={className} onChange={e => setClassName(e.target.value)}
              className="outline-none text-xs text-gray-700 dark:text-slate-300 bg-transparent cursor-pointer">
              <option value="">Tất cả lớp</option>
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-200 dark:border-slate-600 px-3 py-1.5">
            <Calendar className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="text-xs bg-transparent outline-none w-[110px] dark:text-slate-300" />
            <span className="text-gray-300 dark:text-slate-600">–</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="text-xs bg-transparent outline-none w-[110px] dark:text-slate-300" />
          </div>
          {hasActiveFilters && (
            <button onClick={resetFilters} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-semibold">
              <X className="w-3.5 h-3.5" /> Xóa lọc
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 dark:text-red-400 dark:bg-red-950/40 dark:border-red-800/60">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Phân bố điểm">
          {loading ? <ChartLoading /> : <ScoreDistributionChart data={distribution} />}
        </Card>

        <Card
          title="So sánh trung bình"
          action={
            <div className="flex gap-1">
              {[['class', 'Lớp'], ['school', 'Trường'], ['level', 'Level']].map(([v, l]) => (
                <button key={v} onClick={() => setGroupBy(v)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    groupBy === v ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' : 'text-gray-400 hover:bg-gray-50 dark:text-slate-500 dark:hover:bg-slate-700/40'
                  }`}>
                  {l}
                </button>
              ))}
            </div>
          }
        >
          {loading ? <ChartLoading /> : <GroupBreakdownChart data={breakdown} />}
        </Card>
      </div>

      <Card
        title="Câu hỏi sai nhiều nhất"
        action={
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-slate-500">
            <span>Ngưỡng lượt tối thiểu:</span>
            <input type="number" min={0} value={minAttempts} onChange={e => setMinAttempts(e.target.value)}
              className="w-14 text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100" />
          </div>
        }
      >
        {loading ? <ChartLoading /> : worstQuestions.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-6">Không có dữ liệu phù hợp.</p>
        ) : (
          <div className="space-y-2">
            {worstQuestions.map(q => (
              <div key={q.question_id} className="flex items-center gap-3 py-2 border-b border-gray-50 dark:border-slate-700/60 last:border-0">
                <span className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg bg-red-50 text-red-600 text-xs font-bold dark:bg-red-950/40 dark:text-red-400">
                  <TrendingDown className="w-3 h-3" /> {q.wrong_pct}%
                </span>
                <p className="flex-1 min-w-0 text-sm text-gray-700 dark:text-slate-300 truncate">{stripHtml(q.content)}</p>
                <span className="flex-shrink-0 text-xs text-gray-400 dark:text-slate-500">{q.level_label} · {q.exam_type === 'testing' ? 'Testing' : 'Gmetrix'} {q.exam_number}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* AI Analysis */}
      <div className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/40 dark:to-violet-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-800/60 p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-sm font-bold text-gray-800 dark:text-slate-100">Phân tích bằng AI</h2>
          </div>
          <button
            onClick={runAiAnalysis}
            disabled={aiLoading || loading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
          >
            {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Phân tích với dữ liệu đang lọc
          </button>
        </div>
        {aiError && <p className="mt-3 text-xs text-red-600 dark:text-red-400">{aiError}</p>}
        {aiInsight && (
          <p className="mt-4 text-sm text-gray-700 dark:text-slate-300 leading-relaxed bg-white/70 dark:bg-slate-800/70 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800/60">
            {aiInsight}
          </p>
        )}
      </div>
    </div>
  );
};

const ChartLoading = () => (
  <div className="flex items-center justify-center h-64">
    <Loader2 className="w-6 h-6 animate-spin text-indigo-500 dark:text-indigo-400" />
  </div>
);
