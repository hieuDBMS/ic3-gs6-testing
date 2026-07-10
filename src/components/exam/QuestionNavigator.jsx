import React, { useEffect } from 'react';
import { Flag } from 'lucide-react';

const QuestionNavigatorImpl = ({ questions, currentIndex, answers, flagged, onSelect, dark = false }) => {
  useEffect(() => {
    const el = document.getElementById(`nav-btn-${currentIndex}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentIndex]);
  const answeredCount = questions.filter(q => answers[q.id] !== undefined).length;
  const total = questions.length;
  const pct   = total > 0 ? (answeredCount / total) * 100 : 0;

  const getButtonStyle = (q, index) => {
    const isCurrent  = currentIndex === index;
    const isAnswered = answers[q.id] !== undefined;
    const isFlagged  = flagged.includes(q.id);

    if (dark) {
      if (isCurrent)               return 'bg-white text-slate-900 shadow-lg shadow-black/30 scale-110 z-10 border-white';
      if (isFlagged && isAnswered) return 'bg-amber-500 text-white border-amber-500';
      if (isFlagged)               return 'bg-amber-500/20 text-amber-300 border border-amber-500/40';
      if (isAnswered)              return 'bg-emerald-500 text-white border-emerald-500';
      return 'bg-slate-700/70 text-slate-300 border border-slate-600/60 hover:bg-slate-600 hover:text-white hover:border-slate-500';
    }

    /* light mode */
    if (isCurrent)               return 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200/60 scale-110 z-10';
    if (isFlagged && isAnswered) return 'bg-amber-400 text-white border-amber-400';
    if (isFlagged)               return 'bg-amber-100 text-amber-700 border-amber-300';
    if (isAnswered)              return 'bg-emerald-500 text-white border-emerald-500';
    return 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50';
  };

  const QButton = ({ q, index }) => (
    <button
      id={`nav-btn-${index}`}
      onClick={() => onSelect(index)}
      title={`Câu ${index + 1}`}
      className={`relative w-9 h-9 border-2 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-150 ${getButtonStyle(q, index)}`}
    >
      {index + 1}
      {flagged.includes(q.id) && (
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-inherit" />
      )}
    </button>
  );

  const flaggedQuestions   = questions.filter(q => flagged.includes(q.id));
  const unflaggedQuestions = questions.filter(q => !flagged.includes(q.id));

  /* ── style tokens ── */
  const dividerCls  = dark ? 'border-white/10' : 'border-gray-100';
  const titleCls    = dark ? 'text-white'       : 'text-gray-800';
  const countCls    = dark
    ? 'text-emerald-400 bg-emerald-500/15 border border-emerald-500/25'
    : 'text-indigo-600 bg-indigo-50';
  const trackCls    = dark ? 'bg-white/10'      : 'bg-gray-100';
  const legendCls   = dark ? 'text-slate-400'   : 'text-gray-500';
  const sectionCls  = dark ? 'text-amber-400'   : 'text-amber-500';

  return (
    <div className={`flex flex-col flex-1 min-h-0 ${!dark ? 'bg-white rounded-2xl shadow-sm border border-gray-100' : ''}`}>

      {/* ── Header ── */}
      <div className={`px-4 pt-4 pb-3 border-b ${dividerCls} flex-shrink-0`}>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className={`text-sm font-bold ${titleCls}`}>Câu hỏi</h3>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${countCls}`}>
            {answeredCount}/{total}
          </span>
        </div>
        {/* Progress bar */}
        <div className={`h-1.5 rounded-full overflow-hidden ${trackCls}`}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #6366F1, #8B5CF6)' }}
          />
        </div>
      </div>

      {/* ── Question grid (scrollable) ── */}
      <div className={`p-4 space-y-3 flex-1 overflow-y-auto min-h-0 pr-2 ${dark ? 'custom-scrollbar-dark' : 'custom-scrollbar-light'}`}>
        {/* Unflagged */}
        <div className="grid grid-cols-5 gap-1.5">
          {unflaggedQuestions.map(q => {
            const idx = questions.indexOf(q);
            return <QButton key={q.id} q={q} index={idx} />;
          })}
        </div>

        {/* Flagged section */}
        {flaggedQuestions.length > 0 && (
          <div>
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1 ${sectionCls}`}>
              <Flag className="w-3 h-3" /> Đánh dấu
            </p>
            <div className="grid grid-cols-5 gap-1.5">
              {flaggedQuestions.map(q => {
                const idx = questions.indexOf(q);
                return <QButton key={q.id} q={q} index={idx} />;
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Legend ── */}
      <div className={`px-4 pb-4 pt-3 border-t ${dividerCls} flex-shrink-0 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs ${legendCls}`}>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-emerald-500 flex-shrink-0" />
          Đã trả lời
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-3 h-3 rounded-md flex-shrink-0 ${dark ? 'bg-slate-700 border border-slate-600' : 'bg-white border-2 border-gray-200'}`} />
          Chưa làm
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-3 h-3 rounded-full flex-shrink-0 ${dark ? 'bg-white' : 'bg-indigo-600'}`} />
          Hiện tại
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-amber-500 flex-shrink-0" />
          Đánh dấu
        </div>
      </div>
    </div>
  );
};

export const QuestionNavigator = React.memo(QuestionNavigatorImpl);
