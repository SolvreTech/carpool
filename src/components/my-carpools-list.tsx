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
  riderAvatarUrl?: string | null;
  date: string;
  bookedAt: string;
}

interface Carpool {
  id: string;
  route: string;
  originName?: string | null;
  destinationName?: string | null;
  originLat?: number | null;
  originLng?: number | null;
  destinationLat?: number | null;
  destinationLng?: number | null;
  routeGeometry?: string | null;
  routeDistance?: number | null;
  routeDuration?: number | null;
  gasMoneyRequested?: boolean;
  returnCarpoolId?: string | null;
  isActive?: boolean;
  daysOfWeek: number[];
  time: string;
  totalSeats: number;
  seatsLeft: number;
  nextDate: string | null;
  startDate?: string | null;
  endDate?: string | null;
  riders: Rider[];
}

function formatRange(start?: string | null, end?: string | null): string | null {
  if (!start && !end) return null;
  const fmt = (s: string) =>
    new Date(s + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  if (start) return `From ${fmt(start)}`;
  return `Until ${fmt(end!)}`;
}

function CarpoolCard({
  carpool,
  onDelete,
  onRefresh,
  isReturn,
}: {
  carpool: Carpool;
  onDelete: (id: string) => void;
  onRefresh: () => void;
  isReturn?: boolean;
}) {
  const routeNames = getRouteDisplayNames(carpool);

  return (
    <div className={isReturn ? "pt-0" : ""}>
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {isReturn && (
              <svg className="h-4 w-4 text-text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
              </svg>
            )}
            <h3 className="text-sm font-semibold text-text">{carpool.route}</h3>
          </div>
          {routeNames && (
            <RouteTimeline
              origin={routeNames.origin}
              destination={routeNames.destination || undefined}
              distance={carpool.routeDistance}
              duration={carpool.routeDuration}
              className="mt-1"
            />
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {!isReturn && carpool.daysOfWeek.map((d) => (
              <Badge key={d} variant="primary">{DAY_LABELS[d]}</Badge>
            ))}
            <Badge variant="secondary">{formatTime(carpool.time)}</Badge>
            <Badge variant={carpool.seatsLeft === 0 ? "secondary" : "primary"}>
              {carpool.seatsLeft} of {carpool.totalSeats} seat{carpool.totalSeats !== 1 ? "s" : ""} left
            </Badge>
            {formatRange(carpool.startDate, carpool.endDate) && (
              <Badge variant="secondary">{formatRange(carpool.startDate, carpool.endDate)}</Badge>
            )}
          </div>
        </div>
        <button
          onClick={() => onDelete(carpool.id)}
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
          routeName={carpool.route}
          destinationLat={carpool.destinationLat}
          destinationLng={carpool.destinationLng}
          destinationName={carpool.destinationName}
          originLat={carpool.originLat}
          originLng={carpool.originLng}
          routeGeometry={carpool.routeGeometry}
          isActive={carpool.isActive}
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
                  <Avatar name={rider.riderName} imageUrl={rider.riderAvatarUrl} size="sm" />
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
                  onBlocked={onRefresh}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LegSummary({
  carpool,
  label,
  isActive,
  onClick,
}: {
  carpool: Carpool;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
        isActive ? "bg-primary-50/50" : "hover:bg-gray-50"
      }`}
    >
      <div className={`flex h-6 w-6 items-center justify-center rounded-full shrink-0 ${
        isActive ? "bg-primary text-white" : "bg-gray-200 text-text-muted"
      }`}>
        {label === "Outbound" ? (
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        ) : (
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <span className="text-sm font-medium text-text">{carpool.route}</span>
        <span className="ml-2 text-xs text-text-muted">{formatTime(carpool.time)}</span>
      </div>
      {isActive && (
        <span className="text-[10px] font-semibold text-primary uppercase">Viewing</span>
      )}
    </button>
  );
}

function RoundTripCard({
  outbound,
  returnTrip,
  onDelete,
  onRefresh,
}: {
  outbound: Carpool;
  returnTrip: Carpool;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}) {
  const [activeLeg, setActiveLeg] = useState<"outbound" | "return">("outbound");
  const activeCarpool = activeLeg === "outbound" ? outbound : returnTrip;

  return (
    <div className="relative">
      {/* Round trip label */}
      <div className="mb-1.5 flex items-center gap-1.5">
        <svg className="h-3.5 w-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
        </svg>
        <span className="text-xs font-semibold text-primary">Round Trip</span>
      </div>

      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        {/* Leg tabs */}
        <div className="divide-y divide-border-light">
          <LegSummary
            carpool={outbound}
            label="Outbound"
            isActive={activeLeg === "outbound"}
            onClick={() => setActiveLeg("outbound")}
          />
          <LegSummary
            carpool={returnTrip}
            label="Return"
            isActive={activeLeg === "return"}
            onClick={() => setActiveLeg("return")}
          />
        </div>

        {/* Expanded content for selected leg */}
        <div className="border-t border-border p-4">
          <CarpoolCard
            carpool={activeCarpool}
            onDelete={onDelete}
            onRefresh={onRefresh}
            isReturn={activeLeg === "return"}
          />
        </div>
      </div>
    </div>
  );
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

  // Group outbound + return pairs, track which IDs we've rendered
  const renderedIds = new Set<string>();

  return (
    <div className="space-y-4">
      {carpools.map((carpool) => {
        if (renderedIds.has(carpool.id)) return null;
        renderedIds.add(carpool.id);

        // Find the linked return trip
        const returnCarpool = carpool.returnCarpoolId
          ? carpools.find((c) => c.id === carpool.returnCarpoolId)
          : null;

        if (returnCarpool) {
          renderedIds.add(returnCarpool.id);
        }

        if (returnCarpool) {
          return (
            <RoundTripCard
              key={carpool.id}
              outbound={carpool}
              returnTrip={returnCarpool}
              onDelete={handleCancel}
              onRefresh={fetchCarpools}
            />
          );
        }

        return (
          <Card key={carpool.id} className="p-4">
            <CarpoolCard
              carpool={carpool}
              onDelete={handleCancel}
              onRefresh={fetchCarpools}
            />
          </Card>
        );
      })}
    </div>
  );
}
