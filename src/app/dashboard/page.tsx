import Link from "next/link";
import Navbar from "@/components/navbar";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="mb-8 text-center text-3xl font-bold text-gray-900">
          What would you like to do?
        </h1>
        <div className="grid gap-6 sm:grid-cols-2">
          <Link
            href="/driver"
            className="flex flex-col items-center gap-3 rounded-lg border border-gray-200 bg-white p-8 shadow-sm transition hover:shadow-md"
          >
            <span className="text-4xl">🚗</span>
            <span className="text-xl font-semibold text-gray-900">
              I&apos;m Driving
            </span>
            <span className="text-sm text-gray-500">
              Create a carpool and offer rides
            </span>
          </Link>
          <Link
            href="/rider"
            className="flex flex-col items-center gap-3 rounded-lg border border-gray-200 bg-white p-8 shadow-sm transition hover:shadow-md"
          >
            <span className="text-4xl">🙋</span>
            <span className="text-xl font-semibold text-gray-900">
              I Need a Ride
            </span>
            <span className="text-sm text-gray-500">
              Find and book available carpools
            </span>
          </Link>
        </div>
      </main>
    </div>
  );
}
