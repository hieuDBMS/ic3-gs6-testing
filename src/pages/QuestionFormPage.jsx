import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import {
  ChevronLeft, Save, Loader2, Plus, Trash2, ArrowLeftRight,
  BookOpen, LayoutList, Type, CheckSquare, AlertCircle, CheckCircle2,
} from 'lucide-react';
import { ImageUploader } from '../components/questions/ImageUploader';
import { AnswerEditor } from '../components/questions/AnswerEditor';
import { HotspotEditor } from '../components/questions/HotspotEditor';
import { RichTextEditor } from '../components/questions/RichTextEditor';
import { stripHtml } from '../utils/text';
import { useExamStructure } from '../hooks/useExamStructure';
import { Toast, useToast } from '../components/shared/Toast';

/* ─── Defaults ─── */
const uid = () => crypto.randomUUID();
const DEF_ANSWER    = (o = 0) => ({ id: uid(), content: '', image_url: null, is_correct: false, order_index: o });
const DEF_PAIR      = (o = 0) => ({ id: uid(), drag_content: '', drag_image_url: null, drop_content: '', drop_image_url: null, order_index: o });
const DEF_STMT      = (o = 0) => ({ id: uid(), content: '', is_true: true, order_index: o });
const INIT_FORM     = { level_id: '', exam_type: 'testing', exam_id: '', question_type: 'choice', content: '', image_url: null, order_index: 0 };

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════ */
export const QuestionFormPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();          // undefined = new, else = edit
  const navigate  = useNavigate();
  const isEdit    = !!id;

  /* ─── Question type options ─── */
  const Q_TYPES = [
    { value: 'choice',    label: t('questionForm.typeLabels.choice'),    desc: 'Single choice',   icon: '🔘' },
    { value: 'multi',     label: t('questionForm.typeLabels.multi'),     desc: 'Multiple choice', icon: '☑️' },
    { value: 'dragdrop',  label: t('questionForm.typeLabels.dragdrop'),  desc: 'Drag & Drop',     icon: '🔀' },
    { value: 'truefalse', label: t('questionForm.typeLabels.truefalse'), desc: 'True / False',    icon: '✅' },
    { value: 'hotspot',   label: t('questionForm.typeLabels.hotspot'),   desc: 'Click on image',  icon: '🎯' },
  ];

  const { levels, exams, loading: structureLoading } = useExamStructure();
  const [filteredExams,  setFilteredExams]  = useState([]);
  const [loadingQuestion, setLoadingQuestion] = useState(isEdit);
  const loadingInit = structureLoading || loadingQuestion;

  const [form,           setForm]           = useState(INIT_FORM);
  const [answers,        setAnswers]        = useState([DEF_ANSWER(0), DEF_ANSWER(1), DEF_ANSWER(2), DEF_ANSWER(3)]);
  const [pairs,          setPairs]          = useState([DEF_PAIR(0), DEF_PAIR(1)]);
  const [statements,     setStatements]     = useState([DEF_STMT(0), DEF_STMT(1)]);
  const [regions,        setRegions]        = useState([]);
  const [hotspotMulti,   setHotspotMulti]   = useState(false);
  const [hotspotImg,     setHotspotImg]     = useState(null);

  const [saving,  setSaving]  = useState(false);
  const [errors,  setErrors]  = useState({});
  const { toasts, showToast, dismissToast } = useToast();

  // Remember last used exam for "save & add next"
  const lastExamRef = useRef({ level_id: '', exam_type: 'testing', exam_id: '' });

  /* ── Load question data (edit mode) once reference data is ready ── */
  useEffect(() => {
    if (!isEdit || structureLoading) return;
    let cancelled = false;
    setLoadingQuestion(true);
    const load = async () => {
      const { data: q, error } = await supabase
        .from('questions')
        .select(`*, answers(*), dragdrop_pairs(*), truefalse_statements(*), hotspot_regions(*)`)
        .eq('id', id)
        .single();
      if (cancelled) return;
      if (error || !q) { navigate('/questions'); return; }

      const exam = exams.find(e => e.id === q.exam_id);
      setForm({
        level_id:      exam?.level_id    || '',
        exam_type:     exam?.exam_type   || 'testing',
        exam_id:       q.exam_id         || '',
        question_type: q.question_type,
        content:       q.content,
        image_url:     q.image_url       || null,
        order_index:   q.order_index     || 0,
      });
      setAnswers(q.answers?.sort((a,b)=>a.order_index-b.order_index) || [DEF_ANSWER()]);
      setPairs(q.dragdrop_pairs?.sort((a,b)=>a.order_index-b.order_index) || [DEF_PAIR()]);
      setStatements(q.truefalse_statements?.sort((a,b)=>a.order_index-b.order_index) || [DEF_STMT(0),DEF_STMT(1)]);
      setRegions(q.hotspot_regions?.sort((a,b)=>a.order_index-b.order_index) || []);
      setHotspotMulti(q.hotspot_multi || false);
      setHotspotImg(q.image_url || null);
      setLoadingQuestion(false);
    };
    load();
    return () => { cancelled = true; };
  }, [id, isEdit, structureLoading, exams]);

  /* ── Filter exams by level + type ── */
  useEffect(() => {
    if (!form.level_id) { setFilteredExams([]); return; }
    const f = exams.filter(e => e.level_id === form.level_id && e.exam_type === form.exam_type);
    setFilteredExams(f);
    if (f.length && !f.find(e => e.id === form.exam_id)) {
      setForm(prev => ({ ...prev, exam_id: f[0]?.id || '' }));
    }
  }, [form.level_id, form.exam_type, exams]);

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  /* ── Validation ── */
  const validate = () => {
    const e = {};
    if (!form.level_id)             e.level_id = t('questionForm.errors.selectLevel');
    if (!form.exam_id)              e.exam_id  = t('questionForm.errors.selectExam');
    if (!stripHtml(form.content))   e.content  = t('questionForm.errors.enterContent');
    if (form.question_type === 'truefalse') {
      if (statements.length < 2)                         e.statements = t('questionForm.errors.minStatements');
      if (statements.some(s => !stripHtml(s.content)))   e.statements = t('questionForm.errors.statementContent');
    } else if (form.question_type === 'hotspot') {
      if (!hotspotImg)                                         e.regions = t('questionForm.errors.mustUploadImage');
      else if (!regions.some(r => r.is_correct))               e.regions = t('questionForm.errors.minCorrectRegion');
    } else if (form.question_type !== 'dragdrop') {
      if (answers.length < 2)                                  e.answers = t('questionForm.errors.minAnswers');
      if (!answers.some(a => a.is_correct))                    e.answers = t('questionForm.errors.needCorrectAnswer');
      if (answers.some(a => !stripHtml(a.content)))            e.answers = t('questionForm.errors.answerContent');
    } else {
      if (!pairs.length)                                         e.pairs = t('questionForm.errors.minPairs');
      if (pairs.some(p => !p.drag_content.trim() || !p.drop_content.trim())) e.pairs = t('questionForm.errors.pairContent');
    }
    setErrors(e);
    return !Object.keys(e).length;
  };

  /* ── Save ── */
  const doSave = async (andAddNext = false) => {
    if (!validate()) {
      showToast(t('questionForm.checkInfoToast'), 'error');
      // Scroll to first error
      document.querySelector('[data-error]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setSaving(true);
    try {
      let qId = id;
      const qData = {
        exam_id:       form.exam_id,
        question_type: form.question_type,
        content:       form.content,
        image_url:     form.question_type === 'hotspot' ? hotspotImg : form.image_url,
        order_index:   Number(form.order_index) || 0,
        hotspot_multi: form.question_type === 'hotspot' ? hotspotMulti : false,
      };

      if (isEdit) {
        await supabase.from('questions').update({ ...qData, updated_at: new Date().toISOString() }).eq('id', qId);
      } else {
        const { data, error } = await supabase.from('questions').insert(qData).select('id').single();
        if (error) throw error;
        qId = data.id;
      }

      // Save sub-data
      if (form.question_type === 'hotspot') {
        if (isEdit) await supabase.from('hotspot_regions').delete().eq('question_id', qId);
        if (regions.length) {
          const rows = regions.map((r, i) => ({
            question_id: qId, label: r.label||null, x: r.x, y: r.y,
            width: r.width, height: r.height, is_correct: r.is_correct,
            color: r.color || '#6366F1', order_index: i,
          }));
          const { error } = await supabase.from('hotspot_regions').insert(rows);
          if (error) throw error;
        }
      } else if (form.question_type === 'truefalse') {
        if (isEdit) await supabase.from('truefalse_statements').delete().eq('question_id', qId);
        const rows = statements.map((s, i) => ({ question_id: qId, content: s.content, is_true: s.is_true, order_index: i }));
        const { error } = await supabase.from('truefalse_statements').insert(rows);
        if (error) throw error;
      } else if (form.question_type !== 'dragdrop') {
        if (isEdit) await supabase.from('answers').delete().eq('question_id', qId);
        const rows = answers.map((a, i) => ({ question_id: qId, content: a.content, image_url: a.image_url||null, is_correct: a.is_correct, order_index: i }));
        const { error } = await supabase.from('answers').insert(rows);
        if (error) throw error;
      } else {
        if (isEdit) await supabase.from('dragdrop_pairs').delete().eq('question_id', qId);
        const rows = pairs.map((p, i) => ({ question_id: qId, drag_content: p.drag_content.trim(), drag_image_url: p.drag_image_url||null, drop_content: p.drop_content.trim(), drop_image_url: p.drop_image_url||null, order_index: i }));
        const { error } = await supabase.from('dragdrop_pairs').insert(rows);
        if (error) throw error;
      }

      // Reorder
      await supabase.rpc('reorder_questions_in_exam', { p_exam_id: form.exam_id });

      if (andAddNext) {
        showToast(t('questionForm.savedNextToast'));
        // Keep exam info, reset rest
        const saved = { level_id: form.level_id, exam_type: form.exam_type, exam_id: form.exam_id };
        lastExamRef.current = saved;
        setForm({ ...INIT_FORM, ...saved, order_index: Number(form.order_index) + 1 });
        setAnswers([DEF_ANSWER(0), DEF_ANSWER(1), DEF_ANSWER(2), DEF_ANSWER(3)]);
        setPairs([DEF_PAIR(0), DEF_PAIR(1)]);
        setStatements([DEF_STMT(0), DEF_STMT(1)]);
        setRegions([]);
        setHotspotImg(null);
        setHotspotMulti(false);
        setErrors({});
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        navigate('/questions');
      }
    } catch (err) {
      showToast(err.message || t('questionForm.saveErrorToast'), 'error');
    } finally {
      setSaving(false);
    }
  };

  // Ctrl+S shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); doSave(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [form, answers, pairs, statements, regions, hotspotImg]);

  /* ─── Pair helpers ─── */
  const addPair       = () => setPairs(p => [...p, DEF_PAIR(p.length)]);
  const removePair    = (i) => setPairs(p => p.filter((_,idx) => idx !== i));
  const updatePair    = (i, field, val) => setPairs(p => p.map((pair, idx) => idx === i ? { ...pair, [field]: val } : pair));
  const addStmt       = () => setStatements(s => [...s, DEF_STMT(s.length)]);
  const removeStmt    = (i) => setStatements(s => s.filter((_,idx) => idx !== i));
  const updateStmt    = (i, field, val) => setStatements(s => s.map((st, idx) => idx === i ? { ...st, [field]: val } : st));

  /* ── Derived ── */
  const versions = [...new Set(levels.map(l => l.version))].sort();
  const selectedExam = filteredExams.find(e => e.id === form.exam_id);
  const selectedLevel = levels.find(l => l.id === form.level_id);

  /* ── Loading ── */
  if (loadingInit) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const isHotspot = form.question_type === 'hotspot';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* ══ TOP HEADER ══ */}
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-screen-xl mx-auto flex items-center gap-3 px-4 sm:px-6 py-3">
          {/* Back */}
          <button
            onClick={() => navigate('/questions')}
            className="flex items-center gap-1.5 text-gray-500 dark:text-slate-500 hover:text-gray-800 dark:hover:text-slate-300 transition-colors text-sm font-medium flex-shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{t('questionForm.backToQuestions')}</span>
          </button>

          <div className="w-px h-5 bg-gray-200 dark:bg-slate-700 flex-shrink-0" />

          {/* Title */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-3.5 h-3.5 text-white" />
            </div>
            <h1 className="text-sm font-bold text-gray-900 dark:text-slate-100 truncate">
              {isEdit ? t('questionForm.editTitle') : t('questionForm.addTitle')}
            </h1>
            {form.exam_id && selectedExam && (
              <span className="hidden sm:inline text-xs text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                {selectedLevel?.label} · {selectedExam.exam_type === 'testing' ? t('questionForm.examTypeTesting') : t('questionForm.examTypeGmetrix')} {selectedExam.exam_number}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="hidden lg:inline text-[11px] text-gray-400 dark:text-slate-500">{t('questionForm.ctrlSHint')}</span>

            {/* Save & add next (only in add mode) */}
            {!isEdit && (
              <button
                onClick={() => doSave(true)}
                disabled={saving}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-indigo-300 dark:border-indigo-700/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-all disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                {t('questionForm.saveAndNext')}
              </button>
            )}

            <button
              onClick={() => doSave(false)}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-bold transition-all disabled:opacity-50"
              style={{ background: saving ? '#94a3b8' : 'linear-gradient(135deg, #6366F1, #8B5CF6)', boxShadow: saving ? 'none' : '0 4px 14px rgba(99,102,241,0.35)' }}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isEdit ? t('questionForm.updateButton') : t('questionForm.saveButton')}
            </button>
          </div>
        </div>
      </div>

      {/* ══ BODY ══ */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6">
        <div className={`flex gap-6 ${isHotspot ? 'flex-col xl:flex-row' : 'flex-col lg:flex-row'}`}>

          {/* ════ LEFT: Exam + Type config (sticky sidebar on desktop) ════ */}
          <div className={`flex-shrink-0 space-y-4 ${isHotspot ? 'xl:w-72' : 'lg:w-72'}`}>
            <div className="sticky top-[61px] space-y-4">

              {/* Section 1: Bài thi */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700/60 shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700/60 flex items-center gap-2">
                  <LayoutList className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                  <h2 className="text-xs font-bold text-gray-600 dark:text-slate-300 uppercase tracking-wider">1. {t('questionForm.sectionExamTitle')}</h2>
                </div>
                <div className="p-4 space-y-3">
                  {/* Level */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-slate-500 mb-1">{t('questionForm.levelLabel')} <span className="text-red-500">*</span></label>
                    <select
                      value={form.level_id}
                      onChange={e => { set('level_id', e.target.value); set('exam_id', ''); }}
                      className={`w-full text-sm border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 ${errors.level_id ? 'border-red-400 dark:border-red-700' : 'border-gray-200 dark:border-slate-600'}`}
                    >
                      <option value="">{t('questionForm.selectLevelPlaceholder')}</option>
                      {versions.map(v => (
                        <optgroup key={v} label={`── IC3 ${v} ──`}>
                          {levels.filter(l => l.version === v).map(l => (
                            <option key={l.id} value={l.id}>{v} — {l.label}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    {errors.level_id && <p data-error className="text-xs text-red-500 mt-1">{errors.level_id}</p>}
                  </div>

                  {/* Exam type */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-slate-500 mb-1">{t('questionForm.examTypeLabel')}</label>
                    <div className="flex gap-2">
                      {['testing','gmetrix'].map(ty => (
                        <button key={ty} type="button" onClick={() => set('exam_type', ty)}
                          className={`flex-1 py-2 text-xs rounded-xl border-2 font-bold capitalize transition-all ${form.exam_type === ty ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300' : 'border-gray-200 dark:border-slate-600 text-gray-500 dark:text-slate-500 hover:border-gray-300 dark:hover:border-slate-500'}`}>
                          {ty === 'testing' ? t('questionForm.examTypeTesting') : t('questionForm.examTypeGmetrix')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Specific exam */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-slate-500 mb-1">{t('questionForm.examNumberLabel')} <span className="text-red-500">*</span></label>
                    <select
                      value={form.exam_id}
                      onChange={e => set('exam_id', e.target.value)}
                      disabled={!form.level_id}
                      className={`w-full text-sm border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-40 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 ${errors.exam_id ? 'border-red-400 dark:border-red-700' : 'border-gray-200 dark:border-slate-600'}`}
                    >
                      <option value="">{t('questionForm.selectExamPlaceholder')}</option>
                      {filteredExams.map(e => (
                        <option key={e.id} value={e.id}>{e.exam_type === 'testing' ? t('questionForm.examTypeTesting') : t('questionForm.examTypeGmetrix')} {e.exam_number}</option>
                      ))}
                    </select>
                    {errors.exam_id && <p data-error className="text-xs text-red-500 mt-1">{errors.exam_id}</p>}
                  </div>

                  {/* Order index */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-slate-500 mb-1">{t('questionForm.orderIndexLabel')}</label>
                    <input type="number" min={0} value={form.order_index}
                      onChange={e => set('order_index', e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Loại câu hỏi */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700/60 shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700/60 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                  <h2 className="text-xs font-bold text-gray-600 dark:text-slate-300 uppercase tracking-wider">2. {t('questionForm.sectionTypeTitle')}</h2>
                </div>
                <div className="p-3 grid grid-cols-1 gap-1.5">
                  {Q_TYPES.map(t => (
                    <button key={t.value} type="button" onClick={() => set('question_type', t.value)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-left transition-all ${
                        form.question_type === t.value
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40'
                          : 'border-gray-100 dark:border-slate-700/60 bg-white dark:bg-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800/60 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20'
                      }`}>
                      <span className="text-lg flex-shrink-0">{t.icon}</span>
                      <div className="min-w-0">
                        <p className={`text-xs font-bold leading-none ${form.question_type === t.value ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-slate-300'}`}>{t.label}</p>
                        <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">{t.desc}</p>
                      </div>
                      {form.question_type === t.value && (
                        <CheckCircle2 className="w-4 h-4 text-indigo-500 ml-auto flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile: Save & add next */}
              {!isEdit && (
                <button onClick={() => doSave(true)} disabled={saving}
                  className="sm:hidden w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-indigo-300 dark:border-indigo-700/60 text-indigo-700 dark:text-indigo-300 text-sm font-bold hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-all disabled:opacity-50">
                  <Plus className="w-4 h-4" /> {t('questionForm.saveAndNextMobile')}
                </button>
              )}
            </div>
          </div>

          {/* ════ RIGHT: Content + Answers ════ */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* Section 3: Nội dung câu hỏi */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700/60 shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700/60 flex items-center gap-2">
                <Type className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                <h2 className="text-xs font-bold text-gray-600 dark:text-slate-300 uppercase tracking-wider">3. {t('questionForm.sectionContentTitle')}</h2>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-slate-500 mb-1.5">
                    {t('questionForm.questionLabel')} <span className="text-red-500">*</span>
                    <span className="ml-1.5 text-gray-300 dark:text-slate-600 font-normal">{t('questionForm.richTextHint')}</span>
                  </label>
                  <RichTextEditor
                    value={form.content}
                    onChange={html => set('content', html)}
                    placeholder={isHotspot ? t('questionForm.hotspotContentPlaceholder') : t('questionForm.contentPlaceholder')}
                    minHeight={100}
                    hasError={!!errors.content}
                  />
                  {errors.content && <p data-error className="text-xs text-red-500 mt-1">{errors.content}</p>}
                </div>

                {/* Image uploader — not for hotspot */}
                {!isHotspot && (
                  <ImageUploader
                    bucket="question-images"
                    value={form.image_url}
                    onChange={url => set('image_url', url)}
                    label={t('questionForm.questionImageLabel')}
                  />
                )}
              </div>
            </div>

            {/* Section 4: Đáp án / Hotspot / etc. */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700/60 shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700/60">
                <h2 className="text-xs font-bold text-gray-600 dark:text-slate-300 uppercase tracking-wider">
                  4. {form.question_type === 'dragdrop' ? t('questionForm.sectionPairsTitle')
                    : form.question_type === 'truefalse' ? t('questionForm.sectionStatementsTitle')
                    : form.question_type === 'hotspot' ? t('questionForm.sectionRegionsTitle')
                    : t('questionForm.sectionAnswersTitle')}
                </h2>
              </div>
              <div className="p-5">
                {/* Error banner */}
                {(errors.answers || errors.pairs || errors.statements || errors.regions) && (
                  <div data-error className="flex items-center gap-2 mb-4 px-4 py-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-xl text-sm text-red-700 dark:text-red-300">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {errors.answers || errors.pairs || errors.statements || errors.regions}
                  </div>
                )}

                {/* ── Hotspot ── */}
                {form.question_type === 'hotspot' && (
                  <HotspotEditor
                    imageUrl={hotspotImg}
                    onImageChange={setHotspotImg}
                    regions={regions}
                    onRegionsChange={setRegions}
                    multiMode={hotspotMulti}
                    onMultiModeChange={setHotspotMulti}
                  />
                )}

                {/* ── True/False ── */}
                {form.question_type === 'truefalse' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 rounded-xl">
                      <span>✅</span>
                      <p className="text-xs text-teal-700 dark:text-teal-300">{t('questionForm.trueFalseHint')}</p>
                    </div>
                    {statements.map((stmt, i) => (
                      <div key={stmt.id} className={`rounded-xl border-2 overflow-hidden ${stmt.is_true ? 'border-emerald-300 dark:border-emerald-800/60' : 'border-red-300 dark:border-red-800/60'}`}>
                        <div className={`flex items-center gap-2 px-3 py-2 border-b ${stmt.is_true ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60' : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/60'}`}>
                          <span className="w-5 h-5 rounded-full bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-300 text-xs font-bold flex items-center justify-center flex-shrink-0">{i+1}</span>
                          <span className={`text-xs font-semibold flex-1 ${stmt.is_true ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>{stmt.is_true ? `✔ ${t('questionForm.trueLabel')}` : `✘ ${t('questionForm.falseLabel')}`}</span>
                          <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-slate-600 flex-shrink-0">
                            <button type="button" onClick={() => updateStmt(i,'is_true',true)} className={`px-3 py-1 text-xs font-bold transition-all ${stmt.is_true ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-slate-800 text-gray-400 dark:text-slate-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'}`}>{t('questionForm.trueLabel')}</button>
                            <button type="button" onClick={() => updateStmt(i,'is_true',false)} className={`px-3 py-1 text-xs font-bold border-l border-gray-200 dark:border-slate-600 transition-all ${!stmt.is_true ? 'bg-red-500 text-white' : 'bg-white dark:bg-slate-800 text-gray-400 dark:text-slate-500 hover:bg-red-50 dark:hover:bg-red-950/40'}`}>{t('questionForm.falseLabel')}</button>
                          </div>
                          <button type="button" onClick={() => removeStmt(i)} disabled={statements.length <= 2} className="text-gray-300 dark:text-slate-600 hover:text-red-400 dark:hover:text-red-400 disabled:opacity-30 flex-shrink-0"><Trash2 className="w-4 h-4"/></button>
                        </div>
                        <div className="p-3 bg-white dark:bg-slate-800">
                          <RichTextEditor value={stmt.content} onChange={html => updateStmt(i,'content',html)} placeholder={t('questionForm.statementPlaceholder', { index: i + 1 })} minHeight={44} />
                        </div>
                      </div>
                    ))}
                    <button type="button" onClick={addStmt} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-teal-600 dark:text-teal-400 font-semibold border-2 border-dashed border-teal-300 dark:border-teal-700/60 hover:border-teal-500 dark:hover:border-teal-500 rounded-xl transition-colors">
                      <Plus className="w-4 h-4"/> {t('questionForm.addStatement')}
                    </button>
                  </div>
                )}

                {/* ── Drag-drop ── */}
                {form.question_type === 'dragdrop' && (
                  <div className="space-y-4">
                    {pairs.map((pair, i) => (
                      <div key={pair.id} className="border border-gray-200 dark:border-slate-600 rounded-xl overflow-hidden bg-gray-50 dark:bg-slate-700/50">
                        <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
                          <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{t('questionForm.pairLabel', { index: i + 1 })}</span>
                          <button type="button" onClick={() => removePair(i)} className="text-gray-300 dark:text-slate-500 hover:text-red-400 dark:hover:text-red-400"><Trash2 className="w-4 h-4"/></button>
                        </div>
                        <div className="flex flex-col sm:grid sm:grid-cols-[1fr_32px_1fr] gap-0">
                          <div className="p-4 space-y-2 border-b sm:border-b-0 sm:border-r border-gray-200 dark:border-slate-600">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">🔵 {t('questionForm.dragBadge')}</span>
                            <textarea value={pair.drag_content} onChange={e => updatePair(i,'drag_content',e.target.value)} onInput={e=>{e.target.style.height='auto';e.target.style.height=e.target.scrollHeight+'px';}} placeholder={t('questionForm.dragContentPlaceholder', { index: i + 1 })} rows={2} className="w-full text-sm border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none overflow-hidden" style={{minHeight:'64px'}} />
                            <ImageUploader bucket="question-images" value={pair.drag_image_url} onChange={url => updatePair(i,'drag_image_url',url)} label={t('questionForm.optionalImageLabel')}/>
                          </div>
                          <div className="hidden sm:flex items-center justify-center bg-gray-50 dark:bg-slate-700/50"><ArrowLeftRight className="w-4 h-4 text-gray-300 dark:text-slate-600"/></div>
                          <div className="p-4 space-y-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">🟣 {t('questionForm.dropBadge')}</span>
                            <textarea value={pair.drop_content} onChange={e => updatePair(i,'drop_content',e.target.value)} onInput={e=>{e.target.style.height='auto';e.target.style.height=e.target.scrollHeight+'px';}} placeholder={t('questionForm.dropContentPlaceholder', { index: i + 1 })} rows={2} className="w-full text-sm border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none overflow-hidden" style={{minHeight:'64px'}} />
                            <ImageUploader bucket="answer-images" value={pair.drop_image_url} onChange={url => updatePair(i,'drop_image_url',url)} label={t('questionForm.optionalImageLabel')}/>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button type="button" onClick={addPair} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-indigo-600 dark:text-indigo-400 font-semibold border-2 border-dashed border-indigo-300 dark:border-indigo-700/60 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-xl">
                      <Plus className="w-4 h-4"/> {t('questionForm.addPair')}
                    </button>
                  </div>
                )}

                {/* ── Choice / Multi ── */}
                {(form.question_type === 'choice' || form.question_type === 'multi') && (
                  <AnswerEditor answers={answers} onChange={setAnswers} multiSelect={form.question_type === 'multi'} />
                )}
              </div>
            </div>

            {/* Bottom action bar */}
            <div className="flex items-center justify-between gap-3 pt-2 pb-8">
              <button onClick={() => navigate('/questions')} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-500 dark:text-slate-500 hover:text-gray-800 dark:hover:text-slate-300 border border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 rounded-xl transition-all">
                <ChevronLeft className="w-4 h-4" /> {t('questionForm.cancelButton')}
              </button>
              <div className="flex items-center gap-2">
                {!isEdit && (
                  <button onClick={() => doSave(true)} disabled={saving} className="flex items-center gap-2 px-4 py-2.5 text-sm text-indigo-700 dark:text-indigo-300 font-bold border-2 border-indigo-300 dark:border-indigo-700/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl transition-all disabled:opacity-50">
                    <Plus className="w-4 h-4" /> {t('questionForm.saveAndNext')}
                  </button>
                )}
                <button onClick={() => doSave(false)} disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold transition-all disabled:opacity-50"
                  style={{ background: saving ? '#94a3b8' : 'linear-gradient(135deg, #6366F1, #8B5CF6)', boxShadow: saving ? 'none' : '0 4px 14px rgba(99,102,241,0.35)' }}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                  {isEdit ? t('questionForm.updateButton') : t('questionForm.saveButton')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
