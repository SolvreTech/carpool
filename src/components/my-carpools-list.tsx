"use client";

import { useEffect, useState, useCallback } from "react";
import { DAY_LABELS } from "@/types";
import { formatTime } from "@/lib/utils";
import { getRouteDisplayNames } from "@/lib/routes";
import BlockRiderButton from "./block-rider-button";
import DriverTracking from "./driver-tracking";
import Card from "./ui/card";
import Badge from "./ui/badge";
import Avatar from "./ui/avatar";
import RouteTimeline from "./route-timeline";
import EmptyState from "./ui/empty-state";
import { SkeletonCard } from "./ui/skeleton";

interface Rider {
  bookingId: string;
  riderId: string;
  riderName: string;
  date: string;
  bookedAt: string;
}

interface Carpool {
  id: string;
  route: string;
  customRoute: string | null;
  daysOfWeek: number[];
  time: string;
  totalSeats: number;
  riders: Rider[];
}

export default function MyCarpoolsList({
  refreshKey,
}: {
  refreshKey: number;
}) {
  const [carpools, setCarpools] = useState<Carpool[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCarpools = useCallback(async () => {
    const res = await fetch("/api/my-carpools");
    if (!res.ok) {
      setLoading(false);
      return;
    }
    const data = await res.json();
    setCarpools(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCarpools();
  }, [refreshKey, fetchCarpools]);

  async function handleCancel(id: string) {
    if (!confirm("Delete this carpool schedule? All bookings will be removed."))
      return;

    const res = await fetch(`/api/carpools/${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchCarpools();
    }
  }

  if (loading) return (
    <div className="space-y-3">
      {[1, 2].map((i) => <SkeletonCard key={i} />)}
    </div>
  );

  if (carpools.length === 0)
    return (
      <EmptyState
        icon={
          <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21" />
          </svg>
        }
        title="No carpools yet"
        description="Create your first carpool to get started"
      />
    );

  return (
    <div className="space-y-4">
      {carpools.map((carpool) => {
        const routeNames = getRouteDisplayNames(carpool.route, carpool.customRoute);
        return (
          <Card key={carpool.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                {routeNames ? (
                  <RouteTimeline
                    origin={routeNames.origin}
                    destination={routeNames.destination || undefined}
                  />
                ) : (
                  <h3 className="font-semibold text-text">
                    {carpool.route === "Other" ? carpool.customRoute : carpool.route}
                  </h3>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {carpool.daysOfWeek.map((d) => (
                    <Badge key={d} variant="primary">{DAY_LABELS[d]}</Badge>
                  ))}
                  <Badge variant="secondary">{formatTime(carpool.time)}</Badge>
                  <Badge variant="secondary">
                    {carpool.totalSeats} seat{carpool.totalSeats !== 1 ? "s" : ""}
                  </Badge>
                </div>
              </div>
              <button
                onClick={() => handleCancel(carpool.id)}
                className="shrink-0 rounded-full p-2 text-text-muted hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>

            {/* Tracking toggle */}
            <div className="mt-3 border-t border-border-light pt-3">
              <DriverTracking
                carpoolId={carpool.id}
                routeName={carpool.route === "Other" ? (carpool.customRoute || "Custom") : carpool.route}
              />
            </div>

            {carpool.riders.length > 0 && (
              <div className="mt-4 border-t border-border-light pt-3">
                <p className="mb-2 text-xs font-medium text-text-secondary uppercase tracking-wide">
                  Booked Riders
                </p>
                <div className="space-y-2">
                  {carpool.riders.map((rider) => (
                    <div
                      key={rider.bookingId}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar name={rider.riderName} size="sm" />
                        <div>
                          <span className="text-sm font-medium text-text">
                            {rider.riderName}
                          </span>
                          <span className="ml-2 text-xs text-text-muted">
                            {rider.date}
                          </span>
                        </div>
                      </div>
                      <BlockRiderButton
                        riderId={rider.riderId}
                        riderName={rider.riderName}
                        onBlocked={fetchCarpools}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
