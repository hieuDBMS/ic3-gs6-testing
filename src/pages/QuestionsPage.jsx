import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  Plus, Edit2, Trash2, Search, Filter, ChevronLeft,
  ChevronRight, Image as ImageIcon, BookOpen, X, Loader2, Layers,
  ArrowUpDown, ArrowUp, ArrowDown, Hash, FileSpreadsheet,
} from 'lucide-react';
import { useQuestions } from '../hooks/useQuestions';
import { useExamStructure } from '../hooks/useExamStructure';
import { Toast, useToast } from '../components/shared/Toast';
import { ConfirmDialog } from '../components/shared/ConfirmDialog';
import { EmptyState } from '../components/shared/EmptyState';

const PAGE_SIZE = 20;

const QUESTION_TYPE_LABELS = {
  choice:     { label: 'Chọn một',      color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'    },
  multi:      { label: 'Chọn nhiều',    color: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300' },
  dragdrop:   { label: 'Kéo thả',       color: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300' },
  truefalse:  { label: 'Đúng / Sai',    color: 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300'    },
  hotspot:    { label: 'Chọn vùng ảnh', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'   },
};

/* ─── sessionStorage helpers ─── */
const SS_KEY = 'questionsPage_state';

const loadSavedState = () => {
  try {
    const raw = sessionStorage.getItem(SS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

const saveState = (state) => {
  try { sessionStorage.setItem(SS_KEY, JSON.stringify(state)); } catch {}
};

const DEFAULT_FILTERS = {
  version: '',
  level_id: '',
  exam_type: '',
  exam_id: '',
  question_type: '',
  search: '',
  order_exact: '',
  order_from: '',
  order_to: '',
};

export const QuestionsPage = () => {
  /* ── Restore persisted state ── */
  const saved = loadSavedState();

  const [page,        setPage]        = useState(saved?.page        ?? 1);
  const [sortOption,  setSortOption]  = useState(saved?.sortOption  ?? 'created_at:desc');
  const [filters,     setFilters]     = useState(saved?.filters     ?? DEFAULT_FILTERS);

  const SORT_OPTIONS = [
    { value: 'created_at:desc',  label: 'Mới nhất trước',     icon: 'desc' },
    { value: 'created_at:asc',   label: 'Cũ nhất trước',      icon: 'asc'  },
    { value: 'order_index:asc',  label: 'Thứ tự tăng dần',    icon: 'asc'  },
    { value: 'order_index:desc', label: 'Thứ tự giảm dần',    icon: 'desc' },
    { value: 'content:asc',      label: 'Nội dung A → Z',     icon: 'asc'  },
    { value: 'content:desc',     label: 'Nội dung Z → A',     icon: 'desc' },
  ];

  const navigate = useNavigate();

  /* ── Persist state on every relevant change ── */
  useEffect(() => {
    saveState({ filters, sortOption, page });
  }, [filters, sortOption, page]);

  /* ── Toast ── */
  const { toasts, showToast, dismissToast } = useToast();

  /* ── Delete confirm ── */
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* ── Reference data (levels + exams), shared/cached across teacher pages ── */
  const { levels, exams } = useExamStructure();

  /* ── Compute exam_id restriction from cascading filters ── */
  const targetExamIds = useMemo(() => {
    if (filters.exam_id) return [filters.exam_id];

    let filtered = exams;
    if (filters.level_id) {
      filtered = filtered.filter(e => e.level_id === filters.level_id);
    } else if (filters.version) {
      const versionLevelIds = levels.filter(l => l.version === filters.version).map(l => l.id);
      filtered = filtered.filter(e => versionLevelIds.includes(e.level_id));
    }
    if (filters.exam_type) {
      filtered = filtered.filter(e => e.exam_type === filters.exam_type);
    }
    if (filters.version || filters.level_id || filters.exam_type) {
      return filtered.map(e => e.id);
    }
    return null;
  }, [filters.exam_id, filters.level_id, filters.version, filters.exam_type, exams, levels]);

  const [sortCol, sortDir] = sortOption.split(':');

  const {
    questions, totalCount, loading, error, refetch: fetchQuestions,
  } = useQuestions(
    {
      examIds: targetExamIds,
      questionType: filters.question_type,
      search: filters.search,
      orderExact: filters.order_exact,
      orderFrom: filters.order_from,
      orderTo: filters.order_to,
    },
    { page, pageSize: PAGE_SIZE, sortColumn: sortCol, ascending: sortDir === 'asc' },
    exams.length > 0 || levels.length > 0,
  );

  useEffect(() => {
    if (error) showToast('Lỗi khi tải câu hỏi: ' + error.message, 'error');
  }, [error]);

  /* Reset page when filters/sort change */
  useEffect(() => { setPage(1); }, [filters, sortOption]);

  const reorderQuestions = async (examId) => {
    await supabase.rpc('reorder_questions_in_exam', { p_exam_id: examId });
  };

  const handleDelete = (q) => setDeleteTarget(q);

  const confirmDelete = async () => {
    const q = deleteTarget;
    setDeleting(true);
    try {
      const { error } = await supabase.from('questions').delete().eq('id', q.id);
      if (error) throw error;
      await reorderQuestions(q.exam_id);
      showToast('Đã xoá câu hỏi và cập nhật thứ tự');
      fetchQuestions();
    } catch (err) {
      showToast('Lỗi khi xoá: ' + err.message, 'error');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleEdit = (q) => navigate(`/questions/${q.id}/edit`);
  const handleAdd  = ()  => navigate('/questions/new');

  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val }));

  const clearFilters = () => setFilters(DEFAULT_FILTERS);

  const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

  /* Derived data for cascading filters */
  const versions       = [...new Set(levels.map(l => l.version))].sort();
  const filteredLevels = filters.version
    ? levels.filter(l => l.version === filters.version)
    : levels;

  const filteredLevelExams = exams.filter(e => {
    const levelMatch   = !filters.level_id   || e.level_id === filters.level_id;
    const versionMatch = !filters.version    || filteredLevels.some(l => l.id === e.level_id);
    const typeMatch    = !filters.exam_type  || e.exam_type === filters.exam_type;
    return levelMatch && versionMatch && typeMatch;
  });

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  /* ─── Render question content as HTML ─── */
  const QuestionContent = ({ html, className = '' }) => (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Toast */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Xoá câu hỏi"
        message={deleteTarget ? `"${deleteTarget.content.replace(/<[^>]*>/g, '').slice(0, 80)}..." — Thao tác này sẽ xoá cả đáp án và lịch sử trả lời của câu hỏi này. Không thể hoàn tác.` : ''}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
            <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" />
            Ngân hàng Câu hỏi
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-slate-500">
            {loading ? 'Đang tải...' : `${totalCount} câu hỏi`}
            {activeFilterCount > 0 && ` · ${activeFilterCount} bộ lọc đang áp dụng`}
          </p>
        </div>
        <div className="w-full sm:w-auto flex gap-2">
          <button
            onClick={() => navigate('/questions/import')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 border-2 border-indigo-200 dark:border-indigo-700/60 text-indigo-700 dark:text-indigo-300 text-sm font-semibold rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" /> Import Excel
          </button>
          <button
            onClick={handleAdd}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Thêm câu hỏi
          </button>
        </div>
      </div>

      {/* ══════════ Filter Bar ══════════ */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/60 mb-6 p-4 space-y-3">

        {/* Row 1: Search */}
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2.5">
          <Search className="w-4 h-4 text-gray-400 dark:text-slate-500 flex-shrink-0" />
          <input
            type="text"
            placeholder="Tìm kiếm nội dung câu hỏi..."
            value={filters.search}
            onChange={e => setFilter('search', e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none placeholder-gray-400 dark:placeholder-slate-500 dark:text-slate-100 min-w-0"
          />
          {filters.search && (
            <button onClick={() => setFilter('search', '')} className="text-gray-300 dark:text-slate-500 hover:text-gray-500 dark:hover:text-slate-300 flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Row 2: Sort + Order range + Clear */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sort select */}
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 flex-1 min-w-[180px]">
            {sortOption.endsWith(':asc')
              ? <ArrowUp className="w-4 h-4 text-indigo-500 flex-shrink-0" />
              : <ArrowDown className="w-4 h-4 text-indigo-500 flex-shrink-0" />}
            <select
              value={sortOption}
              onChange={e => setSortOption(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none text-gray-700 dark:text-slate-300 cursor-pointer min-w-0"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Order index filter: exact OR range */}
          <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 flex-wrap">
            <Hash className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
            <span className="text-xs text-gray-500 dark:text-slate-500 font-semibold whitespace-nowrap">Câu số</span>

            {/* Exact */}
            <input
              type="number"
              min="1"
              placeholder="Cụ thể"
              value={filters.order_exact}
              onChange={e => {
                setFilter('order_exact', e.target.value);
                if (e.target.value) {
                  setFilter('order_from', '');
                  setFilter('order_to', '');
                }
              }}
              className={`w-16 bg-transparent text-sm outline-none text-center placeholder-gray-300 dark:placeholder-slate-500 transition-colors ${
                filters.order_exact ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-gray-700 dark:text-slate-300'
              }`}
            />

            {/* Divider */}
            <span className="text-[10px] text-gray-300 dark:text-slate-600 font-medium px-0.5">hoặc</span>

            {/* Range from */}
            <input
              type="number"
              min="1"
              placeholder="Từ"
              value={filters.order_from}
              disabled={!!filters.order_exact}
              onChange={e => setFilter('order_from', e.target.value)}
              className={`w-14 bg-transparent text-sm outline-none text-center placeholder-gray-300 dark:placeholder-slate-500 transition-colors ${
                filters.order_exact ? 'opacity-30 cursor-not-allowed' : 'text-gray-700 dark:text-slate-300'
              }`}
            />
            <span className="text-gray-300 dark:text-slate-600 text-xs">—</span>
            {/* Range to */}
            <input
              type="number"
              min="1"
              placeholder="Đến"
              value={filters.order_to}
              disabled={!!filters.order_exact}
              onChange={e => setFilter('order_to', e.target.value)}
              className={`w-14 bg-transparent text-sm outline-none text-center placeholder-gray-300 dark:placeholder-slate-500 transition-colors ${
                filters.order_exact ? 'opacity-30 cursor-not-allowed' : 'text-gray-700 dark:text-slate-300'
              }`}
            />
          </div>

          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 rounded-xl transition-colors whitespace-nowrap"
            >
              <X className="w-3.5 h-3.5" /> Xoá ({activeFilterCount})
            </button>
          )}
        </div>

        {/* Row 3: Cascading filters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Version */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-slate-500 mb-1 flex items-center gap-1">
              <Layers className="w-3 h-3" /> Phiên bản
            </label>
            <select
              value={filters.version}
              onChange={e => { setFilter('version', e.target.value); setFilter('level_id', ''); setFilter('exam_id', ''); }}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-500"
            >
              <option value="">Tất cả</option>
              {versions.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          {/* Level */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-slate-500 mb-1">Level</label>
            <select
              value={filters.level_id}
              onChange={e => { setFilter('level_id', e.target.value); setFilter('exam_id', ''); }}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-500"
            >
              <option value="">Tất cả</option>
              {filteredLevels.map(l => (
                <option key={l.id} value={l.id}>{l.version} — {l.label}</option>
              ))}
            </select>
          </div>

          {/* Exam type */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-slate-500 mb-1">Loại bài</label>
            <select
              value={filters.exam_type}
              onChange={e => { setFilter('exam_type', e.target.value); setFilter('exam_id', ''); }}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-500"
            >
              <option value="">Tất cả</option>
              <option value="testing">Testing</option>
              <option value="gmetrix">Gmetrix</option>
            </select>
          </div>

          {/* Specific exam */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-slate-500 mb-1">Bài thi cụ thể</label>
            <select
              value={filters.exam_id}
              onChange={e => setFilter('exam_id', e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-500"
            >
              <option value="">Tất cả</option>
              {filteredLevelExams.map(e => (
                <option key={e.id} value={e.id}>
                  {e.exam_type === 'testing' ? 'Testing' : 'Gmetrix'} {e.exam_number}
                </option>
              ))}
            </select>
          </div>

          {/* Question type */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-slate-500 mb-1">Loại câu hỏi</label>
            <select
              value={filters.question_type}
              onChange={e => setFilter('question_type', e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-500"
            >
              <option value="">Tất cả</option>
              <option value="choice">Chọn một</option>
              <option value="multi">Chọn nhiều</option>
              <option value="dragdrop">Kéo thả</option>
              <option value="truefalse">Đúng / Sai</option>
              <option value="hotspot">Chọn vùng ảnh</option>
            </select>
          </div>
        </div>
      </div>

      {/* ══════════ Question List ══════════ */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/60 overflow-hidden">

        {/* ── Mobile Card View ── */}
        <div className="sm:hidden divide-y divide-gray-100 dark:divide-slate-700">
          {loading ? (
            <div className="px-4 py-14 text-center">
              <Loader2 className="w-6 h-6 text-indigo-400 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-400 dark:text-slate-500">Đang tải dữ liệu...</p>
            </div>
          ) : questions.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="Không có câu hỏi nào"
              description={activeFilterCount > 0 ? 'Thử thay đổi bộ lọc' : 'Bấm "Thêm câu hỏi" để bắt đầu'}
            />
          ) : questions.map((q, rowIdx) => {
            const rowNumber   = (page - 1) * PAGE_SIZE + rowIdx + 1;
            const typeInfo    = QUESTION_TYPE_LABELS[q.question_type] || {};
            const correctCount = q.answers?.filter(a => a.is_correct).length || 0;
            const totalAnswers = q.answers?.length || 0;
            const pairsCount  = q.dragdrop_pairs?.length || 0;
            const levelLabel  = q.exams?.exam_levels
              ? `${q.exams.exam_levels.version} ${q.exams.exam_levels.label}` : '';
            return (
              <div key={q.id} className="p-4 active:bg-gray-50 dark:active:bg-slate-700/40 transition-colors">
                <div className="flex items-start gap-3">
                  {q.image_url && (
                    <img src={q.image_url} alt="" className="w-11 h-11 rounded-lg object-cover flex-shrink-0 border border-gray-100 dark:border-slate-700/60 mt-0.5" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      {/* Render HTML content */}
                      <div
                        className="text-sm font-medium text-gray-900 dark:text-slate-100 line-clamp-3 flex-1 leading-snug"
                        dangerouslySetInnerHTML={{ __html: q.content }}
                      />
                      <span className="text-xs text-gray-300 dark:text-slate-600 font-mono flex-shrink-0">#{q.order_index ?? rowNumber}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                      {levelLabel && <span className="text-xs text-gray-500 dark:text-slate-500">{levelLabel}</span>}
                      <span className="text-xs text-gray-400 dark:text-slate-500">
                        {q.exams?.exam_type === 'testing' ? 'Testing' : 'Gmetrix'} {q.exams?.exam_number}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-slate-500">
                        {q.question_type === 'dragdrop'
                          ? `🔀 ${pairsCount} cặp`
                          : q.question_type === 'truefalse'
                            ? `✅ ${q.truefalse_statements?.length || 0} nhận định`
                          : q.question_type === 'hotspot'
                            ? `🎯 ${q.hotspot_regions?.filter(r => r.is_correct).length || 0} vùng đúng`
                          : <>{totalAnswers} đáp án · <span className="text-emerald-600 dark:text-emerald-400 font-medium">{correctCount} đúng</span></>
                        }
                      </span>
                      <div className="flex items-center gap-0.5">
                        <button onClick={() => handleEdit(q)}
                          className="p-2.5 text-gray-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(q)}
                          className="p-2.5 text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Desktop Table ── */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-700/50">
              <tr>
                <th
                  onClick={() => setSortOption(s => s === 'content:asc' ? 'content:desc' : 'content:asc')}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-slate-500 uppercase tracking-wider cursor-pointer select-none hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group"
                >
                  <span className="flex items-center gap-1">
                    Nội dung câu hỏi
                    <ArrowUpDown className="w-3 h-3 opacity-40 group-hover:opacity-100 transition-opacity" />
                  </span>
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 dark:text-slate-500 uppercase tracking-wider">Loại</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 dark:text-slate-500 uppercase tracking-wider">Bài thi</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 dark:text-slate-500 uppercase tracking-wider">Đáp án</th>
                <th
                  onClick={() => setSortOption(s => s === 'order_index:asc' ? 'order_index:desc' : 'order_index:asc')}
                  className="px-4 py-4 text-left text-xs font-semibold text-gray-500 dark:text-slate-500 uppercase tracking-wider cursor-pointer select-none hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group"
                >
                  <span className="flex items-center gap-1">
                    #
                    <ArrowUpDown className="w-3 h-3 opacity-40 group-hover:opacity-100 transition-opacity" />
                  </span>
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-slate-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <Loader2 className="w-6 h-6 text-indigo-400 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-gray-400 dark:text-slate-500">Đang tải dữ liệu...</p>
                  </td>
                </tr>
              ) : questions.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={BookOpen}
                      title="Không có câu hỏi nào"
                      description={activeFilterCount > 0 ? 'Thử thay đổi bộ lọc' : 'Bấm "Thêm câu hỏi" để bắt đầu'}
                    />
                  </td>
                </tr>
              ) : (
                questions.map((q, rowIdx) => {
                  const typeInfo     = QUESTION_TYPE_LABELS[q.question_type] || {};
                  const correctCount = q.answers?.filter(a => a.is_correct).length || 0;
                  const totalAnswers = q.answers?.length || 0;
                  const pairsCount   = q.dragdrop_pairs?.length || 0;
                  const levelLabel   = q.exams?.exam_levels
                    ? `${q.exams.exam_levels.version} ${q.exams.exam_levels.label}`
                    : '';

                  return (
                    <tr key={q.id} className="hover:bg-gray-50/80 dark:hover:bg-slate-700/40 transition-colors">
                      {/* Content — renders HTML formatting */}
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          {q.image_url && (
                            <img src={q.image_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-gray-100 dark:border-slate-700/60" />
                          )}
                          <div className="min-w-0">
                            <div
                              className="text-sm font-medium text-gray-900 dark:text-slate-100 line-clamp-2 leading-snug"
                              dangerouslySetInnerHTML={{ __html: q.content }}
                            />
                            {q.image_url && (
                              <p className="text-xs text-indigo-400 mt-0.5">
                                <ImageIcon className="w-3 h-3 inline" /> Có ảnh
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Type badge */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                      </td>

                      {/* Exam info */}
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-700 dark:text-slate-300 font-medium">{levelLabel}</p>
                        <p className="text-xs text-gray-400 dark:text-slate-500">
                          {q.exams?.exam_type === 'testing' ? 'Testing' : 'Gmetrix'} {q.exams?.exam_number}
                        </p>
                      </td>

                      {/* Answer count */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        {q.question_type === 'dragdrop' ? (
                          <span className="text-xs text-gray-500 dark:text-slate-500">🔀 {pairsCount} cặp</span>
                        ) : q.question_type === 'truefalse' ? (
                          <span className="text-xs text-gray-500 dark:text-slate-500">✅ {q.truefalse_statements?.length || 0} nhận định</span>
                        ) : q.question_type === 'hotspot' ? (
                          <span className="text-xs text-gray-500 dark:text-slate-500">🎯 {q.hotspot_regions?.filter(r => r.is_correct).length || 0} vùng đúng</span>
                        ) : (
                          <div className="text-xs">
                            <span className="text-gray-700 dark:text-slate-300 font-medium">{totalAnswers}</span>
                            <span className="text-gray-400 dark:text-slate-500"> đáp án · </span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">{correctCount} đúng</span>
                          </div>
                        )}
                      </td>

                      {/* Order index */}
                      <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-400 dark:text-slate-500 font-mono">
                        {q.order_index ?? '—'}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(q)}
                            className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(q)}
                            className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                            title="Xoá"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="border-t border-gray-100 dark:border-slate-700/60 bg-gray-50 dark:bg-slate-700/50">
            {/* Mobile */}
            <div className="flex items-center justify-between px-4 py-3 sm:hidden">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600 rounded-xl hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Trước
              </button>
              <span className="text-sm text-gray-500 dark:text-slate-500">Trang <strong>{page}</strong> / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600 rounded-xl hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Sau <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            {/* Desktop */}
            <div className="hidden sm:flex items-center justify-between px-6 py-4">
              <p className="text-sm text-gray-500 dark:text-slate-500">
                Hiển thị {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, totalCount)} trong {totalCount} câu hỏi
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, i) =>
                    item === '...' ? (
                      <span key={`ellipsis-${i}`} className="px-2 text-gray-400 dark:text-slate-500 text-sm">…</span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => setPage(item)}
                        className={`min-w-[36px] h-9 text-sm rounded-lg border transition-colors font-medium
                          ${page === item
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500'}`}
                      >
                        {item}
                      </button>
                    )
                  )}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
