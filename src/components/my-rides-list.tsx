"use client";

import { useEffect, useState, useCallback } from "react";

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
    const data = await res.json();
    setRides(data);
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

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (rides.length === 0)
    return <p className="text-gray-500">No bookings yet.</p>;

  return (
    <div className="space-y-3">
      {rides.map((ride) => (
        <div
          key={ride.bookingId}
          className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div>
            <h3 className="font-semibold text-gray-900">
              {ride.route === "Other" ? ride.customRoute : ride.route}
            </h3>
            <p className="text-sm text-gray-500">Driver: {ride.driverName}</p>
            <p className="text-sm text-gray-500">
              {ride.date} at {ride.time}
            </p>
          </div>
          <button
            onClick={() => handleCancel(ride.bookingId)}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Cancel
          </button>
        </div>
      ))}
    </div>
  );
}
