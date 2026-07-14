import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  ArrowRight, Shuffle, CheckCircle2, XCircle,
  BookOpen, ChevronLeft, Keyboard, Trophy,
  RefreshCw, Home, Sparkles, RotateCcw, SkipForward,
} from 'lucide-react';
import { sanitizeHtml } from '../utils/sanitizeHtml';

/* ─── Fisher-Yates ─── */
const shuffleArr = a => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};

/* ─── TYPE config ─── */
const TYPE_CFG = {
  choice:    { bar: '#3b82f6', badge: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/60' },
  multi:     { bar: '#8b5cf6', badge: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800/60' },
  dragdrop:  { bar: '#f97316', badge: 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800/60' },
  truefalse: { bar: '#14b8a6', badge: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/60' },
  hotspot:   { bar: '#f59e0b', badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60' },
};

/* ─── Score logic ─── */
const scoreAnswer = (q, sel) => {
  if (sel === null || sel === undefined) return false;
  switch (q.question_type) {
    case 'choice':    return (q.answers||[]).filter(a=>a.is_correct).some(a=>a.id===sel);
    case 'multi': {   const c=[...(q.answers||[]).filter(a=>a.is_correct).map(a=>a.id)].sort(); const u=[...(Array.isArray(sel)?sel:[])].sort(); return JSON.stringify(c)===JSON.stringify(u); }
    case 'truefalse': return (q.truefalse_statements||[]).every(s=>sel[s.id]===s.is_true);
    case 'dragdrop':  return (q.dragdrop_pairs||[]).every(p=>sel[p.id]===p.drop_content);
    case 'hotspot': {
      const ok=(q.hotspot_regions||[]).filter(r=>r.is_correct).map(r=>r.id);
      const bad=(q.hotspot_regions||[]).filter(r=>!r.is_correct).map(r=>r.id);
      const arr=Array.isArray(sel)?sel:[];
      return ok.every(id=>arr.includes(id))&&!arr.some(id=>bad.includes(id));
    }
    default: return false;
  }
};

/* ══════════════════════════════════════════════════════════
   SHARED ANSWER BUTTON  — modern pill style (sync with Exam)
══════════════════════════════════════════════════════════ */
const AnswerBtn = ({ idx, isSelected, ansCorrect, isWrong, revealed, disabled, onClick, children }) => {
  const { isDark } = useTheme();
  const letter = String.fromCharCode(65 + idx);

  let wrapClass;
  let wrapStyle = {};
  let letterClass;
  let letterStyle = {};
  let textClass;

  if (!revealed) {
    if (isSelected) {
      wrapClass = 'border-2 border-indigo-400 dark:border-indigo-500 shadow-lg shadow-indigo-100/70 dark:shadow-none scale-[1.01]';
      wrapStyle = { background: isDark ? 'linear-gradient(135deg, #1e1b4b 0%, #2e1065 100%)' : 'linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)' };
      letterClass = 'text-white';
      letterStyle = { background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', boxShadow: '0 4px 12px rgba(99,102,241,0.35)' };
      textClass = 'text-indigo-900 dark:text-indigo-200 font-semibold';
    } else {
      wrapClass = 'border-2 border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-200 dark:hover:border-indigo-700 hover:shadow-md hover:shadow-indigo-50 dark:hover:shadow-none hover:-translate-y-px group';
      letterClass = 'bg-gray-100 text-gray-400 dark:bg-slate-700 dark:text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 dark:group-hover:bg-indigo-900/50 dark:group-hover:text-indigo-400';
      textClass = 'text-gray-700 dark:text-slate-300';
    }
  } else {
    if (ansCorrect) {
      wrapClass = 'border-2 border-green-400 dark:border-green-600 shadow-lg shadow-green-100/50 dark:shadow-none scale-[1.01] z-10';
      wrapStyle = { background: isDark ? 'linear-gradient(135deg, #052e1a 0%, #0a3d24 100%)' : 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)' };
      letterClass = 'text-white';
      letterStyle = { background: 'linear-gradient(135deg, #22C55E, #16A34A)', boxShadow: '0 4px 12px rgba(34,197,94,0.25)' };
      textClass = 'text-green-800 dark:text-green-300 font-semibold';
    } else if (isWrong) {
      wrapClass = 'border-2 border-red-400 dark:border-red-600 shadow-lg shadow-red-100/50 dark:shadow-none scale-[1.01] z-10';
      wrapStyle = { background: isDark ? 'linear-gradient(135deg, #2e0a0a 0%, #3d0f0f 100%)' : 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)' };
      letterClass = 'text-white';
      letterStyle = { background: 'linear-gradient(135deg, #F87171, #EF4444)', boxShadow: '0 4px 12px rgba(239,68,68,0.25)' };
      textClass = 'text-red-800 dark:text-red-300 font-semibold';
    } else {
      wrapClass = 'border-2 border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/60 opacity-60';
      letterClass = 'bg-gray-200 text-gray-400 dark:bg-slate-700 dark:text-slate-500';
      textClass = 'text-gray-400 dark:text-slate-500';
    }
  }

  return (
    <button disabled={disabled} onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 text-left rounded-2xl transition-all duration-200 select-none ${wrapClass}`}
      style={wrapStyle}>

      {/* Letter pill */}
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-extrabold shrink-0 transition-all duration-200 ${letterClass}`}
        style={letterStyle}>
        {letter}
      </div>

      {/* Content */}
      <div className={`flex-1 min-w-0 text-[13.5px] leading-relaxed transition-colors ${textClass}`}>
        {children}
      </div>

      {/* Status icon */}
      {revealed && ansCorrect && (
        <div className="shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center ml-2">
          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
        </div>
      )}
      {revealed && isWrong && (
        <div className="shrink-0 w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center ml-2">
          <XCircle className="w-4 h-4 text-red-500 dark:text-red-400" />
        </div>
      )}
    </button>
  );
};

/* ── Choice ── */
const ChoicePanel = ({ answers, revealed, selection, onSelect }) => (
  <div className="space-y-2.5">
    {answers.map((ans, i) => (
      <AnswerBtn key={ans.id} idx={i}
        isSelected={selection === ans.id}
        ansCorrect={revealed && ans.is_correct}
        isWrong={revealed && selection === ans.id && !ans.is_correct}
        revealed={revealed} disabled={revealed}
        onClick={() => onSelect(ans.id)}>
        <div className="flex items-center gap-3">
          {ans.image_url && <img src={ans.image_url} alt="" className="h-14 w-20 object-contain rounded-lg border border-gray-100 dark:border-slate-700 shrink-0 bg-white dark:bg-slate-800" />}
          <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(ans.content) }} />
        </div>
      </AnswerBtn>
    ))}
  </div>
);

/* ── Multi ── */
const MultiPanel = ({ answers, revealed, selection, onSelect }) => {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const sel = selection || [];
  const toggle = id => { if (revealed) return; onSelect(sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id]); };
  return (
    <div className="space-y-2.5">
      {/* Hint chip */}
      <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-semibold"
        style={{ background: isDark ? 'linear-gradient(135deg,#2e1065,#1e1b4b)' : 'linear-gradient(135deg,#f5f3ff,#ede9fe)', border: `1px solid ${isDark ? '#5b21b6' : '#c4b5fd'}`, color: isDark ? '#c4b5fd' : '#6d28d9' }}>
        <span className="w-4 h-4 rounded-sm flex items-center justify-center text-xs" style={{ background: '#7c3aed', color: '#fff' }}>✓</span>
        {t('flashcard.multi.hint')}
      </div>
      {answers.map((ans, i) => {
        const isS = sel.includes(ans.id);
        return (
          <AnswerBtn key={ans.id} idx={i} shape="square"
            isSelected={isS}
            ansCorrect={revealed && ans.is_correct}
            isWrong={revealed && isS && !ans.is_correct}
            revealed={revealed} disabled={revealed}
            onClick={() => toggle(ans.id)}>
            <div className="flex items-center gap-3">
              {ans.image_url && <img src={ans.image_url} alt="" className="h-14 w-20 object-contain rounded-lg border border-gray-100 dark:border-slate-700 shrink-0 bg-white dark:bg-slate-800" />}
              <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(ans.content) }} />
            </div>
          </AnswerBtn>
        );
      })}
    </div>
  );
};

/* ── TrueFalse ── */
const TrueFalsePanel = ({ statements, revealed, selection, onSelect }) => {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const sel = selection || {};
  return (
    <div className="space-y-2.5">
      {statements.map((stmt, i) => {
        const userVal = sel[stmt.id];
        const correct = userVal === stmt.is_true;
        return (
          <div key={stmt.id} className="rounded-2xl border overflow-hidden transition-all"
            style={{
              borderColor: isDark
                ? (revealed ? (correct ? '#15803d' : '#7f1d1d') : userVal !== undefined ? '#1e40af' : '#334155')
                : (revealed ? (correct ? '#86efac' : '#fca5a5') : userVal !== undefined ? '#93c5fd' : '#e2e8f0'),
              background: isDark
                ? (revealed ? (correct ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)') : userVal !== undefined ? 'rgba(59,130,246,0.12)' : '#1e293b')
                : (revealed ? (correct ? '#f0fdf4' : '#fef2f2') : userVal !== undefined ? '#eff6ff' : '#fff'),
            }}>
            <div className="flex items-start gap-3 px-4 py-3">
              <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                style={{ background: revealed ? (correct ? '#22c55e' : '#ef4444') : (isDark ? '#334155' : '#e2e8f0'), color: revealed ? '#fff' : (isDark ? '#94a3b8' : '#64748b') }}>
                {i + 1}
              </span>
              <p
                className={`text-sm flex-1 leading-relaxed ${!revealed ? 'text-slate-700 dark:text-slate-300' : correct ? 'text-emerald-900 dark:text-emerald-300' : 'text-red-900 dark:text-red-300'}`}
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(stmt.content) }}
              />
              {revealed && correct && <CheckCircle2 className="w-4 h-4 text-green-500 dark:text-green-400 shrink-0 mt-0.5" />}
              {revealed && !correct && <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
            </div>
            <div className="flex border-t" style={{ borderColor: isDark ? '#334155' : '#f1f5f9' }}>
              {[true, false].map(val => {
                const active = userVal === val;
                const isCorrectAnswer = stmt.is_true === val;
                let bg2, tc;
                if (revealed) { bg2 = isCorrectAnswer ? '#22c55e' : active ? '#ef4444' : (isDark ? '#334155' : '#f8fafc'); tc = isCorrectAnswer || active ? '#fff' : (isDark ? '#64748b' : '#94a3b8'); }
                else { bg2 = active ? '#3b82f6' : (isDark ? '#1e293b' : '#fff'); tc = active ? '#fff' : (isDark ? '#cbd5e1' : '#64748b'); }
                return (
                  <React.Fragment key={String(val)}>
                    {!val && <div style={{ width: 1, background: isDark ? '#334155' : '#f1f5f9' }} />}
                    <button disabled={revealed} onClick={() => !revealed && onSelect({ ...sel, [stmt.id]: val })}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-all"
                      style={{ background: bg2, color: tc }}>
                      {val ? <><CheckCircle2 className="w-3.5 h-3.5" />{t('flashcard.trueFalse.true')}</> : <><XCircle className="w-3.5 h-3.5" />{t('flashcard.trueFalse.false')}</>}
                    </button>
                  </React.Fragment>
                );
              })}
            </div>
            {revealed && !correct && (
              <p className="px-4 pb-2 text-xs font-semibold text-red-600 dark:text-red-400">✦ {t('flashcard.trueFalse.answerLabel')}: {stmt.is_true ? t('flashcard.trueFalse.true') : t('flashcard.trueFalse.false')}</p>
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ── DragDrop — thực kéo-thả + click-to-place ── */
const DragDropPanel = ({ question, revealed, selection, onSelect }) => {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const pairs = [...(question.dragdrop_pairs||[])].sort((a,b) => a.order_index - b.order_index);
  const [dragging,     setDragging]     = useState(null);
  const [dragOverZone, setDragOverZone] = useState(null);
  const [touchSel,     setTouchSel]     = useState(null);

  const placed = selection || {};

  /* unique drop-zones */
  const dropZones = [];
  const seen = new Set();
  for (const p of pairs) {
    if (!seen.has(p.drop_content)) {
      seen.add(p.drop_content);
      dropZones.push({ label: p.drop_content, image_url: p.drop_image_url });
    }
  }

  const poolItems = pairs.filter(p => !placed[p.id]);

  const placeItem = (pairId, zone) => {
    const next = { ...placed, [pairId]: zone };
    onSelect(next);
  };
  const returnToPool = (pairId) => {
    const next = { ...placed }; delete next[pairId]; onSelect(next);
  };

  /* drag handlers */
  const onDragStart = p => setDragging(p);
  const onDragEnd   = () => { setDragging(null); setDragOverZone(null); };
  const onDropZone  = (e, zone) => { e.preventDefault(); if (dragging) placeItem(dragging.id, zone); setDragging(null); setDragOverZone(null); };
  const onDropPool  = e => { e.preventDefault(); if (dragging) returnToPool(dragging.id); setDragging(null); setDragOverZone(null); };

  /* click/touch handlers */
  const onItemClick = (e, p) => { e.stopPropagation(); setTouchSel(prev => prev?.id === p.id ? null : p); };
  const onZoneClick = zone  => { if (!touchSel) return; placeItem(touchSel.id, zone); setTouchSel(null); };
  const onPoolClick = ()    => setTouchSel(null);

  const zoneColors = [
    { idle: '#8b5cf6', bg: '#f5f3ff', border: '#c4b5fd', header: '#ede9fe', headerText: '#5b21b6', dot: '#7c3aed', darkBg: 'rgba(139,92,246,0.12)', darkBorder: '#6d28d9', darkHeader: 'rgba(139,92,246,0.18)', darkHeaderText: '#c4b5fd' },
    { idle: '#10b981', bg: '#f0fdf4', border: '#6ee7b7', header: '#d1fae5', headerText: '#065f46', dot: '#059669', darkBg: 'rgba(16,185,129,0.12)', darkBorder: '#047857', darkHeader: 'rgba(16,185,129,0.18)', darkHeaderText: '#6ee7b7' },
    { idle: '#f43f5e', bg: '#fff1f2', border: '#fda4af', header: '#ffe4e6', headerText: '#9f1239', dot: '#e11d48', darkBg: 'rgba(244,63,94,0.12)', darkBorder: '#be123c', darkHeader: 'rgba(244,63,94,0.18)', darkHeaderText: '#fda4af' },
    { idle: '#f59e0b', bg: '#fffbeb', border: '#fcd34d', header: '#fef3c7', headerText: '#92400e', dot: '#d97706', darkBg: 'rgba(245,158,11,0.12)', darkBorder: '#b45309', darkHeader: 'rgba(245,158,11,0.18)', darkHeaderText: '#fcd34d' },
    { idle: '#3b82f6', bg: '#eff6ff', border: '#93c5fd', header: '#dbeafe', headerText: '#1e40af', dot: '#2563eb', darkBg: 'rgba(59,130,246,0.12)', darkBorder: '#1d4ed8', darkHeader: 'rgba(59,130,246,0.18)', darkHeaderText: '#93c5fd' },
  ];

  /* ── REVEALED: show result instead of drag UI ── */
  if (revealed) {
    return (
      <div className="space-y-2.5">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('flashcard.dragDrop.resultTitle')}</p>
        {pairs.map((pair) => {
          const chosen    = placed[pair.id];
          const isCorrect = chosen === pair.drop_content;
          return (
            <div key={pair.id} className="flex items-center gap-3 px-4 py-3 rounded-2xl border"
              style={{
                background: isDark
                  ? (isCorrect ? 'linear-gradient(135deg,#052e1a,#0a3d24)' : 'linear-gradient(135deg,#2e0a0a,#3d0f0f)')
                  : (isCorrect ? 'linear-gradient(135deg,#f0fdf4,#dcfce7)' : 'linear-gradient(135deg,#fef2f2,#fee2e2)'),
                borderColor: isDark ? (isCorrect ? '#15803d' : '#7f1d1d') : (isCorrect ? '#86efac' : '#fca5a5'),
              }}>
              {/* drag card */}
              <div className="shrink-0 flex flex-col items-center gap-1 px-2.5 py-2 rounded-xl border"
                style={{ background: isDark ? '#1e293b' : '#fff', borderColor: isDark ? '#334155' : '#e2e8f0', minWidth: 64, maxWidth: 120 }}>
                {pair.drag_image_url && <img src={pair.drag_image_url} alt="" className="w-10 h-10 object-contain rounded-lg" draggable={false} />}
                {pair.drag_content   && <span className="text-xs font-semibold text-center text-slate-700 dark:text-slate-300 leading-snug wrap-break-word w-full">{pair.drag_content}</span>}
              </div>
              {/* arrow */}
              <div className="text-slate-300 dark:text-slate-600 text-lg shrink-0">→</div>
              {/* answer zone */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: isDark ? (isCorrect ? '#86efac' : '#fca5a5') : (isCorrect ? '#166534' : '#991b1b') }}>
                  {chosen || <span className="italic opacity-60">{t('flashcard.dragDrop.notSelected')}</span>}
                </p>
                {!isCorrect && (
                  <p className="text-xs mt-0.5" style={{ color: isDark ? '#86efac' : '#166534' }}>✦ {t('flashcard.dragDrop.correctAnswer', { value: pair.drop_content })}</p>
                )}
              </div>
              <div className="shrink-0">
                {isCorrect
                  ? <div className="w-7 h-7 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" /></div>
                  : <div className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center"><XCircle className="w-4 h-4 text-red-500 dark:text-red-400" /></div>}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  /* ── INTERACTIVE drag-and-drop ── */
  return (
    <div className="space-y-4">
      {/* Instruction */}
      <div className="flex items-start gap-3 rounded-2xl px-4 py-3"
        style={{ background: isDark ? 'linear-gradient(135deg,#0c2340,#0a1f33)' : 'linear-gradient(135deg,#eff6ff,#f0f9ff)', border: `1px solid ${isDark ? '#1e40af' : '#bfdbfe'}` }}>
        <span className="text-base shrink-0">🔀</span>
        <div>
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">{t('flashcard.dragDrop.instructionTitle')}</p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">{t('flashcard.dragDrop.instructionPrefix')} <strong>{t('flashcard.dragDrop.tapCard')}</strong> {t('flashcard.dragDrop.instructionMiddle')} <strong>{t('flashcard.dragDrop.tapZone')}</strong> {t('flashcard.dragDrop.instructionSuffix')}</p>
        </div>
      </div>

      {/* Pool */}
      <div onDragOver={e => { e.preventDefault(); setDragOverZone('pool'); }}
           onDragLeave={() => setDragOverZone(null)}
           onDrop={onDropPool} onClick={onPoolClick}
           className="rounded-2xl border-2 border-dashed p-4 transition-all duration-200"
           style={{ borderColor: dragOverZone==='pool' ? '#60a5fa' : (isDark ? '#1e40af' : '#bfdbfe'), background: dragOverZone==='pool' ? (isDark ? 'rgba(59,130,246,0.12)' : '#eff6ff') : (isDark ? '#1e293b' : '#f8fbff') }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <p className="text-[11px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-widest">{t('flashcard.dragDrop.poolLabel')}</p>
          <span className="ml-auto text-[11px] text-slate-400 dark:text-slate-500 font-medium">{t('flashcard.dragDrop.cardsRemaining', { count: poolItems.length })}</span>
        </div>
        <div className="flex flex-wrap gap-2.5 min-h-[56px]">
          {poolItems.length === 0 ? (
            <div className="w-full flex items-center justify-center gap-2 py-3">
              <span className="text-green-500">✅</span>
              <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">{t('flashcard.dragDrop.allPlaced')}</p>
            </div>
          ) : poolItems.map(pair => {
            const isSelected = touchSel?.id === pair.id;
            const isBeingDragged = dragging?.id === pair.id;
            const hasImg  = !!pair.drag_image_url;
            const hasTxt  = !!pair.drag_content;
            return (
              <div key={pair.id} className="flex flex-col items-center gap-0.5"
                onClick={e => onItemClick(e, pair)}>
                <div draggable onDragStart={() => onDragStart(pair)} onDragEnd={onDragEnd}
                  style={{
                    minWidth: 72, maxWidth: 160,
                    opacity: isBeingDragged ? 0.4 : 1,
                    transform: isSelected ? 'scale(1.06)' : isBeingDragged ? 'scale(0.95)' : 'scale(1)',
                    background: isSelected ? (isDark ? '#3f2d0a' : '#fffbeb') : (isDark ? '#1e293b' : '#fff'),
                    border: `2px solid ${isSelected ? '#fbbf24' : (isDark ? '#1e40af' : '#bfdbfe')}`,
                    boxShadow: isSelected ? '0 4px 16px rgba(251,191,36,0.3), 0 0 0 3px rgba(252,211,77,0.3)' : '0 2px 8px rgba(15,23,42,0.06)',
                    borderRadius: 14, padding: '8px 12px',
                    cursor: 'grab', userSelect: 'none',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    transition: 'all 0.15s',
                  }}>
                  {hasImg && <img src={pair.drag_image_url} alt="" style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 8 }} draggable={false} />}
                  {hasTxt && <span style={{ fontSize: 11, fontWeight: 600, textAlign: 'center', color: isDark ? (isSelected ? '#fbbf24' : '#cbd5e1') : (isSelected ? '#92400e' : '#334155'), lineHeight: 1.3, wordBreak: 'break-word' }}>{pair.drag_content}</span>}
                </div>
                {isSelected && (
                  <div className="flex items-center gap-0.5 text-[9px] text-amber-600 dark:text-amber-400 font-bold mt-1">
                    <span className="animate-bounce">👆</span> {t('flashcard.dragDrop.selectZoneHint')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Drop zones */}
      <div className={`grid gap-3 ${dropZones.length <= 2 ? 'grid-cols-1 sm:grid-cols-2' : dropZones.length === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
        {dropZones.map((zone, zi) => {
          const zc        = zoneColors[zi % zoneColors.length];
          const zoneItems = pairs.filter(p => placed[p.id] === zone.label);
          const isOver    = dragOverZone === zone.label;
          const isTarget  = !!touchSel;
          return (
            <div key={zone.label}
              onDragOver={e => { e.preventDefault(); setDragOverZone(zone.label); }}
              onDragLeave={() => setDragOverZone(null)}
              onDrop={e => onDropZone(e, zone.label)}
              onClick={() => onZoneClick(zone.label)}
              className="rounded-2xl border-2 overflow-hidden transition-all duration-200 cursor-pointer"
              style={{
                borderColor: isOver ? zc.border : isTarget ? '#93c5fd' : (isDark ? '#334155' : '#e2e8f0'),
                background: isOver ? (isDark ? zc.darkBg : zc.bg) : isTarget ? (isDark ? 'rgba(59,130,246,0.1)' : '#f0f9ff') : (isDark ? '#1e293b' : '#fff'),
                boxShadow: isOver ? `0 4px 20px rgba(0,0,0,0.12)` : isTarget ? '0 2px 10px rgba(59,130,246,0.12)' : '0 1px 4px rgba(15,23,42,0.04)',
                transform: isOver ? 'scale(1.02)' : 'scale(1)',
              }}>
              {/* Zone header */}
              <div className="px-4 py-3 border-b flex items-center gap-2"
                style={{ background: isOver ? (isDark ? zc.darkHeader : zc.header) : (isDark ? '#334155' : '#f8fafc'), borderColor: isOver ? zc.border : (isDark ? '#334155' : '#f1f5f9') }}>
                <div className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: isOver ? zc.dot : (isDark ? '#64748b' : '#cbd5e1') }} />
                {zone.image_url && <img src={zone.image_url} alt="" className="h-8 w-auto object-contain shrink-0" />}
                <span className="text-sm font-bold leading-snug"
                  style={{ color: isOver ? (isDark ? zc.darkHeaderText : zc.headerText) : (isDark ? '#f1f5f9' : '#1e293b') }}>
                  {zone.label}
                </span>
                {zoneItems.length > 0 && (
                  <span className="ml-auto text-[10px] font-semibold text-slate-400 dark:text-slate-500">{t('flashcard.dragDrop.zoneCardCount', { count: zoneItems.length })}</span>
                )}
              </div>
              {/* Items in zone */}
              <div className="p-3 flex flex-wrap gap-2 min-h-[80px] items-start content-start">
                {zoneItems.length === 0 ? (
                  <div className="w-full flex flex-col items-center justify-center gap-1 py-3 text-slate-300 dark:text-slate-600">
                    <span className="text-2xl">{isOver ? '⬇️' : '📥'}</span>
                    <span className="text-xs font-medium">{isOver ? t('flashcard.dragDrop.dropHereActive') : t('flashcard.dragDrop.dropHerePlaceholder')}</span>
                  </div>
                ) : zoneItems.map(pair => {
                  const hasImg = !!pair.drag_image_url;
                  const hasTxt = !!pair.drag_content;
                  return (
                    <div key={pair.id} title={t('flashcard.dragDrop.tapToReturn')}
                      onClick={e => { e.stopPropagation(); returnToPool(pair.id); }}>
                      <div draggable onDragStart={() => onDragStart(pair)} onDragEnd={onDragEnd}
                        style={{
                          minWidth: 64, maxWidth: 160,
                          opacity: dragging?.id === pair.id ? 0.4 : 1,
                          background: isDark ? '#1e293b' : '#fff', border: `2px solid ${isDark ? '#4338ca' : '#a5b4fc'}`,
                          borderRadius: 12, padding: '6px 10px',
                          cursor: 'grab', userSelect: 'none',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                          boxShadow: '0 2px 8px rgba(99,102,241,0.12)',
                          transition: 'all 0.15s',
                        }}>
                        {hasImg && <img src={pair.drag_image_url} alt="" style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 6 }} draggable={false} />}
                        {hasTxt && <span style={{ fontSize: 11, fontWeight: 600, textAlign: 'center', color: isDark ? '#a5b4fc' : '#4f46e5', lineHeight: 1.3, wordBreak: 'break-word' }}>{pair.drag_content}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden" style={{ width: 100 }}>
            <div className="h-full rounded-full bg-indigo-400 transition-all duration-500"
              style={{ width: `${pairs.length > 0 ? (Object.keys(placed).length/pairs.length)*100 : 0}%` }} />
          </div>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">{t('flashcard.dragDrop.progressCount', { done: Object.keys(placed).length, total: pairs.length })}</span>
        </div>
        {Object.keys(placed).length > 0 && (
          <button onClick={() => onSelect({})} className="text-xs text-red-400 hover:text-red-600 dark:hover:text-red-300 font-semibold hover:underline transition-colors">
            🔄 {t('flashcard.dragDrop.resetButton')}
          </button>
        )}
      </div>
    </div>
  );
};

/* ── Hotspot ── */
const HotspotPanel = ({ question, revealed, selection, onSelect }) => {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const regions   = [...(question.hotspot_regions||[])].sort((a,b) => a.order_index - b.order_index);
  const [hovered, setHovered] = useState(null);
  const sel = selection || [];

  // Determine if single or multi-select based on number of correct regions
  const correctCount = regions.filter(r => r.is_correct).length;
  const isSingleSelect = correctCount <= 1;

  const handleClick = (id) => {
    if (revealed) return;
    if (isSingleSelect) {
      // Single select: clicking replaces selection
      onSelect(sel.includes(id) ? [] : [id]);
    } else {
      // Multi select: toggle
      onSelect(sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id]);
    }
  };

  return (
    <div className="space-y-3">
      {!revealed && (
        <p className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 inline-flex items-center gap-1.5 dark:text-amber-300 dark:bg-amber-950/40 dark:border-amber-800/60">
          🎯 {isSingleSelect ? t('flashcard.hotspot.hintSingle') : t('flashcard.hotspot.hintMulti', { count: correctCount })}
          {sel.length > 0 && <span className="ml-1 text-amber-600 dark:text-amber-400">{t('flashcard.hotspot.selectedCount', { count: sel.length })}</span>}
        </p>
      )}
      {question.image_url && (
        <div className="relative rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 select-none shadow-xs">
          <img src={question.image_url} alt={t('flashcard.hotspot.imageAlt')} className="w-full h-auto block" draggable={false} />
          {regions.map(r => {
            const isS = sel.includes(r.id);
            let borderC, bgC;
            if (revealed) {
              if (r.is_correct && isS) { borderC = '#22c55e'; bgC = 'rgba(34,197,94,0.25)'; }
              else if (r.is_correct && !isS) { borderC = '#86efac'; bgC = 'rgba(134,239,172,0.15)'; }
              else if (!r.is_correct && isS) { borderC = '#ef4444'; bgC = 'rgba(239,68,68,0.25)'; }
              else { borderC = 'transparent'; bgC = 'transparent'; }
            } else {
              if (isS) { borderC = '#f59e0b'; bgC = 'rgba(245,158,11,0.2)'; }
              else if (hovered === r.id) { borderC = '#93c5fd'; bgC = 'rgba(147,197,253,0.15)'; }
              else { borderC = 'transparent'; bgC = 'transparent'; }
            }
            return (
              <div key={r.id}
                onClick={() => handleClick(r.id)}
                onMouseEnter={() => setHovered(r.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  position: 'absolute',
                  left: `${r.x}%`, top: `${r.y}%`,
                  width: `${r.width}%`, height: `${r.height}%`,
                  border: `2px solid ${borderC}`,
                  background: bgC,
                  borderRadius: 6,
                  cursor: revealed ? 'default' : 'pointer',
                  transition: 'all 0.15s',
                }}>
                {revealed && r.is_correct && <span className="absolute top-0.5 left-0.5 bg-green-500 text-white text-[9px] font-bold px-1 rounded-sm leading-none">✔</span>}
                {revealed && !r.is_correct && isS && <span className="absolute top-0.5 left-0.5 bg-red-500 text-white text-[9px] font-bold px-1 rounded-sm leading-none">✘</span>}
              </div>
            );
          })}
        </div>
      )}
      {revealed && (
        <div className="flex flex-wrap gap-2 text-[11px]">
          {[
            { k: 'correct-sel', bg: '#22c55e', label: t('flashcard.hotspot.legend.correctSelected'), tc: '#14532d', darkTc: '#86efac', border: '#86efac' },
            { k: 'correct-miss', bg: null, label: t('flashcard.hotspot.legend.correctMissed'), tc: '#15803d', darkTc: '#6ee7b7', border: '#86efac' },
            { k: 'wrong-sel', bg: '#ef4444', label: t('flashcard.hotspot.legend.wrongSelected'), tc: '#7f1d1d', darkTc: '#fca5a5', border: '#fca5a5' },
          ].map(s => (
            <span key={s.k} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold border"
              style={{ background: s.bg ? `${s.bg}15` : 'transparent', color: isDark ? s.darkTc : s.tc, borderColor: s.border }}>
              {s.bg ? <span style={{ width:10,height:10,borderRadius:2,background:s.bg,display:'inline-block' }}/> : <span style={{ width:10,height:10,borderRadius:2,border:`1.5px dashed ${s.border}`,display:'inline-block' }}/>}
              {s.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════
   RESULT BANNER
══════════════════════════════════════ */
const ResultBanner = ({ correct }) => {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  return (
  <div className="flex items-center gap-3.5 px-5 py-4 rounded-2xl border"
    style={{
      background: isDark ? (correct ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)') : (correct ? '#f0fdf4' : '#fef2f2'),
      borderColor: isDark ? (correct ? '#15803d' : '#991b1b') : (correct ? '#86efac' : '#fca5a5'),
    }}>
    <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-xs"
      style={{ background: correct ? '#22c55e' : '#f87171' }}>
      {correct ? <CheckCircle2 className="w-5 h-5 text-white" /> : <XCircle className="w-5 h-5 text-white" />}
    </div>
    <div>
      <p className="text-sm font-bold" style={{ color: isDark ? (correct ? '#86efac' : '#fca5a5') : (correct ? '#14532d' : '#7f1d1d') }}>
        {correct ? t('flashcard.result.correctTitle') : t('flashcard.result.wrongTitle')}
      </p>
      <p className="text-xs mt-0.5" style={{ color: isDark ? (correct ? '#4ade80' : '#f87171') : (correct ? '#16a34a' : '#dc2626') }}>
        {correct ? t('flashcard.result.correctSubtitle') : t('flashcard.result.wrongSubtitle')}
      </p>
    </div>
  </div>
  );
};

/* ══════════════════════════════════════
   SESSION SUMMARY
══════════════════════════════════════ */
const SessionSummary = ({ total, correct, wrong, skipped, onRetryWrong, onRetryAll, onBack }) => {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const grade = pct >= 80
    ? { emoji: '🏆', title: t('flashcard.summary.grades.excellent.title'), sub: t('flashcard.summary.grades.excellent.sub'), barColor: '#f59e0b', glowColor: 'rgba(245,158,11,0.2)' }
    : pct >= 50
    ? { emoji: '👍', title: t('flashcard.summary.grades.good.title'),      sub: t('flashcard.summary.grades.good.sub'),      barColor: '#6366f1', glowColor: 'rgba(99,102,241,0.15)' }
    : { emoji: '💪', title: t('flashcard.summary.grades.needsWork.title'), sub: t('flashcard.summary.grades.needsWork.sub'), barColor: '#94a3b8', glowColor: 'rgba(148,163,184,0.15)' };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-12">
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-[1.75rem] flex items-center justify-center shadow-xl"
          style={{ background: grade.barColor, boxShadow: `0 16px 48px ${grade.glowColor}` }}>
          <Trophy className="w-12 h-12 text-white" />
        </div>
        <div className="absolute -top-2 -right-2 text-3xl leading-none">{grade.emoji}</div>
      </div>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">{grade.title}</h2>
      <p className="text-slate-400 dark:text-slate-500 text-sm mb-8">{grade.sub} · <span className="text-slate-600 dark:text-slate-400 font-medium">{t('flashcard.summary.totalQuestions', { count: total })}</span></p>

      <div className="grid grid-cols-3 gap-3 w-full max-w-xs mb-6">
        {[
          { val: correct, label: t('flashcard.summary.correctLabel'), icon: '✓', bg: '#f0fdf4', darkBg: 'rgba(34,197,94,0.12)', border: '#86efac', darkBorder: '#15803d', tc: '#14532d', darkTc: '#86efac' },
          { val: wrong,   label: t('flashcard.summary.wrongLabel'),   icon: '✗', bg: '#fef2f2', darkBg: 'rgba(239,68,68,0.12)', border: '#fca5a5', darkBorder: '#991b1b', tc: '#7f1d1d', darkTc: '#fca5a5' },
          { val: skipped, label: t('flashcard.summary.skippedLabel'), icon: '⦺', bg: '#f8fafc', darkBg: 'rgba(148,163,184,0.1)', border: '#e2e8f0', darkBorder: '#334155', tc: '#475569', darkTc: '#94a3b8' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border p-4 text-center"
            style={{ background: isDark ? s.darkBg : s.bg, borderColor: isDark ? s.darkBorder : s.border }}>
            <p className="text-2xl font-bold" style={{ color: isDark ? s.darkTc : s.tc }}>{s.val}</p>
            <p className="text-[11px] font-medium mt-0.5" style={{ color: isDark ? s.darkTc : s.tc, opacity: 0.7 }}>{s.icon} {s.label}</p>
          </div>
        ))}
      </div>

      <div className="w-full max-w-xs mb-8">
        <div className="flex justify-between text-xs font-medium text-slate-400 dark:text-slate-500 mb-1.5">
          <span>{t('flashcard.summary.accuracyLabel')}</span>
          <span className="text-slate-700 dark:text-slate-300 font-semibold">{pct}%</span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${pct}%`, background: grade.barColor }} />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5 w-full max-w-xs">
        {wrong > 0 && (
          <button onClick={onRetryWrong}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm text-white transition-all active:scale-[0.97]"
            style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 4px 20px rgba(99,102,241,0.3)' }}>
            <RefreshCw className="w-4 h-4" /> {t('flashcard.summary.retryWrongButton', { count: wrong })}
          </button>
        )}
        <button onClick={onRetryAll}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border font-semibold text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-[0.97]"
          style={{ borderColor: isDark ? '#334155' : '#e2e8f0' }}>
          <RotateCcw className="w-4 h-4" /> {t('flashcard.summary.retryAllButton')}
        </button>
        <button onClick={onBack}
          className="flex items-center justify-center px-4 py-3 rounded-2xl border text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
          style={{ borderColor: isDark ? '#334155' : '#e2e8f0' }}>
          <Home className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════
   QUIZ CARD
══════════════════════════════════════ */
const QuizCard = ({ question, index, total, shuffledAnswers, onResult, onSkip, isReviewPhase }) => {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const [selection, setSelection] = useState(null);
  const [revealed,  setRevealed]  = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);

  const typeCfg = TYPE_CFG[question.question_type] || { bar: '#94a3b8', badge: 'bg-slate-100 text-slate-600 border-slate-200' };
  const typeLabel = t(`flashcard.typeLabels.${question.question_type}`, { defaultValue: question.question_type });

  const handleChoiceSelect = id => {
    if (revealed) return;
    setSelection(id);
    const c = scoreAnswer(question, id);
    setIsCorrect(c); setRevealed(true);
  };

  const handleCheck = () => {
    if (revealed) return;
    const c = scoreAnswer(question, selection);
    setIsCorrect(c); setRevealed(true);
  };

  const canCheck = (() => {
    if (selection === null || selection === undefined) return false;
    switch (question.question_type) {
      case 'multi':     return Array.isArray(selection) && selection.length > 0;
      case 'truefalse': { const s = question.truefalse_statements||[]; return s.length>0 && s.every(x=>selection[x.id]!==undefined); }
      case 'dragdrop':  { const p = question.dragdrop_pairs||[];       return p.length>0 && p.every(x=>selection[x.id]!==undefined); }
      case 'hotspot':   return Array.isArray(selection) && selection.length > 0;
      default:          return Boolean(selection);
    }
  })();

  const progressPct = total > 0 ? ((index) / total) * 100 : 0;

  return (
    <div
      className="rounded-3xl overflow-hidden"
      style={{
        background: isDark ? '#1e293b' : '#ffffff',
        border: `1.5px solid ${isDark ? '#334155' : '#e8edf3'}`,
        boxShadow: '0 4px 24px rgba(15,23,42,0.07), 0 1px 4px rgba(15,23,42,0.04)',
      }}
    >
      {/* ── Header: type badge + counter + progress ── */}
      <div className="px-6 pt-5 pb-5" style={{ borderBottom: `1px solid ${isDark ? '#334155' : '#f1f5f9'}` }}>

        {/* Row: badge + counter */}
        <div className="flex items-center justify-between mb-3">
          {/* Type badge — colored dot + label */}
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: typeCfg.bar }}
            />
            <span
              className={`text-[11px] font-bold uppercase tracking-wider ${typeCfg.badge} px-2.5 py-1 rounded-full border`}
            >
              {typeLabel}
            </span>
            {isReviewPhase && (
              <span
                className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
                style={isDark
                  ? { background: 'rgba(245,158,11,0.15)', color: '#fcd34d', border: '1px solid #92400e' }
                  : { background: '#fffbeb', color: '#92400e', border: '1px solid #fcd34d' }}
              >
                {t('flashcard.quizCard.reviewBadge')}
              </span>
            )}
          </div>

          {/* Counter */}
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium tabular-nums">
            <span className="text-slate-700 dark:text-slate-200 text-sm font-bold">{index + 1}</span>
            <span className="text-slate-400 dark:text-slate-500"> / {total}</span>
          </span>
        </div>

        {/* Progress bar — sits right below the badge row */}
        <div className="h-1 rounded-full overflow-hidden mb-5" style={{ background: isDark ? '#334155' : '#f1f5f9' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${progressPct}%`,
              background: typeCfg.bar,
            }}
          />
        </div>

        {/* Question text — renders HTML formatting */}
        <div
          className="text-[15.5px] font-semibold text-slate-800 dark:text-slate-100 leading-relaxed"
          style={{ fontFamily: 'Inter, sans-serif', wordBreak: 'break-word' }}
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(question.content) }}
        />
        {question.image_url && question.question_type !== 'hotspot' && (
          <img
            src={question.image_url}
            alt={t('flashcard.quizCard.questionImageAlt')}
            className="mt-4 max-h-56 w-full object-contain rounded-2xl border border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-700/40"
          />
        )}
      </div>

      {/* ── Answer area ── */}
      <div className="px-6 py-5 space-y-2.5" style={{ background: isDark ? '#1e293b' : '#fff' }}>
        {question.question_type === 'choice'    && <ChoicePanel    answers={shuffledAnswers} revealed={revealed} selection={selection} onSelect={handleChoiceSelect} />}
        {question.question_type === 'multi'     && <MultiPanel     answers={shuffledAnswers} revealed={revealed} selection={selection} onSelect={setSelection} />}
        {question.question_type === 'truefalse' && <TrueFalsePanel statements={question.truefalse_statements||[]} revealed={revealed} selection={selection} onSelect={setSelection} />}
        {question.question_type === 'dragdrop'  && <DragDropPanel  question={question} revealed={revealed} selection={selection} onSelect={setSelection} />}
        {question.question_type === 'hotspot'   && <HotspotPanel   question={question} revealed={revealed} selection={selection} onSelect={setSelection} />}
      </div>

      {/* ── Result banner ── */}
      {revealed && (
        <div className="px-6 pb-4" style={{ background: isDark ? '#1e293b' : '#fff' }}>
          <ResultBanner correct={isCorrect} />
        </div>
      )}

      {/* ── Action bar ── */}
      <div
        className="px-6 pb-6 pt-4"
        style={{ background: isDark ? '#1e293b' : '#fff', borderTop: `1px solid ${isDark ? '#334155' : '#f1f5f9'}` }}
      >
        <div className="flex items-center gap-3">
          {/* Skip button */}
          {!revealed && (
            <button
              id="fc-skip"
              onClick={onSkip}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold border transition-all duration-200 shrink-0 hover:scale-[1.02] active:scale-[0.97]"
              style={
                isReviewPhase
                  ? (isDark ? { background: 'rgba(245,158,11,0.12)', borderColor: '#92400e', color: '#fcd34d' } : { background: '#fffbeb', borderColor: '#fcd34d', color: '#92400e' })
                  : (isDark ? { background: '#334155', borderColor: '#475569', color: '#cbd5e1' } : { background: '#f8fafc', borderColor: '#e2e8f0', color: '#64748b' })
              }
            >
              <SkipForward className="w-4 h-4" />
              {isReviewPhase ? t('flashcard.quizCard.skipTwice') : t('flashcard.quizCard.skip')}
            </button>
          )}

          {/* Check button (non-choice types) */}
          {!revealed && question.question_type !== 'choice' && (
            <button
              id="fc-action"
              onClick={handleCheck}
              disabled={!canCheck}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200 active:scale-[0.97]"
              style={
                canCheck
                  ? {
                      background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                      color: '#fff',
                      boxShadow: '0 6px 24px rgba(99,102,241,0.35)',
                    }
                  : isDark
                  ? {
                      background: '#334155',
                      color: '#64748b',
                      cursor: 'not-allowed',
                      border: '1.5px solid #475569',
                    }
                  : {
                      background: '#f1f5f9',
                      color: '#94a3b8',
                      cursor: 'not-allowed',
                      border: '1.5px solid #e2e8f0',
                    }
              }
            >
              <Sparkles className="w-4 h-4" />
              {t('flashcard.quizCard.checkAnswer')}
              {canCheck && (
                <kbd className="hidden sm:inline px-1.5 py-0.5 bg-white/20 rounded-sm text-[10px] font-mono">↵</kbd>
              )}
            </button>
          )}

          {/* Next / Result button */}
          {revealed && (
            <button
              id="fc-action"
              onClick={() => onResult(isCorrect)}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm text-white transition-all duration-200 active:scale-[0.97] hover:scale-[1.01]"
              style={
                isCorrect
                  ? {
                      background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                      boxShadow: '0 6px 24px rgba(34,197,94,0.35)',
                    }
                  : {
                      background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                      boxShadow: '0 6px 24px rgba(99,102,241,0.35)',
                    }
              }
            >
              {isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              {index < total - 1 ? t('flashcard.quizCard.nextQuestion') : t('flashcard.quizCard.viewResults')}
              <kbd className="hidden sm:inline px-1.5 py-0.5 bg-white/20 rounded-sm text-[10px] font-mono">→</kbd>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════ */
export const FlashcardPage = () => {
  const { t } = useTranslation();
  const { examId } = useParams();
  const navigate   = useNavigate();
  const { user, isSelfRegistered } = useAuth();
  const { isDark } = useTheme();

  /* ── Access guard ── */
  useEffect(() => {
    if (!isSelfRegistered || !user || !examId) return;
    supabase.rpc('user_can_access_exam', { p_user_id: user.id, p_exam_id: examId })
      .then(({ data: canAccess }) => {
        if (!canAccess) navigate('/flashcard', { replace: true });
      });
  }, [isSelfRegistered, user, examId]);

  const [exam,          setExam]          = useState(null);
  const [allQuestions,  setAllQuestions]  = useState([]);
  const [deck,          setDeck]          = useState([]);
  const [currentIdx,    setCurrentIdx]    = useState(0);
  const [results,       setResults]       = useState([]);
  const [skippedQueue,  setSkippedQueue]  = useState([]);
  const [phase,         setPhase]         = useState('main');
  const [isShuffled,    setIsShuffled]    = useState(false);
  const [showSummary,   setShowSummary]   = useState(false);
  const [showKeyHint,   setShowKeyHint]   = useState(false);
  const [loading,       setLoading]       = useState(true);
  const cardKey = useRef(0);
  const [shuffledPerCard, setShuffledPerCard] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [examRes, qRes] = await Promise.all([
          supabase.from('exams').select('*, exam_levels(label)').eq('id', examId).single(),
          supabase.from('questions').select(`
            id, content, image_url, question_type, order_index,
            answers(id, content, image_url, is_correct, order_index),
            truefalse_statements(id, content, is_true, order_index),
            dragdrop_pairs(id, drag_content, drag_image_url, drop_content, order_index),
            hotspot_regions(id, x, y, width, height, is_correct, label, order_index)
          `).eq('exam_id', examId).order('order_index'),
        ]);
        if (examRes.error) throw examRes.error;
        if (qRes.error)   throw qRes.error;
        setExam(examRes.data);
        setAllQuestions(qRes.data || []);
        buildDeck(qRes.data || [], false);
      } catch (err) { console.error(err); navigate('/flashcard'); }
      finally { setLoading(false); }
    })();
  }, [examId]);

  const computePerCard = qs => qs.map(q => ({
    answers:     shuffleArr([...(q.answers||[]).sort((a,b) => a.order_index - b.order_index)]),
    dropOptions: shuffleArr([...new Set((q.dragdrop_pairs||[]).map(p => p.drop_content))]),
  }));

  const buildDeck = (questions, shuffled) => {
    const d = shuffled ? shuffleArr(questions) : [...questions];
    setDeck(d); setShuffledPerCard(computePerCard(d));
    setCurrentIdx(0); setResults([]); setSkippedQueue([]);
    setPhase('main'); setShowSummary(false); cardKey.current += 1;
  };

  const startReviewPhase = skipped => {
    const d = isShuffled ? shuffleArr(skipped) : skipped;
    setDeck(d); setShuffledPerCard(computePerCard(d));
    setCurrentIdx(0); setPhase('review'); cardKey.current += 1;
  };

  useEffect(() => {
    const onKey = e => {
      if (showSummary) return;
      if (['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)) return;
      if (e.key === 'ArrowRight' || e.key === 'Enter') document.getElementById('fc-action')?.click();
      if ((e.key === 's' || e.key === 'S') && !e.ctrlKey) document.getElementById('fc-skip')?.click();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showSummary]);

  const handleResult = useCallback(correct => {
    const qId = deck[currentIdx]?.id;
    setResults(prev => [...prev, { qId, correct, skipped: false }]);
    cardKey.current += 1;
    if (currentIdx < deck.length - 1) setCurrentIdx(i => i + 1);
    else if (phase === 'main' && skippedQueue.length > 0) startReviewPhase(skippedQueue);
    else setShowSummary(true);
  }, [deck, currentIdx, phase, skippedQueue]);

  const handleSkip = useCallback(() => {
    const currentQ = deck[currentIdx];
    cardKey.current += 1;
    if (phase === 'main') {
      setSkippedQueue(prev => [...prev, currentQ]);
      setResults(prev => [...prev, { qId: currentQ.id, correct: false, skipped: true, pendingReview: true }]);
    } else {
      setResults(prev => [...prev, { qId: currentQ.id, correct: false, skipped: true, pendingReview: false }]);
    }
    if (currentIdx < deck.length - 1)               setCurrentIdx(i => i + 1);
    else if (phase === 'main' && skippedQueue.length > 0)  startReviewPhase([...skippedQueue, currentQ]);
    else if (phase === 'main' && skippedQueue.length === 0) startReviewPhase([currentQ]);
    else setShowSummary(true);
  }, [deck, currentIdx, phase, skippedQueue]);

  const toggleShuffle = () => { const n = !isShuffled; setIsShuffled(n); buildDeck(allQuestions, n); };
  const retryWrong = () => { const ids = results.filter(r => !r.correct).map(r => r.qId); buildDeck(allQuestions.filter(q => ids.includes(q.id)), isShuffled); };
  const retryAll   = () => buildDeck(allQuestions, isShuffled);

  const correctCount = results.filter(r =>  r.correct).length;
  const wrongCount   = results.filter(r => !r.correct && !r.skipped).length;
  const skippedCount = results.filter(r =>  r.skipped && !r.pendingReview).length;
  const pendingCount = phase === 'main' ? skippedQueue.length : 0;
  const progress     = deck.length > 0 ? (currentIdx / deck.length) * 100 : 0;
  const examLabel    = exam?.exam_levels?.label || '';

  // Use the same page-bg as rest of site
  const BG = isDark ? '#0f172a' : 'linear-gradient(160deg,#f0f6ff 0%,#e8f0fe 40%,#f1f5fb 100%)';

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-950/40 animate-pulse" />
        <p className="text-sm text-slate-400 dark:text-slate-500">{t('flashcard.loading')}</p>
      </div>
    </div>
  );

  if (!exam || deck.length === 0) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
      <div className="text-center space-y-3">
        <BookOpen className="w-14 h-14 text-slate-200 dark:text-slate-700 mx-auto" />
        <p className="text-slate-500 dark:text-slate-400 font-medium">{t('flashcard.noQuestions')}</p>
        <Link to="/flashcard" className="text-indigo-600 dark:text-indigo-400 text-sm hover:underline">← {t('flashcard.chooseAnother')}</Link>
      </div>
    </div>
  );

  const currentQ       = deck[currentIdx];
  const currentShuffle = shuffledPerCard[currentIdx] || { answers: [], dropOptions: [] };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: BG, fontFamily: 'Inter, sans-serif' }}>

      {/* Progress line */}
      <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-slate-200 dark:bg-slate-700">
        <div className="h-full bg-indigo-500 transition-all duration-500"
          style={{ width: showSummary ? '100%' : `${progress}%` }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 shadow-xs">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link to="/flashcard" className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:text-slate-500 dark:hover:text-slate-300 dark:hover:bg-slate-700 transition-all shrink-0">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{exam.title}</p>
            {examLabel && <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{examLabel}</p>}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {results.length > 0 && (
              <div className="hidden sm:flex items-center gap-1.5">
                <span className="text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full dark:text-green-400 dark:bg-green-950/40 dark:border-green-800/60">✓ {correctCount}</span>
                <span className="text-xs font-semibold text-red-500 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full dark:text-red-400 dark:bg-red-950/40 dark:border-red-800/60">✗ {wrongCount}</span>
              </div>
            )}
            <button onClick={toggleShuffle}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all
                ${isShuffled ? 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60' : 'border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700'}`}>
              <Shuffle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('flashcard.shuffleButton')}</span>
            </button>
            <button onClick={() => setShowKeyHint(v => !v)}
              className={`p-2 rounded-xl border transition-all ${showKeyHint ? 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600' : 'border-slate-200 text-slate-400 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-500 dark:hover:bg-slate-700'}`}>
              <Keyboard className="w-4 h-4" />
            </button>
          </div>
        </div>
        {showKeyHint && (
          <div className="border-t border-slate-100 bg-slate-50 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-700/40">
            <div className="max-w-2xl mx-auto flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
              {[['Enter / →', t('flashcard.keyHints.checkNext')],['S', t('flashcard.keyHints.skip')]].map(([k,d]) => (
                <div key={k} className="flex items-center gap-2">
                  <kbd className="px-2 py-0.5 bg-white border border-slate-200 rounded-sm font-mono text-[10px] text-slate-600 shadow-xs dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300">{k}</kbd>
                  <span>{d}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Body */}
      <div className="flex-1 flex flex-col">
        {showSummary ? (
          <SessionSummary
            total={results.length} correct={correctCount} wrong={wrongCount} skipped={skippedCount}
            onRetryWrong={retryWrong} onRetryAll={retryAll} onBack={() => navigate('/flashcard')}
          />
        ) : (
          <div className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-5 flex flex-col gap-4">

            {/* Meta bar */}
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <span><span className="text-slate-800 dark:text-slate-200 font-bold text-sm">{currentIdx + 1}</span> / {deck.length}</span>
                {phase === 'main' && pendingCount > 0 && (
                  <span className="text-amber-700 font-semibold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-[11px] dark:text-amber-300 dark:bg-amber-950/40 dark:border-amber-800/60">
                    ⦺ {t('flashcard.pendingReview', { count: pendingCount })}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-green-600 dark:text-green-400 font-semibold">✓ {correctCount}</span>
                <span className="text-red-500 dark:text-red-400 font-semibold">✗ {wrongCount}</span>
                {skippedCount > 0 && <span className="text-slate-400 dark:text-slate-500">⦺ {skippedCount}</span>}
                <button onClick={() => setShowSummary(true)}
                  className="text-slate-400 hover:text-slate-600 font-medium px-2 py-1 rounded-lg hover:bg-slate-100 dark:text-slate-500 dark:hover:text-slate-300 dark:hover:bg-slate-700 transition-all">
                  {t('flashcard.finishButton')}
                </button>
              </div>
            </div>

            {/* Review banner */}
            {phase === 'review' && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border-2 border-amber-200 bg-amber-50 dark:border-amber-800/60 dark:bg-amber-950/30">
                <div className="w-8 h-8 rounded-xl bg-amber-400 flex items-center justify-center shrink-0">
                  <RotateCcw className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">{t('flashcard.reviewBanner.title')}</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">{t('flashcard.reviewBanner.remaining', { count: deck.length - currentIdx })}</p>
                </div>
              </div>
            )}

            {/* Quiz card */}
            <QuizCard
              key={`${cardKey.current}-${currentIdx}`}
              question={currentQ} index={currentIdx} total={deck.length}
              shuffledAnswers={currentShuffle.answers} shuffledDropOptions={currentShuffle.dropOptions}
              onResult={handleResult} onSkip={handleSkip} isReviewPhase={phase === 'review'}
            />
          </div>
        )}
      </div>
    </div>
  );
};
