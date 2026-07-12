import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import {
  ChevronLeft, FileSpreadsheet, Download, Upload, AlertCircle,
  CheckCircle2, Loader2, X, ArrowRight,
} from 'lucide-react';
import { stripHtml } from '../utils/text';
import {
  parseCsvText, parseWorkbookFile, validateRows, commitQuestions, buildTemplateWorkbook,
} from '../utils/questionImport';

export const QuestionImportPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const CSV_TYPES = [
    { value: 'choice_multi', label: t('questionImport.csvTypes.choiceMulti') },
    { value: 'dragdrop', label: t('questionImport.csvTypes.dragdrop') },
    { value: 'truefalse', label: t('questionImport.csvTypes.truefalse') },
  ];

  const STEPS = [t('questionImport.steps.upload'), t('questionImport.steps.preview'), t('questionImport.steps.results')];

  const [levels, setLevels] = useState([]);
  const [exams, setExams] = useState([]);
  const [loadingRefs, setLoadingRefs] = useState(true);

  const [step, setStep] = useState(0);
  const [fileName, setFileName] = useState('');
  const [csvType, setCsvType] = useState('choice_multi');
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState('');

  const [questions, setQuestions] = useState([]);
  const [errors, setErrors] = useState([]);

  const [committing, setCommitting] = useState(false);
  const [results, setResults] = useState(null);

  useEffect(() => {
    Promise.all([
      supabase.from('exam_levels').select('*').order('version').order('level_number'),
      supabase.from('exams').select('*').order('exam_type').order('exam_number'),
    ]).then(([{ data: lvls }, { data: exs }]) => {
      setLevels(lvls || []);
      setExams(exs || []);
      setLoadingRefs(false);
    });
  }, []);

  const resetAll = () => {
    setStep(0); setFileName(''); setParseError(''); setQuestions([]); setErrors([]); setResults(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownloadTemplate = async () => {
    const wb = await buildTemplateWorkbook();
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = t('questionImport.templateFileName');
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = async (file) => {
    if (!file) return;
    setFileName(file.name);
    setParseError('');
    setParsing(true);
    try {
      const refs = { levels, exams };
      let sheets;
      if (file.name.toLowerCase().endsWith('.csv')) {
        const text = await file.text();
        sheets = { [csvType]: parseCsvText(text) };
      } else {
        const buffer = await file.arrayBuffer();
        sheets = await parseWorkbookFile(buffer);
      }
      const { questions: qs, errors: errs } = validateRows(sheets, refs);
      setQuestions(qs);
      setErrors(errs);
      setStep(1);
    } catch (err) {
      setParseError(err.message || t('questionImport.fileReadError'));
    } finally {
      setParsing(false);
    }
  };

  const handleCommit = async () => {
    setCommitting(true);
    try {
      const res = await commitQuestions(supabase, questions);
      setResults(res);
      setStep(2);
    } finally {
      setCommitting(false);
    }
  };

  const examLabel = (examId) => {
    const exam = exams.find(e => e.id === examId);
    if (!exam) return '—';
    const level = levels.find(l => l.id === exam.level_id);
    return `${level?.version} · ${level?.label} · ${exam.exam_type === 'testing' ? t('questionImport.examTypeTesting') : t('questionImport.examTypeGmetrix')} ${exam.exam_number}`;
  };

  const successCount = results?.filter(r => r.ok).length ?? 0;
  const failCount = results?.filter(r => !r.ok).length ?? 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-screen-lg mx-auto flex items-center gap-3 px-4 sm:px-6 py-3">
          <button onClick={() => navigate('/questions')} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-100 transition-colors text-sm font-medium">
            <ChevronLeft className="w-4 h-4" /> {t('questionImport.backToQuestions')}
          </button>
          <div className="w-px h-5 bg-gray-200 dark:bg-slate-700" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
            </div>
            <h1 className="text-sm font-bold text-gray-900 dark:text-slate-100">{t('questionImport.title')}</h1>
          </div>
        </div>
      </div>

      <div className="max-w-screen-lg mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {STEPS.map((label, i) => (
            <React.Fragment key={label}>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold ${
                i === step ? 'bg-indigo-600 text-white' : i < step ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-gray-100 text-gray-400 dark:bg-slate-700 dark:text-slate-500'
              }`}>
                {i < step ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span>{i + 1}</span>}
                {label}
              </div>
              {i < STEPS.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-gray-300 dark:text-slate-600" />}
            </React.Fragment>
          ))}
        </div>

        {/* Step 0: Upload */}
        {step === 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6 space-y-5">
            <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-xs text-indigo-800 leading-relaxed dark:bg-indigo-950/30 dark:border-indigo-800/50 dark:text-indigo-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                {t('questionImport.supportedTypesIntro')} <b>{t('questionImport.csvTypes.choiceMulti')}</b>, <b>{t('questionImport.csvTypes.dragdrop')}</b>, <b>{t('questionImport.csvTypes.truefalse')}</b>.
                {' '}{t('questionImport.unsupportedIntro')} <b>{t('questionImport.hotspotTypeLabel')}</b> {t('questionImport.unsupportedNote')}
              </div>
            </div>

            <div>
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-indigo-200 text-indigo-700 text-sm font-bold hover:bg-indigo-50 dark:border-indigo-800/60 dark:text-indigo-300 dark:hover:bg-indigo-950/30 transition-all"
              >
                <Download className="w-4 h-4" /> {t('questionImport.downloadTemplate')}
              </button>
            </div>

            {loadingRefs ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              </div>
            ) : (
              <>
                <div
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); }}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 hover:border-indigo-300 dark:border-slate-600 dark:hover:border-indigo-500 rounded-2xl py-10 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Upload className="w-8 h-8 text-gray-300 dark:text-slate-600" />
                  <p className="text-sm font-semibold text-gray-600 dark:text-slate-300">{t('questionImport.dropzoneHint')}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500">{t('questionImport.dropzoneFormats')}</p>
                  <input
                    ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
                    onChange={e => handleFile(e.target.files?.[0])}
                  />
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
                  <span>{t('questionImport.csvTypeHint')}</span>
                  <select
                    value={csvType} onChange={e => setCsvType(e.target.value)}
                    className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200"
                  >
                    {CSV_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>

                {parsing && (
                  <div className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400">
                    <Loader2 className="w-4 h-4 animate-spin" /> {t('questionImport.readingFile', { fileName })}
                  </div>
                )}
                {parseError && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 dark:text-red-400 dark:bg-red-950/40 dark:border-red-800/60">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> {parseError}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Step 1: Preview & Validate */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex gap-3 text-sm">
                <span className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" /> {t('questionImport.validCount', { count: questions.length })}
                </span>
                {errors.length > 0 && (
                  <span className="flex items-center gap-1.5 font-semibold text-red-600 dark:text-red-400">
                    <AlertCircle className="w-4 h-4" /> {t('questionImport.errorRowCount', { count: errors.length })}
                  </span>
                )}
              </div>
              <button onClick={resetAll} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 font-semibold">
                <X className="w-3.5 h-3.5" /> {t('questionImport.chooseAnotherFile')}
              </button>
            </div>

            {errors.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-red-100 dark:border-red-900/50 shadow-sm overflow-hidden">
                <div className="px-4 py-2.5 bg-red-50 border-b border-red-100 text-xs font-bold text-red-700 uppercase tracking-wide dark:bg-red-950/40 dark:border-red-900/50 dark:text-red-300">
                  {t('questionImport.errorRowsHeader')}
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-gray-50 dark:divide-slate-700">
                  {errors.map((e, i) => (
                    <div key={i} className="px-4 py-2 text-xs flex items-start gap-2">
                      <span className="flex-shrink-0 px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-mono dark:bg-slate-700 dark:text-slate-400">{e.sheet}:{e.row}</span>
                      <span className="text-red-600 dark:text-red-400">{e.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {questions.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="px-4 py-2.5 bg-emerald-50 border-b border-emerald-100 text-xs font-bold text-emerald-700 uppercase tracking-wide dark:bg-emerald-950/40 dark:border-emerald-900/50 dark:text-emerald-300">
                  {t('questionImport.questionsToAdd')}
                </div>
                <div className="max-h-96 overflow-y-auto divide-y divide-gray-50 dark:divide-slate-700">
                  {questions.map((q, i) => (
                    <div key={i} className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[11px] font-bold dark:bg-indigo-950/40 dark:text-indigo-300">
                          {q.question_type === 'choice' ? t('questionImport.qTypeChoice') : q.question_type === 'multi' ? t('questionImport.qTypeMulti') : q.question_type === 'dragdrop' ? t('questionImport.qTypeDragdrop') : t('questionImport.qTypeTruefalse')}
                        </span>
                        <span className="text-[11px] text-gray-400 dark:text-slate-500">{examLabel(q.examId)}</span>
                      </div>
                      <p className="text-gray-700 dark:text-slate-300 truncate">{stripHtml(q.content)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleCommit}
                disabled={committing || questions.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}
              >
                {committing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {t('questionImport.confirmAdd', { count: questions.length })}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Results */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{t('questionImport.importDone')}</p>
                <p className="text-sm text-gray-500">
                  {t('questionImport.successCount', { count: successCount })}{failCount > 0 ? `, ${t('questionImport.failCount', { count: failCount })}` : ''}
                </p>
              </div>
            </div>

            {failCount > 0 && (
              <div className="divide-y divide-gray-50 border border-red-100 rounded-xl overflow-hidden">
                {results.filter(r => !r.ok).map((r, i) => (
                  <div key={i} className="px-4 py-2 text-xs">
                    <p className="text-gray-600 truncate">{stripHtml(r.question.content)}</p>
                    <p className="text-red-500">{r.message}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={resetAll} className="px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 text-sm font-bold hover:bg-gray-50">
                {t('questionImport.importAnotherFile')}
              </button>
              <button
                onClick={() => navigate('/questions')}
                className="px-4 py-2.5 rounded-xl text-white text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
              >
                {t('questionImport.backToQuestionsShort')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
