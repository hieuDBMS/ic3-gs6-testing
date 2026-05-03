import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Key, Search, X } from 'lucide-react';

export const StudentManagementPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state
  const [modal, setModal] = useState(null); // null | 'create' | 'reset-password'
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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

  // Helper: refresh session then call edge function
  const callEdgeFunction = async (body) => {
    // Always refresh session first to avoid JWT expiry errors
    const { data: refreshed, error: refreshErr } = await supabase.auth.refreshSession();
    if (refreshErr || !refreshed?.session) {
      throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
    }

    const { data, error: fnErr } = await supabase.functions.invoke('manage-student', { body });
    if (fnErr) throw new Error(fnErr.message || 'Lỗi kết nối Edge Function');
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const openCreate = () => {
    setModal('create');
    setSelectedStudent(null);
    setFullName('');
    setEmail('');
    setPassword('');
    setError('');
  };

  const openResetPassword = (student) => {
    setModal('reset-password');
    setSelectedStudent(student);
    setPassword('');
    setError('');
  };

  const closeModal = () => {
    setModal(null);
    setError('');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await callEdgeFunction({ action: 'create', fullName, email, password });
      closeModal();
      fetchStudents();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await callEdgeFunction({ action: 'reset-password', studentId: selectedStudent.id, password });
      closeModal();
      alert('Đã đặt lại mật khẩu thành công!');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (student) => {
    if (!window.confirm(`Xoá học sinh "${student.full_name}"?\nHành động này không thể hoàn tác.`)) return;
    try {
      await callEdgeFunction({ action: 'delete', studentId: student.id });
      fetchStudents();
    } catch (err) {
      alert('Lỗi khi xoá: ' + err.message);
    }
  };

  const filtered = students.filter(s =>
    s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Học Sinh</h1>
          <p className="mt-1 text-sm text-gray-500">Thêm, sửa mật khẩu, xoá và theo dõi tiến độ học sinh.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
        >
          <Plus className="w-4 h-4 mr-2" /> Thêm học sinh
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow mb-6 p-4 flex items-center gap-3">
        <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="Tìm theo tên hoặc email..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-1 outline-none text-gray-900 text-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Học sinh</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày tạo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map(student => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{student.full_name}</div>
                    <div className="text-sm text-gray-500">{student.email}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(student.created_at).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${student.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {student.is_active ? 'Hoạt động' : 'Đã khoá'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <Link to={`/teacher/students/${student.id}`} className="text-primary-600 hover:underline text-sm">
                      Tiến độ
                    </Link>
                    <button
                      onClick={() => openResetPassword(student)}
                      className="text-yellow-600 hover:text-yellow-800"
                      title="Đặt lại mật khẩu"
                    >
                      <Key className="w-4 h-4 inline" />
                    </button>
                    <button
                      onClick={() => handleDelete(student)}
                      className="text-red-600 hover:text-red-800"
                      title="Xoá học sinh"
                    >
                      <Trash2 className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-10 text-center text-gray-400">
                    {students.length === 0 ? 'Chưa có học sinh nào. Nhấn "Thêm học sinh" để bắt đầu.' : 'Không tìm thấy kết quả.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
            <button onClick={closeModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {modal === 'create' ? 'Thêm học sinh mới' : `Đặt lại mật khẩu — ${selectedStudent?.full_name}`}
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={modal === 'create' ? handleCreate : handleResetPassword} className="space-y-4">
              {modal === 'create' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên *</label>
                    <input
                      type="text" required autoFocus
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email" required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="hocsinh@truong.edu.vn"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu * (tối thiểu 6 ký tự)</label>
                <input
                  type="text" required minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mật khẩu tạm thời..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition disabled:opacity-50"
                >
                  {saving ? 'Đang xử lý...' : modal === 'create' ? 'Tạo tài khoản' : 'Đặt lại mật khẩu'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
                >
                  Huỷ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};