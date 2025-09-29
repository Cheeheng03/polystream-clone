"use client";

import React from "react";
import { ArrowLeft, Shield, Key, Smartphone, Bell, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "../components/ui/button";
import { MFAEnrollment } from "../components/security/MFAEnrollment";

export default function SettingsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center px-4 pt-4 flex-shrink-0">
        <button className="mr-2 p-2 rounded-full" onClick={() => router.back()}>
          <ArrowLeft className="w-6 h-6 text-primary" />
        </button>
        <h1 className="text-lg font-bold ml-2">Settings</h1>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto space-y-6 pb-28 p-6">
        
        {/* Security Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Security</h2>
          </div>
          
          {/* MFA Enrollment */}
          {/* <MFAEnrollment />  Hide this for now*/}
          
          {/* Future Security Settings */}
          <div className="bg-card border rounded-xl p-4 opacity-50">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                <Key className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-muted-foreground mb-1">
                  Recovery Methods
                </h3>
                <p className="text-muted-foreground text-sm">
                  Set up backup recovery options for your wallet.
                </p>
                <p className="text-xs text-muted-foreground mt-2">Coming soon</p>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-4 opacity-50">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-muted-foreground mb-1">
                  Device Management
                </h3>
                <p className="text-muted-foreground text-sm">
                  Manage trusted devices and sessions.
                </p>
                <p className="text-xs text-muted-foreground mt-2">Coming soon</p>
              </div>
            </div>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold">Preferences</h2>
          </div>
          
          <div className="bg-card border rounded-xl p-4 opacity-50">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                <Bell className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-muted-foreground mb-1">
                  Notifications
                </h3>
                <p className="text-muted-foreground text-sm">
                  Configure transaction and account notifications.
                </p>
                <p className="text-xs text-muted-foreground mt-2">Coming soon</p>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-4 opacity-50">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                <Lock className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-muted-foreground mb-1">
                  Privacy
                </h3>
                <p className="text-muted-foreground text-sm">
                  Control your privacy and data sharing preferences.
                </p>
                <p className="text-xs text-muted-foreground mt-2">Coming soon</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}