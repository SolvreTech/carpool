"use client";

import { useState } from "react";
import { ROUTES, DAY_LABELS } from "@/types";
import Button from "./ui/button";
import Input from "./ui/input";

export default function CreateCarpoolForm({
  onCreated,
}: {
  onCreated: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [route, setRoute] = useState("");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  function toggleDay(day: number) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (selectedDays.length === 0) {
      setError("Select at least one day");
      return;
    }

    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const res = await fetch("/api/carpools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        route: formData.get("route"),
        customRoute: formData.get("customRoute"),
        daysOfWeek: selectedDays,
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
      setSelectedDays([]);
      onCreated();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">
          Route
        </label>
        <select
          name="route"
          required
          value={route}
          onChange={(e) => setRoute(e.target.value)}
          className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
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
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">
            Custom Route
          </label>
          <Input
            name="customRoute"
            type="text"
            required
            placeholder="Describe your route"
          />
        </div>
      )}
      <div>
        <label className="mb-2 block text-sm font-medium text-text-secondary">
          Days
        </label>
        <div className="flex gap-2">
          {DAY_LABELS.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => toggleDay(i)}
              className={`h-10 w-10 rounded-full text-sm font-medium transition-colors ${
                selectedDays.includes(i)
                  ? "bg-primary text-white shadow-sm"
                  : "border border-border text-text-secondary hover:bg-primary-50 hover:text-primary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">
          Time
        </label>
        <Input name="time" type="time" required />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">
          Available Seats
        </label>
        <Input
          name="totalSeats"
          type="number"
          min={1}
          max={10}
          required
          defaultValue={3}
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full" size="lg">
        {loading ? "Creating..." : "Create Carpool"}
      </Button>
    </form>
  );
}
