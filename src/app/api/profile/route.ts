import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [user] = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      username: users.username,
      avatarUrl: users.avatarUrl,
      nickname: users.nickname,
      carModel: users.carModel,
      carColor: users.carColor,
      licensePlate: users.licensePlate,
      venmoUsername: users.venmoUsername,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { nickname, carModel, carColor, licensePlate, avatarUrl } = body;

    // Validate that all provided fields are strings and within length limits
    const fieldLimits: Record<string, number> = {
      nickname: 100,
      carModel: 100,
      carColor: 50,
      licensePlate: 20,
      venmoUsername: 100,
      avatarUrl: 500,
    };

    const updates: Record<string, string | null> = {};

    for (const [field, maxLength] of Object.entries(fieldLimits)) {
      const value = body[field];
      if (value === undefined) continue;

      if (value !== null && typeof value !== "string") {
        return NextResponse.json(
          { error: `${field} must be a string or null` },
          { status: 400 }
        );
      }

      if (typeof value === "string" && value.length > maxLength) {
        return NextResponse.json(
          { error: `${field} must be at most ${maxLength} characters` },
          { status: 400 }
        );
      }

      updates[field] = value;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, session.user.id))
      .returning({
        id: users.id,
        fullName: users.fullName,
        username: users.username,
        avatarUrl: users.avatarUrl,
        nickname: users.nickname,
        carModel: users.carModel,
        carColor: users.carColor,
        licensePlate: users.licensePlate,
        venmoUsername: users.venmoUsername,
        createdAt: users.createdAt,
      });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
