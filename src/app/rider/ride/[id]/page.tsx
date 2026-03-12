"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "@/components/navbar";
import RiderLiveMap from "@/components/rider-live-map";
import DriverInfoCard from "@/components/driver-info-card";
import { formatTime } from "@/lib/utils";

interface RideInfo {
  carpoolId: string;
  driverName: string;
  route: string;
  customRoute: string | null;
  time: string;
}

export default function RideDetailPage() {
  const params = useParams();
  const carpoolId = params.id as string;
  const [ride, setRide] = useState<RideInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRide() {
      const res = await fetch("/api/my-rides");
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const rides = await res.json();
      const found = rides.find((r: RideInfo) => r.carpoolId === carpoolId);
      if (found) {
        setRide(found);
      }
      setLoading(false);
    }
    fetchRide();
  }, [carpoolId]);

  const routeName = ride
    ? ride.route === "Other"
      ? ride.customRoute || "Custom Route"
      : ride.route
    : "";

  return (
    <div className="min-h-screen bg-surface-secondary">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-6 pb-24 sm:pb-8">
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-48 rounded-2xl bg-gray-200" />
            <div className="h-20 rounded-2xl bg-gray-200" />
          </div>
        ) : ride ? (
          <div className="space-y-4">
            <h1 className="text-xl font-bold text-text">Live Tracking</h1>
            <RiderLiveMap carpoolId={carpoolId} route={ride.route} />
            <DriverInfoCard
              name={ride.driverName}
              route={routeName}
              time={formatTime(ride.time)}
            />
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-text-secondary">Ride not found</p>
          </div>
        )}
      </main>
    </div>
  );
}
