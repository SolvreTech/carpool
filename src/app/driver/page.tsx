"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/navbar";
import CreateCarpoolForm from "@/components/create-carpool-form";
import MyCarpoolsList from "@/components/my-carpools-list";

export default function DriverPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Driver</h1>
          <Link
            href="/driver/blocks"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Manage Blocked Riders
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Create Carpool
            </h2>
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <CreateCarpoolForm
                onCreated={() => setRefreshKey((k) => k + 1)}
              />
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              My Carpools
            </h2>
            <MyCarpoolsList refreshKey={refreshKey} />
          </div>
        </div>
      </main>
    </div>
  );
}
