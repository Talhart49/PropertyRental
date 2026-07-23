"use client";

export default function StatCard({ label, value, sublabel, icon, gradient, trend }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-surface-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
      {/* Gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient || "from-brand-50/50 via-transparent to-transparent"} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      {/* Decorative dot pattern */}
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-surface-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-surface-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-surface-900 tracking-tight">{value}</p>
          {sublabel && (
            <p className="mt-1 text-xs text-surface-400 flex items-center gap-1">
              {trend === "up" && (
                <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                </svg>
              )}
              {trend === "down" && (
                <svg className="h-3.5 w-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 015.306 1.162l2.144 1.066m0 0l-5.94 2.28m5.94-2.28l2.28 5.94" />
                </svg>
              )}
              {sublabel}
            </p>
          )}
        </div>
        {icon && (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-50 text-surface-400 group-hover:bg-white/80 group-hover:text-brand-500 transition-all duration-300">
            {icon}
          </span>
        )}
      </div>
      {/* Bottom accent bar */}
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${gradient || "from-brand-300 to-brand-500"} scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`} />
    </div>
  );
}