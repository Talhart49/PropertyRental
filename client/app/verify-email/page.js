"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiRequest } from "../../lib/api";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function verify() {
      if (!token || !email) {
        setStatus("error");
        setMessage("Invalid verification link. Please request a new one.");
        return;
      }

      try {
        const res = await apiRequest("/api/auth/verify-email", {
          method: "POST",
          body: JSON.stringify({ email, token })
        });

        setStatus("success");
        setMessage(res.message || "Email verified successfully!");
      } catch (error) {
        setStatus("error");
        setMessage(error.message || "Verification failed. The link may have expired.");
      }
    }

    verify();
  }, [token, email]);

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="w-full max-w-md rounded-md border border-stone-200 bg-white shadow-xl shadow-stone-200/80">
        <div className="h-1 bg-[linear-gradient(90deg,#0f766e,#2563eb,#c2410c)]" />
        <div className="px-6 pt-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">
            Property Rental
          </p>
          <h1 className="text-2xl font-bold text-stone-950">
            {status === "loading" ? "Verifying your email..." : status === "success" ? "Email verified!" : "Verification failed"}
          </h1>
        </div>

        <div className="px-6 py-6">
          {status === "loading" ? (
            <p className="text-sm text-stone-600">Please wait while we verify your email address...</p>
          ) : status === "success" ? (
            <>
              <p className="text-sm text-stone-600">{message}</p>
              <div className="mt-6">
                <Link
                  href="/login"
                  className="inline-block rounded-md bg-teal-700 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-900/20 hover:bg-teal-800"
                >
                  Log in
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-red-700">{message}</p>
              <div className="mt-6 flex flex-col gap-3">
                <Link
                  href="/login"
                  className="inline-block rounded-md bg-teal-700 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-teal-900/20 hover:bg-teal-800"
                >
                  Go to login
                </Link>
                <p className="text-xs text-stone-500">
                  Need a new verification email? Log in and use the resend option.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}