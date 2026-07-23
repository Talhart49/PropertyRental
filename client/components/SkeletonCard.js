export default function SkeletonCard() {
  return (
    <div className="rounded-xl border border-surface-100 p-5 animate-pulse space-y-3">
      <div className="h-5 w-48 bg-surface-200 rounded" />
      <div className="h-4 w-64 bg-surface-200 rounded" />
      <div className="h-4 w-40 bg-surface-200 rounded" />
      <div className="flex gap-2 pt-2">
        <div className="h-8 w-20 bg-surface-200 rounded-lg" />
        <div className="h-8 w-20 bg-surface-200 rounded-lg" />
        <div className="h-8 w-20 bg-surface-200 rounded-lg" />
      </div>
    </div>
  );
}