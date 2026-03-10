import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { carpools, users, driverBlocks } from "@/db/schema";
import { eq, and, gt, notInArray, sql } from "drizzle-orm";
import { ROUTES } from "@/types";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (!date) {
    return NextResponse.json(
      { error: "Date parameter is required" },
      { status: 400 }
    );
  }

  // Get IDs of drivers who have blocked this user
  const blockedByDrivers = db
    .select({ driverId: driverBlocks.driverId })
    .from(driverBlocks)
    .where(eq(driverBlocks.blockedUserId, session.user.id));

  const results = await db
    .select({
      id: carpools.id,
      driverId: carpools.driverId,
      driverName: users.fullName,
      route: carpools.route,
      customRoute: carpools.customRoute,
      date: carpools.date,
      time: carpools.time,
      totalSeats: carpools.totalSeats,
      availableSeats: carpools.availableSeats,
      createdAt: carpools.createdAt,
    })
    .from(carpools)
    .innerJoin(users, eq(carpools.driverId, users.id))
    .where(
      and(
        eq(carpools.date, date),
        gt(carpools.availableSeats, 0),
        notInArray(carpools.driverId, blockedByDrivers),
        sql`${carpools.driverId} != ${session.user.id}`
      )
    )
    .orderBy(carpools.time);

  return NextResponse.json(results);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { route, customRoute, date, time, totalSeats } = body;

    if (!route || !date || !time || !totalSeats) {
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

    const [carpool] = await db
      .insert(carpools)
      .values({
        driverId: session.user.id,
        route,
        customRoute: route === "Other" ? customRoute : null,
        date,
        time,
        totalSeats,
        availableSeats: totalSeats,
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
