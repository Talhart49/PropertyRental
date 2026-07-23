"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});

const draggableIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  iconRetinaUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org/search";
const SEARCH_DEBOUNCE_MS = 500;

export default function MapPicker({ latitude, longitude, onCoordinatesChange }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef(null);
  const searchContainerRef = useRef(null);

  // Close search results on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const updateCoordinates = useCallback(
    (lat, lng) => {
      if (onCoordinatesChange) {
        onCoordinatesChange(lat, lng);
      }
    },
    [onCoordinatesChange]
  );

  useEffect(() => {
    if (mapInstanceRef.current) {
      return;
    }

    const initialLat = latitude || 51.5074;
    const initialLng = longitude || -0.1278;

    const map = L.map(mapRef.current, {
      center: [initialLat, initialLng],
      zoom: 13,
      zoomControl: true
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    // Add draggable marker
    const marker = L.marker([initialLat, initialLng], {
      icon: draggableIcon,
      draggable: true
    }).addTo(map);

    marker.bindPopup(
      "<div style='font-family:sans-serif;font-size:13px;'>Drag me to the property location</div>"
    );
    marker.openPopup();

    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      updateCoordinates(pos.lat.toFixed(6), pos.lng.toFixed(6));
    });

    // Click on map to move marker
    map.on("click", (e) => {
      marker.setLatLng(e.latlng);
      updateCoordinates(e.latlng.lat.toFixed(6), e.latlng.lng.toFixed(6));
    });

    markerRef.current = marker;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Update marker position when latitude/longitude props change externally
  useEffect(() => {
    if (markerRef.current && latitude && longitude) {
      const currentPos = markerRef.current.getLatLng();
      if (
        currentPos.lat.toFixed(6) !== String(latitude) &&
        currentPos.lng.toFixed(6) !== String(longitude)
      ) {
        markerRef.current.setLatLng([latitude, longitude]);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 13);
        }
      }
    }
  }, [latitude, longitude]);

  // Geocode search query via Nominatim
  function handleSearchInput(event) {
    const value = event.target.value;
    setSearchQuery(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!value || value.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const url = new URL(NOMINATIM_BASE);
        url.searchParams.set("q", value);
        url.searchParams.set("format", "json");
        url.searchParams.set("limit", "5");

        const response = await fetch(url.toString(), {
          headers: { "User-Agent": "PropertyRentalApp/1.0" }
        });

        if (!response.ok) return;

        const data = await response.json();
        if (Array.isArray(data)) {
          setSearchResults(data);
          setShowResults(data.length > 0);
        }
      } catch {
        // Silently fail
      } finally {
        setIsSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);
  }

  function handleSelectResult(result) {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    if (Number.isNaN(lat) || Number.isNaN(lng)) return;

    setSearchQuery(result.display_name);
    setShowResults(false);

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], 15);
    }
    updateCoordinates(lat.toFixed(6), lng.toFixed(6));
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Address search input */}
      <div className="relative" ref={searchContainerRef}>
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          <input
            className="w-full rounded-md border border-stone-300 bg-white py-2 pl-10 pr-10 text-sm text-stone-900 placeholder-surface-400 outline-none transition-all duration-200 focus:border-teal-600 focus:ring-4 focus:ring-teal-50"
            onChange={handleSearchInput}
            placeholder="Search for an address..."
            type="text"
            value={searchQuery}
          />
          {isSearching ? (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-stone-300 border-t-teal-600" />
            </div>
          ) : null}
        </div>

        {/* Search results dropdown */}
        {showResults && searchResults.length > 0 ? (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-md border border-stone-200 bg-white shadow-lg">
            {searchResults.map((result, index) => (
              <button
                className="w-full px-3 py-2.5 text-left text-sm text-stone-700 transition-colors hover:bg-teal-50 hover:text-teal-900 border-b border-stone-100 last:border-b-0"
                key={index}
                onClick={() => handleSelectResult(result)}
                type="button"
              >
                <span className="line-clamp-2">{result.display_name}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* Map */}
      <div
        className="overflow-hidden rounded-md"
        ref={mapRef}
        style={{ minHeight: "300px", height: "100%", width: "100%", zIndex: 1, isolation: "isolate" }}
      />
    </div>
  );
}
