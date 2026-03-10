"use client";

import { useState, useEffect, useCallback } from "react";
import { formatTime, getMonday, toDateString, getWeekDates, formatShortDate } from "@/lib/utils";

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
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
        >
          Prev
        </button>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-900">
            {formatShortDate(weekDates[0])} &ndash; {formatShortDate(weekDates[6])}
          </span>
          <button
            onClick={goToThisWeek}
            className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600 hover:bg-gray-200"
          >
            Today
          </button>
        </div>
        <button
          onClick={nextWeek}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
        >
          Next
        </button>
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}

      {!loading && (
        <div className="space-y-4">
          {weekDates.map((date) => {
            const dateStr = toDateString(date);
            const rides = weekData[dateStr] ?? [];
            const isToday = dateStr === today;
            const isPast = dateStr < today;

            return (
              <div
                key={dateStr}
                className={`rounded-lg border p-4 ${
                  isToday
                    ? "border-blue-300 bg-blue-50"
                    : isPast
                      ? "border-gray-100 bg-gray-50 opacity-60"
                      : "border-gray-200 bg-white"
                }`}
              >
                <h3
                  className={`mb-2 text-sm font-semibold ${
                    isToday ? "text-blue-700" : "text-gray-900"
                  }`}
                >
                  {formatShortDate(date)}
                  {isToday && " (Today)"}
                </h3>

                {rides.length === 0 ? (
                  <p className="text-sm text-gray-400">No rides available</p>
                ) : (
                  <div className="space-y-2">
                    {rides.map((ride) => (
                      <div
                        key={ride.id}
                        className="flex items-center justify-between rounded-md bg-white px-3 py-2 shadow-sm ring-1 ring-gray-200"
                      >
                        <div className="min-w-0">
                          <span className="font-medium text-gray-900">
                            {ride.route === "Other"
                              ? ride.customRoute
                              : ride.route}
                          </span>
                          <span className="mx-2 text-gray-300">|</span>
                          <span className="text-sm text-gray-500">
                            {ride.driverName}
                          </span>
                          <span className="mx-2 text-gray-300">|</span>
                          <span className="text-sm text-gray-500">
                            {formatTime(ride.time)}
                          </span>
                          <span className="mx-2 text-gray-300">|</span>
                          <span className="text-sm text-gray-500">
                            {ride.availableSeats} seat
                            {ride.availableSeats !== 1 ? "s" : ""}
                          </span>
                        </div>
                        {!isPast && (
                          <button
                            onClick={() => handleBook(ride.id, dateStr)}
                            disabled={bookingId === ride.id + dateStr}
                            className="ml-3 shrink-0 rounded-md bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            {bookingId === ride.id + dateStr
                              ? "..."
                              : "Book"}
                          </button>
                        )}
                      </div>
                    ))}
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
