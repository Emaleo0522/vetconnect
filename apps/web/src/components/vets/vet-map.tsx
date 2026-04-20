"use client";

import { useEffect, useRef } from "react";
import type { VetListItem } from "./vet-card";

interface VetMapProps {
  vets: VetListItem[];
  className?: string;
  singleVet?: boolean;
}

export function VetMap({ vets, className, singleVet = false }: VetMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

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

      // Default center: Buenos Aires
      const defaultCenter: [number, number] = [-34.6037, -58.3816];

      // Try to center on user location (list view only)
      let userCenter: [number, number] | null = null;
      if (!singleVet && navigator.geolocation) {
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              userCenter = [pos.coords.latitude, pos.coords.longitude];
              resolve();
            },
            () => resolve(),
            { timeout: 4000 },
          );
        });
      }

      const center =
        singleVet && validVets.length > 0
          ? ([
              Number(validVets[0].latitude),
              Number(validVets[0].longitude),
            ] as [number, number])
          : (userCenter ?? defaultCenter);

      const map = L.map(mapRef.current!, {
        center,
        zoom: singleVet ? 15 : 12,
        scrollWheelZoom: !singleVet,
      });

      // User location marker (list view)
      if (!singleVet && userCenter) {
        const userIcon = L.divIcon({
          html: `<div style="
            width: 14px;
            height: 14px;
            background: var(--terracotta-500, #C07A5A);
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
          "></div>`,
          className: "",
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });
        L.marker(userCenter, { icon: userIcon })
          .addTo(map)
          .bindPopup(
            '<strong style="font-family:sans-serif">Tu ubicación</strong>',
          );
      }

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      for (const vet of validVets) {
        const lat = Number(vet.latitude);
        const lng = Number(vet.longitude);

        // Custom forest icon — NOT default Leaflet blue pin
        const marker = L.marker([lat, lng], { icon: forestIcon }).addTo(map);

        const ratingHtml = vet.avgRating
          ? `<br/><span style="color:#C49A2A;font-size:12px">★ ${vet.avgRating.toFixed(1)} (${vet.reviewCount})</span>`
          : "";

        marker.bindPopup(
          `<div style="min-width:160px;font-family:sans-serif">
            <strong style="color:#1A1A18;font-size:14px">${vet.name}</strong>
            <br/>
            <span style="color:#5A5852;font-size:12px">${vet.clinicName}</span>
            ${ratingHtml}
            ${
              !singleVet
                ? `<br/><a href="/dashboard/vets/${vet.id}" style="color:#1F3C2E;font-size:12px;font-weight:500">Ver perfil →</a>`
                : ""
            }
          </div>`,
        );
      }

      // fitBounds only if no user geolocation reference
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

  return (
    <div
      ref={mapRef}
      className={className}
      style={{ minHeight: singleVet ? 250 : 400 }}
      role="application"
      aria-label="Mapa de veterinarios"
    />
  );
}
