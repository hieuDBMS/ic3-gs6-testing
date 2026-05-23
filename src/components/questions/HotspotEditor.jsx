import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Trash2, Plus, MousePointer, Pencil, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import { ImageUploader } from './ImageUploader';

const MIN_SIZE = 3; // minimum % size for a region

/**
 * HotspotEditor — lets a teacher upload an image and draw rectangular hotspot regions on it.
 * @param {string|null} imageUrl - current image URL
 * @param {function} onImageChange - called with new image URL
 * @param {Array} regions - [{id, x, y, width, height, is_correct, label}]
 * @param {function} onRegionsChange - called with new regions array
 * @param {boolean} multiMode - whether multiple correct regions are allowed
 * @param {function} onMultiModeChange
 */
export const HotspotEditor = ({
  imageUrl,
  onImageChange,
  regions,
  onRegionsChange,
  multiMode,
  onMultiModeChange,
}) => {
  const overlayRef = useRef(null);
  const [drawing, setDrawing] = useState(null); // { startX, startY, x, y, w, h } in %
  const [mode, setMode] = useState('draw'); // 'draw' | 'preview'
  const [selected, setSelected] = useState(null); // selected region id

  // Convert mouse event to percentage coords relative to overlay
  const toPercent = useCallback((e) => {
    const rect = overlayRef.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)),
    };
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (mode !== 'draw') return;
    e.preventDefault();
    const { x, y } = toPercent(e);
    setDrawing({ startX: x, startY: y, x, y, w: 0, h: 0 });
    setSelected(null);
  }, [mode, toPercent]);

  const handleMouseMove = useCallback((e) => {
    if (!drawing) return;
    e.preventDefault();
    const { x, y } = toPercent(e);
    setDrawing(d => ({
      ...d,
      x: Math.min(d.startX, x),
      y: Math.min(d.startY, y),
      w: Math.abs(x - d.startX),
      h: Math.abs(y - d.startY),
    }));
  }, [drawing, toPercent]);

  const handleMouseUp = useCallback((e) => {
    if (!drawing) return;
    e.preventDefault();
    const { w, h, x, y } = drawing;
    if (w >= MIN_SIZE && h >= MIN_SIZE) {
      const newRegion = {
        id: crypto.randomUUID(),
        x: Math.round(x * 100) / 100,
        y: Math.round(y * 100) / 100,
        width: Math.round(w * 100) / 100,
        height: Math.round(h * 100) / 100,
        is_correct: true,
        label: '',
        order_index: regions.length,
      };
      onRegionsChange([...regions, newRegion]);
      setSelected(newRegion.id);
    }
    setDrawing(null);
  }, [drawing, regions, onRegionsChange]);

  // Touch support
  const toPercentTouch = useCallback((e) => {
    const rect = overlayRef.current.getBoundingClientRect();
    const touch = e.touches[0] || e.changedTouches[0];
    return {
      x: Math.max(0, Math.min(100, ((touch.clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((touch.clientY - rect.top) / rect.height) * 100)),
    };
  }, []);

  const updateRegion = (id, field, value) => {
    onRegionsChange(regions.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const removeRegion = (id) => {
    onRegionsChange(regions.filter(r => r.id !== id));
    if (selected === id) setSelected(null);
  };

  const correctCount = regions.filter(r => r.is_correct).length;

  return (
    <div className="space-y-4">
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {/* Mode toggle */}
          <button
            type="button"
            onClick={() => setMode(m => m === 'draw' ? 'preview' : 'draw')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              mode === 'preview'
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'
            }`}
          >
            {mode === 'draw' ? <><Eye className="w-3.5 h-3.5" /> Xem trước</> : <><Pencil className="w-3.5 h-3.5" /> Vẽ vùng</>}
          </button>

          {/* Multi mode toggle */}
          <button
            type="button"
            onClick={() => onMultiModeChange(!multiMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              multiMode
                ? 'bg-purple-100 border-purple-300 text-purple-700'
                : 'bg-white border-gray-200 text-gray-600 hover:border-purple-300'
            }`}
          >
            {multiMode ? 'Nhiều vùng đúng' : 'Một vùng đúng'}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            {regions.length} vùng · <span className="text-emerald-600 font-semibold">{correctCount} đúng</span>
          </span>
        </div>
      </div>

      {/* ── Hint ── */}
      {!imageUrl ? (
        <ImageUploader
          bucket="question-images"
          value={imageUrl}
          onChange={onImageChange}
          label="Ảnh câu hỏi Hotspot (bắt buộc)"
        />
      ) : (
        <div className="space-y-3">
          {/* Image + overlay */}
          <div className="relative rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-50 select-none">
            {/* The image */}
            <img
              src={imageUrl}
              alt="Hotspot"
              className="w-full h-auto block max-h-[480px] object-contain"
              draggable={false}
            />

            {/* Drawing overlay */}
            <div
              ref={overlayRef}
              className={`absolute inset-0 ${mode === 'draw' ? 'cursor-crosshair' : 'cursor-default'}`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={() => drawing && handleMouseUp({ preventDefault: () => {} })}
            >
              {/* Existing regions */}
              {regions.map((r, idx) => {
                const isSelected = selected === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={(e) => { e.stopPropagation(); if (mode === 'draw') setSelected(r.id); }}
                    style={{
                      left: `${r.x}%`,
                      top: `${r.y}%`,
                      width: `${r.width}%`,
                      height: `${r.height}%`,
                    }}
                    className={`absolute border-2 transition-all ${
                      mode === 'preview'
                        ? 'opacity-0 pointer-events-none'
                        : r.is_correct
                          ? isSelected
                            ? 'border-emerald-500 bg-emerald-400/25'
                            : 'border-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20'
                          : isSelected
                            ? 'border-red-500 bg-red-400/25'
                            : 'border-red-400 bg-red-400/10 hover:bg-red-400/20'
                    }`}
                  >
                    {/* Label badge */}
                    <span className={`absolute top-0.5 left-0.5 text-[9px] font-bold px-1 py-0.5 rounded leading-none ${
                      r.is_correct ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                      {idx + 1}
                    </span>
                  </div>
                );
              })}

              {/* Currently drawing rect */}
              {drawing && drawing.w >= 1 && drawing.h >= 1 && (
                <div
                  style={{
                    left: `${drawing.x}%`,
                    top: `${drawing.y}%`,
                    width: `${drawing.w}%`,
                    height: `${drawing.h}%`,
                  }}
                  className="absolute border-2 border-dashed border-indigo-500 bg-indigo-400/10 pointer-events-none"
                />
              )}
            </div>

            {/* Draw mode hint */}
            {mode === 'draw' && regions.length === 0 && !drawing && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-black/50 text-white text-xs px-3 py-2 rounded-xl flex items-center gap-2">
                  <Pencil className="w-3.5 h-3.5" />
                  Click và kéo để vẽ vùng hotspot
                </div>
              </div>
            )}
          </div>

          {/* Change image button */}
          <button
            type="button"
            onClick={() => { onImageChange(null); onRegionsChange([]); }}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" /> Xoá ảnh và vẽ lại từ đầu
          </button>
        </div>
      )}

      {/* ── Region list ── */}
      {regions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Danh sách vùng</p>
          {regions.map((r, idx) => (
            <div
              key={r.id}
              onClick={() => setSelected(r.id)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all cursor-pointer ${
                selected === r.id
                  ? 'border-indigo-300 bg-indigo-50/50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              {/* Index */}
              <span className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center flex-shrink-0 ${
                r.is_correct ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
              }`}>
                {idx + 1}
              </span>

              {/* Label input */}
              <input
                type="text"
                value={r.label || ''}
                onClick={e => e.stopPropagation()}
                onChange={e => updateRegion(r.id, 'label', e.target.value)}
                placeholder={`Vùng ${idx + 1} (mô tả tuỳ chọn)`}
                className="flex-1 min-w-0 text-xs border-0 bg-transparent outline-none focus:ring-0 placeholder-gray-300"
              />

              {/* Correct toggle */}
              <div className="flex rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); updateRegion(r.id, 'is_correct', true); }}
                  className={`px-2.5 py-1 text-[11px] font-bold transition-all ${
                    r.is_correct ? 'bg-emerald-500 text-white' : 'bg-white text-gray-400 hover:bg-emerald-50'
                  }`}
                >
                  Đúng
                </button>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); updateRegion(r.id, 'is_correct', false); }}
                  className={`px-2.5 py-1 text-[11px] font-bold border-l border-gray-200 transition-all ${
                    !r.is_correct ? 'bg-red-500 text-white' : 'bg-white text-gray-400 hover:bg-red-50'
                  }`}
                >
                  Sai
                </button>
              </div>

              {/* Delete */}
              <button
                type="button"
                onClick={e => { e.stopPropagation(); removeRegion(r.id); }}
                className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── No regions warning ── */}
      {imageUrl && regions.filter(r => r.is_correct).length === 0 && (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
          <span className="text-amber-500 text-sm">⚠️</span>
          <p className="text-xs text-amber-700 font-medium">Cần ít nhất 1 vùng đúng. Kéo chuột trên ảnh để vẽ.</p>
        </div>
      )}
    </div>
  );
};
