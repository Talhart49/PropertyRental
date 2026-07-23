"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../app/providers";
import { apiRequest } from "../lib/api";
import { formatRent } from "../lib/properties";
import Section from "./Section";
import StatusPill from "./StatusPill";
import StatCard from "./StatCard";
import SkeletonCard from "./SkeletonCard";
import SkeletonRow from "./SkeletonRow";
import SkeletonStat from "./SkeletonStat";

function formatDate(value) {
  return new Date(value).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function formatTimeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function AdminManagement() {
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Data state
  const [pendingListings, setPendingListings] = useState([]);
  const [users, setUsers] = useState([]);
  const [activity, setActivity] = useState([]);

  // Broadcast form state
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastType, setBroadcastType] = useState("system_announcement");
  const [broadcastTarget, setBroadcastTarget] = useState("all");
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Role change state
  const [changingRole, setChangingRole] = useState(null);

  async function loadManagementData() {
    setError("");
    setIsLoading(true);

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [pendingPayload, usersPayload, activityPayload] = await Promise.all([
        apiRequest("/api/admin-management/pending-listings", { headers }),
        apiRequest("/api/admin/users", { headers }),
        apiRequest("/api/admin-management/recent-activity", { headers })
      ]);

      setPendingListings(pendingPayload.data.properties);
      setUsers(usersPayload.data.users);
      setActivity(activityPayload.data.activity);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (token) loadManagementData();
  }, [token]);

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
      await loadManagementData();
    } catch (updateError) {
      setError(updateError.message);
    }
  }

  async function handleRoleChange(userId, newRole) {
    setError("");
    setSuccess("");
    setChangingRole(userId);
    try {
      const payload = await apiRequest(`/api/admin-management/users/${userId}/role`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: newRole })
      });
      setSuccess(payload.message);
      await loadManagementData();
    } catch (changeError) {
      setError(changeError.message);
    } finally {
      setChangingRole(null);
    }
  }

  async function handleDeleteUser(userId, userName) {
    if (!window.confirm(`Delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }
    setError("");
    setSuccess("");
    try {
      const payload = await apiRequest(`/api/admin-management/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess(payload.message);
      await loadManagementData();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  async function handleBroadcast(e) {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;

    setError("");
    setSuccess("");
    setIsBroadcasting(true);
    try {
      const payload = await apiRequest("/api/admin-management/notifications/broadcast", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          message: broadcastMessage.trim(),
          type: broadcastType,
          targetRole: broadcastTarget === "all" ? undefined : broadcastTarget
        })
      });
      setSuccess(payload.message);
      setBroadcastMessage("");
    } catch (broadcastError) {
      setError(broadcastError.message);
    } finally {
      setIsBroadcasting(false);
    }
  }

  // ── Derived ──────────────────────────────────────
  const pendingCount = pendingListings.length;
  const activeUsersCount = users.filter((u) => u.role !== "admin").length;

  // ── Render ───────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-surface-400">
              <div className="relative h-4 w-4">
                <div className="absolute inset-0 rounded-full border-2 border-surface-200" />
                <div className="absolute inset-0 rounded-full border-2 border-t-brand-500 animate-spin" />
              </div>
              Loading management data...
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
          onClick={loadManagementData}
          type="button"
          disabled={isLoading}
        >
          <svg className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
          </svg>
          {isLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* ── Stats Summary ────────────────────────────── */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonStat key={i} />)}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            label="Pending Moderation"
            value={pendingCount}
            sublabel={`${pendingCount === 1 ? "Property" : "Properties"} awaiting review`}
            gradient="from-amber-50/50 via-transparent to-transparent"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            }
          />
          <StatCard
            label="Active Users"
            value={activeUsersCount}
            sublabel="Landlords & tenants"
            gradient="from-brand-50/50 via-transparent to-transparent"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            }
          />
          <StatCard
            label="Recent Activity"
            value={activity.length}
            sublabel="Latest platform events"
            gradient="from-violet-50/50 via-transparent to-transparent"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
              </svg>
            }
          />
        </div>
      )}

      {/* ── Pending Moderation Queue ────────────────── */}
      {!isLoading && (
        <Section
          title="Moderation Queue"
          subtitle={pendingCount > 0 ? `${pendingCount} property listings awaiting your decision` : "All clear — no listings pending moderation"}
          action={
            pendingCount > 0 && (
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                {pendingCount}
              </span>
            )
          }
        >
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
          ) : pendingListings.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-sm text-surface-400">
              <svg className="h-12 w-12 text-surface-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-medium text-surface-500">No pending listings</p>
              <p>New listings submitted by landlords will appear here.</p>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {pendingListings.map((property) => (
                <div key={property._id} className="group relative overflow-hidden rounded-xl border border-amber-200 bg-amber-50/30 p-5 transition-all duration-200 hover:border-amber-300 hover:shadow-sm">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400 rounded-l-xl" />
                  <div className="flex flex-col gap-3 pl-3">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-semibold text-surface-900 truncate">{property.title}</h3>
                        <p className="mt-0.5 text-sm text-surface-500 truncate">
                          {property.addressLine1}, {property.city}, {property.postcode}
                        </p>
                        <p className="text-sm text-surface-400">
                          Landlord: {property.landlord?.name} <span className="text-surface-300">·</span> {property.landlord?.email}
                        </p>
                      </div>
                      <StatusPill>pending</StatusPill>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
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
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => updateListingStatus(property, "active")}
                        disabled={isLoading}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition-all duration-200 hover:bg-emerald-100 active:scale-95 disabled:opacity-50"
                        type="button"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Approve
                      </button>
                      <button
                        onClick={() => updateListingStatus(property, "rejected")}
                        disabled={isLoading}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition-all duration-200 hover:bg-red-100 active:scale-95 disabled:opacity-50"
                        type="button"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* ── User Management ─────────────────────────── */}
      {!isLoading && (
        <Section
          title="User Management"
          subtitle="Manage user roles and accounts"
        >
          <div className="overflow-x-auto mt-3">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead className="border-b border-surface-100">
                <tr>
                  <th className="py-3 pr-4 text-xs font-semibold uppercase tracking-wider text-surface-500">Name</th>
                  <th className="py-3 pr-4 text-xs font-semibold uppercase tracking-wider text-surface-500">Email</th>
                  <th className="py-3 pr-4 text-xs font-semibold uppercase tracking-wider text-surface-500">Role</th>
                  <th className="py-3 pr-4 text-xs font-semibold uppercase tracking-wider text-surface-500">Actions</th>
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
                      <td className="py-3 pr-4">
                        <select
                          value={u.role}
                          disabled={changingRole === u._id}
                          onChange={(e) => handleRoleChange(u._id, e.target.value)}
                          className="rounded-lg border border-surface-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-surface-700 transition-colors hover:border-surface-300 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:opacity-50"
                        >
                          <option value="tenant">tenant</option>
                          <option value="landlord">landlord</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                      <td className="py-3 pr-4">
                        <button
                          onClick={() => handleDeleteUser(u._id, u.name)}
                          disabled={u.role === "admin" || isLoading}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition-all duration-200 hover:bg-red-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                          type="button"
                          title={u.role === "admin" ? "Cannot delete admin accounts" : `Delete ${u.name}`}
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* ── Broadcast Notification ──────────────────── */}
      {!isLoading && (
        <Section
          title="Broadcast Notification"
          subtitle="Send a notification to all users or a specific role"
        >
          <form onSubmit={handleBroadcast} className="mt-3 space-y-4">
            <div>
              <label htmlFor="broadcast-message" className="block text-sm font-medium text-surface-700 mb-1.5">
                Message
              </label>
              <textarea
                id="broadcast-message"
                rows={3}
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="e.g. Platform maintenance scheduled for Sunday 2 AM..."
                className="w-full rounded-xl border border-surface-200 bg-white px-4 py-3 text-sm text-surface-900 placeholder-surface-400 transition-colors focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="broadcast-type" className="block text-sm font-medium text-surface-700 mb-1.5">
                  Notification Type
                </label>
                <select
                  id="broadcast-type"
                  value={broadcastType}
                  onChange={(e) => setBroadcastType(e.target.value)}
                  className="w-full rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm text-surface-900 transition-colors focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                >
                  <option value="system_announcement">System Announcement</option>
                  <option value="booking_request">Booking Request</option>
                  <option value="booking_approved">Booking Approved</option>
                  <option value="booking_rejected">Booking Rejected</option>
                  <option value="booking_cancelled">Booking Cancelled</option>
                  <option value="message_new">New Message</option>
                </select>
              </div>
              <div>
                <label htmlFor="broadcast-target" className="block text-sm font-medium text-surface-700 mb-1.5">
                  Target Audience
                </label>
                <select
                  id="broadcast-target"
                  value={broadcastTarget}
                  onChange={(e) => setBroadcastTarget(e.target.value)}
                  className="w-full rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm text-surface-900 transition-colors focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                >
                  <option value="all">All Users</option>
                  <option value="tenant">Tenants Only</option>
                  <option value="landlord">Landlords Only</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isBroadcasting || !broadcastMessage.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-brand-700 hover:shadow-md active:scale-95 disabled:opacity-50"
              >
                {isBroadcasting ? (
                  <>
                    <div className="relative h-4 w-4">
                      <div className="absolute inset-0 rounded-full border-2 border-white/30" />
                      <div className="absolute inset-0 rounded-full border-2 border-t-white animate-spin" />
                    </div>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                    Send Broadcast
                  </>
                )}
              </button>
            </div>
          </form>
        </Section>
      )}

      {/* ── Recent Activity Timeline ──────────────────── */}
      {!isLoading && (
        <Section
          title="Recent Activity"
          subtitle="Latest events across the platform"
        >
          {activity.length === 0 ? (
            <p className="py-8 text-center text-sm text-surface-400">No recent activity.</p>
          ) : (
            <div className="mt-3 space-y-0">
              {activity.map((item, index) => (
                <div key={`${item.type}-${item.timestamp}-${index}`} className="relative flex gap-4 pb-5 last:pb-0">
                  {/* Timeline connector */}
                  {index < activity.length - 1 && (
                    <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-surface-100" />
                  )}
                  {/* Dot */}
                  <div className={`relative mt-1 h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center ${
                    item.type === "user_registered"
                      ? "border-brand-400 bg-brand-50"
                      : "border-amber-400 bg-amber-50"
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      item.type === "user_registered" ? "bg-brand-500" : "bg-amber-500"
                    }`} />
                  </div>
                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-surface-700">{item.description}</p>
                    <p className="text-xs text-surface-400 mt-0.5">{formatTimeAgo(item.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}
    </div>
  );
}