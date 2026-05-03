import React from 'react';
import { Flag } from 'lucide-react';

export const QuestionNavigator = ({ questions, currentIndex, answers, flagged, onSelect }) => {
  const answeredCount = questions.filter(q => answers[q.id] !== undefined).length;
  const total = questions.length;
  const pct = total > 0 ? (answeredCount / total) * 100 : 0;

  const flaggedQuestions = questions.filter(q => flagged.includes(q.id));
  const unflaggedQuestions = questions.filter(q => !flagged.includes(q.id));

  const getButtonStyle = (q, index) => {
    const isCurrent  = currentIndex === index;
    const isAnswered = answers[q.id] !== undefined;
    const isFlagged  = flagged.includes(q.id);

    if (isCurrent)  return 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200 scale-110 z-10';
    if (isFlagged && isAnswered)  return 'bg-amber-400 text-white border-amber-400';
    if (isFlagged)  return 'bg-amber-100 text-amber-700 border-amber-300';
    if (isAnswered) return 'bg-emerald-500 text-white border-emerald-500';
    return 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50';
  };

  const QButton = ({ q, index }) => (
    <button
      onClick={() => onSelect(index)}
      title={`Câu ${index + 1}`}
      className={`relative w-10 h-10 border-2 rounded-xl flex items-center justify-center text-sm font-semibold transition-all ${getButtonStyle(q, index)}`}
    >
      {index + 1}
      {flagged.includes(q.id) && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white" />
      )}
    </button>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-gray-800">Câu hỏi</h3>
          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
            {answeredCount}/{total}
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="p-4 space-y-4 flex-1 overflow-y-auto min-h-0">
        {/* Main grid */}
        <div className="grid grid-cols-5 gap-2">
          {unflaggedQuestions.map((q) => {
            const idx = questions.indexOf(q);
            return <QButton key={q.id} q={q} index={idx} />;
          })}
        </div>

        {/* Flagged section */}
        {flaggedQuestions.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-2 flex items-center gap-1">
              <Flag className="w-3 h-3" /> Đã đánh dấu
            </p>
            <div className="grid grid-cols-5 gap-2">
              {flaggedQuestions.map((q) => {
                const idx = questions.indexOf(q);
                return <QButton key={q.id} q={q} index={idx} />;
              })}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="px-4 pb-4 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-gray-500 flex-shrink-0 border-t border-gray-100 pt-3">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-emerald-500 flex-shrink-0" />
          Đã trả lời
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-white border-2 border-gray-200 flex-shrink-0" />
          Chưa làm
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-indigo-600 flex-shrink-0" />
          Hiện tại
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-amber-400 flex-shrink-0" />
          Đánh dấu
        </div>
      </div>
    </div>
  );
};
