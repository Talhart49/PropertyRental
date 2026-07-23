"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "../app/providers";
import { apiRequest } from "../lib/api";
import { formatRent } from "../lib/properties";
import ProgressBar from "./ProgressBar";
import StatCard from "./StatCard";
import StatusPill from "./StatusPill";
import SkeletonStat from "./SkeletonStat";
import SkeletonRow from "./SkeletonRow";
import SkeletonCard from "./SkeletonCard";
import SkeletonBooking from "./SkeletonBooking";
import Section from "./Section";
import TabBar from "./TabBar";

function formatDate(value) {
  return new Date(value).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

/**
 * A small pagination bar with page numbers and prev/next buttons.
 */
function PaginationBar({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <button
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-sm font-medium text-surface-600 transition hover:bg-surface-50 disabled:opacity-40 disabled:cursor-not-allowed"
        type="button"
      >
        ← Prev
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
        .map((p, idx, arr) => (
          <span key={p} className="flex items-center gap-1">
            {idx > 0 && arr[idx - 1] !== p - 1 && (
              <span className="px-1 text-surface-300">…</span>
            )}
            <button
              onClick={() => onChange(p)}
              className={`min-w-[2rem] rounded-lg px-2 py-1.5 text-sm font-medium transition ${
                p === page
                  ? "bg-brand-500 text-white shadow-sm"
                  : "border border-surface-200 bg-white text-surface-600 hover:bg-surface-50"
              }`}
              type="button"
            >
              {p}
            </button>
          </span>
        ))}
      <button
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className="rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-sm font-medium text-surface-600 transition hover:bg-surface-50 disabled:opacity-40 disabled:cursor-not-allowed"
        type="button"
      >
        Next →
      </button>
    </div>
  );
}

/**
 * A small sort control: clicking the label toggles asc/desc.
 */
function SortControl({ label, field, currentField, currentOrder, onChange }) {
  const isActive = currentField === field;
  return (
    <button
      onClick={() => {
        if (isActive) {
          // toggle order
          onChange(field, currentOrder === "asc" ? "desc" : "asc");
        } else {
          onChange(field, "desc");
        }
      }}
      className={`inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider transition ${
        isActive ? "text-brand-600" : "text-surface-500 hover:text-surface-700"
      }`}
      type="button"
    >
      {label}
      {isActive && (
        <svg className={`h-3 w-3 transition-transform ${currentOrder === "asc" ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      )}
    </button>
  );
}

export default function AdminDashboard() {
  const { token } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [properties, setProperties] = useState([]);
  const [success, setSuccess] = useState("");
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("users");

  // Pagination state
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [propertyPage, setPropertyPage] = useState(1);
  const [propertyTotalPages, setPropertyTotalPages] = useState(1);
  const [bookingPage, setBookingPage] = useState(1);
  const [bookingTotalPages, setBookingTotalPages] = useState(1);
  const pageSize = 20;

  // Sorting state
  const [userSortBy, setUserSortBy] = useState("createdAt");
  const [userSortOrder, setUserSortOrder] = useState("desc");
  const [propertySortBy, setPropertySortBy] = useState("createdAt");
  const [propertySortOrder, setPropertySortOrder] = useState("desc");
  const [bookingSortBy, setBookingSortBy] = useState("createdAt");
  const [bookingSortOrder, setBookingSortOrder] = useState("desc");

  const buildQuery = useCallback((page, sortBy, sortOrder) => {
    return `?page=${page}&limit=${pageSize}&sortBy=${sortBy}&sortOrder=${sortOrder}`;
  }, []);

  async function loadAdminData() {
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [summaryPayload, usersPayload, propertiesPayload, bookingsPayload] =
        await Promise.all([
          apiRequest("/api/admin/summary", { headers }),
          apiRequest(`/api/admin/users${buildQuery(userPage, userSortBy, userSortOrder)}`, { headers }),
          apiRequest(`/api/admin/properties${buildQuery(propertyPage, propertySortBy, propertySortOrder)}`, { headers }),
          apiRequest(`/api/admin/bookings${buildQuery(bookingPage, bookingSortBy, bookingSortOrder)}`, { headers })
        ]);

      setSummary(summaryPayload.data.summary);
      setUsers(usersPayload.data.users);
      setUserTotalPages(usersPayload.data.pagination?.totalPages || 1);
      setProperties(propertiesPayload.data.properties);
      setPropertyTotalPages(propertiesPayload.data.pagination?.totalPages || 1);
      setBookings(bookingsPayload.data.bookings);
      setBookingTotalPages(bookingsPayload.data.pagination?.totalPages || 1);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (token) loadAdminData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, userPage, userSortBy, userSortOrder, propertyPage, propertySortBy, propertySortOrder, bookingPage, bookingSortBy, bookingSortOrder]);

  async function updateListingStatus(property, moderationStatus) {
    setError("");
    setSuccess("");
    try {
      const payload = await apiRequest(`/api/admin/properties/${property._id}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ moderationStatus })
      });
      setSuccess(payload.message);
      await loadAdminData();
    } catch (updateError) {
      setError(updateError.message);
    }
  }

  // ─── Derived data ──────────────────────────────────────
  const userRoleData = useMemo(() => {
    if (!summary) return [];
    const total = summary.users.total;
    return [
      { label: "Landlords", value: summary.users.landlords, color: "bg-brand-500" },
      { label: "Tenants", value: summary.users.tenants, color: "bg-violet-500" },
      { label: "Admins", value: summary.users.admins, color: "bg-emerald-500" },
    ];
  }, [summary]);

  const propertyStatusData = useMemo(() => {
    if (!summary) return [];
    const total = summary.properties.total;
    return [
      { label: "Active", value: summary.properties.active, color: "bg-emerald-500" },
      { label: "Pending", value: summary.properties.pending, color: "bg-amber-500" },
      { label: "Rejected", value: summary.properties.rejected, color: "bg-red-500" },
    ];
  }, [summary]);

  const bookingStatusData = useMemo(() => {
    if (!summary) return [];
    const total = summary.bookings.total;
    return [
      { label: "Pending", value: summary.bookings.pending, color: "bg-amber-500" },
      { label: "Approved", value: summary.bookings.approved, color: "bg-emerald-500" },
      { label: "Rejected", value: summary.bookings.rejected, color: "bg-red-500" },
    ];
  }, [summary]);

  const pendingCount = summary?.properties?.pending || 0;

  // ─── Tab config ─────────────────────────────────────────
  const tabs = [
    { key: "users", label: "Users", count: users.length },
    { key: "properties", label: "Listings", count: properties.length },
    { key: "bookings", label: "Bookings", count: bookings.length },
  ];

  // ─── Sort change handlers ──────────────────────────────
  function handleUserSort(field, order) {
    setUserSortBy(field);
    setUserSortOrder(order);
    setUserPage(1);
  }
  function handlePropertySort(field, order) {
    setPropertySortBy(field);
    setPropertySortOrder(order);
    setPropertyPage(1);
  }
  function handleBookingSort(field, order) {
    setBookingSortBy(field);
    setBookingSortOrder(order);
    setBookingPage(1);
  }

  // ─── Render ─────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">
      {/* ── Toolbar ───────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-surface-400">
              <div className="relative h-4 w-4">
                <div className="absolute inset-0 rounded-full border-2 border-surface-200" />
                <div className="absolute inset-0 rounded-full border-2 border-t-brand-500 animate-spin" />
              </div>
              Loading dashboard data...
            </div>
          )}
          {success && !isLoading && (
            <p className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {success}
            </p>
          )}
          {error && !isLoading && (
            <p className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              {error}
            </p>
          )}
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-xl border border-surface-300 bg-white px-5 py-2.5 text-sm font-semibold text-surface-700 shadow-sm transition-all duration-200 hover:bg-surface-50 hover:shadow-md active:scale-95 disabled:opacity-50"
          onClick={loadAdminData}
          type="button"
          disabled={isLoading}
        >
          <svg className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
          </svg>
          {isLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* ── Stats grid ────────────────────────────────── */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonStat key={i} />)}
        </div>
      ) : summary ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Users"
            value={summary.users.total}
            sublabel={`${summary.users.landlords} landlords · ${summary.users.tenants} tenants`}
            gradient="from-brand-50/50 via-transparent to-transparent"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            }
          />
          <StatCard
            label="Total Listings"
            value={summary.properties.total}
            sublabel={`${summary.properties.active} active · ${pendingCount} pending`}
            gradient="from-emerald-50/50 via-transparent to-transparent"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
              </svg>
            }
          />
          <StatCard
            label="Bookings"
            value={summary.bookings.total}
            sublabel={`${summary.bookings.pending} pending · ${summary.bookings.approved} approved`}
            gradient="from-violet-50/50 via-transparent to-transparent"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            }
          />
          <StatCard
            label="Conversations"
            value={summary.conversations.total}
            sublabel="Across all properties"
            gradient="from-amber-50/50 via-transparent to-transparent"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
            }
          />
        </div>
      ) : null}

      {/* ── Distribution bars ──────────────────────────── */}
      {!isLoading && summary && (
        <div className="grid gap-4 md:grid-cols-3">
          <Section title="Users by Role" subtitle={`${summary.users.total} total`}>
            <div className="space-y-2 pt-2">
              {userRoleData.map((d) => (
                <ProgressBar key={d.label} label={d.label} value={d.value} max={summary.users.total} color={d.color} />
              ))}
            </div>
          </Section>

          <Section title="Properties by Status" subtitle={`${summary.properties.total} total`}>
            <div className="space-y-2 pt-2">
              {propertyStatusData.map((d) => (
                <ProgressBar key={d.label} label={d.label} value={d.value} max={summary.properties.total} color={d.color} />
              ))}
            </div>
          </Section>

          <Section title="Bookings by Status" subtitle={`${summary.bookings.total} total`}>
            <div className="space-y-2 pt-2">
              {bookingStatusData.map((d) => (
                <ProgressBar key={d.label} label={d.label} value={d.value} max={summary.bookings.total || 1} color={d.color} />
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* ── Tabbed detail views ────────────────────────── */}
      <Section
        title="Details"
        subtitle="Browse and manage platform data"
        action={
          <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />
        }
      >
        {/* ── Users tab ──────────────────────────────── */}
        {activeTab === "users" && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm mt-3">
              <thead className="border-b border-surface-100">
                <tr>
                  <th className="py-3 pr-4">
                    <SortControl label="Name" field="name" currentField={userSortBy} currentOrder={userSortOrder} onChange={handleUserSort} />
                  </th>
                  <th className="py-3 pr-4">
                    <SortControl label="Email" field="email" currentField={userSortBy} currentOrder={userSortOrder} onChange={handleUserSort} />
                  </th>
                  <th className="py-3 pr-4">
                    <SortControl label="Role" field="role" currentField={userSortBy} currentOrder={userSortOrder} onChange={handleUserSort} />
                  </th>
                  <th className="py-3 pr-4 text-right">
                    <SortControl label="Joined" field="createdAt" currentField={userSortBy} currentOrder={userSortOrder} onChange={handleUserSort} />
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
                ) : users.length === 0 ? (
                  <tr><td colSpan={4} className="py-8 text-center text-sm text-surface-400">No users found.</td></tr>
                ) : (
                  users.map((u) => (
                    <tr key={u._id} className="border-b border-surface-50 transition-colors hover:bg-surface-50">
                      <td className="py-3 pr-4 font-medium text-surface-900">{u.name}</td>
                      <td className="py-3 pr-4 text-surface-500">{u.email}</td>
                      <td className="py-3 pr-4"><StatusPill>{u.role}</StatusPill></td>
                      <td className="py-3 pr-4 text-surface-400 text-right">{formatDate(u.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <PaginationBar page={userPage} totalPages={userTotalPages} onChange={setUserPage} />
          </div>
        )}

        {/* ── Properties tab ──────────────────────────── */}
        {activeTab === "properties" && (
          <div className="space-y-4 mt-3">
            {/* Sort controls for properties */}
            <div className="flex items-center gap-3 text-xs text-surface-500">
              <span className="font-semibold uppercase tracking-wider">Sort by:</span>
              {[
                { label: "Title", field: "title" },
                { label: "City", field: "city" },
                { label: "Price", field: "pricePerMonth" },
                { label: "Status", field: "moderationStatus" },
                { label: "Created", field: "createdAt" },
              ].map((s) => (
                <SortControl
                  key={s.field}
                  label={s.label}
                  field={s.field}
                  currentField={propertySortBy}
                  currentOrder={propertySortOrder}
                  onChange={handlePropertySort}
                />
              ))}
            </div>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
            ) : properties.length === 0 ? (
              <p className="py-8 text-center text-sm text-surface-400">No properties to moderate.</p>
            ) : (
              properties.map((property) => (
                <div key={property._id} className="group relative overflow-hidden rounded-xl border border-surface-100 p-5 transition-all duration-200 hover:border-surface-200 hover:shadow-sm">
                  {/* Pending indicator */}
                  {property.moderationStatus === "pending" && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400 rounded-l-xl" />
                  )}
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-surface-900 truncate">{property.title}</h3>
                        {property.moderationStatus === "pending" && (
                          <span className="inline-flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-surface-500 truncate">
                        {property.addressLine1}, {property.city}, {property.postcode}
                      </p>
                      <p className="text-sm text-surface-400">
                        Landlord: {property.landlord?.name} <span className="text-surface-300">·</span> {property.landlord?.email}
                      </p>
                    </div>
                    <StatusPill>{property.moderationStatus}</StatusPill>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                    <span className="rounded-lg bg-brand-50 px-3 py-1.5 font-medium text-brand-700">
                      {formatRent(property.pricePerMonth)}
                    </span>
                    <span className="rounded-lg bg-surface-100 px-3 py-1.5 text-surface-600">
                      {property.bedrooms} bed{property.bedrooms === 1 ? "" : "s"}
                    </span>
                    <span className="rounded-lg bg-surface-100 px-3 py-1.5 text-surface-600">
                      {property.bathrooms} bath{property.bathrooms === 1 ? "" : "s"}
                    </span>
                    <span className="rounded-lg bg-surface-100 px-3 py-1.5 text-surface-600 capitalize">
                      {property.propertyType}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {["active", "pending", "rejected"].map((status) => {
                      const isActive = property.moderationStatus === status;
                      const activeColor = {
                        active: "border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100",
                        pending: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
                        rejected: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
                      };
                      return (
                        <button
                          key={status}
                          disabled={isActive || isLoading}
                          onClick={() => updateListingStatus(property, status)}
                          className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${
                            isActive ? activeColor[status] : "border-surface-200 bg-white text-surface-600 hover:border-surface-300 hover:bg-surface-50"
                          }`}
                          type="button"
                        >
                          {isActive ? `✓ ${status}` : `Mark ${status}`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
            <PaginationBar page={propertyPage} totalPages={propertyTotalPages} onChange={setPropertyPage} />
          </div>
        )}

        {/* ── Bookings tab ────────────────────────────── */}
        {activeTab === "bookings" && (
          <div className="space-y-3 mt-3">
            {/* Sort controls for bookings */}
            <div className="flex items-center gap-3 text-xs text-surface-500">
              <span className="font-semibold uppercase tracking-wider">Sort by:</span>
              {[
                { label: "Status", field: "status" },
                { label: "Date", field: "requestedDate" },
                { label: "Created", field: "createdAt" },
              ].map((s) => (
                <SortControl
                  key={s.field}
                  label={s.label}
                  field={s.field}
                  currentField={bookingSortBy}
                  currentOrder={bookingSortOrder}
                  onChange={handleBookingSort}
                />
              ))}
            </div>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <SkeletonBooking key={i} />)
            ) : bookings.length === 0 ? (
              <p className="py-8 text-center text-sm text-surface-400">No bookings found.</p>
            ) : (
              bookings.map((booking) => (
                <div key={booking._id} className="group relative overflow-hidden rounded-xl border border-surface-100 p-4 transition-all duration-200 hover:border-surface-200 hover:shadow-sm">
                  {/* Status accent */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${
                    booking.status === "approved" ? "bg-emerald-400" :
                    booking.status === "pending" ? "bg-amber-400" :
                    booking.status === "rejected" ? "bg-red-400" : "bg-surface-300"
                  }`} />
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between pl-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-surface-900 truncate">
                          {booking.property?.title || "Unknown Property"}
                        </h3>
                        {booking.status === "pending" && (
                          <span className="inline-flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-surface-500">
                        <span className="font-medium text-surface-700">{booking.tenant?.name || "N/A"}</span>
                        {" "}requested a viewing from{" "}
                        <span className="font-medium text-surface-700">{booking.landlord?.name || "N/A"}</span>
                      </p>
                      <p className="text-sm text-surface-400">
                        <svg className="inline h-3.5 w-3.5 mr-1 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                        {formatDate(booking.requestedDate)}
                        {booking.property?.pricePerMonth && (
                          <> · <span className="font-medium">Rent: {formatRent(booking.property.pricePerMonth)}</span></>
                        )}
                      </p>
                      {booking.message && (
                        <p className="mt-1.5 text-sm text-surface-400 italic border-l-2 border-surface-200 pl-3">
                          &ldquo;{booking.message}&rdquo;
                        </p>
                      )}
                    </div>
                    <StatusPill>{booking.status}</StatusPill>
                  </div>
                </div>
              ))
            )}
            <PaginationBar page={bookingPage} totalPages={bookingTotalPages} onChange={setBookingPage} />
          </div>
        )}
      </Section>
    </div>
  );
}