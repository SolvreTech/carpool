"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import SetPageHeader from "@/components/set-page-header";
import RouteMap from "@/components/map/route-map";
import RouteTimeline from "@/components/route-timeline";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import Avatar from "@/components/ui/avatar";
import { SkeletonCard } from "@/components/ui/skeleton";
import { formatTime } from "@/lib/utils";

interface CarpoolData {
  id: string;
  driverId: string;
  driverName: string;
  route: string;
  customRoute?: string | null;
  daysOfWeek: number[];
  time: string;
  totalSeats: number;
  originName?: string | null;
  destinationName?: string | null;
  originLat?: number | null;
  originLng?: number | null;
  destinationLat?: number | null;
  destinationLng?: number | null;
  routeGeometry?: string | null;
  routeDistance?: number | null;
  routeDuration?: number | null;
  gasMoneyRequested?: boolean;
}

interface DriverProfile {
  fullName: string;
  nickname?: string | null;
  carModel?: string | null;
  carColor?: string | null;
  licensePlate?: string | null;
  venmoUsername?: string | null;
  avatarUrl?: string | null;
}

export default function CarpoolDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const carpoolId = params.id as string;
  const date = searchParams.get("date") || "";

  const [carpool, setCarpool] = useState<CarpoolData | null>(null);
  const [driver, setDriver] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const carpoolRes = await fetch(`/api/carpools/${carpoolId}`);
        if (!carpoolRes.ok) {
          setError("Carpool not found");
          setLoading(false);
          return;
        }
        const carpoolData: CarpoolData = await carpoolRes.json();
        setCarpool(carpoolData);

        const driverRes = await fetch(`/api/drivers/${carpoolData.driverId}`);
        if (driverRes.ok) {
          const driverData: DriverProfile = await driverRes.json();
          setDriver(driverData);
        }
      } catch {
        setError("Failed to load carpool details");
      }
      setLoading(false);
    }
    fetchData();
  }, [carpoolId]);

  async function handleBook() {
    setBooking(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carpoolId, date }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to book seat");
        setBooking(false);
        return;
      }

      router.push("/rider");
    } catch {
      alert("Failed to book seat");
      setBooking(false);
    }
  }

  const origin =
    carpool?.originLat != null && carpool?.originLng != null
      ? { lat: carpool.originLat, lng: carpool.originLng }
      : undefined;
  const destination =
    carpool?.destinationLat != null && carpool?.destinationLng != null
      ? { lat: carpool.destinationLat, lng: carpool.destinationLng }
      : undefined;

  const carInfo =
    driver?.carColor && driver?.carModel
      ? `${driver.carColor} ${driver.carModel}`
      : driver?.carModel || null;

  return (
    <div className="mx-auto max-w-2xl px-4 pb-8">
      <SetPageHeader title="Ride Details" backHref="/rider" />

      {loading ? (
        <div className="space-y-4">
          <div className="h-56 sm:h-72 rounded-2xl bg-gray-200 animate-pulse" />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : error || !carpool ? (
        <div className="py-12 text-center">
          <p className="text-text-secondary">{error || "Carpool not found"}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Route Map */}
          <RouteMap
            origin={origin}
            destination={destination}
            routeGeometry={carpool.routeGeometry}
            className="h-56 sm:h-72"
          />

          {/* Route Info */}
          <Card className="p-4">
            <h2 className="text-lg font-semibold text-text mb-3">
              {carpool.route}
            </h2>
            <RouteTimeline
              origin={carpool.originName || "Origin"}
              destination={carpool.destinationName || "Destination"}
              distance={carpool.routeDistance}
              duration={carpool.routeDuration}
            />
          </Card>

          {/* Driver Info */}
          <Card className="p-4">
            <div className="flex items-center gap-3">
              {driver?.avatarUrl ? (
                <img
                  src={driver.avatarUrl}
                  alt={driver.fullName}
                  className="h-12 w-12 rounded-full object-cover shrink-0"
                />
              ) : (
                <Avatar
                  name={driver?.fullName || carpool.driverName}
                  size="lg"
                />
              )}
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-text">
                  {driver?.fullName || carpool.driverName}
                  {driver?.nickname && (
                    <span className="text-text-secondary font-normal">
                      {" "}
                      ({driver.nickname})
                    </span>
                  )}
                </h3>
                {carInfo && (
                  <p className="text-sm text-text-secondary">{carInfo}</p>
                )}
                {driver?.licensePlate && (
                  <Badge variant="secondary" className="mt-1">
                    {driver.licensePlate}
                  </Badge>
                )}
              </div>
            </div>
          </Card>

          {/* Trip Details */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
              Trip Details
            </h3>
            <div className="space-y-2">
              {date && (
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Date</span>
                  <span className="font-medium text-text">{date}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Time</span>
                <span className="font-medium text-text">
                  {formatTime(carpool.time)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Available Seats</span>
                <span className="font-medium text-text">
                  {carpool.totalSeats}
                </span>
              </div>
            </div>
          </Card>

          {/* Gas Money Notice */}
          {carpool.gasMoneyRequested && (
            <Card className="p-4 bg-primary-50 border-primary/20">
              <div className="flex items-start gap-3">
                <svg className="h-5 w-5 text-primary shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-text">Gas money requested</p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    This driver is requesting riders to chip in for gas.
                  </p>
                  {driver?.venmoUsername && (
                    <a
                      href={`https://venmo.com/${driver.venmoUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#008CFF] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0074d4] transition-colors"
                    >
                      Pay @{driver.venmoUsername} on Venmo
                    </a>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Book Button */}
          <Button
            size="lg"
            className="w-full"
            onClick={handleBook}
            disabled={booking}
          >
            {booking ? "Booking..." : "Book This Ride"}
          </Button>
        </div>
      )}
    </div>
  );
}
