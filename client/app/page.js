"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "./providers";
import SiteHeader from "../components/SiteHeader";
import PropertyCard from "../components/PropertyCard";
import { PropertyCardSkeleton } from "../components/PropertyCardSkeleton";
import { fetchProperties } from "../lib/properties";
import HeroSection from "../components/home/HeroSection";
import QuickActions from "../components/home/QuickActions";
import HowItWorks from "../components/home/HowItWorks";
import StatsBar from "../components/home/StatsBar";
import FeatureCards from "../components/home/FeatureCards";
import HomeFooter from "../components/home/HomeFooter";

function useFeaturedProperties() {
  const [featured, setFeatured] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [featuredRes, recentRes] = await Promise.all([
          fetchProperties({ sort: "newest", limit: 4 }),
          fetchProperties({ sort: "newest", limit: 6 }),
        ]);

        if (cancelled) return;

        setFeatured(featuredRes.data.properties || []);
        setRecent(recentRes.data.properties || []);

        // Compute stats from real data
        const total = recentRes.data.pagination?.total || 0;
        const uniqueCities = new Set(
          (recentRes.data.properties || []).map((p) => p.city?.toLowerCase())
        );
        setStats({
          totalProperties: total,
          uniqueCities: uniqueCities.size,
          listedThisMonth: (recentRes.data.properties || []).filter((p) => {
            const created = new Date(p.createdAt);
            const now = new Date();
            return (
              created.getMonth() === now.getMonth() &&
              created.getFullYear() === now.getFullYear()
            );
          }).length,
        });
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { featured, recent, loading, error, stats };
}

// --- Admin Home ---
function AdminHome({ user }) {
  const adminActions = [
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      ),
      title: "Dashboard",
      description: "View platform stats, user counts, listings, and bookings at a glance.",
      href: "/admin/dashboard",
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
        </svg>
      ),
      title: "Admin Panel",
      description: "Manage users, moderate property listings, and review all bookings.",
      href: "/admin",
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      ),
      title: "Profile",
      description: "Update your account name, email, or password.",
      href: "/profile",
    },
  ];

  return (
    <main className="min-h-screen bg-surface-50">
      <SiteHeader />
      <HeroSection
        badge="Admin Dashboard"
        title={`Welcome back, ${user?.name?.split(" ")[0] || "Admin"}`}
        subtitle="Manage users, moderate listings, and review bookings from your admin panel."
        gradient="from-brand-600 via-brand-500 to-brand-400"
      />
      <QuickActions actions={adminActions} />
      <HomeFooter variant="simple" />
    </main>
  );
}

// --- Landlord Home ---
function LandlordHome({ user }) {
  const landlordActions = [
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      ),
      title: "Dashboard",
      description: "Overview of your listings and booking requests.",
      href: "/landlord",
      hoverBorder: "hover:border-emerald-200",
      gradient: "from-emerald-50/50 via-transparent to-transparent",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
        </svg>
      ),
      title: "My Listings",
      description: "Add, edit, and manage your property listings.",
      href: "/landlord/listings",
      hoverBorder: "hover:border-emerald-200",
      gradient: "from-emerald-50/50 via-transparent to-transparent",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
        </svg>
      ),
      title: "Messages",
      description: "Chat with tenants about their booking requests.",
      href: "/messages",
      hoverBorder: "hover:border-emerald-200",
      gradient: "from-emerald-50/50 via-transparent to-transparent",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      ),
      title: "Profile",
      description: "Update your account details.",
      href: "/profile",
      hoverBorder: "hover:border-emerald-200",
      gradient: "from-emerald-50/50 via-transparent to-transparent",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
  ];

  const landlordSteps = [
    {
      step: "1",
      title: "Create Listing",
      description: "Add your property details, photos, and pricing in just a few minutes.",
    },
    {
      step: "2",
      title: "Manage Bookings",
      description: "Review tenant requests, schedule viewings, and manage bookings easily.",
    },
    {
      step: "3",
      title: "Find Tenants",
      description: "Connect with verified tenants and complete rentals without agency fees.",
    },
  ];

  return (
    <main className="min-h-screen bg-surface-50">
      <SiteHeader />
      <HeroSection
        badge="Landlord Portal"
        title={`Welcome back, ${user?.name?.split(" ")[0] || "Landlord"}`}
        subtitle="Manage your property listings and respond to tenant inquiries."
        gradient="from-emerald-600 via-emerald-500 to-teal-400"
      />
      <QuickActions actions={landlordActions} />
      <HowItWorks
        badge="Simple Process"
        title="How It Works"
        subtitle="Get started in minutes with our simple process"
        steps={landlordSteps}
        buttonText="Create Your First Listing"
        buttonHref="/landlord/listings"
        colorScheme="emerald"
      />
      <HomeFooter variant="simple" />
    </main>
  );
}

// --- Tenant Home ---
function TenantHome({ user }) {
  const { featured, recent, loading, error } = useFeaturedProperties();

  const tenantActions = [
    {
      icon: (
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
        </svg>
      ),
      title: "Browse Properties",
      description: "Find your dream rental property. Request viewings and contact landlords directly.",
      href: "/tenant/search",
    },
    {
      icon: (
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
        </svg>
      ),
      title: "My Bookings",
      description: "View your booking requests and check their status.",
      href: "/tenant",
    },
  ];

  const tenantSteps = [
    {
      step: "1",
      title: "Search Properties",
      description: "Browse through verified listings filtered by location, price, and property type.",
    },
    {
      step: "2",
      title: "Request Viewing",
      description: "Found a property you like? Send a viewing request directly to the landlord.",
    },
    {
      step: "3",
      title: "Move In",
      description: "Complete the booking process and move into your new home — no agent fees.",
    },
  ];

  return (
    <main className="min-h-screen bg-surface-50">
      <SiteHeader />
      <HeroSection
        badge="Tenant Dashboard"
        title={`Welcome back, ${user?.name?.split(" ")[0] || "Tenant"}`}
        subtitle="Find your next home — browse properties and request viewings."
        gradient="from-brand-600 via-brand-500 to-violet-500"
      >
        <div className="mt-10">
          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
            <div className="relative flex-1">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                className="w-full rounded-2xl border-0 bg-white/15 px-12 py-4 text-base text-white placeholder-white/60 backdrop-blur-sm ring-1 ring-white/20 focus:ring-2 focus:ring-white/40 focus:outline-none transition-all"
                placeholder="Search by location (city, postcode, etc.)"
                type="text"
              />
            </div>
            <select className="rounded-2xl border-0 bg-white/15 px-5 py-4 text-base text-white backdrop-blur-sm ring-1 ring-white/20 focus:ring-2 focus:ring-white/40 focus:outline-none appearance-none cursor-pointer">
              <option className="text-surface-900">All Types</option>
              <option className="text-surface-900">flat</option>
              <option className="text-surface-900">house</option>
              <option className="text-surface-900">studio</option>
            </select>
            <Link
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-semibold text-brand-700 shadow-lg shadow-brand-900/20 transition-all duration-200 hover:bg-white/90 hover:shadow-xl active:scale-95"
              href="/tenant/search"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              Search
            </Link>
          </div>
        </div>
      </HeroSection>
      <QuickActions actions={tenantActions} />

      {/* Featured Properties - Real Data */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold text-surface-900">Featured Properties</h2>
            <p className="mt-1 text-sm text-surface-500">Latest listings from trusted landlords</p>
          </div>
          <Link href="/tenant/search" className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors">
            View all
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <PropertyCardSkeleton variant="horizontal" />
            <PropertyCardSkeleton variant="horizontal" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <p className="text-red-600 font-medium">Unable to load properties</p>
            <p className="text-sm text-red-500 mt-1">{error}</p>
          </div>
        ) : featured.length === 0 ? (
          <div className="rounded-2xl border border-surface-200 bg-white p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-surface-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
            </svg>
            <h3 className="mt-4 text-lg font-semibold text-surface-900">No properties yet</h3>
            <p className="mt-2 text-sm text-surface-500">Check back soon for new listings.</p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {featured.map((property) => (
              <PropertyCard key={property._id} property={property} variant="horizontal" />
            ))}
          </div>
        )}
      </section>

      <HowItWorks
        badge="Simple Process"
        title="How It Works"
        subtitle="Get started in minutes with our simple process"
        steps={tenantSteps}
        buttonText="Browse Properties"
        buttonHref="/tenant/search"
        colorScheme="brand"
      />

      <HomeFooter variant="detailed" />
    </main>
  );
}

// --- Guest Home (unauthenticated users) ---
function GuestHome() {
  const { featured, recent, loading, error, stats } = useFeaturedProperties();

  const defaultStats = [
    { value: "500+", label: "Properties Listed" },
    { value: "98%", label: "Satisfied Tenants" },
    { value: stats ? `${stats.uniqueCities}+` : "250+", label: stats ? "Cities Covered" : "Active Landlords" },
    { value: "£0", label: "Agency Fees" },
  ];

  const features = [
    {
      icon: (
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
        </svg>
      ),
      title: "For Renters",
      description: "Find your dream rental property. Request viewings and contact landlords directly — no estate agents, no hidden fees.",
      buttonText: "Browse Properties",
      buttonHref: "/tenant/search",
      gradient: "from-brand-50/50 via-transparent to-transparent",
      iconBg: "bg-brand-50",
      iconColor: "text-brand-600",
      buttonColor: "bg-brand-500 hover:bg-brand-600",
    },
    {
      icon: (
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
      title: "For Property Owners",
      description: "List your properties and reach potential tenants without estate agents. Manage listings, bookings, and messages from one dashboard.",
      buttonText: "List Your Property",
      buttonHref: "/register",
      gradient: "from-emerald-50/50 via-transparent to-transparent",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      buttonColor: "bg-emerald-500 hover:bg-emerald-600",
    },
  ];

  const guestSteps = [
    {
      step: "1",
      title: "Search Properties",
      description: "Browse through verified listings filtered by location, price, and property type.",
    },
    {
      step: "2",
      title: "Request Viewing",
      description: "Found a property you like? Send a viewing request directly to the landlord.",
    },
    {
      step: "3",
      title: "Move In",
      description: "Complete the booking process and move into your new home — no agent fees.",
    },
  ];

  return (
    <main className="min-h-screen bg-white">
      <SiteHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-400">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,255,255,0.15),transparent)]" />
          <div className="absolute top-1/4 -left-32 h-96 w-96 rounded-full bg-brand-300/10 blur-3xl" />
          <div className="absolute -bottom-32 right-1/4 h-64 w-64 rounded-full bg-brand-200/10 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-32 pt-24 sm:px-6 lg:px-8 lg:pb-40 lg:pt-32">
          <div className="max-w-3xl">
            <div className="inline-flex animate-fade-in-down items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-sm ring-1 ring-white/20">
              <span className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              Direct landlord lets — No fees
            </div>

            <h1 className="mt-6 animate-fade-in-up text-3xl font-bold leading-tight tracking-tight text-white md:text-4xl lg:text-5xl">
              Find The Perfect
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-brand-100 to-white">Rental Property</span>
            </h1>

            <p className="mt-4 animate-fade-in-up text-base leading-relaxed text-white/70 md:text-lg max-w-2xl" style={{ animationDelay: '0.1s' }}>
              Discover the perfect property that suits your needs. Browse direct landlord listings, request viewings, and find your next home — all without estate agent fees.
            </p>

            <div className="mt-10 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex flex-col sm:flex-row gap-3 max-w-2xl bg-white/10 backdrop-blur-sm rounded-2xl p-2 ring-1 ring-white/20">
                <div className="relative flex-1">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                  <input
                    className="w-full rounded-xl border-0 bg-white/15 px-12 py-4 text-base text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
                    placeholder="Search by location (city, postcode, etc.)"
                    type="text"
                  />
                </div>
                <div className="flex gap-3">
                  <select className="rounded-xl border-0 bg-white/15 px-4 py-4 text-base text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/30 appearance-none cursor-pointer min-w-[120px]">
                    <option className="text-surface-900">All Types</option>
                    <option className="text-surface-900">flat</option>
                    <option className="text-surface-900">house</option>
                    <option className="text-surface-900">studio</option>
                  </select>
                  <Link
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-4 text-base font-semibold text-brand-700 shadow-lg transition-all duration-200 hover:bg-white/90 hover:shadow-xl active:scale-95"
                    href="/tenant/search"
                  >
                    Search
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />
      </section>

      <StatsBar stats={stats ? [stats.totalProperties, "98%", stats.uniqueCities, "£0"].map((val, i) => ({
        value: typeof val === 'number' ? `${val}+` : val,
        label: ["Properties Listed", "Satisfied Tenants", "Cities Covered", "Agency Fees"][i]
      })) : defaultStats} loading={loading} />

      <FeatureCards features={features} />

      {/* How It Works */}
      <HowItWorks
        badge="Simple Process"
        title="How It Works"
        subtitle="Get started in minutes with our simple process"
        steps={guestSteps}
        buttonText="Get Started Now"
        buttonHref="/tenant/search"
        colorScheme="brand"
      />

      {/* Recent Properties — Real Data */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-surface-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-surface-600">
            Latest
          </span>
          <h2 className="mt-4 text-2xl font-bold text-surface-900">Recent Properties</h2>
          <p className="mt-1 text-sm text-surface-500">Newly listed properties updated daily</p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {loading ? (
            <>
              <PropertyCardSkeleton />
              <PropertyCardSkeleton />
              <PropertyCardSkeleton />
            </>
          ) : error ? (
            <div className="col-span-full rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
              <p className="text-red-600 font-medium">Unable to load recent properties</p>
              <p className="text-sm text-red-500 mt-1">{error}</p>
            </div>
          ) : recent.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-surface-200 bg-white p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-surface-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
              </svg>
              <h3 className="mt-4 text-lg font-semibold text-surface-900">No recent listings</h3>
              <p className="mt-2 text-sm text-surface-500">New properties will appear here as they are added.</p>
            </div>
          ) : (
            recent.map((property) => (
              <PropertyCard key={property._id} property={property} variant="default" />
            ))
          )}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-brand-500/25 transition-all duration-200 hover:bg-brand-600 hover:shadow-xl active:scale-95"
            href="/tenant/search"
          >
            View All Properties
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </section>

      <HomeFooter variant="detailed" />
    </main>
  );
}

function PageLoader() {
  return (
    <main className="min-h-screen bg-white">
      <SiteHeader />
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative mx-auto h-12 w-12">
            <div className="absolute inset-0 rounded-full border-4 border-surface-200" />
            <div className="absolute inset-0 rounded-full border-4 border-t-brand-500 animate-spin" />
          </div>
          <p className="mt-4 text-sm text-surface-400">Loading...</p>
        </div>
      </div>
    </main>
  );
}

export default function Home() {
  const { isAuthenticated, user, isReady } = useAuth();

  if (!isReady) {
    return <PageLoader />;
  }

  if (isAuthenticated && user?.role === "admin") {
    return <AdminHome user={user} />;
  }

  if (isAuthenticated && user?.role === "landlord") {
    return <LandlordHome user={user} />;
  }

  if (isAuthenticated && user?.role === "tenant") {
    return <TenantHome user={user} />;
  }

  return <GuestHome />;
}