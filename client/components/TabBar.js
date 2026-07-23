export default function TabBar({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 rounded-xl bg-surface-100 p-1 w-fit">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 ${
            active === tab.key
              ? "bg-white text-surface-900 shadow-sm"
              : "text-surface-500 hover:text-surface-700"
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-2 text-xs text-surface-400">({tab.count})</span>
          )}
        </button>
      ))}
    </div>
  );
}