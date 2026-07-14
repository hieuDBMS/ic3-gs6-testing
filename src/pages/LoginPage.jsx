import { useRef, useState } from "react";
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, LogIn, Sword, ShieldCheck, Monitor, Award } from 'lucide-react';

export const LoginPage = () => {
  const { t } = useTranslation();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const isSubmittingRef = useRef(false);

  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  /* ── Decorative feature list shown on the left panel ── */
  const featureTexts = t('auth.login.features', { returnObjects: true });
  const featureIcons = [
    <Monitor className="w-5 h-5" />,
    <ShieldCheck className="w-5 h-5" />,
    <Award className="w-5 h-5" />,
  ];
  const features = featureTexts.map((text, i) => ({ icon: featureIcons[i], text }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setError('');
    setIsLoading(true);
    try {
      await login(emailOrUsername, password);
      navigate('/dashboard');
    } catch {
      setError(t('auth.login.errorInvalid'));
    } finally {
      setIsLoading(false);
      isSubmittingRef.current = false;
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── LEFT: Branding Panel ── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col justify-between p-12"
        style={{ background: 'linear-gradient(145deg, #0f172a 0%, #182e89 55%, #0e7490 100%)' }}>

        {/* Background blobs */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute -top-24 -left-16 w-96 h-96 rounded-full bg-primary-500/20 blur-[80px]" />
          <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-accent-400/15 blur-[60px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary-800/30 blur-[100px]" />
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }} />

        {/* Content */}
        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-xs">
              <Sword className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white font-extrabold text-xl tracking-tight leading-none">IC3-Fighter</p>
              <p className="text-white/50 text-xs font-medium tracking-wider uppercase mt-0.5">Exam System</p>
            </div>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10 space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-400/20 border border-accent-400/30 mb-5">
              <span className="w-2 h-2 rounded-full bg-accent-400 animate-pulse-slow" />
              <span className="text-accent-300 text-xs font-semibold tracking-wide uppercase">{t('auth.login.badge')}</span>
            </div>
            <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight text-balance">
              {t('auth.login.heroLine1')}<br />
              <span className="bg-linear-to-r from-accent-300 to-primary-300 bg-clip-text text-transparent">
                {t('auth.login.heroLine2')}
              </span>
            </h1>
            <p className="mt-4 text-white/55 text-base leading-relaxed max-w-sm">
              {t('auth.login.heroSubtitle')}
            </p>
          </div>

          {/* Feature pills */}
          <ul className="space-y-3">
            {features.map((f, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-accent-300 shrink-0">
                  {f.icon}
                </div>
                <span className="text-white/70 text-sm font-medium">{f.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom badge */}
        <div className="relative z-10">
          <p className="text-white/25 text-xs">
            {t('auth.login.copyright', { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>

      {/* ── RIGHT: Login Form Panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 bg-linear-to-br from-slate-50 via-blue-50/40 to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">

        {/* Mobile logo */}
        <div className="lg:hidden flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-200 mb-3">
            <Sword className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-slate-100">IC3-Fighter</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{t('auth.login.mobileSubtitle')}</p>
        </div>

        <div className="w-full max-w-[400px]">
          {/* Form header */}
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight">{t('auth.login.title')}</h2>
            <p className="mt-2 text-gray-500 dark:text-slate-400 text-sm">{t('auth.login.subtitle')}</p>
          </div>

          {/* Error */}
          {error && (
            <div role="alert" className="mb-5 flex items-start gap-3 px-4 py-3.5 rounded-xl bg-red-50 border border-red-200 dark:bg-red-950/40 dark:border-red-800/60 animate-fade-in">
              <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-700 dark:text-red-300 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                {t('auth.login.usernameLabel')}
              </label>
              <input
                id="email"
                type="text"
                autoComplete="username"
                required
                value={emailOrUsername}
                onChange={e => setEmailOrUsername(e.target.value)}
                placeholder={t('auth.login.usernamePlaceholder')}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm placeholder-gray-400
                           dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500
                           focus:outline-hidden focus:ring-2 focus:ring-primary-400 focus:border-transparent
                           transition-all duration-150 shadow-xs hover:border-gray-300 dark:hover:border-slate-500"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                {t('auth.login.passwordLabel')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={t('auth.login.passwordPlaceholder')}
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm placeholder-gray-400
                             dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500
                             focus:outline-hidden focus:ring-2 focus:ring-primary-400 focus:border-transparent
                             transition-all duration-150 shadow-xs hover:border-gray-300 dark:hover:border-slate-500"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-primary-500 dark:text-slate-500 dark:hover:text-primary-400 transition-colors"
                  aria-label={showPassword ? t('auth.login.hidePassword') : t('auth.login.showPassword')}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl font-bold text-sm text-white
                         bg-linear-to-r from-primary-600 to-primary-500
                         hover:from-primary-700 hover:to-primary-600
                         shadow-lg shadow-primary-200 hover:shadow-xl hover:shadow-primary-200
                         active:scale-[0.98] transition-all duration-200
                         focus:outline-hidden focus:ring-2 focus:ring-primary-400 focus:ring-offset-2
                         disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100`}
            >
              {isLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t('auth.login.submitting')}
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  {t('auth.login.submit')}
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <p className="mt-8 text-center text-sm text-gray-500">
            {t('auth.login.noAccount')}{' '}
            <Link to="/register" className="text-primary-600 font-semibold hover:text-primary-700 transition-colors">
              {t('auth.login.registerNow')}
            </Link>
          </p>
          <p className="mt-2 text-center text-xs text-gray-400">
            {t('auth.login.forgotPassword')}
          </p>
        </div>
      </div>
    </div>
  );
};
