"use client";

import { useState } from "react";
import CarpoolCard from "./carpool-card";

interface Carpool {
  id: string;
  driverName: string;
  route: string;
  customRoute: string | null;
  date: string;
  time: string;
  totalSeats: number;
  availableSeats: number;
}

export default function SearchCarpools({
  onBooked,
}: {
  onBooked: () => void;
}) {
  const [date, setDate] = useState("");
  const [carpools, setCarpools] = useState<Carpool[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!date) return;

    setLoading(true);
    const res = await fetch(`/api/carpools?date=${date}`);
    const data = await res.json();
    setCarpools(data);
    setLoading(false);
    setSearched(true);
  }

  async function handleBook(carpoolId: string) {
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ carpoolId }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Failed to book seat");
      return;
    }

    // Refresh search results and notify parent
    const refreshRes = await fetch(`/api/carpools?date=${date}`);
    const refreshData = await refreshRes.json();
    setCarpools(refreshData);
    onBooked();
  }

  return (
    <div>
      <form onSubmit={handleSearch} className="mb-4 flex gap-3">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {loading && <p className="text-gray-500">Searching...</p>}

      {!loading && searched && carpools.length === 0 && (
        <p className="text-gray-500">No carpools available for this date.</p>
      )}

      <div className="space-y-3">
        {carpools.map((carpool) => (
          <CarpoolCard
            key={carpool.id}
            carpool={carpool}
            onBook={handleBook}
          />
        ))}
      </div>
    </div>
  );
}
