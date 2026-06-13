import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  Plus, Edit2, Trash2, Search, Filter, ChevronLeft,
  ChevronRight, Image as ImageIcon, BookOpen, X, Loader2, Layers,
  ArrowUpDown, ArrowUp, ArrowDown, Hash,
} from 'lucide-react';

const PAGE_SIZE = 20;

const QUESTION_TYPE_LABELS = {
  choice:     { label: 'Chọn một',      color: 'bg-blue-100 text-blue-700'    },
  multi:      { label: 'Chọn nhiều',    color: 'bg-purple-100 text-purple-700' },
  dragdrop:   { label: 'Kéo thả',       color: 'bg-orange-100 text-orange-700' },
  truefalse:  { label: 'Đúng / Sai',    color: 'bg-teal-100 text-teal-700'    },
  hotspot:    { label: 'Chọn vùng ảnh', color: 'bg-amber-100 text-amber-700'   },
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

  const [questions,   setQuestions]   = useState([]);
  const [totalCount,  setTotalCount]  = useState(0);
  const [levels,      setLevels]      = useState([]);
  const [exams,       setExams]       = useState([]);
  const [loading,     setLoading]     = useState(true);
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
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* ── Load reference data once ── */
  useEffect(() => {
    const load = async () => {
      const [{ data: lvls }, { data: exs }] = await Promise.all([
        supabase.from('exam_levels').select('*').order('version').order('level_number'),
        supabase.from('exams').select('*').order('exam_type').order('exam_number'),
      ]);
      setLevels(lvls || []);
      setExams(exs || []);
    };
    load();
  }, []);

  /* ── Fetch questions ── */
  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const from = (page - 1) * PAGE_SIZE;
      const to   = from + PAGE_SIZE - 1;

      let targetExamIds = null;

      if (filters.exam_id) {
        targetExamIds = [filters.exam_id];
      } else {
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
          targetExamIds = filtered.map(e => e.id);
        }
      }

      const [sortCol, sortDir] = sortOption.split(':');
      const ascending = sortDir === 'asc';

      let query = supabase
        .from('questions')
        .select(`
          *,
          exams (
            id, title, exam_type, exam_number,
            exam_levels (id, label, level_number, version)
          ),
          answers (id, content, image_url, is_correct, order_index),
          dragdrop_pairs (id, drag_content, drag_image_url, drop_content, drop_image_url, order_index),
          truefalse_statements (id, content, is_true, order_index),
          hotspot_regions (id, x, y, width, height, is_correct, label, order_index)
        `, { count: 'exact' })
        .order(sortCol, { ascending })
        .range(from, to);

      if (targetExamIds !== null) {
        if (targetExamIds.length === 0) {
          setQuestions([]);
          setTotalCount(0);
          setLoading(false);
          return;
        }
        query = query.in('exam_id', targetExamIds);
      }

      if (filters.question_type) query = query.eq('question_type', filters.question_type);
      if (filters.search.trim()) query = query.ilike('content', `%${filters.search.trim()}%`);

      // Order index filter — exact takes priority over range
      const orderExact = parseInt(filters.order_exact, 10);
      if (!isNaN(orderExact) && filters.order_exact !== '') {
        query = query.eq('order_index', orderExact);
      } else {
        const orderFrom = parseInt(filters.order_from, 10);
        const orderTo   = parseInt(filters.order_to,   10);
        if (!isNaN(orderFrom) && filters.order_from !== '') query = query.gte('order_index', orderFrom);
        if (!isNaN(orderTo)   && filters.order_to   !== '') query = query.lte('order_index', orderTo);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      setQuestions(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      showToast('Lỗi khi tải câu hỏi: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [filters, exams, levels, page, sortOption]);

  useEffect(() => {
    if (exams.length > 0 || levels.length > 0) {
      fetchQuestions();
    }
  }, [filters, exams, levels, page, sortOption]);

  /* Reset page when filters/sort change */
  useEffect(() => { setPage(1); }, [filters, sortOption]);

  const reorderQuestions = async (examId) => {
    await supabase.rpc('reorder_questions_in_exam', { p_exam_id: examId });
  };

  const handleDelete = async (q) => {
    const plainContent = q.content.replace(/<[^>]*>/g, '').slice(0, 80);
    if (!window.confirm(`Xoá câu hỏi:\n"${plainContent}..."\n\nThao tác này sẽ xoá cả đáp án và lịch sử trả lời của câu hỏi này. Không thể hoàn tác.`)) return;
    try {
      const { error } = await supabase.from('questions').delete().eq('id', q.id);
      if (error) throw error;
      await reorderQuestions(q.exam_id);
      showToast('Đã xoá câu hỏi và cập nhật thứ tự');
      fetchQuestions();
    } catch (err) {
      showToast('Lỗi khi xoá: ' + err.message, 'error');
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
      {toast && (
        <div className={`fixed bottom-4 left-4 right-4 sm:bottom-auto sm:top-4 sm:right-4 sm:left-auto z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl text-sm font-medium transition-all
          ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
          {toast.type === 'error' ? '❌' : '✅'} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" />
            Ngân hàng Câu hỏi
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500">
            {loading ? 'Đang tải...' : `${totalCount} câu hỏi`}
            {activeFilterCount > 0 && ` · ${activeFilterCount} bộ lọc đang áp dụng`}
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Thêm câu hỏi
        </button>
      </div>

      {/* ══════════ Filter Bar ══════════ */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 p-4 space-y-3">

        {/* Row 1: Search */}
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Tìm kiếm nội dung câu hỏi..."
            value={filters.search}
            onChange={e => setFilter('search', e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none placeholder-gray-400 min-w-0"
          />
          {filters.search && (
            <button onClick={() => setFilter('search', '')} className="text-gray-300 hover:text-gray-500 flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Row 2: Sort + Order range + Clear */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sort select */}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 flex-1 min-w-[180px]">
            {sortOption.endsWith(':asc')
              ? <ArrowUp className="w-4 h-4 text-indigo-500 flex-shrink-0" />
              : <ArrowDown className="w-4 h-4 text-indigo-500 flex-shrink-0" />}
            <select
              value={sortOption}
              onChange={e => setSortOption(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none text-gray-700 cursor-pointer min-w-0"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Order index filter: exact OR range */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 flex-wrap">
            <Hash className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
            <span className="text-xs text-gray-500 font-semibold whitespace-nowrap">Câu số</span>

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
              className={`w-16 bg-transparent text-sm outline-none text-center placeholder-gray-300 transition-colors ${
                filters.order_exact ? 'text-indigo-600 font-semibold' : 'text-gray-700'
              }`}
            />

            {/* Divider */}
            <span className="text-[10px] text-gray-300 font-medium px-0.5">hoặc</span>

            {/* Range from */}
            <input
              type="number"
              min="1"
              placeholder="Từ"
              value={filters.order_from}
              disabled={!!filters.order_exact}
              onChange={e => setFilter('order_from', e.target.value)}
              className={`w-14 bg-transparent text-sm outline-none text-center placeholder-gray-300 transition-colors ${
                filters.order_exact ? 'opacity-30 cursor-not-allowed' : 'text-gray-700'
              }`}
            />
            <span className="text-gray-300 text-xs">—</span>
            {/* Range to */}
            <input
              type="number"
              min="1"
              placeholder="Đến"
              value={filters.order_to}
              disabled={!!filters.order_exact}
              onChange={e => setFilter('order_to', e.target.value)}
              className={`w-14 bg-transparent text-sm outline-none text-center placeholder-gray-300 transition-colors ${
                filters.order_exact ? 'opacity-30 cursor-not-allowed' : 'text-gray-700'
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
            <label className="block text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
              <Layers className="w-3 h-3" /> Phiên bản
            </label>
            <select
              value={filters.version}
              onChange={e => { setFilter('version', e.target.value); setFilter('level_id', ''); setFilter('exam_id', ''); }}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">Tất cả</option>
              {versions.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          {/* Level */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Level</label>
            <select
              value={filters.level_id}
              onChange={e => { setFilter('level_id', e.target.value); setFilter('exam_id', ''); }}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">Tất cả</option>
              {filteredLevels.map(l => (
                <option key={l.id} value={l.id}>{l.version} — {l.label}</option>
              ))}
            </select>
          </div>

          {/* Exam type */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Loại bài</label>
            <select
              value={filters.exam_type}
              onChange={e => { setFilter('exam_type', e.target.value); setFilter('exam_id', ''); }}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">Tất cả</option>
              <option value="testing">Testing</option>
              <option value="gmetrix">Gmetrix</option>
            </select>
          </div>

          {/* Specific exam */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Bài thi cụ thể</label>
            <select
              value={filters.exam_id}
              onChange={e => setFilter('exam_id', e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
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
            <label className="block text-xs font-semibold text-gray-500 mb-1">Loại câu hỏi</label>
            <select
              value={filters.question_type}
              onChange={e => setFilter('question_type', e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        {/* ── Mobile Card View ── */}
        <div className="sm:hidden divide-y divide-gray-100">
          {loading ? (
            <div className="px-4 py-14 text-center">
              <Loader2 className="w-6 h-6 text-indigo-400 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-400">Đang tải dữ liệu...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="px-4 py-14 text-center">
              <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-400">Không có câu hỏi nào</p>
              <p className="text-xs text-gray-300 mt-1">
                {activeFilterCount > 0 ? 'Thử thay đổi bộ lọc' : 'Bấm "Thêm câu hỏi" để bắt đầu'}
              </p>
            </div>
          ) : questions.map((q, rowIdx) => {
            const rowNumber   = (page - 1) * PAGE_SIZE + rowIdx + 1;
            const typeInfo    = QUESTION_TYPE_LABELS[q.question_type] || {};
            const correctCount = q.answers?.filter(a => a.is_correct).length || 0;
            const totalAnswers = q.answers?.length || 0;
            const pairsCount  = q.dragdrop_pairs?.length || 0;
            const levelLabel  = q.exams?.exam_levels
              ? `${q.exams.exam_levels.version} ${q.exams.exam_levels.label}` : '';
            return (
              <div key={q.id} className="p-4 active:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  {q.image_url && (
                    <img src={q.image_url} alt="" className="w-11 h-11 rounded-lg object-cover flex-shrink-0 border border-gray-100 mt-0.5" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      {/* Render HTML content */}
                      <div
                        className="text-sm font-medium text-gray-900 line-clamp-3 flex-1 leading-snug"
                        dangerouslySetInnerHTML={{ __html: q.content }}
                      />
                      <span className="text-xs text-gray-300 font-mono flex-shrink-0">#{q.order_index ?? rowNumber}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                      {levelLabel && <span className="text-xs text-gray-500">{levelLabel}</span>}
                      <span className="text-xs text-gray-400">
                        {q.exams?.exam_type === 'testing' ? 'Testing' : 'Gmetrix'} {q.exams?.exam_number}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {q.question_type === 'dragdrop'
                          ? `🔀 ${pairsCount} cặp`
                          : q.question_type === 'truefalse'
                            ? `✅ ${q.truefalse_statements?.length || 0} nhận định`
                          : q.question_type === 'hotspot'
                            ? `🎯 ${q.hotspot_regions?.filter(r => r.is_correct).length || 0} vùng đúng`
                          : <>{totalAnswers} đáp án · <span className="text-emerald-600 font-medium">{correctCount} đúng</span></>
                        }
                      </span>
                      <div className="flex items-center gap-0.5">
                        <button onClick={() => handleEdit(q)}
                          className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(q)}
                          className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th
                  onClick={() => setSortOption(s => s === 'content:asc' ? 'content:desc' : 'content:asc')}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-indigo-600 transition-colors group"
                >
                  <span className="flex items-center gap-1">
                    Nội dung câu hỏi
                    <ArrowUpDown className="w-3 h-3 opacity-40 group-hover:opacity-100 transition-opacity" />
                  </span>
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Loại</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Bài thi</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Đáp án</th>
                <th
                  onClick={() => setSortOption(s => s === 'order_index:asc' ? 'order_index:desc' : 'order_index:asc')}
                  className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-indigo-600 transition-colors group"
                >
                  <span className="flex items-center gap-1">
                    #
                    <ArrowUpDown className="w-3 h-3 opacity-40 group-hover:opacity-100 transition-opacity" />
                  </span>
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <Loader2 className="w-6 h-6 text-indigo-400 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Đang tải dữ liệu...</p>
                  </td>
                </tr>
              ) : questions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-400">Không có câu hỏi nào</p>
                    <p className="text-xs text-gray-300 mt-1">
                      {activeFilterCount > 0 ? 'Thử thay đổi bộ lọc' : 'Bấm "Thêm câu hỏi" để bắt đầu'}
                    </p>
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
                    <tr key={q.id} className="hover:bg-gray-50/80 transition-colors">
                      {/* Content — renders HTML formatting */}
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          {q.image_url && (
                            <img src={q.image_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-gray-100" />
                          )}
                          <div className="min-w-0">
                            <div
                              className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug"
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
                        <p className="text-sm text-gray-700 font-medium">{levelLabel}</p>
                        <p className="text-xs text-gray-400">
                          {q.exams?.exam_type === 'testing' ? 'Testing' : 'Gmetrix'} {q.exams?.exam_number}
                        </p>
                      </td>

                      {/* Answer count */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        {q.question_type === 'dragdrop' ? (
                          <span className="text-xs text-gray-500">🔀 {pairsCount} cặp</span>
                        ) : q.question_type === 'truefalse' ? (
                          <span className="text-xs text-gray-500">✅ {q.truefalse_statements?.length || 0} nhận định</span>
                        ) : q.question_type === 'hotspot' ? (
                          <span className="text-xs text-gray-500">🎯 {q.hotspot_regions?.filter(r => r.is_correct).length || 0} vùng đúng</span>
                        ) : (
                          <div className="text-xs">
                            <span className="text-gray-700 font-medium">{totalAnswers}</span>
                            <span className="text-gray-400"> đáp án · </span>
                            <span className="text-emerald-600 font-medium">{correctCount} đúng</span>
                          </div>
                        )}
                      </td>

                      {/* Order index */}
                      <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-400 font-mono">
                        {q.order_index ?? '—'}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(q)}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(q)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
          <div className="border-t border-gray-100 bg-gray-50">
            {/* Mobile */}
            <div className="flex items-center justify-between px-4 py-3 sm:hidden">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Trước
              </button>
              <span className="text-sm text-gray-500">Trang <strong>{page}</strong> / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Sau <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            {/* Desktop */}
            <div className="hidden sm:flex items-center justify-between px-6 py-4">
              <p className="text-sm text-gray-500">
                Hiển thị {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, totalCount)} trong {totalCount} câu hỏi
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white hover:border-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
                      <span key={`ellipsis-${i}`} className="px-2 text-gray-400 text-sm">…</span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => setPage(item)}
                        className={`min-w-[36px] h-9 text-sm rounded-lg border transition-colors font-medium
                          ${page === item
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'border-gray-200 text-gray-600 hover:bg-white hover:border-indigo-300'}`}
                      >
                        {item}
                      </button>
                    )
                  )}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white hover:border-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
