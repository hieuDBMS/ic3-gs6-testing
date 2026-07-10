import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, User } from 'lucide-react';
import { AttemptHistoryTable } from '../components/dashboard/AttemptHistoryTable';

export const StudentProgressPage = () => {
  const { studentId } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudent();
  }, [studentId]);

  const fetchStudent = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', studentId)
        .single();
      
      if (error) throw error;
      setStudent(data);
    } catch (error) {
      console.error('Error fetching student:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500 dark:text-slate-400">Đang tải...</div>;
  if (!student) return <div className="p-8 text-center text-red-500 dark:text-red-400">Học sinh không tồn tại</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center">
        <Link to="/teacher/students" className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 flex items-center font-medium">
          <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại danh sách
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 mb-8 flex items-center">
        <div className="bg-primary-100 dark:bg-primary-950/40 p-4 rounded-full mr-6">
          <User className="w-8 h-8 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{student.full_name}</h1>
          <p className="text-gray-500 dark:text-slate-400">{student.email}</p>
          <div className="mt-2 text-sm text-gray-500 dark:text-slate-400">
            Đã tham gia: {new Date(student.created_at).toLocaleDateString('vi-VN')}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-lg font-medium leading-6 text-gray-900 dark:text-slate-100">Chi tiết lịch sử làm bài</h2>
        </div>
        <AttemptHistoryTable studentId={studentId} showCheatFlags />
      </div>
    </div>
  );
};
