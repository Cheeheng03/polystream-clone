"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center p-5 bg-background"
    >
      <div className="text-center">
        <h1
          className="text-4xl font-bold mb-4 text-foreground"
        >
          404
        </h1>
        <h2
          className="text-xl font-medium mb-6 text-foreground"
        >
          Page Not Found
        </h2>
        <p className="mb-8 text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/home"
          className="py-3 px-6 rounded-lg font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Go to Home
        </Link>
      </div>
    </main>
  );
}
