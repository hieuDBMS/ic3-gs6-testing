import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LogOut, BookOpen, Users, LayoutDashboard,
  Settings, Layers, Menu, X, ChevronDown, Brain, Sword, CreditCard, ShieldCheck
} from 'lucide-react';

const COLORS = [
  'from-primary-500 to-accent-600',
  'from-emerald-500 to-teal-600',
  'from-pink-500 to-rose-600',
  'from-amber-500 to-orange-600',
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

const NavLink = ({ to, icon, children }) => {
  const { pathname } = useLocation();
  const active = pathname === to || pathname.startsWith(to + '/');
  return (
    <Link
      to={to}
      className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150
        ${active
          ? 'text-primary-600 bg-primary-50'
          : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
        }`}
    >
      {icon}
      {children}
      {active && (
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-primary-500" />
      )}
    </Link>
  );
};

export const Navbar = () => {
  const { profile, logout, isTeacher, isSelfRegistered, isAdminCreated } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!profile) return null;

  const initials = getInitials(profile.full_name);
  const avatarColor = getAvatarColor(profile.full_name);
  // Display username without @ic3fighter.local domain
  const displayEmail = profile.email?.endsWith('@ic3fighter.local')
    ? profile.email.replace('@ic3fighter.local', '')
    : profile.email;
  const roleLabel = isTeacher ? 'Giáo viên' : isAdminCreated ? 'Học sinh (Full)' : 'Học sinh';
  const roleBadge = isTeacher
    ? 'bg-violet-100 text-violet-700 border border-violet-200'
    : isAdminCreated
    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
    : 'bg-amber-100 text-amber-700 border border-amber-200';

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* ── Logo ── */}
            <Link to="/dashboard" className="flex items-center gap-2.5 flex-shrink-0 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-500 flex items-center justify-center shadow-md shadow-violet-200 group-hover:shadow-lg group-hover:scale-105 transition-all duration-200">
                <Sword className="w-5 h-5 text-white" />
              </div>
              <div className="leading-tight">
                <span className="block text-base font-bold text-gray-900 tracking-tight">IC3-Fighter</span>
                <span className="block text-[10px] font-semibold text-violet-600 tracking-widest uppercase -mt-0.5">Exam Platform</span>
              </div>
            </Link>

            {/* ── Desktop Nav Links ── */}
            <div className="hidden md:flex items-center gap-1 ml-6">
              <NavLink to="/dashboard" icon={<LayoutDashboard className="w-4 h-4" />}>Dashboard</NavLink>
              <NavLink to="/exam" icon={<BookOpen className="w-4 h-4" />}>Bài thi</NavLink>
              <NavLink to="/flashcard" icon={<Brain className="w-4 h-4" />}>Flashcard</NavLink>
              <NavLink to="/payments" icon={<CreditCard className="w-4 h-4" />}>Thanh toán</NavLink>
              {isTeacher && (
                <>
                  <NavLink to="/questions" icon={<Settings className="w-4 h-4" />}>Câu hỏi</NavLink>
                  <NavLink to="/teacher/exam-structure" icon={<Layers className="w-4 h-4" />}>Cấu trúc</NavLink>
                  <NavLink to="/teacher/students" icon={<Users className="w-4 h-4" />}>Học sinh</NavLink>
                  <NavLink to="/teacher/payment-settings" icon={<CreditCard className="w-4 h-4" />}>Cài đặt TT</NavLink>
                </>
              )}
            </div>

            {/* ── Right: User + Logout ── */}
            <div className="hidden md:flex items-center gap-3">
              {/* User chip */}
              <div className="flex items-center gap-2.5 pl-3 pr-4 py-1.5 rounded-full bg-gray-50 border border-gray-200">
                <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}>
                  {initials}
                </div>
                <div className="leading-tight min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate max-w-[120px]">{profile.full_name}</p>
                  <div className="flex items-center gap-1">
                    <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-full ${roleBadge} leading-none`}>{roleLabel}</span>
                  </div>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                title="Đăng xuất"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-150"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden lg:inline">Đăng xuất</span>
              </button>
            </div>

            {/* ── Mobile: hamburger ── */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* ── Mobile menu ── */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1 animate-slide-up">
            {[
              { to: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" />, label: 'Dashboard' },
              { to: '/exam', icon: <BookOpen className="w-4 h-4" />, label: 'Bài thi' },
              { to: '/flashcard', icon: <Brain className="w-4 h-4" />, label: 'Flashcard' },
              { to: '/payments', icon: <CreditCard className="w-4 h-4" />, label: 'Thanh toán' },
              ...(isTeacher ? [
                { to: '/questions', icon: <Settings className="w-4 h-4" />, label: 'Câu hỏi' },
                { to: '/teacher/exam-structure', icon: <Layers className="w-4 h-4" />, label: 'Cấu trúc thi' },
                { to: '/teacher/students', icon: <Users className="w-4 h-4" />, label: 'Học sinh' },
                { to: '/teacher/payment-settings', icon: <CreditCard className="w-4 h-4" />, label: 'Cài đặt thanh toán' },
              ] : [])
            ].map(item => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-primary-50 hover:text-primary-700 transition-colors"
              >
                {item.icon}{item.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-gray-100 mt-2">
              <div className="flex items-center gap-3 px-3 py-2">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-xs font-bold text-white`}>
                  {initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{profile.full_name}</p>
                  <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-full ${roleBadge}`}>{roleLabel}</span>
                </div>
                <button onClick={handleLogout} className="ml-auto p-2 rounded-lg text-red-400 hover:bg-red-50">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};
