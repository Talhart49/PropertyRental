"use client";

export function PropertyCardSkeleton({ variant = "default" }) {
  if (variant === "horizontal") {
    return (
      <div className="group relative overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-sm animate-pulse">
        <div className="grid md:grid-cols-[280px_1fr]">
          <div className="h-56 md:h-full bg-surface-200" />
          <div className="p-6 space-y-4">
            <div className="h-3 w-16 bg-surface-200 rounded" />
            <div className="h-5 w-48 bg-surface-200 rounded" />
            <div className="flex gap-4">
              <div className="h-4 w-20 bg-surface-200 rounded" />
              <div className="h-4 w-20 bg-surface-200 rounded" />
              <div className="h-4 w-24 bg-surface-200 rounded" />
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-surface-100">
              <div className="h-4 w-32 bg-surface-200 rounded" />
              <div className="h-9 w-24 bg-surface-200 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-sm animate-pulse">
      <div className="h-52 bg-surface-200" />
      <div className="p-6 space-y-4">
        <div className="h-3 w-16 bg-surface-200 rounded" />
        <div className="h-5 w-40 bg-surface-200 rounded" />
        <div className="flex gap-4">
          <div className="h-4 w-16 bg-surface-200 rounded" />
          <div className="h-4 w-16 bg-surface-200 rounded" />
        </div>
        <div className="flex justify-between items-center pt-4 border-t border-surface-100">
          <div className="h-4 w-28 bg-surface-200 rounded" />
          <div className="h-9 w-24 bg-surface-200 rounded-lg" />
        </div>
      </div>
    </div>
  );
}