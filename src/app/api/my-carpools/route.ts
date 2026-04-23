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
      gasMoneyAmount: carpools.gasMoneyAmount,
      returnCarpoolId: carpools.returnCarpoolId,
      isActive: carpools.isActive,
      startDate: carpools.startDate,
      endDate: carpools.endDate,
    })
    .from(carpools)
    .where(eq(carpools.driverId, session.user.id))
    .orderBy(carpools.time);

  const today = new Date().toISOString().split("T")[0];

  const carpoolsWithRiders = await Promise.all(
    myCarpools.map(async (carpool) => {
      const riders = await db
        .select({
          bookingId: bookings.id,
          riderId: bookings.riderUserId,
          riderName: users.fullName,
          riderAvatarUrl: users.avatarUrl,
          date: bookings.date,
          bookedAt: bookings.createdAt,
        })
        .from(bookings)
        .innerJoin(users, eq(bookings.riderUserId, users.id))
        .where(eq(bookings.carpoolId, carpool.id));

      const searchStart =
        carpool.startDate && carpool.startDate > today ? carpool.startDate : today;
      const nextDate = nextOccurrence(
        carpool.daysOfWeek,
        searchStart,
        carpool.endDate ?? null
      );
      const bookedOnNext = nextDate
        ? riders.filter((r) => r.date === nextDate).length
        : 0;
      const seatsLeft = Math.max(0, carpool.totalSeats - bookedOnNext);

      return { ...carpool, riders, seatsLeft, nextDate };
    })
  );

  return NextResponse.json(carpoolsWithRiders);
}

// Nearest date >= `from` whose day-of-week is in `days` (0=Sun..6=Sat),
// bounded above by `until` (inclusive). Returns YYYY-MM-DD or null.
function nextOccurrence(
  days: number[],
  from: string,
  until: string | null
): string | null {
  if (!days.length) return null;
  const start = new Date(from + "T00:00:00Z");
  for (let i = 0; i < 14; i++) {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    if (until && dateStr > until) return null;
    if (days.includes(d.getUTCDay())) return dateStr;
  }
  return null;
}
