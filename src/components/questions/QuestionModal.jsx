import React, { useEffect, useState, useCallback } from 'react';
import { X, Plus, Trash2, Save, Loader2, Eye, EyeOff, ArrowLeftRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ImageUploader } from './ImageUploader';
import { AnswerEditor } from './AnswerEditor';

const DEFAULT_ANSWER = (order = 0) => ({
  id: crypto.randomUUID(),
  content: '',
  image_url: null,
  is_correct: false,
  order_index: order,
});

const DEFAULT_PAIR = (order = 0) => ({
  id: crypto.randomUUID(),
  drag_content: '',
  drag_image_url: null,
  drop_content: '',
  drop_image_url: null,
  order_index: order,
});

const INITIAL_FORM = {
  level_id: '',
  exam_type: 'testing',
  exam_id: '',
  question_type: 'choice',
  content: '',
  image_url: null,
  order_index: 0,
};

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {function} props.onClose
 * @param {function} props.onSaved - called after successful save
 * @param {object|null} props.editQuestion - question to edit (null = add mode)
 */
export const QuestionModal = ({ open, onClose, onSaved, editQuestion = null }) => {
  const [levels, setLevels] = useState([]);
  const [exams, setExams] = useState([]);
  const [filteredExams, setFilteredExams] = useState([]);

  const [form, setForm] = useState(INITIAL_FORM);
  const [answers, setAnswers] = useState([DEFAULT_ANSWER(0), DEFAULT_ANSWER(1), DEFAULT_ANSWER(2), DEFAULT_ANSWER(3)]);
  const [pairs, setPairs] = useState([DEFAULT_PAIR(0), DEFAULT_PAIR(1)]);

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPreview, setShowPreview] = useState(false);

  // Load levels + exams once
  useEffect(() => {
    if (!open) return;
    const load = async () => {
      const [{ data: lvls }, { data: exs }] = await Promise.all([
        supabase.from('exam_levels').select('*').order('version').order('level_number'),
        supabase.from('exams').select('*').order('exam_type').order('exam_number'),
      ]);
      setLevels(lvls || []);
      setExams(exs || []);
    };
    load();
  }, [open]);

  // Populate form when editing
  useEffect(() => {
    if (!open) return;
    if (editQuestion) {
      // Find level from exam
      const exam = exams.find((e) => e.id === editQuestion.exam_id);
      setForm({
        level_id: exam?.level_id || '',
        exam_type: exam?.exam_type || 'testing',
        exam_id: editQuestion.exam_id || '',
        question_type: editQuestion.question_type,
        content: editQuestion.content,
        image_url: editQuestion.image_url || null,
        order_index: editQuestion.order_index || 0,
      });
      setAnswers(editQuestion._answers || [DEFAULT_ANSWER()]);
      setPairs(editQuestion._pairs || [DEFAULT_PAIR()]);
    } else {
      resetForm();
    }
  }, [open, editQuestion, exams]);

  // Filter exams by level + type
  useEffect(() => {
    if (!form.level_id) {
      setFilteredExams([]);
      return;
    }
    const filtered = exams.filter(
      (e) => e.level_id === form.level_id && e.exam_type === form.exam_type
    );
    setFilteredExams(filtered);
    // Reset exam selection if current choice doesn't belong to new filter
    if (!filtered.find((e) => e.id === form.exam_id)) {
      setForm((f) => ({ ...f, exam_id: filtered[0]?.id || '' }));
    }
  }, [form.level_id, form.exam_type, exams]);

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setAnswers([DEFAULT_ANSWER(0), DEFAULT_ANSWER(1), DEFAULT_ANSWER(2), DEFAULT_ANSWER(3)]);
    setPairs([DEFAULT_PAIR(0), DEFAULT_PAIR(1)]);
    setErrors({});
    setShowPreview(false);
  };

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const validate = () => {
    const e = {};
    if (!form.level_id) e.level_id = 'Chọn Level';
    if (!form.exam_id) e.exam_id = 'Chọn bài thi';
    if (!form.content.trim()) e.content = 'Nhập nội dung câu hỏi';
    if (form.question_type !== 'dragdrop') {
      if (answers.length < 2) e.answers = 'Cần ít nhất 2 đáp án';
      if (!answers.some((a) => a.is_correct)) e.answers = 'Phải có ít nhất 1 đáp án đúng';
      if (answers.some((a) => !a.content.trim())) e.answers = 'Mỗi đáp án phải có nội dung';
    } else {
      if (pairs.length < 1) e.pairs = 'Cần ít nhất 1 cặp kéo-thả';
      if (pairs.some((p) => !p.drag_content.trim() || !p.drop_content.trim()))
        e.pairs = 'Mỗi cặp phải có đủ nội dung';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      let questionId = editQuestion?.id;

      const questionData = {
        exam_id: form.exam_id,
        question_type: form.question_type,
        content: form.content.trim(),
        image_url: form.image_url,
        order_index: Number(form.order_index) || 0,
      };

      if (editQuestion) {
        const { error } = await supabase
          .from('questions')
          .update({ ...questionData, updated_at: new Date().toISOString() })
          .eq('id', questionId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('questions')
          .insert(questionData)
          .select('id')
          .single();
        if (error) throw error;
        questionId = data.id;
      }

      // Save answers / dragdrop pairs
      if (form.question_type !== 'dragdrop') {
        // Delete old answers if editing
        if (editQuestion) {
          await supabase.from('answers').delete().eq('question_id', questionId);
        }
        const answerRows = answers.map((a, i) => ({
          question_id: questionId,
          content: a.content.trim(),
          image_url: a.image_url || null,
          is_correct: a.is_correct,
          order_index: i,
        }));
        const { error: ansErr } = await supabase.from('answers').insert(answerRows);
        if (ansErr) throw ansErr;
      } else {
        if (editQuestion) {
          await supabase.from('dragdrop_pairs').delete().eq('question_id', questionId);
        }
        const pairRows = pairs.map((p, i) => ({
          question_id: questionId,
          drag_content: p.drag_content.trim(),
          drag_image_url: p.drag_image_url || null,
          drop_content: p.drop_content.trim(),
          drop_image_url: p.drop_image_url || null,
          order_index: i,
        }));
        const { error: pairErr } = await supabase.from('dragdrop_pairs').insert(pairRows);
        if (pairErr) throw pairErr;
      }

      onSaved();
      handleClose();
    } catch (err) {
      setErrors({ submit: err.message || 'Lỗi khi lưu câu hỏi' });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const addPair = () => setPairs((p) => [...p, DEFAULT_PAIR(p.length)]);
  const removePair = (i) => setPairs((p) => p.filter((_, idx) => idx !== i));
  const updatePair = (i, field, val) =>
    setPairs((p) => p.map((pair, idx) => (idx === i ? { ...pair, [field]: val } : pair)));

  if (!open) return null;

  const selectedLevel = levels.find((l) => l.id === form.level_id);
  const selectedExam = filteredExams.find((e) => e.id === form.exam_id);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative min-h-full sm:flex sm:items-start sm:justify-center sm:p-4 sm:pt-8 sm:pb-16">
        <div className="relative w-full sm:max-w-3xl bg-white sm:rounded-2xl shadow-2xl flex flex-col min-h-screen sm:min-h-0">
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                {editQuestion ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi mới'}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5 hidden sm:block">
                Điền đầy đủ thông tin để lưu câu hỏi vào ngân hàng đề
              </p>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setShowPreview((v) => !v)}
                className="flex items-center gap-1.5 px-2.5 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"
              >
                {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span className="hidden sm:inline">{showPreview ? 'Ẩn xem trước' : 'Xem trước'}</span>
              </button>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-5 sm:space-y-6 overflow-y-auto flex-1">

            {/* === Section 1: Chọn bài thi === */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                1. Thuộc về bài thi
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Level */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.level_id}
                    onChange={(e) => set('level_id', e.target.value)}
                    className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.level_id ? 'border-red-400' : 'border-gray-200'
                    }`}
                  >
                    <option value="">-- Chọn Level --</option>
                    {(() => {
                      const versions = [...new Set(levels.map(l => l.version))].sort();
                      return versions.map(v => (
                        <optgroup key={v} label={`── IC3 ${v} ──`}>
                          {levels.filter(l => l.version === v).map(l => (
                            <option key={l.id} value={l.id}>
                              {v} — {l.label}
                            </option>
                          ))}
                        </optgroup>
                      ));
                    })()}
                  </select>
                  {errors.level_id && <p className="text-xs text-red-500 mt-1">{errors.level_id}</p>}
                </div>

                {/* Exam type */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Loại bài</label>
                  <div className="flex gap-2">
                    {['testing', 'gmetrix'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => set('exam_type', t)}
                        className={`flex-1 py-2 text-sm rounded-lg border font-medium transition-colors capitalize ${
                          form.exam_type === t
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Exam number */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Số thứ tự bài <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.exam_id}
                    onChange={(e) => set('exam_id', e.target.value)}
                    disabled={!form.level_id}
                    className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 ${
                      errors.exam_id ? 'border-red-400' : 'border-gray-200'
                    }`}
                  >
                    <option value="">-- Chọn bài --</option>
                    {filteredExams.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.exam_type === 'testing' ? 'Testing' : 'Gmetrix'} {e.exam_number}
                      </option>
                    ))}
                  </select>
                  {errors.exam_id && <p className="text-xs text-red-500 mt-1">{errors.exam_id}</p>}
                </div>
              </div>

              {/* Order index */}
              <div className="flex items-center gap-4">
                <div className="w-40">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Thứ tự câu</label>
                  <input
                    type="number"
                    min={0}
                    value={form.order_index}
                    onChange={(e) => set('order_index', e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                {form.exam_id && selectedExam && (
                  <div className="text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
                    📋 {selectedLevel?.label} · {selectedExam.exam_type === 'testing' ? 'Testing' : 'Gmetrix'} {selectedExam.exam_number}
                  </div>
                )}
              </div>
            </div>

            {/* === Section 2: Loại câu hỏi === */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                2. Loại câu hỏi
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'choice', label: 'Chọn một', desc: 'Single choice', icon: '🔘' },
                  { value: 'multi', label: 'Chọn nhiều', desc: 'Multiple choice', icon: '☑️' },
                  { value: 'dragdrop', label: 'Kéo thả', desc: 'Drag & Drop', icon: '🔀' },
                ].map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => set('question_type', t.value)}
                    className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                      form.question_type === t.value
                        ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <span className="text-2xl mb-1">{t.icon}</span>
                    <span className={`text-sm font-semibold ${form.question_type === t.value ? 'text-indigo-700' : 'text-gray-700'}`}>
                      {t.label}
                    </span>
                    <span className="text-xs text-gray-400">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* === Section 3: Nội dung câu hỏi === */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                3. Nội dung câu hỏi
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Câu hỏi <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={form.content}
                    onChange={(e) => set('content', e.target.value)}
                    placeholder="Nhập nội dung câu hỏi..."
                    rows={3}
                    className={`w-full text-sm border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none ${
                      errors.content ? 'border-red-400' : 'border-gray-200'
                    }`}
                  />
                  {errors.content && <p className="text-xs text-red-500 mt-1">{errors.content}</p>}
                </div>

                <ImageUploader
                  bucket="question-images"
                  value={form.image_url}
                  onChange={(url) => set('image_url', url)}
                  label="Ảnh câu hỏi (tuỳ chọn)"
                />
              </div>
            </div>

            {/* === Section 4: Đáp án === */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                4. {form.question_type === 'dragdrop' ? 'Cặp kéo-thả' : 'Đáp án'}
              </h3>

              {errors.answers && (
                <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                  ⚠️ {errors.answers}
                </div>
              )}
              {errors.pairs && (
                <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                  ⚠️ {errors.pairs}
                </div>
              )}

              {form.question_type === 'dragdrop' ? (
                /* Drag-drop pairs editor — card layout with images */
                <div className="space-y-4">
                  {pairs.map((pair, i) => (
                    <div key={pair.id} className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                      {/* Pair header */}
                      <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-b border-gray-200">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                          Cặp {i + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removePair(i)}
                          className="text-gray-300 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Two-column on desktop, stacked on mobile */}
                      <div className="flex flex-col sm:grid sm:grid-cols-[1fr_32px_1fr] gap-0">

                        {/* ── Drag side ── */}
                        <div className="p-4 space-y-3 border-b sm:border-b-0 sm:border-r border-gray-200">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-700">
                              🔵 Kéo (Drag)
                            </span>
                          </div>
                          <input
                            value={pair.drag_content}
                            onChange={(e) => updatePair(i, 'drag_content', e.target.value)}
                            placeholder={`Nội dung kéo ${i + 1}...`}
                            className="w-full text-sm border border-gray-200 bg-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                          />
                          <ImageUploader
                            bucket="question-images"
                            value={pair.drag_image_url}
                            onChange={(url) => updatePair(i, 'drag_image_url', url)}
                            label="Ảnh (tuỳ chọn)"
                          />
                        </div>

                        {/* Arrow divider (desktop only) */}
                        <div className="hidden sm:flex items-center justify-center bg-gray-50">
                          <ArrowLeftRight className="w-4 h-4 text-gray-300" />
                        </div>

                        {/* ── Drop side ── */}
                        <div className="p-4 space-y-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-700">
                              🟣 Thả (Drop)
                            </span>
                          </div>
                          <input
                            value={pair.drop_content}
                            onChange={(e) => updatePair(i, 'drop_content', e.target.value)}
                            placeholder={`Nội dung thả ${i + 1}...`}
                            className="w-full text-sm border border-gray-200 bg-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
                          />
                          <ImageUploader
                            bucket="answer-images"
                            value={pair.drop_image_url}
                            onChange={(url) => updatePair(i, 'drop_image_url', url)}
                            label="Ảnh (tuỳ chọn)"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addPair}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium border border-dashed border-indigo-300 hover:border-indigo-500 rounded-xl w-full justify-center transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Thêm cặp kéo-thả
                  </button>
                </div>
              ) : (
                /* Answer editor for choice / multi */
                <AnswerEditor
                  answers={answers}
                  onChange={setAnswers}
                  multiSelect={form.question_type === 'multi'}
                />
              )}
            </div>

            {/* === Preview === */}
            {showPreview && (
              <div className="border-t border-dashed border-gray-200 pt-6">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                  👁 Xem trước
                </h3>
                <div className="bg-gray-900 text-white rounded-xl p-5 space-y-4">
                  <p className="font-medium text-base">{form.content || <span className="text-gray-400 italic">Chưa có nội dung</span>}</p>
                  {form.image_url && (
                    <img src={form.image_url} alt="Question" className="max-h-48 rounded-lg object-contain" />
                  )}
                  {form.question_type !== 'dragdrop' ? (
                    <div className="space-y-2">
                      {answers.map((a, i) => (
                        <div
                          key={a.id}
                          className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border ${
                            a.is_correct
                              ? 'border-emerald-400 bg-emerald-900/40 text-emerald-300'
                              : 'border-gray-600 bg-gray-800'
                          }`}
                        >
                          <span className="font-bold text-sm">{String.fromCharCode(65 + i)}.</span>
                          <span className="text-sm flex-1">{a.content || <em className="text-gray-500">Chưa có nội dung</em>}</span>
                          {a.image_url && <img src={a.image_url} alt="" className="h-8 w-8 rounded object-cover" />}
                          {a.is_correct && <span className="text-emerald-400 text-xs font-semibold">✓ Đúng</span>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pairs.map((p, i) => (
                        <div key={p.id} className="flex items-center gap-3 text-sm">
                          {/* Drag item */}
                          <div className="flex flex-col items-center gap-1.5 px-3 py-2 bg-blue-900/50 border border-blue-500 rounded-lg min-w-[90px]">
                            {p.drag_image_url && (
                              <img src={p.drag_image_url} alt="drag" className="h-12 w-16 object-contain rounded" />
                            )}
                            <span>{p.drag_content || <em className="text-gray-500">...</em>}</span>
                          </div>
                          <span className="text-gray-400 text-base">→</span>
                          {/* Drop item */}
                          <div className="flex flex-col items-center gap-1.5 px-3 py-2 bg-purple-900/50 border border-purple-500 rounded-lg min-w-[90px]">
                            {p.drop_image_url && (
                              <img src={p.drop_image_url} alt="drop" className="h-12 w-16 object-contain rounded" />
                            )}
                            <span>{p.drop_content || <em className="text-gray-500">...</em>}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Submit error */}
            {errors.submit && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                ❌ {errors.submit}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3 px-4 sm:px-6 py-4 border-t border-gray-100 bg-gray-50 sm:rounded-b-2xl">
            <button
              type="button"
              onClick={handleClose}
              className="w-full sm:w-auto px-5 py-3 sm:py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl sm:rounded-lg transition-colors text-center"
            >
              Huỷ
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 sm:py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl sm:rounded-lg transition-colors disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Đang lưu...' : editQuestion ? 'Cập nhật' : 'Lưu câu hỏi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
