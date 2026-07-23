"use client";

export default function InlineLoader() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-surface-200 bg-white px-6 py-4 shadow-sm">
      <div className="relative h-5 w-5">
        <div className="absolute inset-0 rounded-full border-2 border-surface-200" />
        <div className="absolute inset-0 rounded-full border-2 border-t-brand-500 animate-spin" />
      </div>
      <p className="text-sm font-medium text-surface-500">Loading...</p>
    </div>
  );
}