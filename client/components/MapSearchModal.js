"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";

// Fix default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});

function boundsToRect(b) {
  if (!b) return null;
  return {
    neLat: b.getNorthEast().lat,
    neLng: b.getNorthEast().lng,
    swLat: b.getSouthWest().lat,
    swLng: b.getSouthWest().lng
  };
}

export default function MapSearchModal({
  open,
  onClose,
  initialBounds,
  onApply
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const drawnItemsRef = useRef(null);
  const currentBoundsRef = useRef(initialBounds);

  // Reset internal bounds whenever modal opens with new initialBounds
  if (open) {
    currentBoundsRef.current = initialBounds;
  }

  // ── Build / rebuild the map inside the modal ──
  useEffect(() => {
    if (!open || !containerRef.current) return;

    // If a map already exists on this container, clean it up first
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      drawnItemsRef.current = null;
    }

    const map = L.map(containerRef.current, {
      center: [51.5074, -0.1278],
      zoom: 12,
      zoomControl: true
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    // Feature group for drawn shapes
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    drawnItemsRef.current = drawnItems;

    // Draw control – stick to rectangle only
    const drawControl = new L.Control.Draw({
      position: "topright",
      draw: {
        polygon: false,
        polyline: false,
        circle: false,
        circlemarker: false,
        marker: false,
        rectangle: true
      },
      edit: {
        featureGroup: drawnItems,
        edit: false,
        remove: true
      }
    });
    map.addControl(drawControl);

    // Restore an existing rectangle if initialBounds is given
    if (initialBounds) {
      const bounds = L.latLngBounds(
        [initialBounds.swLat, initialBounds.swLng],
        [initialBounds.neLat, initialBounds.neLng]
      );
      const rect = L.rectangle(bounds, {
        color: "#7c3aed",
        weight: 2,
        fillOpacity: 0.1
      });
      drawnItems.addLayer(rect);
      map.fitBounds(bounds.pad(0.1));

      // Store so we know it's a "restored" rectangle
      currentBoundsRef.current = initialBounds;
    }

    // ── Rectangle drawn ──
    map.on(L.Draw.Event.CREATED, (event) => {
      const { layer } = event;
      if (event.layerType !== "rectangle") return;
      drawnItems.clearLayers();
      drawnItems.addLayer(layer);
      currentBoundsRef.current = boundsToRect(layer.getBounds());
    });

    // ── Rectangle deleted ──
    map.on(L.Draw.Event.DELETED, () => {
      currentBoundsRef.current = null;
    });

    // Fit the map to the drawn rectangle if it exists
    if (!initialBounds) {
      // Try to fit to a default area after tiles load
      setTimeout(() => map.invalidateSize(), 200);
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      drawnItemsRef.current = null;
    };
    // Only re-create map when modal opens/closes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleApply() {
    onApply(currentBoundsRef.current);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-200 px-6 py-4">
          <h2 className="text-lg font-bold text-surface-900">Search on map</h2>
          <button
            className="rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600"
            onClick={onClose}
            type="button"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Instruction */}
        <div className="bg-brand-50 px-6 py-3 text-sm text-brand-700">
          <span className="inline-flex items-center gap-1.5">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
            </svg>
            Draw a rectangle on the map to search within that area, then click <strong>&ldquo;Apply&rdquo;</strong>.
          </span>
        </div>

        {/* Map */}
        <div className="relative flex-1 p-4">
          <div
            ref={containerRef}
            style={{ width: "100%", height: "420px", borderRadius: "12px", zIndex: 1, isolation: "isolate" }}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-surface-200 px-6 py-4">
          <button
            className="rounded-xl border border-surface-200 bg-white px-5 py-2.5 text-sm font-semibold text-surface-700 shadow-sm transition-all duration-200 hover:bg-surface-50 active:scale-95"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-brand-600 active:scale-95"
            onClick={handleApply}
            type="button"
          >
            <span className="inline-flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Apply
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}