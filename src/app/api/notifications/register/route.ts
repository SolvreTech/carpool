import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deviceTokens } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getAuthedUser } from "@/lib/api-auth";

export async function POST(request: Request) {
  const user = await getAuthedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { expoPushToken, platform } = await request.json();
    if (typeof expoPushToken !== "string" || !expoPushToken.startsWith("ExponentPushToken")) {
      return NextResponse.json({ error: "Invalid push token" }, { status: 400 });
    }

    // Upsert by token: if the same token is re-registered, move it to this user
    // (handles the case where a device is signed into multiple accounts over time).
    await db
      .insert(deviceTokens)
      .values({
        userId: user.id,
        expoPushToken,
        platform: typeof platform === "string" ? platform.slice(0, 16) : null,
      })
      .onConflictDoUpdate({
        target: deviceTokens.expoPushToken,
        set: {
          userId: user.id,
          platform: typeof platform === "string" ? platform.slice(0, 16) : null,
          updatedAt: sql`now()`,
        },
      });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to register token" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const user = await getAuthedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { expoPushToken } = await request.json();
    if (typeof expoPushToken !== "string") {
      return NextResponse.json({ error: "Invalid push token" }, { status: 400 });
    }
    await db.delete(deviceTokens).where(eq(deviceTokens.expoPushToken, expoPushToken));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to remove token" }, { status: 500 });
  }
}
