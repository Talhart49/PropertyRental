"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../app/providers";
import { useNotification } from "./NotificationProvider";
import { roleDashboardPath } from "../lib/routes";

function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "PR";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function NavLink({ children, exact, href }) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      className={`relative rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
        isActive
          ? "bg-white/15 text-white shadow-sm"
          : "text-white/70 hover:bg-white/10 hover:text-white"
      }`}
      href={href}
    >
      {children}
    </Link>
  );
}

function Badge({ count }) {
  if (!count || count <= 0) {
    return null;
  }

  return (
    <span className="absolute -right-1.5 -top-1.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold leading-none text-white shadow-lg ring-2 ring-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

const notificationIcons = {
  booking_request: "\u{1F4E8}",
  booking_approved: "\u2705",
  booking_rejected: "\u274C",
  booking_cancelled: "\u{1F6AB}",
  message_new: "\u{1F4AC}"
};

function getDefaultIcon(type) {
  return notificationIcons[type] || "\u{1F514}";
}

function formatNotificationTime(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function SiteHeader() {
  const router = useRouter();
  const { isAuthenticated, logout, user } = useAuth();
  const {
    notifications,
    unreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications
  } = useNotification();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const bellRef = useRef(null);
  const userDropdownRef = useRef(null);

  const dashboardPath = user?.role ? roleDashboardPath(user.role) : "/login";
  const canNotify = isAuthenticated && ["tenant", "landlord"].includes(user?.role);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        bellRef.current &&
        !bellRef.current.contains(event.target)
      ) {
        setIsNotificationOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close user dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target)
      ) {
        setIsUserDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleBellClick() {
    setIsNotificationOpen((prev) => !prev);
  }

  function handleNotificationClick(notification) {
    markNotificationRead(notification.id);
    setIsNotificationOpen(false);
    router.push(notification.linkHref);
  }

  function handleMarkAllRead() {
    markAllNotificationsRead();
  }

  function handleClearAll() {
    clearNotifications();
    setIsNotificationOpen(false);
  }

  function handleUserDropdownToggle() {
    setIsUserDropdownOpen((prev) => !prev);
  }

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 shadow-lg shadow-brand-900/20">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link className="flex min-w-fit items-center gap-3 group" href="/">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-lg font-black text-white shadow-sm backdrop-blur-sm transition-all duration-200 group-hover:bg-white/30 group-hover:scale-105">
            ⌂
          </span>
          <span className="leading-tight">
            <span className="block text-lg font-bold tracking-tight text-white">
              PropertyRental
            </span>
            <span className="hidden text-[11px] font-semibold uppercase tracking-[0.15em] text-white/60 sm:block">
              Direct landlord lets
            </span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          <NavLink href="/">Home</NavLink>
          {isAuthenticated ? (
            <>
              <NavLink exact href={dashboardPath}>Dashboard</NavLink>
              {canNotify ? <NavLink href="/messages">Messages</NavLink> : null}
              {user?.role === "tenant" ? <NavLink href="/tenant/search">Search</NavLink> : null}
              {user?.role === "landlord" ? <NavLink href="/landlord/listings">Listings</NavLink> : null}
              {user?.role === "admin" ? <NavLink exact href="/admin">Admin</NavLink> : null}
            </>
          ) : (
            <>
              <NavLink href="/login">Login</NavLink>
              <NavLink href="/register">Register</NavLink>
            </>
          )}
        </nav>

        {/* Right side */}
        {isAuthenticated ? (
          <div className="flex min-w-fit items-center gap-2">
            {/* Notification Bell with Dropdown */}
            {canNotify ? (
              <div className="relative">
                <button
                  ref={bellRef}
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-lg text-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white/20 hover:text-white"
                  onClick={handleBellClick}
                  title="Notifications"
                  type="button"
                >
                  <span>{unreadNotificationCount > 0 ? "\u{1F514}" : "\u{1F515}"}</span>
                  <Badge count={unreadNotificationCount} />
                </button>

                {isNotificationOpen ? (
                  <div
                    ref={dropdownRef}
                    className="absolute right-0 top-full z-50 mt-3 w-80 origin-top-right animate-fade-in-down overflow-hidden rounded-2xl border border-surface-200/80 bg-white shadow-2xl shadow-brand-900/10 ring-1 ring-black/5"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-surface-100 px-5 py-4">
                      <h3 className="text-sm font-semibold text-surface-900">
                        Notifications
                        {unreadNotificationCount > 0 ? (
                          <span className="ml-2 text-xs font-normal text-surface-400">
                            ({unreadNotificationCount} unread)
                          </span>
                        ) : null}
                      </h3>
                      <div className="flex gap-2">
                        {unreadNotificationCount > 0 ? (
                          <button
                            className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
                            onClick={handleMarkAllRead}
                            type="button"
                          >
                            Mark all read
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {/* List */}
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 px-5 py-12 text-sm text-surface-400">
                          <span className="text-3xl">{'\u{1F514}'}</span>
                          <p className="font-medium">No notifications yet.</p>
                          <p className="text-xs">We'll let you know when something arrives.</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <button
                            className={`flex w-full items-start gap-3 border-b border-surface-50 px-5 py-4 text-left text-sm transition-all duration-150 hover:bg-surface-50 ${
                              !notification.read ? "bg-brand-50/40" : ""
                            }`}
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            type="button"
                          >
                            <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-surface-100 text-base">
                              {getDefaultIcon(notification.type)}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p
                                className={`leading-5 ${
                                  !notification.read
                                    ? "font-semibold text-surface-900"
                                    : "text-surface-600"
                                }`}
                              >
                                {notification.message}
                              </p>
                              <p className="mt-1 text-xs text-surface-400">
                                {formatNotificationTime(notification.createdAt)}
                              </p>
                            </div>
                            {!notification.read ? (
                              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-500 ring-2 ring-brand-100" />
                            ) : null}
                          </button>
                        ))
                      )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 ? (
                      <div className="border-t border-surface-100 px-3 py-2">
                        <button
                          className="w-full rounded-xl px-3 py-2 text-xs font-semibold text-surface-500 transition-colors hover:bg-surface-50 hover:text-surface-700"
                          onClick={handleClearAll}
                          type="button"
                        >
                          Clear all notifications
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* User Dropdown */}
            <div className="relative" ref={userDropdownRef}>
              <button
                className="hidden items-center gap-3 rounded-xl bg-white/10 px-3 py-1.5 backdrop-blur-sm transition-all duration-200 hover:bg-white/15 sm:flex"
                onClick={handleUserDropdownToggle}
                type="button"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-xs font-bold text-white">
                  {initials(user?.name)}
                </span>
                <span className="leading-tight">
                  <span className="block max-w-28 truncate text-sm font-semibold text-white">
                    {user?.name}
                  </span>
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/50">
                    {user?.role}
                  </span>
                </span>
                <svg className="h-4 w-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isUserDropdownOpen ? (
                <div
                  className="absolute right-0 top-full z-50 mt-3 w-56 origin-top-right animate-fade-in-down overflow-hidden rounded-2xl border border-surface-200/80 bg-white shadow-2xl shadow-brand-900/10 ring-1 ring-black/5"
                >
                  <div className="py-2">
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-surface-700 transition-all duration-150 hover:bg-surface-50 hover:text-surface-900"
                      onClick={() => setIsUserDropdownOpen(false)}
                    >
                      <svg className="h-5 w-5 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Profile</span>
                    </Link>
                    <div className="border-t border-surface-100">
                      <button
                        className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 transition-all duration-150 hover:bg-red-50"
                        onClick={() => {
                          setIsUserDropdownOpen(false);
                          handleLogout();
                        }}
                        type="button"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Mobile menu toggle */}
            <button
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white/80 backdrop-blur-sm md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              type="button"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex min-w-fit items-center gap-2">
            <Link
              className="rounded-xl bg-white/10 px-5 py-2.5 text-sm font-semibold text-white shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-white/20 hover:shadow-md"
              href="/login"
            >
              Login
            </Link>
            <Link
              className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 shadow-sm transition-all duration-200 hover:bg-white/90 hover:shadow-md active:scale-95"
              href="/register"
            >
              Register
            </Link>
            {/* Mobile menu toggle */}
            <button
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white/80 backdrop-blur-sm md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              type="button"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="animate-fade-in-down border-t border-white/10 bg-brand-700/95 backdrop-blur-xl md:hidden">
          <nav className="flex flex-col gap-1 px-4 py-4">
            <MobileNavLink href="/" onClick={() => setIsMobileMenuOpen(false)}>Home</MobileNavLink>
            {isAuthenticated ? (
              <>
                <MobileNavLink exact href={dashboardPath} onClick={() => setIsMobileMenuOpen(false)}>Dashboard</MobileNavLink>
                {canNotify ? <MobileNavLink href="/messages" onClick={() => setIsMobileMenuOpen(false)}>Messages</MobileNavLink> : null}
                {user?.role === "tenant" ? <MobileNavLink href="/tenant/search" onClick={() => setIsMobileMenuOpen(false)}>Search</MobileNavLink> : null}
                {user?.role === "landlord" ? <MobileNavLink href="/landlord/listings" onClick={() => setIsMobileMenuOpen(false)}>Listings</MobileNavLink> : null}
                {user?.role === "admin" ? <MobileNavLink exact href="/admin" onClick={() => setIsMobileMenuOpen(false)}>Admin</MobileNavLink> : null}
              </>
            ) : (
              <>
                <MobileNavLink href="/login" onClick={() => setIsMobileMenuOpen(false)}>Login</MobileNavLink>
                <MobileNavLink href="/register" onClick={() => setIsMobileMenuOpen(false)}>Register</MobileNavLink>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

function MobileNavLink({ children, exact, href, onClick }) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      className={`rounded-xl px-4 py-3 text-sm font-medium transition-all ${
        isActive
          ? "bg-white/15 text-white"
          : "text-white/70 hover:bg-white/10 hover:text-white"
      }`}
      href={href}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}