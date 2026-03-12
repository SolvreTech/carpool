"use client";

import { useState } from "react";

export default function BlockRiderButton({
  riderId,
  riderName,
  onBlocked,
}: {
  riderId: string;
  riderName: string;
  onBlocked: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function handleBlock() {
    if (
      !confirm(
        `Block ${riderName}? They will no longer see your carpools and any existing bookings will be cancelled. They will not be notified.`
      )
    )
      return;

    setLoading(true);
    const res = await fetch("/api/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blockedUserId: riderId }),
    });

    setLoading(false);

    if (res.ok) {
      onBlocked();
    }
  }

  return (
    <button
      onClick={handleBlock}
      disabled={loading}
      className="rounded-full px-2 py-1 text-xs text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
    >
      {loading ? "..." : "Block"}
    </button>
  );
}
