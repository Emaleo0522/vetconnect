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

      // Fix default marker icon
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const validVets = vets.filter(
        (v) => v.latitude && v.longitude && !isNaN(Number(v.latitude)) && !isNaN(Number(v.longitude)),
      );

      // Default center: Buenos Aires
      const defaultCenter: [number, number] = [-34.6037, -58.3816];
      const center = validVets.length > 0
        ? [Number(validVets[0].latitude), Number(validVets[0].longitude)] as [number, number]
        : defaultCenter;

      const map = L.map(mapRef.current!, {
        center,
        zoom: singleVet ? 15 : 12,
        scrollWheelZoom: !singleVet,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const bounds = L.latLngBounds([]);

      for (const vet of validVets) {
        const lat = Number(vet.latitude);
        const lng = Number(vet.longitude);
        const marker = L.marker([lat, lng]).addTo(map);

        const ratingHtml = vet.avgRating
          ? `<br/><span style="color:#F5A623">★</span> ${vet.avgRating.toFixed(1)} (${vet.reviewCount})`
          : "";

        marker.bindPopup(
          `<div style="min-width:150px">
            <strong>${vet.name}</strong>
            <br/><span style="color:#5A6B7D;font-size:12px">${vet.clinicName}</span>
            ${ratingHtml}
            ${!singleVet ? `<br/><a href="/dashboard/vets/${vet.id}" style="color:#2B7A9E;font-size:12px">Ver perfil →</a>` : ""}
          </div>`,
        );

        bounds.extend([lat, lng]);
      }

      if (validVets.length > 1) {
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
