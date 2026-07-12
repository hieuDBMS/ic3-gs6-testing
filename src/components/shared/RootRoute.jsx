import { lazy, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';

const LandingPage = lazy(() => import('../../pages/LandingPage').then(m => ({ default: m.LandingPage })));

/* "/" is public marketing content for logged-out visitors, but should never
   show to an already-authenticated user — they get bounced straight to their
   dashboard, same as any other top-level entry point. */
export const RootRoute = () => {
  const { t } = useTranslation();
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center dark:bg-slate-900 dark:text-slate-300">{t('common.loading')}</div>;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Suspense fallback={null}>
      <LandingPage />
    </Suspense>
  );
};
