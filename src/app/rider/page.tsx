"use client";

import { useState } from "react";
import Navbar from "@/components/navbar";
import SearchCarpools from "@/components/search-carpools";
import MyRidesList from "@/components/my-rides-list";

export default function RiderPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Find a Ride</h1>
        <SearchCarpools onBooked={() => setRefreshKey((k) => k + 1)} />

        <div className="mt-10">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            My Booked Rides
          </h2>
          <MyRidesList refreshKey={refreshKey} />
        </div>
      </main>
    </div>
  );
}
