"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "../lib/api";
import { formatRent, imageUrl, propertyTypes } from "../lib/properties";
import PropertyMap from "./PropertyMap";
import MapSearchModal from "./MapSearchModal";

const emptyFilters = {
  location: "",
  minPrice: "",
  maxPrice: "",
  bedrooms: "",
  propertyType: ""
};

const emptyBounds = null;

const sortOptions = [
  { label: "Newest first", value: "newest" },
  { label: "Oldest first", value: "oldest" },
  { label: "Price: low to high", value: "price_asc" },
  { label: "Price: high to low", value: "price_desc" }
];

function buildQuery(filters, page, sort, bounds) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== "") {
      params.set(key, value);
    }
  });

  if (page > 1) {
    params.set("page", String(page));
  }

  if (sort && sort !== "newest") {
    params.set("sort", sort);
  }

  // Append bounding-box coords if present
  if (bounds) {
    params.set("neLat", String(bounds.neLat));
    params.set("neLng", String(bounds.neLng));
    params.set("swLat", String(bounds.swLat));
    params.set("swLng", String(bounds.swLng));
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

function Pagination({ page, pages, onPageChange }) {
  if (pages <= 1) return null;

  const siblings = 1;
  const start = Math.max(2, page - siblings);
  const end = Math.min(pages - 1, page + siblings);
  const items = [];

  const btnBase = "rounded-xl px-3.5 py-2 text-sm font-semibold transition-all duration-200 active:scale-95";

  items.push(
    <button
      className={`${btnBase} ${
        page === 1
          ? "bg-brand-500 text-white shadow-sm"
          : "border border-surface-200 bg-white text-surface-700 hover:bg-surface-50 hover:border-surface-300"
      }`}
      key={1}
      onClick={() => onPageChange(1)}
      type="button"
    >
      1
    </button>
  );

  if (start > 2) {
    items.push(
      <span className="px-1 text-sm text-surface-400" key="start-ellipsis">
        &hellip;
      </span>
    );
  }

  for (let i = start; i <= end; i++) {
    items.push(
      <button
        className={`${btnBase} ${
          i === page
            ? "bg-brand-500 text-white shadow-sm"
            : "border border-surface-200 bg-white text-surface-700 hover:bg-surface-50 hover:border-surface-300"
        }`}
        key={i}
        onClick={() => onPageChange(i)}
        type="button"
      >
        {i}
      </button>
    );
  }

  if (end < pages - 1) {
    items.push(
      <span className="px-1 text-sm text-surface-400" key="end-ellipsis">
        &hellip;
      </span>
    );
  }

  if (pages > 1) {
    items.push(
      <button
        className={`${btnBase} ${
          page === pages
            ? "bg-brand-500 text-white shadow-sm"
            : "border border-surface-200 bg-white text-surface-700 hover:bg-surface-50 hover:border-surface-300"
        }`}
        key={pages}
        onClick={() => onPageChange(pages)}
        type="button"
      >
        {pages}
      </button>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        className="inline-flex items-center gap-1.5 rounded-xl border border-surface-200 bg-white px-4 py-2 text-sm font-semibold text-surface-700 shadow-sm transition-all duration-200 hover:bg-surface-50 hover:border-surface-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        type="button"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Prev
      </button>

      {items}

      <button
        className="inline-flex items-center gap-1.5 rounded-xl border border-surface-200 bg-white px-4 py-2 text-sm font-semibold text-surface-700 shadow-sm transition-all duration-200 hover:bg-surface-50 hover:border-surface-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
        disabled={page >= pages}
        onClick={() => onPageChange(page + 1)}
        type="button"
      >
        Next
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>
    </div>
  );
}

function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-sm animate-pulse">
      <div className="h-48 bg-surface-200" />
      <div className="p-5 space-y-4">
        <div className="h-5 w-3/4 bg-surface-200 rounded" />
        <div className="h-4 w-1/2 bg-surface-100 rounded" />
        <div className="h-12 bg-surface-100 rounded" />
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 bg-surface-100 rounded-lg" />
          ))}
        </div>
        <div className="h-9 w-28 bg-surface-200 rounded-xl" />
      </div>
    </div>
  );
}

export default function TenantSearch() {
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(emptyFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [properties, setProperties] = useState([]);
  const [sort, setSort] = useState("newest");
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [mapBounds, setMapBounds] = useState(emptyBounds);
  const [mapModalOpen, setMapModalOpen] = useState(false);

  const resultCount = properties.length;

  async function loadProperties(nextFilters = filters, nextPage = 1, nextSort = sort, nextBounds = mapBounds) {
    setError("");
    setIsLoading(true);

    try {
      const payload = await apiRequest(
        `/api/properties${buildQuery(nextFilters, nextPage, nextSort, nextBounds)}`
      );
      setProperties(payload.data.properties);
      setPage(payload.data.pagination.page);
      setPages(payload.data.pagination.pages);
      setTotal(payload.data.pagination.total);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadProperties(emptyFilters, 1, "newest", null);
  }, []);

  function updateFilter(event) {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function submitFilters(event) {
    event.preventDefault();
    loadProperties(filters, 1, sort, mapBounds);
  }

  function resetFilters() {
    setFilters(emptyFilters);
    setMapBounds(emptyBounds);
    setSort("newest");
    loadProperties(emptyFilters, 1, "newest", null);
  }

  function handlePageChange(nextPage) {
    loadProperties(filters, nextPage, sort, mapBounds);
  }

  function handleSortChange(event) {
    const nextSort = event.target.value;
    setSort(nextSort);
    loadProperties(filters, 1, nextSort, mapBounds);
  }

  /** Called when user clicks "Apply" in the modal */
  function handleModalApply(bounds) {
    setMapModalOpen(false);
    setMapBounds(bounds);
    if (bounds) {
      loadProperties(filters, 1, sort, bounds);
    }
  }

  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  return (
    <div className="flex flex-col gap-6">
      {/* ── Mobile filter toggle ──────────────────────── */}
      <div className="flex items-center justify-between lg:hidden">
        <p className="text-sm text-surface-500">
          {isLoading ? "Searching..." : `${total} result${total === 1 ? "" : "s"} found`}
        </p>
        <button
          className="inline-flex items-center gap-2 rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm font-semibold text-surface-700 shadow-sm transition-all duration-200 hover:bg-surface-50 active:scale-95"
          onClick={() => setShowFilters(!showFilters)}
          type="button"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
          </svg>
          {showFilters ? "Hide filters" : "Show filters"}
          {hasActiveFilters && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
              {Object.values(filters).filter((v) => v !== "").length}
            </span>
          )}
        </button>
      </div>

      <div className={`grid gap-6 lg:grid-cols-[320px_1fr] ${showFilters ? "" : "lg:grid-cols-[320px_1fr]"}`}>
        {/* ── Filters sidebar ──────────────────────────── */}
        <aside className={`flex flex-col gap-4 ${showFilters ? "block" : "hidden lg:flex"}`}>
          <form
            className="flex flex-col gap-5 rounded-2xl border border-surface-200 bg-white p-6 shadow-sm"
            onSubmit={submitFilters}
          >
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-surface-900">Filters</h2>
                {hasActiveFilters && (
                  <button
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
                    onClick={resetFilters}
                    type="button"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <p className="mt-1 text-sm text-surface-500">
                Narrow listings by location, budget, type, and bedrooms.
              </p>
            </div>

            {/* Location */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-surface-500">
                Location
              </label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                <input
                  className="w-full rounded-xl border border-surface-200 bg-surface-50 py-2.5 pl-10 pr-4 text-sm text-surface-900 placeholder-surface-400 outline-none transition-all duration-200 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-50"
                  name="location"
                  onChange={updateFilter}
                  placeholder="City or postcode"
                  value={filters.location}
                />
              </div>
            </div>

            {/* Price range */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-surface-500">
                Price range
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-surface-400 font-medium">£</span>
                  <input
                    className="w-full rounded-xl border border-surface-200 bg-surface-50 py-2.5 pl-8 pr-3 text-sm text-surface-900 placeholder-surface-400 outline-none transition-all duration-200 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-50"
                    min="0"
                    name="minPrice"
                    onChange={updateFilter}
                    placeholder="Min"
                    type="number"
                    value={filters.minPrice}
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-surface-400 font-medium">£</span>
                  <input
                    className="w-full rounded-xl border border-surface-200 bg-surface-50 py-2.5 pl-8 pr-3 text-sm text-surface-900 placeholder-surface-400 outline-none transition-all duration-200 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-50"
                    min="0"
                    name="maxPrice"
                    onChange={updateFilter}
                    placeholder="Max"
                    type="number"
                    value={filters.maxPrice}
                  />
                </div>
              </div>
            </div>

            {/* Property type */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-surface-500">
                Property type
              </label>
              <select
                className="w-full rounded-xl border border-surface-200 bg-surface-50 px-3 py-2.5 text-sm text-surface-900 outline-none transition-all duration-200 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-50"
                name="propertyType"
                onChange={updateFilter}
                value={filters.propertyType}
              >
                {propertyTypes.map((type) => (
                  <option key={type.label} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Bedrooms */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-surface-500">
                Minimum bedrooms
              </label>
              <div className="flex gap-2">
                {[0, 1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200 active:scale-95 ${
                      filters.bedrooms === String(num) || (num === 0 && filters.bedrooms === "")
                        ? "bg-brand-500 text-white shadow-sm"
                        : "border border-surface-200 bg-white text-surface-700 hover:bg-surface-50 hover:border-surface-300"
                    }`}
                    onClick={() => {
                      setFilters((prev) => ({
                        ...prev,
                        bedrooms: num === 0 ? "" : String(num)
                      }));
                    }}
                    type="button"
                  >
                    {num === 0 ? "Any" : num}
                  </button>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <button
                className="flex-1 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-brand-600 hover:shadow-md active:scale-95"
                type="submit"
              >
                <span className="inline-flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                  Search
                </span>
              </button>
              <button
                className="rounded-xl border border-surface-200 bg-white px-5 py-2.5 text-sm font-semibold text-surface-700 shadow-sm transition-all duration-200 hover:bg-surface-50 hover:border-surface-300 active:scale-95"
                onClick={resetFilters}
                type="button"
              >
                Reset
              </button>
            </div>
          </form>

          {/* Map preview */}
          <div className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-surface-900">Map preview</h2>
              <button
                className="inline-flex items-center gap-1.5 rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-xs font-semibold text-surface-600 shadow-sm transition-all duration-200 hover:bg-surface-50 active:scale-95"
                onClick={() => setMapModalOpen(true)}
                type="button"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 1115 0 7.5 7.5 0 01-15 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6" />
                </svg>
                Search on map
              </button>
            </div>
            <div className="mt-3 overflow-hidden rounded-xl" style={{ height: "250px" }}>
              <PropertyMap properties={properties} />
            </div>
            {mapBounds && (
              <div className="mt-3 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 1115 0 7.5 7.5 0 01-15 0z" />
                  </svg>
                  Area filter active
                </span>
                <button
                  className="rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-xs font-semibold text-surface-600 transition-all duration-200 hover:bg-surface-50 active:scale-95"
                  onClick={() => {
                    setMapBounds(emptyBounds);
                    loadProperties(filters, 1, sort, null);
                  }}
                  type="button"
                >
                  Clear
                </button>
              </div>
            )}
            {!mapBounds && properties.filter((p) => p.latitude && p.longitude).length === 0 ? (
              <p className="mt-2 text-center text-xs text-surface-400">
                No coordinates set for any listings yet.
              </p>
            ) : null}
          </div>
        </aside>

        {/* ── Results ──────────────────────────────────── */}
        <section className="flex flex-col gap-4">
          {/* Results header */}
          <div className="flex flex-col gap-3 rounded-2xl border border-surface-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-surface-900">Available properties</h2>
              <p className="mt-1 text-sm text-surface-500">
                {isLoading
                  ? "Searching..."
                  : `${total} result${total === 1 ? "" : "s"} found`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-surface-500">
                  Sort
                </label>
                <select
                  className="rounded-xl border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-surface-900 outline-none transition-all duration-200 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-50"
                  onChange={handleSortChange}
                  value={sort}
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                className="inline-flex items-center gap-1.5 rounded-xl border border-surface-200 bg-white px-3.5 py-2 text-sm font-semibold text-surface-600 shadow-sm transition-all duration-200 hover:bg-surface-50 hover:border-surface-300 active:scale-95"
                onClick={() => loadProperties(filters, page, sort)}
                type="button"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                </svg>
                Refresh
              </button>
            </div>
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
            <div className="grid gap-4 xl:grid-cols-2">
              {[1, 2, 3, 4].map((i) => <PropertyCardSkeleton key={i} />)}
            </div>
          ) : null}

          {/* Empty state */}
          {!isLoading && properties.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-surface-200 bg-white px-6 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-100 mb-4">
                <svg className="h-8 w-8 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-surface-900">No properties found</h3>
              <p className="mt-1 text-sm text-surface-500 max-w-sm">
                No available listings match your filters. Try adjusting your search criteria.
              </p>
              <button
                className="mt-4 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-brand-600 active:scale-95"
                onClick={resetFilters}
                type="button"
              >
                Clear all filters
              </button>
            </div>
          ) : null}

          {/* Property cards */}
          {!isLoading && properties.length > 0 && (
            <div className="grid gap-4 xl:grid-cols-2">
              {properties.map((property) => (
                <article
                  className="group relative overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
                  key={property._id}
                >
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden bg-surface-100">
                    {property.images?.[0] ? (
                      <img
                        alt={property.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        src={imageUrl(property.images[0])}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <div className="text-center">
                          <svg className="mx-auto h-10 w-10 text-surface-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                          </svg>
                          <p className="mt-1 text-xs text-surface-400">No image</p>
                        </div>
                      </div>
                    )}
                    {/* Price badge */}
                    <div className="absolute top-3 left-3 rounded-lg bg-white/90 backdrop-blur-sm px-3 py-1.5 shadow-sm">
                      <span className="text-sm font-bold text-surface-900">{formatRent(property.pricePerMonth)}</span>
                      <span className="text-xs text-surface-500">/mo</span>
                    </div>
                    {/* Property type badge */}
                    <div className="absolute top-3 right-3 rounded-lg bg-white/90 backdrop-blur-sm px-3 py-1.5 shadow-sm">
                      <span className="text-xs font-semibold capitalize text-surface-700">{property.propertyType}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-surface-900 truncate group-hover:text-brand-600 transition-colors">
                      {property.title}
                    </h3>
                    <p className="mt-1 text-sm text-surface-500 truncate">
                      <svg className="inline h-3.5 w-3.5 mr-1 -mt-0.5 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                      {property.addressLine1}, {property.city}, {property.postcode}
                    </p>

                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-surface-600">
                      {property.description}
                    </p>

                    {/* Specs grid */}
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <div className="flex items-center gap-1.5 rounded-lg bg-surface-50 px-3 py-2 text-xs font-medium text-surface-700">
                        <svg className="h-3.5 w-3.5 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
                        </svg>
                        {property.bedrooms} bed{property.bedrooms === 1 ? "" : "s"}
                      </div>
                      <div className="flex items-center gap-1.5 rounded-lg bg-surface-50 px-3 py-2 text-xs font-medium text-surface-700">
                        <svg className="h-3.5 w-3.5 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                        </svg>
                        {property.bathrooms} bath{property.bathrooms === 1 ? "" : "s"}
                      </div>
                      <div className="flex items-center gap-1.5 rounded-lg bg-surface-50 px-3 py-2 text-xs font-medium text-surface-700">
                        <svg className="h-3.5 w-3.5 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                        </svg>
                        {property.available ? "Available" : "Let"}
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="mt-4 flex items-center gap-3">
                      <Link
                        className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-brand-600 hover:shadow-md active:scale-95"
                        href={`/properties/${property._id}`}
                      >
                        View details
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && pages > 1 && (
            <Pagination
              onPageChange={handlePageChange}
              page={page}
              pages={pages}
            />
          )}
        </section>
      </div>

      {/* Map search modal */}
      <MapSearchModal
        open={mapModalOpen}
        onClose={() => setMapModalOpen(false)}
        initialBounds={mapBounds}
        onApply={handleModalApply}
      />
    </div>
  );
}
