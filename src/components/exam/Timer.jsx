import { useEffect, useState, useRef, forwardRef, useImperativeHandle, memo } from "react";
import { useTranslation } from 'react-i18next';

/**
 * Timer — ONE instance, TWO responsive layouts via CSS:
 *   mobile  → compact pill (shown via `md:hidden`)
 *   desktop → large ring in dark sidebar (shown via `hidden md:flex`)
 *
 * Exposes getTimeLeft() via ref so parent can read elapsed time on submit.
 */
const TimerImpl = forwardRef(function Timer({ durationSeconds, onTimeUp, dark = true, startedAt }, ref) {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState(() => {
    if (!startedAt) return durationSeconds;
    const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
    return Math.max(0, durationSeconds - elapsed);
  });
  const firedRef    = useRef(false);
  const onTimeUpRef = useRef(onTimeUp);
  useEffect(() => { onTimeUpRef.current = onTimeUp; }, [onTimeUp]);

  useImperativeHandle(ref, () => ({ getTimeLeft: () => timeLeft }));

  useEffect(() => {
    if (timeLeft <= 0) {
      if (!firedRef.current) { firedRef.current = true; onTimeUpRef.current(); }
      return;
    }
    const id = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(id);
  }, [timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeStr  = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const pct      = durationSeconds > 0 ? Math.max(0, timeLeft / durationSeconds) : 0;

  const isWarning = timeLeft < 300 && timeLeft >= 60;
  const isDanger  = timeLeft < 60;

  /* ── Dynamic colors ── */
  const strokeA    = isDanger ? '#EF4444' : isWarning ? '#F59E0B' : '#6366F1';
  const strokeB    = isDanger ? '#F97316' : isWarning ? '#FBBF24' : '#8B5CF6';
  const trackAlpha = isDanger ? '0.18'    : isWarning ? '0.18'    : dark ? '0.14' : '0.1';
  const trackColor = isDanger
    ? `rgba(239,68,68,${trackAlpha})`
    : isWarning
      ? `rgba(245,158,11,${trackAlpha})`
      : dark ? `rgba(99,102,241,${trackAlpha})` : `rgba(99,102,241,0.15)`;
  
  const timeColor = isDanger ? '#EF4444' : isWarning ? (dark ? '#FCD34D' : '#D97706') : (dark ? '#A5B4FC' : '#1E293B');
  const labelColor = isDanger ? '#EF4444' : isWarning ? (dark ? '#FCD34D' : '#D97706') : (dark ? '#64748B' : '#64748B');

  /* ── Compact geometry ── */
  const cr    = 13;
  const cCirc = 2 * Math.PI * cr;
  const cOff  = cCirc * (1 - pct);

  /* ── Sidebar geometry ── */
  const sr    = 56;
  const sCirc = 2 * Math.PI * sr;
  const sOff  = sCirc * (1 - pct);

  const glowStyle = isDanger
    ? { filter: 'drop-shadow(0 0 8px rgba(239,68,68,0.6))' }
    : isWarning
      ? { filter: 'drop-shadow(0 0 6px rgba(245,158,11,0.5))' }
      : {};

  return (
    <>
      {/* ═══════════════════════════════════════════════
          COMPACT — mobile top bar  (hidden on md+)
      ═══════════════════════════════════════════════ */}
      <div className={`md:hidden flex items-center gap-2 ${isDanger ? 'animate-pulse' : ''}`}>
        <svg width="30" height="30" className="-rotate-90 shrink-0" style={glowStyle}>
          <circle cx="15" cy="15" r={cr} strokeWidth="2.5" fill="none" stroke={trackColor} />
          <circle
            cx="15" cy="15" r={cr}
            strokeWidth="2.5" fill="none"
            stroke={strokeA}
            strokeDasharray={cCirc}
            strokeDashoffset={cOff}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.5s ease' }}
          />
        </svg>
        <span
          className="font-mono font-bold text-base leading-none tabular-nums"
          style={{ color: timeColor }}
        >
          {timeStr}
        </span>
      </div>

      {/* ═══════════════════════════════════════════════
          SIDEBAR — desktop ring  (hidden on mobile)
      ═══════════════════════════════════════════════ */}
      <div className={`hidden md:flex flex-col items-center gap-3 w-full ${isDanger ? 'animate-pulse' : ''}`}>
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: labelColor }}>
          {t('timer.label')}
        </p>

        <div className="relative" style={glowStyle}>
          <svg width="152" height="152" className="-rotate-90" aria-label={t('timer.ariaRemaining', { time: timeStr })}>
            <defs>
              <linearGradient id="timerRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stopColor={strokeA} />
                <stop offset="100%" stopColor={strokeB} />
              </linearGradient>
            </defs>
            {/* Track */}
            <circle cx="76" cy="76" r={sr} strokeWidth="10" fill="none" stroke={trackColor} />
            {/* Progress ring */}
            <circle
              cx="76" cy="76" r={sr}
              strokeWidth="10" fill="none"
              stroke="url(#timerRingGrad)"
              strokeDasharray={sCirc}
              strokeDashoffset={sOff}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.9s linear' }}
            />
          </svg>

          {/* Centre text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="font-mono font-extrabold text-[2rem] leading-none tabular-nums"
              style={{ color: timeColor }}
            >
              {timeStr}
            </span>
            <span className="text-[10px] font-bold mt-1 uppercase tracking-widest" style={{ color: dark ? '#475569' : '#94A3B8' }}>
              {t('timer.unitLabel')}
            </span>
          </div>
        </div>

        {/* Status badge */}
        {isDanger && (
          <span className="text-xs font-bold px-3 py-1 rounded-full border"
            style={{ color: '#F87171', background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.25)' }}>
            {t('timer.dangerBadge')}
          </span>
        )}
        {isWarning && !isDanger && (
          <span className="text-xs font-semibold px-3 py-1 rounded-full border"
            style={{ color: '#FCD34D', background: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.25)' }}>
            {t('timer.warningBadge')}
          </span>
        )}
      </div>
    </>
  );
});

export const Timer = memo(TimerImpl);
