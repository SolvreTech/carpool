import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { bookings, carpools, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const myRides = await db
    .select({
      bookingId: bookings.id,
      carpoolId: carpools.id,
      driverName: users.fullName,
      route: carpools.route,
      customRoute: carpools.customRoute,
      date: bookings.date,
      time: carpools.time,
      bookedAt: bookings.createdAt,
    })
    .from(bookings)
    .innerJoin(carpools, eq(bookings.carpoolId, carpools.id))
    .innerJoin(users, eq(carpools.driverId, users.id))
    .where(eq(bookings.riderUserId, session.user.id))
    .orderBy(desc(bookings.date), desc(carpools.time));

  return NextResponse.json(myRides);
}
