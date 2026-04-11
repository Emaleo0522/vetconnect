import { useRef, useCallback } from "react";
import { View, ActivityIndicator } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { router } from "expo-router";

import { colors } from "@/constants/theme";
import type { VetListItem } from "@/services/vets";

interface VetMapProps {
  vets: VetListItem[];
  userLat: number | null;
  userLng: number | null;
}

function buildMapHtml(
  vets: VetListItem[],
  userLat: number | null,
  userLng: number | null,
): string {
  const centerLat = userLat ?? -34.6037;
  const centerLng = userLng ?? -58.3816;

  const markersJs = vets
    .filter((v) => v.latitude && v.longitude)
    .map((v) => {
      const lat = parseFloat(v.latitude!);
      const lng = parseFloat(v.longitude!);
      const name = v.name.replace(/'/g, "\\'");
      const rating = v.averageRating.toFixed(1);
      const emergency = v.isEmergency24h ? '<br><span style="color:#E53E3E;font-weight:600;">24h Emergency</span>' : "";
      const specialties = v.specialties.slice(0, 2).join(", ").replace(/'/g, "\\'");

      return `
        L.marker([${lat}, ${lng}], { icon: vetIcon })
          .addTo(map)
          .bindPopup('<div style="min-width:150px;"><strong>${name}</strong><br><span style="color:#F5A623;">★ ${rating}</span> (${v.totalReviews})<br><span style="color:#6B7280;font-size:12px;">${specialties}</span>${emergency}<br><a href="#" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type:\\'navigate\\',id:\\'${v.id}\\'}));return false;" style="color:#2B7A9E;font-weight:600;text-decoration:none;">View profile →</a></div>');
      `;
    })
    .join("\n");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; }
    html, body, #map { width: 100%; height: 100%; }
    .leaflet-popup-content-wrapper { border-radius: 12px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      zoomControl: false
    }).setView([${centerLat}, ${centerLng}], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OSM',
      maxZoom: 19
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    var vetIcon = L.divIcon({
      className: 'vet-marker',
      html: '<div style="background:#2B7A9E;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"><svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M19 8h-2V6c0-1.1-.9-2-2-2H9c-1.1 0-2 .9-2 2v2H5c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-8c0-1.1-.9-2-2-2zM9 6h6v2H9V6zm10 12H5v-8h14v8zm-8-6h2v2h2v2h-2v2h-2v-2H9v-2h2v-2z"/></svg></div>',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });

    ${userLat != null ? `
    L.circleMarker([${centerLat}, ${centerLng}], {
      radius: 8,
      fillColor: '#4285F4',
      color: 'white',
      weight: 3,
      fillOpacity: 1
    }).addTo(map).bindPopup('Your location');
    ` : ""}

    ${markersJs}
  </script>
</body>
</html>
  `;
}

export function VetMap({ vets, userLat, userLng }: VetMapProps) {
  const webViewRef = useRef<WebView>(null);

  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "navigate" && data.id) {
        router.push(`/vets/${data.id}` as never);
      }
    } catch {
      // ignore malformed messages
    }
  }, []);

  const html = buildMapHtml(vets, userLat, userLng);

  return (
    <View className="flex-1">
      <WebView
        ref={webViewRef}
        source={{ html }}
        className="flex-1"
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        renderLoading={() => (
          <View className="absolute inset-0 items-center justify-center bg-brand-background">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
        scrollEnabled={false}
        nestedScrollEnabled={false}
      />
    </View>
  );
}
