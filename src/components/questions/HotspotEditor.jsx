import { useRef, useState, useCallback } from "react";
import { useTranslation } from 'react-i18next';
import { Trash2, Eye, Pencil, CheckCircle2, XCircle, RotateCcw, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { ImageUploader } from './ImageUploader';
import { useTheme } from '../../context/ThemeContext';

const MIN_SIZE = 1.5; // minimum % to register as a region

/* ── 8 preset colors, auto-assigned in order ── */
const COLORS = [
  '#6366F1', // indigo
  '#ef4444', // red
  '#16a34a', // green
  '#f97316', // orange
  '#0ea5e9', // sky
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#eab308', // yellow
];

const hexToRgba = (hex = '#6366F1', a) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
};

/**
 * HotspotEditor — single-column layout.
 *
 * KEY FIX: The overlay div sits on top of the <img> which is rendered as
 * `width:100%; height:auto` with NO object-fit / max-height constraints.
 * This means the overlay bounding rect = exactly the image pixel area.
 * Percentage coordinates are therefore 1:1 with the image.
 */
export const HotspotEditor = ({
  imageUrl,
  onImageChange,
  regions,
  onRegionsChange,
  multiMode,
  onMultiModeChange,
}) => {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const imgRef    = useRef(null);
  const overlayRef = useRef(null);

  const [drawing,  setDrawing]  = useState(null); // live rect being drawn
  const [mode,     setMode]     = useState('draw'); // 'draw' | 'preview'
  const [selected, setSelected] = useState(null);  // selected region id

  /* ──────────────────────────────────────────────
     Coordinate conversion — uses image element rect,
     NOT the container, so there's no letterbox offset.
  ────────────────────────────────────────────── */
  const getRect = useCallback(() => {
    // Use the overlay (which sits exactly on the image)
    return overlayRef.current?.getBoundingClientRect();
  }, []);

  const toPercent = useCallback((clientX, clientY) => {
    const rect = getRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width)  * 100)),
      y: Math.max(0, Math.min(100, ((clientY - rect.top)  / rect.height) * 100)),
    };
  }, [getRect]);

  /* ── Mouse handlers ── */
  const onMouseDown = useCallback((e) => {
    if (mode !== 'draw') return;
    e.preventDefault();
    const { x, y } = toPercent(e.clientX, e.clientY);
    setDrawing({ startX: x, startY: y, x, y, w: 0, h: 0 });
    setSelected(null);
  }, [mode, toPercent]);

  const onMouseMove = useCallback((e) => {
    if (!drawing) return;
    e.preventDefault();
    const { x, y } = toPercent(e.clientX, e.clientY);
    setDrawing(d => ({
      ...d,
      x: Math.min(d.startX, x),
      y: Math.min(d.startY, y),
      w: Math.abs(x - d.startX),
      h: Math.abs(y - d.startY),
    }));
  }, [drawing, toPercent]);

  const onMouseUp = useCallback((e) => {
    if (!drawing) return;
    e.preventDefault?.();
    if (drawing.w >= MIN_SIZE && drawing.h >= MIN_SIZE) {
      const region = {
        id:          crypto.randomUUID(),
        x:           +drawing.x.toFixed(3),
        y:           +drawing.y.toFixed(3),
        width:       +drawing.w.toFixed(3),
        height:      +drawing.h.toFixed(3),
        is_correct:  true,
        label:       '',
        color:       COLORS[regions.length % COLORS.length],
        order_index: regions.length,
      };
      onRegionsChange([...regions, region]);
      setSelected(region.id);
    }
    setDrawing(null);
  }, [drawing, regions, onRegionsChange]);

  /* ── Touch handlers ── */
  const onTouchStart = useCallback((e) => {
    if (mode !== 'draw') return;
    e.preventDefault();
    const touch = e.touches[0];
    const { x, y } = toPercent(touch.clientX, touch.clientY);
    setDrawing({ startX: x, startY: y, x, y, w: 0, h: 0 });
    setSelected(null);
  }, [mode, toPercent]);

  const onTouchMove = useCallback((e) => {
    if (!drawing) return;
    e.preventDefault();
    const touch = e.touches[0];
    const { x, y } = toPercent(touch.clientX, touch.clientY);
    setDrawing(d => ({
      ...d,
      x: Math.min(d.startX, x),
      y: Math.min(d.startY, y),
      w: Math.abs(x - d.startX),
      h: Math.abs(y - d.startY),
    }));
  }, [drawing, toPercent]);

  /* ── CRUD ── */
  const updateRegion = (id, field, val) =>
    onRegionsChange(regions.map(r => r.id === id ? { ...r, [field]: val } : r));

  const removeRegion = (id) => {
    onRegionsChange(regions.filter(r => r.id !== id));
    if (selected === id) setSelected(null);
  };

  const correctCount = regions.filter(r => r.is_correct).length;

  /* ── Region card expanded/collapsed per id ── */
  const toggleSelected = (id) => setSelected(prev => prev === id ? null : id);

  /* ═══════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════ */
  if (!imageUrl) {
    return (
      <div className="space-y-4">
        {/* Step hint */}
        <div className="flex items-start gap-3 px-4 py-3.5 bg-amber-50 border border-amber-200 rounded-2xl dark:bg-amber-950/40 dark:border-amber-800/60">
          <span className="text-2xl shrink-0">🎯</span>
          <div>
            <p className="text-sm font-bold text-amber-800 mb-1 dark:text-amber-300">{t('hotspotEditor.title')}</p>
            <ol className="text-xs text-amber-700 space-y-1 list-decimal list-inside dark:text-amber-300">
              <li>{t('hotspotEditor.step1')}</li>
              <li>{t('hotspotEditor.step2')}</li>
              <li>{t('hotspotEditor.step3Pre')} <strong>{t('hotspotEditor.step3Strong')}</strong> {t('hotspotEditor.step3Post')}</li>
            </ol>
          </div>
        </div>
        <ImageUploader
          bucket="question-images"
          value={imageUrl}
          onChange={onImageChange}
          label={t('hotspotEditor.uploadRequiredLabel')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* ── Toolbar ── */}
      <div className="flex items-center flex-wrap gap-2">
        {/* Draw / Preview toggle */}
        <div className="flex rounded-xl border border-gray-200 overflow-hidden shadow-xs bg-white dark:border-slate-700 dark:bg-slate-800">
          <button type="button" onClick={() => setMode('draw')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition-all ${mode === 'draw' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-50 dark:text-slate-500 dark:hover:bg-slate-700'}`}>
            <Pencil className="w-3.5 h-3.5" /> {t('hotspotEditor.drawMode')}
          </button>
          <button type="button" onClick={() => setMode('preview')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-l border-gray-200 transition-all dark:border-slate-700 ${mode === 'preview' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-50 dark:text-slate-500 dark:hover:bg-slate-700'}`}>
            <Eye className="w-3.5 h-3.5" /> {t('hotspotEditor.previewMode')}
          </button>
        </div>

        {/* Multi-select toggle */}
        <button type="button" onClick={() => onMultiModeChange(!multiMode)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all shadow-xs ${multiMode ? 'bg-violet-100 border-violet-300 text-violet-700 dark:bg-violet-950/40 dark:border-violet-800/60 dark:text-violet-300' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500 dark:hover:border-slate-600'}`}>
          {multiMode ? `☑ ${t('hotspotEditor.multiModeOn')}` : `🔘 ${t('hotspotEditor.multiModeOff')}`}
        </button>

        {/* Stats */}
        {regions.length > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg dark:text-emerald-400 dark:bg-emerald-950/40">✓ {t('hotspotEditor.correctCount', { count: correctCount })}</span>
            {regions.length - correctCount > 0 && (
              <span className="text-xs font-bold text-red-500 bg-red-50 px-2.5 py-1 rounded-lg dark:text-red-400 dark:bg-red-950/40">✗ {t('hotspotEditor.incorrectCount', { count: regions.length - correctCount })}</span>
            )}
            <button type="button" onClick={() => { onRegionsChange([]); setSelected(null); }}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-red-400 hover:text-red-600 border border-red-200 hover:border-red-300 rounded-lg transition-all dark:hover:text-red-300 dark:border-red-800/60 dark:hover:border-red-700">
              <RotateCcw className="w-3 h-3" /> {t('hotspotEditor.clearAll')}
            </button>
          </div>
        )}
      </div>

      {/* ── Canvas ── */}
      <div
        className={`relative rounded-2xl overflow-hidden border-2 bg-gray-100 transition-all select-none dark:bg-slate-700
          ${mode === 'draw'
            ? 'border-indigo-400 shadow-[0_0_0_4px_rgba(99,102,241,0.12)] cursor-crosshair'
            : 'border-gray-200 cursor-default dark:border-slate-700'}`}
      >
        {/*
          IMPORTANT: img has w-full h-auto (no max-height, no object-fit).
          The rendered image fills exactly the container width with correct
          aspect ratio — zero letterboxing.
          The overlay div (position:absolute inset-0) covers exactly the image pixels.
        */}
        <img
          ref={imgRef}
          src={imageUrl}
          alt={t('hotspotEditor.imageAlt')}
          className="w-full h-auto block"
          draggable={false}
        />

        {/* Overlay — same size as img thanks to inset-0 on a relative parent */}
        <div
          ref={overlayRef}
          className="absolute inset-0"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={() => drawing && onMouseUp({ preventDefault: () => {} })}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onMouseUp}
        >
          {/* Existing regions */}
          {regions.map((r, idx) => {
            const color = r.color || COLORS[0];
            const isSel = selected === r.id;
            return (
              <div
                key={r.id}
                onClick={e => { e.stopPropagation(); if (mode === 'draw') toggleSelected(r.id); }}
                style={{
                  position:    'absolute',
                  left:        `${r.x}%`,
                  top:         `${r.y}%`,
                  width:       `${r.width}%`,
                  height:      `${r.height}%`,
                  borderWidth: 2,
                  borderStyle: 'solid',
                  borderColor: color,
                  background:  hexToRgba(color, isSel ? 0.3 : 0.12),
                  boxShadow:   isSel ? `0 0 0 3px ${hexToRgba(color, 0.4)}` : 'none',
                  transition:  'background 0.15s, box-shadow 0.15s',
                  cursor:      mode === 'draw' ? 'pointer' : 'default',
                }}
              >
                {/* Index badge */}
                <span
                  className="absolute top-0.5 left-0.5 text-[9px] font-extrabold px-1 py-0.5 rounded-sm leading-none text-white"
                  style={{ background: color }}
                >
                  {idx + 1}
                </span>
                {/* Size hint on selected */}
                {mode === 'draw' && isSel && (
                  <span className="absolute bottom-0.5 right-0.5 text-[8px] font-mono bg-black/60 text-white px-1 py-0.5 rounded-xs leading-none">
                    {r.width.toFixed(1)}×{r.height.toFixed(1)}%
                  </span>
                )}
              </div>
            );
          })}

          {/* Live drawing preview */}
          {drawing && drawing.w >= 0.5 && drawing.h >= 0.5 && (
            <div
              style={{
                position:    'absolute',
                left:        `${drawing.x}%`,
                top:         `${drawing.y}%`,
                width:       `${drawing.w}%`,
                height:      `${drawing.h}%`,
                borderWidth: 2,
                borderStyle: 'dashed',
                borderColor: '#6366F1',
                background:  hexToRgba('#6366F1', 0.1),
                pointerEvents: 'none',
              }}
            >
              <span className="absolute bottom-0.5 right-0.5 text-[8px] font-mono bg-indigo-700 text-white px-1 py-0.5 rounded-xs leading-none">
                {drawing.w.toFixed(1)}×{drawing.h.toFixed(1)}%
              </span>
            </div>
          )}

          {/* Preview mode empty hint */}
          {mode === 'preview' && regions.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-black/55 text-white text-xs px-4 py-2 rounded-xl">
                {t('hotspotEditor.noRegionsYet')}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Draw mode tip ── */}
      {mode === 'draw' && (
        <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-xl dark:bg-indigo-950/40 dark:border-indigo-800/60">
          <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <p className="text-xs text-indigo-600 dark:text-indigo-300">
            {regions.length === 0
              ? t('hotspotEditor.drawTipEmpty')
              : t('hotspotEditor.drawTipHasRegions')}
          </p>
        </div>
      )}

      {/* ── Region list (below the image) ── */}
      {regions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1 dark:text-slate-500">{t('hotspotEditor.regionListHeader', { count: regions.length })}</p>
          {regions.map((r, idx) => {
            const color = r.color || COLORS[0];
            const isSel = selected === r.id;
            return (
              <div
                key={r.id}
                className="rounded-2xl border-2 overflow-hidden transition-all duration-150"
                style={{
                  borderColor: isSel ? color : (isDark ? '#334155' : '#e5e7eb'),
                  boxShadow:   isSel ? `0 4px 16px ${hexToRgba(color, 0.2)}` : 'none',
                }}
              >
                {/* Card header — always visible. Plain <div> (not <button>) because it
                    contains a nested delete <button> — a <button> inside a <button> is
                    invalid HTML and React warns/breaks hydration. */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleSelected(r.id)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSelected(r.id); } }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-slate-700/40 cursor-pointer"
                  style={{ background: isSel ? hexToRgba(color, 0.07) : (isDark ? '#1e293b' : 'white') }}
                >
                  {/* Color swatch + index */}
                  <span
                    className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-extrabold text-white shrink-0"
                    style={{ background: color }}
                  >
                    {idx + 1}
                  </span>

                  {/* Label / coordinates */}
                  <span className="flex-1 min-w-0 text-sm font-semibold text-gray-700 truncate dark:text-slate-300">
                    {r.label || t('hotspotEditor.regionDefaultLabel', { index: idx + 1 })}
                  </span>

                  {/* Correct badge */}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    r.is_correct ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-300'
                  }`}>
                    {r.is_correct ? `✔ ${t('hotspotEditor.correctLabel')}` : `✘ ${t('hotspotEditor.incorrectLabel')}`}
                  </span>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); removeRegion(r.id); }}
                    className="text-gray-300 hover:text-red-400 transition-colors shrink-0 p-1 dark:text-slate-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Expand indicator */}
                  {isSel ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0 dark:text-slate-500" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 dark:text-slate-500" />}
                </div>

                {/* Expanded detail */}
                {isSel && (
                  <div className="px-4 pb-4 pt-1 bg-white border-t border-gray-100 space-y-4 dark:bg-slate-800 dark:border-slate-700/60">
                    {/* Label input */}
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 dark:text-slate-500">{t('hotspotEditor.regionLabelField')}</label>
                      <input
                        type="text"
                        value={r.label || ''}
                        onChange={e => updateRegion(r.id, 'label', e.target.value)}
                        placeholder={t('hotspotEditor.regionLabelPlaceholder')}
                        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-indigo-400 placeholder-gray-300 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-500"
                      />
                    </div>

                    {/* Color picker */}
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 dark:text-slate-500">{t('hotspotEditor.borderColorLabel')}</label>
                      <div className="flex gap-2 flex-wrap">
                        {COLORS.map(hex => (
                          <button
                            key={hex}
                            type="button"
                            onClick={() => updateRegion(r.id, 'color', hex)}
                            className="w-8 h-8 rounded-xl transition-all hover:scale-110 focus:outline-hidden"
                            style={{
                              background:  hex,
                              boxShadow:   color === hex ? `0 0 0 3px white, 0 0 0 5px ${hex}` : 'none',
                              transform:   color === hex ? 'scale(1.15)' : undefined,
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Correct / Incorrect */}
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 dark:text-slate-500">{t('hotspotEditor.answerLabel')}</label>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => updateRegion(r.id, 'is_correct', true)}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
                            r.is_correct
                              ? 'border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-100'
                              : 'border-gray-200 text-gray-400 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50 dark:border-slate-600 dark:text-slate-500 dark:hover:border-emerald-700 dark:hover:text-emerald-400 dark:hover:bg-emerald-950/40'
                          }`}>
                          <CheckCircle2 className="w-4 h-4" /> {t('hotspotEditor.correctLabel')}
                        </button>
                        <button type="button" onClick={() => updateRegion(r.id, 'is_correct', false)}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
                            !r.is_correct
                              ? 'border-red-500 bg-red-500 text-white shadow-lg shadow-red-100'
                              : 'border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-600 hover:bg-red-50 dark:border-slate-600 dark:text-slate-500 dark:hover:border-red-700 dark:hover:text-red-400 dark:hover:bg-red-950/40'
                          }`}>
                          <XCircle className="w-4 h-4" /> {t('hotspotEditor.incorrectLabel')}
                        </button>
                      </div>
                    </div>

                    {/* Position & size (read-only) */}
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 dark:text-slate-500">{t('hotspotEditor.positionSizeLabel')}</label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[['X', r.x], ['Y', r.y], ['W', r.width], ['H', r.height]].map(([lbl, val]) => (
                          <div key={lbl} className="bg-gray-50 rounded-lg px-2 py-2 text-center dark:bg-slate-700/50">
                            <p className="text-[9px] text-gray-400 font-bold dark:text-slate-500">{lbl}</p>
                            <p className="text-xs font-mono text-gray-600 dark:text-slate-300">{val.toFixed(1)}%</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Change image ── */}
      <button type="button"
        onClick={() => { onImageChange(null); onRegionsChange([]); setSelected(null); }}
        className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1 dark:text-slate-500 dark:hover:text-red-400">
        <Trash2 className="w-3 h-3" /> {t('hotspotEditor.resetImage')}
      </button>

      {/* ── Warning: no correct region ── */}
      {regions.filter(r => r.is_correct).length === 0 && (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl dark:bg-amber-950/40 dark:border-amber-800/60">
          <span>⚠️</span>
          <p className="text-xs text-amber-700 font-semibold dark:text-amber-300">{t('hotspotEditor.needCorrectRegionWarning')}</p>
        </div>
      )}
    </div>
  );
};
