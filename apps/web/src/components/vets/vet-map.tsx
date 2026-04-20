"use client";

import { useEffect, useRef, useState } from "react";
import type { VetListItem } from "./vet-card";

interface VetMapProps {
  vets: VetListItem[];
  className?: string;
  singleVet?: boolean;
}

// Default center: Buenos Aires
const DEFAULT_CENTER: [number, number] = [-34.6037, -58.3816];
const DEFAULT_ZOOM = 11;

export function VetMap({ vets, className, singleVet = false }: VetMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const [geoDenied, setGeoDenied] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  useEffect(() => {
    if (!mapRef.current) return;
    if (mapInstanceRef.current) return;

    let cancelled = false;

    async function initMap() {
      const L = (await import("leaflet")).default;

      // Import leaflet CSS
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
        link.crossOrigin = "";
        document.head.appendChild(link);
      }

      if (cancelled || !mapRef.current) return;

      // Custom forest-900 icon — NO default Leaflet blue pin
      const forestIcon = L.divIcon({
        html: `<div style="
          width: 28px;
          height: 28px;
          background: #1F3C2E;
          border: 3px solid #F5EFE0;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 2px 6px rgba(0,0,0,0.35);
        "></div>`,
        className: "",
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -30],
      });

      const validVets = vets.filter(
        (v) =>
          v.latitude &&
          v.longitude &&
          !isNaN(Number(v.latitude)) &&
          !isNaN(Number(v.longitude)),
      );

      // Try to center on user location (list view only)
      let userCenter: [number, number] | null = null;
      if (!singleVet && navigator.geolocation) {
        setGeoLoading(true);
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              userCenter = [pos.coords.latitude, pos.coords.longitude];
              setGeoLoading(false);
              resolve();
            },
            (err) => {
              if (err.code === err.PERMISSION_DENIED) {
                setGeoDenied(true);
              }
              setGeoLoading(false);
              resolve();
            },
            { timeout: 6000, enableHighAccuracy: false },
          );
        });
      }

      if (cancelled || !mapRef.current) return;

      const center =
        singleVet && validVets.length > 0
          ? ([
              Number(validVets[0].latitude),
              Number(validVets[0].longitude),
            ] as [number, number])
          : (userCenter ?? DEFAULT_CENTER);

      const map = L.map(mapRef.current!, {
        center,
        zoom: singleVet ? 15 : userCenter ? 13 : DEFAULT_ZOOM,
        scrollWheelZoom: !singleVet,
      });

      const userIcon = L.divIcon({
        html: `<div style="
          width: 14px;
          height: 14px;
          background: #C07A5A;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        "></div>`,
        className: "",
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      // User location marker (list view)
      if (!singleVet && userCenter) {
        const marker = L.marker(userCenter, { icon: userIcon })
          .addTo(map)
          .bindPopup('<strong style="font-family:sans-serif">Tu ubicacion</strong>');
        userMarkerRef.current = marker;
      }

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      for (const vet of validVets) {
        const lat = Number(vet.latitude);
        const lng = Number(vet.longitude);

        const marker = L.marker([lat, lng], { icon: forestIcon }).addTo(map);

        const ratingHtml = vet.avgRating
          ? `<br/><span style="color:#C49A2A;font-size:12px">&#9733; ${vet.avgRating.toFixed(1)} (${vet.reviewCount})</span>`
          : "";

        marker.bindPopup(
          `<div style="min-width:160px;font-family:sans-serif">
            <strong style="color:#1A1A18;font-size:14px">${vet.name}</strong>
            <br/>
            <span style="color:#5A5852;font-size:12px">${vet.clinicName}</span>
            ${ratingHtml}
            ${
              !singleVet
                ? `<br/><a href="/dashboard/veterinarios/${vet.id}" style="color:#1F3C2E;font-size:12px;font-weight:500">Ver perfil &#8594;</a>`
                : ""
            }
          </div>`,
        );
      }

      // fitBounds only if no user geolocation reference and multiple vets
      if (!singleVet && !userCenter && validVets.length > 1) {
        const bounds = L.latLngBounds(
          validVets.map(
            (v) => [Number(v.latitude), Number(v.longitude)] as [number, number],
          ),
        );
        map.fitBounds(bounds, { padding: [40, 40] });
      }

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
  }, [vets, singleVet]);

  // Recenter on user location (retry button)
  async function handleRecenter() {
    if (!mapInstanceRef.current || !navigator.geolocation) return;
    setGeoLoading(true);
    setGeoDenied(false);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const L = (await import("leaflet")).default;
        const map = mapInstanceRef.current;
        if (!map) { setGeoLoading(false); return; }

        const userCoords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        map.setView(userCoords, 13);

        // Remove old user marker, add new one
        if (userMarkerRef.current) {
          userMarkerRef.current.remove();
        }
        const userIcon = L.divIcon({
          html: `<div style="
            width: 14px;
            height: 14px;
            background: #C07A5A;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
          "></div>`,
          className: "",
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });
        userMarkerRef.current = L.marker(userCoords, { icon: userIcon })
          .addTo(map)
          .bindPopup('<strong style="font-family:sans-serif">Tu ubicacion</strong>');

        setGeoLoading(false);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setGeoDenied(true);
        setGeoLoading(false);
      },
      { timeout: 8000, enableHighAccuracy: false },
    );
  }

  return (
    <div className="relative">
      <div
        ref={mapRef}
        className={className}
        style={{ minHeight: singleVet ? 250 : 400 }}
        role="application"
        aria-label="Mapa de veterinarios"
      />
      {/* Geolocation button — list view only */}
      {!singleVet && (
        <button
          type="button"
          onClick={handleRecenter}
          disabled={geoLoading}
          title={geoDenied ? "Permiso denegado — revisar configuracion del navegador" : "Centrar en mi ubicacion"}
          aria-label="Centrar mapa en mi ubicacion"
          className="absolute bottom-4 right-4 z-[1000] flex h-9 w-9 items-center justify-center rounded-full shadow-md transition-colors disabled:opacity-50"
          style={{
            background: geoDenied ? "#f5efe0" : "#1F3C2E",
            color: geoDenied ? "#7A6A5A" : "#F5EFE0",
            border: "2px solid rgba(255,255,255,0.9)",
          }}
        >
          {geoLoading ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
              <path d="M12 8a4 4 0 1 0 4 4" />
            </svg>
          )}
        </button>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
