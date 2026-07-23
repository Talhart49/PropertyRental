"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../app/providers";
import { useNotification } from "./NotificationProvider";
import { apiRequest } from "../lib/api";
import { formatRent } from "../lib/properties";
import MessagingPanel from "./MessagingPanel";

function formatDate(value) {
  return new Date(value).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function StatusBadge({ status }) {
  const styles = {
    approved: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    pending: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    rejected: "bg-red-50 text-red-700 ring-1 ring-red-200",
    cancelled: "bg-surface-100 text-surface-600 ring-1 ring-surface-200"
  };

  const icons = {
    approved: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
      </svg>
    ),
    pending: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    rejected: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    cancelled: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    )
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold uppercase ${styles[status] || styles.pending}`}>
      {icons[status] || null}
      {status}
    </span>
  );
}

function BookingCard({ booking, onCancel, onDecision, role }) {
  const [response, setResponse] = useState("");
  const isLandlord = role === "landlord";
  const isTenant = role === "tenant";
  const canDecide = isLandlord && booking.status === "pending";
  const canCancel = isTenant && booking.status === "pending";

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-surface-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md">
      {/* Status color accent */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${
        booking.status === "approved" ? "bg-emerald-400" :
        booking.status === "pending" ? "bg-amber-400" :
        booking.status === "rejected" ? "bg-red-400" : "bg-surface-300"
      }`} />

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-surface-900 truncate">{booking.property?.title}</h3>
            <StatusBadge status={booking.status} />
          </div>
          <p className="mt-1 text-sm text-surface-500">
            {booking.property?.addressLine1}, {booking.property?.city}, {booking.property?.postcode}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-2 rounded-xl bg-surface-50 px-4 py-2.5 text-sm text-surface-700">
          <svg className="h-4 w-4 shrink-0 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          <span className="truncate">{formatDate(booking.requestedDate)}</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-surface-50 px-4 py-2.5 text-sm text-surface-700">
          <svg className="h-4 w-4 shrink-0 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">{formatRent(booking.property?.pricePerMonth)}</span>
          <span className="text-surface-400">/mo</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-surface-50 px-4 py-2.5 text-sm text-surface-700">
          <svg className="h-4 w-4 shrink-0 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          <span className="truncate">{booking.tenant?.name || booking.landlord?.name}</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-surface-50 px-4 py-2.5 text-sm text-surface-700">
          <svg className="h-4 w-4 shrink-0 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
          </svg>
          <span className="truncate">{booking.property?.propertyType || "Property"}</span>
        </div>
      </div>

      {booking.message ? (
        <div className="mt-4 rounded-xl bg-surface-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-surface-400 mb-1">Message</p>
          <p className="text-sm leading-6 text-surface-700">{booking.message}</p>
        </div>
      ) : null}

      {booking.landlordResponse ? (
        <div className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-100">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-500 mb-1">Response</p>
          <p className="text-sm leading-6 text-emerald-800">{booking.landlordResponse}</p>
        </div>
      ) : null}

      {canDecide ? (
        <div className="mt-5 space-y-3">
          <div className="relative">
            <textarea
              className="min-h-[80px] w-full rounded-xl border border-surface-200 bg-white px-4 py-3 text-sm text-surface-900 placeholder-surface-400 outline-none transition-all duration-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-50 resize-none"
              maxLength={1000}
              onChange={(event) => setResponse(event.target.value)}
              placeholder="Write a response to the tenant (optional)..."
              value={response}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-emerald-700 hover:shadow-md active:scale-95"
              onClick={() => onDecision(booking, "approved", response)}
              type="button"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Approve
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-600 shadow-sm transition-all duration-200 hover:bg-red-50 hover:border-red-300 active:scale-95"
              onClick={() => onDecision(booking, "rejected", response)}
              type="button"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Reject
            </button>
          </div>
        </div>
      ) : null}

      {canCancel ? (
        <div className="mt-5">
          <button
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-600 shadow-sm transition-all duration-200 hover:bg-red-50 hover:border-red-300 active:scale-95"
            onClick={() => onCancel(booking)}
            type="button"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cancel request
          </button>
        </div>
      ) : null}

      <MessagingPanel
        bookingId={booking._id}
        compact
        propertyId={booking.property?._id}
      />
    </article>
  );
}

export default function BookingLists({ mode }) {
  const { token, user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const isLandlord = mode === "incoming";
  const endpoint = isLandlord ? "/api/bookings/incoming" : "/api/bookings/mine";

  async function loadBookings() {
    setError("");
    setIsLoading(true);

    try {
      const payload = await apiRequest(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setBookings(payload.data.bookings);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      loadBookings();
    }
  }, [token]);

  async function updateStatus(booking, status, landlordResponse) {
    setError("");

    try {
      const payload = await apiRequest(`/api/bookings/${booking._id}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status, landlordResponse })
      });
      showSuccess(payload.message);
      await loadBookings();
    } catch (updateError) {
      setError(updateError.message);
    }
  }

  async function cancelBooking(booking) {
    const confirmed = window.confirm(
      `Cancel your viewing request for "${booking.property?.title}"?`
    );

    if (!confirmed) {
      return;
    }

    setError("");

    try {
      const payload = await apiRequest(`/api/bookings/${booking._id}/cancel`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      showSuccess(payload.message);
      await loadBookings();
    } catch (cancelError) {
      setError(cancelError.message);
    }
  }

  return (
    <section className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col gap-3 rounded-2xl border border-surface-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-surface-900">
            {isLandlord ? "Incoming booking requests" : "Your booking requests"}
          </h2>
          <p className="mt-1 text-sm text-surface-500">
            {bookings.length} request{bookings.length === 1 ? "" : "s"}
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-xl border border-surface-200 bg-white px-5 py-2.5 text-sm font-semibold text-surface-700 shadow-sm transition-all duration-200 hover:bg-surface-50 hover:border-surface-300 active:scale-95"
          onClick={loadBookings}
          type="button"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Error */}
      {error ? (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          {error}
        </div>
      ) : null}

      {/* Loading */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-5 w-48 bg-surface-200 rounded" />
                <div className="h-5 w-20 bg-surface-200 rounded-full" />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-10 bg-surface-100 rounded-xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Empty state */}
      {!isLoading && bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-surface-200 bg-white px-6 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-100 mb-4">
            <svg className="h-8 w-8 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-surface-900">No booking requests yet</h3>
          <p className="mt-1 text-sm text-surface-500 max-w-sm">
            {isLandlord
              ? "When tenants request viewings, they'll appear here for you to review."
              : "Browse properties and request viewings to get started."}
          </p>
        </div>
      ) : null}

      {/* Booking cards */}
      <div className="grid gap-4">
        {bookings.map((booking) => (
          <BookingCard
            booking={booking}
            key={booking._id}
            onCancel={cancelBooking}
            onDecision={updateStatus}
            role={user?.role}
          />
        ))}
      </div>
    </section>
  );
}