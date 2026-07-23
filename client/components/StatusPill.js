"use client";

export default function StatusPill({ children, size = "sm" }) {
  const colors = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
    completed: "bg-blue-50 text-blue-700 border-blue-200",
    admin: "bg-violet-50 text-violet-700 border-violet-200",
    landlord: "bg-brand-50 text-brand-700 border-brand-200",
    tenant: "bg-surface-100 text-surface-700 border-surface-200",
  };
  const colorClass = colors[children?.toLowerCase()] || "bg-surface-100 text-surface-700 border-surface-200";
  const sizeClass = size === "sm" ? "px-2.5 py-0.5 text-[10px]" : "px-3 py-1 text-xs";

  return (
    <span className={`w-fit rounded-xl border font-semibold uppercase tracking-wider ${sizeClass} ${colorClass}`}>
      {children}
    </span>
  );
}