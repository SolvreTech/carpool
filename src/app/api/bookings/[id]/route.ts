import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { bookings, carpools } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Delete booking and restore seat
  const [deleted] = await db
    .delete(bookings)
    .where(
      and(eq(bookings.id, id), eq(bookings.riderUserId, session.user.id))
    )
    .returning();

  if (!deleted) {
    return NextResponse.json(
      { error: "Booking not found" },
      { status: 404 }
    );
  }

  // Restore the seat
  await db
    .update(carpools)
    .set({
      availableSeats: sql`${carpools.availableSeats} + 1`,
    })
    .where(eq(carpools.id, deleted.carpoolId));

  return NextResponse.json({ success: true });
}
