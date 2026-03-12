"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Avatar from "./ui/avatar";
import BottomNav from "./bottom-nav";

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/driver", label: "Driver" },
    { href: "/rider", label: "Rider" },
  ];

  return (
    <>
      {/* Desktop top nav */}
      <nav className="hidden sm:block border-b border-border bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-lg font-bold text-primary">
              Anatolia Carpool
            </Link>
            <div className="flex gap-1">
              {links.map((link) => (
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
            {session?.user?.name && (
              <Avatar name={session.user.name} size="sm" />
            )}
            <span className="text-sm text-text-secondary">{session?.user?.name}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="rounded-full px-3 py-1.5 text-sm text-text-secondary hover:bg-gray-50 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile top bar */}
      <nav className="sm:hidden border-b border-border bg-white">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="text-lg font-bold text-primary">
            Anatolia Carpool
          </Link>
          <div className="flex items-center gap-2">
            {session?.user?.name && (
              <Avatar name={session.user.name} size="sm" />
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-sm text-text-secondary"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <BottomNav />
    </>
  );
}
