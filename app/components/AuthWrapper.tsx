"use client";

import { useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useOnboardingStatus } from "../lib/hooks";
import TabNavigation from "./ui/TabNavigation";

interface AuthWrapperProps {
  children: React.ReactNode;
}

// Paths that don't require authentication
const PUBLIC_PATHS = ["/sign-in", "/terms", "/privacy"];

// Paths that don't show tab navigation
const NO_TAB_PATHS = [
  "/",
  "/sign-in",
  "/onboarding",
  "/on-ramp",
  "/receive/select-token",
  "/receive/select-network",
  "/vault/stableyield",
  "/vault/degenyield",
  "/withdraw",
  "/terms",
  "/privacy",
  "/transactions",
  "/support",
  "/buy",
  "/settings",
  "/learn/how-it-works",
  "/learn/what-is-defi",
  "/swap",
  "/receive/address",
  "/transaction/[hash]",
  "/chart/[token]",
  
];

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const { ready: privyReady, authenticated } = usePrivy();
  const { ready: walletsReady } = useWallets();
  const { data: isOnboarded, isLoading: onboardingLoading } =
    useOnboardingStatus();
  const router = useRouter();
  const pathname = usePathname();

  // Combined loading state - only wait for critical auth components
  const isLoading =
    !privyReady ||
    !walletsReady ||
    (authenticated && onboardingLoading && isOnboarded === undefined);

  // Auth state determination
  const authState = useMemo(() => {
    if (isLoading) return "loading";
    if (!authenticated) return "unauthenticated";
    // Only check onboarding status when we have the data (not undefined)
    if (authenticated && isOnboarded === false) return "needs-onboarding";
    if (authenticated && isOnboarded === true) return "authenticated";
    return "unknown";
  }, [isLoading, authenticated, isOnboarded]);

  // Route determination based on auth state and current path
  const shouldRedirect = useMemo(() => {
    if (!pathname) return null; // Handle null pathname

    const isPublicPath = PUBLIC_PATHS.includes(pathname);

    switch (authState) {
      case "loading":
        return null; // Don't redirect while loading

      case "unauthenticated":
        return !isPublicPath ? "/sign-in" : null;

      case "needs-onboarding":
        // Always redirect to onboarding if not onboarded, unless already there
        if (pathname !== "/onboarding") {
          return "/onboarding";
        }
        return null;

      case "authenticated":
        // Only redirect to home if onboarded and on sign-in, onboarding, or root
        if (
          pathname === "/sign-in" ||
          pathname === "/" ||
          pathname === "/onboarding"
        ) {
          return "/home";
        }
        return null;

      default:
        return null;
    }
  }, [authState, pathname]);

  // Handle redirects
  useEffect(() => {
    if (shouldRedirect) {
      router.push(shouldRedirect);
    }
  }, [shouldRedirect, router]);

  // Show loading spinner while initializing - but only for critical auth states
  if (authState === "loading" && (!privyReady || !walletsReady)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-beige">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render content if we're about to redirect
  if (shouldRedirect) {
    return null;
  }

  // Tab navigation helpers
  const getActiveTab = () => {
    if (!pathname) return "home"; // Handle null pathname
    if (pathname.startsWith("/home")) return "home";
    if (pathname.startsWith("/market")) return "market";
    if (pathname.startsWith("/rewards")) return "rewards";
    if (pathname.startsWith("/portfolio")) return "portfolio";
    return "home";
  };

  const shouldShowTabs = pathname
    ? !NO_TAB_PATHS.some((path) => {
        // Handle dynamic routes by checking if the pathname starts with the base path
        if (path.includes("[")) {
          const basePath = path.split("[")[0];
          return pathname.startsWith(basePath);
        }
        return pathname === path;
      })
    : false;

  return (
    <>
      <div className="absolute inset-0 bg-beige overflow-y-auto">
        <main className="relative">{children}</main>
      </div>
      {shouldShowTabs && <TabNavigation activeTab={getActiveTab()} />}
    </>
  );
}
