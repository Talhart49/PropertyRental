"use client";

import Link from "next/link";
import { useState } from "react";
import { apiRequest } from "../../lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const payload = await apiRequest("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email })
      });

      setMessage(payload.message);
      setEmail("");

      // In development the token is returned in the response data.
      // The user should normally check their email, but we log the link
      // to the server console for convenience.
      if (payload.data?.resetToken) {
        console.log("Reset token (dev):", payload.data.resetToken);
      }
    } catch (submissionError) {
      setError(submissionError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <form
        className="flex w-full max-w-md flex-col gap-5 overflow-hidden rounded-md border border-stone-200 bg-white shadow-xl shadow-stone-200/80"
        onSubmit={handleSubmit}
      >
        <div className="h-1 bg-[linear-gradient(90deg,#0f766e,#2563eb,#c2410c)]" />
        <div className="px-6 pt-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">
            Property Rental
          </p>
          <h1 className="text-2xl font-bold text-stone-950">Forgot password</h1>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <label className="mx-6 flex flex-col gap-2 text-sm font-medium text-stone-800">
          Email
          <input
            className="rounded-md border border-stone-300 px-3 py-2.5 outline-none focus:border-teal-700"
            name="email"
            onChange={(e) => setEmail(e.target.value)}
            required
            type="email"
            value={email}
          />
        </label>

        {error ? (
          <p className="mx-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {message ? (
          <p className="mx-6 rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-700">
            {message}
          </p>
        ) : null}

        <button
          className="mx-6 rounded-md bg-teal-700 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-900/20 hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-stone-400"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Please wait..." : "Send reset link"}
        </button>

        <p className="border-t border-stone-100 bg-stone-50 px-6 py-4 text-sm text-stone-600">
          Remember your password?{" "}
          <Link
            className="font-semibold text-teal-800 underline underline-offset-4"
            href="/login"
          >
            Log in
          </Link>
        </p>
      </form>
    </main>
  );
}