import { useRef, useState } from "react";
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, UserPlus, Sword, User, Lock, BadgeCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Turnstile } from '../components/shared/Turnstile';

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

export const RegisterPage = () => {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [touched, setTouched] = useState({ username: false, password: false, confirmPassword: false });
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const isSubmittingRef = useRef(false);
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  const usernameError = username.length === 0
    ? ''
    : username.length < 4
      ? t('auth.register.errorUsernameLength')
      : !/^[a-zA-Z0-9_]+$/.test(username)
        ? t('auth.register.errorUsernameFormat')
        : '';
  const passwordError = password.length > 0 && password.length < 6 ? t('auth.register.errorPasswordLength') : '';
  const confirmError = confirmPassword.length > 0 && confirmPassword !== password ? t('auth.register.errorMismatch') : '';

  const showUsernameError = (touched.username || attemptedSubmit) && usernameError;
  const showPasswordError = (touched.password || attemptedSubmit) && passwordError;
  const showConfirmError = (touched.confirmPassword || attemptedSubmit) && confirmError;
  const markTouched = (field) => setTouched((t) => ({ ...t, [field]: true }));

  const featureTexts = t('auth.register.features', { returnObjects: true });
  const featureIcons = [
    <BadgeCheck className="w-5 h-5" />,
    <Sword className="w-5 h-5" />,
    <User className="w-5 h-5" />,
  ];
  const features = featureTexts.map((text, i) => ({ icon: featureIcons[i], text }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmittingRef.current) return;
    setError('');
    setAttemptedSubmit(true);

    // Focus the first invalid field instead of just showing a generic banner —
    // lets the user fix the actual problem without hunting for it.
    if (usernameError) { usernameRef.current?.focus(); return; }
    if (passwordError) { passwordRef.current?.focus(); return; }
    if (confirmError) { confirmPasswordRef.current?.focus(); return; }
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setError(t('auth.register.errorCaptcha'));
      return;
    }

    isSubmittingRef.current = true;
    setIsLoading(true);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('register-user', {
        body: { username, password, fullName, turnstileToken },
      });
      if (fnErr) throw new Error(fnErr.message);
      if (data?.error) throw new Error(data.error);

      setSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.message || t('auth.register.errorGeneric'));
      setTurnstileToken('');
    } finally {
      setIsLoading(false);
      isSubmittingRef.current = false;
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── LEFT: Branding Panel ── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col justify-between p-12"
        style={{ background: 'linear-gradient(145deg, #0f172a 0%, #1e1b4b 55%, #312e81 100%)' }}>

        {/* Background blobs */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute -top-24 -left-16 w-96 h-96 rounded-full bg-violet-500/20 blur-[80px]" />
          <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-indigo-400/15 blur-[60px]" />
        </div>
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }} />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-xs">
            <Sword className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-white font-extrabold text-xl tracking-tight leading-none">IC3-Fighter</p>
            <p className="text-white/50 text-xs font-medium tracking-wider uppercase mt-0.5">{t('auth.register.tagline')}</p>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10 space-y-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-400/20 border border-violet-400/30 mb-5">
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
              <span className="text-violet-300 text-xs font-semibold tracking-wide uppercase">{t('auth.register.badge')}</span>
            </div>
            <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight">
              {t('auth.register.heroLine1')}<br />
              <span className="bg-linear-to-r from-violet-300 to-indigo-300 bg-clip-text text-transparent">
                {t('auth.register.heroLine2')}
              </span>
            </h1>
            <p className="mt-4 text-white/55 text-base leading-relaxed max-w-sm">
              {t('auth.register.heroSubtitle')}
            </p>
          </div>

          <ul className="space-y-3">
            {features.map((f, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-violet-300 shrink-0">
                  {f.icon}
                </div>
                <span className="text-white/70 text-sm font-medium">{f.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10">
          <p className="text-white/25 text-xs">{t('auth.register.copyright', { year: new Date().getFullYear() })}</p>
        </div>
      </div>

      {/* ── RIGHT: Register Form ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 bg-linear-to-br from-slate-50 via-violet-50/30 to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">

        {/* Mobile logo */}
        <div className="lg:hidden flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg mb-3">
            <Sword className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-slate-100">IC3-Fighter</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{t('auth.register.mobileSubtitle')}</p>
        </div>

        <div className="w-full max-w-[400px]">
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight">{t('auth.register.title')}</h2>
            <p className="mt-2 text-gray-500 dark:text-slate-400 text-sm">{t('auth.register.subtitle')}</p>
          </div>

          {/* Success state */}
          {success && (
            <div className="mb-5 flex items-center gap-3 px-4 py-4 rounded-xl bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800/60">
              <BadgeCheck className="w-6 h-6 text-emerald-500 shrink-0" />
              <div>
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{t('auth.register.successTitle')}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">{t('auth.register.successSubtitle')}</p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div role="alert" className="mb-5 flex items-start gap-3 px-4 py-3.5 rounded-xl bg-red-50 border border-red-200 dark:bg-red-950/40 dark:border-red-800/60">
              <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-700 dark:text-red-300 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                {t('auth.register.fullNameLabel')}
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
                <input
                  id="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder={t('auth.register.fullNamePlaceholder')}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm placeholder-gray-400
                             dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500
                             focus:outline-hidden focus:ring-2 focus:ring-violet-400 focus:border-transparent
                             transition-all duration-150 shadow-xs hover:border-gray-300 dark:hover:border-slate-500"
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                {t('auth.register.usernameLabel')}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 text-sm font-mono">@</span>
                <input
                  id="username"
                  ref={usernameRef}
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase())}
                  onBlur={() => markTouched('username')}
                  placeholder={t('auth.register.usernamePlaceholder')}
                  aria-invalid={!!showUsernameError}
                  aria-describedby="username-hint"
                  className={`w-full pl-9 pr-4 py-3 rounded-xl border bg-white text-gray-900 text-sm placeholder-gray-400 font-mono
                             dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500
                             focus:outline-hidden focus:ring-2 focus:ring-violet-400 focus:border-transparent
                             transition-all duration-150 shadow-xs
                             ${showUsernameError ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950/30' : 'border-gray-200 hover:border-gray-300 dark:border-slate-600 dark:hover:border-slate-500'}`}
                />
              </div>
              <p id="username-hint" className={`mt-1 text-xs ${showUsernameError ? 'text-red-500 dark:text-red-400' : 'text-gray-400 dark:text-slate-500'}`}>
                {showUsernameError || t('auth.register.usernameHint')}
              </p>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="reg-password" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                {t('auth.register.passwordLabel')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
                <input
                  id="reg-password"
                  ref={passwordRef}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onBlur={() => markTouched('password')}
                  placeholder={t('auth.register.passwordPlaceholder')}
                  aria-invalid={!!showPasswordError}
                  aria-describedby="password-hint"
                  className={`w-full pl-10 pr-12 py-3 rounded-xl border bg-white text-gray-900 text-sm placeholder-gray-400
                             dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500
                             focus:outline-hidden focus:ring-2 focus:ring-violet-400 focus:border-transparent
                             transition-all duration-150 shadow-xs
                             ${showPasswordError ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950/30' : 'border-gray-200 hover:border-gray-300 dark:border-slate-600 dark:hover:border-slate-500'}`}
                />
                <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? t('auth.login.hidePassword') : t('auth.login.showPassword')}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-violet-500 dark:text-slate-500 dark:hover:text-violet-400 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {showPasswordError && (
                <p id="password-hint" className="mt-1 text-xs text-red-500 dark:text-red-400">{showPasswordError}</p>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                {t('auth.register.confirmPasswordLabel')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
                <input
                  id="confirmPassword"
                  ref={confirmPasswordRef}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  onBlur={() => markTouched('confirmPassword')}
                  placeholder={t('auth.register.confirmPasswordPlaceholder')}
                  aria-invalid={!!showConfirmError}
                  aria-describedby="confirm-password-hint"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-white text-gray-900 text-sm placeholder-gray-400
                             dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500
                             focus:outline-hidden focus:ring-2 focus:ring-violet-400 focus:border-transparent
                             transition-all duration-150 shadow-xs
                             ${showConfirmError ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950/30' : 'border-gray-200 hover:border-gray-300 dark:border-slate-600 dark:hover:border-slate-500'}`}
                />
              </div>
              {showConfirmError && (
                <p id="confirm-password-hint" className="mt-1 text-xs text-red-500 dark:text-red-400">{t('auth.register.passwordMismatchHint')}</p>
              )}
            </div>

            {TURNSTILE_SITE_KEY && (
              <div className="flex justify-center">
                <Turnstile
                  siteKey={TURNSTILE_SITE_KEY}
                  onVerify={setTurnstileToken}
                  onExpire={() => setTurnstileToken('')}
                />
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || success}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl font-bold text-sm text-white
                         bg-linear-to-r from-violet-600 to-indigo-500
                         hover:from-violet-700 hover:to-indigo-600
                         shadow-lg shadow-violet-200 hover:shadow-xl
                         active:scale-[0.98] transition-all duration-200
                         focus:outline-hidden focus:ring-2 focus:ring-violet-400 focus:ring-offset-2
                         disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t('auth.register.submitting')}
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  {t('auth.register.submit')}
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-slate-400">
            {t('auth.register.haveAccount')}{' '}
            <Link to="/login" className="text-violet-600 font-semibold hover:text-violet-700 transition-colors">
              {t('auth.register.loginNow')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
