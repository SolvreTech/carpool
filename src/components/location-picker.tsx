"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Input from "./ui/input";
import { MAP_STYLE, MAP_DEFAULT_OPTIONS, applyThemeStyle } from "@/lib/map-style";

interface LocationValue {
  lat: number;
  lng: number;
  name: string;
}

interface LocationPickerProps {
  label: string;
  value: LocationValue | null;
  onChange: (location: LocationValue | null) => void;
  placeholder?: string;
  readOnly?: boolean;
}

interface Suggestion {
  mapbox_id: string;
  name: string;
  name_preferred?: string;
  feature_type: string;
  address?: string;
  full_address?: string;
  place_formatted?: string;
}

// Shared user location — resolved once, reused across all LocationPicker instances
let userLocationPromise: Promise<[number, number]> | null = null;

function getUserLocation(): Promise<[number, number]> {
  if (!userLocationPromise) {
    userLocationPromise = new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve([0, 0]);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve([pos.coords.longitude, pos.coords.latitude]),
        () => resolve([0, 0]),
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
      );
    });
  }
  return userLocationPromise;
}

export default function LocationPicker({
  label,
  value,
  onChange,
  placeholder = "Search for a location...",
  readOnly = false,
}: LocationPickerProps) {
  const [query, setQuery] = useState(value?.name || "");
  const [subText, setSubText] = useState<string>("");
  const [results, setResults] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  // Search Box sessions group suggest+retrieve calls for billing.
  const sessionTokenRef = useRef<string>(
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)
  );

  // Resolve user location once on mount
  useEffect(() => {
    getUserLocation().then(setUserLoc);
  }, []);

  // Sync query text when value changes externally
  useEffect(() => {
    setQuery(value?.name || "");
  }, [value?.name]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const searchLocations = useCallback(async (text: string) => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token || text.length < 2) {
      setResults([]);
      return;
    }

    const loc = await getUserLocation();
    const proximityParam =
      loc[0] !== 0 || loc[1] !== 0
        ? `&proximity=${loc[0]},${loc[1]}`
        : "&proximity=ip";

    try {
      // Search Box API has far better POI coverage than v5 places
      // (schools, businesses, landmarks). country=us keeps us out
      // of matches like "Pleasant Grove, Australia".
      const url =
        `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(text)}` +
        `&limit=8` +
        `&country=us` +
        `&language=en` +
        `&types=poi,address,place,locality,neighborhood,street` +
        proximityParam +
        `&session_token=${sessionTokenRef.current}` +
        `&access_token=${token}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      setResults(data.suggestions || []);
      setShowDropdown(true);
    } catch {
      // ignore
    }
  }, []);

  function handleInputChange(text: string) {
    setQuery(text);
    setSubText("");
    if (readOnly) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchLocations(text), 300);
  }

  async function selectResult(result: Suggestion) {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;

    // Preserve the POI name as the primary label; show address as subtext.
    const displayName = result.name;
    const addressSub =
      result.full_address && result.full_address !== result.name
        ? result.full_address
        : result.place_formatted && result.place_formatted !== result.name
          ? result.place_formatted
          : result.address && result.address !== result.name
            ? result.address
            : "";

    try {
      const res = await fetch(
        `https://api.mapbox.com/search/searchbox/v1/retrieve/${encodeURIComponent(result.mapbox_id)}?session_token=${sessionTokenRef.current}&access_token=${token}`
      );
      if (!res.ok) return;
      const data = await res.json();
      const feature = data.features?.[0];
      const coords = feature?.geometry?.coordinates as [number, number] | undefined;
      if (!coords) return;

      const location: LocationValue = {
        lng: coords[0],
        lat: coords[1],
        name: displayName,
      };
      onChange(location);
      setQuery(displayName);
      setSubText(addressSub);
      setShowDropdown(false);
      // Rotate session token for billing correctness on next search.
      sessionTokenRef.current =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2);

      if (mapRef.current && markerRef.current) {
        markerRef.current.setLngLat([location.lng, location.lat]);
        mapRef.current.flyTo({ center: [location.lng, location.lat], zoom: 15 });
      }
    } catch {
      // ignore
    }
  }

  // Init map for "pick on map"
  useEffect(() => {
    if (!showMap || !mapContainerRef.current || !userLoc) return;
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;

    let canceled = false;
    let map: mapboxgl.Map | undefined;

    async function initMap() {
      const mapboxgl = (await import("mapbox-gl")).default;

      if (canceled || !mapContainerRef.current) return;

      mapboxgl.accessToken = token!;

      const center: [number, number] = value
        ? [value.lng, value.lat]
        : userLoc!;

      map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: MAP_STYLE,
        center,
        zoom: value ? 15 : 10,
        ...MAP_DEFAULT_OPTIONS,
      });

      mapRef.current = map;

      map.on("style.load", () => applyThemeStyle(map!));
      map.once("load", () => map!.resize());

      const marker = new mapboxgl.Marker({ draggable: true })
        .setLngLat(center)
        .addTo(map);
      markerRef.current = marker;

      async function reverseGeocode(lng: number, lat: number) {
        try {
          const res = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}`
          );
          if (!res.ok) return;
          const data = await res.json();
          const feature = data.features?.[0];
          const primary = feature?.text || feature?.place_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          const address: string = feature?.place_name && feature?.place_name !== primary ? feature.place_name : "";
          onChange({ lat, lng, name: primary });
          setQuery(primary);
          setSubText(address);
        } catch {
          const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          onChange({ lat, lng, name: fallback });
          setQuery(fallback);
          setSubText("");
        }
      }

      marker.on("dragend", () => {
        const lngLat = marker.getLngLat();
        reverseGeocode(lngLat.lng, lngLat.lat);
      });

      map.on("click", (e) => {
        marker.setLngLat(e.lngLat);
        reverseGeocode(e.lngLat.lng, e.lngLat.lat);
      });
    }

    initMap();
    return () => {
      canceled = true;
      map?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMap, userLoc]);

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-1.5 block text-sm font-medium text-text-secondary">
        {label}
      </label>
      <div className="relative">
        <Input
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => { if (results.length > 0 && !readOnly) setShowDropdown(true); }}
          placeholder={placeholder}
          readOnly={readOnly}
          className={readOnly ? "bg-gray-50" : ""}
        />
        {!readOnly && (
          <button
            type="button"
            onClick={() => setShowMap(!showMap)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-text-muted hover:text-primary hover:bg-primary-50 transition-colors"
            title={showMap ? "Hide map" : "Pick on map"}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          </button>
        )}
      </div>
      {subText && (
        <p className="mt-1 text-xs text-text-muted truncate">{subText}</p>
      )}

      {/* Autocomplete dropdown */}
      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-white shadow-lg overflow-hidden">
          {results.map((r) => (
            <button
              key={r.mapbox_id}
              type="button"
              onClick={() => selectResult(r)}
              className="w-full px-4 py-3 text-left text-sm hover:bg-primary-50 transition-colors border-b border-border-light last:border-0"
            >
              <span className="font-medium text-text">{r.name}</span>
              <span className="block text-xs text-text-muted truncate">
                {r.full_address || r.place_formatted || r.address || ""}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Inline map */}
      {showMap && !readOnly && (
        <div
          ref={mapContainerRef}
          className="mt-2 h-48 rounded-2xl overflow-hidden border border-border"
        />
      )}
    </div>
  );
}
