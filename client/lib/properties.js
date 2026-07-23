import { apiRequest, API_URL } from "./api";
export { API_URL };

export async function fetchProperties(params = {}) {
  const query = new URLSearchParams();

  if (params.location) query.set("location", params.location);
  if (params.propertyType) query.set("propertyType", params.propertyType);
  if (params.availability) query.set("availability", params.availability);
  if (params.minPrice) query.set("minPrice", params.minPrice);
  if (params.maxPrice) query.set("maxPrice", params.maxPrice);
  if (params.bedrooms) query.set("bedrooms", params.bedrooms);
  if (params.sort) query.set("sort", params.sort);
  if (params.page) query.set("page", params.page);
  if (params.limit) query.set("limit", params.limit);

  const qs = query.toString();
  const path = `/api/properties${qs ? `?${qs}` : ""}`;

  return apiRequest(path);
}

export async function fetchPropertyById(id) {
  return apiRequest(`/api/properties/${id}`);
}

export function formatPrice(price) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function propertyTypeGradient(type) {
  const gradients = {
    flat: "from-blue-500 via-blue-400 to-cyan-300",
    house: "from-emerald-500 via-emerald-400 to-teal-300",
    studio: "from-violet-500 via-violet-400 to-purple-300",
    room: "from-amber-500 via-amber-400 to-yellow-300",
    bungalow: "from-rose-500 via-rose-400 to-pink-300",
    maisonette: "from-indigo-500 via-indigo-400 to-blue-300",
  };
  return gradients[type] || "from-brand-500 via-brand-400 to-brand-300";
}

// File upload validation constants (shared between frontend and backend)
export const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
export const MAX_IMAGES = 8;

// Legacy exports for other components
export function formatRent(price) {
  return formatPrice(price);
}

export function imageUrl(image) {
  if (!image) return null;
  const url = image.url || `/uploads/${image.filename}`;
  return url.startsWith("http") ? url : `${API_URL}${url}`;
}

export const propertyTypes = [
  { label: "Flat", value: "flat" },
  { label: "House", value: "house" },
  { label: "Studio", value: "studio" },
  { label: "Room", value: "room" },
  { label: "Bungalow", value: "bungalow" },
  { label: "Maisonette", value: "maisonette" },
];

export function propertyTypeIcon(type) {
  // Returns a decorative SVG path for the property type
  const icons = {
    flat: "M3 7.5L7.5 3l4.5 4.5M3 7.5v9a1.5 1.5 0 001.5 1.5h3M3 7.5h3m3 0h3m-3 0V21m0-13.5h3m0 0l4.5-4.5M18 7.5v9a1.5 1.5 0 01-1.5 1.5h-3m3-10.5h-3m0 0V21",
    house: "M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25",
    studio: "M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z",
    room: "M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z",
    bungalow: "M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819",
    maisonette: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z",
  };
  return icons[type] || icons.house;
}