"use client";
import { X, Smartphone, Plus } from "lucide-react";
import React from "react";

interface PwaTutorialModalProps {
  open: boolean;
  onClose: () => void;
  platform: "ios" | "android" | "other";
}

const instructions = {
  ios: (
    <div className="flex flex-wrap justify-center items-center text-xs text-gray-500 space-x-1">
      <span>Open in</span>
      <span className="text-gray-800 font-semibold">Safari</span>
      <span>·</span>
      <span>Tap</span>
      {/* Use downloaded iOS share icon SVG */}
      <img src="/share-apple-svgrepo-com.svg" alt="Share" className="w-4 h-4" />
      <span>then</span>
      <span className="text-gray-800 font-semibold">"Add to Home Screen"</span>
    </div>
  ),
  android: (
    <div className="flex flex-wrap justify-center items-center text-xs text-gray-500 space-x-1">
      <span>Open in</span>
      <span className="text-gray-800 font-semibold">Chrome</span>
      <span>·</span>
      <span>Tap</span>
      <span className="text-gray-700 text-xs leading-none">⋮</span>
      <span>then</span>
      <span className="text-gray-800 font-semibold">"Add to Home Screen"</span>
    </div>
  ),
  other: (
    <div className="flex flex-wrap justify-center items-center text-xs text-gray-500 space-x-1">
      <span>Please use</span>
      <span className="text-gray-800 font-semibold">Safari on iOS</span>
      <span>or</span>
      <span className="text-gray-800 font-semibold">Chrome on Android</span>
      <span>for best experience</span>
    </div>
  ),
};

export default function PwaTutorialModal({ open, onClose, platform }: PwaTutorialModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-md w-full mx-4 relative shadow-xl">
        {/* Close button */}
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors duration-200"
          onClick={onClose}
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="text-center space-y-6">
          {/* Character Illustration - Clean White Background */}
          <div className="flex justify-center">
            <div className="w-32 h-32 rounded-2xl overflow-hidden">
              <img
                src="/character-with-phone.png"
                alt="Person using smartphone"
                className="w-full h-full object-contain"
                style={{ imageRendering: "crisp-edges" }}
              />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h2 className="text-gray-900 text-xl font-semibold">Install Polystream</h2>
            <p className="text-gray-600 text-sm">Add this Progressive Web App to your device for quick access</p>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-gray-200"></div>

          {/* Instructions */}
          <div>{instructions[platform]}</div>
        </div>
      </div>
    </div>
  );
} 