"use client";

import { useState } from "react";
import { formatTime } from "@/lib/utils";
import { getRouteDisplayNames } from "@/lib/routes";
import Card from "./ui/card";
import Avatar from "./ui/avatar";
import Badge from "./ui/badge";
import Button from "./ui/button";
import RouteTimeline from "./route-timeline";

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
  onBook: (id: string, date: string) => void;
}) {
  const [booking, setBooking] = useState(false);
  const routeNames = getRouteDisplayNames(carpool.route, carpool.customRoute);

  async function handleBook() {
    setBooking(true);
    await onBook(carpool.id, carpool.date);
    setBooking(false);
  }

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <Avatar name={carpool.driverName} size="sm" />
          <div className="min-w-0 flex-1">
            {routeNames ? (
              <RouteTimeline
                origin={routeNames.origin}
                destination={routeNames.destination || undefined}
              />
            ) : (
              <h3 className="font-semibold text-text">
                {carpool.route === "Other" ? carpool.customRoute : carpool.route}
              </h3>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{carpool.driverName}</Badge>
              <Badge variant="secondary">{carpool.date}</Badge>
              <Badge variant="secondary">{formatTime(carpool.time)}</Badge>
              <Badge variant="primary">
                {carpool.availableSeats} seat{carpool.availableSeats !== 1 ? "s" : ""}
              </Badge>
            </div>
          </div>
        </div>
        <Button
          size="sm"
          onClick={handleBook}
          disabled={booking}
        >
          {booking ? "..." : "Book"}
        </Button>
      </div>
    </Card>
  );
}
