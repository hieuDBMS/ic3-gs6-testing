import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import { Search, Users, ArrowRight, BookOpen, ChevronLeft, ChevronRight, Building2, School } from 'lucide-react';
import { getInitials } from '../../utils/avatar';
import { useStudents } from '../../hooks/useStudents';
import { Skeleton } from '../shared/Skeleton';

const PAGE_SIZE = 10;

/* ── Avatar helpers ── */
const AVATAR_COLORS = [
  'from-indigo-400 to-violet-500',
  'from-emerald-400 to-teal-500',
  'from-pink-400 to-rose-500',
  'from-amber-400 to-orange-500',
  'from-cyan-400 to-blue-500',
];
const getAvatarColor = (str) => {
  let hash = 0;
  for (const c of str || '') hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

/* ── Score bar ── */
const ScoreBar = ({ score }) => {
  const pct = Math.min(100, Math.max(0, Number(score)));
  const isPassed = pct >= 70;
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${isPassed ? 'bg-emerald-400' : 'bg-red-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs font-bold w-10 text-right ${isPassed ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
        {pct.toFixed(0)}%
      </span>
    </div>
  );
};

/* ── Skeleton ── */
const StudentSkeleton = () => <Skeleton variant="table-row" count={4} />;

/* ── Activity chip ── */
const Chip = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all duration-150 ${
      active
        ? 'bg-indigo-600 text-white border-indigo-600'
        : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500'
    }`}
  >
    {label}
  </button>
);

const StudentOverviewTableImpl = () => {
  const { t } = useTranslation();
  const [schools, setSchools] = useState([]);
  const [search, setSearch] = useState('');
  const [activityFilter, setActivityFilter] = useState('active'); // all | active | inactive
  const [schoolFilter, setSchoolFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [page, setPage] = useState(0);

  const { students: paginated, rawStudents, totalCount, loading } = useStudents({
    search,
    activityFilter,
    schoolFilter,
    classFilter,
    classMatchMode: 'exact',
    page,
    pageSize: PAGE_SIZE,
  });

  const allClasses = [...new Set(rawStudents.map(s => s.class_name).filter(Boolean))].sort();

  useEffect(() => {
    const fetchSchools = async () => {
      const { data: schoolData } = await supabase.from('schools').select('*').order('name');
      if (schoolData) setSchools(schoolData);
    };
    fetchSchools();
  }, []);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handleFilterChange = (setter, value) => {
    setter(value);
    setPage(0);
  };

  return (
    <div>
      {/* ── Search + activity filter ── */}
      <div className="px-5 py-3 border-b border-gray-100 dark:border-slate-700 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder={t('studentOverview.searchPlaceholder')}
            value={search}
            onChange={e => handleFilterChange(setSearch, e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-300 bg-gray-50 dark:bg-slate-700/50 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-500"
          />
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-2">
          <Chip label={t('studentOverview.filterAll')} active={activityFilter === 'all'} onClick={() => handleFilterChange(setActivityFilter, 'all')} />
          <Chip label={t('studentOverview.filterActive')} active={activityFilter === 'active'} onClick={() => handleFilterChange(setActivityFilter, 'active')} />
          <Chip label={t('studentOverview.filterInactive')} active={activityFilter === 'inactive'} onClick={() => handleFilterChange(setActivityFilter, 'inactive')} />
        </div>

        {/* School & Class Row */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-200 dark:border-slate-600 px-3 py-1.5 flex-1 sm:flex-none">
            <Building2 className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />
            <select
              value={schoolFilter}
              onChange={e => handleFilterChange(setSchoolFilter, e.target.value)}
              className="flex-1 outline-hidden text-xs text-gray-700 dark:text-slate-300 bg-transparent cursor-pointer"
            >
              <option value="">{t('studentOverview.allSchools')}</option>
              {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-200 dark:border-slate-600 px-3 py-1.5 flex-1 sm:flex-none">
            <School className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            <select
              value={classFilter}
              onChange={e => handleFilterChange(setClassFilter, e.target.value)}
              className="flex-1 outline-hidden text-xs text-gray-700 dark:text-slate-300 bg-transparent cursor-pointer"
            >
              <option value="">{t('studentOverview.allClasses')}</option>
              {allClasses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <span className="ml-auto text-xs text-gray-400 dark:text-slate-500 font-medium self-center">
            {t('studentOverview.studentCount', { count: totalCount })}
          </span>
        </div>
      </div>

      {/* ── Rows ── */}
      {loading ? (
        <StudentSkeleton />
      ) : paginated.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-slate-500 space-y-2">
          <Users className="w-10 h-10 text-gray-200 dark:text-slate-600" />
          <p className="text-sm font-medium">
            {search || activityFilter !== 'all' ? t('studentOverview.noResultsFiltered') : t('studentOverview.noResults')}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-slate-700">
          {paginated.map(student => (
            <div key={student.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors group">
              {/* Avatar */}
              <div className={`w-11 h-11 rounded-2xl bg-linear-to-br ${getAvatarColor(student.full_name)} flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-xs`}>
                {getInitials(student.full_name)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800 dark:text-slate-100 truncate">{student.full_name || t('studentOverview.unnamed')}</p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{student.email}</p>
                  {(() => {
                    const sName = student.school ? schools.find(s => s.id === student.school)?.name : null;
                    return (sName || student.class_name) ? (
                      <div className="flex items-center gap-1.5 mt-0.5 sm:mt-0 sm:border-l border-gray-200 dark:border-slate-700 sm:pl-2">
                        {sName && (
                          <span className="text-[10px] text-violet-600 dark:text-violet-400 font-medium">
                            {sName}
                          </span>
                        )}
                        {student.class_name && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                            {sName && '· '}{t('studentOverview.classPrefix')} {student.class_name}
                          </span>
                        )}
                      </div>
                    ) : null;
                  })()}
                </div>
                {student.totalAttempts > 0 ? (
                  <div className="mt-1.5 max-w-[160px]">
                    <ScoreBar score={student.avgScore} />
                  </div>
                ) : (
                  <span className="mt-1 inline-block text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500 rounded-full font-semibold">
                    {t('studentOverview.notAttempted')}
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span className="font-semibold">{student.totalAttempts}</span>
                  <span className="text-gray-400 dark:text-slate-500">{t('studentOverview.attemptsSuffix')}</span>
                </div>
                {student.lastActiveAt && (
                  <p className="text-[10px] text-gray-400 dark:text-slate-500">
                    {new Date(student.lastActiveAt).toLocaleDateString('vi-VN')}
                  </p>
                )}
              </div>

              {/* Link */}
              <Link
                to={`/teacher/students/${student.id}`}
                className="shrink-0 flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 transition-colors opacity-0 group-hover:opacity-100 dark:text-indigo-300 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 dark:border-indigo-800/60"
              >
                {t('studentOverview.progressLink')} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 dark:border-slate-700">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-4 h-4" /> {t('studentOverview.prev')}
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p;
              if (totalPages <= 5) p = i;
              else if (page < 3) p = i;
              else if (page > totalPages - 4) p = totalPages - 5 + i;
              else p = page - 2 + i;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                    p === page ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                  }`}>
                  {p + 1}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {t('studentOverview.next')} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export const StudentOverviewTable = React.memo(StudentOverviewTableImpl);
