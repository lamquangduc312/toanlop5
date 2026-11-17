interface Props {
  value: number; // 0..1
  colorClass?: string;
  className?: string;
}

export default function ProgressBar({ value, colorClass = 'bg-pink-500', className = '' }: Props) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-slate-100 ${className}`}>
      <div className={`h-full rounded-full transition-all ${colorClass}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
