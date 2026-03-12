import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { carpools, driverLocations } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { carpoolId, latitude, longitude, heading } = await request.json();

    if (!carpoolId || latitude == null || longitude == null) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Verify ownership and active status
    const [carpool] = await db
      .select()
      .from(carpools)
      .where(
        and(
          eq(carpools.id, carpoolId),
          eq(carpools.driverId, session.user.id),
          eq(carpools.isActive, true)
        )
      )
      .limit(1);

    if (!carpool) {
      return NextResponse.json({ error: "Carpool not active" }, { status: 404 });
    }

    // Upsert location
    const existing = await db
      .select({ id: driverLocations.id })
      .from(driverLocations)
      .where(eq(driverLocations.carpoolId, carpoolId))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(driverLocations)
        .set({
          latitude,
          longitude,
          heading: heading ?? null,
          updatedAt: new Date(),
        })
        .where(eq(driverLocations.carpoolId, carpoolId));
    } else {
      await db.insert(driverLocations).values({
        driverId: session.user.id,
        carpoolId,
        latitude,
        longitude,
        heading: heading ?? null,
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to update location" }, { status: 500 });
  }
}
