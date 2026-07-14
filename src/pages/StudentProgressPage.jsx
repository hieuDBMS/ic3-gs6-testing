import { useEffect, useState } from "react";
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { ArrowLeft, User, Eraser } from 'lucide-react';
import { AttemptHistoryTable } from '../components/dashboard/AttemptHistoryTable';
import { ConfirmDialog } from '../components/shared/ConfirmDialog';
import { Toast, useToast } from '../components/shared/Toast';
import { Skeleton } from '../components/shared/Skeleton';

export const StudentProgressPage = () => {
  const { t } = useTranslation();
  const { studentId } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [historyKey, setHistoryKey] = useState(0);
  const { toasts, showToast, dismissToast } = useToast();

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

  const handleClearHistory = async () => {
    setClearing(true);
    try {
      const { data: refreshed, error: refreshErr } = await supabase.auth.refreshSession();
      if (refreshErr || !refreshed?.session) throw new Error(t('studentManagement.sessionExpiredError'));
      const { data, error: fnErr } = await supabase.functions.invoke('manage-student', {
        body: { action: 'clear-attempts', studentId },
      });
      if (fnErr) throw new Error(fnErr.message || t('studentManagement.edgeFunctionError'));
      if (data?.error) throw new Error(data.error);
      setClearConfirm(false);
      setHistoryKey(k => k + 1);
      showToast(t('studentManagement.clearHistorySuccessToast'), 'success');
    } catch (err) {
      showToast(t('studentManagement.clearHistoryErrorToast', { message: err.message }), 'error');
      setClearConfirm(false);
    } finally { setClearing(false); }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        <Skeleton variant="card" className="h-8 w-40 mb-6" />
        <Skeleton variant="card" className="h-28 mb-8" />
        <Skeleton variant="card" className="h-64" />
      </div>
    );
  }
  if (!student) return <div className="p-8 text-center text-red-500 dark:text-red-400">{t('studentProgress.studentNotFound')}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <Toast toasts={toasts} onDismiss={dismissToast} />

      <div className="mb-6 flex items-center">
        <Link to="/teacher/students" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center font-medium transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> {t('studentProgress.backToList')}
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-gray-100 dark:border-slate-700/60 p-6 mb-8 flex items-center">
        <div className="bg-indigo-100 dark:bg-indigo-950/40 p-4 rounded-full mr-6">
          <User className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{student.full_name}</h1>
          <p className="text-gray-500 dark:text-slate-400">{student.email}</p>
          <div className="mt-2 text-sm text-gray-500 dark:text-slate-400">
            {t('studentProgress.joinedOn', { date: new Date(student.created_at).toLocaleDateString('vi-VN') })}
          </div>
        </div>
        <button
          onClick={() => setClearConfirm(true)}
          className="ml-auto flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-300 text-sm font-semibold hover:bg-orange-100 dark:hover:bg-orange-900/40 transition shrink-0"
        >
          <Eraser className="w-4 h-4" /> {t('studentManagement.clearHistoryButton')}
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-gray-100 dark:border-slate-700/60 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-700/60">
          <h2 className="text-lg font-medium leading-6 text-gray-900 dark:text-slate-100">{t('studentProgress.attemptHistoryTitle')}</h2>
        </div>
        <AttemptHistoryTable key={historyKey} studentId={studentId} showCheatFlags canDelete />
      </div>

      <ConfirmDialog
        open={clearConfirm}
        title={t('studentManagement.clearHistoryConfirmTitle')}
        message={<>{t('studentManagement.clearHistoryConfirmPre')} <strong>{student.full_name}</strong>. {t('studentManagement.clearHistoryConfirmPost')}</>}
        onConfirm={handleClearHistory}
        onCancel={() => setClearConfirm(false)}
        loading={clearing}
      />
    </div>
  );
};
