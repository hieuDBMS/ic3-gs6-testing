import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import { Search, Users, ArrowRight, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';

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
const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name[0].toUpperCase();
};

/* ── Score bar ── */
const ScoreBar = ({ score }) => {
  const pct = Math.min(100, Math.max(0, Number(score)));
  const isPassed = pct >= 70;
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${isPassed ? 'bg-emerald-400' : 'bg-red-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs font-bold w-10 text-right ${isPassed ? 'text-emerald-600' : 'text-red-500'}`}>
        {pct.toFixed(0)}%
      </span>
    </div>
  );
};

/* ── Skeleton ── */
const StudentSkeleton = () => (
  <div className="divide-y divide-gray-100 animate-pulse">
    {[1, 2, 3, 4].map(i => (
      <div key={i} className="flex items-center gap-4 px-5 py-4">
        <div className="w-11 h-11 rounded-2xl bg-gray-200 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
        <div className="w-24 h-3 bg-gray-100 rounded" />
      </div>
    ))}
  </div>
);

/* ── Activity chip ── */
const Chip = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all duration-150 ${
      active
        ? 'bg-indigo-600 text-white border-indigo-600'
        : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
    }`}
  >
    {label}
  </button>
);

export const StudentOverviewTable = () => {
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activityFilter, setActivityFilter] = useState('active'); // all | active | inactive
  const [page, setPage] = useState(0);

  useEffect(() => { fetchStudents(); }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('full_name');
      if (profileError) throw profileError;

      const { data: attempts, error: attemptsError } = await supabase
        .from('exam_attempts')
        .select('user_id, score, started_at')
        .neq('status', 'in_progress');
      if (attemptsError) throw attemptsError;

      const stats = (profiles || []).map(student => {
        const sa = (attempts || []).filter(a => a.user_id === student.id);
        const totalExams = sa.length;
        const avgScore = totalExams > 0
          ? sa.reduce((acc, a) => acc + Number(a.score), 0) / totalExams
          : 0;
        const last = [...sa].sort((a, b) => new Date(b.started_at) - new Date(a.started_at))[0];
        return { ...student, totalExams, avgScore, lastActive: last?.started_at || null };
      });

      setAllStudents(stats);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  /* ── Apply filters ── */
  const filtered = allStudents.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (s.full_name || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q);
    const matchActivity =
      activityFilter === 'all' ||
      (activityFilter === 'active' && s.totalExams > 0) ||
      (activityFilter === 'inactive' && s.totalExams === 0);
    return matchSearch && matchActivity;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleFilterChange = (setter, value) => {
    setter(value);
    setPage(0);
  };

  return (
    <div>
      {/* ── Search + activity filter ── */}
      <div className="px-5 py-3 border-b border-gray-100 space-y-2.5">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc email..."
            value={search}
            onChange={e => handleFilterChange(setSearch, e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50"
          />
        </div>

        {/* Activity filter */}
        <div className="flex items-center gap-1.5">
          <Chip label="Tất cả" active={activityFilter === 'all'} onClick={() => handleFilterChange(setActivityFilter, 'all')} />
          <Chip label="✓ Đã làm bài" active={activityFilter === 'active'} onClick={() => handleFilterChange(setActivityFilter, 'active')} />
          <Chip label="○ Chưa làm bài" active={activityFilter === 'inactive'} onClick={() => handleFilterChange(setActivityFilter, 'inactive')} />
          <span className="ml-auto text-xs text-gray-400 font-medium">
            {filtered.length} học sinh
          </span>
        </div>
      </div>

      {/* ── Rows ── */}
      {loading ? (
        <StudentSkeleton />
      ) : paginated.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400 space-y-2">
          <Users className="w-10 h-10 text-gray-200" />
          <p className="text-sm font-medium">
            {search || activityFilter !== 'all' ? 'Không tìm thấy học sinh nào.' : 'Chưa có học sinh nào.'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {paginated.map(student => (
            <div key={student.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors group">
              {/* Avatar */}
              <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${getAvatarColor(student.full_name)} flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm`}>
                {getInitials(student.full_name)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800 truncate">{student.full_name || '(Chưa đặt tên)'}</p>
                <p className="text-xs text-gray-400 truncate">{student.email}</p>
                {student.totalExams > 0 ? (
                  <div className="mt-1.5 max-w-[160px]">
                    <ScoreBar score={student.avgScore} />
                  </div>
                ) : (
                  <span className="mt-1 inline-block text-[10px] px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full font-semibold">
                    Chưa làm bài
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span className="font-semibold">{student.totalExams}</span>
                  <span className="text-gray-400">bài</span>
                </div>
                {student.lastActive && (
                  <p className="text-[10px] text-gray-400">
                    {new Date(student.lastActive).toLocaleDateString('vi-VN')}
                  </p>
                )}
              </div>

              {/* Link */}
              <Link
                to={`/teacher/students/${student.id}`}
                className="flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 transition-colors opacity-0 group-hover:opacity-100"
              >
                Tiến độ <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-4 h-4" /> Trước
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
                    p === page ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'
                  }`}>
                  {p + 1}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Sau <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
