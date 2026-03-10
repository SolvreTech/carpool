import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { driverBlocks, bookings, carpools, users } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const blocks = await db
    .select({
      id: driverBlocks.id,
      blockedUserId: driverBlocks.blockedUserId,
      blockedUserName: users.fullName,
      createdAt: driverBlocks.createdAt,
    })
    .from(driverBlocks)
    .innerJoin(users, eq(driverBlocks.blockedUserId, users.id))
    .where(eq(driverBlocks.driverId, session.user.id));

  return NextResponse.json(blocks);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { blockedUserId } = await request.json();

    if (!blockedUserId) {
      return NextResponse.json(
        { error: "Blocked user ID is required" },
        { status: 400 }
      );
    }

    if (blockedUserId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot block yourself" },
        { status: 400 }
      );
    }

    // Check if already blocked
    const [existing] = await db
      .select()
      .from(driverBlocks)
      .where(
        and(
          eq(driverBlocks.driverId, session.user.id),
          eq(driverBlocks.blockedUserId, blockedUserId)
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "User already blocked" },
        { status: 409 }
      );
    }

    // Create block
    await db.insert(driverBlocks).values({
      driverId: session.user.id,
      blockedUserId,
    });

    // Auto-cancel all existing bookings by the blocked user on this driver's carpools
    // Get the driver's carpool IDs
    const driverCarpools = await db
      .select({ id: carpools.id })
      .from(carpools)
      .where(eq(carpools.driverId, session.user.id));

    const carpoolIds = driverCarpools.map((c) => c.id);

    if (carpoolIds.length > 0) {
      // Find bookings to cancel
      const bookingsToCancel = await db
        .select()
        .from(bookings)
        .where(
          and(
            eq(bookings.riderUserId, blockedUserId),
            sql`${bookings.carpoolId} IN (${sql.join(
              carpoolIds.map((id) => sql`${id}`),
              sql`, `
            )})`
          )
        );

      // Delete each booking and restore seats
      for (const booking of bookingsToCancel) {
        await db.delete(bookings).where(eq(bookings.id, booking.id));
        await db
          .update(carpools)
          .set({
            availableSeats: sql`${carpools.availableSeats} + 1`,
          })
          .where(eq(carpools.id, booking.carpoolId));
      }
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to block user" },
      { status: 500 }
    );
  }
}
