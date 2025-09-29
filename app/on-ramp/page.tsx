"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Copy, Check, ExternalLink, AlertCircle, CheckIcon, X } from "lucide-react";
import { motion } from "framer-motion";
import { useMultiChainSmartWallet, formatAddress } from "@/app/lib/hooks";
import { Button } from "@/app/components/ui/button";
import Image from "next/image";

type Step = 1 | 2 | 3;

export default function OnRampPage() {
  const router = useRouter();
  const { data: walletSummary, isLoading } = useMultiChainSmartWallet();
  const [copied, setCopied] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>(1);

  const smartAccountAddress = walletSummary?.smartAccountAddress;

  const handleCopyAddress = async () => {
    if (!smartAccountAddress) return;

    try {
      await navigator.clipboard.writeText(smartAccountAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy address", error);
    }
  };

  const handleOpenSwapped = () => {
    window.open(
      "https://swapped.com/buy/usdc#buy",
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleBack = () => {
    if (currentStep === 1) {
      router.back();
    } else {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as Step);
    } else {
      router.push("/portfolio");
    }
  };

  return (
    <div className="bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center px-6 pt-6">
        <button
          className="mr-4 p-2 rounded-full hover:bg-muted/50 transition-colors"
          onClick={handleBack}
        >
          <ArrowLeft className="w-6 h-6 text-primary" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-col justify-between px-8 max-w-lg mx-auto py-11 w-full h-[83vh]">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Buy USDC</h1>
          <p className="text-lg text-muted-foreground">
            Step {currentStep} of 3
          </p>
        </div>

        {/* Step Content */}
        <div className="space-y-12">
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Go to Swapped.com</h3>
                  <p className="text-sm text-muted-foreground">
                    Sign up or log in to Swapped.com to start your purchase.
                  </p>
                </div>
              </div>
              <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-lg flex items-center justify-center bg-white">                <Image
                src="/swappedcom.jpeg"
                alt="Swapped.com interface"
                fill
                className="object-contain"
              />
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Select USDC on Base</h3>
                  <p className="text-sm text-muted-foreground">
                    In the &quot;Receive&quot; section, select USDC token on
                    Base network and choose your payment method.
                  </p>
                </div>
              </div>
              <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-lg">
                <video
                  src="/buyusdcbase.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="flex items-center gap-4 mb-2">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Copy your address</h3>
                  {isLoading ? (
                    <div className="h-10 bg-muted/30 animate-pulse rounded-lg"></div>
                  ) : (
                    <div className="flex items-center gap-2 bg-muted/20 rounded-lg pt-1">
                      <span className="font-mono text-sm text-muted-foreground flex-1">
                        {smartAccountAddress
                          ? formatAddress(smartAccountAddress)
                          : ""}
                      </span>
                      <button
                        onClick={handleCopyAddress}
                        className="flex items-center gap-1 text-primary font-medium text-sm hover:text-primary/80 transition-colors"
                        disabled={!smartAccountAddress}
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground mt-2">
                    <span>Paste this address in Swapped.com and complete your payment.</span>
                  </p>
                </div>

              </div>

              <div className="bg-gray-50 p-4 flex items-start gap-2 rounded-lg mt-2 mb-4">
                <AlertCircle className="w-4 h-4 mt-1 text-gray-600" />
                <div className="flex flex-col gap-1.5">
                  <span className="text-light text-gray-600 text-sm">
                    Please make sure you are selecting the right token:
                  </span>
                  <div className="flex flex-row gap-5">
                    <div className="flex"><CheckIcon className="w-5 h-5 mr-1 text-green-600" /><span className="font-regular text-sm no-underline">USDC (BASE) </span></div>
                    <div className="flex"><X className="w-5 h-5 mr-1 text-red-700" /><span className="font-light text-sm"> USDC (ERC20)</span></div>
                  </div>

                </div>
              </div>

              <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-lg flex items-center justify-center bg-white">                <Image
                src="/pasteaddress.png"
                alt="Paste address in Swapped.com"
                fill
                className="object-contain"
              />
              </div>
            </motion.div>
          )}
        </div>

        {/* Action Button */}
        <div className="flex flex-col gap-4 mt-8">
          {currentStep === 3 && (
            <>

              <Button
                onClick={handleOpenSwapped}
                className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
              >
                <span className="mr-2">Open Swapped.com</span>
                <ExternalLink className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground text-center">
                It will take 5-10 minutes to receive USDC.
              </span>
            </>
          )}

          <Button
            onClick={handleNext}
            className="w-full h-12 text-base font-semibold bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-xl mb-12"
            disabled={currentStep === 3 && !smartAccountAddress}
          >
            {currentStep === 3 ? "Done" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}
