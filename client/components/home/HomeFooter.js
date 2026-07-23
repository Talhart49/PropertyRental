"use client";

import Link from "next/link";

export default function HomeFooter({ variant = "simple" }) {
  const simpleFooter = (
    <footer className="border-t border-surface-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 sm:px-6 lg:flex-row lg:px-8">
        <p className="text-sm text-surface-400">
          &copy; 2026 PropertyRental. All rights reserved.
        </p>
      </div>
    </footer>
  );

  const detailedFooter = (
    <footer className="border-t border-surface-200 bg-surface-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-lg font-bold text-brand-600">
                PR
              </span>
              <span className="text-lg font-bold text-surface-900">
                PropertyRental
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-surface-500">
              The direct platform connecting tenants and landlords. No estate
              agents, no hidden fees.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-surface-900">
              Quick Links
            </h4>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href="/tenant/search"
                  className="text-sm text-surface-500 hover:text-surface-700 transition-colors"
                >
                  Browse Properties
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="text-sm text-surface-500 hover:text-surface-700 transition-colors"
                >
                  Create Account
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-sm text-surface-500 hover:text-surface-700 transition-colors"
                >
                  Sign In
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-surface-900">
              For Landlords
            </h4>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href="/register"
                  className="text-sm text-surface-500 hover:text-surface-700 transition-colors"
                >
                  List a Property
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="text-sm text-surface-500 hover:text-surface-700 transition-colors"
                >
                  Get Started
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-surface-200 pt-8 text-center">
          <p className="text-sm text-surface-400">
            &copy; 2026 PropertyRental. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );

  return variant === "detailed" ? detailedFooter : simpleFooter;
}