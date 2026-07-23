/**
 * Free geocoding via OpenStreetMap's Nominatim API.
 * No API key required. Respects the 1 request/second usage policy.
 * https://operations.osmfoundation.org/policies/nominatim/
 */

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "PropertyRentalApp/1.0 (property-rental-app)";

/**
 * Build a full address string from property address fields.
 * @param {{ addressLine1: string, city: string, postcode: string }} address
 * @returns {string}
 */
function buildAddressString({ addressLine1, city, postcode }) {
  return [addressLine1, city, postcode].filter(Boolean).join(", ");
}

/**
 * Geocode an address using the Nominatim API.
 * Returns { latitude, longitude } or null if geocoding fails.
 *
 * @param {string} address - Full address string to geocode
 * @returns {Promise<{ latitude: number, longitude: number } | null>}
 */
export async function geocodeAddress(address) {
  if (!address || address.length < 5) {
    return null;
  }

  const url = new URL(NOMINATIM_BASE);
  url.searchParams.set("q", address);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");

  try {
    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": USER_AGENT
      }
    });

    if (!response.ok) {
      console.warn(`[Geocode] Nominatim returned ${response.status} for "${address}"`);
      return null;
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      console.warn(`[Geocode] No results for "${address}"`);
      return null;
    }

    const result = data[0];
    const latitude = parseFloat(result.lat);
    const longitude = parseFloat(result.lon);

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return null;
    }

    return { latitude, longitude };
  } catch (error) {
    console.warn(`[Geocode] Request failed for "${address}":`, error.message);
    return null;
  }
}

/**
 * Geocode from property address fields (addressLine1, city, postcode).
 * Returns { latitude, longitude } or null.
 *
 * @param {{ addressLine1: string, city: string, postcode: string }} addressFields
 * @returns {Promise<{ latitude: number, longitude: number } | null>}
 */
export async function geocodePropertyAddress(addressFields) {
  const addressString = buildAddressString(addressFields);
  return geocodeAddress(addressString);
}