import { useEffect, useState, useCallback } from "react";
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import {
  CreditCard, Save, Building2, Hash, User,
  CheckCircle, AlertTriangle, Loader2, ExternalLink,
  DollarSign, ChevronDown, Info, X,
} from 'lucide-react';
import { EmptyState } from '../components/shared/EmptyState';

// Vietnamese banks for VietQR
const BANKS = [
  { id: 'MB',      name: 'MB Bank (Quân đội)' },
  { id: 'VCB',     name: 'Vietcombank' },
  { id: 'TCB',     name: 'Techcombank' },
  { id: 'ACB',     name: 'ACB' },
  { id: 'VPB',     name: 'VPBank' },
  { id: 'BIDV',    name: 'BIDV' },
  { id: 'VTB',     name: 'Vietinbank' },
  { id: 'TPB',     name: 'TPBank' },
  { id: 'STB',     name: 'Sacombank' },
  { id: 'HDB',     name: 'HDBank' },
  { id: 'MSB',     name: 'MSB' },
  { id: 'OCB',     name: 'OCB' },
  { id: 'SHB',     name: 'SHB' },
  { id: 'SEAB',    name: 'SeABank' },
  { id: 'CAKE',    name: 'CAKE (VPB Digital)' },
];

const formatVND = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n ?? 0);

/* ── VietQR preview ── */
const QRPreview = ({ bankId, accountNo, accountName, amount }) => {
  const { t } = useTranslation();
  if (!bankId || !accountNo || !accountName) return null;
  const url = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${amount || 0}&addInfo=IC3Fighter&accountName=${encodeURIComponent(accountName)}`;
  return (
    <div className="flex flex-col items-center">
      <div className="bg-white p-3 rounded-2xl border-2 border-gray-100 dark:border-slate-700 shadow-xs">
        <img src={url} alt={t('paymentSettings.qrPreview.alt')} className="w-48 h-48 object-contain rounded-xl"
          onError={e => { e.currentTarget.style.display = 'none'; }} />
      </div>
      <p className="text-xs text-gray-400 dark:text-slate-500 mt-2 text-center">{t('paymentSettings.qrPreview.caption', { bankId, accountNo })}</p>
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════ */
export const PaymentSettingsPage = () => {
  const { t } = useTranslation();
  const { isTeacher } = useAuth();

  // ── Global config state ──
  const [bankId,       setBankId]       = useState('MB');
  const [accountNo,    setAccountNo]    = useState('');
  const [accountName,  setAccountName]  = useState('');
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [savedGlobal,  setSavedGlobal]  = useState(false);
  const [globalError,  setGlobalError]  = useState('');
  const [showQR,       setShowQR]       = useState(false);

  // ── Per-exam amount state ──
  const [exams,        setExams]        = useState([]);
  const [levels,       setLevels]       = useState([]); // [{id, version, label}]
  const [amounts,      setAmounts]      = useState({}); // examId -> string
  const [savingExam,   setSavingExam]   = useState({}); // examId -> bool
  const [savedExam,    setSavedExam]    = useState({}); // examId -> bool
  const [examError,    setExamError]    = useState({}); // examId -> string
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [openVersions, setOpenVersions] = useState(new Set()); // open version strings
  const [openLevels,   setOpenLevels]   = useState(new Set());  // open level ids

  // ── Load data ──
  const load = useCallback(async () => {
    setLoading(true);
    const [cfgRes, examsRes, levelsRes] = await Promise.all([
      supabase.from('payment_config').select('*').eq('id', 1).single(),
      supabase.from('exams')
        .select('id, title, required_amount, exam_type, exam_number, level_id, exam_levels(id, version, label, level_number)')
        .order('exam_number'),
      supabase.from('exam_levels')
        .select('id, version, label, level_number')
        .order('level_number'),
    ]);

    if (cfgRes.data) {
      setBankId(cfgRes.data.bank_id || 'MB');
      setAccountNo(cfgRes.data.account_no || '');
      setAccountName(cfgRes.data.account_name || '');
    }

    const examList = examsRes.data || [];
    setExams(examList);
    const lvList = levelsRes.data || [];
    setLevels(lvList);

    // Auto-open all versions and levels on first load
    const vs = new Set(lvList.map(l => l.version));
    const ls = new Set(lvList.map(l => l.id));
    setOpenVersions(vs);
    setOpenLevels(ls);

    const initAmounts = {};
    for (const e of examList) initAmounts[e.id] = String(e.required_amount ?? 100000);
    setAmounts(initAmounts);

    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Save global config ──
  const saveGlobal = async () => {
    if (!accountNo.trim()) { setGlobalError(t('paymentSettings.errors.enterAccountNo')); return; }
    if (!accountName.trim()) { setGlobalError(t('paymentSettings.errors.enterAccountName')); return; }
    setSavingGlobal(true); setGlobalError('');
    try {
      const { error } = await supabase
        .from('payment_config')
        .upsert({
          id: 1,
          bank_id:      bankId,
          account_no:   accountNo.trim(),
          account_name: accountName.trim().toUpperCase(),
          updated_at:   new Date().toISOString(),
        });
      if (error) throw error;
      setSavedGlobal(true);
      setTimeout(() => setSavedGlobal(false), 2500);
    } catch (e) {
      setGlobalError(e instanceof Error ? e.message : t('paymentSettings.errors.saveConfigFailed'));
    } finally {
      setSavingGlobal(false);
    }
  };

  // ── Save single exam amount ──
  const saveAmount = async (examId) => {
    const val = parseInt(amounts[examId] || '0', 10);
    if (!val || val < 1000) {
      setExamError(prev => ({ ...prev, [examId]: t('paymentSettings.errors.minAmount') }));
      return;
    }
    setSavingExam(prev => ({ ...prev, [examId]: true }));
    setExamError(prev => ({ ...prev, [examId]: '' }));
    try {
      const { error } = await supabase
        .from('exams')
        .update({ required_amount: val })
        .eq('id', examId);
      if (error) throw error;
      setSavedExam(prev => ({ ...prev, [examId]: true }));
      setTimeout(() => setSavedExam(prev => ({ ...prev, [examId]: false })), 2000);
    } catch (e) {
      setExamError(prev => ({ ...prev, [examId]: e instanceof Error ? e.message : t('paymentSettings.errors.generic') }));
    } finally {
      setSavingExam(prev => ({ ...prev, [examId]: false }));
    }
  };

  if (!isTeacher) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-slate-900">
        <p className="text-gray-400 dark:text-slate-500 font-semibold">{t('paymentSettings.accessDenied')}</p>
      </div>
    );
  }

  const isGlobalConfigured = accountNo && accountName;




  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-violet-50/20 to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">

      {/* ── Header ── */}
      <div className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4c1d95 100%)' }}>
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-violet-400/20 blur-[80px] pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white">{t('paymentSettings.header.title')}</h1>
              <p className="text-white/50 text-sm">{t('paymentSettings.header.subtitle')}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-5 flex-wrap">
            <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-semibold ${
              isGlobalConfigured
                ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-200'
                : 'bg-amber-500/20 border-amber-400/30 text-amber-200'
            }`}>
              {isGlobalConfigured
                ? <><CheckCircle className="w-4 h-4" /> {t('paymentSettings.header.configured')}</>
                : <><AlertTriangle className="w-4 h-4" /> {t('paymentSettings.header.notConfigured')}</>
              }
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ─────────────────────────────────────────────
            SECTION 1: Global bank info
        ───────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-slate-100">{t('paymentSettings.section1.title')}</h2>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{t('paymentSettings.section1.desc')}</p>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Form */}
              <div className="space-y-4">

                {/* Info banner */}
                <div className="flex items-start gap-2.5 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700 dark:bg-blue-950/40 dark:border-blue-800/60 dark:text-blue-300">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{t('paymentSettings.section1.infoBannerPrefix')} <strong>{t('paymentSettings.section1.infoBannerStrong')}</strong>{t('paymentSettings.section1.infoBannerSuffix')}</span>
                </div>

                {/* Bank */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                    <Building2 className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" /> {t('paymentSettings.section1.bankLabel')}
                  </label>
                  <div className="relative">
                    <select
                      value={bankId}
                      onChange={e => setBankId(e.target.value)}
                      className="w-full appearance-none px-4 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-violet-400 transition bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100"
                    >
                      {BANKS.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500 pointer-events-none" />
                  </div>
                </div>

                {/* Account No */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                    <Hash className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" /> {t('paymentSettings.section1.accountNoLabel')}
                  </label>
                  <input
                    type="text"
                    value={accountNo}
                    onChange={e => setAccountNo(e.target.value.replace(/\D/g, ''))}
                    placeholder={t('paymentSettings.section1.accountNoPlaceholder')}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono tracking-widest focus:outline-hidden focus:ring-2 focus:ring-violet-400 transition dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-500"
                  />
                </div>

                {/* Account Name */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                    <User className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" /> {t('paymentSettings.section1.accountNameLabel')}
                  </label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={e => setAccountName(e.target.value.toUpperCase())}
                    placeholder={t('paymentSettings.section1.accountNamePlaceholder')}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm uppercase font-medium tracking-wide focus:outline-hidden focus:ring-2 focus:ring-violet-400 transition dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-500"
                  />
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{t('paymentSettings.section1.accountNameHint')}</p>
                </div>

                {globalError && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 dark:bg-red-950/40 dark:border-red-800/60 dark:text-red-300">
                    <AlertTriangle className="w-4 h-4 shrink-0" /> {globalError}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={saveGlobal}
                    disabled={savingGlobal}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold
                      hover:bg-violet-700 transition disabled:opacity-50 shadow-xs shadow-violet-200"
                  >
                    {savingGlobal ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> {t('paymentSettings.section1.saving')}</>
                    ) : savedGlobal ? (
                      <><CheckCircle className="w-4 h-4 text-emerald-300" /> {t('paymentSettings.section1.saved')}</>
                    ) : (
                      <><Save className="w-4 h-4" /> {t('paymentSettings.section1.save')}</>
                    )}
                  </button>
                  <button
                    onClick={() => setShowQR(!showQR)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:border-violet-300 hover:text-violet-700 dark:border-slate-600 dark:text-slate-300 dark:hover:border-violet-500 dark:hover:text-violet-400 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {showQR ? t('paymentSettings.section1.hideQR') : t('paymentSettings.section1.showQR')}
                  </button>
                </div>
              </div>

              {/* QR preview */}
              <div className="flex items-center justify-center bg-linear-to-br from-violet-50 to-indigo-50 dark:from-slate-700/50 dark:to-slate-700/30 rounded-2xl p-6 border border-violet-100 dark:border-slate-700 min-h-[220px]">
                {showQR && accountNo && accountName ? (
                  <QRPreview bankId={bankId} accountNo={accountNo} accountName={accountName} amount={100000} />
                ) : (
                  <div className="text-center text-gray-400">
                    <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center mx-auto mb-3">
                      <CreditCard className="w-8 h-8 text-violet-300 dark:text-violet-500" />
                    </div>
                    <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">{t('paymentSettings.section1.qrPreviewTitle')}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{t('paymentSettings.section1.qrPreviewHintLine1')}<br />{t('paymentSettings.section1.qrPreviewHintLine2')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────
            SECTION 2: Per-exam amounts — grouped by level
        ───────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-gray-100 dark:border-slate-700 overflow-hidden">

          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-slate-100">{t('paymentSettings.section2.title')}</h2>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{t('paymentSettings.section2.descPrefix')} <strong>{t('paymentSettings.section2.descStrong')}</strong> {t('paymentSettings.section2.descSuffix')}</p>
              </div>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 w-56 dark:bg-slate-700/50 dark:border-slate-600">
              <svg className="w-4 h-4 text-gray-400 dark:text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text" value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('paymentSettings.section2.searchPlaceholder')}
                className="bg-transparent outline-hidden text-sm text-gray-700 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 flex-1"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 dark:text-slate-500">
              <Loader2 className="w-7 h-7 animate-spin mr-2 text-emerald-400" />
              <span className="text-sm">{t('paymentSettings.section2.loading')}</span>
            </div>
          ) : (() => {
            // Group levels by version
            const versions = [...new Set(levels.map(l => l.version))].sort();
            const q = search.toLowerCase();

            return (
              <div>
                {versions.map(version => {
                  const vLevels = levels.filter(l => l.version === version);

                  // Count exams in this version (for search filtering)
                  const vExamCount = vLevels.reduce((sum, lv) => {
                    return sum + exams.filter(e =>
                      e.level_id === lv.id && (!q || e.title.toLowerCase().includes(q))
                    ).length;
                  }, 0);
                  if (vExamCount === 0 && q) return null;

                  const isVersionOpen = openVersions.has(version);
                  const totalPending = vLevels.reduce((sum, lv) =>
                    sum + exams.filter(e =>
                      e.level_id === lv.id &&
                      parseInt(amounts[e.id] || '0', 10) !== (e.required_amount ?? 100000)
                    ).length, 0);

                  const versionStyle = {
                    GS6:         { bg: 'bg-blue-600',   bgSoft: 'bg-blue-600/15',   light: 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800/50',   badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300' },
                    GS7:         { bg: 'bg-violet-600', bgSoft: 'bg-violet-600/15', light: 'bg-violet-50 border-violet-200 dark:bg-violet-950/30 dark:border-violet-800/50', badge: 'bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300' },
                    GS8:         { bg: 'bg-teal-600',   bgSoft: 'bg-teal-600/15',   light: 'bg-teal-50 border-teal-200 dark:bg-teal-950/30 dark:border-teal-800/50',   badge: 'bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300' },
                    'IC3 GS6-SPARK': { bg: 'bg-orange-500', bgSoft: 'bg-orange-500/15', light: 'bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800/50', badge: 'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300' },
                  }[version] || { bg: 'bg-gray-600', bgSoft: 'bg-gray-600/15', light: 'bg-gray-50 border-gray-200 dark:bg-slate-700/40 dark:border-slate-600', badge: 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300' };

                  const vTotalExams = vLevels.reduce((sum, lv) =>
                    sum + exams.filter(e => e.level_id === lv.id).length, 0);

                  return (
                    <div key={version} className="border-b border-gray-100 dark:border-slate-700 last:border-b-0">

                      {/* ══ VERSION HEADER ══ */}
                      <button
                        className={`w-full flex items-center justify-between px-6 py-4 text-left transition-colors ${
                          isVersionOpen ? 'bg-gray-50 dark:bg-slate-700/40' : 'hover:bg-gray-50/60 dark:hover:bg-slate-700/30'
                        }`}
                        onClick={() => {
                          const next = new Set(openVersions);
                          next.has(version) ? next.delete(version) : next.add(version);
                          setOpenVersions(next);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          {/* Color pill */}
                          <div className={`${versionStyle.bg} text-white text-sm font-extrabold px-4 py-1.5 rounded-xl tracking-wide shadow-xs`}>
                            {version}
                          </div>
                          <div>
                            <span className="text-sm font-bold text-gray-800 dark:text-slate-200">
                              {t('paymentSettings.section2.versionSummary', { levels: vLevels.length, exams: vTotalExams })}
                            </span>
                          </div>
                          {totalPending > 0 && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-100 border border-amber-200 px-2.5 py-0.5 rounded-full dark:text-amber-300 dark:bg-amber-950/40 dark:border-amber-800/60">
                              ● {t('paymentSettings.section2.unsavedVersion', { count: totalPending })}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 dark:text-slate-500 hidden sm:block">
                            {isVersionOpen ? t('paymentSettings.section2.collapse') : t('paymentSettings.section2.expand')}
                          </span>
                          <ChevronDown className={`w-4 h-4 text-gray-400 dark:text-slate-500 transition-transform duration-200 ${isVersionOpen ? 'rotate-180' : ''}`} />
                        </div>
                      </button>

                      {/* ══ LEVELS inside this version ══ */}
                      {isVersionOpen && (
                        <div className="border-t border-gray-100 dark:border-slate-700">
                          {vLevels.map((lv, lvIdx) => {
                            const lvExams = exams.filter(e =>
                              e.level_id === lv.id &&
                              (!q || e.title.toLowerCase().includes(q))
                            ).sort((a, b) => {
                              if (a.exam_type !== b.exam_type) return b.exam_type.localeCompare(a.exam_type);
                              return a.exam_number - b.exam_number;
                            });
                            if (lvExams.length === 0 && q) return null;

                            const isLvOpen = openLevels.has(lv.id) || !!q;
                            const lvPending = lvExams.filter(e =>
                              parseInt(amounts[e.id] || '0', 10) !== (e.required_amount ?? 100000)
                            ).length;

                            return (
                              <div key={lv.id} className={`${lvIdx > 0 ? 'border-t border-gray-100 dark:border-slate-700' : ''}`}>

                                {/* ── Level sub-header ── */}
                                <button
                                  className="w-full flex items-center justify-between pl-12 pr-6 py-3 text-left hover:bg-gray-50/80 dark:hover:bg-slate-700/30 transition-colors"
                                  onClick={() => {
                                    const next = new Set(openLevels);
                                    next.has(lv.id) ? next.delete(lv.id) : next.add(lv.id);
                                    setOpenLevels(next);
                                  }}
                                >
                                  <div className="flex items-center gap-3">
                                    {/* Level number bubble */}
                                    <div className={`w-6 h-6 rounded-full ${versionStyle.bgSoft} flex items-center justify-center shrink-0`}>
                                      <span className="text-[10px] font-bold text-gray-600 dark:text-slate-300">{lv.level_number || lvIdx + 1}</span>
                                    </div>
                                    <div>
                                      <span className="text-sm font-semibold text-gray-800 dark:text-slate-200">{lv.label}</span>
                                      <span className="ml-2 text-xs text-gray-400 dark:text-slate-500">{t('paymentSettings.section2.examCountShort', { count: lvExams.length })}</span>
                                    </div>
                                    {lvPending > 0 && (
                                      <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 dark:text-amber-300 dark:bg-amber-950/40 dark:border-amber-800/60">
                                        {t('paymentSettings.section2.unsavedLevel', { count: lvPending })}
                                      </span>
                                    )}
                                  </div>
                                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 dark:text-slate-500 transition-transform duration-200 ${isLvOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {/* ── Exam rows ── */}
                                {isLvOpen && (
                                  <div className="bg-white dark:bg-slate-800 border-t border-gray-50 dark:border-slate-700">
                                    {/* Column labels */}
                                    <div className="grid grid-cols-[auto_1fr_140px_180px_90px] items-center gap-3 pl-16 pr-6 py-2 bg-gray-50/60 dark:bg-slate-700/30">
                                      <span />
                                      <span className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">{t('paymentSettings.section2.columnExam')}</span>
                                      <span className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">{t('paymentSettings.section2.columnType')}</span>
                                      <span className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">{t('paymentSettings.section2.columnAmount')}</span>
                                      <span />
                                    </div>

                                    {lvExams.map(exam => {
                                      const dirty = parseInt(amounts[exam.id] || '0', 10) !== (exam.required_amount ?? 100000);
                                      const isTest = exam.exam_type === 'testing';
                                      return (
                                        <div
                                          key={exam.id}
                                          className={`grid grid-cols-[auto_1fr_140px_180px_90px] items-center gap-3 pl-16 pr-6 py-3 border-t border-gray-50 dark:border-slate-700 transition-colors ${
                                            dirty ? 'bg-amber-50/40 dark:bg-amber-950/20' : 'hover:bg-gray-50/40 dark:hover:bg-slate-700/30'
                                          }`}
                                        >
                                          {/* Dot indicator */}
                                          <span className={`w-2 h-2 rounded-full shrink-0 ${isTest ? 'bg-blue-400' : 'bg-purple-400'}`} />

                                          {/* Name */}
                                          <div>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                                              {isTest ? 'Testing' : 'Gmetrix'} {exam.exam_number}
                                            </p>
                                            {dirty && <p className="text-[11px] text-amber-500 dark:text-amber-400 font-medium mt-0.5">{t('paymentSettings.section2.rowUnsaved')}</p>}
                                          </div>

                                          {/* Type badge */}
                                          <div>
                                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg inline-block ${
                                              isTest ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' : 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
                                            }`}>
                                              {isTest ? '📝 Testing' : '🎯 Gmetrix'}
                                            </span>
                                          </div>

                                          {/* Amount input */}
                                          <div>
                                            <input
                                              type="number"
                                              min="1000"
                                              step="1000"
                                              value={amounts[exam.id] ?? '100000'}
                                              onChange={e => setAmounts(prev => ({ ...prev, [exam.id]: e.target.value }))}
                                              className={`w-full px-3 py-2 border rounded-xl text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-400 transition ${
                                                dirty
                                                  ? 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200'
                                                  : 'border-gray-200 bg-white text-gray-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200'
                                              }`}
                                            />
                                            <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5 pl-0.5">
                                              {formatVND(parseInt(amounts[exam.id] || '0', 10) || 0)}
                                            </p>
                                            {examError[exam.id] && (
                                              <p className="text-[11px] text-red-500 dark:text-red-400 mt-0.5">{examError[exam.id]}</p>
                                            )}
                                          </div>

                                          {/* Save button */}
                                          <div className="flex justify-end">
                                            {savedExam[exam.id] ? (
                                              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1.5 rounded-xl dark:text-emerald-400 dark:bg-emerald-950/40">
                                                <CheckCircle className="w-3.5 h-3.5" /> {t('paymentSettings.section2.saved')}
                                              </span>
                                            ) : (
                                              <button
                                                onClick={() => saveAmount(exam.id)}
                                                disabled={savingExam[exam.id] || !dirty}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                                                  dirty
                                                    ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-xs shadow-emerald-200'
                                                    : 'bg-gray-100 text-gray-300 cursor-not-allowed dark:bg-slate-700 dark:text-slate-600'
                                                }`}
                                              >
                                                {savingExam[exam.id] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                                {savingExam[exam.id] ? t('paymentSettings.section2.saving') : t('paymentSettings.section2.save')}
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}

                                    {lvExams.length === 0 && (
                                      <p className="pl-16 pr-6 py-4 text-sm text-gray-400 dark:text-slate-500 border-t border-gray-50 dark:border-slate-700">
                                        {t('paymentSettings.section2.noExamsInLevel')}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                {exams.length === 0 && (
                  <EmptyState icon={DollarSign} title={t('paymentSettings.section2.noExamsAtAll')} />
                )}
              </div>
            );
          })()}

          <div className="px-6 py-3 border-t border-gray-100 dark:border-slate-700 text-xs text-gray-400 dark:text-slate-500 flex items-center justify-between">
            <span>{t('paymentSettings.section2.examCount', { exams: exams.length, levels: levels.length })}</span>
            <span>{t('paymentSettings.section2.toggleHint')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
