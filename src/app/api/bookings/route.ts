import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { bookings, carpools, driverBlocks } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { carpoolId, date } = await request.json();

    if (!carpoolId || !date) {
      return NextResponse.json(
        { error: "Carpool ID and date are required" },
        { status: 400 }
      );
    }

    // Get the carpool
    const [carpool] = await db
      .select()
      .from(carpools)
      .where(eq(carpools.id, carpoolId))
      .limit(1);

    if (!carpool) {
      return NextResponse.json(
        { error: "Carpool no longer available" },
        { status: 404 }
      );
    }

    // Verify the carpool runs on this day of week
    const dayOfWeek = new Date(date + "T00:00:00").getUTCDay();
    if (!carpool.daysOfWeek.includes(dayOfWeek)) {
      return NextResponse.json(
        { error: "Carpool no longer available" },
        { status: 404 }
      );
    }

    // Check if user is blocked by the driver (generic error)
    const [block] = await db
      .select()
      .from(driverBlocks)
      .where(
        and(
          eq(driverBlocks.driverId, carpool.driverId),
          eq(driverBlocks.blockedUserId, session.user.id)
        )
      )
      .limit(1);

    if (block) {
      return NextResponse.json(
        { error: "Carpool no longer available" },
        { status: 404 }
      );
    }

    // TODO: re-enable before production
    // // Can't book your own carpool
    // if (carpool.driverId === session.user.id) {
    //   return NextResponse.json(
    //     { error: "You cannot book your own carpool" },
    //     { status: 400 }
    //   );
    // }

    // Check if already booked for this date
    const [existingBooking] = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.carpoolId, carpoolId),
          eq(bookings.riderUserId, session.user.id),
          eq(bookings.date, date)
        )
      )
      .limit(1);

    if (existingBooking) {
      return NextResponse.json(
        { error: "You already booked this carpool for this date" },
        { status: 409 }
      );
    }

    // Check available seats for this specific date
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(bookings)
      .where(and(eq(bookings.carpoolId, carpoolId), eq(bookings.date, date)));

    if (count >= carpool.totalSeats) {
      return NextResponse.json(
        { error: "No seats available" },
        { status: 409 }
      );
    }

    const [booking] = await db
      .insert(bookings)
      .values({
        carpoolId,
        riderUserId: session.user.id,
        date,
      })
      .returning();

    return NextResponse.json(booking, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to book seat" },
      { status: 500 }
    );
  }
}
