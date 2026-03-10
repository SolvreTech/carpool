"use client";

import { useEffect, useState, useCallback } from "react";
import Navbar from "@/components/navbar";

interface Block {
  id: string;
  blockedUserId: string;
  blockedUserName: string;
  createdAt: string;
}

export default function BlocksPage() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBlocks = useCallback(async () => {
    const res = await fetch("/api/blocks");
    const data = await res.json();
    setBlocks(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  async function handleUnblock(id: string, name: string) {
    if (!confirm(`Unblock ${name}? They will be able to see and book your carpools again.`))
      return;

    const res = await fetch(`/api/blocks/${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchBlocks();
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">
          Blocked Riders
        </h1>

        {loading && <p className="text-gray-500">Loading...</p>}

        {!loading && blocks.length === 0 && (
          <p className="text-gray-500">No blocked riders.</p>
        )}

        <div className="space-y-3">
          {blocks.map((block) => (
            <div
              key={block.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div>
                <p className="font-medium text-gray-900">
                  {block.blockedUserName}
                </p>
                <p className="text-sm text-gray-500">
                  Blocked on{" "}
                  {new Date(block.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() =>
                  handleUnblock(block.id, block.blockedUserName)
                }
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Unblock
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
