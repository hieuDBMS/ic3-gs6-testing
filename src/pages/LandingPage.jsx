import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Sword, Sun, Moon, Globe, ArrowRight, CheckCircle2,
  Layers, Target, Brain, Activity, BarChart3, Award,
  ListChecks, Layers3, GraduationCap, Banknote, Menu, X,
} from 'lucide-react';
import { useState } from 'react';

const FEATURE_ICONS = [Layers, Target, Brain, Activity, BarChart3, Award];

const TEACHER_ICONS = [ListChecks, Layers3, GraduationCap, Banknote];

export const LandingPage = () => {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { lang, toggleLanguage } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);

  const year = new Date().getFullYear();
  const features = t('landing.features.items', { returnObjects: true });
  const steps = t('landing.howItWorks.steps', { returnObjects: true });
  const teacherItems = t('landing.forTeachers.items', { returnObjects: true });

  const navLinks = [
    { href: '#features', label: t('landing.nav.features') },
    { href: '#how-it-works', label: t('landing.nav.howItWorks') },
    { href: '#for-teachers', label: t('landing.nav.forTeachers') },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-200/60 dark:border-slate-700/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-linear-to-br from-violet-600 to-indigo-500 flex items-center justify-center shadow-md shadow-violet-200">
                <Sword className="w-5 h-5 text-white" />
              </div>
              <span className="text-base font-bold text-gray-900 dark:text-slate-100 tracking-tight">IC3-Fighter</span>
            </div>

            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  className="px-3 py-2 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100/70 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-all duration-150"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={toggleLanguage}
                title={t('nav.language')}
                className="flex items-center gap-1 px-2.5 h-9 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100/70 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-all duration-150"
              >
                <Globe className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase">{lang}</span>
              </button>
              <button
                onClick={toggleTheme}
                title={theme === 'dark' ? t('nav.themeToLight') : t('nav.themeToDark')}
                className="flex items-center justify-center w-9 h-9 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100/70 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-all duration-150"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <Link to="/login" className="btn-ghost py-2! px-4!">{t('landing.nav.login')}</Link>
              <Link to="/register" className="btn-primary py-2! px-4!">{t('landing.nav.register')}</Link>
            </div>

            <button
              className="md:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800"
              onClick={() => setMobileOpen(v => !v)}
              aria-label={t('nav.openMenu')}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl px-4 py-4 space-y-1">
            {navLinks.map(link => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {link.label}
              </a>
            ))}
            <div className="flex items-center gap-2 px-4 pt-2">
              <button onClick={toggleLanguage} className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800">
                <Globe className="w-4 h-4" /> {lang.toUpperCase()}
              </button>
              <button onClick={toggleTheme} className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800">
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex gap-2 px-4 pt-2">
              <Link to="/login" className="btn-ghost flex-1">{t('landing.nav.login')}</Link>
              <Link to="/register" className="btn-primary flex-1">{t('landing.nav.register')}</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-ic3-gradient">
        <div className="absolute inset-0 bg-ic3-glow pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }} />
        <div className="absolute -top-24 -left-16 w-96 h-96 rounded-full bg-primary-500/20 blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-accent-400/15 blur-[60px] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-400/20 border border-accent-400/30 mb-6 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-accent-400 animate-pulse-slow" />
            <span className="text-accent-300 text-xs font-semibold tracking-wide uppercase">{t('landing.hero.badge')}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight text-balance animate-slide-up">
            {t('landing.hero.titleLine1')}{' '}
            <span className="bg-linear-to-r from-accent-300 to-primary-300 bg-clip-text text-transparent">
              {t('landing.hero.titleLine2')}
            </span>
            <br />
            {t('landing.hero.titleLine3')}
          </h1>

          <p className="mt-6 text-white/60 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed animate-slide-up">
            {t('landing.hero.subtitle')}
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 animate-slide-up">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm text-primary-950 bg-white hover:bg-white/90 shadow-glow-blue active:scale-[0.98] transition-all duration-200 w-full sm:w-auto"
            >
              {t('landing.hero.ctaPrimary')}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm text-white bg-white/10 border border-white/20 hover:bg-white/15 backdrop-blur-xs transition-all duration-200 w-full sm:w-auto"
            >
              {t('landing.hero.ctaSecondary')}
            </Link>
          </div>
        </div>

        {/* Trust bar */}
        <div className="relative z-10 border-t border-white/10 bg-black/10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
            <div className="flex items-center gap-3">
              {[t('landing.trustBar.gs6'), t('landing.trustBar.gs7'), t('landing.trustBar.gs8')].map(v => (
                <span key={v} className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-white/80 text-xs font-bold tracking-wide">
                  {v}
                </span>
              ))}
            </div>
            <p className="text-white/40 text-xs sm:text-sm text-center">{t('landing.trustBar.quote')}</p>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="section-title text-3xl">{t('landing.features.title')}</h2>
          <p className="mt-3 text-gray-500 dark:text-slate-400">{t('landing.features.subtitle')}</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => {
            const Icon = FEATURE_ICONS[i] || CheckCircle2;
            return (
              <div key={i} className="card p-6 hover:shadow-card-hover transition-shadow duration-200">
                <div className="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-950/40 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-slate-100 mb-1.5">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="section-bg py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-title text-3xl text-center mb-14">{t('landing.howItWorks.title')}</h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map((s, i) => (
              <div key={i} className="relative">
                <div className="card p-6 h-full">
                  <div className="w-9 h-9 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-sm mb-4">
                    {i + 1}
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-slate-100 mb-1.5">{s.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── For Teachers ── */}
      <section id="for-teachers" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="rounded-3xl bg-ic3-gradient relative overflow-hidden p-8 sm:p-12 lg:p-16">
          <div className="absolute inset-0 bg-ic3-glow pointer-events-none" />
          <div className="relative z-10 grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-400/20 border border-accent-400/30 mb-5">
                <span className="text-accent-300 text-xs font-semibold tracking-wide uppercase">{t('landing.forTeachers.badge')}</span>
              </div>
              <h2 className="text-3xl font-extrabold text-white leading-tight mb-3">{t('landing.forTeachers.title')}</h2>
              <p className="text-white/60 leading-relaxed">{t('landing.forTeachers.subtitle')}</p>
            </div>

            <ul className="space-y-3">
              {teacherItems.map((item, i) => {
                const Icon = TEACHER_ICONS[i] || CheckCircle2;
                return (
                  <li key={i} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3.5">
                    <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-accent-300 shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-white/80 text-sm font-medium">{item}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      {/* ── CTA band ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 text-center">
        <h2 className="section-title text-3xl mb-3">{t('landing.ctaBand.title')}</h2>
        <p className="text-gray-500 dark:text-slate-400 max-w-xl mx-auto mb-8">{t('landing.ctaBand.subtitle')}</p>
        <Link to="/register" className="btn-primary px-8! py-3.5! text-base inline-flex">
          {t('landing.ctaBand.cta')}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-200 dark:border-slate-700 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-violet-600 to-indigo-500 flex items-center justify-center">
              <Sword className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-slate-100 leading-none">IC3-Fighter</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{t('landing.footer.tagline')}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/login" className="text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-100">{t('landing.footer.login')}</Link>
            <Link to="/register" className="text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-100">{t('landing.footer.register')}</Link>
          </div>
          <p className="text-xs text-gray-400 dark:text-slate-500">{t('landing.footer.copyright', { year })}</p>
        </div>
      </footer>
    </div>
  );
};
