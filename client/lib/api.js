const fallbackApiUrl = "http://localhost:5000";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || fallbackApiUrl;

export async function apiRequest(path, options = {}) {
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(payload.error || "Request failed.");
    error.details = payload.details || [];
    error.status = response.status;
    throw error;
  }

  return payload;
}
