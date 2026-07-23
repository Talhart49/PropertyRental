"use client";

import { useState } from "react";
import { useAuth } from "../app/providers";
import { apiRequest } from "../lib/api";

export default function BookingRequestForm({ propertyId }) {
  const { isAuthenticated, user, token } = useAuth();
  const [form, setForm] = useState({
    requestedDate: "",
    message: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthenticated || user?.role !== "tenant") {
    return null;
  }

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submitBooking(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const payload = await apiRequest("/api/bookings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          propertyId,
          requestedDate: form.requestedDate,
          message: form.message
        })
      });

      setSuccess(payload.message || "Booking request sent.");
      setForm({ requestedDate: "", message: "" });
    } catch (bookingError) {
      setError(bookingError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="rounded-md border border-stone-200 bg-white/95 p-5 shadow-lg shadow-stone-200/60"
      onSubmit={submitBooking}
    >
      <h2 className="text-xl font-bold text-stone-950">Request a viewing</h2>
      <div className="mt-4 flex flex-col gap-4">
        <label className="flex flex-col gap-2 text-sm font-medium text-stone-800">
          Preferred date and time
          <input
            className="rounded-md border border-stone-300 px-3 py-2.5 outline-none focus:border-teal-700"
            name="requestedDate"
            onChange={updateField}
            required
            type="datetime-local"
            value={form.requestedDate}
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-stone-800">
          Message
          <textarea
            className="min-h-24 rounded-md border border-stone-300 px-3 py-2.5 outline-none focus:border-teal-700"
            maxLength={1000}
            name="message"
            onChange={updateField}
            placeholder="Introduce yourself and mention your availability."
            value={form.message}
          />
        </label>

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {success ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {success}
          </p>
        ) : null}

        <button
          className="rounded-md bg-teal-700 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-stone-400"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Sending..." : "Send request"}
        </button>
      </div>
    </form>
  );
}
