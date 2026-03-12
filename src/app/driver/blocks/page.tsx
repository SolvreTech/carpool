"use client";

import { useEffect, useState, useCallback } from "react";
import Navbar from "@/components/navbar";
import Card from "@/components/ui/card";
import Avatar from "@/components/ui/avatar";
import Button from "@/components/ui/button";
import EmptyState from "@/components/ui/empty-state";
import { SkeletonCard } from "@/components/ui/skeleton";

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
    <div className="min-h-screen bg-surface-secondary">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-6 pb-24 sm:pb-8">
        <h1 className="mb-6 text-2xl font-bold text-text">
          Blocked Riders
        </h1>

        {loading && (
          <div className="space-y-3">
            {[1, 2].map((i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {!loading && blocks.length === 0 && (
          <EmptyState
            icon={
              <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            }
            title="No blocked riders"
            description="Riders you block will appear here"
          />
        )}

        <div className="space-y-3">
          {blocks.map((block) => (
            <Card key={block.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={block.blockedUserName} size="sm" />
                  <div>
                    <p className="font-medium text-text">
                      {block.blockedUserName}
                    </p>
                    <p className="text-xs text-text-muted">
                      Blocked on{" "}
                      {new Date(block.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    handleUnblock(block.id, block.blockedUserName)
                  }
                >
                  Unblock
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
