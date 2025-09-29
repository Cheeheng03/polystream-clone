"use client";

import React, { useState, useRef, useCallback, ReactNode, useEffect } from 'react';
import { useGlobalRefresh } from '../lib/contexts/GlobalRefreshContext';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh?: () => Promise<void>;
  refreshType?: 'all' | 'user' | 'transactions' | 'vaults' | 'smart' | 'home' | 'portfolio' | 'market' | 'trade' | 'walletOnly';
  disabled?: boolean;
}

export function PullToRefresh({ 
  children, 
  onRefresh, 
  refreshType = 'all',
  disabled = false 
}: PullToRefreshProps) {
  const { 
    refreshAll, 
    refreshUserData, 
    refreshTransactions, 
    refreshVaults, 
    refreshSmart,
    refreshHomePage,
    refreshPortfolioPage,
    refreshMarketPage,
    refreshWalletBalancesOnly,
    isRefreshing 
  } = useGlobalRefresh();

  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [progressWidth, setProgressWidth] = useState(0);
  const startY = useRef(0);
  const currentY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  const maxPullDistance = 80;
  const triggerDistance = 60;

  // Dynamic progress bar effect
  useEffect(() => {
    if (isRefreshing) {
      // Start progress animation
      setProgressWidth(0);
      
      // Gradually increase progress width
      progressInterval.current = setInterval(() => {
        setProgressWidth(prev => {
          // Slow down as it approaches 90%
          if (prev < 50) return prev + 2; // Fast start
          if (prev < 80) return prev + 1; // Medium speed
          if (prev < 90) return prev + 0.5; // Slow down
          return prev + 0.1; // Very slow near the end
        });
      }, 100);
    } else {
      // Complete the progress bar when refresh is done
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
      
      // Quickly fill to 100% then reset
      setProgressWidth(100);
      setTimeout(() => {
        setProgressWidth(0);
      }, 300);
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
    };
  }, [isRefreshing]);

  const getRefreshFunction = useCallback(() => {
    if (onRefresh) return onRefresh;
    
    switch (refreshType) {
      case 'user': return refreshUserData;
      case 'transactions': return refreshTransactions;
      case 'vaults': return refreshVaults;
      case 'smart': return refreshSmart;
      case 'home': return refreshHomePage;
      case 'portfolio': return refreshPortfolioPage;
      case 'market': return refreshMarketPage;
      case 'trade': return refreshAll; // Use refreshAll for trade page
      case 'walletOnly': return refreshWalletBalancesOnly;
      default: return refreshAll;
    }
  }, [onRefresh, refreshType, refreshAll, refreshUserData, refreshTransactions, refreshVaults, refreshSmart, refreshHomePage, refreshPortfolioPage, refreshMarketPage, refreshWalletBalancesOnly]);

  const isAtTop = useCallback(() => {
    const container = containerRef.current;
    if (!container) return false;
    
    // Check if the container itself is scrolled to top
    if (container.scrollTop > 0) return false;
    
    // Also check if the window/document is scrolled to top (for cases where the container doesn't scroll)
    if (window.scrollY > 0) return false;
    
    return true;
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    // Only trigger if we're at the top
    if (isAtTop()) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, [disabled, isRefreshing, isAtTop]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || disabled || isRefreshing) return;
    
    currentY.current = e.touches[0].clientY;
    const distance = currentY.current - startY.current;
    
    if (distance > 0) {
      // Try to prevent default, but don't break if it fails
      try {
        e.preventDefault();
      } catch (error) {
        // Ignore passive event listener errors
      }
      const pullDistance = Math.min(distance * 0.5, maxPullDistance);
      setPullDistance(pullDistance);
    }
  }, [isPulling, disabled, isRefreshing, maxPullDistance]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling || disabled) return;
    
    setIsPulling(false);
    
    if (pullDistance >= triggerDistance && !isRefreshing) {
      // Immediately snap back to original position
      setPullDistance(0);
      
      try {
        const refreshFn = getRefreshFunction();
        await refreshFn();
      } catch (error) {
        console.error('Refresh failed:', error);
      }
    } else {
      setPullDistance(0);
    }
  }, [isPulling, disabled, pullDistance, triggerDistance, isRefreshing, getRefreshFunction]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled || isRefreshing) return;
    
    if (isAtTop()) {
      startY.current = e.clientY;
      setIsPulling(true);
      
      // Add mouse event listeners to document
      const handleMouseMove = (e: MouseEvent) => {
        if (!isPulling || disabled || isRefreshing) return;
        
        currentY.current = e.clientY;
        const distance = currentY.current - startY.current;
        
        if (distance > 0) {
          e.preventDefault();
          const pullDistance = Math.min(distance * 0.5, maxPullDistance);
          setPullDistance(pullDistance);
        }
      };
      
      const handleMouseUp = async () => {
        setIsPulling(false);
        
        if (pullDistance >= triggerDistance && !isRefreshing) {
          // Immediately snap back to original position
          setPullDistance(0);
          
          try {
            const refreshFn = getRefreshFunction();
            await refreshFn();
          } catch (error) {
            console.error('Refresh failed:', error);
          }
        } else {
          setPullDistance(0);
        }
        
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  }, [disabled, isRefreshing, isPulling, pullDistance, triggerDistance, getRefreshFunction, maxPullDistance, isAtTop]);

  return (
    <div 
      ref={containerRef}
      className="relative min-h-full overflow-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      style={{
        transform: `translateY(${pullDistance}px)`,
        transition: isPulling ? 'none' : 'transform 0.3s ease-out',
      }}
    >
      {/* Pull indicator - only show while pulling, not during refresh */}
      {pullDistance > 0 && !isRefreshing && (
        <div 
          className="absolute top-0 left-0 right-0 flex items-center justify-center bg-gray-50/80 backdrop-blur-sm z-50"
          style={{
            height: `${pullDistance}px`,
            transform: `translateY(-${pullDistance}px)`,
            transition: 'none',
          }}
        >
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            <span>
              {pullDistance >= triggerDistance 
                ? 'Release to refresh' 
                : 'Pull to refresh'
              }
            </span>
          </div>
        </div>
      )}

      {/* Dynamic horizontal progress bar - show during refresh */}
      {(isRefreshing || progressWidth > 0) && (
        <div className="absolute top-0 left-0 right-0 z-50">
          <div className="h-1 bg-gray-800/20 overflow-hidden">
            <div 
              className="h-full bg-white shadow-sm transition-all duration-200 ease-out"
              style={{
                width: `${progressWidth}%`,
                boxShadow: '0 0 8px rgba(255, 255, 255, 0.8)'
              }}
            />
          </div>
        </div>
      )}
      
      {children}
    </div>
  );
} 