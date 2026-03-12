"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: formData.get("fullName"),
        username: formData.get("username"),
        password,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Registration failed");
    } else {
      router.push("/login");
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-primary-50">
      {/* Green accent header */}
      <div className="flex flex-col items-center justify-center bg-primary px-4 pb-12 pt-16">
        <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
          <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white">Create Account</h1>
        <p className="mt-1 text-sm text-white/70">Join Anatolia Carpool</p>
      </div>

      {/* White card bottom sheet */}
      <div className="-mt-6 flex flex-1 justify-center">
        <div className="w-full max-w-md rounded-t-3xl bg-white px-6 pt-8 pb-8 shadow-lg sm:mt-0 sm:rounded-3xl sm:mb-auto">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>
            )}
            <div>
              <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-text-secondary">
                Full Name
              </label>
              <Input id="fullName" name="fullName" type="text" required placeholder="Enter your full name" />
            </div>
            <div>
              <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-text-secondary">
                Username
              </label>
              <Input id="username" name="username" type="text" required placeholder="Choose a username" />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-text-secondary">
                Password
              </label>
              <Input id="password" name="password" type="password" required minLength={6} placeholder="Min 6 characters" />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-text-secondary">
                Confirm Password
              </label>
              <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={6} placeholder="Confirm your password" />
            </div>
            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? "Creating account..." : "Register"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-text-secondary">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
