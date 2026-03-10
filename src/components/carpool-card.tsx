"use client";

import { useState } from "react";

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

export default function CarpoolCard({
  carpool,
  onBook,
}: {
  carpool: Carpool;
  onBook: (id: string) => void;
}) {
  const [booking, setBooking] = useState(false);

  async function handleBook() {
    setBooking(true);
    await onBook(carpool.id);
    setBooking(false);
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div>
        <h3 className="font-semibold text-gray-900">
          {carpool.route === "Other" ? carpool.customRoute : carpool.route}
        </h3>
        <p className="text-sm text-gray-500">Driver: {carpool.driverName}</p>
        <p className="text-sm text-gray-500">
          {carpool.date} at {carpool.time}
        </p>
        <p className="text-sm text-gray-500">
          {carpool.availableSeats} seat{carpool.availableSeats !== 1 ? "s" : ""}{" "}
          available
        </p>
      </div>
      <button
        onClick={handleBook}
        disabled={booking}
        className="rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
      >
        {booking ? "Booking..." : "Book Seat"}
      </button>
    </div>
  );
}
