import { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import {
  Plus, Trash2, Key, Search, X, Eye, EyeOff,
  Users, ChevronLeft, ChevronRight, AlertTriangle,
  CheckCircle, RotateCcw, GraduationCap, BookOpen, TrendingUp,
  Building2, Edit2, School, Eraser
} from 'lucide-react';
import { useStudents } from '../hooks/useStudents';
import { Toast, useToast } from '../components/shared/Toast';
import { ConfirmDialog } from '../components/shared/ConfirmDialog';
import { EmptyState } from '../components/shared/EmptyState';
import { Skeleton } from '../components/shared/Skeleton';

const PAGE_SIZE = 20;

/* ─── Stat Card ──────────────────────────────────────────────── */
const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className={`flex items-center gap-3 bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-gray-100 dark:border-slate-700 px-4 py-3`}>
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <div className="text-xl font-bold text-gray-900 dark:text-slate-100">{value}</div>
      <div className="text-xs text-gray-500 dark:text-slate-400">{label}</div>
    </div>
  </div>
);

/* ─── Score Bar ──────────────────────────────────────────────── */
const ScoreBar = ({ score }) => {
  const pct = Math.min(100, Math.max(0, Number(score)));
  const ok = pct >= 70;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden min-w-[48px]">
        <div
          className={`h-full rounded-full transition-all ${ok ? 'bg-emerald-400' : 'bg-red-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs font-bold shrink-0 ${ok ? 'text-emerald-600' : 'text-red-500'}`}>
        {pct.toFixed(0)}%
      </span>
    </div>
  );
};

/* ─── Student Card (mobile) ─────────────────────────────────── */
const StudentCard = ({ student, onResetPassword, onDelete, onClearHistory, schools = [] }) => {
  const { t } = useTranslation();
  const schoolName = student.school
    ? (schools.find(s => s.id === student.school)?.name || null)
    : null;
  return (
  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-gray-100 dark:border-slate-700 p-4">
    <div className="flex items-start justify-between gap-2 mb-2">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-base shrink-0">
          {student.full_name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-gray-900 dark:text-slate-100 text-sm truncate">{student.full_name}</div>
          <div className="text-xs text-gray-500 dark:text-slate-400 truncate">{student.email}</div>
          {(schoolName || student.class_name) && (
            <div className="flex items-center gap-2 mt-0.5">
              {schoolName && <span className="text-[10px] text-violet-600 dark:text-violet-400 font-semibold">{schoolName}</span>}
              {student.class_name && <span className="text-[10px] text-emerald-600 dark:text-emerald-400">{student.class_name}</span>}
            </div>
          )}
        </div>
      </div>
      <span className={`shrink-0 px-2 py-0.5 text-xs font-semibold rounded-full ${student.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-400'}`}>
        {student.is_active ? t('studentManagement.activeStatus') : t('studentManagement.lockedStatus')}
      </span>
    </div>

    {/* Progress */}
    {student.totalAttempts > 0 ? (
      <div className="mb-3 p-2.5 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" /> {t('studentManagement.attemptsCount', { count: student.totalAttempts })}
          </span>
          {student.lastActiveAt && (
            <span className="text-[10px] text-gray-400 dark:text-slate-500">
              {new Date(student.lastActiveAt).toLocaleDateString('vi-VN')}
            </span>
          )}
        </div>
        <ScoreBar score={student.avgScore} />
      </div>
    ) : (
      <div className="mb-3">
        <span className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500 rounded-full font-semibold">{t('studentManagement.notAttemptedBadge')}</span>
      </div>
    )}

    <div className="flex items-center gap-2">
      <Link
        to={`/teacher/students/${student.id}`}
        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition"
      >
        <ChevronRight className="w-3.5 h-3.5" /> {t('studentManagement.progressLink')}
      </Link>
      <button
        onClick={() => onResetPassword(student)}
        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300 text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/40 transition"
      >
        <Key className="w-3.5 h-3.5" /> {t('studentManagement.resetPasswordButton')}
      </button>
      <button
        onClick={() => onClearHistory(student)}
        title={t('studentManagement.clearHistoryButton')}
        className="flex items-center justify-center w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-500 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition"
      >
        <Eraser className="w-4 h-4" />
      </button>
      <button
        onClick={() => onDelete(student)}
        className="flex items-center justify-center w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  </div>
  );
};

/* ─── Main Page ──────────────────────────────────────────────── */
export const StudentManagementPage = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');

  const [modal, setModal] = useState(null);
  const [confirmStudent, setConfirmStudent] = useState(null);
  const [clearHistoryStudent, setClearHistoryStudent] = useState(null);
  const [clearAllConfirm, setClearAllConfirm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [clearingHistory, setClearingHistory] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);
  const [error, setError] = useState('');
  const [attemptFilter, setAttemptFilter] = useState('all');
  const [page, setPage] = useState(1);
  const { toasts, showToast: addToast, dismissToast: removeToast } = useToast();

  // School / class state
  const [schools, setSchools] = useState([]);
  const [schoolFilter, setSchoolFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [studentSchool, setStudentSchool] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [newSchoolName, setNewSchoolName] = useState('');
  const [schoolSaving, setSchoolSaving] = useState(false);
  const [schoolError, setSchoolError] = useState('');
  const [editingSchoolId, setEditingSchoolId] = useState(null);
  const [editingSchoolName, setEditingSchoolName] = useState('');
  const [schoolUpdating, setSchoolUpdating] = useState(false);

  const {
    students: paginated, rawStudents, totalCount, loading, error: fetchError, refetch: fetchStudents,
  } = useStudents({
    search: searchTerm,
    activityFilter: attemptFilter,
    schoolFilter,
    classFilter,
    classMatchMode: 'contains',
    sortBy: 'created_at_desc',
    page: page - 1,
    pageSize: PAGE_SIZE,
  });

  useEffect(() => { fetchSchools(); }, []);
  useEffect(() => {
    if (fetchError) addToast(t('studentManagement.loadDataError', { message: fetchError.message }), 'error');
  }, [fetchError]);

  const fetchSchools = async () => {
    try {
      const { data: refreshed } = await supabase.auth.refreshSession();
      const token = refreshed?.session?.access_token;
      if (!token) return;
      const { data } = await supabase.functions.invoke('manage-school', { body: { action: 'list' } });
      if (data?.schools) setSchools(data.schools);
    } catch { /* non-critical: school filter list stays empty */ }
  };

  const handleCreateSchool = async (e) => {
    e.preventDefault(); setSchoolSaving(true); setSchoolError('');
    try {
      const { data } = await supabase.functions.invoke('manage-school', { body: { action: 'create', name: newSchoolName } });
      if (data?.error) { setSchoolError(data.error); return; }
      setNewSchoolName('');
      await fetchSchools();
      addToast(t('studentManagement.schoolAddedToast'), 'success');
    } catch (err) { setSchoolError(err.message); }
    finally { setSchoolSaving(false); }
  };

  const handleUpdateSchool = async (schoolId) => {
    if (!editingSchoolName.trim()) {
      setSchoolError(t('studentManagement.schoolNameEmptyError'));
      return;
    }
    setSchoolUpdating(true); setSchoolError('');
    try {
      const { data, error } = await supabase.functions.invoke('manage-school', { 
        body: { action: 'update', schoolId, name: editingSchoolName.trim() } 
      });
      if (error || data?.error) {
        // Fallback to direct supabase update if edge function doesn't support 'update'
        const { error: sbError } = await supabase.from('schools')
          .update({ name: editingSchoolName.trim() })
          .eq('id', schoolId);
        if (sbError) throw sbError;
      }
      setEditingSchoolId(null);
      setEditingSchoolName('');
      await fetchSchools();
      addToast(t('studentManagement.schoolUpdatedToast'), 'success');
    } catch (err) { setSchoolError(err.message || t('studentManagement.genericError')); }
    finally { setSchoolUpdating(false); }
  };

  const handleDeleteSchool = async (school) => {
    if (!window.confirm(t('studentManagement.deleteSchoolConfirm', { name: school.name }))) return;
    try {
      const { data } = await supabase.functions.invoke('manage-school', { body: { action: 'delete', schoolId: school.id } });
      if (data?.error) { addToast(data.error, 'error'); return; }
      await fetchSchools(); await fetchStudents();
      addToast(t('studentManagement.schoolDeletedToast'), 'success');
    } catch (err) { addToast(err.message, 'error'); }
  };

  const callEdgeFunction = async (body) => {
    const { data: refreshed, error: refreshErr } = await supabase.auth.refreshSession();
    if (refreshErr || !refreshed?.session) throw new Error(t('studentManagement.sessionExpiredError'));
    const { data, error: fnErr } = await supabase.functions.invoke('manage-student', { body });
    if (fnErr) throw new Error(fnErr.message || t('studentManagement.edgeFunctionError'));
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const openCreate = () => { setModal('create'); setFullName(''); setEmail(''); setPassword(''); setShowPwd(false); setError(''); setStudentSchool(''); setStudentClass(''); };
  const openResetPassword = (s) => { setModal('reset-password'); setSelectedStudent(s); setPassword(''); setShowPwd(false); setError(''); };
  const openEditSchoolClass = (s) => { setModal('edit-school'); setSelectedStudent(s); setStudentSchool(s.school || ''); setStudentClass(s.class_name || ''); setError(''); };
  const closeModal = () => { setModal(null); setError(''); };

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await callEdgeFunction({ action: 'create', fullName, email, password, school: studentSchool || null, className: studentClass || null });
      closeModal(); fetchStudents();
      addToast(t('studentManagement.studentCreatedToast'), 'success');
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleEditSchoolClass = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await callEdgeFunction({ action: 'update', studentId: selectedStudent.id, school: studentSchool || null, className: studentClass || null });
      closeModal(); fetchStudents();
      addToast(t('studentManagement.studentUpdatedToast'), 'success');
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await callEdgeFunction({ action: 'reset-password', studentId: selectedStudent.id, password });
      closeModal();
      addToast(t('studentManagement.passwordResetToast'), 'success');
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const openDeleteConfirm = (student) => setConfirmStudent(student);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await callEdgeFunction({ action: 'delete', studentId: confirmStudent.id });
      setConfirmStudent(null); fetchStudents();
      addToast(t('studentManagement.studentDeletedToast'), 'success');
    } catch (err) {
      addToast(t('studentManagement.deleteErrorToast', { message: err.message }), 'error');
      setConfirmStudent(null);
    }
    finally { setDeleting(false); }
  };

  const openClearHistoryConfirm = (student) => setClearHistoryStudent(student);

  const handleClearHistory = async () => {
    setClearingHistory(true);
    try {
      await callEdgeFunction({ action: 'clear-attempts', studentId: clearHistoryStudent.id });
      setClearHistoryStudent(null); fetchStudents();
      addToast(t('studentManagement.clearHistorySuccessToast'), 'success');
    } catch (err) {
      addToast(t('studentManagement.clearHistoryErrorToast', { message: err.message }), 'error');
      setClearHistoryStudent(null);
    } finally { setClearingHistory(false); }
  };

  const handleClearAllHistory = async () => {
    setClearingAll(true);
    try {
      await callEdgeFunction({ action: 'clear-all-attempts' });
      setClearAllConfirm(false); fetchStudents();
      addToast(t('studentManagement.clearAllHistorySuccessToast'), 'success');
    } catch (err) {
      addToast(t('studentManagement.clearHistoryErrorToast', { message: err.message }), 'error');
      setClearAllConfirm(false);
    } finally { setClearingAll(false); }
  };

  const attemptedCount = rawStudents.filter(s => s.totalAttempts > 0).length;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  // Unique class names for class filter dropdown
  const allClasses = [...new Set(rawStudents.map(s => s.class_name).filter(Boolean))].sort();
  const resetFilters = () => { setSearchTerm(''); setAttemptFilter('all'); setSchoolFilter(''); setClassFilter(''); setPage(1); };
  const hasActiveFilters = searchTerm || attemptFilter !== 'all' || schoolFilter || classFilter;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{t('studentManagement.pageTitle')}</h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-slate-400">{t('studentManagement.pageSubtitle')}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setClearAllConfirm(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 border border-red-100 dark:border-red-900/40 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition font-semibold shadow-xs text-sm"
          >
            <Eraser className="w-4 h-4" /> {t('studentManagement.clearAllHistoryButton')}
          </button>
          <button
            onClick={() => { setModal('manage-schools'); setSchoolError(''); }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition font-semibold shadow-xs text-sm"
          >
            <Building2 className="w-4 h-4" /> {t('studentManagement.manageSchoolsButton')}
          </button>
          <button
            onClick={openCreate}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold shadow-xs text-sm"
          >
            <Plus className="w-4 h-4" /> {t('studentManagement.addStudentButton')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard icon={Users} label={t('studentManagement.statTotal')} value={rawStudents.length} color="bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300" />
        <StatCard icon={BookOpen} label={t('studentManagement.statAttempted')} value={attemptedCount} color="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300" />
        <StatCard icon={TrendingUp} label={t('studentManagement.statNotAttempted')} value={rawStudents.length - attemptedCount} color="bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-400" />
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-gray-100 dark:border-slate-700 px-4 py-3 mb-5">
        <Search className="w-4 h-4 text-gray-400 dark:text-slate-500 shrink-0" />
        <input
          type="text"
          placeholder={t('studentManagement.searchPlaceholder')}
          value={searchTerm}
          onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
          className="flex-1 outline-hidden text-gray-900 dark:text-slate-100 text-sm placeholder-gray-400 dark:placeholder-slate-500"
        />
        {searchTerm && (
          <button onClick={() => { setSearchTerm(''); setPage(1); }} className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {[
          { key: 'all', label: t('studentManagement.filterAll'), count: rawStudents.length },
          { key: 'attempted', label: `✓ ${t('studentManagement.filterAttempted')}`, count: attemptedCount },
          { key: 'not-attempted', label: `○ ${t('studentManagement.filterNotAttempted')}`, count: rawStudents.length - attemptedCount },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => { setAttemptFilter(key); setPage(1); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              attemptFilter === key
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500'
            }`}
          >
            {label}
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              attemptFilter === key ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400'
            }`}>{count}</span>
          </button>
        ))}
        {hasActiveFilters && (
          <button onClick={resetFilters} className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 text-xs text-gray-500 dark:text-slate-400 hover:border-red-300 dark:hover:border-red-500 hover:text-red-500 dark:hover:text-red-400 transition ml-auto">
            <X className="w-3 h-3" /> {t('studentManagement.clearFiltersButton')}
          </button>
        )}
        {!hasActiveFilters && (
          <span className="ml-auto text-xs text-gray-400 dark:text-slate-500">{t('studentManagement.resultsCount', { count: totalCount })}</span>
        )}
      </div>

      {/* School / Class filter row */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 px-3 py-2 min-w-[160px] flex-1 sm:flex-none">
          <Building2 className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400 shrink-0" />
          <select
            value={schoolFilter}
            onChange={e => { setSchoolFilter(e.target.value); setPage(1); }}
            className="flex-1 outline-hidden text-xs text-gray-700 dark:text-slate-300 bg-transparent cursor-pointer"
          >
            <option value="">{t('studentManagement.allSchools')}</option>
            {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 px-3 py-2 min-w-[140px] flex-1 sm:flex-none">
          <School className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
          <select
            value={classFilter}
            onChange={e => { setClassFilter(e.target.value); setPage(1); }}
            className="flex-1 outline-hidden text-xs text-gray-700 dark:text-slate-300 bg-transparent cursor-pointer"
          >
            <option value="">{t('studentManagement.allClasses')}</option>
            {allClasses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <span className="ml-auto self-center text-xs text-gray-400 dark:text-slate-500">{t('studentManagement.resultsCount', { count: totalCount })}</span>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-gray-100 dark:border-slate-700 overflow-hidden">
          <Skeleton variant="table-row" count={5} />
        </div>
      ) : totalCount === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title={rawStudents.length === 0 ? t('studentManagement.noStudentsTitle') : t('studentManagement.noResultsTitle')}
          description={rawStudents.length === 0 ? t('studentManagement.noStudentsDesc') : t('studentManagement.noResultsDesc')}
        />
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="flex flex-col gap-3 sm:hidden">
            {paginated.map(s => (
              <StudentCard
                key={s.id}
                student={s}
                schools={schools}
                onResetPassword={openResetPassword}
                onDelete={openDeleteConfirm}
                onClearHistory={openClearHistoryConfirm}
              />
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden sm:block bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-gray-100 dark:border-slate-700 overflow-hidden">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700">
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{t('studentManagement.tableHeaders.student')}</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{t('studentManagement.tableHeaders.schoolClass')}</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{t('studentManagement.tableHeaders.progress')}</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{t('studentManagement.tableHeaders.joinDate')}</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{t('studentManagement.tableHeaders.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                {paginated.map(student => (
                  <tr key={student.id} className="hover:bg-gray-50/80 dark:hover:bg-slate-700/40 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-linear-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {student.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">{student.full_name}</div>
                          <div className="text-xs text-gray-500 dark:text-slate-400">{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {student.totalAttempts > 0 ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
                            <BookOpen className="w-3.5 h-3.5" />
                            <span className="font-semibold text-gray-700 dark:text-slate-300">{student.totalAttempts}</span> {t('studentManagement.attemptsCountTable')}
                            {student.lastActiveAt && (
                              <span className="text-gray-400 dark:text-slate-500 ml-1">· {new Date(student.lastActiveAt).toLocaleDateString('vi-VN')}</span>
                            )}
                          </div>
                          <div className="w-36">
                            <ScoreBar score={student.avgScore} />
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500 rounded-full font-semibold">{t('studentManagement.notAttemptedBadge')}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400">
                      {new Date(student.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    {/* School / Class cell */}
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        {student.school && schools.find(s => s.id === student.school) ? (
                          <div className="flex items-center gap-1 text-xs text-violet-700 dark:text-violet-300 font-semibold">
                            <Building2 className="w-3 h-3" />
                            <span>{schools.find(s => s.id === student.school)?.name}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-300 dark:text-slate-600">{t('studentManagement.notAssignedSchool')}</span>
                        )}
                        {student.class_name ? (
                          <div className="flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-300">
                            <School className="w-3 h-3" />
                            <span>{student.class_name}</span>
                          </div>
                        ) : (
                          !student.school && null
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/teacher/students/${student.id}`}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition"
                        >
                          <ChevronRight className="w-3 h-3" /> {t('studentManagement.progressLink')}
                        </Link>
                        <button
                          onClick={() => openEditSchoolClass(student)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-300 text-xs font-semibold hover:bg-violet-100 dark:hover:bg-violet-900/40 transition"
                          title={t('studentManagement.editSchoolClassTitle')}
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => openResetPassword(student)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300 text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/40 transition"
                          title={t('studentManagement.resetPasswordButton')}
                        >
                          <Key className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => openClearHistoryConfirm(student)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-300 text-xs font-semibold hover:bg-orange-100 dark:hover:bg-orange-900/40 transition"
                          title={t('studentManagement.clearHistoryButton')}
                        >
                          <Eraser className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => openDeleteConfirm(student)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-500 dark:text-red-400 text-xs font-semibold hover:bg-red-100 dark:hover:bg-red-900/40 transition"
                          title={t('studentManagement.deleteStudentTitle')}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Desktop table footer with pagination */}
            <div className="flex items-center justify-between px-6 py-3 bg-gray-50 dark:bg-slate-700/50 border-t border-gray-100 dark:border-slate-700">
              <p className="text-xs text-gray-400 dark:text-slate-500">
                {t('studentManagement.pageInfo', { page, totalPages: Math.max(1, totalPages), count: totalCount })}
              </p>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> {t('studentManagement.prevPage')}
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let p;
                    if (totalPages <= 5) p = i + 1;
                    else if (page <= 3) p = i + 1;
                    else if (page > totalPages - 3) p = totalPages - 4 + i;
                    else p = page - 2 + i;
                    return (
                      <button key={p} onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
                          p === page ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                        }`}>{p}</button>
                    );
                  })}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    {t('studentManagement.nextPage')} <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between sm:hidden mt-3">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" /> {t('studentManagement.prevPage')}
              </button>
              <span className="text-sm text-gray-500 dark:text-slate-400">{t('studentManagement.pagePrefix')} <strong>{page}</strong> / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {t('studentManagement.nextPage')} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Create / Reset Password Modal ── */}
      {modal && modal !== 'edit-school' && modal !== 'manage-schools' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 px-4 pb-4 sm:pb-0 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
            <button onClick={closeModal} className="absolute top-4 right-4 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${modal === 'create' ? 'bg-blue-100 dark:bg-blue-950/40' : 'bg-amber-100 dark:bg-amber-950/40'}`}>
                {modal === 'create' ? <Plus className="w-5 h-5 text-blue-600 dark:text-blue-300" /> : <Key className="w-5 h-5 text-amber-600 dark:text-amber-300" />}
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-slate-100">
                  {modal === 'create' ? t('studentManagement.createModalTitle') : t('studentManagement.resetModalTitle')}
                </h2>
                {modal === 'reset-password' && (
                  <p className="text-xs text-gray-500 dark:text-slate-400">{selectedStudent?.full_name}</p>
                )}
              </div>
            </div>

            {error && (
              <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-sm rounded-xl border border-red-100 dark:border-red-800/60">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={modal === 'create' ? handleCreate : handleResetPassword} className="space-y-4">
              {modal === 'create' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">{t('studentManagement.fullNameLabel')}</label>
                    <input
                      type="text" required autoFocus
                      value={fullName} onChange={e => setFullName(e.target.value)}
                      placeholder={t('studentManagement.fullNamePlaceholder')}
                      className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">{t('studentManagement.emailLabel')}</label>
                    <input
                      type="email" required
                      value={email} onChange={e => setEmail(e.target.value)}
                      placeholder={t('studentManagement.emailPlaceholder')}
                      className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">{t('studentManagement.schoolLabel')}</label>
                      <select
                        value={studentSchool} onChange={e => setStudentSchool(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white dark:bg-slate-800 dark:text-slate-100"
                      >
                        <option value="">{t('studentManagement.selectSchoolPlaceholder')}</option>
                        {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">{t('studentManagement.classLabel')}</label>
                      <input
                        type="text"
                        value={studentClass} onChange={e => setStudentClass(e.target.value)}
                        placeholder={t('studentManagement.classPlaceholder')}
                        className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                  {modal === 'create' ? t('studentManagement.passwordLabelCreate') : t('studentManagement.passwordLabelReset')}
                </label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'} required minLength={6}
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder={t('studentManagement.passwordPlaceholder')}
                    className="w-full px-3.5 py-2.5 pr-11 border border-gray-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition"
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
                    ? <><RotateCcw className="w-4 h-4 animate-spin" /> {t('studentManagement.processingButton')}</>
                    : modal === 'create' ? t('studentManagement.createSubmit') : t('studentManagement.resetSubmit')}
                </button>
                <button
                  type="button" onClick={closeModal}
                  className="flex-1 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-slate-600 transition"
                >
                  {t('studentManagement.cancelButton')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit School/Class Modal ── */}
      {modal === 'edit-school' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 px-4 pb-4 sm:pb-0 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 relative">
            <button onClick={closeModal} className="absolute top-4 right-4 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition"><X className="w-5 h-5" /></button>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center">
                <Edit2 className="w-5 h-5 text-violet-600 dark:text-violet-300" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-slate-100">{t('studentManagement.editSchoolClassModalTitle')}</h2>
                <p className="text-xs text-gray-500 dark:text-slate-400">{selectedStudent?.full_name}</p>
              </div>
            </div>
            {error && <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-sm rounded-xl border border-red-100 dark:border-red-800/60"><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span></div>}
            <form onSubmit={handleEditSchoolClass} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">{t('studentManagement.schoolLabel')}</label>
                <select
                  value={studentSchool} onChange={e => setStudentSchool(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-violet-500 focus:border-transparent transition bg-white dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="">{t('studentManagement.noSchoolOption')}</option>
                  {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">{t('studentManagement.classLabel')}</label>
                <input
                  type="text"
                  value={studentClass} onChange={e => setStudentClass(e.target.value)}
                  placeholder={t('studentManagement.classPlaceholder')}
                  className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <><RotateCcw className="w-4 h-4 animate-spin" /> {t('studentManagement.savingButton')}</> : t('studentManagement.saveChangesButton')}
                </button>
                <button type="button" onClick={closeModal} className="flex-1 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-slate-600 transition">{t('studentManagement.cancelButton')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Manage Schools Modal ── */}
      {modal === 'manage-schools' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 px-4 pb-4 sm:pb-0 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
            <button onClick={closeModal} className="absolute top-4 right-4 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition"><X className="w-5 h-5" /></button>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-violet-600 dark:text-violet-300" />
              </div>
              <h2 className="text-base font-bold text-gray-900 dark:text-slate-100">{t('studentManagement.manageSchoolsModalTitle')}</h2>
            </div>
            {/* Add school form */}
            <form onSubmit={handleCreateSchool} className="flex gap-2 mb-4">
              <input
                type="text" required autoFocus
                value={newSchoolName} onChange={e => setNewSchoolName(e.target.value)}
                placeholder={t('studentManagement.newSchoolPlaceholder')}
                className="flex-1 px-3.5 py-2.5 border border-gray-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
              />
              <button type="submit" disabled={schoolSaving} className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold text-sm transition disabled:opacity-50 flex items-center gap-1.5">
                {schoolSaving ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} {t('studentManagement.addButton')}
              </button>
            </form>
            {schoolError && <p className="text-xs text-red-500 dark:text-red-400 mb-3">{schoolError}</p>}
            {/* Schools list */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {schools.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-6">{t('studentManagement.noSchoolsYet')}</p>
              ) : schools.map(s => (
                <div key={s.id} className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-700/50 border border-gray-100 dark:border-slate-700">
                  {editingSchoolId === s.id ? (
                    <div className="flex items-center gap-2 w-full">
                      <input
                        type="text" autoFocus
                        value={editingSchoolName}
                        onChange={e => setEditingSchoolName(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 border border-gray-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-violet-500 transition"
                      />
                      <button onClick={() => handleUpdateSchool(s.id)} disabled={schoolUpdating} className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition">
                        {schoolUpdating ? <RotateCcw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      </button>
                      <button onClick={() => setEditingSchoolId(null)} className="p-1.5 rounded-lg text-gray-400 dark:text-slate-500 hover:bg-gray-200 dark:hover:bg-slate-600 transition">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-violet-400 dark:text-violet-500" />
                        <span className="text-sm font-medium text-gray-800 dark:text-slate-100">{s.name}</span>
                        <span className="text-[10px] text-gray-400 dark:text-slate-500">{t('studentManagement.studentCountSuffix', { count: rawStudents.filter(st => st.school === s.id).length })}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setEditingSchoolId(s.id); setEditingSchoolName(s.name); }} className="p-1.5 rounded-lg text-gray-400 dark:text-slate-500 hover:bg-violet-50 dark:hover:bg-violet-950/40 hover:text-violet-600 dark:hover:text-violet-300 transition">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteSchool(s)} className="p-1.5 rounded-lg text-red-400 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-300 transition">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
            <button onClick={closeModal} className="mt-4 w-full py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-slate-600 transition text-sm">{t('studentManagement.doneButton')}</button>
          </div>
        </div>
      )}

      {/* ── Confirm Delete Dialog ── */}
      <ConfirmDialog
        open={!!confirmStudent}
        title={t('studentManagement.deleteStudentTitle')}
        message={<>{t('studentManagement.deleteConfirmPre')} <strong>{confirmStudent?.full_name}</strong>. {t('studentManagement.deleteConfirmPost')}</>}
        onConfirm={handleDelete}
        onCancel={() => setConfirmStudent(null)}
        loading={deleting}
      />

      {/* ── Confirm Clear History (1 student) Dialog ── */}
      <ConfirmDialog
        open={!!clearHistoryStudent}
        title={t('studentManagement.clearHistoryConfirmTitle')}
        message={<>{t('studentManagement.clearHistoryConfirmPre')} <strong>{clearHistoryStudent?.full_name}</strong>. {t('studentManagement.clearHistoryConfirmPost')}</>}
        onConfirm={handleClearHistory}
        onCancel={() => setClearHistoryStudent(null)}
        loading={clearingHistory}
      />

      {/* ── Confirm Clear ALL History Dialog ── */}
      <ConfirmDialog
        open={clearAllConfirm}
        title={t('studentManagement.clearAllHistoryConfirmTitle')}
        message={t('studentManagement.clearAllHistoryConfirmMessage')}
        onConfirm={handleClearAllHistory}
        onCancel={() => setClearAllConfirm(false)}
        loading={clearingAll}
      />

      {/* ── Toasts ── */}
      <Toast toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};