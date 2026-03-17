import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { carpools, users, driverBlocks, bookings } from "@/db/schema";
import { eq, and, notInArray, sql } from "drizzle-orm";
import { fetchDirections } from "@/lib/mapbox";

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
      originName: string | null;
      destinationName: string | null;
      originLat: number | null;
      originLng: number | null;
      destinationLat: number | null;
      destinationLng: number | null;
      routeGeometry: string | null;
      routeDistance: number | null;
      routeDuration: number | null;
      gasMoneyRequested: boolean;
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
          originName: c.originName,
          destinationName: c.destinationName,
          originLat: c.originLat,
          originLng: c.originLng,
          destinationLat: c.destinationLat,
          destinationLng: c.destinationLng,
          routeGeometry: c.routeGeometry,
          routeDistance: c.routeDistance,
          routeDuration: c.routeDuration,
          gasMoneyRequested: c.gasMoneyRequested,
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
    const {
      route, daysOfWeek, time, totalSeats,
      originLat, originLng, originName,
      destinationLat, destinationLng, destinationName,
      routeGeometry: precomputedGeometry,
      routeDistance: precomputedDistance,
      routeDuration: precomputedDuration,
      gasMoneyRequested: gasMoneyBody,
    } = body;

    if (!route?.trim() || !daysOfWeek?.length || !time || !totalSeats) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (!originLat || !originLng || !destinationLat || !destinationLng) {
      return NextResponse.json(
        { error: "Origin and destination locations are required" },
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

    // Use pre-computed route data from client preview, or fetch server-side
    let routeGeometry: string | null = null;
    let routeDistance: number | null = null;
    let routeDuration: number | null = null;

    if (precomputedGeometry && precomputedDistance != null && precomputedDuration != null) {
      routeGeometry = precomputedGeometry;
      routeDistance = precomputedDistance;
      routeDuration = precomputedDuration;
    } else if (originLat && originLng && destinationLat && destinationLng) {
      const directions = await fetchDirections(
        { lat: originLat, lng: originLng },
        { lat: destinationLat, lng: destinationLng }
      );
      if (directions) {
        routeGeometry = directions.geometry;
        routeDistance = directions.distance;
        routeDuration = directions.duration;
      }
    }

    const [carpool] = await db
      .insert(carpools)
      .values({
        driverId: session.user.id,
        route: route.trim(),
        daysOfWeek,
        time,
        totalSeats,
        originLat: originLat ?? null,
        originLng: originLng ?? null,
        originName: originName ?? null,
        destinationLat: destinationLat ?? null,
        destinationLng: destinationLng ?? null,
        destinationName: destinationName ?? null,
        routeGeometry,
        routeDistance,
        routeDuration,
        gasMoneyRequested: gasMoneyBody === true,
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
