"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Button from "./ui/button";

interface DriverTrackingProps {
  carpoolId: string;
  routeName: string;
}

export default function DriverTracking({ carpoolId, routeName }: DriverTrackingProps) {
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const sendLocation = useCallback(
    async (position: GeolocationPosition) => {
      try {
        await fetch("/api/tracking/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            carpoolId,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            heading: position.coords.heading,
          }),
        });
      } catch {
        // Silently fail - next update will try again
      }
    },
    [carpoolId]
  );

  const startTracking = useCallback(async () => {
    setLoading(true);
    setError("");

    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      setLoading(false);
      return;
    }

    try {
      // Start trip on server
      const res = await fetch("/api/tracking/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carpoolId }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to start trip");
        setLoading(false);
        return;
      }

      // Watch position
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => sendLocation(pos),
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            setError("Location permission denied. Please allow location access.");
            stopTracking();
          }
        },
        { enableHighAccuracy: true, maximumAge: 5000 }
      );

      // Also send location every 5s as backup
      intervalRef.current = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          (pos) => sendLocation(pos),
          () => {},
          { enableHighAccuracy: true, maximumAge: 5000 }
        );
      }, 5000);

      setActive(true);
    } catch {
      setError("Failed to start tracking");
    }
    setLoading(false);
  }, [carpoolId, sendLocation]);

  const stopTracking = useCallback(async () => {
    setLoading(true);

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    try {
      await fetch("/api/tracking/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carpoolId }),
      });
    } catch {
      // ignore
    }

    setActive(false);
    setLoading(false);
  }, [carpoolId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="flex items-center gap-3">
      {active && (
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
          </span>
          <span className="text-xs font-medium text-primary">Live</span>
        </div>
      )}
      <Button
        variant={active ? "danger" : "primary"}
        size="sm"
        onClick={active ? stopTracking : startTracking}
        disabled={loading}
      >
        {loading
          ? "..."
          : active
            ? "End Trip"
            : "Start Trip"}
      </Button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
