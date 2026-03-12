import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { carpools, driverLocations } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// SSE endpoint for riders to track driver location
export async function GET(
  request: Request,
  { params }: { params: Promise<{ carpoolId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { carpoolId } = await params;

  // Verify carpool exists and is active
  const [carpool] = await db
    .select()
    .from(carpools)
    .where(and(eq(carpools.id, carpoolId), eq(carpools.isActive, true)))
    .limit(1);

  if (!carpool) {
    return NextResponse.json({ error: "Carpool not active" }, { status: 404 });
  }

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch {
          closed = true;
        }
      };

      // Poll DB every 3 seconds
      const interval = setInterval(async () => {
        if (closed) {
          clearInterval(interval);
          return;
        }

        try {
          const [location] = await db
            .select()
            .from(driverLocations)
            .where(eq(driverLocations.carpoolId, carpoolId))
            .limit(1);

          // Check if still active
          const [cp] = await db
            .select({ isActive: carpools.isActive })
            .from(carpools)
            .where(eq(carpools.id, carpoolId))
            .limit(1);

          if (!cp?.isActive) {
            sendEvent(JSON.stringify({ type: "stopped" }));
            clearInterval(interval);
            closed = true;
            controller.close();
            return;
          }

          if (location) {
            sendEvent(
              JSON.stringify({
                type: "location",
                latitude: location.latitude,
                longitude: location.longitude,
                heading: location.heading,
                updatedAt: location.updatedAt,
              })
            );
          }
        } catch {
          // Connection may have closed
        }
      }, 3000);

      // Send initial location immediately
      try {
        const [location] = await db
          .select()
          .from(driverLocations)
          .where(eq(driverLocations.carpoolId, carpoolId))
          .limit(1);

        if (location) {
          sendEvent(
            JSON.stringify({
              type: "location",
              latitude: location.latitude,
              longitude: location.longitude,
              heading: location.heading,
              updatedAt: location.updatedAt,
            })
          );
        }
      } catch {
        // ignore
      }

      // Clean up after 5 minutes (Vercel timeout protection)
      setTimeout(() => {
        closed = true;
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          // already closed
        }
      }, 5 * 60 * 1000);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
