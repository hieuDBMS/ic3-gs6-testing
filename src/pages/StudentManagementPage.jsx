import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import {
  Plus, Trash2, Key, Search, X, Eye, EyeOff,
  Users, UserCheck, UserX, ChevronRight, AlertTriangle,
  CheckCircle, RotateCcw, GraduationCap
} from 'lucide-react';

/* ─── Toast ─────────────────────────────────────────────────── */
const Toast = ({ toasts, removeToast }) => (
  <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
    {toasts.map(t => (
      <div
        key={t.id}
        className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white pointer-events-auto transition-all
          ${t.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}
      >
        {t.type === 'success'
          ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
          : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
        <span>{t.message}</span>
        <button onClick={() => removeToast(t.id)} className="ml-2 opacity-70 hover:opacity-100">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    ))}
  </div>
);

function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);
  const remove = useCallback(id => setToasts(p => p.filter(t => t.id !== id)), []);
  return { toasts, add, remove };
}

/* ─── Confirm Dialog ─────────────────────────────────────────── */
const ConfirmDialog = ({ student, onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-100 mx-auto mb-4">
        <Trash2 className="w-7 h-7 text-red-500" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 text-center mb-1">Xoá học sinh</h3>
      <p className="text-sm text-gray-500 text-center mb-1">
        Bạn sắp xoá tài khoản của
      </p>
      <p className="text-base font-semibold text-gray-900 text-center mb-2">{student?.full_name}</p>
      <p className="text-xs text-red-500 text-center bg-red-50 rounded-lg px-3 py-2 mb-6">
        ⚠️ Toàn bộ lịch sử làm bài sẽ bị xoá vĩnh viễn. Không thể hoàn tác!
      </p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={loading}
          className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition disabled:opacity-50"
        >
          Huỷ
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <><RotateCcw className="w-4 h-4 animate-spin" /> Đang xoá...</>
          ) : (
            <><Trash2 className="w-4 h-4" /> Xoá</>
          )}
        </button>
      </div>
    </div>
  </div>
);

/* ─── Stat Card ──────────────────────────────────────────────── */
const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className={`flex items-center gap-3 bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-3`}>
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  </div>
);

/* ─── Student Card (mobile) ─────────────────────────────────── */
const StudentCard = ({ student, onResetPassword, onDelete, onProgress }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
    <div className="flex items-start justify-between gap-2 mb-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
          {student.full_name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-gray-900 text-sm truncate">{student.full_name}</div>
          <div className="text-xs text-gray-500 truncate">{student.email}</div>
        </div>
      </div>
      <span className={`flex-shrink-0 px-2 py-0.5 text-xs font-semibold rounded-full ${student.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
        {student.is_active ? 'Hoạt động' : 'Đã khoá'}
      </span>
    </div>
    <div className="text-xs text-gray-400 mb-3">
      Ngày tạo: {new Date(student.created_at).toLocaleDateString('vi-VN')}
    </div>
    <div className="flex items-center gap-2">
      <Link
        to={`/teacher/students/${student.id}`}
        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-50 text-blue-600 text-xs font-semibold hover:bg-blue-100 transition"
      >
        <ChevronRight className="w-3.5 h-3.5" /> Tiến độ
      </Link>
      <button
        onClick={() => onResetPassword(student)}
        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-amber-50 text-amber-600 text-xs font-semibold hover:bg-amber-100 transition"
      >
        <Key className="w-3.5 h-3.5" /> Mật khẩu
      </button>
      <button
        onClick={() => onDelete(student)}
        className="flex items-center justify-center w-9 h-9 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  </div>
);

/* ─── Main Page ──────────────────────────────────────────────── */
export const StudentManagementPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [modal, setModal] = useState(null);
  const [confirmStudent, setConfirmStudent] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const { toasts, add: addToast, remove: removeToast } = useToast();

  useEffect(() => { fetchStudents(); }, []);

  const fetchStudents = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, created_at, is_active')
      .eq('role', 'student')
      .order('created_at', { ascending: false });
    setStudents(data || []);
    setLoading(false);
  };

  const callEdgeFunction = async (body) => {
    const { data: refreshed, error: refreshErr } = await supabase.auth.refreshSession();
    if (refreshErr || !refreshed?.session) throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
    const { data, error: fnErr } = await supabase.functions.invoke('manage-student', { body });
    if (fnErr) throw new Error(fnErr.message || 'Lỗi kết nối Edge Function');
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const openCreate = () => { setModal('create'); setFullName(''); setEmail(''); setPassword(''); setShowPwd(false); setError(''); };
  const openResetPassword = (s) => { setModal('reset-password'); setSelectedStudent(s); setPassword(''); setShowPwd(false); setError(''); };
  const closeModal = () => { setModal(null); setError(''); };

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await callEdgeFunction({ action: 'create', fullName, email, password });
      closeModal(); fetchStudents();
      addToast('Đã tạo tài khoản học sinh thành công!', 'success');
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await callEdgeFunction({ action: 'reset-password', studentId: selectedStudent.id, password });
      closeModal();
      addToast('Đã đặt lại mật khẩu thành công!', 'success');
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const openDeleteConfirm = (student) => setConfirmStudent(student);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await callEdgeFunction({ action: 'delete', studentId: confirmStudent.id });
      setConfirmStudent(null); fetchStudents();
      addToast('Đã xoá học sinh và toàn bộ lịch sử làm bài!', 'success');
    } catch (err) {
      addToast('Lỗi khi xoá: ' + err.message, 'error');
      setConfirmStudent(null);
    }
    finally { setDeleting(false); }
  };

  const filtered = students.filter(s =>
    s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const activeCount = students.filter(s => s.is_active).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Quản lý Học Sinh</h1>
          </div>
          <p className="text-sm text-gray-500">Thêm, đặt lại mật khẩu, xoá và theo dõi tiến độ học sinh.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold shadow-sm text-sm w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" /> Thêm học sinh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard icon={Users} label="Tổng số" value={students.length} color="bg-blue-100 text-blue-600" />
        <StatCard icon={UserCheck} label="Hoạt động" value={activeCount} color="bg-emerald-100 text-emerald-600" />
        <StatCard icon={UserX} label="Đã khoá" value={students.length - activeCount} color="bg-gray-100 text-gray-500" />
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-3 mb-5">
        <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="Tìm theo tên hoặc email..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-1 outline-none text-gray-900 text-sm placeholder-gray-400"
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {searchTerm && (
        <p className="text-xs text-gray-500 mb-3">
          Tìm thấy <span className="font-semibold text-gray-700">{filtered.length}</span> kết quả cho "<span className="italic">{searchTerm}</span>"
        </p>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <RotateCcw className="w-8 h-8 animate-spin mb-3 text-blue-400" />
          <span className="text-sm">Đang tải danh sách học sinh...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <GraduationCap className="w-12 h-12 mb-3 text-gray-300" />
          <p className="font-semibold text-gray-500">
            {students.length === 0 ? 'Chưa có học sinh nào' : 'Không tìm thấy kết quả'}
          </p>
          <p className="text-sm mt-1">
            {students.length === 0 ? 'Nhấn "Thêm học sinh" để bắt đầu.' : 'Thử tìm kiếm với từ khoá khác.'}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="flex flex-col gap-3 sm:hidden">
            {filtered.map(s => (
              <StudentCard
                key={s.id}
                student={s}
                onResetPassword={openResetPassword}
                onDelete={openDeleteConfirm}
              />
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden sm:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Học sinh</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Ngày tạo</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Trạng thái</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(student => (
                  <tr key={student.id} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {student.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{student.full_name}</div>
                          <div className="text-xs text-gray-500">{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(student.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${student.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                        {student.is_active ? 'Hoạt động' : 'Đã khoá'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/teacher/students/${student.id}`}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-semibold hover:bg-blue-100 transition"
                        >
                          <ChevronRight className="w-3 h-3" /> Tiến độ
                        </Link>
                        <button
                          onClick={() => openResetPassword(student)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 text-xs font-semibold hover:bg-amber-100 transition"
                          title="Đặt lại mật khẩu"
                        >
                          <Key className="w-3 h-3" /> Mật khẩu
                        </button>
                        <button
                          onClick={() => openDeleteConfirm(student)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 text-red-500 text-xs font-semibold hover:bg-red-100 transition"
                          title="Xoá học sinh"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
              Hiển thị {filtered.length} / {students.length} học sinh
            </div>
          </div>
        </>
      )}

      {/* ── Create / Reset Password Modal ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 px-4 pb-4 sm:pb-0 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
            <button onClick={closeModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${modal === 'create' ? 'bg-blue-100' : 'bg-amber-100'}`}>
                {modal === 'create' ? <Plus className="w-5 h-5 text-blue-600" /> : <Key className="w-5 h-5 text-amber-600" />}
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  {modal === 'create' ? 'Thêm học sinh mới' : 'Đặt lại mật khẩu'}
                </h2>
                {modal === 'reset-password' && (
                  <p className="text-xs text-gray-500">{selectedStudent?.full_name}</p>
                )}
              </div>
            </div>

            {error && (
              <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={modal === 'create' ? handleCreate : handleResetPassword} className="space-y-4">
              {modal === 'create' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Họ và tên *</label>
                    <input
                      type="text" required autoFocus
                      value={fullName} onChange={e => setFullName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email *</label>
                    <input
                      type="email" required
                      value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="hocsinh@truong.edu.vn"
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  {modal === 'create' ? 'Mật khẩu * (tối thiểu 6 ký tự)' : 'Mật khẩu mới *'}
                </label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'} required minLength={6}
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu..."
                    className="w-full px-3.5 py-2.5 pr-11 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="submit" disabled={saving}
                  className={`flex-1 py-2.5 rounded-xl text-white font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2
                    ${modal === 'create' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-amber-500 hover:bg-amber-600'}`}
                >
                  {saving
                    ? <><RotateCcw className="w-4 h-4 animate-spin" /> Đang xử lý...</>
                    : modal === 'create' ? 'Tạo tài khoản' : 'Đặt lại mật khẩu'}
                </button>
                <button
                  type="button" onClick={closeModal}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
                >
                  Huỷ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Confirm Delete Dialog ── */}
      {confirmStudent && (
        <ConfirmDialog
          student={confirmStudent}
          onConfirm={handleDelete}
          onCancel={() => setConfirmStudent(null)}
          loading={deleting}
        />
      )}

      {/* ── Toasts ── */}
      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
};