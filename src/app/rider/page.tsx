"use client";

import { useState } from "react";
import Navbar from "@/components/navbar";
import SearchCarpools from "@/components/search-carpools";
import MyRidesList from "@/components/my-rides-list";
import ActiveRideBanner from "@/components/active-ride-banner";

export default function RiderPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="min-h-screen bg-surface-secondary">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-6 pb-24 sm:pb-8">
        <ActiveRideBanner />
        <h1 className="mb-6 text-2xl font-bold text-text">Find a Ride</h1>
        <SearchCarpools onBooked={() => setRefreshKey((k) => k + 1)} />

        <div className="mt-10">
          <h2 className="mb-3 text-sm font-semibold text-text-secondary uppercase tracking-wide">
            My Booked Rides
          </h2>
          <MyRidesList refreshKey={refreshKey} />
        </div>
      </main>
    </div>
  );
}
