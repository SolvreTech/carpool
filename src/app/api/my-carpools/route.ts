import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { carpools, bookings, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

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
      date: carpools.date,
      time: carpools.time,
      totalSeats: carpools.totalSeats,
      availableSeats: carpools.availableSeats,
      createdAt: carpools.createdAt,
    })
    .from(carpools)
    .where(eq(carpools.driverId, session.user.id))
    .orderBy(desc(carpools.date), desc(carpools.time));

  // For each carpool, get its riders
  const carpoolsWithRiders = await Promise.all(
    myCarpools.map(async (carpool) => {
      const riders = await db
        .select({
          bookingId: bookings.id,
          riderId: bookings.riderUserId,
          riderName: users.fullName,
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
