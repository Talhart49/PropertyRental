"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { roleDashboardPath } from "../lib/routes";
import { useAuth } from "../app/providers";

export default function ProtectedPage({ allowedRole, children }) {
  const router = useRouter();
  const { isAuthenticated, isReady, user } = useAuth();

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (allowedRole && user?.role !== allowedRole) {
      router.replace(roleDashboardPath(user?.role));
    }
  }, [allowedRole, isAuthenticated, isReady, router, user]);

  if (!isReady || !isAuthenticated || (allowedRole && user?.role !== allowedRole)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface-50 px-6">
        <div className="flex items-center gap-3 rounded-2xl border border-surface-200 bg-white px-6 py-4 shadow-sm">
          <div className="relative h-5 w-5">
            <div className="absolute inset-0 rounded-full border-2 border-surface-200" />
            <div className="absolute inset-0 rounded-full border-2 border-t-brand-500 animate-spin" />
          </div>
          <p className="text-sm font-medium text-surface-500">Loading your dashboard...</p>
        </div>
      </main>
    );
  }

  return children;
}
