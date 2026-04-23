"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatTime, getMonday, toDateString, getWeekDates, formatShortDate } from "@/lib/utils";
import { getRouteDisplayNames } from "@/lib/routes";
import Card from "./ui/card";
import Badge from "./ui/badge";
import Avatar from "./ui/avatar";
import { SkeletonCard } from "./ui/skeleton";

interface Carpool {
  id: string;
  driverName: string;
  driverAvatarUrl?: string | null;
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
  gasMoneyAmount?: number | null;
  returnCarpoolId?: string | null;
  rideStatus?: string | null;
  time: string;
  totalSeats: number;
  availableSeats: number;
  date: string;
}

type WeekData = Record<string, Carpool[]>;

function formatGasMoney(cents?: number | null): string {
  if (cents == null) return "$";
  const dollars = cents / 100;
  return Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}

export default function SearchCarpools({
  onBooked,
}: {
  onBooked: () => void;
}) {
  const [monday, setMonday] = useState(() => getMonday(new Date()));
  const [weekData, setWeekData] = useState<WeekData>({});
  const [loading, setLoading] = useState(true);

  const fetchWeek = useCallback(async (mon: Date) => {
    setLoading(true);
    const res = await fetch(`/api/carpools?weekOf=${toDateString(mon)}`);
    if (res.ok) {
      const data = await res.json();
      setWeekData(data);
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

  function jumpToDate(iso: string) {
    if (!iso) return;
    const d = new Date(iso + "T00:00:00");
    setMonday(getMonday(d));
  }

  const weekDates = getWeekDates(monday);
  const today = toDateString(new Date());

  return (
    <div>
      {/* Week navigator */}
      <div className="mb-6 space-y-2">
        <div className="flex items-center justify-between">
          <button
            onClick={prevWeek}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-secondary hover:bg-gray-50 transition-colors"
            aria-label="Previous week"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-text">
            {formatShortDate(weekDates[0])} &ndash; {formatShortDate(weekDates[6])}
          </span>
          <button
            onClick={nextWeek}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-secondary hover:bg-gray-50 transition-colors"
            aria-label="Next week"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={goToThisWeek}
            className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary hover:bg-emerald-100 transition-colors"
          >
            Today
          </button>
          <label className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-medium text-text-secondary hover:bg-gray-50 cursor-pointer">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Pick a date
            <input
              type="date"
              onChange={(e) => jumpToDate(e.target.value)}
              min={today}
              className="sr-only"
            />
          </label>
        </div>
      </div>

      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {!loading && (
        <div className="space-y-4">
          {weekDates.map((date) => {
            const dateStr = toDateString(date);
            if (dateStr < today) return null;
            const rides = weekData[dateStr] ?? [];
            const isToday = dateStr === today;

            return (
              <div key={dateStr}>
                <div className="mb-2 flex items-center gap-2">
                  <h3 className={`text-sm font-semibold ${isToday ? "text-primary" : "text-text"}`}>
                    {formatShortDate(date)}
                  </h3>
                  {isToday && <Badge variant="primary">Today</Badge>}
                </div>

                {rides.length === 0 ? (
                  <p className="text-sm text-text-secondary mb-2">
                    No rides available
                  </p>
                ) : (
                  <div className="flex flex-col gap-2 mb-2">
                    {(() => {
                      const renderedIds = new Set<string>();
                      return rides.map((ride) => {
                        if (renderedIds.has(ride.id)) return null;
                        renderedIds.add(ride.id);

                        const returnRide = ride.returnCarpoolId
                          ? rides.find((r) => r.id === ride.returnCarpoolId)
                          : null;
                        if (returnRide) renderedIds.add(returnRide.id);

                        const routeNames = getRouteDisplayNames(ride);

                        if (returnRide) {
                          return (
                            <div key={ride.id}>
                              <div className="mb-1 flex items-center gap-1.5">
                                <svg className="h-3.5 w-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                                </svg>
                                <span className="text-xs font-semibold text-primary">Round Trip</span>
                              </div>
                              <div className={`rounded-2xl border border-border bg-white overflow-hidden transition-all ${
                                ride.rideStatus === "in_progress" ? "opacity-60" : "hover:border-primary/30 hover:shadow-sm"
                              }`}>
                                {/* Outbound summary */}
                                <Link href={ride.rideStatus === "in_progress" ? "#" : `/rider/carpool/${ride.id}?date=${dateStr}`} className="block" onClick={ride.rideStatus === "in_progress" ? (e) => e.preventDefault() : undefined}>
                                  <div className="flex items-center gap-3 px-4 py-3 hover:bg-primary-50/30 transition-colors">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white shrink-0">
                                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                      </svg>
                                    </div>
                                    <Avatar name={ride.driverName} imageUrl={ride.driverAvatarUrl} size="sm" />
                                    <div className="min-w-0 flex-1">
                                      <div className="text-sm font-semibold text-text">{ride.driverName}</div>
                                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                                        <Badge variant="secondary">{formatTime(ride.time)}</Badge>
                                        <span className="text-xs text-text-muted">
                                          {ride.originName?.split(",")[0]} &rarr; {ride.destinationName?.split(",")[0]}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      {ride.rideStatus === "in_progress" && (
                                        <span className="rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-xs font-medium">In Progress</span>
                                      )}
                                      {ride.gasMoneyRequested && (
                                        <span className="rounded-full bg-yellow-100 text-yellow-800 px-2 py-0.5 text-xs font-medium">
                                          {formatGasMoney(ride.gasMoneyAmount)} Gas
                                        </span>
                                      )}
                                      <span className="text-xs text-text-muted">{ride.availableSeats} seat{ride.availableSeats !== 1 ? "s" : ""}</span>
                                    </div>
                                  </div>
                                </Link>
                                {/* Return summary */}
                                <Link href={`/rider/carpool/${returnRide.id}?date=${dateStr}`} className="block border-t border-border-light">
                                  <div className="flex items-center gap-3 px-4 py-3 hover:bg-primary-50/30 transition-colors">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-text-muted shrink-0">
                                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                                      </svg>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-text-secondary">Return</span>
                                        <Badge variant="secondary">{formatTime(returnRide.time)}</Badge>
                                      </div>
                                      <p className="text-xs text-text-muted">
                                        {returnRide.originName?.split(",")[0]} &rarr; {returnRide.destinationName?.split(",")[0]}
                                      </p>
                                    </div>
                                    <span className="text-xs text-text-muted shrink-0">{returnRide.availableSeats} seat{returnRide.availableSeats !== 1 ? "s" : ""}</span>
                                  </div>
                                </Link>
                              </div>
                            </div>
                          );
                        }

                        const isInProgress = ride.rideStatus === "in_progress";
                        const cardContent = (
                          <div
                            className={`rounded-2xl border border-border bg-white overflow-hidden transition-all ${
                              isInProgress ? "opacity-60" : "hover:border-primary/30 hover:shadow-sm"
                            }`}
                          >
                            <div className="flex items-center gap-3 px-4 py-3">
                              <Avatar name={ride.driverName} imageUrl={ride.driverAvatarUrl} size="sm" />
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-semibold text-text">{ride.driverName}</div>
                                <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                                  <Badge variant="secondary">{formatTime(ride.time)}</Badge>
                                  <span className="text-xs text-text-muted">
                                    {routeNames
                                      ? `${routeNames.origin.split(",")[0]} → ${routeNames.destination?.split(",")[0] || ""}`
                                      : ride.route}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {isInProgress && (
                                  <span className="rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-xs font-medium">In Progress</span>
                                )}
                                {ride.gasMoneyRequested && (
                                  <span className="rounded-full bg-yellow-100 text-yellow-800 px-2 py-0.5 text-xs font-medium">
                                    {formatGasMoney(ride.gasMoneyAmount)} Gas
                                  </span>
                                )}
                                <span className="text-xs text-text-muted">{ride.availableSeats} seat{ride.availableSeats !== 1 ? "s" : ""}</span>
                              </div>
                            </div>
                          </div>
                        );

                        if (isInProgress) {
                          return <div key={ride.id}>{cardContent}</div>;
                        }

                        return (
                          <Link key={ride.id} href={`/rider/carpool/${ride.id}?date=${dateStr}`} className="block">
                            {cardContent}
                          </Link>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
