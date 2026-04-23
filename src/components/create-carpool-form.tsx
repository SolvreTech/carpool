"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { DAY_LABELS } from "@/types";
import { fetchDirections } from "@/lib/mapbox";
import { formatDuration, formatDistance } from "@/lib/map-style";
import Button from "./ui/button";
import Input from "./ui/input";
import LocationPicker from "./location-picker";
import RouteMap from "./map/route-map";

interface LocationValue {
  lat: number;
  lng: number;
  name: string;
}

interface SavedRoute {
  id: string;
  name: string;
  originLat: number;
  originLng: number;
  originName: string;
  destinationLat: number;
  destinationLng: number;
  destinationName: string;
  routeGeometry: string | null;
  routeDistance: number | null;
  routeDuration: number | null;
}

export default function CreateCarpoolForm({
  onCreated,
}: {
  onCreated: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [routeName, setRouteName] = useState("");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [origin, setOrigin] = useState<LocationValue | null>(null);
  const [destination, setDestination] = useState<LocationValue | null>(null);
  const [stops, setStops] = useState<LocationValue[]>([]);
  const [routePreview, setRoutePreview] = useState<{
    geometry: string;
    distance: number;
    duration: number;
  } | null>(null);
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const [selectedSavedRouteId, setSelectedSavedRouteId] = useState<string | null>(null);
  const [saveRoute, setSaveRoute] = useState(false);
  const [gasMoneyRequested, setGasMoneyRequested] = useState(false);
  const [gasMoneyAmount, setGasMoneyAmount] = useState<string>("");
  const [includeReturn, setIncludeReturn] = useState(false);
  const [returnTime, setReturnTime] = useState("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [returnPreview, setReturnPreview] = useState<{
    geometry: string;
    distance: number;
    duration: number;
  } | null>(null);
  const debouncePreviewRef = useRef<NodeJS.Timeout | null>(null);
  const debounceReturnRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSavedRoutes = useCallback(async () => {
    try {
      const res = await fetch("/api/saved-routes");
      if (res.ok) {
        const data = await res.json();
        setSavedRoutes(data);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchSavedRoutes();
  }, [fetchSavedRoutes]);

  useEffect(() => {
    if (debouncePreviewRef.current) clearTimeout(debouncePreviewRef.current);
    if (!origin || !destination) {
      setRoutePreview(null);
      return;
    }
    const validStops = stops.filter((s): s is LocationValue => !!s);
    debouncePreviewRef.current = setTimeout(async () => {
      const result = await fetchDirections(origin, destination, validStops);
      if (result) {
        setRoutePreview(result);
      }
    }, 500);
    return () => {
      if (debouncePreviewRef.current) clearTimeout(debouncePreviewRef.current);
    };
  }, [origin, destination, stops]);

  // Fetch return route preview
  useEffect(() => {
    if (debounceReturnRef.current) clearTimeout(debounceReturnRef.current);
    if (!includeReturn || !origin || !destination) {
      setReturnPreview(null);
      return;
    }
    debounceReturnRef.current = setTimeout(async () => {
      const result = await fetchDirections(destination, origin);
      if (result) setReturnPreview(result);
    }, 500);
    return () => {
      if (debounceReturnRef.current) clearTimeout(debounceReturnRef.current);
    };
  }, [includeReturn, origin, destination]);

  function selectSavedRoute(sr: SavedRoute) {
    setSelectedSavedRouteId(sr.id);
    setRouteName(sr.name);
    setOrigin({ lat: sr.originLat, lng: sr.originLng, name: sr.originName });
    setDestination({ lat: sr.destinationLat, lng: sr.destinationLng, name: sr.destinationName });
    if (sr.routeGeometry && sr.routeDistance != null && sr.routeDuration != null) {
      setRoutePreview({ geometry: sr.routeGeometry, distance: sr.routeDistance, duration: sr.routeDuration });
    }
    setSaveRoute(false);
  }

  function selectNewRoute() {
    setSelectedSavedRouteId(null);
    setRouteName("");
    setOrigin(null);
    setDestination(null);
    setStops([]);
    setRoutePreview(null);
    setSaveRoute(false);
    setIncludeReturn(false);
    setReturnTime("");
    setReturnPreview(null);
  }

  function addStop() {
    setStops((s) => [...s, { lat: 0, lng: 0, name: "" }]);
  }
  function updateStop(i: number, loc: LocationValue | null) {
    setStops((s) => {
      const copy = [...s];
      if (loc) copy[i] = loc;
      return copy;
    });
  }
  function removeStop(i: number) {
    setStops((s) => s.filter((_, idx) => idx !== i));
  }

  function toggleDay(day: number) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  }

  async function handleDeleteSavedRoute(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (!confirm("Delete this saved route?")) return;
    const res = await fetch(`/api/saved-routes/${id}`, { method: "DELETE" });
    if (res.ok) {
      setSavedRoutes((prev) => prev.filter((r) => r.id !== id));
      if (selectedSavedRouteId === id) {
        selectNewRoute();
      }
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!routeName.trim()) {
      setError("Enter a route name");
      return;
    }

    if (!origin || !destination) {
      setError("Set both origin and destination");
      return;
    }

    if (selectedDays.length === 0) {
      setError("Select at least one day");
      return;
    }

    if (startDate && endDate && endDate < startDate) {
      setError("End date must be on or after start date");
      return;
    }

    const isMultiDay =
      selectedDays.length > 1 ||
      (!!startDate && !!endDate && endDate > startDate);
    const withReturn = includeReturn && !isMultiDay;

    if (withReturn && !returnTime) {
      setError("Set a return time");
      return;
    }

    let gasMoneyCents: number | null = null;
    if (gasMoneyRequested) {
      const parsed = parseFloat(gasMoneyAmount);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        setError("Enter a gas money amount");
        return;
      }
      gasMoneyCents = Math.round(parsed * 100);
    }

    // Read form data synchronously before any async work
    const formData = new FormData(e.currentTarget);
    const time = formData.get("time") as string;
    const totalSeats = Number(formData.get("totalSeats"));

    setLoading(true);

    // Save route if requested
    if (saveRoute && !selectedSavedRouteId) {
      try {
        await fetch("/api/saved-routes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: routeName.trim(),
            originLat: origin.lat,
            originLng: origin.lng,
            originName: origin.name,
            destinationLat: destination.lat,
            destinationLng: destination.lng,
            destinationName: destination.name,
            routeGeometry: routePreview?.geometry,
            routeDistance: routePreview?.distance,
            routeDuration: routePreview?.duration,
          }),
        });
        fetchSavedRoutes();
      } catch {
        // non-critical
      }
    }

    const res = await fetch("/api/carpools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        route: routeName.trim(),
        daysOfWeek: selectedDays,
        time,
        totalSeats,
        originLat: origin.lat,
        originLng: origin.lng,
        originName: origin.name,
        destinationLat: destination.lat,
        destinationLng: destination.lng,
        destinationName: destination.name,
        stops: stops.filter((s) => s.name).length ? stops.filter((s) => s.name) : null,
        routeGeometry: routePreview?.geometry,
        routeDistance: routePreview?.distance,
        routeDuration: routePreview?.duration,
        gasMoneyRequested,
        gasMoneyAmount: gasMoneyCents,
        startDate: startDate || null,
        endDate: endDate || null,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setLoading(false);
      setError(data.error || "Failed to create carpool");
      return;
    }

    // Create return trip if requested, and link them together
    if (withReturn && returnTime && origin && destination) {
      const returnRes = await fetch("/api/carpools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          route: `${routeName.trim()} (Return)`,
          daysOfWeek: selectedDays,
          time: returnTime,
          totalSeats,
          originLat: destination.lat,
          originLng: destination.lng,
          originName: destination.name,
          destinationLat: origin.lat,
          destinationLng: origin.lng,
          destinationName: origin.name,
          routeGeometry: returnPreview?.geometry,
          routeDistance: returnPreview?.distance,
          routeDuration: returnPreview?.duration,
          gasMoneyRequested,
          gasMoneyAmount: gasMoneyCents,
          startDate: startDate || null,
          endDate: endDate || null,
          returnCarpoolId: data.id,
        }),
      });
      const returnData = await returnRes.json();
      if (returnRes.ok && returnData.id) {
        // Link outbound → return
        await fetch(`/api/carpools/${data.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ returnCarpoolId: returnData.id }),
        });
      }
    }

    setLoading(false);
    (e.target as HTMLFormElement).reset();
    setRouteName("");
    setSelectedDays([]);
    setOrigin(null);
    setDestination(null);
    setStops([]);
    setRoutePreview(null);
    setSelectedSavedRouteId(null);
    setSaveRoute(false);
    setGasMoneyRequested(false);
    setGasMoneyAmount("");
    setIncludeReturn(false);
    setReturnTime("");
    setReturnPreview(null);
    setStartDate("");
    setEndDate("");
    onCreated();
  }

  const isUsingSavedRoute = selectedSavedRouteId !== null;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}

      {/* Route selection */}
      <div>
        <label className="mb-2 block text-sm font-medium text-text-secondary">
          Route
        </label>
        <div className="flex flex-wrap gap-2">
          {savedRoutes.map((sr) => (
            <button
              key={sr.id}
              type="button"
              onClick={() => selectSavedRoute(sr)}
              className={`group relative rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                selectedSavedRouteId === sr.id
                  ? "bg-primary text-white shadow-sm"
                  : "border border-border text-text-secondary hover:bg-primary-50 hover:text-primary"
              }`}
            >
              {sr.name}
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => handleDeleteSavedRoute(e, sr.id)}
                onKeyDown={(e) => { if (e.key === "Enter") handleDeleteSavedRoute(e as unknown as React.MouseEvent, sr.id); }}
                className={`ml-1.5 inline-flex items-center opacity-0 group-hover:opacity-100 transition-opacity ${
                  selectedSavedRouteId === sr.id ? "text-white/70 hover:text-white" : "text-text-muted hover:text-red-500"
                }`}
              >
                &times;
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={selectNewRoute}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              !isUsingSavedRoute
                ? "bg-primary text-white shadow-sm"
                : "border border-border text-text-secondary hover:bg-primary-50 hover:text-primary"
            }`}
          >
            + New Route
          </button>
        </div>
      </div>

      {/* Route name + locations */}
      <div className="space-y-4">
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-sm font-medium text-text-secondary">
              Route Name
            </label>
            {!isUsingSavedRoute && (
              <button
                type="button"
                onClick={() => setSaveRoute(!saveRoute)}
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  saveRoute
                    ? "bg-primary-50 text-primary"
                    : "text-text-muted hover:text-text-secondary"
                }`}
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                </svg>
                {saveRoute ? "Saved" : "Save route"}
              </button>
            )}
          </div>
          <Input
            type="text"
            value={routeName}
            onChange={(e) => setRouteName(e.target.value)}
            placeholder="e.g. To School"
            readOnly={isUsingSavedRoute}
            className={isUsingSavedRoute ? "bg-gray-50" : ""}
          />
        </div>
        <LocationPicker
          label="Origin"
          value={origin}
          onChange={setOrigin}
          placeholder="Search for pickup location..."
          readOnly={isUsingSavedRoute}
        />
        {stops.map((stop, i) => (
          <div key={i} className="flex items-end gap-2">
            <div className="flex-1">
              <LocationPicker
                label={`Stop ${i + 1}`}
                value={stop.name ? stop : null}
                onChange={(loc) => updateStop(i, loc)}
                placeholder="Search for a stop..."
                readOnly={isUsingSavedRoute}
              />
            </div>
            {!isUsingSavedRoute && (
              <button
                type="button"
                onClick={() => removeStop(i)}
                className="mb-1 shrink-0 rounded-full p-2 text-text-muted hover:bg-red-50 hover:text-red-600 transition-colors"
                aria-label={`Remove stop ${i + 1}`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}
        {!isUsingSavedRoute && (
          <button
            type="button"
            onClick={addStop}
            className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-emerald-700 transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add stop
          </button>
        )}
        <LocationPicker
          label="Destination"
          value={destination}
          onChange={setDestination}
          placeholder="Search for drop-off location..."
          readOnly={isUsingSavedRoute}
        />
        {origin && destination && (
          <div>
            <RouteMap
              origin={origin}
              destination={destination}
              routeGeometry={routePreview?.geometry}
              className="h-48"
            />
            {routePreview && (
              <p className="text-xs text-text-muted text-center mt-2">
                {formatDistance(routePreview.distance)} &middot; {formatDuration(routePreview.duration)}
              </p>
            )}
          </div>
        )}
        {origin && destination && (() => {
          const isMultiDay =
            selectedDays.length > 1 ||
            (!!startDate && !!endDate && endDate > startDate);
          return (
          <div className="rounded-xl border border-border p-4 space-y-3">
            <label className={`flex items-center gap-3 ${isMultiDay ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
              <input
                type="checkbox"
                checked={includeReturn && !isMultiDay}
                disabled={isMultiDay}
                onChange={(e) => setIncludeReturn(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary h-4 w-4 disabled:cursor-not-allowed"
              />
              <div>
                <span className="text-sm font-medium text-text">Include return trip</span>
                <p className="text-xs text-text-muted">
                  {isMultiDay
                    ? "Only available on single-day carpools. For multi-day, create a separate return carpool so riders can book each leg independently."
                    : `Creates a second carpool from ${destination.name.split(",")[0]} back to ${origin.name.split(",")[0]}`}
                </p>
              </div>
            </label>
            {includeReturn && !isMultiDay && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                    Return Time
                  </label>
                  <Input
                    type="time"
                    value={returnTime}
                    onChange={(e) => setReturnTime(e.target.value)}
                    required={includeReturn}
                    className="appearance-none min-w-0 block"
                  />
                </div>
                {returnPreview && (
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                    </svg>
                    <span>
                      {destination.name.split(",")[0]} &rarr; {origin.name.split(",")[0]} &middot; {formatDistance(returnPreview.distance)} &middot; {formatDuration(returnPreview.duration)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
          );
        })()}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-text-secondary">
          Repeats on
        </label>
        <div className="flex gap-2">
          {DAY_LABELS.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => toggleDay(i)}
              className={`h-10 w-10 rounded-full text-sm font-medium transition-colors ${
                selectedDays.includes(i)
                  ? "bg-primary text-white shadow-sm"
                  : "border border-border text-text-secondary hover:bg-primary-50 hover:text-primary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-text-secondary">
          Date range
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-text-muted">Start</label>
            <Input
              type="date"
              value={startDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setStartDate(e.target.value)}
              className="appearance-none min-w-0 block"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-text-muted">End (optional)</label>
            <Input
              type="date"
              value={endDate}
              min={startDate || new Date().toISOString().split("T")[0]}
              onChange={(e) => setEndDate(e.target.value)}
              className="appearance-none min-w-0 block"
            />
          </div>
        </div>
        <p className="mt-1.5 text-xs text-text-muted">
          Leave end empty for an open-ended carpool. Pick the same day for both to run once.
        </p>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">
          Time
        </label>
        <Input name="time" type="time" required className="appearance-none min-w-0 block" />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">
          Available Seats
        </label>
        <Input
          name="totalSeats"
          type="number"
          min={1}
          max={10}
          required
          defaultValue={3}
        />
      </div>
      <div className="rounded-xl border border-border p-4 space-y-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={gasMoneyRequested}
            onChange={(e) => setGasMoneyRequested(e.target.checked)}
            className="rounded border-border text-primary focus:ring-primary h-4 w-4"
          />
          <div>
            <span className="text-sm font-medium text-text">Request gas money</span>
            <p className="text-xs text-text-muted">Riders will see the requested amount on the ride</p>
          </div>
        </label>
        {gasMoneyRequested && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">
              Amount per rider
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">$</span>
              <Input
                type="number"
                min={0}
                step={0.5}
                value={gasMoneyAmount}
                onChange={(e) => setGasMoneyAmount(e.target.value)}
                placeholder="5.00"
                required={gasMoneyRequested}
                className="pl-7"
              />
            </div>
          </div>
        )}
      </div>
      <Button type="submit" disabled={loading} className="w-full" size="lg">
        {loading ? "Creating..." : "Create Carpool"}
      </Button>
    </form>
  );
}
