"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";

export default function SignIn() {
  const [isHovering, setIsHovering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login, authenticated, ready, user: privyUser } = usePrivy();
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      localStorage.setItem("referralCode", ref);
    }
  }, [searchParams]);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await login();
    } catch (error) {
      console.error("Sign in failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12 bg-background">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <div className="flex justify-center mb-8">
            <Image
              src="/polystream_logo_trans.png"
              alt="Polystream Logo"
              width={90}
              height={60}
              priority
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-3 text-foreground">
            Welcome to Polystream
          </h1>
          <p className="text-sm text-muted-foreground">
            The simplest way to earn crypto yields
          </p>
        </div>

        <div className="p-6 mb-6">
          <button
            onClick={handleSignIn}
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center ${
              isLoading
                ? "bg-muted"
                : isHovering
                ? "bg-primary/90"
                : "bg-primary"
            } text-primary-foreground ${
              isLoading ? "cursor-not-allowed" : "cursor-pointer"
            }`}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            {isLoading ? (
              "Connecting..."
            ) : (
              <div className="flex items-center justify-center">
                <Image
                  src="/privy-logo-white.png"
                  alt="Privy"
                  width={20}
                  height={20}
                  className="mr-2"
                />
                <span>Get Started</span>
              </div>
            )}
          </button>

          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              By continuing, you agree to our{" "}
              <a href="/terms" className="underline text-primary">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" className="underline text-primary">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
