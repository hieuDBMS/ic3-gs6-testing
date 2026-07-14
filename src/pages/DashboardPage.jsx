import { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { AttemptHistoryTable } from '../components/dashboard/AttemptHistoryTable';
import { StudentOverviewTable } from '../components/dashboard/StudentOverviewTable';
import { supabase } from '../lib/supabase';
import { useExamAttempts } from '../hooks/useExamAttempts';
import { BookOpen, TrendingUp, CheckCircle, PlayCircle, Users, ChevronRight, Eraser } from 'lucide-react';
import { getInitials } from '../utils/avatar';
import { Skeleton } from '../components/shared/Skeleton';
import { ConfirmDialog } from '../components/shared/ConfirmDialog';
import { Toast, useToast } from '../components/shared/Toast';

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

/* ─── Stat Card ─── */
const StatCard = ({ icon, label, value, sub, color }) => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-xs p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-2xl bg-linear-to-br ${color} flex items-center justify-center shrink-0 shadow-md`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-2xl font-extrabold text-gray-900 dark:text-slate-100 leading-none">{value}</p>
      <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">{sub}</p>}
    </div>
  </div>
);

/* ─── Stats fetcher ─── */
const useStudentStats = (userId) => {
  const { attempts, loading } = useExamAttempts(userId, {
    excludeStatus: 'in_progress',
    select: 'score, correct_count, total_questions, started_at, status',
    enabled: !!userId,
  });

  if (loading || !userId) return null;
  const total = attempts.length;
  const avgScore = total > 0 ? attempts.reduce((a, b) => a + Number(b.score), 0) / total : 0;
  const passed = attempts.filter(a => Number(a.score) >= 70).length;
  const passRate = total > 0 ? (passed / total) * 100 : 0;
  return { total, avgScore: avgScore.toFixed(1), passRate: passRate.toFixed(0) };
};

/* ─── Teacher stats ─── */
// School-wide totals come from RPC get_teacher_dashboard_stats() (aggregate
// server-side, 1 row back) instead of fetching every exam_attempts row
// platform-wide — Dashboard is the post-login landing page, so this runs on
// every teacher login. See supabase/sql/2026-07-13_concurrency_indexes.sql.
const useTeacherStats = (enabled) => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const load = async () => {
      const [{ count }, { data: rpcStats }] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.rpc('get_teacher_dashboard_stats'),
      ]);
      if (cancelled) return;
      const row = rpcStats?.[0];
      setStats({
        totalStudents: count || 0,
        totalAttempts: Number(row?.total_attempts) || 0,
        avgScore: row?.avg_score != null ? Number(row.avg_score).toFixed(1) : '0',
      });
    };
    load();
    return () => { cancelled = true; };
  }, [enabled]);

  if (!enabled || !stats) return null;
  return stats;
};

/* ─── Main DashboardPage ─── */
export const DashboardPage = () => {
  const { t } = useTranslation();
  const { user, profile, isTeacher } = useAuth();

  const studentStats = useStudentStats(!isTeacher ? user?.id : null);
  const teacherStats = useTeacherStats(isTeacher);

  const [clearConfirm, setClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [historyKey, setHistoryKey] = useState(0);
  const { toasts, showToast, dismissToast } = useToast();

  const handleClearMyHistory = async () => {
    setClearing(true);
    try {
      const { data: refreshed, error: refreshErr } = await supabase.auth.refreshSession();
      if (refreshErr || !refreshed?.session) throw new Error(t('studentManagement.sessionExpiredError'));
      const { data, error: fnErr } = await supabase.functions.invoke('manage-student', {
        body: { action: 'clear-attempts', studentId: user.id },
      });
      if (fnErr) throw new Error(fnErr.message || t('studentManagement.edgeFunctionError'));
      if (data?.error) throw new Error(data.error);
      setClearConfirm(false);
      setHistoryKey(k => k + 1);
      showToast(t('dashboard.clearMyHistorySuccessToast'), 'success');
    } catch (err) {
      showToast(t('studentManagement.clearHistoryErrorToast', { message: err.message }), 'error');
      setClearConfirm(false);
    } finally { setClearing(false); }
  };

  if (!user || !profile) return null;

  const initials = getInitials(profile.full_name);
  const avatarColor = getColor(profile.full_name);
  const roleLabel = isTeacher ? t('dashboard.roleTeacher') : t('dashboard.roleStudent');
  const roleColor = isTeacher ? 'bg-violet-100 text-violet-700' : 'bg-emerald-100 text-emerald-700';

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
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
            <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-linear-to-br ${avatarColor} flex items-center justify-center text-2xl sm:text-3xl font-extrabold text-white shadow-lg shrink-0 border-4 border-white/20`}>
              {initials}
            </div>

            <div className="min-w-0">
              <span className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full mb-2 ${roleColor}`}>
                {roleLabel}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">
                {t('dashboard.greeting', { name: profile.full_name?.split(' ').pop() || profile.full_name })}
              </h1>
              <p className="text-white/55 text-sm mt-1">{profile.email}</p>
            </div>

            {/* CTA */}
            <div className="hidden sm:flex flex-col gap-2 ml-auto shrink-0">
              <Link
                to="/exam"
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-primary-700 font-bold text-sm rounded-xl hover:bg-white/90 transition-colors shadow-md"
              >
                <PlayCircle className="w-4 h-4" /> {t('dashboard.takeExam')}
              </Link>
              {isTeacher && (
                <Link
                  to="/teacher/students"
                  className="flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white font-semibold text-sm rounded-xl hover:bg-white/20 transition-colors border border-white/20"
                >
                  <Users className="w-4 h-4" /> {t('dashboard.manageStudents')}
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
              label={t('dashboard.statStudents')} value={teacherStats.totalStudents}
              sub={t('dashboard.statManaging')}
              color="from-indigo-500 to-violet-600"
            />
            <StatCard
              icon={<BookOpen className="w-6 h-6 text-white" />}
              label={t('dashboard.statAttempts')} value={teacherStats.totalAttempts}
              sub={t('dashboard.statSchoolWide')}
              color="from-emerald-500 to-teal-600"
            />
            <StatCard
              icon={<TrendingUp className="w-6 h-6 text-white" />}
              label={t('dashboard.statAvgScore')} value={`${teacherStats.avgScore}%`}
              sub={t('dashboard.statSchoolWide')}
              color="from-amber-500 to-orange-600"
            />
          </div>
        ) : !isTeacher && studentStats ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              icon={<BookOpen className="w-6 h-6 text-white" />}
              label={t('dashboard.statCompleted')} value={studentStats.total}
              color="from-indigo-500 to-violet-600"
            />
            <StatCard
              icon={<TrendingUp className="w-6 h-6 text-white" />}
              label={t('dashboard.statAvgScoreFull')} value={`${studentStats.avgScore}%`}
              color="from-amber-500 to-orange-600"
            />
            <StatCard
              icon={<CheckCircle className="w-6 h-6 text-white" />}
              label={t('dashboard.statPassRate')} value={`${studentStats.passRate}%`}
              sub={t('dashboard.statPassThreshold')}
              color="from-emerald-500 to-teal-600"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Skeleton variant="card" count={3} className="h-24 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700" />
          </div>
        )}

        {/* ─── Teacher: Student Overview ─── */}
        {isTeacher && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-gray-100 dark:border-slate-700 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-500" />
                <h2 className="text-base font-bold text-gray-900 dark:text-slate-100">{t('dashboard.studentOverviewTitle')}</h2>
              </div>
              <Link
                to="/teacher/students"
                className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
              >
                {t('dashboard.manageLink')} <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <StudentOverviewTable />
          </div>
        )}

        {/* ─── History ─── */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary-500" />
              <h2 className="text-base font-bold text-gray-900 dark:text-slate-100">
                {isTeacher ? t('dashboard.historyPersonalTitle') : t('dashboard.historyTitle')}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              {isTeacher && (
                <button
                  onClick={() => setClearConfirm(true)}
                  className="flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300 transition-colors"
                >
                  <Eraser className="w-3.5 h-3.5" /> {t('dashboard.clearMyHistoryButton')}
                </button>
              )}
              <Link
                to="/exam"
                className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
              >
                {t('dashboard.newExamLink')} <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          <AttemptHistoryTable key={historyKey} studentId={user.id} canDelete={isTeacher} />
        </div>

        {/* Mobile CTA */}
        <div className="sm:hidden flex gap-3">
          <Link
            to="/exam"
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-linear-to-r from-primary-600 to-primary-500 text-white font-bold text-sm rounded-2xl shadow-md shadow-primary-200"
          >
            <PlayCircle className="w-4 h-4" /> {t('dashboard.takeExam')}
          </Link>
          {isTeacher && (
            <Link
              to="/teacher/students"
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 font-bold text-sm rounded-2xl border-2 border-primary-100 dark:border-primary-900/50"
            >
              <Users className="w-4 h-4" /> {t('dashboard.studentsLink')}
            </Link>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={clearConfirm}
        title={t('dashboard.clearMyHistoryConfirmTitle')}
        message={t('dashboard.clearMyHistoryConfirmMessage')}
        onConfirm={handleClearMyHistory}
        onCancel={() => setClearConfirm(false)}
        loading={clearing}
      />
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};
