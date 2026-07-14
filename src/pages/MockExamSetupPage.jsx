import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Monitor, PlayCircle, Loader2, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const VERSION_STYLES = {
  GS6: { from: 'from-primary-600', to: 'to-primary-400', ring: 'ring-primary-200', text: 'text-primary-700', bg: 'bg-primary-50', border: 'border-primary-200', activeBg: 'bg-linear-to-r from-primary-600 to-primary-500' },
  GS7: { from: 'from-violet-600', to: 'to-violet-400', ring: 'ring-violet-200', text: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200', activeBg: 'bg-linear-to-r from-violet-600 to-violet-500' },
  GS8: { from: 'from-accent-600', to: 'to-accent-400', ring: 'ring-accent-200', text: 'text-accent-700', bg: 'bg-accent-50', border: 'border-accent-200', activeBg: 'bg-linear-to-r from-accent-600 to-accent-500' },
};
const DEFAULT_STYLE = { from: 'from-gray-600', to: 'to-gray-400', ring: 'ring-gray-200', text: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200', activeBg: 'bg-linear-to-r from-gray-600 to-gray-500' };
const getStyle = (v) => VERSION_STYLES[v] || DEFAULT_STYLE;

const Skeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3].map(i => (
      <div key={i} className="h-24 rounded-2xl shimmer" />
    ))}
  </div>
);

export const MockExamSetupPage = () => {
  const { t } = useTranslation();
  const { user, isSelfRegistered } = useAuth();
  const navigate = useNavigate();
  const [allLevels, setAllLevels] = useState([]);
  const [availableVersions, setAvailableVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creatingMock, setCreatingMock] = useState(null);
  const [purchases, setPurchases] = useState({});
  const [purchasesLoaded, setPurchasesLoaded] = useState(false);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const { data, error } = await supabase
          .from('exam_levels')
          .select('*, exams (*)')
          .order('level_number');

        if (error) throw error;

        const sorted = data.map(level => ({
          ...level,
          exams: level.exams.sort((a, b) => {
            if (a.exam_type !== b.exam_type) return b.exam_type.localeCompare(a.exam_type);
            return a.exam_number - b.exam_number;
          }),
        }));

        setAllLevels(sorted);
        const versions = [...new Set(sorted.map(l => l.version))].sort();
        setAvailableVersions(versions);
        
        const saved = localStorage.getItem('ic3_preferred_version');
        if (saved && versions.includes(saved)) {
          setSelectedVersion(saved);
        } else if (versions.length > 0) {
          setSelectedVersion(versions[0]);
        }
      } catch (err) {
        console.error('Error fetching exams:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  const fetchPurchases = useCallback(async () => {
    try {
      const { data } = await supabase.functions.invoke('manage-purchase', {
        body: { action: 'list-mine' },
      });
      if (data?.purchases) {
        const map = {};
        data.purchases.forEach(p => { map[p.exam_id] = p; });
        setPurchases(map);
      }
    } catch { /* non-critical: setup page still renders without purchase status */ }
    finally { setPurchasesLoaded(true); }
  }, []);

  useEffect(() => {
    if (isSelfRegistered && user && !purchasesLoaded) fetchPurchases();
    if (!isSelfRegistered && user !== null) setPurchasesLoaded(true);
  }, [isSelfRegistered, user, purchasesLoaded, fetchPurchases]);

  const handleCreateMockExam = async (levelId) => {
    if (creatingMock) return;
    setCreatingMock(levelId);
    try {
      const { data: attemptId, error } = await supabase.rpc('create_mock_exam_attempt', {
        p_level_id: levelId,
        p_user_id: user.id
      });
      if (error) {
        if (error.message.includes('no_questions_found')) throw new Error(t('mockExamSetup.errors.noQuestions'));
        throw error;
      }
      if (attemptId) {
        navigate(`/mock-exam/${attemptId}`);
      }
    } catch (err) {
      console.error(err);
      alert(t('mockExamSetup.errors.createFailedPrefix') + err.message);
    } finally {
      setCreatingMock(null);
    }
  };

  const handleSelectVersion = useCallback((v) => {
    setSelectedVersion(v);
    localStorage.setItem('ic3_preferred_version', v);
  }, []);

  const filteredLevels = useMemo(
    () => selectedVersion ? allLevels.filter(l => l.version === selectedVersion) : [],
    [selectedVersion, allLevels]
  );
  
  const style = getStyle(selectedVersion);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-red-50/20 to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
      <div className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #450a0a 0%, #7f1d1d 60%, #991b1b 100%)' }}>
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-red-400/20 blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-48 h-48 rounded-full bg-orange-400/15 blur-[60px] pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-400/20 border border-red-400/25 mb-4">
                <PlayCircle className="w-3.5 h-3.5 text-red-300" />
                <span className="text-red-300 text-xs font-semibold tracking-wide uppercase">{t('mockExamSetup.badge')}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                {t('mockExamSetup.title')}
              </h1>
              <p className="mt-2 text-red-100/70 text-sm max-w-lg leading-relaxed">
                {t('mockExamSetup.subtitle')}
              </p>
            </div>
          </div>

          {/* ── Version selector ── */}
          <div className="mt-8">
            <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3">{t('mockExamSetup.chooseVersion')}</p>
            <div className="flex flex-wrap gap-3">
              {availableVersions.map(v => {
                const active = selectedVersion === v;
                return (
                  <button
                    key={v}
                    onClick={() => handleSelectVersion(v)}
                    className={`relative flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200
                      ${active
                        ? `bg-white/20 text-white shadow-xl scale-[1.03] border-white/30`
                        : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10 hover:scale-[1.02]'
                      } border`}
                  >
                    <Monitor className={`w-4 h-4 ${active ? 'text-white' : 'text-white/60'}`} />
                    <div className="text-left">
                      <div className="leading-none">{v}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading || (!purchasesLoaded) ? (
          <Skeleton />
        ) : (
          <div className="space-y-4">
            {filteredLevels.length === 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center border border-slate-100 dark:border-slate-700 shadow-xs">
                <p className="text-slate-500 dark:text-slate-400">{t('mockExamSetup.noExamsForVersion')}</p>
              </div>
            )}
            {filteredLevels.map((level, idx) => {
              let isFullyPaid = !isSelfRegistered;
              if (isSelfRegistered) {
                const totalExams = level.exams.length;
                let paidCount = 0;
                level.exams.forEach(e => {
                  if (purchases[e.id]?.status === 'SUCCESS') paidCount++;
                });
                isFullyPaid = (totalExams > 0 && paidCount >= totalExams);
              }

              const isGmetrixMissing = level.exams.filter(e => e.exam_type === 'gmetrix').length === 0;

              return (
              <div
                key={level.id}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs overflow-hidden hover:shadow-md transition-shadow"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl bg-linear-to-br ${style.from} ${style.to} flex items-center justify-center text-white font-black text-xl shrink-0 shadow-md`}>
                      {level.level_number}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                          {level.version} — {level.label}
                        </h2>
                        {!isFullyPaid && (
                          <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wide dark:bg-amber-950/40 dark:text-amber-300">{t('mockExamSetup.trialBadge')}</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {isFullyPaid ? t('mockExamSetup.questionsFull') : t('mockExamSetup.questionsTrial')} {t('mockExamSetup.examMeta')}
                      </p>
                      {!isFullyPaid && !isGmetrixMissing && (
                        <div className="mt-2 text-xs font-medium text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100 dark:text-amber-300 dark:bg-amber-950/40 dark:border-amber-800/60 flex items-start sm:items-center gap-1.5 max-w-sm">
                          <Lock className="w-3.5 h-3.5 mt-0.5 sm:mt-0 shrink-0" />
                          <span>{t('mockExamSetup.paymentRequired')}</span>
                        </div>
                      )}
                      {isGmetrixMissing && (
                        <div className="mt-2 text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 dark:text-slate-400 dark:bg-slate-700/50 dark:border-slate-600">
                          {t('mockExamSetup.gmetrixMissing')}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleCreateMockExam(level.id)}
                    disabled={creatingMock === level.id || isGmetrixMissing}
                    className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-white font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 ${!isGmetrixMissing && 'hover:-translate-y-0.5'}`}
                    style={isGmetrixMissing ? { background: '#9CA3AF' } : { background: 'linear-gradient(135deg, #F59E0B, #EF4444)' }}
                  >
                    {creatingMock === level.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlayCircle className="w-5 h-5" />}
                    {creatingMock === level.id ? t('mockExamSetup.creating') : isGmetrixMissing ? t('mockExamSetup.gmetrixMissingButton') : t('mockExamSetup.startButton')}
                  </button>
                </div>
              </div>
            )})}
          </div>
        )}
      </div>
    </div>
  );
};
