import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { carpools } from "@/db/schema";
import { and, eq } from "drizzle-orm";

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
