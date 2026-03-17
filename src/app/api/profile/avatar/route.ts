import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { put, del } from "@vercel/blob";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("avatar") || formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File must be less than 2MB" },
        { status: 400 }
      );
    }

    // Delete old avatar if it exists in Vercel Blob
    const [user] = await db
      .select({ avatarUrl: users.avatarUrl })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (user?.avatarUrl?.includes("vercel-storage.com")) {
      try {
        await del(user.avatarUrl);
      } catch {
        // old blob may already be gone
      }
    }

    const ext = file.name.split(".").pop() || "jpg";
    const blob = await put(`avatars/${session.user.id}.${ext}`, file, {
      access: "public",
      addRandomSuffix: true,
    });

    await db
      .update(users)
      .set({ avatarUrl: blob.url })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({ avatarUrl: blob.url });
  } catch {
    return NextResponse.json(
      { error: "Failed to upload avatar" },
      { status: 500 }
    );
  }
}
