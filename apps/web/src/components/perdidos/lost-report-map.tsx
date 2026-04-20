"use client";

import { useEffect, useRef } from "react";

interface LostReportMapProps {
  lat: number;
  lng: number;
  label: string;
  /** Radius in meters for the approximate zone circle (default 400m) */
  radiusMeters?: number;
  className?: string;
}

export function LostReportMap({
  lat,
  lng,
  label,
  radiusMeters = 400,
  className,
}: LostReportMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    let cancelled = false;

    async function initMap() {
      const L = (await import("leaflet")).default;

      // Leaflet CSS
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
        link.crossOrigin = "";
        document.head.appendChild(link);
      }

      if (cancelled || !mapRef.current) return;

      const map = L.map(mapRef.current, {
        center: [lat, lng],
        zoom: 15,
        scrollWheelZoom: false,
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Draw approximate zone circle — NOT a pin (privacy)
      // Forest-900 stroke, terracotta fill at low opacity
      L.circle([lat, lng], {
        radius: radiusMeters,
        color: "#1F3C2E",       // forest-900 stroke
        weight: 2,
        opacity: 0.8,
        fillColor: "#C07A5A",   // terracotta-500 fill
        fillOpacity: 0.12,
      })
        .addTo(map)
        .bindPopup(
          `<div style="font-family:sans-serif;min-width:140px">
            <strong style="color:#1A1A18">${label}</strong>
            <br/>
            <span style="font-size:12px;color:#5A5852">
              Zona aproximada (radio ~${radiusMeters}m)
            </span>
          </div>`,
        )
        .openPopup();

      mapInstanceRef.current = map;
    }

    initMap();

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [lat, lng, label, radiusMeters]);

  return (
    <div
      ref={mapRef}
      className={className}
      style={{ minHeight: 280 }}
      role="application"
      aria-label={`Mapa con zona aproximada donde se perdió ${label}`}
    />
  );
}
