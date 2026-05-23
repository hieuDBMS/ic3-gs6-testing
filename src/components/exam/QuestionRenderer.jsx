import React, { useState } from 'react';
import { ZoomableImage } from '../shared/ImageLightbox';

/* ─────────────────── Choice / Multi ─────────────────── */
const AnswerOption = ({ ans, selected, onSelect, type }) => {
  const isSelected = selected?.includes(ans.id);
  return (
    <label
      className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all select-none ${isSelected
          ? 'border-indigo-500 bg-indigo-50 shadow-sm'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        }`}
    >
      <input
        type={type === 'multi' ? 'checkbox' : 'radio'}
        name={`q-${ans.question_id}`}
        value={ans.id}
        checked={isSelected || false}
        onChange={onSelect}
        className="w-4 h-4 accent-indigo-600 flex-shrink-0"
      />
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {ans.image_url && (
          <ZoomableImage
            src={ans.image_url}
            alt=""
            className="h-14 w-20 object-contain rounded-lg border border-gray-100 flex-shrink-0 bg-white"
          />
        )}
        <span className={`text-sm leading-relaxed whitespace-pre-wrap ${isSelected ? 'text-indigo-800 font-medium' : 'text-gray-700'}`}>
          {ans.content}
        </span>
      </div>
    </label>
  );
};

/* ─────────────────── DragItem Card ─────────────────── */
const DragItemCard = ({ pair, dragging, onDragStart, onDragEnd, inZone = false, isSelected = false }) => {
  const isBeingDragged = dragging?.id === pair.id;
  const hasImage = !!pair.drag_image_url;
  const hasText = !!pair.drag_content;
  const isLongText = hasText && pair.drag_content.length > 20;

  return (
    <div
      draggable
      onDragStart={() => onDragStart(pair)}
      onDragEnd={onDragEnd}
      style={{ minWidth: isLongText ? '140px' : hasImage ? '80px' : '80px', maxWidth: '200px' }}
      className={`flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl border-2 cursor-grab active:cursor-grabbing select-none transition-all ${
        isBeingDragged
          ? 'opacity-40 scale-95 shadow-none'
          : isSelected
            ? 'border-amber-400 bg-amber-50 shadow-md ring-2 ring-amber-300 ring-offset-1 scale-105'
            : inZone
              ? 'border-indigo-300 bg-white shadow-sm hover:shadow-md hover:border-indigo-400 hover:-translate-y-0.5'
              : 'border-blue-200 bg-white shadow-sm hover:shadow-md hover:border-blue-400 hover:-translate-y-0.5'
      }`}
    >
      {hasImage && (
        <img
          src={pair.drag_image_url}
          alt=""
          className="w-14 h-14 object-contain rounded-lg flex-shrink-0"
          draggable={false}
        />
      )}
      {hasText && (
        <span
          className={`text-xs font-semibold text-center leading-snug break-words w-full ${
            isSelected ? 'text-amber-800' : inZone ? 'text-indigo-700' : 'text-gray-700'
          }`}
        >
          {pair.drag_content}
        </span>
      )}
    </div>
  );
};

/* ─────────────────── Drag-Drop Question ─────────────────── */
const DragDropQuestion = ({ question, currentAnswer, onChange }) => {
  const pairs = [...(question.dragdrop_pairs || [])].sort((a, b) => a.order_index - b.order_index);
  const [dragging, setDragging] = useState(null);
  const [dragOverZone, setDragOverZone] = useState(null); // 'pool' | drop_content string

  // Unique drop zones from all pairs' drop_content
  const dropZones = [];
  const seen = new Set();
  for (const p of pairs) {
    if (!seen.has(p.drop_content)) {
      seen.add(p.drop_content);
      dropZones.push({ label: p.drop_content, image_url: p.drop_image_url });
    }
  }

  const placed = currentAnswer || {};

  // Pool: items not yet placed in any zone
  const poolItems = pairs.filter((p) => !placed[p.id]);

  const placeItem = (pairId, zoneLabel) => {
    const next = { ...placed, [pairId]: zoneLabel };
    onChange(Object.keys(next).length > 0 ? next : undefined);
  };

  const returnToPool = (pairId) => {
    const next = { ...placed };
    delete next[pairId];
    onChange(Object.keys(next).length > 0 ? next : undefined);
  };

  // ── Drag handlers ──
  const handleDragStart = (pair) => setDragging(pair);
  const handleDragEnd = () => { setDragging(null); setDragOverZone(null); };

  const handleDropOnZone = (e, zoneLabel) => {
    e.preventDefault();
    if (!dragging) return;
    placeItem(dragging.id, zoneLabel);
    setDragging(null);
    setDragOverZone(null);
  };

  const handleDropOnPool = (e) => {
    e.preventDefault();
    if (!dragging) return;
    returnToPool(dragging.id);
    setDragging(null);
    setDragOverZone(null);
  };

  // Touch support: click to pick, click zone to place
  const [touchSelected, setTouchSelected] = useState(null);

  const handleItemClick = (pair) => {
    if (touchSelected?.id === pair.id) {
      setTouchSelected(null);
    } else {
      setTouchSelected(pair);
    }
  };

  const handleZoneClick = (zoneLabel) => {
    if (!touchSelected) return;
    placeItem(touchSelected.id, zoneLabel);
    setTouchSelected(null);
  };

  const handlePoolClick = () => {
    setTouchSelected(null);
  };

  return (
    <div className="space-y-5">
      {/* Instruction banner */}
      <div className="flex items-start gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl px-4 py-3">
        <span className="text-lg mt-0.5 flex-shrink-0">🔀</span>
        <div>
          <p className="text-sm font-semibold text-blue-800">Kéo & Thả</p>
          <p className="text-xs text-blue-600 mt-0.5">Kéo các thẻ bên dưới vào ô tương ứng. Trên điện thoại: <strong>bấm chọn thẻ</strong> rồi <strong>bấm vào ô</strong> muốn đặt.</p>
        </div>
      </div>

      {/* Pool of draggable items */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOverZone('pool'); }}
        onDragLeave={() => setDragOverZone(null)}
        onDrop={handleDropOnPool}
        onClick={handlePoolClick}
        className={`rounded-2xl border-2 border-dashed p-4 transition-all duration-200 ${
          dragOverZone === 'pool'
            ? 'border-blue-400 bg-blue-50 shadow-inner'
            : 'border-blue-200 bg-gradient-to-br from-slate-50 to-blue-50/30'
        }`}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
          <p className="text-[11px] font-bold text-blue-500 uppercase tracking-widest">Kho thẻ</p>
          <span className="ml-auto text-[11px] text-gray-400 font-medium">{poolItems.length} thẻ còn lại</span>
        </div>
        <div className="flex flex-wrap gap-2.5 min-h-[60px]">
          {poolItems.length === 0 ? (
            <div className="w-full flex items-center justify-center gap-2 py-3">
              <span className="text-green-500 text-base">✅</span>
              <p className="text-sm text-gray-400 font-medium">Tất cả đã được xếp vào ô!</p>
            </div>
          ) : (
            poolItems.map((pair) => (
              <div
                key={pair.id}
                className="flex flex-col items-center"
                onClick={(e) => { e.stopPropagation(); handleItemClick(pair); }}
              >
                <DragItemCard
                  pair={pair}
                  dragging={dragging}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  isSelected={touchSelected?.id === pair.id}
                />
                {touchSelected?.id === pair.id && (
                  <div className="mt-1.5 flex items-center gap-1 text-[10px] text-amber-600 font-bold">
                    <span className="animate-bounce">👆</span>
                    <span>Chọn ô bên dưới</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Drop Zones */}
      <div className={`grid gap-4 ${
        dropZones.length <= 2 ? 'grid-cols-1 sm:grid-cols-2'
        : dropZones.length === 3 ? 'grid-cols-1 sm:grid-cols-3'
        : 'grid-cols-1 sm:grid-cols-2'
      }`}>
        {dropZones.map((zone, zoneIdx) => {
          const zoneItems = pairs.filter((p) => placed[p.id] === zone.label);
          const isOver = dragOverZone === zone.label;
          const isTarget = !!touchSelected;
          const zoneColors = [
            { ring: 'border-violet-400', bg: 'bg-violet-50', header: 'bg-violet-100 text-violet-800 border-violet-200', headerIdle: 'bg-white text-gray-700 border-gray-200', dot: 'bg-violet-400' },
            { ring: 'border-emerald-400', bg: 'bg-emerald-50', header: 'bg-emerald-100 text-emerald-800 border-emerald-200', headerIdle: 'bg-white text-gray-700 border-gray-200', dot: 'bg-emerald-400' },
            { ring: 'border-rose-400', bg: 'bg-rose-50', header: 'bg-rose-100 text-rose-800 border-rose-200', headerIdle: 'bg-white text-gray-700 border-gray-200', dot: 'bg-rose-400' },
            { ring: 'border-amber-400', bg: 'bg-amber-50', header: 'bg-amber-100 text-amber-800 border-amber-200', headerIdle: 'bg-white text-gray-700 border-gray-200', dot: 'bg-amber-400' },
          ];
          const color = zoneColors[zoneIdx % zoneColors.length];

          return (
            <div
              key={zone.label}
              onDragOver={(e) => { e.preventDefault(); setDragOverZone(zone.label); }}
              onDragLeave={() => setDragOverZone(null)}
              onDrop={(e) => handleDropOnZone(e, zone.label)}
              onClick={() => handleZoneClick(zone.label)}
              className={`rounded-2xl border-2 overflow-hidden transition-all duration-200 cursor-pointer ${
                isOver
                  ? `${color.ring} ${color.bg} shadow-lg scale-[1.02]`
                  : isTarget
                    ? `border-indigo-300 bg-indigo-50/30 shadow-md ring-2 ring-indigo-200 ring-offset-1`
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              {/* Zone header */}
              <div className={`px-4 py-3 border-b flex items-center gap-2 transition-colors ${
                isOver ? color.header : 'border-gray-100 bg-gradient-to-r from-gray-50 to-white'
              }`}>
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  isOver ? color.dot : 'bg-gray-300'
                }`}></div>
                {zone.image_url && (
                  <img src={zone.image_url} alt="" className="h-8 w-auto object-contain flex-shrink-0" />
                )}
                <span className={`text-sm font-bold leading-snug ${
                  isOver ? '' : 'text-gray-800'
                }`}>
                  {zone.label}
                </span>
                <span className="ml-auto text-[11px] font-semibold text-gray-400">
                  {zoneItems.length > 0 && `${zoneItems.length} thẻ`}
                </span>
              </div>

              {/* Dropped items */}
              <div className="p-3 flex flex-wrap gap-2 min-h-[90px] items-start content-start">
                {zoneItems.length === 0 ? (
                  <div className="w-full flex flex-col items-center justify-center gap-1 py-4 text-gray-300">
                    <span className="text-2xl">{isOver ? '⬇️' : '📥'}</span>
                    <span className="text-xs font-medium">{isOver ? 'Thả vào đây!' : 'Kéo thẻ vào đây'}</span>
                  </div>
                ) : (
                  zoneItems.map((pair) => (
                    <div
                      key={pair.id}
                      title="Bấm để trả về kho"
                      onClick={(e) => {
                        e.stopPropagation();
                        returnToPool(pair.id);
                      }}
                    >
                      <DragItemCard
                        pair={pair}
                        dragging={dragging}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        inZone
                      />
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
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden" style={{ width: '120px' }}>
            <div
              className="h-full bg-gradient-to-r from-indigo-400 to-violet-500 rounded-full transition-all duration-500"
              style={{ width: `${pairs.length > 0 ? (Object.keys(placed).length / pairs.length) * 100 : 0}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 font-medium">
            {Object.keys(placed).length}/{pairs.length} thẻ
          </span>
        </div>
        {Object.keys(placed).length > 0 && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="text-xs text-red-400 hover:text-red-600 font-semibold flex items-center gap-1 hover:underline transition-colors"
          >
            🔄 Làm lại
          </button>
        )}
      </div>
    </div>
  );
};

/* ─────────────────── TrueFalse ─────────────────── */
const TrueFalseQuestion = ({ question, currentAnswer, onChange }) => {
  const sortedStatements = [...(question.truefalse_statements || [])].sort(
    (a, b) => a.order_index - b.order_index
  );

  const response = currentAnswer || {};
  const handleSelect = (stmtId, value) => onChange({ ...response, [stmtId]: value });

  const answeredCount = Object.keys(response).length;
  const total = sortedStatements.length;
  const progress = total > 0 ? (answeredCount / total) * 100 : 0;

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center flex-shrink-0 shadow-sm shadow-teal-200">
            <span className="text-white text-[10px] font-black tracking-tight">T/F</span>
          </div>
          <p className="text-sm font-semibold text-gray-700">
            Chọn{' '}
            <span className="text-emerald-600 font-bold">Đúng</span>{' '}hoặc{' '}
            <span className="text-red-500 font-bold">Sai</span>{' '}
            cho mỗi nhận định
          </p>
        </div>
        <span className={`text-xs font-bold px-3 py-1 rounded-full flex-shrink-0 transition-all ${
          answeredCount === total && total > 0
            ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300'
            : 'bg-gray-100 text-gray-500'
        }`}>
          {answeredCount}/{total}
        </span>
      </div>

      {/* ── Progress bar ── */}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #14b8a6, #10b981)',
          }}
        />
      </div>

      {/* ── Statement table ── */}
      <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-sm">
        {/* Table column headers */}
        <div className="flex items-center bg-gray-50 border-b border-gray-200 px-4 py-2.5 gap-3">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest w-5 text-center flex-shrink-0">#</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex-1">
            Nhận định
          </span>
          <div className="flex gap-1.5 flex-shrink-0">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest w-16 text-center">Đúng</span>
            <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest w-16 text-center">Sai</span>
          </div>
        </div>

        {/* Statement rows */}
        {sortedStatements.map((stmt, idx) => {
          const sel = response[stmt.id];
          const answered = sel !== undefined;
          const isTrue  = sel === true;
          const isFalse = sel === false;

          return (
            <div
              key={stmt.id}
              className={`flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 last:border-b-0 transition-colors duration-200 ${
                !answered ? 'bg-white hover:bg-gray-50/70'
                : isTrue  ? 'bg-emerald-50/60'
                : 'bg-red-50/60'
              }`}
            >
              {/* Index badge */}
              <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-bold flex-shrink-0 transition-all ${
                !answered ? 'bg-gray-100 text-gray-400'
                : isTrue  ? 'bg-emerald-200 text-emerald-800'
                : 'bg-red-200 text-red-800'
              }`}>
                {idx + 1}
              </span>

              {/* Statement content */}
              <p className={`flex-1 text-sm leading-relaxed whitespace-pre-wrap min-w-0 transition-colors ${
                !answered ? 'text-gray-700'
                : isTrue  ? 'text-emerald-900 font-medium'
                : 'text-red-900 font-medium'
              }`}>
                {stmt.content}
              </p>

              {/* Toggle pair */}
              <div className="flex gap-1.5 flex-shrink-0">
                {/* Đúng button */}
                <button
                  type="button"
                  onClick={() => handleSelect(stmt.id, true)}
                  className={`w-16 h-9 rounded-xl text-xs font-bold border-2 transition-all duration-200 ${
                    isTrue
                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-200 scale-105'
                      : 'bg-white border-gray-200 text-gray-400 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50'
                  }`}
                >
                  {isTrue ? '✔ Đúng' : 'Đúng'}
                </button>

                {/* Sai button */}
                <button
                  type="button"
                  onClick={() => handleSelect(stmt.id, false)}
                  className={`w-16 h-9 rounded-xl text-xs font-bold border-2 transition-all duration-200 ${
                    isFalse
                      ? 'bg-red-500 border-red-500 text-white shadow-md shadow-red-200 scale-105'
                      : 'bg-white border-gray-200 text-gray-400 hover:border-red-400 hover:text-red-600 hover:bg-red-50'
                  }`}
                >
                  {isFalse ? '✘ Sai' : 'Sai'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Completion banner ── */}
      {answeredCount === total && total > 0 && (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
          <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <span className="text-emerald-600 text-sm">✅</span>
          </div>
          <p className="text-sm font-semibold text-emerald-700">
            Đã hoàn thành tất cả {total} nhận định!
          </p>
        </div>
      )}
    </div>
  );
};


/* ─────────────────── Hotspot ─────────────────── */
const HotspotQuestion = ({ question, currentAnswer, onChange }) => {
  const sortedRegions = [...(question.hotspot_regions || [])].sort(
    (a, b) => a.order_index - b.order_index
  );
  const isMulti = question.hotspot_multi;

  // currentAnswer: array of region IDs selected by user
  const selected = currentAnswer || [];

  const handleRegionClick = (regionId) => {
    if (isMulti) {
      // toggle
      const next = selected.includes(regionId)
        ? selected.filter(id => id !== regionId)
        : [...selected, regionId];
      onChange(next.length > 0 ? next : undefined);
    } else {
      // single select
      onChange(selected[0] === regionId ? undefined : [regionId]);
    }
  };

  const [hoveredId, setHoveredId] = React.useState(null);
  const imgRef = React.useRef(null);

  const correctCount = sortedRegions.filter(r => r.is_correct).length;
  const selectedCount = selected.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-white text-sm">🎯</span>
          </div>
          <p className="text-sm font-semibold text-gray-700">
            {isMulti
              ? <>Click vào <span className="text-orange-600 font-bold">tất cả vùng đúng</span> trên ảnh</>  
              : <>Click vào <span className="text-orange-600 font-bold">vùng đúng</span> trên ảnh</>}
          </p>
        </div>
        {isMulti && (
          <span className={`text-xs font-bold px-3 py-1 rounded-full flex-shrink-0 ${
            selectedCount >= correctCount && selectedCount > 0
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-gray-100 text-gray-500'
          }`}>
            {selectedCount}/{correctCount}
          </span>
        )}
      </div>

      {/* Image with hotspot overlay */}
      <div
        className="relative rounded-2xl overflow-hidden border-2 border-gray-200 bg-gray-50 shadow-sm select-none cursor-pointer"
      >
        {question.image_url ? (
          <>
            <img
              ref={imgRef}
              src={question.image_url}
              alt="Hotspot"
              className="w-full h-auto block max-h-[520px] object-contain"
              draggable={false}
            />
            {/* Hotspot region overlays */}
            {sortedRegions.map((region) => {
              const isSelected = selected.includes(region.id);
              const isHovered = hoveredId === region.id;
              return (
                <div
                  key={region.id}
                  onClick={() => handleRegionClick(region.id)}
                  onMouseEnter={() => setHoveredId(region.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    left:   `${region.x}%`,
                    top:    `${region.y}%`,
                    width:  `${region.width}%`,
                    height: `${region.height}%`,
                  }}
                  className={`absolute transition-all duration-150 cursor-pointer rounded-sm ${
                    isSelected
                      ? 'bg-orange-400/35 border-2 border-orange-500 shadow-inner'
                      : isHovered
                        ? 'bg-white/20 border-2 border-white/60 shadow-lg'
                        : 'bg-transparent border-2 border-transparent hover:bg-white/10'
                  }`}
                />
              );
            })}

            {/* Hint overlay (first visit) */}
            {selected.length === 0 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none">
                <div className="bg-black/60 backdrop-blur text-white text-xs px-4 py-2 rounded-xl flex items-center gap-2">
                  <span>🎯</span>
                  {isMulti ? 'Click vào tất cả vùng đúng trên ảnh' : 'Click vào vùng đúng trên ảnh'}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-48 text-gray-400">
            Ảnh chưa được tải
          </div>
        )}
      </div>

      {/* Selected indicator */}
      {selected.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-orange-50 border border-orange-200 rounded-xl">
          <span className="text-orange-500">🎯</span>
          <p className="text-sm font-medium text-orange-700">
            Đã chọn {selected.length} vùng{isMulti ? ` / cần ${correctCount}` : ''}
          </p>
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="ml-auto text-xs text-orange-400 hover:text-orange-600 font-semibold flex items-center gap-1"
          >
            🔄 Làm lại
          </button>
        </div>
      )}
    </div>
  );
};


/* ─────────────────── Main Renderer ─────────────────── */
export const QuestionRenderer = ({ question, currentAnswer, onChange }) => {
  if (!question) return null;

  const handleChoiceChange = (ansId) => onChange([ansId]);
  const handleMultiChange = (e, ansId) => {
    const prev = currentAnswer || [];
    const next = e.target.checked
      ? [...prev, ansId]
      : prev.filter((id) => id !== ansId);
    onChange(next.length > 0 ? next : undefined);
  };

  const sortedAnswers = [...(question.answers || [])].sort(
    (a, b) => a.order_index - b.order_index
  );

  return (
    <div className="space-y-6">
      {/* Question content — skip image_url for hotspot (shown inside HotspotQuestion) */}
      <div className="space-y-3">
        <p className="text-base font-semibold text-gray-900 leading-relaxed whitespace-pre-wrap">
          {question.content}
        </p>
        {question.image_url && question.question_type !== 'hotspot' && (
          <ZoomableImage
            src={question.image_url}
            alt="Question"
            className="max-h-64 rounded-xl shadow-sm border border-gray-200 object-contain bg-gray-50"
          />
        )}
      </div>

      {/* Answers */}
      <div className="space-y-3">
        {/* Single choice */}
        {question.question_type === 'choice' &&
          sortedAnswers.map((ans) => (
            <AnswerOption
              key={ans.id}
              ans={{ ...ans, question_id: question.id }}
              selected={currentAnswer}
              type="choice"
              onSelect={() => handleChoiceChange(ans.id)}
            />
          ))}

        {/* Multiple choice */}
        {question.question_type === 'multi' && (
          <>
            <p className="text-xs text-purple-600 bg-purple-50 border border-purple-200 rounded-lg px-3 py-1.5 inline-block">
              ☑️ Có thể chọn nhiều đáp án đúng
            </p>
            {sortedAnswers.map((ans) => (
              <AnswerOption
                key={ans.id}
                ans={{ ...ans, question_id: question.id }}
                selected={currentAnswer}
                type="multi"
                onSelect={(e) => handleMultiChange(e, ans.id)}
              />
            ))}
          </>
        )}

        {/* Drag-drop */}
        {question.question_type === 'dragdrop' && (
          <DragDropQuestion
            question={question}
            currentAnswer={currentAnswer}
            onChange={onChange}
          />
        )}

        {/* True / False */}
        {question.question_type === 'truefalse' && (
          <TrueFalseQuestion
            question={question}
            currentAnswer={currentAnswer}
            onChange={onChange}
          />
        )}

        {/* Hotspot */}
        {question.question_type === 'hotspot' && (
          <HotspotQuestion
            question={question}
            currentAnswer={currentAnswer}
            onChange={onChange}
          />
        )}
      </div>
    </div>
  );
};
