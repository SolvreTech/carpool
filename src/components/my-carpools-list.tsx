"use client";

import { useEffect, useState, useCallback } from "react";
import { DAY_LABELS } from "@/types";
import { formatTime } from "@/lib/utils";
import BlockRiderButton from "./block-rider-button";

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

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (carpools.length === 0)
    return <p className="text-gray-500">No carpools yet.</p>;

  return (
    <div className="space-y-4">
      {carpools.map((carpool) => (
        <div
          key={carpool.id}
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">
                {carpool.route === "Other"
                  ? carpool.customRoute
                  : carpool.route}
              </h3>
              <p className="text-sm text-gray-500">
                {carpool.daysOfWeek.map((d) => DAY_LABELS[d]).join(", ")} at{" "}
                {formatTime(carpool.time)}
              </p>
              <p className="text-sm text-gray-500">
                {carpool.totalSeats} seat{carpool.totalSeats !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={() => handleCancel(carpool.id)}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Delete
            </button>
          </div>
          {carpool.riders.length > 0 && (
            <div className="mt-3 border-t border-gray-100 pt-3">
              <p className="mb-2 text-sm font-medium text-gray-700">
                Booked riders:
              </p>
              <ul className="space-y-1">
                {carpool.riders.map((rider) => (
                  <li
                    key={rider.bookingId}
                    className="flex items-center justify-between text-sm text-gray-600"
                  >
                    <span>
                      {rider.riderName}{" "}
                      <span className="text-gray-400">({rider.date})</span>
                    </span>
                    <BlockRiderButton
                      riderId={rider.riderId}
                      riderName={rider.riderName}
                      onBlocked={fetchCarpools}
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
