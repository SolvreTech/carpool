"use client";

import { useState, useEffect, useCallback } from "react";
import {
  formatTime,
  getMonday,
  toDateString,
  getWeekDates,
  formatShortDate,
} from "@/lib/utils";
import SetPageHeader from "@/components/set-page-header";
import Card from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Avatar from "@/components/ui/avatar";
import RouteTimeline from "@/components/route-timeline";
import EmptyState from "@/components/ui/empty-state";
import { SkeletonCard } from "@/components/ui/skeleton";

interface BookedRide {
  bookingId: string;
  carpoolId: string;
  driverId: string;
  driverName: string;
  driverAvatarUrl?: string | null;
  route: string;
  date: string;
  time: string;
  originName?: string | null;
  destinationName?: string | null;
  routeDistance?: number | null;
  routeDuration?: number | null;
  gasMoneyRequested?: boolean;
  returnCarpoolId?: string | null;
  totalSeats: number;
}

type WeekData = Record<string, BookedRide[]>;

function RideCard({
  ride,
  isPast,
  cancellingId,
  onCancel,
}: {
  ride: BookedRide;
  isPast: boolean;
  cancellingId: string | null;
  onCancel: (id: string) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0">
        <Avatar name={ride.driverName} imageUrl={ride.driverAvatarUrl} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-text truncate">{ride.driverName}</span>
            <Badge variant="secondary">{formatTime(ride.time)}</Badge>
          </div>
          <p className="text-xs text-text-muted">{ride.route}</p>
          {ride.originName && (
            <RouteTimeline
              origin={ride.originName}
              destination={ride.destinationName || undefined}
              distance={ride.routeDistance}
              duration={ride.routeDuration}
              className="mt-1"
            />
          )}
          {ride.gasMoneyRequested && (
            <div className="mt-2">
              <span className="rounded-full bg-yellow-100 text-yellow-800 px-2 py-0.5 text-xs font-medium">$ Gas</span>
            </div>
          )}
        </div>
      </div>
      {!isPast && (
        <button
          onClick={() => onCancel(ride.bookingId)}
          disabled={cancellingId === ride.bookingId}
          className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          {cancellingId === ride.bookingId ? "..." : "Cancel"}
        </button>
      )}
    </div>
  );
}

function RoundTripRideCard({
  outbound,
  returnRide,
  isPast,
  cancellingId,
  onCancel,
}: {
  outbound: BookedRide;
  returnRide: BookedRide;
  isPast: boolean;
  cancellingId: string | null;
  onCancel: (id: string) => void;
}) {
  const [activeLeg, setActiveLeg] = useState<"outbound" | "return">("outbound");
  const activeRide = activeLeg === "outbound" ? outbound : returnRide;

  return (
    <div className={isPast ? "opacity-50" : ""}>
      <div className="mb-1 flex items-center gap-1.5">
        <svg className="h-3.5 w-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
        </svg>
        <span className="text-xs font-semibold text-primary">Round Trip</span>
      </div>

      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        {/* Leg tabs */}
        <div className="divide-y divide-border-light">
          {/* Outbound tab */}
          <button
            type="button"
            onClick={() => setActiveLeg("outbound")}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
              activeLeg === "outbound" ? "bg-primary-50/50" : "hover:bg-gray-50"
            }`}
          >
            <div className={`flex h-6 w-6 items-center justify-center rounded-full shrink-0 ${
              activeLeg === "outbound" ? "bg-primary text-white" : "bg-gray-200 text-text-muted"
            }`}>
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-sm font-medium text-text">{outbound.route}</span>
              <span className="ml-2 text-xs text-text-muted">{formatTime(outbound.time)}</span>
            </div>
            {activeLeg === "outbound" && (
              <span className="text-[10px] font-semibold text-primary uppercase">Viewing</span>
            )}
          </button>
          {/* Return tab */}
          <button
            type="button"
            onClick={() => setActiveLeg("return")}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
              activeLeg === "return" ? "bg-primary-50/50" : "hover:bg-gray-50"
            }`}
          >
            <div className={`flex h-6 w-6 items-center justify-center rounded-full shrink-0 ${
              activeLeg === "return" ? "bg-primary text-white" : "bg-gray-200 text-text-muted"
            }`}>
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-sm font-medium text-text">{returnRide.route}</span>
              <span className="ml-2 text-xs text-text-muted">{formatTime(returnRide.time)}</span>
            </div>
            {activeLeg === "return" && (
              <span className="text-[10px] font-semibold text-primary uppercase">Viewing</span>
            )}
          </button>
        </div>

        {/* Expanded content */}
        <div className="border-t border-border p-4">
          <RideCard
            ride={activeRide}
            isPast={isPast}
            cancellingId={cancellingId}
            onCancel={onCancel}
          />
        </div>
      </div>
    </div>
  );
}

export default function MyRidesPage() {
  const [monday, setMonday] = useState(() => getMonday(new Date()));
  const [weekData, setWeekData] = useState<WeekData>({});
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchWeek = useCallback(async (mon: Date) => {
    setLoading(true);
    const res = await fetch(`/api/my-rides/weekly?weekOf=${toDateString(mon)}`);
    if (res.ok) {
      setWeekData(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchWeek(monday);
  }, [monday, fetchWeek]);

  function prevWeek() {
    setMonday((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  }

  function nextWeek() {
    setMonday((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  }

  function goToThisWeek() {
    setMonday(getMonday(new Date()));
  }

  async function handleCancel(bookingId: string) {
    if (!confirm("Cancel this booking?")) return;
    setCancellingId(bookingId);
    const res = await fetch(`/api/bookings/${bookingId}`, { method: "DELETE" });
    setCancellingId(null);
    if (res.ok) fetchWeek(monday);
  }

  function findReturnBooking(ride: BookedRide, dayRides: BookedRide[]): BookedRide | null {
    if (!ride.returnCarpoolId) return null;
    return dayRides.find((r) => r.carpoolId === ride.returnCarpoolId) || null;
  }

  const weekDates = getWeekDates(monday);
  const today = toDateString(new Date());
  const totalBookings = Object.values(weekData).reduce((sum, rides) => sum + rides.length, 0);

  return (
    <div className="mx-auto max-w-3xl px-4">
      <SetPageHeader title="My Rides" backHref="/dashboard" />
      <h1 className="mb-6 text-2xl font-bold text-text hidden sm:block">My Rides</h1>

      {/* Week navigator */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={prevWeek}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-secondary hover:bg-gray-50 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-text">
            {formatShortDate(weekDates[0])} &ndash; {formatShortDate(weekDates[6])}
          </span>
          <button
            onClick={goToThisWeek}
            className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary hover:bg-emerald-100 transition-colors"
          >
            Today
          </button>
        </div>
        <button
          onClick={nextWeek}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-secondary hover:bg-gray-50 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {!loading && totalBookings === 0 && (
        <EmptyState
          icon={
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          }
          title="No rides this week"
          description="Book rides from the Find a Ride page"
        />
      )}

      {!loading && totalBookings > 0 && (
        <div className="space-y-4">
          {weekDates.map((date) => {
            const dateStr = toDateString(date);
            if (dateStr < today) return null;
            const rides = weekData[dateStr] ?? [];
            const isToday = dateStr === today;
            const isPast = false;

            if (rides.length === 0) return null;

            const renderedBookingIds = new Set<string>();

            return (
              <div key={dateStr}>
                <div className="mb-2 flex items-center gap-2">
                  <h3 className={`text-sm font-semibold ${isToday ? "text-primary" : "text-text"}`}>
                    {formatShortDate(date)}
                  </h3>
                  {isToday && <Badge variant="primary">Today</Badge>}
                </div>

                <div className="flex flex-col gap-2">
                  {rides.map((ride) => {
                    if (renderedBookingIds.has(ride.bookingId)) return null;

                    const returnBooking = findReturnBooking(ride, rides);
                    if (returnBooking) {
                      renderedBookingIds.add(returnBooking.bookingId);
                    }

                    if (returnBooking) {
                      return (
                        <RoundTripRideCard
                          key={ride.bookingId}
                          outbound={ride}
                          returnRide={returnBooking}
                          isPast={isPast}
                          cancellingId={cancellingId}
                          onCancel={handleCancel}
                        />
                      );
                    }

                    return (
                      <Card key={ride.bookingId} className={`p-4 ${isPast ? "opacity-50" : ""}`}>
                        <RideCard
                          ride={ride}
                          isPast={isPast}
                          cancellingId={cancellingId}
                          onCancel={handleCancel}
                        />
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
