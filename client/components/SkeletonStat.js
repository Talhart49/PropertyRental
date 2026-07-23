export default function SkeletonStat() {
  return (
    <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm animate-pulse">
      <div className="h-4 w-24 bg-surface-200 rounded" />
      <div className="h-8 w-16 bg-surface-200 rounded mt-3" />
    </div>
  );
}