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
    const { carpoolId } = await request.json();

    if (!carpoolId) {
      return NextResponse.json(
        { error: "Carpool ID is required" },
        { status: 400 }
      );
    }

    // Get the carpool to check the driver
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

    // Check if user is blocked by the driver (generic error to not reveal block)
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

    // Can't book your own carpool
    if (carpool.driverId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot book your own carpool" },
        { status: 400 }
      );
    }

    // Check if already booked
    const [existingBooking] = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.carpoolId, carpoolId),
          eq(bookings.riderUserId, session.user.id)
        )
      )
      .limit(1);

    if (existingBooking) {
      return NextResponse.json(
        { error: "You already booked this carpool" },
        { status: 409 }
      );
    }

    // Atomically decrement available seats (race-condition safe)
    const [updated] = await db
      .update(carpools)
      .set({
        availableSeats: sql`${carpools.availableSeats} - 1`,
      })
      .where(
        and(
          eq(carpools.id, carpoolId),
          sql`${carpools.availableSeats} > 0`
        )
      )
      .returning();

    if (!updated) {
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
