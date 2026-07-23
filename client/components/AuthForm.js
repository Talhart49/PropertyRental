"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../app/providers";
import { useNotification } from "./NotificationProvider";

const roleOptions = [
  { label: "Tenant", value: "tenant" },
  { label: "Landlord", value: "landlord" },
  { label: "Admin", value: "admin" }
];

export default function AuthForm({ mode }) {
  const isRegister = mode === "register";
  const router = useRouter();
  const { login, register } = useAuth();
  const { showInfo, showWarning } = useNotification();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "tenant"
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (isRegister) {
        const user = await register(formData);
        showInfo("Account created! Please check your email to verify your account before logging in.");
        router.push("/login");
      } else {
        const user = await login({
          email: formData.email,
          password: formData.password
        });
        router.push(user.role === "tenant" ? "/tenant" : user.role === "landlord" ? "/landlord" : "/admin/dashboard");
      }
    } catch (submissionError) {
      setError(submissionError.message);

      if (submissionError.status === 403) {
        showWarning("Please verify your email address before logging in. Check your inbox for the verification link.");
      }
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
        <h1 className="text-2xl font-bold text-stone-950">
          {isRegister ? "Create your account" : "Log in"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          {isRegister
            ? "Choose the role you need for this property portal."
            : "Access your portal dashboard."}
        </p>
      </div>

      {isRegister ? (
        <label className="mx-6 flex flex-col gap-2 text-sm font-medium text-stone-800">
          Name
          <input
            className="rounded-md border border-stone-300 px-3 py-2.5 outline-none focus:border-teal-700"
            name="name"
            onChange={updateField}
            required
            type="text"
            value={formData.name}
          />
        </label>
      ) : null}

      <label className="mx-6 flex flex-col gap-2 text-sm font-medium text-stone-800">
        Email
        <input
          className="rounded-md border border-stone-300 px-3 py-2.5 outline-none focus:border-teal-700"
          name="email"
          onChange={updateField}
          required
          type="email"
          value={formData.email}
        />
      </label>

      <label className="mx-6 flex flex-col gap-2 text-sm font-medium text-stone-800">
        Password
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

      {isRegister ? (
        <label className="mx-6 flex flex-col gap-2 text-sm font-medium text-stone-800">
          Role
          <select
            className="rounded-md border border-stone-300 px-3 py-2.5 outline-none focus:border-teal-700"
            name="role"
            onChange={updateField}
            value={formData.role}
          >
            {roleOptions.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {!isRegister ? (
        <div className="mx-6 -mt-2 text-right">
          <Link
            className="text-sm font-medium text-teal-800 underline underline-offset-4 hover:text-teal-600"
            href="/forgot-password"
          >
            Forgot password?
          </Link>
        </div>
      ) : null}

      {error ? (
        <p className="mx-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button
        className="mx-6 rounded-md bg-teal-700 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-900/20 hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-stone-400"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Please wait..." : isRegister ? "Create account" : "Log in"}
      </button>

      <p className="border-t border-stone-100 bg-stone-50 px-6 py-4 text-sm text-stone-600">
        {isRegister ? "Already have an account?" : "Need an account?"}{" "}
        <Link
          className="font-semibold text-teal-800 underline underline-offset-4"
          href={isRegister ? "/login" : "/register"}
        >
          {isRegister ? "Log in" : "Register"}
        </Link>
      </p>
    </form>
  );
}
