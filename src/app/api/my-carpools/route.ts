import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { carpools, bookings, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const myCarpools = await db
    .select({
      id: carpools.id,
      route: carpools.route,
      customRoute: carpools.customRoute,
      daysOfWeek: carpools.daysOfWeek,
      time: carpools.time,
      totalSeats: carpools.totalSeats,
      createdAt: carpools.createdAt,
      originName: carpools.originName,
      destinationName: carpools.destinationName,
      originLat: carpools.originLat,
      originLng: carpools.originLng,
      destinationLat: carpools.destinationLat,
      destinationLng: carpools.destinationLng,
      routeGeometry: carpools.routeGeometry,
      routeDistance: carpools.routeDistance,
      routeDuration: carpools.routeDuration,
      gasMoneyRequested: carpools.gasMoneyRequested,
    })
    .from(carpools)
    .where(eq(carpools.driverId, session.user.id))
    .orderBy(carpools.time);

  // For each carpool, get upcoming riders (bookings with dates >= today)
  const today = new Date().toISOString().split("T")[0];

  const carpoolsWithRiders = await Promise.all(
    myCarpools.map(async (carpool) => {
      const riders = await db
        .select({
          bookingId: bookings.id,
          riderId: bookings.riderUserId,
          riderName: users.fullName,
          date: bookings.date,
          bookedAt: bookings.createdAt,
        })
        .from(bookings)
        .innerJoin(users, eq(bookings.riderUserId, users.id))
        .where(eq(bookings.carpoolId, carpool.id));

      return { ...carpool, riders };
    })
  );

  return NextResponse.json(carpoolsWithRiders);
}
