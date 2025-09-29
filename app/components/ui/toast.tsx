"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, X } from "lucide-react";

export type ToastStatus = 'processing' | 'success' | 'error';

export interface ToastData {
  id: string;
  status: ToastStatus;
  message: string;
  duration?: number; // Optional custom duration
}

interface ToastContextType {
  showToast: (status: ToastStatus, message: string, duration?: number) => string;
  hideToast: (id: string) => void;
  hideAllToasts: () => void;
  hideProcessingToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastItemProps {
  toast: ToastData;
  onClose: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (toast.status === 'success') {
      const duration = toast.duration || 2000;
      const timer = setTimeout(() => {
        onClose(toast.id);
      }, duration);
      return () => clearTimeout(timer);
    } else if (toast.status === 'error') {
      const duration = toast.duration || 5000;
      const timer = setTimeout(() => {
        onClose(toast.id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: -20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -20 }}
      transition={{ 
        type: "spring",
        damping: 20,
        stiffness: 300
      }}
      className="mx-auto mb-4 flex flex-col items-center"
    >
      <div className="relative">
        {/* Main Circle */}
        <div className="w-20 h-20 bg-white/95 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg border border-gray-200">
          {toast.status === 'processing' && (
            <div className="w-10 h-10 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
          )}
          
          {toast.status === 'success' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring",
                damping: 15,
                stiffness: 400
              }}
              className="flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  delay: 0.1,
                  type: "spring",
                  damping: 10,
                  stiffness: 400
                }}
              >
                <Check className="w-10 h-10 text-green-500" strokeWidth={2.5} />
              </motion.div>
            </motion.div>
          )}
          
          {toast.status === 'error' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring",
                damping: 15,
                stiffness: 400
              }}
              className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center"
            >
              <X className="w-6 h-6 text-white" strokeWidth={3} />
            </motion.div>
          )}
        </div>
        
        {/* Subtle outer glow for error */}
        {toast.status === 'error' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.3, scale: 1.1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="absolute inset-0 bg-red-400 rounded-full blur-sm -z-10"
          />
        )}
      </div>

      {/* Processing Message */}
      {toast.status === 'processing' && toast.message && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            delay: 0.2,
            type: "spring",
            damping: 20,
            stiffness: 300
          }}
          className="mt-3 max-w-xs px-4 py-2 bg-white/95 backdrop-blur-md rounded-lg shadow-lg border border-gray-200 text-center"
        >
          <p className="text-sm text-gray-700 font-medium">{toast.message}</p>
        </motion.div>
      )}

      {/* Error Message */}
      {toast.status === 'error' && toast.message && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            delay: 0.2,
            type: "spring",
            damping: 20,
            stiffness: 300
          }}
          className="mt-3 max-w-xs px-4 py-2 bg-white/95 backdrop-blur-md rounded-lg shadow-lg border border-gray-200 text-center"
        >
          <p className="text-sm text-gray-700 font-medium">{toast.message}</p>
        </motion.div>
      )}
    </motion.div>
  );
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = (status: ToastStatus, message: string, duration?: number): string => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newToast: ToastData = { id, status, message, duration };
    
    // If showing success or error, update any existing processing toast instead of creating new one
    if (status === 'success' || status === 'error') {
      setToasts(prev => {
        const processingToastIndex = prev.findIndex(toast => toast.status === 'processing');
        if (processingToastIndex >= 0) {
          // Update existing processing toast to success/error
          const updatedToasts = [...prev];
          updatedToasts[processingToastIndex] = { ...updatedToasts[processingToastIndex], status, message, duration };
          return updatedToasts;
        } else {
          // No processing toast found, create new one but remove any other success/error toasts
          return prev.filter(toast => toast.status === 'processing').concat(newToast);
        }
      });
    } else {
      setToasts(prev => [...prev, newToast]);
    }
    
    return id;
  };

  const hideToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const hideAllToasts = () => {
    setToasts([]);
  };

  const hideProcessingToasts = () => {
    setToasts(prev => prev.filter(toast => toast.status !== 'processing'));
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast, hideAllToasts, hideProcessingToasts }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-0 left-0 right-0 z-50 px-4 pt-4 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <ToastItem
              key={toast.id}
              toast={toast}
              onClose={hideToast}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}; 