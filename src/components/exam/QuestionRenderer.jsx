import React, { useState } from 'react';

/* ─────────────────── Choice / Multi ─────────────────── */
const AnswerOption = ({ ans, selected, onSelect, type }) => {
  const isSelected = selected?.includes(ans.id);
  return (
    <label
      className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all select-none ${
        isSelected
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
          <img
            src={ans.image_url}
            alt=""
            className="h-14 w-20 object-contain rounded-lg border border-gray-100 flex-shrink-0 bg-white"
          />
        )}
        <span className={`text-sm leading-relaxed ${isSelected ? 'text-indigo-800 font-medium' : 'text-gray-700'}`}>
          {ans.content}
        </span>
      </div>
    </label>
  );
};

/* ─────────────────── DragItem Card ─────────────────── */
const DragItemCard = ({ pair, dragging, onDragStart, onDragEnd, inZone = false }) => {
  const isBeingDragged = dragging?.id === pair.id;
  return (
    <div
      draggable
      onDragStart={() => onDragStart(pair)}
      onDragEnd={onDragEnd}
      className={`flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl border-2 cursor-grab active:cursor-grabbing select-none transition-all ${
        isBeingDragged
          ? 'opacity-40 scale-95'
          : inZone
          ? 'border-indigo-300 bg-white shadow-sm hover:shadow-md hover:border-indigo-400'
          : 'border-blue-200 bg-white shadow-sm hover:shadow-md hover:border-blue-400 hover:-translate-y-0.5'
      }`}
    >
      {pair.drag_image_url && (
        <img
          src={pair.drag_image_url}
          alt=""
          className="w-16 h-16 object-contain rounded-lg"
          draggable={false}
        />
      )}
      {pair.drag_content && (
        <span className="text-xs font-medium text-gray-700 text-center leading-tight max-w-[80px]">
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
    <div className="space-y-4">
      {/* Instruction */}
      <p className="text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
        🔀 <span>Kéo các mục vào ô bên dưới. Trên điện thoại: bấm chọn mục rồi bấm vào ô tương ứng.</span>
      </p>

      {/* Pool of draggable items */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOverZone('pool'); }}
        onDragLeave={() => setDragOverZone(null)}
        onDrop={handleDropOnPool}
        onClick={handlePoolClick}
        className={`min-h-[90px] border-2 border-dashed rounded-xl p-3 transition-colors ${
          dragOverZone === 'pool'
            ? 'border-blue-400 bg-blue-50'
            : 'border-blue-200 bg-blue-50/40'
        }`}
      >
        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2 px-1">
          🔵 Kéo các mục vào ô bên dưới
        </p>
        <div className="flex flex-wrap gap-2">
          {poolItems.length === 0 ? (
            <p className="text-xs text-gray-400 italic py-2 px-2">Tất cả đã được xếp vào ô ✓</p>
          ) : (
            poolItems.map((pair) => (
              <div
                key={pair.id}
                onClick={(e) => { e.stopPropagation(); handleItemClick(pair); }}
              >
                <DragItemCard
                  pair={pair}
                  dragging={dragging}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                />
                {touchSelected?.id === pair.id && (
                  <div className="mt-1 text-[10px] text-center text-indigo-600 font-semibold animate-pulse">
                    Đang chọn ↓
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Drop Zones */}
      <div className={`grid gap-4 ${dropZones.length <= 2 ? 'grid-cols-2' : dropZones.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {dropZones.map((zone) => {
          const zoneItems = pairs.filter((p) => placed[p.id] === zone.label);
          const isOver = dragOverZone === zone.label;
          const isTarget = !!touchSelected;

          return (
            <div
              key={zone.label}
              onDragOver={(e) => { e.preventDefault(); setDragOverZone(zone.label); }}
              onDragLeave={() => setDragOverZone(null)}
              onDrop={(e) => handleDropOnZone(e, zone.label)}
              onClick={() => handleZoneClick(zone.label)}
              className={`min-h-[130px] rounded-xl border-2 transition-all cursor-pointer ${
                isOver
                  ? 'border-indigo-500 bg-indigo-50 shadow-md scale-[1.01]'
                  : isTarget
                  ? 'border-indigo-300 bg-indigo-50/40 shadow-sm'
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300'
              }`}
            >
              {/* Zone header */}
              <div className={`px-4 py-2.5 border-b text-sm font-bold text-center transition-colors ${
                isOver ? 'border-indigo-300 bg-indigo-100 text-indigo-800' : 'border-gray-200 bg-white text-gray-700'
              }`}>
                {zone.image_url && (
                  <img src={zone.image_url} alt="" className="h-8 w-auto mx-auto mb-1 object-contain" />
                )}
                {zone.label}
              </div>

              {/* Dropped items */}
              <div className="p-2 flex flex-wrap gap-2 min-h-[80px]">
                {zoneItems.length === 0 ? (
                  <div className="w-full flex items-center justify-center text-gray-300 text-xs">
                    {isOver ? '↓ Thả vào đây' : 'Kéo vào đây'}
                  </div>
                ) : (
                  zoneItems.map((pair) => (
                    <div
                      key={pair.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Click placed item to return to pool
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

      {/* Progress hint */}
      <p className="text-xs text-gray-400 text-right">
        Đã xếp {Object.keys(placed).length} / {pairs.length} mục
        {Object.keys(placed).length > 0 && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="ml-3 text-red-400 hover:text-red-600 underline"
          >
            Làm lại
          </button>
        )}
      </p>
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
      {/* Question content */}
      <div className="space-y-3">
        <p className="text-base font-semibold text-gray-900 leading-relaxed">
          {question.content}
        </p>
        {question.image_url && (
          <img
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
      </div>
    </div>
  );
};
