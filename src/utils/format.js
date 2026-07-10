export function formatDurationLabel(secs) {
  if (!secs && secs !== 0) return '--';
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
}
