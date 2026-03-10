import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { carpools, users, driverBlocks, bookings } from "@/db/schema";
import { eq, and, notInArray, sql } from "drizzle-orm";
import { ROUTES } from "@/types";

// Returns { "2026-03-10": [...carpools], "2026-03-11": [...], ... }
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const weekOf = searchParams.get("weekOf"); // Monday of the week

  if (!weekOf) {
    return NextResponse.json(
      { error: "weekOf parameter is required" },
      { status: 400 }
    );
  }

  // Compute 7 days starting from the given Monday
  const monday = new Date(weekOf + "T00:00:00Z");
  const days: { date: string; dayOfWeek: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setUTCDate(d.getUTCDate() + i);
    days.push({
      date: d.toISOString().split("T")[0],
      dayOfWeek: d.getUTCDay(),
    });
  }

  // Get IDs of drivers who have blocked this user
  const blockedByDrivers = db
    .select({ driverId: driverBlocks.driverId })
    .from(driverBlocks)
    .where(eq(driverBlocks.blockedUserId, session.user.id));

  // Get all carpools from non-blocking, non-self drivers
  const allCarpools = await db
    .select({
      id: carpools.id,
      driverId: carpools.driverId,
      driverName: users.fullName,
      route: carpools.route,
      customRoute: carpools.customRoute,
      daysOfWeek: carpools.daysOfWeek,
      time: carpools.time,
      totalSeats: carpools.totalSeats,
    })
    .from(carpools)
    .innerJoin(users, eq(carpools.driverId, users.id))
    .where(
      and(
        notInArray(carpools.driverId, blockedByDrivers)
      )
    )
    .orderBy(carpools.time);

  // Get all bookings for this week in one query
  const dateStrings = days.map((d) => d.date);
  const carpoolIds = allCarpools.map((c) => c.id);

  let bookingCounts: { carpoolId: string; date: string; count: number }[] = [];
  if (carpoolIds.length > 0) {
    bookingCounts = await db
      .select({
        carpoolId: bookings.carpoolId,
        date: bookings.date,
        count: sql<number>`count(*)::int`,
      })
      .from(bookings)
      .where(
        and(
          sql`${bookings.carpoolId} IN (${sql.join(
            carpoolIds.map((id) => sql`${id}`),
            sql`, `
          )})`,
          sql`${bookings.date} IN (${sql.join(
            dateStrings.map((d) => sql`${d}`),
            sql`, `
          )})`
        )
      )
      .groupBy(bookings.carpoolId, bookings.date);
  }

  // Build a lookup: carpoolId+date -> count
  const countMap = new Map<string, number>();
  for (const bc of bookingCounts) {
    countMap.set(`${bc.carpoolId}:${bc.date}`, bc.count);
  }

  // Build the weekly response
  const week: Record<
    string,
    {
      id: string;
      driverName: string;
      route: string;
      customRoute: string | null;
      time: string;
      totalSeats: number;
      availableSeats: number;
      date: string;
    }[]
  > = {};

  for (const day of days) {
    const dayCarpools = allCarpools
      .filter((c) => c.daysOfWeek.includes(day.dayOfWeek))
      .map((c) => {
        const booked = countMap.get(`${c.id}:${day.date}`) ?? 0;
        return {
          id: c.id,
          driverName: c.driverName,
          route: c.route,
          customRoute: c.customRoute,
          time: c.time,
          totalSeats: c.totalSeats,
          availableSeats: c.totalSeats - booked,
          date: day.date,
        };
      })
      .filter((c) => c.availableSeats > 0);

    week[day.date] = dayCarpools;
  }

  return NextResponse.json(week);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { route, customRoute, daysOfWeek, time, totalSeats } = body;

    if (!route || !daysOfWeek?.length || !time || !totalSeats) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (!ROUTES.includes(route)) {
      return NextResponse.json({ error: "Invalid route" }, { status: 400 });
    }

    if (route === "Other" && !customRoute) {
      return NextResponse.json(
        { error: "Custom route is required when selecting Other" },
        { status: 400 }
      );
    }

    if (totalSeats < 1 || totalSeats > 10) {
      return NextResponse.json(
        { error: "Seats must be between 1 and 10" },
        { status: 400 }
      );
    }

    const validDays = daysOfWeek.every(
      (d: number) => Number.isInteger(d) && d >= 0 && d <= 6
    );
    if (!validDays) {
      return NextResponse.json(
        { error: "Invalid days of week" },
        { status: 400 }
      );
    }

    const [carpool] = await db
      .insert(carpools)
      .values({
        driverId: session.user.id,
        route,
        customRoute: route === "Other" ? customRoute : null,
        daysOfWeek,
        time,
        totalSeats,
      })
      .returning();

    return NextResponse.json(carpool, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create carpool" },
      { status: 500 }
    );
  }
}
