"use client";

export default function ProgressBar({ value, max, color = "bg-brand-500", label }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 text-xs text-surface-500 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-surface-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 text-right text-xs font-semibold text-surface-700">{value}</span>
    </div>
  );
}