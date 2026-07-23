export default function Section({ title, subtitle, children, action }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-surface-100 px-6 py-5">
        <div>
          <h2 className="text-lg font-semibold text-surface-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-surface-400">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="px-6 pb-5">
        {children}
      </div>
    </section>
  );
}