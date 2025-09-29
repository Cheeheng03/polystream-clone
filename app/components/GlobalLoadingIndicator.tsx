"use client";

import React, { useState, useEffect } from 'react';
import { useGlobalRefresh } from '../lib/contexts/GlobalRefreshContext';

export function GlobalLoadingIndicator() {
  const { isRefreshing } = useGlobalRefresh();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isRefreshing) return null;

  return (
    <div 
      className="fixed left-1/2 transform -translate-x-1/2 z-[9999] transition-all duration-300 ease-out"
      style={{ 
        top: `${Math.max(90, scrollY * 0.3 + 90)}px`,
      }}
    >
      <svg 
        className="animate-spin h-8 w-8 text-gray-300" 
        fill="none" 
        viewBox="0 0 24 24"
      >
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="2"
        />
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
}