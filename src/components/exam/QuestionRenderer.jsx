import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ZoomableImage } from '../shared/ImageLightbox';
import { sanitizeHtml } from '../../utils/sanitizeHtml';

/* ─── Answer option letters ─── */
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

/* ══════════════════════════════════════════════════════════
   Choice / Multi ─ redesigned with letter prefix
══════════════════════════════════════════════════════════ */
const AnswerOption = ({ ans, idx, selected, onSelect, type }) => {
  const isSelected = selected?.includes(ans.id);
  const letter     = LETTERS[idx] ?? String(idx + 1);

  return (
    <label
      style={{
        animation:  `optionIn 0.28s ease-out ${idx * 0.055}s both`,
        background: isSelected
          ? 'linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)'
          : undefined,
      }}
      className={`
        group flex items-center gap-4 p-4 rounded-2xl cursor-pointer
        transition-all duration-200 select-none
        ${isSelected
          ? 'border-2 border-indigo-400 shadow-lg shadow-indigo-100/70'
          : 'border-2 border-gray-100 bg-white hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-50 dark:border-slate-700/60 dark:bg-slate-800 dark:hover:border-indigo-800/60'
        }
      `}
    >
      {/* Letter / Check badge */}
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-extrabold shrink-0 transition-all duration-200 ${
          isSelected ? '' : 'bg-gray-100 text-gray-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 dark:bg-slate-700 dark:text-slate-500 dark:group-hover:bg-indigo-900/40 dark:group-hover:text-indigo-300'
        }`}
        style={isSelected
          ? { background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#fff', boxShadow: '0 4px 12px rgba(99,102,241,0.35)' }
          : undefined
        }
      >
        {isSelected && type === 'multi' ? <Check className="w-4 h-4" /> : letter}
      </div>

      {/* Answer content */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {ans.image_url && (
          <ZoomableImage
            src={ans.image_url}
            alt=""
            className="h-14 w-20 object-contain rounded-lg border border-gray-100 shrink-0 bg-white dark:border-slate-700/60 dark:bg-slate-800"
          />
        )}
        {/* Render HTML from RichTextEditor */}
        <div
          className={`text-sm leading-relaxed transition-colors ${
            isSelected ? 'text-indigo-900 font-semibold' : 'text-gray-700 dark:text-slate-300'
          }`}
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(ans.content) }}
        />
      </div>

      {/* Native input (visually hidden) */}
      <input
        type={type === 'multi' ? 'checkbox' : 'radio'}
        name={`q-${ans.question_id}`}
        value={ans.id}
        checked={isSelected || false}
        onChange={onSelect}
        onKeyDown={(e) => {
          // Prevent arrow keys from changing the selected answer;
          // arrow key navigation is handled at the ExamPage level.
          if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
          }
        }}
        className="sr-only"
      />
    </label>
  );
};


/* ══════════════════════════════════════════════════════════
   DragItem Card (unchanged functionally, slight polish)
══════════════════════════════════════════════════════════ */
const DragItemCard = ({ pair, dragging, onDragStart, onDragEnd, inZone = false, isSelected = false }) => {
  const isBeingDragged = dragging?.id === pair.id;
  const hasImage = !!pair.drag_image_url;
  const hasText  = !!pair.drag_content;
  const isLong   = hasText && pair.drag_content.length > 20;

  return (
    <div
      draggable
      onDragStart={() => onDragStart(pair)}
      onDragEnd={onDragEnd}
      style={{ minWidth: isLong ? '130px' : hasImage ? '100px' : '80px', maxWidth: '200px' }}
      className={`flex flex-col items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl border-2 cursor-grab active:cursor-grabbing select-none transition-all ${
        isBeingDragged
          ? 'opacity-40 scale-95 shadow-none'
          : isSelected
            ? 'border-amber-400 bg-amber-50 shadow-md ring-2 ring-amber-300 ring-offset-1 scale-105'
            : inZone
              ? 'border-indigo-300 bg-white dark:bg-slate-800 shadow-xs hover:shadow-md hover:border-indigo-400 hover:-translate-y-0.5'
              : 'border-blue-200 bg-white dark:bg-slate-800 shadow-xs hover:shadow-md hover:border-blue-400 hover:-translate-y-0.5'
      }`}
    >
      {hasImage && (
        <div className="w-20 h-20 sm:w-28 sm:h-28 flex items-center justify-center p-1.5 bg-white rounded-lg border border-gray-100 shrink-0 shadow-xs w-full dark:bg-slate-800 dark:border-slate-700/60">
          <ZoomableImage 
            src={pair.drag_image_url} 
            alt="" 
            wrapperClassName="relative flex items-center justify-center w-full h-full group cursor-zoom-in"
            className="max-w-full max-h-full object-contain" 
          />
        </div>
      )}
      {hasText && (
        <span className={`text-xs sm:text-sm font-bold text-center leading-snug wrap-break-word w-full ${
          isSelected ? 'text-amber-800' : inZone ? 'text-indigo-700' : 'text-gray-700 dark:text-slate-300'
        }`}>
          {pair.drag_content}
        </span>
      )}
    </div>
  );
};


/* ══════════════════════════════════════════════════════════
   Drag-Drop Question
══════════════════════════════════════════════════════════ */
const DragDropQuestion = ({ question, currentAnswer, onChange }) => {
  const { t } = useTranslation();
  const pairs = [...(question.dragdrop_pairs || [])].sort((a, b) => a.order_index - b.order_index);
  const [dragging,     setDragging]     = useState(null);
  const [dragOverZone, setDragOverZone] = useState(null);
  const [touchSelected, setTouchSelected] = useState(null);

  const dropZones = [];
  const seen = new Set();
  for (const p of pairs) {
    if (!seen.has(p.drop_content)) {
      seen.add(p.drop_content);
      dropZones.push({ label: p.drop_content, image_url: p.drop_image_url });
    }
  }

  const placed    = currentAnswer || {};
  const poolItems = pairs.filter(p => !placed[p.id]);

  const placeItem    = (pairId, zone) => { const n = { ...placed, [pairId]: zone };   onChange(Object.keys(n).length > 0 ? n : undefined); };
  const returnToPool = (pairId)        => { const n = { ...placed }; delete n[pairId]; onChange(Object.keys(n).length > 0 ? n : undefined); };

  const handleDragStart  = (pair) => setDragging(pair);
  const handleDragEnd    = ()     => { setDragging(null); setDragOverZone(null); };
  const handleDropOnZone = (e, z) => { e.preventDefault(); if (!dragging) return; placeItem(dragging.id, z); setDragging(null); setDragOverZone(null); };
  const handleDropOnPool = (e)    => { e.preventDefault(); if (!dragging) return; returnToPool(dragging.id); setDragging(null); setDragOverZone(null); };

  const handleItemClick  = (pair) => setTouchSelected(prev => prev?.id === pair.id ? null : pair);
  const handleZoneClick  = (zone) => { if (!touchSelected) return; placeItem(touchSelected.id, zone); setTouchSelected(null); };

  const zoneColors = [
    { ring: 'border-violet-400',  bg: 'bg-violet-50',  header: 'bg-violet-100 text-violet-800 border-violet-200',  dot: 'bg-violet-400'  },
    { ring: 'border-emerald-400', bg: 'bg-emerald-50', header: 'bg-emerald-100 text-emerald-800 border-emerald-200', dot: 'bg-emerald-400' },
    { ring: 'border-rose-400',    bg: 'bg-rose-50',    header: 'bg-rose-100 text-rose-800 border-rose-200',         dot: 'bg-rose-400'    },
    { ring: 'border-amber-400',   bg: 'bg-amber-50',   header: 'bg-amber-100 text-amber-800 border-amber-200',       dot: 'bg-amber-400'   },
  ];

  return (
    <div className="space-y-5">
      {/* Instruction */}
      <div className="flex items-start gap-3 bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl px-4 py-3 dark:border-blue-800/60">
        <span className="text-lg mt-0.5 shrink-0">🔀</span>
        <div>
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">{t('questionRenderer.dragdrop.title')}</p>
          <p
            className="text-xs text-blue-600 mt-0.5 dark:text-blue-300"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(t('questionRenderer.dragdrop.hint')) }}
          />
        </div>
      </div>

      {/* Pool */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOverZone('pool'); }}
        onDragLeave={() => setDragOverZone(null)}
        onDrop={handleDropOnPool}
        onClick={() => setTouchSelected(null)}
        className={`rounded-2xl border-2 border-dashed p-4 transition-all duration-200 ${
          dragOverZone === 'pool'
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/40 shadow-inner'
            : 'border-blue-200 dark:border-blue-800/60 bg-linear-to-br from-slate-50 to-blue-50/30'
        }`}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <p className="text-[11px] font-bold text-blue-500 uppercase tracking-widest">{t('questionRenderer.dragdrop.poolLabel')}</p>
          <span className="ml-auto text-[11px] text-gray-400 font-medium dark:text-slate-500">{t('questionRenderer.dragdrop.cardsLeft', { count: poolItems.length })}</span>
        </div>
        <div className="flex flex-wrap gap-2.5 min-h-[60px]">
          {poolItems.length === 0 ? (
            <div className="w-full flex items-center justify-center gap-2 py-3">
              <span className="text-green-500">✅</span>
              <p className="text-sm text-gray-400 font-medium dark:text-slate-500">{t('questionRenderer.dragdrop.allPlaced')}</p>
            </div>
          ) : (
            poolItems.map(pair => (
              <div key={pair.id} className="flex flex-col items-center" onClick={e => { e.stopPropagation(); handleItemClick(pair); }}>
                <DragItemCard pair={pair} dragging={dragging} onDragStart={handleDragStart} onDragEnd={handleDragEnd} isSelected={touchSelected?.id === pair.id} />
                {touchSelected?.id === pair.id && (
                  <div className="mt-1.5 flex items-center gap-1 text-[10px] text-amber-600 font-bold">
                    <span className="animate-bounce">👆</span>
                    <span>{t('questionRenderer.dragdrop.selectZoneBelow')}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Drop zones */}
      <div className={`grid gap-4 ${dropZones.length <= 2 ? 'grid-cols-1 sm:grid-cols-2' : dropZones.length === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
        {dropZones.map((zone, zoneIdx) => {
          const zoneItems = pairs.filter(p => placed[p.id] === zone.label);
          const isOver    = dragOverZone === zone.label;
          const isTarget  = !!touchSelected;
          const color     = zoneColors[zoneIdx % zoneColors.length];
          return (
            <div
              key={zone.label}
              onDragOver={e => { e.preventDefault(); setDragOverZone(zone.label); }}
              onDragLeave={() => setDragOverZone(null)}
              onDrop={e => handleDropOnZone(e, zone.label)}
              onClick={() => handleZoneClick(zone.label)}
              className={`rounded-2xl border-2 overflow-hidden transition-all duration-200 cursor-pointer ${
                isOver   ? `${color.ring} ${color.bg} shadow-lg scale-[1.02]`
                : isTarget ? 'border-indigo-300 bg-indigo-50/30 shadow-md ring-2 ring-indigo-200 ring-offset-1'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-xs dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600'
              }`}
            >
              <div className={`px-4 py-3 border-b flex items-center gap-2 transition-colors ${isOver ? color.header : 'border-gray-100 bg-linear-to-r from-gray-50 to-white dark:border-slate-700/60'}`}>
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isOver ? color.dot : 'bg-gray-300'}`} />
                {zone.image_url && <img src={zone.image_url} alt="" className="h-8 w-auto object-contain shrink-0" />}
                <span className={`text-sm font-bold leading-snug ${isOver ? '' : 'text-gray-800 dark:text-slate-100'}`}>{zone.label}</span>
                <span className="ml-auto text-[11px] font-semibold text-gray-400 dark:text-slate-500">{zoneItems.length > 0 && t('questionRenderer.dragdrop.cardsCount', { count: zoneItems.length })}</span>
              </div>
              <div className="p-3 flex flex-wrap gap-2 min-h-[90px] items-start content-start">
                {zoneItems.length === 0 ? (
                  <div className="w-full flex flex-col items-center justify-center gap-1 py-4 text-gray-300 dark:text-slate-500">
                    <span className="text-2xl">{isOver ? '⬇️' : '📥'}</span>
                    <span className="text-xs font-medium">{isOver ? t('questionRenderer.dragdrop.dropHere') : t('questionRenderer.dragdrop.dragHere')}</span>
                  </div>
                ) : (
                  zoneItems.map(pair => (
                    <div key={pair.id} title={t('questionRenderer.dragdrop.returnToPool')} onClick={e => { e.stopPropagation(); returnToPool(pair.id); }}>
                      <DragItemCard pair={pair} dragging={dragging} onDragStart={handleDragStart} onDragEnd={handleDragEnd} inZone />
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden" style={{ width: '120px' }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pairs.length > 0 ? (Object.keys(placed).length / pairs.length) * 100 : 0}%`, background: 'linear-gradient(90deg, #6366F1, #8B5CF6)' }} />
          </div>
          <span className="text-xs text-gray-500 font-medium dark:text-slate-500">{t('questionRenderer.dragdrop.cardsCount', { count: `${Object.keys(placed).length}/${pairs.length}` })}</span>
        </div>
        {Object.keys(placed).length > 0 && (
          <button type="button" onClick={() => onChange(undefined)} className="text-xs text-red-400 hover:text-red-600 font-semibold flex items-center gap-1 hover:underline transition-colors dark:hover:text-red-300">
            {t('questionRenderer.dragdrop.reset')}
          </button>
        )}
      </div>
    </div>
  );
};


/* ══════════════════════════════════════════════════════════
   True / False Question (polished)
══════════════════════════════════════════════════════════ */
const TrueFalseQuestion = ({ question, currentAnswer, onChange }) => {
  const { t } = useTranslation();
  const sortedStatements = [...(question.truefalse_statements || [])].sort((a, b) => a.order_index - b.order_index);
  const response       = currentAnswer || {};
  const handleSelect   = (stmtId, value) => onChange({ ...response, [stmtId]: value });
  const answeredCount  = Object.keys(response).length;
  const total          = sortedStatements.length;
  const progress       = total > 0 ? (answeredCount / total) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs" style={{ background: 'linear-gradient(135deg, #14b8a6, #10b981)' }}>
            <span className="text-white text-[10px] font-black tracking-tight">T/F</span>
          </div>
          <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">
            {t('questionRenderer.truefalse.instructionPre')} <span className="text-emerald-600 font-bold">{t('questionRenderer.truefalse.true')}</span> {t('questionRenderer.truefalse.instructionOr')} <span className="text-red-500 font-bold">{t('questionRenderer.truefalse.false')}</span> {t('questionRenderer.truefalse.instructionPost')}
          </p>
        </div>
        <span className={`text-xs font-bold px-3 py-1 rounded-full shrink-0 transition-all ${
          answeredCount === total && total > 0
            ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800'
            : 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-400'
        }`}>
          {answeredCount}/{total}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #14b8a6, #10b981)' }}
        />
      </div>

      {/* Statements */}
      <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-xs dark:border-slate-700 dark:bg-slate-800">
        {/* Column headers */}
        <div className="flex items-center bg-gray-50 border-b border-gray-200 px-4 py-2.5 gap-3 dark:bg-slate-700/40 dark:border-slate-700">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest w-5 text-center shrink-0 dark:text-slate-500">{t('questionRenderer.truefalse.columnIndex')}</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex-1 dark:text-slate-500">{t('questionRenderer.truefalse.columnStatement')}</span>
          <div className="flex gap-1.5 shrink-0">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest w-16 text-center dark:text-emerald-400">{t('questionRenderer.truefalse.true')}</span>
            <span className="text-[10px] font-bold text-red-500  uppercase tracking-widest w-16 text-center dark:text-red-400">{t('questionRenderer.truefalse.false')}</span>
          </div>
        </div>

        {sortedStatements.map((stmt, idx) => {
          const sel      = response[stmt.id];
          const answered = sel !== undefined;
          const isTrue   = sel === true;
          const isFalse  = sel === false;
          return (
            <div
              key={stmt.id}
              className={`flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 dark:border-slate-700/60 last:border-b-0 transition-colors duration-200 ${
                !answered ? 'bg-white hover:bg-gray-50/70 dark:bg-slate-800 dark:hover:bg-slate-700/40'
                : isTrue  ? 'bg-emerald-50/60 dark:bg-emerald-950/20'
                : 'bg-red-50/60 dark:bg-red-950/20'
              }`}
            >
              {/* Index badge */}
              <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-bold shrink-0 transition-all ${
                !answered ? 'bg-gray-100 text-gray-400 dark:bg-slate-700 dark:text-slate-500'
                : isTrue  ? 'bg-emerald-200 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                : 'bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-300'
              }`}>
                {idx + 1}
              </span>

              {/* Statement */}
              <div
                className={`flex-1 text-sm leading-relaxed min-w-0 transition-colors ${
                  !answered ? 'text-gray-700 dark:text-slate-300'
                  : isTrue  ? 'text-emerald-900 dark:text-emerald-300 font-medium'
                  : 'text-red-900 dark:text-red-300 font-medium'
                }`}
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(stmt.content) }}
              />

              {/* Buttons */}
              <div className="flex gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleSelect(stmt.id, true)}
                  className={`w-16 h-9 rounded-xl text-xs font-bold border-2 transition-all duration-200 ${
                    isTrue
                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-200 scale-105'
                      : 'bg-white border-gray-200 text-gray-400 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-500 dark:hover:border-emerald-600 dark:hover:text-emerald-400 dark:hover:bg-emerald-950/30'
                  }`}
                >
                  {isTrue ? `✔ ${t('questionRenderer.truefalse.true')}` : t('questionRenderer.truefalse.true')}
                </button>
                <button
                  type="button"
                  onClick={() => handleSelect(stmt.id, false)}
                  className={`w-16 h-9 rounded-xl text-xs font-bold border-2 transition-all duration-200 ${
                    isFalse
                      ? 'bg-red-500 border-red-500 text-white shadow-md shadow-red-200 scale-105'
                      : 'bg-white border-gray-200 text-gray-400 hover:border-red-400 hover:text-red-600 hover:bg-red-50 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-500 dark:hover:border-red-600 dark:hover:text-red-400 dark:hover:bg-red-950/30'
                  }`}
                >
                  {isFalse ? `✘ ${t('questionRenderer.truefalse.false')}` : t('questionRenderer.truefalse.false')}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion banner */}
      {answeredCount === total && total > 0 && (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-linear-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl dark:from-emerald-950/30 dark:to-teal-950/30 dark:border-emerald-800/50">
          <span className="text-emerald-600 text-sm shrink-0">✅</span>
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{t('questionRenderer.truefalse.allDone', { total })}</p>
        </div>
      )}
    </div>
  );
};


/* ══════════════════════════════════════════════════════════
   Hotspot Question — regions shown with teacher-chosen colors
══════════════════════════════════════════════════════════ */
const hexToRgba = (hex, alpha) => {
  if (!hex || hex.length < 7) return `rgba(99,102,241,${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

const HotspotQuestion = ({ question, currentAnswer, onChange }) => {
  const { t } = useTranslation();
  const sortedRegions = [...(question.hotspot_regions || [])].sort((a, b) => a.order_index - b.order_index);
  const isMulti       = question.hotspot_multi;
  const selected      = currentAnswer || [];

  const handleRegionClick = (regionId) => {
    if (isMulti) {
      const next = selected.includes(regionId)
        ? selected.filter(id => id !== regionId)
        : [...selected, regionId];
      onChange(next.length > 0 ? next : undefined);
    } else {
      onChange(selected[0] === regionId ? undefined : [regionId]);
    }
  };

  const [hoveredId, setHoveredId] = React.useState(null);
  // NOTE: deliberately not reading region.is_correct here — this component renders
  // during live exam-taking (ExamPage/MockExamPage), and the questions fetch for
  // those pages no longer selects is_correct at all (see docs/DATABASE_SCHEMA.md
  // "Bẫy thường gặp"). Any UI that reveals how many regions are correct before
  // submit is itself a leak, independent of whether the field is in the payload.
  const selectedCount = selected.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs" style={{ background: 'linear-gradient(135deg, #F59E0B, #F97316)' }}>
            <span className="text-white text-sm">🎯</span>
          </div>
          <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">
            {isMulti
              ? <><span className="text-orange-600 font-bold">{t('questionRenderer.hotspot.instructionMultiPrefix')}</span> {t('questionRenderer.hotspot.instructionSuffix')}</>
              : <><span className="text-orange-600 font-bold">{t('questionRenderer.hotspot.instructionSinglePrefix')}</span> {t('questionRenderer.hotspot.instructionSuffix')}</>
            }
          </p>
        </div>
        {isMulti && selectedCount > 0 && (
          <span className="text-xs font-bold px-3 py-1 rounded-full shrink-0 bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
            {selectedCount}
          </span>
        )}
      </div>

      {/* Image with hotspot overlay */}
      <div className="relative max-w-3xl mx-auto rounded-2xl overflow-hidden border-2 border-gray-200 bg-gray-50 shadow-xs select-none dark:border-slate-700 dark:bg-slate-800">
        {question.image_url ? (
          <>
            {/* IMPORTANT: img has w-full h-auto (no max-height, no object-fit).
                The rendered image fills exactly the container width with correct
                aspect ratio — zero letterboxing. This matches the Editor layout
                so percentages line up perfectly 1:1. */}
            <img
              src={question.image_url}
              alt={t('questionRenderer.hotspot.imageAlt')}
              className="w-full h-auto block"
              draggable={false}
            />
            {/* The regions use percentage coords which will map exactly onto the image pixels */}
            {sortedRegions.map((region) => {
              const color      = region.color || '#6366F1';
              const isSelected = selected.includes(region.id);
              const isHovered  = hoveredId === region.id;
              return (
                <div
                  key={region.id}
                  onClick={() => handleRegionClick(region.id)}
                  onMouseEnter={() => setHoveredId(region.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    left:        `${region.x}%`,
                    top:         `${region.y}%`,
                    width:       `${region.width}%`,
                    height:      `${region.height}%`,
                    borderColor: color,
                    background:  isSelected
                      ? hexToRgba(color, 0.32)
                      : isHovered
                        ? hexToRgba(color, 0.18)
                        : hexToRgba(color, 0.08),
                    boxShadow: isSelected ? `inset 0 0 0 2px ${color}, 0 0 0 2px ${hexToRgba(color, 0.3)}` : 'none',
                  }}
                  className="absolute border-2 transition-all duration-150 cursor-pointer rounded-xs"
                >
                  {/* Number badge */}
                  <span
                    className="absolute top-0.5 left-0.5 text-[9px] font-bold px-1 py-0.5 rounded-sm leading-none text-white"
                    style={{ background: color }}
                  >
                    {sortedRegions.indexOf(region) + 1}
                  </span>
                  {/* Selected checkmark */}
                  {isSelected && (
                    <span
                      className="absolute top-0.5 right-0.5 text-[10px] font-bold px-1 py-0.5 rounded-full leading-none text-white"
                      style={{ background: color }}
                    >
                      ✓
                    </span>
                  )}
                </div>
              );
            })}
            {selected.length === 0 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none">
                <div className="bg-black/60 backdrop-blur-sm text-white text-xs px-4 py-2 rounded-xl flex items-center gap-2">
                  <span>🎯</span>
                  {isMulti
                    ? `${t('questionRenderer.hotspot.instructionMultiPrefix')} ${t('questionRenderer.hotspot.instructionSuffix')}`
                    : `${t('questionRenderer.hotspot.instructionSinglePrefix')} ${t('questionRenderer.hotspot.instructionSuffix')}`}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-48 text-gray-400 dark:text-slate-500">{t('questionRenderer.hotspot.imageNotLoaded')}</div>
        )}
      </div>

      {selected.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-orange-50 border border-orange-200 rounded-xl dark:bg-orange-950/30 dark:border-orange-800/50">
          <span className="text-orange-500">🎯</span>
          <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
            {t('questionRenderer.hotspot.selectedCount', { count: selected.length })}
          </p>
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="ml-auto text-xs text-orange-400 hover:text-orange-600 dark:text-orange-500 dark:hover:text-orange-300 font-semibold flex items-center gap-1"
          >
            {t('questionRenderer.hotspot.reset')}
          </button>
        </div>
      )}
    </div>
  );
};


/* ══════════════════════════════════════════════════════════
   Main Renderer
══════════════════════════════════════════════════════════ */
const QuestionRendererImpl = ({ question, currentAnswer, onChange }) => {
  const { t } = useTranslation();
  if (!question) return null;

  const handleChoiceChange = (ansId)   => onChange([ansId]);
  const handleMultiChange  = (e, ansId) => {
    const prev = currentAnswer || [];
    const next = e.target.checked ? [...prev, ansId] : prev.filter(id => id !== ansId);
    onChange(next.length > 0 ? next : undefined);
  };

  const sortedAnswers = [...(question.answers || [])].sort((a, b) => a.order_index - b.order_index);

  return (
    <div className="space-y-5">
      {/* ── Question stem ── */}
      <div className="space-y-3">
        <div className="w-10 h-0.5 rounded-full" style={{ background: 'linear-gradient(90deg, #6366F1, #8B5CF6)' }} />
        {/* Render HTML content (supports bold, color, underline from RichTextEditor) */}
        <div
          className="text-[1.05rem] font-semibold text-gray-900 dark:text-slate-100 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(question.content) }}
        />
        {question.image_url && question.question_type !== 'hotspot' && (
          <ZoomableImage
            src={question.image_url}
            alt={t('questionRenderer.questionImageAlt')}
            className="max-h-64 rounded-xl shadow-xs border border-gray-200 object-contain bg-gray-50 dark:border-slate-700 dark:bg-slate-800"
          />
        )}
      </div>

      {/* ── Answers ── */}
      <div className="space-y-2.5">

        {/* Single choice */}
        {question.question_type === 'choice' &&
          sortedAnswers.map((ans, idx) => (
            <AnswerOption
              key={ans.id}
              ans={{ ...ans, question_id: question.id }}
              idx={idx}
              selected={currentAnswer}
              type="choice"
              onSelect={() => handleChoiceChange(ans.id)}
            />
          ))
        }

        {/* Multiple choice */}
        {question.question_type === 'multi' && (
          <>
            <p className="text-xs text-violet-700 bg-violet-50 border border-violet-200 rounded-xl px-3 py-2 inline-flex items-center gap-1.5 dark:text-violet-300 dark:bg-violet-950/30 dark:border-violet-800/50">
              {t('questionRenderer.multiHint')}
            </p>
            {sortedAnswers.map((ans, idx) => (
              <AnswerOption
                key={ans.id}
                ans={{ ...ans, question_id: question.id }}
                idx={idx}
                selected={currentAnswer}
                type="multi"
                onSelect={(e) => handleMultiChange(e, ans.id)}
              />
            ))}
          </>
        )}

        {/* Drag-drop */}
        {question.question_type === 'dragdrop' && (
          <DragDropQuestion question={question} currentAnswer={currentAnswer} onChange={onChange} />
        )}

        {/* True / False */}
        {question.question_type === 'truefalse' && (
          <TrueFalseQuestion question={question} currentAnswer={currentAnswer} onChange={onChange} />
        )}

        {/* Hotspot */}
        {question.question_type === 'hotspot' && (
          <HotspotQuestion question={question} currentAnswer={currentAnswer} onChange={onChange} />
        )}

      </div>

      {/* Global animation keyframes */}
      <style>{`
        @keyframes optionIn {
          from { opacity: 0; transform: translateX(-10px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export const QuestionRenderer = React.memo(QuestionRendererImpl);
