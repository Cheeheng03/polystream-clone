"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { useRegisterUsername } from "@/app/lib/hooks";

interface ApiError {
  response?: {
    data?: {
      message: string;
    };
  };
}

export default function OnboardingPage() {
  const router = useRouter();
  const { authenticated } = usePrivy();

  const [referralCode, setReferralCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Use the hooks
  const registerUsername = useRegisterUsername();

  useEffect(() => {
    if (!referralCode) {
      const storedRef = localStorage.getItem("referralCode");
      if (storedRef) {
        setReferralCode(storedRef);
      }
    }
  }, [referralCode]);

  if (!authenticated) {
    return null;
  }

  const handleReferralCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReferralCode(e.target.value);
    setError("");
  };

  const handleComplete = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Use "User" as default if no username is entered
      const finalName = displayName.trim() || "User";

      // Register username with tracker API and wait for it to complete
      await registerUsername.mutateAsync({
        username: finalName,
        referralCode: referralCode || undefined,
      });

      // Add a small delay to ensure the status is updated
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Clear referral code from localStorage after onboarding
      localStorage.removeItem("referralCode");

      router.replace("/home");
    } catch (err: unknown) {
      console.error("Error completing onboarding:", err);

      // Handle specific referral code errors
      const apiError = err as ApiError;
      // Handle direct Error object thrown from useRegisterUsername
      if (err instanceof Error && err.message === "Invalid referral code: Code does not exist") {
        setError("Invalid referral code. Please try again or skip this step.");
      } else if (apiError?.response?.data?.message) {
        const errorMessage = apiError.response.data.message;
        if (errorMessage === "Invalid referral code format") {
          setError("Please enter a valid referral code format");
        } else if (
          errorMessage === "Invalid referral code: Code does not exist"
        ) {
          setError(
            "Invalid referral code. Please try again or skip this step."
          );
        } else {
          setError("Failed to complete setup. Please try again.");
        }
      } else {
        setError("Failed to complete setup. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-start space-y-3 flex flex-col gap-2">
          <h1 className="text-4xl font-bold text-primary">
            Welcome to Polystream
          </h1>
          <p className="text-muted-foreground">
            Let&apos;s get you set up with your account
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Username
              </label>
              <Input
                placeholder="User"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="h-12 text-lg border-2 bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Referral Code (Optional)
              </label>
              <Input
                placeholder="Enter referral code"
                value={referralCode}
                onChange={handleReferralCodeChange}
                className={`h-12 text-lg border-2 bg-background/50 ${
                  error && error.includes("referral code")
                    ? "border-red-500"
                    : ""
                }`}
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <div className="space-y-3">
            <Button
              onClick={handleComplete}
              className="w-full h-12 text-base font-medium rounded-3xl"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Setting up...
                </div>
              ) : (
                "Complete Setup"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
