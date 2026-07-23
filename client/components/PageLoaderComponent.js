"use client";

import SiteHeader from "./SiteHeader";

export default function PageLoader() {
  return (
    <main className="min-h-screen bg-white">
      <SiteHeader />
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative mx-auto h-10 w-10">
            <div className="absolute inset-0 rounded-full border-4 border-surface-200" />
            <div className="absolute inset-0 rounded-full border-4 border-t-brand-500 animate-spin" />
          </div>
          <p className="mt-4 text-sm text-surface-400">Loading...</p>
        </div>
      </div>
    </main>
  );
}