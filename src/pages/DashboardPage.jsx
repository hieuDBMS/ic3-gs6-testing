import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AttemptHistoryTable } from '../components/dashboard/AttemptHistoryTable';
import { StudentOverviewTable } from '../components/dashboard/StudentOverviewTable';
import { supabase } from '../lib/supabase';
import { BookOpen, TrendingUp, CheckCircle, PlayCircle, Users, ChevronRight } from 'lucide-react';

/* ─── Avatar ─── */
const COLORS = [
  'from-indigo-500 to-violet-600',
  'from-emerald-500 to-teal-600',
  'from-pink-500 to-rose-600',
  'from-amber-500 to-orange-600',
];
const getColor = (s) => {
  let h = 0;
  for (const c of s || '') h = c.charCodeAt(0) + ((h << 5) - h);
  return COLORS[Math.abs(h) % COLORS.length];
};
const getInitials = (name) => {
  if (!name) return '?';
  const p = name.trim().split(' ');
  return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : name[0].toUpperCase();
};

/* ─── Stat Card ─── */
const StatCard = ({ icon, label, value, sub, color }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0 shadow-md`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-2xl font-extrabold text-gray-900 leading-none">{value}</p>
      <p className="text-xs font-semibold text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

/* ─── Stats fetcher ─── */
const useStudentStats = (userId) => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      const { data } = await supabase
        .from('exam_attempts')
        .select('score, correct_count, total_questions, started_at, status')
        .eq('user_id', userId)
        .neq('status', 'in_progress');

      if (!data) return;
      const total = data.length;
      const avgScore = total > 0 ? data.reduce((a, b) => a + Number(b.score), 0) / total : 0;
      const passed = data.filter(a => Number(a.score) >= 70).length;
      const passRate = total > 0 ? (passed / total) * 100 : 0;
      setStats({ total, avgScore: avgScore.toFixed(1), passRate: passRate.toFixed(0) });
    };
    load();
  }, [userId]);

  return stats;
};

/* ─── Teacher stats ─── */
const useTeacherStats = () => {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    const load = async () => {
      const { data: students } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .eq('role', 'student');
      const { data: attempts } = await supabase
        .from('exam_attempts')
        .select('score')
        .neq('status', 'in_progress');
      const totalStudents = students?.length || 0;
      const totalAttempts = attempts?.length || 0;
      const avgScore = totalAttempts > 0
        ? (attempts.reduce((a, b) => a + Number(b.score), 0) / totalAttempts).toFixed(1)
        : '0';
      setStats({ totalStudents, totalAttempts, avgScore });
    };
    load();
  }, []);
  return stats;
};

/* ─── Main DashboardPage ─── */
export const DashboardPage = () => {
  const { user, profile, isTeacher } = useAuth();

  const studentStats = useStudentStats(!isTeacher ? user?.id : null);
  const teacherStats = useTeacherStats();

  if (!user || !profile) return null;

  const initials = getInitials(profile.full_name);
  const avatarColor = getColor(profile.full_name);
  const roleLabel = isTeacher ? 'Giáo viên' : 'Học sinh';
  const roleColor = isTeacher ? 'bg-violet-100 text-violet-700' : 'bg-emerald-100 text-emerald-700';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ─── Hero greeting ─── */}
        <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white shadow-xl"
          style={{ background: 'linear-gradient(135deg, #0f172a 0%, #182e89 60%, #0e7490 100%)' }}>
          {/* Blobs */}
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-primary-400/20 blur-[70px] pointer-events-none" />
          <div className="absolute bottom-0 left-16 w-40 h-40 rounded-full bg-accent-400/15 blur-[50px] pointer-events-none" />
          {/* Grid */}
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)', backgroundSize: '32px 32px' }} />

          <div className="relative flex items-center gap-5">
            {/* Avatar */}
            <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${avatarColor} flex items-center justify-center text-2xl sm:text-3xl font-extrabold text-white shadow-lg flex-shrink-0 border-4 border-white/20`}>
              {initials}
            </div>

            <div className="min-w-0">
              <span className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full mb-2 ${roleColor}`}>
                {roleLabel}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">
                Xin chào, {profile.full_name?.split(' ').pop() || profile.full_name}! 👋
              </h1>
              <p className="text-white/55 text-sm mt-1">{profile.email}</p>
            </div>

            {/* CTA */}
            <div className="hidden sm:flex flex-col gap-2 ml-auto flex-shrink-0">
              <Link
                to="/exam"
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-primary-700 font-bold text-sm rounded-xl hover:bg-white/90 transition-colors shadow-md"
              >
                <PlayCircle className="w-4 h-4" /> Làm bài thi
              </Link>
              {isTeacher && (
                <Link
                  to="/teacher/students"
                  className="flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white font-semibold text-sm rounded-xl hover:bg-white/20 transition-colors border border-white/20"
                >
                  <Users className="w-4 h-4" /> Quản lý học sinh
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* ─── Stats cards ─── */}
        {isTeacher && teacherStats ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              icon={<Users className="w-6 h-6 text-white" />}
              label="Học sinh" value={teacherStats.totalStudents}
              sub="Đang quản lý"
              color="from-indigo-500 to-violet-600"
            />
            <StatCard
              icon={<BookOpen className="w-6 h-6 text-white" />}
              label="Lượt thi" value={teacherStats.totalAttempts}
              sub="Toàn trường"
              color="from-emerald-500 to-teal-600"
            />
            <StatCard
              icon={<TrendingUp className="w-6 h-6 text-white" />}
              label="Điểm TB" value={`${teacherStats.avgScore}%`}
              sub="Toàn trường"
              color="from-amber-500 to-orange-600"
            />
          </div>
        ) : !isTeacher && studentStats ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              icon={<BookOpen className="w-6 h-6 text-white" />}
              label="Bài đã làm" value={studentStats.total}
              color="from-indigo-500 to-violet-600"
            />
            <StatCard
              icon={<TrendingUp className="w-6 h-6 text-white" />}
              label="Điểm trung bình" value={`${studentStats.avgScore}%`}
              color="from-amber-500 to-orange-600"
            />
            <StatCard
              icon={<CheckCircle className="w-6 h-6 text-white" />}
              label="Tỉ lệ đạt" value={`${studentStats.passRate}%`}
              sub="Ngưỡng đạt ≥ 70%"
              color="from-emerald-500 to-teal-600"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-pulse">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-white rounded-2xl border border-gray-100" />)}
          </div>
        )}

        {/* ─── Teacher: Student Overview ─── */}
        {isTeacher && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-500" />
                <h2 className="text-base font-bold text-gray-900">Tổng quan học sinh</h2>
              </div>
              <Link
                to="/teacher/students"
                className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-800 transition-colors"
              >
                Quản lý <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <StudentOverviewTable />
          </div>
        )}

        {/* ─── History ─── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary-500" />
              <h2 className="text-base font-bold text-gray-900">
                {isTeacher ? 'Lịch sử làm bài (Cá nhân)' : 'Lịch sử làm bài'}
              </h2>
            </div>
            <Link
              to="/exam"
              className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-800 transition-colors"
            >
              Làm bài mới <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <AttemptHistoryTable studentId={user.id} />
        </div>

        {/* Mobile CTA */}
        <div className="sm:hidden flex gap-3">
          <Link
            to="/exam"
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold text-sm rounded-2xl shadow-md shadow-primary-200"
          >
            <PlayCircle className="w-4 h-4" /> Làm bài thi
          </Link>
          {isTeacher && (
            <Link
              to="/teacher/students"
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-white text-primary-600 font-bold text-sm rounded-2xl border-2 border-primary-100"
            >
              <Users className="w-4 h-4" /> Học sinh
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
