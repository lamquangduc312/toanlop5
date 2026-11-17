interface Props {
  value: number; // 0..1
  colorClass?: string;
  className?: string;
}

export default function ProgressBar({ value, colorClass = 'bg-pink-500', className = 'h-3' }: Props) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className={`w-full overflow-hidden rounded-full bg-slate-100 ring-1 ring-inset ring-slate-200/60 ${className}`}>
      <div className={`h-full rounded-full transition-all duration-500 ${colorClass}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
