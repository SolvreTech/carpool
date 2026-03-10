"use client";

import { useState } from "react";
import { ROUTES } from "@/types";

export default function CreateCarpoolForm({
  onCreated,
}: {
  onCreated: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [route, setRoute] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const res = await fetch("/api/carpools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        route: formData.get("route"),
        customRoute: formData.get("customRoute"),
        date: formData.get("date"),
        time: formData.get("time"),
        totalSeats: Number(formData.get("totalSeats")),
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Failed to create carpool");
    } else {
      (e.target as HTMLFormElement).reset();
      setRoute("");
      onCreated();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="rounded bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Route
        </label>
        <select
          name="route"
          required
          value={route}
          onChange={(e) => setRoute(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Select a route</option>
          {ROUTES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      {route === "Other" && (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Custom Route
          </label>
          <input
            name="customRoute"
            type="text"
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Describe your route"
          />
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Date
          </label>
          <input
            name="date"
            type="date"
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Time
          </label>
          <input
            name="time"
            type="time"
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Available Seats
        </label>
        <input
          name="totalSeats"
          type="number"
          min={1}
          max={10}
          required
          defaultValue={3}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Creating..." : "Create Carpool"}
      </button>
    </form>
  );
}
