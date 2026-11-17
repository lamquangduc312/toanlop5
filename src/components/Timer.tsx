import { AlarmClock } from 'lucide-react';
import { formatDuration } from '../lib/grading';

interface Props {
  remainingSec: number;
  totalSec: number;
}

/** Đồng hồ đếm ngược: xanh → vàng (≤ 10 phút) → đỏ nhấp nháy (≤ 5 phút) */
export default function Timer({ remainingSec, totalSec }: Props) {
  const danger = remainingSec <= 5 * 60;
  const warn = remainingSec <= 10 * 60;
  const cls = danger ? 'bg-red-500 text-white animate-pulse' : warn ? 'bg-amber-400 text-slate-900' : 'bg-emerald-500 text-white';
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 font-mono text-lg font-extrabold tabular-nums ${cls}`}
      role="timer"
      aria-label={`Còn lại ${formatDuration(remainingSec)} trên ${formatDuration(totalSec)}`}
    >
      <AlarmClock className="h-5 w-5" />
      {formatDuration(remainingSec)}
    </div>
  );
}
