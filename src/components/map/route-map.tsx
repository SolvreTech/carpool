"use client";

import { useRef, useEffect, useState } from "react";
import type { RouteCoords } from "@/lib/routes";

interface RouteMapProps {
  route: RouteCoords;
  driverPosition?: { lat: number; lng: number } | null;
  className?: string;
}

export default function RouteMap({ route, driverPosition, className = "" }: RouteMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const driverMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [noToken, setNoToken] = useState(false);

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token || !mapContainer.current) {
      setNoToken(true);
      return;
    }

    let map: mapboxgl.Map;

    async function initMap() {
      const mapboxgl = (await import("mapbox-gl")).default;

      mapboxgl.accessToken = token!;

      const centerLat = (route.origin.lat + route.destination.lat) / 2;
      const centerLng = (route.origin.lng + route.destination.lng) / 2;

      map = new mapboxgl.Map({
        container: mapContainer.current!,
        style: "mapbox://styles/mapbox/light-v11",
        center: [centerLng, centerLat],
        zoom: 13,
        attributionControl: false,
      });

      mapRef.current = map;

      map.on("load", () => {
        // Green route line
        map.addSource("route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: [
                [route.origin.lng, route.origin.lat],
                [route.destination.lng, route.destination.lat],
              ],
            },
          },
        });

        map.addLayer({
          id: "route-line",
          type: "line",
          source: "route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#059669",
            "line-width": 4,
            "line-dasharray": [2, 1],
          },
        });

        // Origin marker (filled green circle)
        const originEl = document.createElement("div");
        originEl.className = "route-marker-origin";
        originEl.style.cssText =
          "width:16px;height:16px;border-radius:50%;background:#059669;border:3px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.2);";
        new mapboxgl.Marker(originEl)
          .setLngLat([route.origin.lng, route.origin.lat])
          .addTo(map);

        // Destination marker (outlined green circle)
        const destEl = document.createElement("div");
        destEl.className = "route-marker-dest";
        destEl.style.cssText =
          "width:16px;height:16px;border-radius:50%;background:white;border:3px solid #059669;box-shadow:0 2px 4px rgba(0,0,0,0.2);";
        new mapboxgl.Marker(destEl)
          .setLngLat([route.destination.lng, route.destination.lat])
          .addTo(map);

        // Fit bounds
        const bounds = new mapboxgl.LngLatBounds()
          .extend([route.origin.lng, route.origin.lat])
          .extend([route.destination.lng, route.destination.lat]);
        map.fitBounds(bounds, { padding: 50 });
      });
    }

    initMap();

    return () => {
      map?.remove();
      mapRef.current = null;
    };
  }, [route]);

  // Update driver marker
  useEffect(() => {
    if (!mapRef.current || !driverPosition) return;

    async function updateDriver() {
      const mapboxgl = (await import("mapbox-gl")).default;

      if (driverMarkerRef.current) {
        driverMarkerRef.current.setLngLat([driverPosition!.lng, driverPosition!.lat]);
      } else {
        const el = document.createElement("div");
        el.style.cssText =
          "width:20px;height:20px;border-radius:50%;background:#059669;border:3px solid white;box-shadow:0 0 0 4px rgba(5,150,105,0.3);";
        driverMarkerRef.current = new mapboxgl.Marker(el)
          .setLngLat([driverPosition!.lng, driverPosition!.lat])
          .addTo(mapRef.current!);
      }
    }

    updateDriver();
  }, [driverPosition]);

  if (noToken) {
    return (
      <div className={`flex items-center justify-center rounded-2xl bg-primary-50 ${className}`}>
        <div className="text-center p-6">
          <div className="mb-2 text-primary">
            <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
            </svg>
          </div>
          <p className="text-sm text-primary font-medium">Map Preview</p>
          <p className="text-xs text-text-muted mt-1">Set NEXT_PUBLIC_MAPBOX_TOKEN to enable</p>
        </div>
      </div>
    );
  }

  return <div ref={mapContainer} className={`rounded-2xl overflow-hidden ${className}`} />;
}
