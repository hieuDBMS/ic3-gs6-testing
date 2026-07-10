import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  LogOut, BookOpen, Users, LayoutDashboard,
  Settings2, Layers, Menu, X, Brain, CreditCard,
  ChevronDown, Sword, ListChecks, GraduationCap,
  Banknote, ChevronRight, PlayCircle,
  TrendingDown, Activity, BarChart3, Sun, Moon,
} from 'lucide-react';

/* ── Avatar helpers ── */
const COLORS = [
  'from-violet-500 to-indigo-500',
  'from-emerald-500 to-teal-600',
  'from-pink-500 to-rose-500',
  'from-amber-500 to-orange-500',
];
const getAvatarColor = (s) => {
  let h = 0;
  for (const c of s || '') h = c.charCodeAt(0) + ((h << 5) - h);
  return COLORS[Math.abs(h) % COLORS.length];
};
const getInitials = (name) => {
  if (!name) return '?';
  const p = name.trim().split(' ');
  return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : name[0].toUpperCase();
};

/* ── Desktop Nav Link ── */
const NavLink = ({ to, icon, children }) => {
  const { pathname } = useLocation();
  const active = pathname === to || pathname.startsWith(to + '/');
  return (
    <Link
      to={to}
      className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150
        ${active
          ? 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/40'
          : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100/70 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800'
        }`}
    >
      <span className={`transition-colors ${active ? 'text-indigo-500 dark:text-indigo-400' : 'text-gray-400 dark:text-slate-500'}`}>{icon}</span>
      {children}
      {active && (
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3.5 h-0.5 rounded-full bg-indigo-500" />
      )}
    </Link>
  );
};

/* ── Teacher Dropdown ── */
const TeacherDropdown = () => {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const items = [
    { to: '/questions',              icon: <ListChecks className="w-4 h-4" />,   label: 'Câu hỏi',           desc: 'Quản lý ngân hàng câu hỏi' },
    { to: '/teacher/exam-structure', icon: <Layers className="w-4 h-4" />,       label: 'Cấu trúc thi',      desc: 'Thiết lập bài thi & cấp độ' },
    { to: '/teacher/students',       icon: <GraduationCap className="w-4 h-4" />, label: 'Học sinh',          desc: 'Theo dõi tiến độ học viên' },
    { to: '/teacher/payment-settings', icon: <Banknote className="w-4 h-4" />,   label: 'Cài đặt TT',        desc: 'Quản lý thanh toán' },
    { to: '/teacher/question-stats', icon: <TrendingDown className="w-4 h-4" />, label: 'Câu hỏi hay sai',   desc: 'Thống kê toàn hệ thống' },
    { to: '/teacher/live-monitor',   icon: <Activity className="w-4 h-4" />,     label: 'Giám sát trực tiếp', desc: 'Theo dõi lớp đang thi' },
    { to: '/teacher/analytics',      icon: <BarChart3 className="w-4 h-4" />,    label: 'Phân tích nâng cao', desc: 'Biểu đồ & AI phân tích' },
  ];

  const isAnyActive = items.some(i => pathname === i.to || pathname.startsWith(i.to + '/'));

  /* Close on click outside */
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150
          ${isAnyActive
            ? 'text-violet-600 bg-violet-50 dark:text-violet-400 dark:bg-violet-950/40'
            : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100/70 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800'
          }`}
      >
        <Settings2 className={`w-4 h-4 transition-colors ${isAnyActive ? 'text-violet-500 dark:text-violet-400' : 'text-gray-400 dark:text-slate-500'}`} />
        Quản lý
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        {isAnyActive && (
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3.5 h-0.5 rounded-full bg-violet-500" />
        )}
      </button>

      {open && (
        <div
          className="absolute top-full mt-2 left-0 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100/80 dark:border-slate-700 py-2 z-50"
          style={{ boxShadow: '0 8px 32px rgba(15,23,42,0.12), 0 2px 8px rgba(15,23,42,0.06)' }}
        >
          {/* Header */}
          <div className="px-4 pt-1 pb-2 mb-1 border-b border-gray-50 dark:border-slate-700/60">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">Công cụ Giáo viên</p>
          </div>
          {items.map(item => {
            const active = pathname === item.to || pathname.startsWith(item.to + '/');
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl transition-all duration-150 group
                  ${active
                    ? 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-slate-300 dark:hover:bg-slate-700/50 dark:hover:text-slate-100'
                  }`}
              >
                <span className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all
                  ${active
                    ? 'bg-violet-100 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300'
                    : 'bg-gray-100 text-gray-400 group-hover:bg-violet-50 group-hover:text-violet-500 dark:bg-slate-700 dark:text-slate-400 dark:group-hover:bg-violet-950/40 dark:group-hover:text-violet-400'
                  }`}>
                  {item.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold leading-none mb-0.5">{item.label}</p>
                  <p className="text-[11px] text-gray-400 dark:text-slate-500 leading-none truncate">{item.desc}</p>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 transition-all
                  ${active ? 'text-violet-400' : 'text-gray-300 group-hover:text-gray-400 group-hover:translate-x-0.5 dark:text-slate-600'}`}
                />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════
   MAIN NAVBAR
══════════════════════════════════════════════ */
export const Navbar = () => {
  const { profile, logout, isTeacher, isAdminCreated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const handleLogout = async () => {
    try { await logout(); navigate('/login'); }
    catch (error) { console.error('Logout error:', error); }
  };

  if (!profile) return null;

  const initials = getInitials(profile.full_name);
  const avatarColor = getAvatarColor(profile.full_name);
  const displayEmail = profile.email?.endsWith('@ic3fighter.local')
    ? profile.email.replace('@ic3fighter.local', '')
    : profile.email;
  const roleLabel = isTeacher ? 'Giáo viên' : isAdminCreated ? 'Học sinh (Full)' : 'Học sinh';
  const roleBadge = isTeacher
    ? 'bg-violet-100 text-violet-700 border-violet-200'
    : isAdminCreated
    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
    : 'bg-amber-100 text-amber-700 border-amber-200';

  /* Teacher mobile items */
  const teacherItems = isTeacher ? [
    { to: '/questions',                icon: <ListChecks className="w-4 h-4" />,    label: 'Câu hỏi' },
    { to: '/teacher/exam-structure',   icon: <Layers className="w-4 h-4" />,        label: 'Cấu trúc thi' },
    { to: '/teacher/students',         icon: <GraduationCap className="w-4 h-4" />, label: 'Học sinh' },
    { to: '/teacher/payment-settings', icon: <Banknote className="w-4 h-4" />,      label: 'Cài đặt TT' },
    { to: '/teacher/question-stats',   icon: <TrendingDown className="w-4 h-4" />,  label: 'Câu hỏi hay sai' },
    { to: '/teacher/live-monitor',     icon: <Activity className="w-4 h-4" />,      label: 'Giám sát trực tiếp' },
    { to: '/teacher/analytics',        icon: <BarChart3 className="w-4 h-4" />,     label: 'Phân tích nâng cao' },
  ] : [];

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-gray-200/60 dark:border-slate-700/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* ── Logo ── */}
            <Link to="/dashboard" className="flex items-center gap-2.5 flex-shrink-0 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-500 flex items-center justify-center shadow-md shadow-violet-200 group-hover:shadow-lg group-hover:scale-105 transition-all duration-200">
                <Sword className="w-5 h-5 text-white" />
              </div>
              <div className="leading-tight hidden sm:block">
                <span className="block text-base font-bold text-gray-900 dark:text-slate-100 tracking-tight">IC3-Fighter</span>
                <span className="block text-[10px] font-semibold text-violet-600 tracking-widest uppercase -mt-0.5">Exam Platform</span>
              </div>
            </Link>

            {/* ── Desktop Nav ── */}
            <div className="hidden md:flex items-center gap-0.5 ml-4">
              <NavLink to="/dashboard" icon={<LayoutDashboard className="w-4 h-4" />}>Dashboard</NavLink>
              <NavLink to="/exam"      icon={<BookOpen className="w-4 h-4" />}>Ôn tập</NavLink>
              <NavLink to="/mock-exam" icon={<PlayCircle className="w-4 h-4" />}>Thi thử</NavLink>
              <NavLink to="/flashcard" icon={<Brain className="w-4 h-4" />}>Flashcard</NavLink>
              {!isAdminCreated && <NavLink to="/payments"  icon={<CreditCard className="w-4 h-4" />}>Thanh toán</NavLink>}
              {isTeacher && <TeacherDropdown />}
            </div>

            {/* ── Desktop Right ── */}
            <div className="hidden md:flex items-center gap-2">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}
                className="flex items-center justify-center w-9 h-9 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100/70 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-all duration-150"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* User chip */}
              <div className="flex items-center gap-2.5 pl-2 pr-3.5 py-1.5 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0`}>
                  {initials}
                </div>
                <div className="leading-tight min-w-0">
                  <p className="text-[12px] font-semibold text-gray-800 dark:text-slate-100 truncate max-w-[100px]">{profile.full_name}</p>
                  <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${roleBadge} leading-none`}>{roleLabel}</span>
                </div>
              </div>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                title="Đăng xuất"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 dark:text-slate-500 dark:hover:text-red-400 dark:hover:bg-red-950/30 border border-transparent hover:border-red-100 dark:hover:border-red-900/40 transition-all duration-150"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden lg:inline text-sm">Đăng xuất</span>
              </button>
            </div>

            {/* ── Mobile: Avatar + Hamburger ── */}
            <div className="flex md:hidden items-center gap-2">
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-[11px] font-bold text-white`}>
                {initials}
              </div>
              <button
                className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Mở menu"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile Drawer ── */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
            {/* User info bar */}
            <div className="flex items-center gap-3 px-5 py-4 bg-gray-50/80 dark:bg-slate-800/80 border-b border-gray-100 dark:border-slate-700">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-sm font-bold text-white flex-shrink-0`}>
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">{profile.full_name}</p>
                <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{displayEmail}</p>
              </div>
              <span className={`inline-block text-[10px] font-bold px-2 py-1 rounded-full border ${roleBadge} flex-shrink-0`}>{roleLabel}</span>
              <button
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}
                className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl text-gray-400 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-700 transition-all"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>

            {/* Nav items */}
            <div className="px-3 py-3 space-y-0.5">
              {[
                { to: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" />, label: 'Dashboard' },
                { to: '/exam',      icon: <BookOpen className="w-4 h-4" />,        label: 'Ôn tập' },
                { to: '/mock-exam', icon: <PlayCircle className="w-4 h-4" />,      label: 'Thi thử' },
                { to: '/flashcard', icon: <Brain className="w-4 h-4" />,           label: 'Flashcard' },
                !isAdminCreated && { to: '/payments',  icon: <CreditCard className="w-4 h-4" />,      label: 'Thanh toán' },
              ].filter(Boolean).map(item => {
                const active = pathname === item.to || pathname.startsWith(item.to + '/');
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                      ${active
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                      }`}
                  >
                    <span className={`${active ? 'text-indigo-500 dark:text-indigo-400' : 'text-gray-400 dark:text-slate-500'}`}>{item.icon}</span>
                    {item.label}
                    {active && <ChevronRight className="w-3.5 h-3.5 ml-auto text-indigo-400" />}
                  </Link>
                );
              })}

              {/* Teacher section */}
              {isTeacher && (
                <>
                  <div className="pt-2 pb-1 px-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 flex items-center gap-1.5">
                      <Settings2 className="w-3 h-3" /> Quản lý Giáo viên
                    </p>
                  </div>
                  {teacherItems.map(item => {
                    const active = pathname === item.to || pathname.startsWith(item.to + '/');
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                          ${active
                            ? 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                          }`}
                      >
                        <span className={`${active ? 'text-violet-500 dark:text-violet-400' : 'text-gray-400 dark:text-slate-500'}`}>{item.icon}</span>
                        {item.label}
                        {active && <ChevronRight className="w-3.5 h-3.5 ml-auto text-violet-400" />}
                      </Link>
                    );
                  })}
                </>
              )}
            </div>

            {/* Logout */}
            <div className="px-3 pb-4 pt-1 border-t border-gray-100 dark:border-slate-700">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
              >
                <LogOut className="w-4 h-4" />
                Đăng xuất
              </button>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};
