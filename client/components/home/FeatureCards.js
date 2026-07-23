"use client";

import Link from "next/link";

export default function FeatureCards({ features }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid gap-8 md:grid-cols-2">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="group relative overflow-hidden rounded-2xl border border-surface-200 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-brand-200 hover:-translate-y-1"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${feature.gradient || "from-brand-50/50 via-transparent to-transparent"} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
            />
            <div className="relative">
              <span
                className={`flex h-14 w-14 items-center justify-center rounded-2xl ${feature.iconBg || "bg-brand-50"} ${feature.iconColor || "text-brand-600"} transition-all duration-300 group-hover:scale-110`}
              >
                {feature.icon}
              </span>
              <h2 className="mt-6 text-xl font-bold text-surface-900">
                {feature.title}
              </h2>
              <p className="mt-3 text-base leading-relaxed text-surface-500">
                {feature.description}
              </p>
              {feature.buttonText && feature.buttonHref && (
                <Link
                  className={`mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-md active:scale-95 ${feature.buttonColor || "bg-brand-500 hover:bg-brand-600"}`}
                  href={feature.buttonHref}
                >
                  {feature.buttonText}
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                    />
                  </svg>
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}