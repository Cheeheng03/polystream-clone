"use client";
import React, { useEffect, useState } from "react";
import PwaTutorialModal from "./PwaTutorialModal";

export default function PwaTutorialModalWrapper() {
  const [showTutorial, setShowTutorial] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "other">("other");

  useEffect(() => {
    // Platform detection
    const ua = typeof window !== "undefined" ? window.navigator.userAgent : "";
    let detectedPlatform: "ios" | "android" | "other" = "other";
    if (/iPhone|iPad|iPod/.test(ua)) detectedPlatform = "ios";
    else if (/Android/.test(ua)) detectedPlatform = "android";
    setPlatform(detectedPlatform);

    // Standalone mode detection
    const isStandalone = () => {
      return (
        (typeof window !== "undefined" && window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
        (typeof window !== "undefined" && (window.navigator as any).standalone === true)
      );
    };

    if (!isStandalone() && (detectedPlatform === "ios" || detectedPlatform === "android")) {
      setShowTutorial(true);
    }
  }, []);

  return (
    <PwaTutorialModal open={showTutorial} onClose={() => setShowTutorial(false)} platform={platform} />
  );
} 