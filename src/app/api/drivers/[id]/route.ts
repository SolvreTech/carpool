import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [driver] = await db
    .select({
      fullName: users.fullName,
      nickname: users.nickname,
      carModel: users.carModel,
      carColor: users.carColor,
      licensePlate: users.licensePlate,
      venmoUsername: users.venmoUsername,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!driver) {
    return NextResponse.json(
      { error: "Driver not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(driver);
}
