"use client";

import { useEffect, useState, useCallback } from "react";
import { formatTime } from "@/lib/utils";
import { getRouteDisplayNames } from "@/lib/routes";
import Card from "./ui/card";
import Avatar from "./ui/avatar";
import Badge from "./ui/badge";
import RouteTimeline from "./route-timeline";
import EmptyState from "./ui/empty-state";
import { SkeletonCard } from "./ui/skeleton";

interface Ride {
  bookingId: string;
  carpoolId: string;
  driverName: string;
  route: string;
  customRoute: string | null;
  date: string;
  time: string;
  bookedAt: string;
}

export default function MyRidesList({ refreshKey }: { refreshKey: number }) {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRides = useCallback(async () => {
    const res = await fetch("/api/my-rides");
    if (!res.ok) {
      setLoading(false);
      return;
    }
    const data = await res.json();
    setRides(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRides();
  }, [refreshKey, fetchRides]);

  async function handleCancel(bookingId: string) {
    if (!confirm("Cancel this booking?")) return;

    const res = await fetch(`/api/bookings/${bookingId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      fetchRides();
    }
  }

  if (loading) return (
    <div className="space-y-3">
      {[1, 2].map((i) => <SkeletonCard key={i} />)}
    </div>
  );

  if (rides.length === 0)
    return (
      <EmptyState
        icon={
          <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
        }
        title="No bookings yet"
        description="Search for rides and book a seat"
      />
    );

  return (
    <div className="space-y-3">
      {rides.map((ride) => {
        const routeNames = getRouteDisplayNames(ride.route, ride.customRoute);
        return (
          <Card key={ride.bookingId} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <Avatar name={ride.driverName} size="sm" />
                <div className="min-w-0 flex-1">
                  {routeNames ? (
                    <RouteTimeline
                      origin={routeNames.origin}
                      destination={routeNames.destination || undefined}
                    />
                  ) : (
                    <h3 className="font-semibold text-text">
                      {ride.route === "Other" ? ride.customRoute : ride.route}
                    </h3>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{ride.driverName}</Badge>
                    <Badge variant="secondary">{ride.date}</Badge>
                    <Badge variant="secondary">{formatTime(ride.time)}</Badge>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleCancel(ride.bookingId)}
                className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
