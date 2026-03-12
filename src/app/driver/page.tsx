"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/navbar";
import CreateCarpoolForm from "@/components/create-carpool-form";
import MyCarpoolsList from "@/components/my-carpools-list";
import Card from "@/components/ui/card";

export default function DriverPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="min-h-screen bg-surface-secondary">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-6 pb-24 sm:pb-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-text">Driver</h1>
          <Link
            href="/driver/blocks"
            className="rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-gray-200 transition-colors"
          >
            Blocked Riders
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="mb-3 text-sm font-semibold text-text-secondary uppercase tracking-wide">
              Create Carpool
            </h2>
            <Card className="p-6">
              <CreateCarpoolForm
                onCreated={() => setRefreshKey((k) => k + 1)}
              />
            </Card>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold text-text-secondary uppercase tracking-wide">
              My Carpools
            </h2>
            <MyCarpoolsList refreshKey={refreshKey} />
          </div>
        </div>
      </main>
    </div>
  );
}
