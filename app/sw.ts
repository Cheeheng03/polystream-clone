// app/sw.ts
import { Serwist } from "serwist";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";

// Declare the injection point for TypeScript
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}
declare const self: WorkerGlobalScope;

// Initialize Serwist with precache manifest
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,      // Activate new SW immediately
  clientsClaim: true,     // Take control of uncontrolled clients
  navigationPreload: true,
});

// Register built-in precaching and routing
serwist.addEventListeners();