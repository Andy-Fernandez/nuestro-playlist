export function formatTime(s: number): string {
  if (!Number.isFinite(s) || s < 0) return '00:00';
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}
