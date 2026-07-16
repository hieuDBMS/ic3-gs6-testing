import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, Flame, BookOpen, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLeaderboard, useMyLeaderboardRank } from '../hooks/useLeaderboard';
import { supabase } from '../lib/supabase';
import { PageHeader } from '../components/shared/PageHeader';
import { EmptyState } from '../components/shared/EmptyState';
import { Skeleton } from '../components/shared/Skeleton';
import { Toast, useToast } from '../components/shared/Toast';
import { getInitials } from '../utils/avatar';
import { getErrorMessage } from '../utils/errorHandler';

const COLORS = [
  'from-indigo-500 to-violet-600',
  'from-emerald-500 to-teal-600',
  'from-pink-500 to-rose-600',
  'from-amber-500 to-orange-600',
];
const getColor = (s) => {
  let h = 0;
  for (const c of s || '') h = c.charCodeAt(0) + ((h << 5) - h);
  return COLORS[Math.abs(h) % COLORS.length];
};

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

const Chip = ({ label, active, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${
      active
        ? 'bg-indigo-600 text-white border-indigo-600'
        : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:border-indigo-500'
    }`}
  >
    {label}
  </button>
);

export const LeaderboardPage = () => {
  const { t } = useTranslation();
  const { user, profile, isTeacher } = useAuth();
  const { toasts, showToast, dismissToast } = useToast();

  const [scope, setScope] = useState(() =>
    profile?.class_name ? 'class' : profile?.school ? 'school' : 'global'
  );
  const [metric, setMetric] = useState('streak'); // 'streak' | 'attempts'
  const [optIn, setOptIn] = useState(!!profile?.leaderboard_opt_in);
  const [optInSaving, setOptInSaving] = useState(false);

  const scopeValue = scope === 'class' ? profile?.class_name : scope === 'school' ? profile?.school : null;
  const scopeUnavailable = scope !== 'global' && !scopeValue;

  const { rows, loading, error, refetch } = useLeaderboard({ scope, scopeValue, metric, enabled: !scopeUnavailable });
  const { myRank, refetch: refetchMyRank } = useMyLeaderboardRank({ scope, metric, enabled: !scopeUnavailable && optIn });

  const handleToggleOptIn = async () => {
    const next = !optIn;
    setOptInSaving(true);
    try {
      const { error } = await supabase.rpc('set_leaderboard_opt_in', { p_opt_in: next });
      if (error) throw error;
      setOptIn(next);
      showToast(next ? t('leaderboard.optInOnToast') : t('leaderboard.optInOffToast'), 'success');
      // Bảng xếp hạng + hạng của chính mình không tự refetch khi chỉ đổi
      // optIn (không nằm trong queryKey) — không gọi lại sẽ khiến user vừa
      // bật hiển thị không thấy tên mình cho tới khi đổi tab/rời trang.
      refetch();
      refetchMyRank();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setOptInSaving(false);
    }
  };

  const myRowVisible = !!myRank && rows.some((row) => row.user_id === user?.id);
  // Gate on `!loading` — `rows` defaults to [] while the main list is still
  // fetching, which would otherwise flash the bar for a user who actually
  // IS in the top list, right before it disappears once rows arrive.
  const showMyRankBar = !loading && optIn && !!myRank && !myRowVisible && !scopeUnavailable;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <PageHeader icon={Trophy} title={t('leaderboard.title')} description={t('leaderboard.description')} />

      {!isTeacher && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-xs p-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-slate-100">{t('leaderboard.optInLabel')}</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{t('leaderboard.optInHint')}</p>
          </div>
          <button
            onClick={handleToggleOptIn}
            disabled={optInSaving}
            role="switch"
            aria-checked={optIn}
            className={`relative w-12 h-7 rounded-full transition-colors shrink-0 disabled:opacity-50 ${
              optIn ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-slate-600'
            }`}
          >
            <span
              className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                optIn ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Chip label={t('leaderboard.scopeClass')} active={scope === 'class'} onClick={() => setScope('class')} disabled={!profile?.class_name} />
        <Chip label={t('leaderboard.scopeSchool')} active={scope === 'school'} onClick={() => setScope('school')} disabled={!profile?.school} />
        <Chip label={t('leaderboard.scopeGlobal')} active={scope === 'global'} onClick={() => setScope('global')} />
        <span className="w-px h-4 bg-gray-200 dark:bg-slate-700 mx-1" />
        <Chip label={`🔥 ${t('leaderboard.metricStreak')}`} active={metric === 'streak'} onClick={() => setMetric('streak')} />
        <Chip label={`📝 ${t('leaderboard.metricAttempts')}`} active={metric === 'attempts'} onClick={() => setMetric('attempts')} />
      </div>

      {showMyRankBar && (
        <div className="flex items-center gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/60 px-5 py-3 text-sm dark:border-indigo-800 dark:bg-indigo-950/30">
          <span className="shrink-0 font-bold text-indigo-600 dark:text-indigo-400">
            #{myRank.rank}
          </span>
          <span className="flex-1 text-gray-600 dark:text-slate-300">
            {t('leaderboard.yourRankBar', {
              rank: myRank.rank,
              total: myRank.total_participants,
            })}
          </span>
          <span className="shrink-0 flex items-center gap-1.5 font-extrabold text-gray-900 dark:text-slate-100">
            {metric === 'streak' ? <Flame className="w-4 h-4 text-orange-500" /> : <BookOpen className="w-4 h-4 text-indigo-500" />}
            {metric === 'streak' ? myRank.current_streak : myRank.total_attempts}
          </span>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-gray-100 dark:border-slate-700 overflow-hidden">
        {scopeUnavailable ? (
          <EmptyState icon={Trophy} title={t('leaderboard.emptyTitle')} description={t('leaderboard.noClassAssigned')} />
        ) : loading ? (
          <Skeleton variant="table-row" count={5} />
        ) : error ? (
          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 px-5 py-6">
            <AlertCircle className="w-4 h-4 shrink-0" /> {getErrorMessage(error)}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState icon={Trophy} title={t('leaderboard.emptyTitle')} description={t('leaderboard.emptyDescription')} />
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-700">
            {rows.map((row) => {
              const isMe = row.user_id === user?.id;
              const value = metric === 'streak' ? row.current_streak : row.total_attempts;
              return (
                <div
                  key={row.user_id}
                  className={`flex items-center gap-4 px-5 py-3 ${isMe ? 'bg-indigo-50/60 dark:bg-indigo-950/30' : ''}`}
                >
                  <div className="w-8 text-center shrink-0 text-sm font-bold text-gray-400 dark:text-slate-500">
                    {row.rank <= 3 ? <span className="text-lg">{RANK_MEDALS[row.rank - 1]}</span> : row.rank}
                  </div>
                  <div className={`w-9 h-9 rounded-xl bg-linear-to-br ${getColor(row.full_name)} flex items-center justify-center text-xs font-extrabold text-white shrink-0`}>
                    {getInitials(row.full_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">
                      {row.full_name}
                      {isMe && <span className="text-indigo-500 font-normal"> ({t('leaderboard.youLabel')})</span>}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{row.class_name || row.school || ''}</p>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5 text-sm font-extrabold text-gray-900 dark:text-slate-100">
                    {metric === 'streak' ? <Flame className="w-4 h-4 text-orange-500" /> : <BookOpen className="w-4 h-4 text-indigo-500" />}
                    {value}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};
