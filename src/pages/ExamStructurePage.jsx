import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  Plus, Trash2, Edit2, ChevronDown, ChevronUp,
  Layers, BookOpen, Clock, X, Save, Loader2, AlertTriangle
} from 'lucide-react';

const EXAM_TYPE_LABELS = { testing: 'Testing', gmetrix: 'Gmetrix' };

const Toast = ({ toast }) =>
  toast ? (
    <div className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-medium transition-all
      ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
      {toast.type === 'error' ? '❌' : '✅'} {toast.msg}
    </div>
  ) : null;

/* ─── Add Version Modal ─── */
const AddVersionModal = ({ open, onClose, onSaved, existingVersions }) => {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => { if (open) { setName(''); setErr(''); } }, [open]);

  const handleSave = async () => {
    const v = name.trim().toUpperCase();
    if (!v) return setErr('Nhập tên phiên bản (VD: GS8)');
    if (existingVersions.includes(v)) return setErr(`Phiên bản ${v} đã tồn tại`);
    setSaving(true);
    const { error } = await supabase.from('exam_levels').insert({ version: v, level_number: 1, label: 'Level 1' });
    setSaving(false);
    if (error) return setErr(error.message);
    onSaved(v);
    onClose();
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Thêm phiên bản IC3 mới</h3>
        <label className="block text-xs font-medium text-gray-600 mb-1">Tên phiên bản <span className="text-red-500">*</span></label>
        <input
          value={name} onChange={e => setName(e.target.value)}
          placeholder="VD: GS8, GS9..."
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          className={`w-full text-sm border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase ${err ? 'border-red-400' : 'border-gray-200'}`}
        />
        {err && <p className="text-xs text-red-500 mt-1">{err}</p>}
        <p className="text-xs text-gray-400 mt-2">Level 1 sẽ được tạo tự động. Bạn có thể thêm Level 2, 3... sau.</p>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Huỷ</button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Tạo phiên bản
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Add Level Modal ─── */
const AddLevelModal = ({ open, onClose, onSaved, version, existingLevels }) => {
  const [levelNum, setLevelNum] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => { if (open) { setLevelNum(''); setErr(''); } }, [open]);

  const handleSave = async () => {
    const n = parseInt(levelNum);
    if (!n || n < 1) return setErr('Nhập số level hợp lệ (VD: 4)');
    if (existingLevels.includes(n)) return setErr(`Level ${n} đã tồn tại trong ${version}`);
    setSaving(true);
    const { error } = await supabase.from('exam_levels').insert({ version, level_number: n, label: `Level ${n}` });
    setSaving(false);
    if (error) return setErr(error.message);
    onSaved();
    onClose();
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-1">Thêm Level mới</h3>
        <p className="text-sm text-gray-500 mb-4">Phiên bản: <span className="font-semibold text-indigo-600">{version}</span></p>
        <label className="block text-xs font-medium text-gray-600 mb-1">Số Level <span className="text-red-500">*</span></label>
        <input
          type="number" min={1} value={levelNum} onChange={e => setLevelNum(e.target.value)}
          placeholder="VD: 4"
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          className={`w-full text-sm border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${err ? 'border-red-400' : 'border-gray-200'}`}
        />
        {err && <p className="text-xs text-red-500 mt-1">{err}</p>}
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Huỷ</button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Thêm Level
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Add/Edit Exam Modal ─── */
const ExamModal = ({ open, onClose, onSaved, levelId, levelLabel, editExam }) => {
  const [form, setForm] = useState({ exam_type: 'testing', exam_number: '', title: '', duration_seconds: 3600 });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!open) return;
    if (editExam) {
      setForm({ exam_type: editExam.exam_type, exam_number: editExam.exam_number, title: editExam.title, duration_seconds: editExam.duration_seconds });
    } else {
      setForm({ exam_type: 'testing', exam_number: '', title: '', duration_seconds: 3600 });
    }
    setErr('');
  }, [open, editExam]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.exam_number) return setErr('Nhập số thứ tự bài thi');
    if (!form.title.trim()) return setErr('Nhập tên bài thi');
    if (!form.duration_seconds || form.duration_seconds < 60) return setErr('Thời gian tối thiểu 60 giây');
    setSaving(true);
    const payload = {
      level_id: levelId,
      exam_type: form.exam_type,
      exam_number: Number(form.exam_number),
      title: form.title.trim(),
      duration_seconds: Number(form.duration_seconds),
    };
    let error;
    if (editExam) {
      ({ error } = await supabase.from('exams').update(payload).eq('id', editExam.id));
    } else {
      ({ error } = await supabase.from('exams').insert(payload));
    }
    setSaving(false);
    if (error) return setErr(error.message);
    onSaved();
    onClose();
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{editExam ? 'Sửa bài thi' : 'Thêm bài thi mới'}</h3>
            <p className="text-xs text-gray-500 mt-0.5">Thuộc: <span className="font-semibold text-indigo-600">{levelLabel}</span></p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
        </div>

        {/* Exam type toggle */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-600 mb-1">Loại bài</label>
          <div className="flex gap-2">
            {['testing', 'gmetrix'].map(t => (
              <button key={t} type="button" onClick={() => set('exam_type', t)}
                className={`flex-1 py-2 text-sm rounded-xl border font-medium capitalize transition-colors
                  ${form.exam_type === t ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Số thứ tự <span className="text-red-500">*</span></label>
            <input type="number" min={1} value={form.exam_number} onChange={e => set('exam_number', e.target.value)}
              placeholder="1, 2, 3..."
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Thời gian (giây)</label>
            <input type="number" min={60} value={form.duration_seconds} onChange={e => set('duration_seconds', e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-600 mb-1">Tên bài thi <span className="text-red-500">*</span></label>
          <input value={form.title} onChange={e => set('title', e.target.value)}
            placeholder={`VD: ${form.exam_type === 'testing' ? 'Testing' : 'Gmetrix'} ${form.exam_number || 1}`}
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        {err && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-3">{err}</p>}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Huỷ</button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {editExam ? 'Cập nhật' : 'Thêm bài thi'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Confirm Dialog ─── */
const ConfirmDialog = ({ open, title, message, onConfirm, onCancel, loading }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} disabled={loading}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            Huỷ
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex items-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {loading ? 'Đang xoá...' : 'Xoá'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Exam Row ─── */

const ExamRow = ({ exam, onEdit, onDelete }) => (
  <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors group">
    <div className="flex items-center gap-3">
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold
        ${exam.exam_type === 'testing' ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'}`}>
        {EXAM_TYPE_LABELS[exam.exam_type]} {exam.exam_number}
      </span>
      <span className="text-sm text-gray-700 font-medium">{exam.title}</span>
    </div>
    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <span className="text-xs text-gray-400 flex items-center gap-1 mr-2">
        <Clock className="w-3 h-3" /> {Math.floor(exam.duration_seconds / 60)} phút
      </span>
      <button onClick={() => onEdit(exam)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Sửa">
        <Edit2 className="w-3.5 h-3.5" />
      </button>
      <button onClick={() => onDelete(exam)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Xoá">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  </div>
);

/* ─── Level Accordion ─── */
const LevelSection = ({ level, exams, onRefresh, showToast }) => {
  const [expanded, setExpanded] = useState(false);
  const [examModal, setExamModal] = useState({ open: false, edit: null });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, exam: null, deleting: false });
  const [confirmLevelDialog, setConfirmLevelDialog] = useState({ open: false, deleting: false });

  const testingExams = exams.filter(e => e.exam_type === 'testing').sort((a, b) => a.exam_number - b.exam_number);
  const gmetrixExams = exams.filter(e => e.exam_type === 'gmetrix').sort((a, b) => a.exam_number - b.exam_number);

  const handleDeleteExamClick = async (exam) => {
    try {
      const { count: qCount, error: qErr } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('exam_id', exam.id);
      if (qErr) { showToast('Lỗi kiểm tra: ' + qErr.message, 'error'); return; }
      if (qCount > 0) {
        showToast(`Không thể xoá: bài thi còn ${qCount} câu hỏi. Xoá trong trang "Questions" trước.`, 'error');
        return;
      }
      setConfirmDialog({ open: true, exam, deleting: false });
    } catch (err) {
      showToast('Lỗi: ' + err.message, 'error');
    }
  };

  const doDeleteExam = async () => {
    const { exam } = confirmDialog;
    setConfirmDialog(d => ({ ...d, deleting: true }));
    try {
      const { data: deleted, error } = await supabase
        .from('exams').delete().eq('id', exam.id).select('id');
      if (error) {
        showToast('Lỗi khi xoá: ' + error.message, 'error');
      } else if (!deleted || deleted.length === 0) {
        showToast('Xoá thất bại: kiểm tra lại quyền hoặc bài thi có lượt thi.', 'error');
      } else {
        showToast('Đã xoá bài thi thành công');
        onRefresh();
      }
    } catch (err) {
      showToast('Lỗi: ' + err.message, 'error');
    } finally {
      setConfirmDialog({ open: false, exam: null, deleting: false });
    }
  };

  const handleDeleteLevelClick = () => {
    if (exams.length > 0) {
      showToast(`Không thể xoá: Level này còn ${exams.length} bài thi.`, 'error');
      return;
    }
    setConfirmLevelDialog({ open: true, deleting: false });
  };

  const doDeleteLevel = async () => {
    setConfirmLevelDialog(d => ({ ...d, deleting: true }));
    try {
      const { data: deleted, error } = await supabase
        .from('exam_levels').delete().eq('id', level.id).select('id');
      if (error) showToast('Lỗi: ' + error.message, 'error');
      else if (!deleted || deleted.length === 0) showToast('Xoá thất bại: kiểm tra quyền.', 'error');
      else { showToast('Đã xoá level thành công'); onRefresh(); }
    } catch (err) {
      showToast('Lỗi: ' + err.message, 'error');
    } finally {
      setConfirmLevelDialog({ open: false, deleting: false });
    }
  };

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden">
      {/* Level header */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-gray-50 to-white">
        <button onClick={() => setExpanded(v => !v)} className="flex items-center gap-3 flex-1 text-left">
          <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
            {level.level_number}
          </div>
          <span className="font-semibold text-gray-800">{level.label}</span>
          <span className="text-xs text-gray-400">{exams.length} bài thi</span>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>
        <div className="flex items-center gap-1">
          <button onClick={() => setExamModal({ open: true, edit: null })}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
            <Plus className="w-3.5 h-3.5" /> Thêm bài thi
          </button>
          <button onClick={handleDeleteLevelClick}
            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Xoá level">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Exam list */}
      {expanded && (
        <div className="px-4 py-3 border-t border-gray-100 bg-white">
          {exams.length === 0 ? (
            <div className="text-center py-6 text-sm text-gray-400">
              <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-200" />
              Chưa có bài thi nào. Bấm "Thêm bài thi" để bắt đầu.
            </div>
          ) : (
            <div className="space-y-1">
              {testingExams.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-bold text-blue-500 uppercase tracking-wide mb-1 px-1">Testing</p>
                  {testingExams.map(e => (
                    <ExamRow key={e.id} exam={e}
                      onEdit={ex => setExamModal({ open: true, edit: ex })}
                      onDelete={handleDeleteExamClick} />
                  ))}
                </div>
              )}
              {gmetrixExams.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-violet-500 uppercase tracking-wide mb-1 px-1">Gmetrix</p>
                  {gmetrixExams.map(e => (
                    <ExamRow key={e.id} exam={e}
                      onEdit={ex => setExamModal({ open: true, edit: ex })}
                      onDelete={handleDeleteExamClick} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <ExamModal
        open={examModal.open}
        onClose={() => setExamModal({ open: false, edit: null })}
        onSaved={() => { onRefresh(); showToast(examModal.edit ? 'Đã cập nhật bài thi' : 'Đã thêm bài thi'); }}
        levelId={level.id}
        levelLabel={`${level.version} ${level.label}`}
        editExam={examModal.edit}
      />

      <ConfirmDialog
        open={confirmDialog.open}
        title="Xoá bài thi"
        message={`Bạn có chắc muốn xoá "${confirmDialog.exam?.title}"? Thao tác này không thể hoàn tác.`}
        onConfirm={doDeleteExam}
        onCancel={() => setConfirmDialog({ open: false, exam: null, deleting: false })}
        loading={confirmDialog.deleting}
      />

      <ConfirmDialog
        open={confirmLevelDialog.open}
        title="Xoá Level"
        message={`Bạn có chắc muốn xoá "${level.version} ${level.label}"? Thao tác này không thể hoàn tác.`}
        onConfirm={doDeleteLevel}
        onCancel={() => setConfirmLevelDialog({ open: false, deleting: false })}
        loading={confirmLevelDialog.deleting}
      />
    </div>
  );
};

/* ─── Main Page ─── */
export const ExamStructurePage = () => {
  const [levels, setLevels] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeVersion, setActiveVersion] = useState(null);
  const [addVersionOpen, setAddVersionOpen] = useState(false);
  const [addLevelOpen, setAddLevelOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: lvls }, { data: exs }] = await Promise.all([
      supabase.from('exam_levels').select('*').order('version').order('level_number'),
      supabase.from('exams').select('*').order('exam_type').order('exam_number'),
    ]);
    setLevels(lvls || []);
    setExams(exs || []);
    setLoading(false);
  }, []);

  // Set initial active version ONLY once when data first loads
  useEffect(() => {
    if (levels.length > 0 && !activeVersion) {
      setActiveVersion(levels[0].version);
    }
  }, [levels]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Group by version
  const versions = [...new Set(levels.map(l => l.version))].sort();
  const activeLevels = levels.filter(l => l.version === activeVersion).sort((a, b) => a.level_number - b.level_number);
  const existingLevelNumbers = activeLevels.map(l => l.level_number);

  const getExamsForLevel = (levelId) => exams.filter(e => e.level_id === levelId);

  if (loading) return (
    <div className="max-w-5xl mx-auto px-6 py-12 flex items-center justify-center gap-3 text-gray-400">
      <Loader2 className="w-5 h-5 animate-spin" /> Đang tải cấu trúc...
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Toast toast={toast} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Layers className="w-8 h-8 text-indigo-600" />
            Cấu trúc bài thi IC3
          </h1>
          <p className="mt-1.5 text-sm text-gray-500">Quản lý phiên bản, level và danh sách bài thi</p>
        </div>
        <button onClick={() => setAddVersionOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors">
          <Plus className="w-4 h-4" /> Thêm phiên bản
        </button>
      </div>

      {/* Version tabs */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {versions.map(v => (
          <button key={v} onClick={() => setActiveVersion(v)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold border-2 transition-all
              ${activeVersion === v
                ? 'border-indigo-500 bg-indigo-600 text-white shadow-md shadow-indigo-200'
                : 'border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50'}`}>
            {v}
          </button>
        ))}
        {versions.length === 0 && (
          <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
            <AlertTriangle className="w-4 h-4" />
            Chưa có phiên bản nào. Bấm "Thêm phiên bản" để bắt đầu.
          </div>
        )}
      </div>

      {/* Content area */}
      {activeVersion && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {/* Version header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">IC3 {activeVersion}</h2>
              <p className="text-sm text-gray-500">{activeLevels.length} level · {exams.filter(e => activeLevels.find(l => l.id === e.level_id)).length} bài thi</p>
            </div>
            <button onClick={() => setAddLevelOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-xl transition-colors">
              <Plus className="w-4 h-4" /> Thêm Level
            </button>
          </div>

          {activeLevels.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Layers className="w-12 h-12 mx-auto mb-3 text-gray-200" />
              <p className="text-sm font-medium">Chưa có Level nào</p>
              <p className="text-xs mt-1">Bấm "Thêm Level" để thêm Level 1, 2, 3...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeLevels.map(level => (
                <LevelSection
                  key={level.id}
                  level={level}
                  exams={getExamsForLevel(level.id)}
                  onRefresh={fetchData}
                  showToast={showToast}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <AddVersionModal
        open={addVersionOpen}
        onClose={() => setAddVersionOpen(false)}
        onSaved={(v) => { fetchData(); setActiveVersion(v); showToast(`Đã tạo phiên bản ${v}`); }}
        existingVersions={versions}
      />
      <AddLevelModal
        open={addLevelOpen}
        onClose={() => setAddLevelOpen(false)}
        onSaved={() => { fetchData(); showToast('Đã thêm Level mới'); }}
        version={activeVersion}
        existingLevels={existingLevelNumbers}
      />
    </div>
  );
};
