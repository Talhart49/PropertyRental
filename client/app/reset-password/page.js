"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { apiRequest } from "../../lib/api";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [formData, setFormData] = useState({
    email,
    token,
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = await apiRequest("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          email: formData.email,
          token: formData.token,
          password: formData.password
        })
      });

      setMessage(payload.message);

      // Redirect to login after a short delay
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (submissionError) {
      setError(submissionError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="flex w-full max-w-md flex-col gap-5 overflow-hidden rounded-md border border-stone-200 bg-white shadow-xl shadow-stone-200/80"
      onSubmit={handleSubmit}
    >
      <div className="h-1 bg-[linear-gradient(90deg,#0f766e,#2563eb,#c2410c)]" />
      <div className="px-6 pt-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">
          Property Rental
        </p>
        <h1 className="text-2xl font-bold text-stone-950">Reset password</h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Enter your new password below.
        </p>
      </div>

      <label className="mx-6 flex flex-col gap-2 text-sm font-medium text-stone-800">
        Email
        <input
          className="rounded-md border border-stone-300 bg-stone-100 px-3 py-2.5 text-stone-500 outline-none"
          name="email"
          readOnly
          type="email"
          value={formData.email}
        />
      </label>

      <label className="mx-6 flex flex-col gap-2 text-sm font-medium text-stone-800">
        New password
        <input
          className="rounded-md border border-stone-300 px-3 py-2.5 outline-none focus:border-teal-700"
          minLength={8}
          name="password"
          onChange={updateField}
          required
          type="password"
          value={formData.password}
        />
      </label>

      <label className="mx-6 flex flex-col gap-2 text-sm font-medium text-stone-800">
        Confirm new password
        <input
          className="rounded-md border border-stone-300 px-3 py-2.5 outline-none focus:border-teal-700"
          minLength={8}
          name="confirmPassword"
          onChange={updateField}
          required
          type="password"
          value={formData.confirmPassword}
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
        {isSubmitting ? "Please wait..." : "Reset password"}
      </button>

      <p className="border-t border-stone-100 bg-stone-50 px-6 py-4 text-sm text-stone-600">
        <Link
          className="font-semibold text-teal-800 underline underline-offset-4"
          href="/login"
        >
          Back to log in
        </Link>
      </p>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <Suspense fallback={<div className="text-stone-500">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}