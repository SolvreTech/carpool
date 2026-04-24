import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { signMobileJWT } from "@/lib/api-auth";

export async function POST(request: Request) {
  try {
    const { fullName, username, password } = await request.json();
    if (!fullName?.trim() || !username?.trim() || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.username, username.trim()))
      .limit(1);
    if (existing) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [created] = await db
      .insert(users)
      .values({
        fullName: fullName.trim(),
        username: username.trim(),
        passwordHash,
      })
      .returning();

    const token = await signMobileJWT({
      id: created.id,
      name: created.fullName,
      email: created.username,
    });

    return NextResponse.json(
      {
        token,
        user: { id: created.id, name: created.fullName, email: created.username },
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
