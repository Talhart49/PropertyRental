"use client";

import Link from "next/link";

export default function QuickActions({ actions }) {
  return (
    <section className="mx-auto grid max-w-7xl gap-6 px-4 -mt-8 sm:px-6 lg:grid-cols-2 lg:px-8 relative z-10">
      {actions.map((action) => (
        <Link
          key={action.title}
          href={action.href}
          className={`group relative overflow-hidden rounded-2xl border border-surface-200 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-lg hover:${action.hoverBorder || "border-brand-200"} hover:-translate-y-1`}
        >
          <div
            className={`absolute inset-0 bg-gradient-to-br ${action.gradient || "from-brand-50/50 via-transparent to-transparent"} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
          />
          <div className="relative flex items-start gap-5">
            <span
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${action.iconBg || "bg-brand-50"} ${action.iconColor || "text-brand-600"} transition-all duration-300 group-hover:scale-110`}
            >
              {action.icon}
            </span>
            <div>
              <h2 className="text-xl font-semibold text-surface-900">
                {action.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-surface-500">
                {action.description}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </section>
  );
}