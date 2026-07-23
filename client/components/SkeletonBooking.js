export default function SkeletonBooking() {
  return (
    <div className="rounded-xl border border-surface-100 p-4 animate-pulse space-y-2">
      <div className="h-5 w-48 bg-surface-200 rounded" />
      <div className="h-4 w-64 bg-surface-200 rounded" />
      <div className="h-4 w-32 bg-surface-200 rounded" />
    </div>
  );
}