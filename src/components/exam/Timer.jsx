import React, { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { Clock } from 'lucide-react';

/**
 * Timer component — supports two display modes:
 *   variant="compact"  → small pill for header (mobile only)
 *   variant="sidebar"  → large card for desktop sidebar
 *
 * Exposes getTimeLeft() via ref so parent can read elapsed time on submit.
 */
export const Timer = forwardRef(function Timer(
  { durationSeconds, onTimeUp, variant = 'compact' },
  ref
) {
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const firedRef  = useRef(false);
  const onTimeUpRef = useRef(onTimeUp);
  useEffect(() => { onTimeUpRef.current = onTimeUp; }, [onTimeUp]);

  useImperativeHandle(ref, () => ({
    getTimeLeft: () => timeLeft,
  }));

  useEffect(() => {
    if (timeLeft <= 0) {
      if (!firedRef.current) {
        firedRef.current = true;
        onTimeUpRef.current();
      }
      return;
    }
    const id = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(id);
  }, [timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const pct        = durationSeconds > 0 ? Math.max(0, timeLeft / durationSeconds) : 0;
  const isWarning  = timeLeft < 300 && timeLeft >= 60;
  const isDanger   = timeLeft < 60;

  const ringColor   = isDanger ? '#EF4444' : isWarning ? '#F59E0B' : '#6366F1';
  const trackColor  = isDanger ? '#FEE2E2' : isWarning ? '#FEF3C7' : '#E0E7FF';
  const textColor   = isDanger ? 'text-red-500'    : isWarning ? 'text-amber-500'    : 'text-indigo-600';
  const bgColor     = isDanger ? 'bg-red-50'       : isWarning ? 'bg-amber-50'       : 'bg-indigo-50';
  const borderColor = isDanger ? 'border-red-200'  : isWarning ? 'border-amber-200'  : 'border-indigo-100';
  const pulse       = isDanger ? 'animate-pulse' : '';

  /* ── Compact pill (mobile header) ── */
  if (variant === 'compact') {
    const radius = 16;
    const circ = 2 * Math.PI * radius;
    const dashOffset = circ * (1 - pct);
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border ${bgColor} ${borderColor} ${pulse}`}>
        <svg width="36" height="36" className="flex-shrink-0 -rotate-90" aria-hidden="true">
          <circle cx="18" cy="18" r={radius} strokeWidth="3" fill="none" stroke={trackColor} />
          <circle
            cx="18" cy="18" r={radius}
            strokeWidth="3" fill="none"
            stroke={ringColor}
            strokeDasharray={circ}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.5s ease' }}
          />
        </svg>
        <span className={`font-mono font-bold text-base leading-none ${textColor}`}>{timeStr}</span>
      </div>
    );
  }

  /* ── Sidebar card (desktop) ── */
  const radius = 52;
  const circ   = 2 * Math.PI * radius;
  const dashOffset = circ * (1 - pct);

  return (
    <div className={`bg-white rounded-2xl shadow-sm border ${borderColor} p-5 ${pulse}`}>
      {/* Header row */}
      <div className="flex items-center gap-2 mb-4">
        <Clock className={`w-4 h-4 ${textColor}`} />
        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Thời gian còn lại</span>
      </div>

      {/* Ring + time */}
      <div className="flex flex-col items-center gap-1">
        <div className="relative">
          <svg width="140" height="140" className="-rotate-90" aria-label={`Còn lại ${timeStr}`}>
            <circle cx="70" cy="70" r={radius} strokeWidth="8" fill="none" stroke={trackColor} />
            <circle
              cx="70" cy="70" r={radius}
              strokeWidth="8" fill="none"
              stroke={ringColor}
              strokeDasharray={circ}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.5s ease' }}
            />
          </svg>
          {/* Centre text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
            <span className={`font-mono font-extrabold text-2xl leading-none ${textColor}`}>{timeStr}</span>
            <span className="text-[10px] text-gray-400 mt-1 font-medium">phút : giây</span>
          </div>
        </div>

        {/* Status label */}
        {isDanger && (
          <span className="mt-1 text-xs font-semibold text-red-500 bg-red-50 px-3 py-1 rounded-full border border-red-200">
            ⚠️ Gần hết giờ!
          </span>
        )}
        {isWarning && !isDanger && (
          <span className="mt-1 text-xs font-semibold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            Còn dưới 5 phút
          </span>
        )}
      </div>
    </div>
  );
});
