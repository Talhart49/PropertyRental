"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../app/providers";
import { apiRequest } from "../lib/api";

export default function ProfileForm() {
  const router = useRouter();
  const { token, user, updateUser, logout } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  async function handleProfileUpdate(event) {
    event.preventDefault();
    setProfileError("");
    setProfileSuccess("");
    setIsSavingProfile(true);

    try {
      const payload = await apiRequest("/api/users/me", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, email, phone })
      });

      updateUser(payload.data.user);
      setProfileSuccess(payload.message || "Profile updated.");
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handlePasswordChange(event) {
    event.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }

    setIsSavingPassword(true);

    try {
      const payload = await apiRequest("/api/users/me/password", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      setPasswordSuccess(payload.message || "Password changed.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setIsSavingPassword(false);
    }
  }

  async function handleExportData() {
    setProfileError("");
    setProfileSuccess("");
    setIsExporting(true);

    try {
      const payload = await apiRequest("/api/users/me/export", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const blob = new Blob([JSON.stringify(payload.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `property-rental-data-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setProfileSuccess("Data exported. Check your downloads.");
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setIsExporting(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleteError("");

    if (deleteConfirm !== user?.name) {
      setDeleteError(`Type "${user?.name}" to confirm deletion.`);
      return;
    }

    setIsDeleting(true);

    try {
      await apiRequest("/api/users/me", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      logout();
      router.push("/");
    } catch (err) {
      setDeleteError(err.message);
      setIsDeleting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      {/* Account details card */}
      <form
        className="flex flex-col gap-4 rounded-md border border-stone-200 bg-white/95 p-5 shadow-lg shadow-stone-200/60"
        onSubmit={handleProfileUpdate}
      >
        <div>
          <h2 className="text-xl font-bold text-stone-950">Account details</h2>
          <p className="mt-1 text-sm leading-6 text-stone-600">
            Update your name and email address.
          </p>
        </div>

        <label className="flex flex-col gap-2 text-sm font-medium text-stone-800">
          Name
          <input
            className="rounded-md border border-stone-300 px-3 py-2.5 outline-none focus:border-teal-700"
            onChange={(e) => setName(e.target.value)}
            required
            type="text"
            value={name}
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-stone-800">
          Email
          <input
            className="rounded-md border border-stone-300 px-3 py-2.5 outline-none focus:border-teal-700"
            onChange={(e) => setEmail(e.target.value)}
            required
            type="email"
            value={email}
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-stone-800">
          Phone (optional)
          <input
            className="rounded-md border border-stone-300 px-3 py-2.5 outline-none focus:border-teal-700"
            onChange={(e) => setPhone(e.target.value)}
            type="tel"
            value={phone}
          />
          <span className="text-xs font-normal text-stone-500">
            Used for landlord-tenant direct contact.
          </span>
        </label>

        {profileError ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {profileError}
          </p>
        ) : null}

        {profileSuccess ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {profileSuccess}
          </p>
        ) : null}

        <button
          className="rounded-md bg-teal-700 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-stone-400"
          disabled={isSavingProfile}
          type="submit"
        >
          {isSavingProfile ? "Saving..." : "Save changes"}
        </button>
      </form>

      {/* Change password card */}
      <form
        className="flex flex-col gap-4 rounded-md border border-stone-200 bg-white/95 p-5 shadow-lg shadow-stone-200/60"
        onSubmit={handlePasswordChange}
      >
        <div>
          <h2 className="text-xl font-bold text-stone-950">Change password</h2>
          <p className="mt-1 text-sm leading-6 text-stone-600">
            Enter your current password and a new password.
          </p>
        </div>

        <label className="flex flex-col gap-2 text-sm font-medium text-stone-800">
          Current password
          <input
            className="rounded-md border border-stone-300 px-3 py-2.5 outline-none focus:border-teal-700"
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            type="password"
            value={currentPassword}
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-stone-800">
          New password
          <input
            className="rounded-md border border-stone-300 px-3 py-2.5 outline-none focus:border-teal-700"
            minLength={8}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            type="password"
            value={newPassword}
          />
          <span className="text-xs font-normal text-stone-500">
            Minimum 8 characters.
          </span>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-stone-800">
          Confirm new password
          <input
            className="rounded-md border border-stone-300 px-3 py-2.5 outline-none focus:border-teal-700"
            minLength={8}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            type="password"
            value={confirmPassword}
          />
        </label>

        {passwordError ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {passwordError}
          </p>
        ) : null}

        {passwordSuccess ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {passwordSuccess}
          </p>
        ) : null}

        <button
          className="rounded-md bg-teal-700 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-stone-400"
          disabled={isSavingPassword}
          type="submit"
        >
          {isSavingPassword ? "Changing..." : "Change password"}
        </button>
      </form>

      {/* Data export card */}
      <div className="flex flex-col gap-4 rounded-md border border-teal-200 bg-white/95 p-5 shadow-lg shadow-stone-200/60">
        <div>
          <h2 className="text-xl font-bold text-stone-950">Export your data</h2>
          <p className="mt-1 text-sm leading-6 text-stone-600">
            Download a copy of your account data, properties, bookings, and messages (GDPR compliant).
          </p>
        </div>

        <button
          className="w-fit rounded-md bg-teal-700 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-stone-400"
          disabled={isExporting}
          onClick={handleExportData}
          type="button"
        >
          {isExporting ? "Exporting..." : "Download my data"}
        </button>
      </div>

      {/* Danger zone card */}
      <div className="flex flex-col gap-4 rounded-md border border-red-200 bg-white/95 p-5 shadow-lg shadow-stone-200/60 lg:col-span-2">
        <div>
          <h2 className="text-xl font-bold text-red-800">Danger zone</h2>
          <p className="mt-1 text-sm leading-6 text-stone-600">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
        </div>

        <label className="flex flex-col gap-2 text-sm font-medium text-stone-800">
          Type <span className="font-bold text-red-700">{user?.name}</span> to confirm
          <input
            className="rounded-md border border-red-300 px-3 py-2.5 outline-none focus:border-red-500"
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder={user?.name}
            value={deleteConfirm}
          />
        </label>

        {deleteError ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {deleteError}
          </p>
        ) : null}

        <button
          className="w-fit rounded-md bg-red-700 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-stone-400"
          disabled={isDeleting}
          onClick={handleDeleteAccount}
          type="button"
        >
          {isDeleting ? "Deleting..." : "Delete my account"}
        </button>
      </div>
    </div>
  );
}
