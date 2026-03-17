import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { carpools, users } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [carpool] = await db
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
    .where(eq(carpools.id, id))
    .limit(1);

  if (!carpool) {
    return NextResponse.json(
      { error: "Carpool not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(carpool);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [deleted] = await db
    .delete(carpools)
    .where(and(eq(carpools.id, id), eq(carpools.driverId, session.user.id)))
    .returning();

  if (!deleted) {
    return NextResponse.json(
      { error: "Carpool not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
