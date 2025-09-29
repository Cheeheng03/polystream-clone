"use client";

import React, { useState, useRef, useEffect } from 'react';
import { usePrivy, useMfaEnrollment } from '@privy-io/react-auth';
import { Shield, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';

export const MFAEnrollment = () => {
  const { showMfaEnrollmentModal } = useMfaEnrollment();
  const { user } = usePrivy();
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Use ref to track MFA status
  const mfaStatusRef = useRef<boolean | null>(null);

  // Check if user is already enrolled in MFA
  const isMfaEnabled = user?.mfaMethods && user.mfaMethods.length > 0;

  console.log('User MFA Methods:', user?.mfaMethods);
  console.log('Is MFA Enabled:', isMfaEnabled);

  // Watch for MFA status changes (for when modal doesn't resolve properly)
  useEffect(() => {
    if (mfaStatusRef.current !== null) {
      const hadMfaBefore = mfaStatusRef.current;
      const hasMfaAfter = !!isMfaEnabled;
      
      console.log('🔍 MFA Status Watcher:', { hadMfaBefore, hasMfaAfter });
      
      // If user had MFA before but doesn't now = disabled
      if (hadMfaBefore === true && hasMfaAfter === false) {
        console.log('🔄 MFA DISABLED DETECTED via watcher - refreshing page...');
        mfaStatusRef.current = null; // Reset to prevent re-triggering
        setIsRefreshing(true);
        
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    }
  }, [isMfaEnabled]); // Watch for changes in MFA status

  const handleEnrollMFA = async () => {
    setIsEnrolling(true);
    
    // Set a timeout to reset loading state in case modal doesn't resolve
    const resetTimeout = setTimeout(() => {
      console.log('⏰ MFA enrollment timeout - resetting button state');
      setIsEnrolling(false);
    }, 2000); // 2 second timeout
    
    try {
      console.log('Starting MFA enrollment...');
      await showMfaEnrollmentModal();
      console.log('✅ MFA enrollment modal completed');
    } catch (error) {
      console.error('MFA enrollment failed:', error);
    } finally {
      clearTimeout(resetTimeout);
      setIsEnrolling(false);
    }
  };

  const handleManageMFA = async () => {
    setIsEnrolling(true);
    
    // Set a timeout to reset loading state in case modal doesn't resolve
    const resetTimeout = setTimeout(() => {
      console.log('⏰ MFA management timeout - resetting button state');
      setIsEnrolling(false);
    }, 2000); // 2 second timeout
    
    try {
      // Store current MFA status BEFORE modal
      const hadMfaBefore = !!isMfaEnabled;
      mfaStatusRef.current = hadMfaBefore;
      
      console.log('📱 Opening MFA management...', { 
        hadMfaBefore, 
        mfaMethods: user?.mfaMethods 
      });
      
      // Open MFA management modal (may not resolve if MFA is disabled)
      try {
        await showMfaEnrollmentModal();
        console.log('✅ MFA management modal completed normally');
      } catch (modalError) {
        console.log('⚠️ MFA modal error or early close:', modalError);
      }
      
      // Reset tracking after 5 seconds if no changes detected
      setTimeout(() => {
        if (mfaStatusRef.current !== null) {
          console.log('🔄 Resetting MFA tracking after timeout');
          mfaStatusRef.current = null;
        }
      }, 5000);
      
    } catch (error) {
      console.error('❌ MFA management failed:', error);
      mfaStatusRef.current = null; // Reset on error
    } finally {
      clearTimeout(resetTimeout);
      setIsEnrolling(false);
    }
  };

  // Show refreshing state
  if (isRefreshing) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-800 mb-1">
              Refreshing Session
            </h3>
            <p className="text-blue-700 text-sm">
              MFA settings changed. Refreshing to ensure clean session state...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isMfaEnabled) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Check className="w-4 h-4 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-green-800 mb-1">
              Transaction Security Enabled
            </h3>
            <p className="text-green-700 text-sm mb-3">
              Your transactions are protected with multi-factor authentication. 
              You'll be prompted to confirm each transaction using your preferred method.
              {' '}
              <span className="text-green-600 font-medium">
                *No MFA required for 15 minutes after successful verification.
              </span>
            </p>
            <p className="text-xs text-green-600 mb-3">
              Active MFA methods: {user?.mfaMethods?.map(method => method.toUpperCase()).join(', ')}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleManageMFA}
                disabled={isEnrolling}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isEnrolling ? "Opening..." : "Manage MFA Settings"}
              </Button>
            </div>
            <p className="text-xs text-green-600 mt-2">
              Note: Page will refresh automatically if MFA is disabled
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
          <AlertCircle className="w-4 h-4 text-yellow-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-yellow-800 mb-1 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Enhanced Transaction Security
          </h3>
          <p className="text-yellow-700 text-sm mb-3">
            Enable multi-factor authentication to add an extra layer of security to your transactions. 
            You'll be prompted to confirm each transaction using your preferred authentication method 
            (Face ID, Touch ID, authenticator app, or SMS).
          </p>
          <Button
            size="sm"
            onClick={handleEnrollMFA}
            disabled={isEnrolling}
            className="bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            {isEnrolling ? "Opening Setup..." : "Enable Transaction Security"}
          </Button>
          <p className="text-xs text-yellow-600 mt-2">
            Recommended: Use Face ID or Touch ID for the best experience
          </p>
        </div>
      </div>
    </div>
  );
};