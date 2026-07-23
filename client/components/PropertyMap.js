"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";
import { formatRent, imageUrl } from "../lib/properties";

// Fix default marker icons for Leaflet + Webpack/Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});

const singleMarkerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const purpleIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png",
  iconRetinaUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

/**
 * Extracts bounds object { neLat, neLng, swLat, swLng } from a Leaflet
 * LatLngBounds, or returns null.
 */
function boundsToRect(b) {
  if (!b) return null;
  return {
    neLat: b.getNorthEast().lat,
    neLng: b.getNorthEast().lng,
    swLat: b.getSouthWest().lat,
    swLng: b.getSouthWest().lng
  };
}

export default function PropertyMap({
  className = "",
  properties = [],
  center,
  zoom = 13,
  singleProperty = false,
  onPropertyClick,
  /* ---- map-based search props ---- */
  searchOnMap = false,         // enable drawing a bounding box
  activeBounds = null,         // current bounding box { neLat, neLng, swLat, swLng }
  onBoundsChange = null       // called when bounds are drawn / cleared
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const drawnItemsRef = useRef(null);
  const drawControlRef = useRef(null);
  const boundsInitRef = useRef(false);

  // ------ Initialise map (once) ------
  useEffect(() => {
    if (mapInstanceRef.current) return;

    let defaultCenter = center;
    if (!defaultCenter && properties.length > 0) {
      const firstWithCoords = properties.find(
        (p) => p.latitude && p.longitude
      );
      if (firstWithCoords) {
        defaultCenter = [firstWithCoords.latitude, firstWithCoords.longitude];
      }
    }
    if (!defaultCenter) {
      defaultCenter = [51.5074, -0.1278]; // London
    }

    const map = L.map(mapRef.current, {
      center: defaultCenter,
      zoom,
      zoomControl: true
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    mapInstanceRef.current = map;

    // ---- Leaflet Draw setup ----
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    drawnItemsRef.current = drawnItems;

    const drawControl = new L.Control.Draw({
      position: "topright",
      draw: {
        polygon: false,
        polyline: false,
        circle: false,
        circlemarker: false,
        marker: false,
        rectangle: searchOnMap  // enabled only when prop says so
      },
      edit: {
        featureGroup: drawnItems,
        edit: false,
        remove: true
      }
    });
    map.addControl(drawControl);
    drawControlRef.current = drawControl;

    // When a rectangle is created
    map.on(L.Draw.Event.CREATED, (event) => {
      const { layer } = event;
      if (event.layerType !== "rectangle") return;

      // Remove any existing drawn layers first
      drawnItems.clearLayers();
      drawnItems.addLayer(layer);

      if (onBoundsChange) {
        onBoundsChange(boundsToRect(layer.getBounds()));
      }
    });

    // When a drawn layer is deleted
    map.on(L.Draw.Event.DELETED, () => {
      if (onBoundsChange) {
        onBoundsChange(null);
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersRef.current = [];
      drawnItemsRef.current = null;
      drawControlRef.current = null;
    };
    // Intentionally run once – props are handled in other effects
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------ Sync searchOnMap prop to draw control ------
  useEffect(() => {
    const map = mapInstanceRef.current;
    const drawControl = drawControlRef.current;
    if (!map || !drawControl) return;

    // We need to rebuild the draw control because Leaflet Draw doesn't
    // support runtime toggling of toolbar buttons.  Instead we remove &
    // re-add the control.
    map.removeControl(drawControl);

    const drawnItems = drawnItemsRef.current;

    const newControl = new L.Control.Draw({
      position: "topright",
      draw: {
        polygon: false,
        polyline: false,
        circle: false,
        circlemarker: false,
        marker: false,
        rectangle: searchOnMap
      },
      edit: {
        featureGroup: drawnItems,
        edit: false,
        remove: true
      }
    });
    map.addControl(newControl);
    drawControlRef.current = newControl;
  }, [searchOnMap]);

  // ------ Sync activeBounds to the drawn rectangle ------
  useEffect(() => {
    const drawnItems = drawnItemsRef.current;
    const map = mapInstanceRef.current;
    if (!drawnItems || !map) return;

    drawnItems.clearLayers();

    if (activeBounds) {
      const bounds = L.latLngBounds(
        [activeBounds.swLat, activeBounds.swLng],
        [activeBounds.neLat, activeBounds.neLng]
      );
      const rect = L.rectangle(bounds, {
        color: "#7c3aed",
        weight: 2,
        fillOpacity: 0.1
      });
      drawnItems.addLayer(rect);
      map.fitBounds(bounds.pad(0.1));
    }
    boundsInitRef.current = true;
  }, [activeBounds]);

  // ------ Update center when center prop changes ------
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setView(center, zoom);
    }
  }, [center, zoom]);

  // ------ Update markers when properties change ------
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    const withCoords = properties.filter(
      (p) => p.latitude && p.longitude
    );

    if (withCoords.length === 0) return;

    const icon = singleProperty ? singleMarkerIcon : purpleIcon;

    withCoords.forEach((property) => {
      const marker = L.marker([property.latitude, property.longitude], {
        icon
      }).addTo(map);

      const bedText = `${property.bedrooms} bed${property.bedrooms === 1 ? "" : "s"}`;
      const bathText = `${property.bathrooms} bath${property.bathrooms === 1 ? "" : "s"}`;

      marker.bindPopup(
        `
        <div style="font-family:sans-serif;max-width:220px;line-height:1.4;">
          <strong style="font-size:14px;">${property.title}</strong>
          <p style="margin:4px 0 0;font-size:13px;color:#555;">
            ${property.addressLine1}, ${property.city}
          </p>
          <p style="margin:4px 0 0;font-size:13px;color:#333;">
            <strong>${formatRent(property.pricePerMonth)}</strong> &middot; ${bedText} &middot; ${bathText}
          </p>
          ${property.images?.[0] ? `<img src="${imageUrl(property.images[0])}" alt="" style="width:100%;height:100px;object-fit:cover;border-radius:4px;margin-top:6px;" />` : ""}
        </div>
        `
      );

      if (singleProperty) {
        marker.openPopup();
      }

      if (onPropertyClick) {
        marker.on("click", () => onPropertyClick(property));
      }

      markersRef.current.push(marker);
    });

    // Fit bounds if multiple properties AND no active bounding box drawn
    if (withCoords.length > 1 && !activeBounds) {
      const group = L.featureGroup(markersRef.current);
      map.fitBounds(group.getBounds().pad(0.1));
    }
  }, [properties, singleProperty, onPropertyClick, activeBounds]);

  return (
    <div
      className={`overflow-hidden rounded-md ${className}`}
      ref={mapRef}
      style={{ minHeight: "250px", height: "100%", width: "100%", zIndex: 1, isolation: "isolate" }}
    />
  );
}