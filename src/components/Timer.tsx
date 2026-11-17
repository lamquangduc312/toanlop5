import { formatDuration } from '../lib/grading';

interface Props {
  remainingSec: number;
  totalSec: number;
}

/** Đồng hồ đếm ngược: xanh → vàng (≤ 10 phút) → đỏ nhấp nháy (≤ 5 phút) */
export default function Timer({ remainingSec, totalSec }: Props) {
  const danger = remainingSec <= 5 * 60;
  const warn = remainingSec <= 10 * 60;
  const cls = danger
    ? 'bg-red-500 border-red-700 text-white animate-pulse'
    : warn
      ? 'bg-amber-300 border-amber-500 text-amber-950'
      : 'bg-emerald-500 border-emerald-700 text-white';
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-2xl border-b-4 px-3.5 py-1.5 font-display text-2xl font-extrabold tabular-nums ${cls}`}
      role="timer"
      aria-label={`Còn lại ${formatDuration(remainingSec)} trên ${formatDuration(totalSec)}`}
    >
      <span className={danger ? 'animate-wiggle' : ''} aria-hidden>
        ⏰
      </span>
      {formatDuration(remainingSec)}
    </div>
  );
}
