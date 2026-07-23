"use client";

import Link from "next/link";

export default function HowItWorks({
  badge,
  title,
  subtitle,
  steps,
  buttonText,
  buttonHref,
  colorScheme = "brand",
}) {
  const colorClasses = {
    brand: {
      badge: "bg-brand-50 text-brand-700",
      icon: "bg-brand-100 text-brand-700",
      step: "bg-brand-500 text-white",
      button: "bg-brand-500 hover:bg-brand-600 shadow-brand-500/25",
    },
    emerald: {
      badge: "bg-emerald-50 text-emerald-700",
      icon: "bg-emerald-100 text-emerald-700",
      step: "bg-emerald-500 text-white",
      button: "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/25",
    },
    violet: {
      badge: "bg-violet-50 text-violet-700",
      icon: "bg-violet-100 text-violet-700",
      step: "bg-violet-500 text-white",
      button: "bg-violet-500 hover:bg-violet-600 shadow-violet-500/25",
    },
  };

  const colors = colorClasses[colorScheme] || colorClasses.brand;

  return (
    <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <span
            className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider ${colors.badge}`}
          >
            {badge}
          </span>
          <h2 className="mt-4 text-2xl font-bold text-surface-900">{title}</h2>
          <p className="mt-2 text-surface-500">{subtitle}</p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors.icon}`}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-surface-900">
              {colorScheme === "emerald" ? "For Landlords" : "For Tenants"}
            </h3>
          </div>
          <div className="space-y-4">
            {steps.map((item) => (
              <div key={item.step} className="flex gap-4">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${colors.step} text-sm font-bold text-white`}
                >
                  {item.step}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-surface-900">
                    {item.title}
                  </h4>
                  <p className="mt-1 text-sm text-surface-500">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {buttonText && buttonHref && (
          <div className="mt-12 text-center">
            <Link
              className={`inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:shadow-xl active:scale-95 ${colors.button}`}
              href={buttonHref}
            >
              {buttonText}
              <svg
                className="h-5 w-5"
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
          </div>
        )}
      </div>
    </section>
  );
}