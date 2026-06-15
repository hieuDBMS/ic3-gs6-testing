import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Award, ArrowLeft, Target, Clock, AlertTriangle, BookOpen, RefreshCcw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const MockResultPage = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const { data, error } = await supabase
          .from('exam_attempts')
          .select('*')
          .eq('id', attemptId)
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        setAttempt(data);
      } catch (err) {
        console.error('Error fetching mock result:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [attemptId, user.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 font-medium">Đang tải kết quả...</p>
        </div>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-sm w-full mx-4">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">Không tìm thấy kết quả</h2>
          <p className="text-gray-500 mb-6 text-sm">Bài thi thử không tồn tại hoặc bạn không có quyền xem.</p>
          <Link to="/exam" className="inline-flex items-center justify-center w-full py-2.5 px-4 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors">
            Về danh sách ôn tập
          </Link>
        </div>
      </div>
    );
  }

  const score1000 = attempt.score_1000 || 0;
  const isPassed = score1000 >= 700;
  const minutes = Math.floor((attempt.time_spent_seconds || 0) / 60);
  const seconds = (attempt.time_spent_seconds || 0) % 60;

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-xl w-full">
        {/* Nav */}
        <Link to="/exam" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 mb-8 transition-colors group">
          <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover:border-slate-300 group-hover:shadow-sm transition-all">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Về danh sách ôn tập
        </Link>

        {/* Card */}
        <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-slate-100 relative">
          
          {/* Header Banner */}
          <div className={`h-32 absolute top-0 left-0 right-0 ${isPassed ? 'bg-gradient-to-br from-emerald-400 to-teal-500' : 'bg-gradient-to-br from-rose-400 to-red-500'}`} />

          <div className="relative pt-12 px-8 pb-10 flex flex-col items-center text-center">
            {/* Medal/Icon */}
            <div className={`w-24 h-24 rounded-2xl bg-white shadow-xl flex items-center justify-center transform -translate-y-2 mb-4 border-4 ${isPassed ? 'border-emerald-100' : 'border-rose-100'}`}>
              <Award className={`w-12 h-12 ${isPassed ? 'text-emerald-500' : 'text-rose-500'}`} />
            </div>

            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
              {isPassed ? 'Chúc mừng bạn!' : 'Cần cố gắng thêm!'}
            </h1>
            <p className="text-slate-500 font-medium">
              Bạn đã hoàn thành bài Thi Thử (Mock Exam)
            </p>

            {/* Score Ring */}
            <div className="mt-8 mb-6 relative">
              <svg className="w-48 h-48 transform -rotate-90">
                <circle cx="96" cy="96" r="88" className="stroke-slate-100" strokeWidth="12" fill="none" />
                <circle 
                  cx="96" cy="96" r="88" 
                  className={`transition-all duration-1000 ease-out ${isPassed ? 'stroke-emerald-500' : 'stroke-rose-500'}`} 
                  strokeWidth="12" 
                  fill="none" 
                  strokeDasharray="552.92" 
                  strokeDashoffset={552.92 - (552.92 * score1000) / 1000} 
                  strokeLinecap="round" 
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-5xl font-black ${isPassed ? 'text-emerald-600' : 'text-rose-600'}`}>{score1000}</span>
                <span className="text-slate-400 font-bold text-sm uppercase tracking-widest mt-1">/ 1000</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 w-full mb-8">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center gap-2 text-slate-500 justify-center mb-1">
                  <Target className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Số câu hỏi</span>
                </div>
                <p className="text-xl font-bold text-slate-900">{attempt.total_questions}</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center gap-2 text-slate-500 justify-center mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Thời gian</span>
                </div>
                <p className="text-xl font-bold text-slate-900">{minutes}p {seconds}s</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Link 
                to="/exam"
                className="flex-1 py-3.5 px-6 rounded-xl border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center justify-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                Về trang chủ
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
