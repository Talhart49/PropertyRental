"use client";

import { useAuth } from "../app/providers";
import SiteHeader from "./SiteHeader";

export default function DashboardShell({ badge, children, description, title }) {
  const { user } = useAuth();

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }

  return (
    <main className="min-h-screen bg-surface-50">
      <SiteHeader />

      {/* Hero header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-500 to-brand-400">
        {/* Decorative blobs */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,255,255,0.15),transparent)]" />
        <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -top-20 -left-20 h-48 w-48 rounded-full bg-white/5 blur-3xl" />

        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 relative">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 min-w-0">
              {user?.name && (
                <p className="text-sm font-medium text-white/70 mb-2">
                  {getGreeting()}, <span className="text-white font-semibold">{user.name.split(" ")[0]}</span>
                </p>
              )}
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
                {badge || `${user?.role} Dashboard`}
              </span>
              {title && (
                <h1 className="mt-3 text-2xl font-bold text-white sm:text-3xl lg:text-4xl tracking-tight">
                  {title}
                </h1>
              )}
              <p className="mt-2 max-w-2xl text-base text-white/80">
                {description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <section className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </section>
    </main>
  );
}