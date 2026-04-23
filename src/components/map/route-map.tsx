"use client";

import { useRef, useEffect, useState } from "react";
import type { RouteCoords } from "@/lib/routes";
import { decodePolyline6 } from "@/lib/mapbox";
import { MAP_STYLE, MAP_COLORS, MAP_DEFAULT_OPTIONS, applyThemeStyle } from "@/lib/map-style";

interface RouteMapProps {
  route?: RouteCoords;
  origin?: { lat: number; lng: number };
  destination?: { lat: number; lng: number };
  routeGeometry?: string | null;
  driverPosition?: { lat: number; lng: number } | null;
  className?: string;
}

export default function RouteMap({
  route,
  origin: originProp,
  destination: destProp,
  routeGeometry,
  driverPosition,
  className = "",
}: RouteMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const driverMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [noToken, setNoToken] = useState(false);

  const origin = originProp || route?.origin;
  const destination = destProp || route?.destination;
  // Destructure to primitive deps so effects don't re-run on every parent re-render
  // (parent often recreates origin/destination object refs when driver position updates).
  const originLat = origin?.lat;
  const originLng = origin?.lng;
  const destLat = destination?.lat;
  const destLng = destination?.lng;
  const driverLat = driverPosition?.lat;
  const driverLng = driverPosition?.lng;

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token || !mapContainer.current || originLat == null || originLng == null || destLat == null || destLng == null) {
      if (!token) setNoToken(true);
      return;
    }

    let canceled = false;
    let map: mapboxgl.Map | undefined;

    async function initMap() {
      const mapboxgl = (await import("mapbox-gl")).default;

      if (canceled || !mapContainer.current) return;

      mapboxgl.accessToken = token!;

      const centerLat = (originLat! + destLat!) / 2;
      const centerLng = (originLng! + destLng!) / 2;

      map = new mapboxgl.Map({
        container: mapContainer.current,
        style: MAP_STYLE,
        center: [centerLng, centerLat],
        zoom: 13,
        ...MAP_DEFAULT_OPTIONS,
      });

      const m = map;
      mapRef.current = m;

      m.on("style.load", () => applyThemeStyle(m));

      m.on("load", () => {
        m.resize();
        // Determine line coordinates and style
        let lineCoords: [number, number][];
        let dashArray: number[] | undefined;

        if (routeGeometry) {
          lineCoords = decodePolyline6(routeGeometry);
          dashArray = undefined; // solid line for real route
        } else {
          lineCoords = [
            [originLng!, originLat!],
            [destLng!, destLat!],
          ];
          dashArray = [2, 1]; // dashed for straight line fallback
        }

        m.addSource("route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: lineCoords,
            },
          },
        });

        const paint: Record<string, unknown> = {
          "line-color": MAP_COLORS.route,
          "line-width": 4,
        };
        if (dashArray) {
          paint["line-dasharray"] = dashArray;
        }

        m.addLayer({
          id: "route-line",
          type: "line",
          source: "route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: paint as mapboxgl.LinePaint,
        });

        // Origin marker (filled green circle)
        const originEl = document.createElement("div");
        originEl.className = "route-marker-origin";
        originEl.style.cssText =
          `width:16px;height:16px;border-radius:50%;background:${MAP_COLORS.markerOrigin};border:3px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.2);`;
        new mapboxgl.Marker(originEl)
          .setLngLat([originLng!, originLat!])
          .addTo(m);

        // Destination marker (outlined green circle)
        const destEl = document.createElement("div");
        destEl.className = "route-marker-dest";
        destEl.style.cssText =
          `width:16px;height:16px;border-radius:50%;background:white;border:3px solid ${MAP_COLORS.markerDestination};box-shadow:0 2px 4px rgba(0,0,0,0.2);`;
        new mapboxgl.Marker(destEl)
          .setLngLat([destLng!, destLat!])
          .addTo(m);

        // Fit bounds using polyline if available
        const bounds = new mapboxgl.LngLatBounds();
        if (routeGeometry && lineCoords.length > 0) {
          for (const coord of lineCoords) {
            bounds.extend(coord);
          }
        } else {
          bounds.extend([originLng!, originLat!]);
          bounds.extend([destLng!, destLat!]);
        }
        m.fitBounds(bounds, { padding: 50 });
      });
    }

    initMap();

    return () => {
      canceled = true;
      map?.remove();
      mapRef.current = null;
      driverMarkerRef.current = null;
    };
  }, [originLat, originLng, destLat, destLng, routeGeometry]);

  // Update driver marker without re-initializing the map
  useEffect(() => {
    if (!mapRef.current || driverLat == null || driverLng == null) return;

    async function updateDriver() {
      const mapboxgl = (await import("mapbox-gl")).default;

      if (driverMarkerRef.current) {
        driverMarkerRef.current.setLngLat([driverLng!, driverLat!]);
      } else {
        const el = document.createElement("div");
        el.style.cssText =
          `width:20px;height:20px;border-radius:50%;background:${MAP_COLORS.markerDriver};border:3px solid white;box-shadow:0 0 0 4px ${MAP_COLORS.markerDriverGlow};`;
        driverMarkerRef.current = new mapboxgl.Marker(el)
          .setLngLat([driverLng!, driverLat!])
          .addTo(mapRef.current!);
      }
    }

    updateDriver();
  }, [driverLat, driverLng]);

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
