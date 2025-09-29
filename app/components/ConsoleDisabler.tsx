"use client";

import { useEffect } from "react";
import { disableConsoleInProduction } from "../lib/utils/console-override";

export default function ConsoleDisabler() {
  useEffect(() => {
    disableConsoleInProduction();
  }, []);

  return null; // This component doesn't render anything
} 