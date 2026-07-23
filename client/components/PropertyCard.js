"use client";

import { useCallback, useState } from "react";
import { formatPrice, propertyTypeGradient, propertyTypeIcon, API_URL } from "../lib/properties";
import OverlayLoader from "./OverlayLoader";

export default function PropertyCard({ property, variant = "default" }) {
  const gradient = propertyTypeGradient(property.propertyType);
  const iconPath = propertyTypeIcon(property.propertyType);
  const hasImage = property.images && property.images.length > 0;
  const [navigating, setNavigating] = useState(false);

  const handleNavigate = useCallback(() => {
    setNavigating(true);
    // Use window.location to trigger navigation after showing the overlay
    setTimeout(() => {
      window.location.href = `/properties/${property._id}`;
    }, 50);
  }, [property._id]);

  const imgSrc = hasImage
    ? (property.images[0].url.startsWith("http")
        ? property.images[0].url
        : `${API_URL}${property.images[0].url}`)
    : null;

  const priceTag = (
    <span className="absolute right-4 top-4 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-surface-900 shadow-sm ring-1 ring-black/5">
      {formatPrice(property.pricePerMonth)}<span className="text-surface-400 font-normal">/mo</span>
    </span>
  );

  const availableBadge = property.availability === "available" ? (
    <span className="absolute left-4 top-4 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
      Available
    </span>
  ) : null;

  const imageArea = hasImage ? (
    <img
      src={imgSrc}
      alt={property.title}
      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
    />
  ) : (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_70%)]" />
      <div className="absolute inset-0 flex items-center justify-center">
        <svg className="h-20 w-20 text-white/15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
        </svg>
      </div>
    </>
  );

  const specs = (
    <div className="mt-4 flex items-center gap-4 text-sm text-surface-400">
      <span className="flex items-center gap-1.5">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
        </svg>
        {property.bedrooms || 0} {property.bedrooms === 1 ? "Bed" : "Beds"}
      </span>
      <span className="flex items-center gap-1.5">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
        </svg>
        {property.bathrooms} {property.bathrooms === 1 ? "Bath" : "Baths"}
      </span>
      <span className="flex items-center gap-1.5">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
        </svg>
        Direct chat
      </span>
    </div>
  );

  if (variant === "horizontal") {
    return (
      <>
        {navigating && <OverlayLoader />}
        <div
          onClick={handleNavigate}
          className="group relative overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
        >
          <div className="grid md:grid-cols-[280px_1fr]">
            <div className={`relative h-56 md:h-full bg-gradient-to-br ${gradient} overflow-hidden`}>
              {hasImage ? imageArea : (
                <>
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.2),transparent_70%)]" />
                  <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="h-24 w-24 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
                    </svg>
                  </div>
                </>
              )}
              {priceTag}
              {availableBadge}
            </div>
            <div className="p-6 flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                  {property.propertyType}
                </span>
                {property.city && (
                  <span className="text-xs text-surface-400 flex items-center gap-1">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    {property.city}
                  </span>
                )}
              </div>
              <h3 className="mt-1 text-xl font-semibold text-surface-900">{property.title}</h3>
              <p className="mt-2 text-sm text-surface-500 line-clamp-2">{property.description}</p>
              {specs}
              <div className="mt-5 flex items-center justify-between gap-4 border-t border-surface-100 pt-5">
                <span className="text-sm font-medium text-emerald-600">{property.postcode}</span>
                <span className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-brand-600 hover:shadow-md active:scale-95">
                  Details
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {navigating && <OverlayLoader />}
      <div
        onClick={handleNavigate}
        className="group relative overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
      >
        <div className={`relative h-52 bg-gradient-to-br ${gradient}`}>
          {imageArea}
          {priceTag}
          {availableBadge}
        </div>
        <div className="p-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-surface-400">
              {property.propertyType}
            </span>
            {property.city && (
              <span className="text-xs text-surface-400">· {property.city}</span>
            )}
          </div>
          <h3 className="mt-1 text-lg font-semibold text-surface-900">{property.title}</h3>
          <p className="mt-2 text-sm text-surface-500 line-clamp-2">{property.description}</p>
          <div className="mt-4 flex items-center gap-4 text-sm text-surface-400">
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
              </svg>
              {property.bedrooms || 0} {property.bedrooms === 1 ? "Bed" : "Beds"}
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
              </svg>
              {property.bathrooms} {property.bathrooms === 1 ? "Bath" : "Baths"}
            </span>
          </div>
          <div className="mt-5 flex items-center justify-between gap-3 border-t border-surface-100 pt-5">
            <span className="text-sm font-medium text-emerald-600">Direct listing</span>
            <span className="inline-flex items-center gap-2 rounded-xl bg-surface-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-surface-800 hover:shadow-md active:scale-95">
              Details
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </>
  );
}