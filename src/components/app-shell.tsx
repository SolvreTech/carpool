"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Avatar from "./ui/avatar";
import BottomNav from "./bottom-nav";
import MobileHeader from "./mobile-header";
import { PageHeaderProvider } from "./page-header-context";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/driver", label: "Driver" },
  { href: "/rider", label: "Rider" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.avatarUrl) setAvatarUrl(data.avatarUrl);
      })
      .catch(() => {});
  }, [session?.user?.id]);

  return (
    <PageHeaderProvider>
      <div className="min-h-screen bg-surface-secondary">
        {/* Desktop top nav */}
        <nav className="hidden sm:block border-b border-border bg-white">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="text-lg font-bold text-primary">
                Anatolia Carpool
              </Link>
              <div className="flex gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                      pathname.startsWith(link.href)
                        ? "bg-primary-50 text-primary"
                        : "text-text-secondary hover:text-text hover:bg-gray-50"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-text-secondary hover:bg-gray-50 transition-colors"
              >
                {session?.user?.name && (
                  <Avatar name={session.user.name} imageUrl={avatarUrl} size="sm" />
                )}
                <span>{session?.user?.name}</span>
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="rounded-full px-3 py-1.5 text-sm text-text-secondary hover:bg-gray-50 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile header */}
        <MobileHeader />

        {/* Main content */}
        <main className="py-6 pb-20 sm:pb-6">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <BottomNav />
      </div>
    </PageHeaderProvider>
  );
}
