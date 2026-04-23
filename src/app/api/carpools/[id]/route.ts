import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { bookings, carpools, rideInstances, users } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

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
      gasMoneyAmount: carpools.gasMoneyAmount,
      returnCarpoolId: carpools.returnCarpoolId,
      startDate: carpools.startDate,
      endDate: carpools.endDate,
      stops: carpools.stops,
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

  // Fetch riders booked for this date
  let riders: { name: string; avatarUrl: string | null }[] = [];
  if (date) {
    riders = await db
      .select({
        name: users.fullName,
        avatarUrl: users.avatarUrl,
      })
      .from(bookings)
      .innerJoin(users, eq(bookings.riderUserId, users.id))
      .where(and(eq(bookings.carpoolId, id), eq(bookings.date, date)));
  }

  // Fetch return trip summary if linked
  let returnTrip: { id: string; route: string; time: string; originName: string | null; destinationName: string | null } | null = null;
  if (carpool.returnCarpoolId) {
    const [rt] = await db
      .select({
        id: carpools.id,
        route: carpools.route,
        time: carpools.time,
        originName: carpools.originName,
        destinationName: carpools.destinationName,
      })
      .from(carpools)
      .where(eq(carpools.id, carpool.returnCarpoolId))
      .limit(1);
    if (rt) returnTrip = rt;
  }

  // Fetch ride status for this date
  let rideStatus: string | null = null;
  if (date) {
    const [instance] = await db
      .select({ status: rideInstances.status })
      .from(rideInstances)
      .where(and(eq(rideInstances.carpoolId, id), eq(rideInstances.date, date)))
      .limit(1);
    if (instance) rideStatus = instance.status;
  }

  return NextResponse.json({ ...carpool, riders, returnTrip, rideStatus });
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const [updated] = await db
    .update(carpools)
    .set({ returnCarpoolId: body.returnCarpoolId || null })
    .where(and(eq(carpools.id, id), eq(carpools.driverId, session.user.id)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Carpool not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
