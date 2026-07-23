"use client";

import Link from "next/link";

export default function HeroSection({
  badge,
  title,
  subtitle,
  gradient = "from-brand-600 via-brand-500 to-violet-500",
  children,
}) {
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${gradient}`}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,255,255,0.15),transparent)]" />
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 relative">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
            {badge}
          </span>
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-white md:text-3xl lg:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-base text-white/80">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}