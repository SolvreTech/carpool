"use client";

import { useState, useEffect, useCallback } from "react";
import { formatTime, getMonday, toDateString, getWeekDates, formatShortDate } from "@/lib/utils";
import { getRouteDisplayNames } from "@/lib/routes";
import Card from "./ui/card";
import Button from "./ui/button";
import Badge from "./ui/badge";
import Avatar from "./ui/avatar";
import RouteTimeline from "./route-timeline";
import { SkeletonCard } from "./ui/skeleton";

interface Carpool {
  id: string;
  driverName: string;
  route: string;
  customRoute: string | null;
  time: string;
  totalSeats: number;
  availableSeats: number;
  date: string;
}

type WeekData = Record<string, Carpool[]>;

export default function SearchCarpools({
  onBooked,
}: {
  onBooked: () => void;
}) {
  const [monday, setMonday] = useState(() => getMonday(new Date()));
  const [weekData, setWeekData] = useState<WeekData>({});
  const [loading, setLoading] = useState(true);
  const [bookingId, setBookingId] = useState<string | null>(null);

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

  async function handleBook(carpoolId: string, date: string) {
    setBookingId(carpoolId + date);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ carpoolId, date }),
    });

    const data = await res.json();
    setBookingId(null);

    if (!res.ok) {
      alert(data.error || "Failed to book seat");
      return;
    }

    fetchWeek(monday);
    onBooked();
  }

  const weekDates = getWeekDates(monday);
  const today = toDateString(new Date());

  return (
    <div>
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

      {!loading && (
        <div className="space-y-4">
          {weekDates.map((date) => {
            const dateStr = toDateString(date);
            const rides = weekData[dateStr] ?? [];
            const isToday = dateStr === today;
            const isPast = dateStr < today;

            return (
              <div key={dateStr}>
                <div className="mb-2 flex items-center gap-2">
                  <h3 className={`text-sm font-semibold ${isToday ? "text-primary" : "text-text"}`}>
                    {formatShortDate(date)}
                  </h3>
                  {isToday && <Badge variant="primary">Today</Badge>}
                </div>

                {rides.length === 0 ? (
                  <p className={`text-sm ${isPast ? "text-text-muted" : "text-text-secondary"} mb-2`}>
                    No rides available
                  </p>
                ) : (
                  <div className="space-y-3 mb-2">
                    {rides.map((ride) => {
                      const routeNames = getRouteDisplayNames(ride.route, ride.customRoute);
                      return (
                        <Card
                          key={ride.id}
                          className={`p-4 ${isPast ? "opacity-50" : ""}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0">
                              <Avatar name={ride.driverName} size="sm" />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-semibold text-text truncate">
                                    {ride.driverName}
                                  </span>
                                  <Badge variant="secondary">
                                    {formatTime(ride.time)}
                                  </Badge>
                                </div>
                                {routeNames ? (
                                  <RouteTimeline
                                    origin={routeNames.origin}
                                    destination={routeNames.destination || undefined}
                                    className="mt-2"
                                  />
                                ) : (
                                  <p className="text-sm text-text-secondary">
                                    {ride.route === "Other" ? ride.customRoute : ride.route}
                                  </p>
                                )}
                                <p className="mt-2 text-xs text-text-muted">
                                  {ride.availableSeats} seat{ride.availableSeats !== 1 ? "s" : ""} left
                                </p>
                              </div>
                            </div>
                            {!isPast && (
                              <Button
                                size="sm"
                                onClick={() => handleBook(ride.id, dateStr)}
                                disabled={bookingId === ride.id + dateStr}
                              >
                                {bookingId === ride.id + dateStr ? "..." : "Book"}
                              </Button>
                            )}
                          </div>
                        </Card>
                      );
                    })}
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
