"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../components/../app/providers";
import { apiRequest } from "../../components/../lib/api";
import ProtectedPage from "../../components/ProtectedPage";
import DashboardShell from "../../components/DashboardShell";
import BookingLists from "../../components/BookingLists";
import StatCard from "../../components/StatCard";

export default function TenantDashboardPage() {
  const { token } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      return;
    }

    async function loadStats() {
      try {
        const payload = await apiRequest("/api/bookings/mine", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const bookings = payload.data.bookings;
        setTotalCount(bookings.length);
        setPendingCount(bookings.filter((b) => b.status === "pending").length);
        setApprovedCount(bookings.filter((b) => b.status === "approved").length);
        setRejectedCount(bookings.filter((b) => b.status === "rejected").length);
      } catch (_error) {
        // Silently fail — the BookingLists component will show errors
      } finally {
        setIsLoading(false);
      }
    }

    loadStats();
  }, [token]);

  return (
    <ProtectedPage allowedRole="tenant">
      <DashboardShell
        badge="Dashboard"
        description="Track your booking requests and manage your account."
        title="Tenant dashboard"
      >
        <div className="flex flex-col gap-6">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm animate-pulse">
                  <div className="h-4 w-24 bg-surface-200 rounded" />
                  <div className="h-8 w-16 bg-surface-200 rounded mt-3" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Total Requests"
                value={totalCount}
                gradient="from-brand-50/50 via-transparent to-transparent"
                icon={
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                }
              />
              <StatCard
                label="Pending"
                value={pendingCount}
                gradient="from-amber-50/50 via-transparent to-transparent"
                icon={
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <StatCard
                label="Approved"
                value={approvedCount}
                gradient="from-emerald-50/50 via-transparent to-transparent"
                icon={
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <StatCard
                label="Rejected"
                value={rejectedCount}
                gradient="from-red-50/50 via-transparent to-transparent"
                icon={
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                }
              />
            </div>
          )}

          {/* Quick actions */}
          {!isLoading && (
            <div className="grid gap-4 sm:grid-cols-2">
              <a
                href="/tenant/search"
                className="group relative overflow-hidden rounded-2xl border border-surface-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-brand-50/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 group-hover:bg-brand-100 transition-colors">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                  </span>
                  <div>
                    <h3 className="font-semibold text-surface-900">Browse properties</h3>
                    <p className="text-sm text-surface-500">Search and discover available rentals</p>
                  </div>
                  <svg className="ml-auto h-5 w-5 text-surface-300 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </a>
              <a
                href="/messages"
                className="group relative overflow-hidden rounded-2xl border border-surface-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-violet-50/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-600 group-hover:bg-violet-100 transition-colors">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                    </svg>
                  </span>
                  <div>
                    <h3 className="font-semibold text-surface-900">Messages</h3>
                    <p className="text-sm text-surface-500">Chat with landlords about your inquiries</p>
                  </div>
                  <svg className="ml-auto h-5 w-5 text-surface-300 group-hover:text-violet-500 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </a>
            </div>
          )}

          <BookingLists mode="mine" />
        </div>
      </DashboardShell>
    </ProtectedPage>
  );
}