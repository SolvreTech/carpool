import Link from "next/link";
import { auth } from "@/lib/auth";
import Card from "@/components/ui/card";
import SetPageHeader from "@/components/set-page-header";

export default async function DashboardPage() {
  const session = await auth();
  const firstName = session?.user?.name?.split(" ")[0] || "there";

  return (
    <div className="mx-auto max-w-4xl px-4">
      <SetPageHeader title="Home" />

      {/* Greeting */}
      <div className="mb-8">
        <h1 className="hidden sm:block text-2xl font-bold text-text">Hello, {firstName}!</h1>
        <p className="mt-1 text-text-secondary hidden sm:block">What would you like to do today?</p>
        <p className="sm:hidden text-text-secondary">What would you like to do today?</p>
      </div>

      {/* Role cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/driver">
          <Card className="group cursor-pointer p-6 transition-all hover:shadow-md hover:border-primary/20">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50">
              <svg className="h-7 w-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21M3.375 14.25h.009M21 12.75H3.375m0 0V6.375c0-.621.504-1.125 1.125-1.125h11.25c.621 0 1.125.504 1.125 1.125v3.75m0 0h2.25c.424 0 .81.237 1.003.613l1.496 2.914a1.125 1.125 0 01.148.553V13.5a.75.75 0 01-.75.75h-3" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-text group-hover:text-primary transition-colors">
              I&apos;m Driving
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              Create a carpool and offer rides
            </p>
          </Card>
        </Link>
        <Link href="/rider">
          <Card className="group cursor-pointer p-6 transition-all hover:shadow-md hover:border-primary/20">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50">
              <svg className="h-7 w-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-text group-hover:text-primary transition-colors">
              I Need a Ride
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              Find and book available carpools
            </p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
