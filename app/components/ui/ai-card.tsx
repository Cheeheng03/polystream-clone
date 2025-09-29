import React from "react";

interface AICardProps {
  children: React.ReactNode;
  className?: string;
}

export function AICard({ children, className = "" }: AICardProps) {
  return (
    <div className="ai-card">
      <div className="sparkle sparkle-1"></div>
      <div className="sparkle sparkle-2"></div>
      <div className="sparkle sparkle-3"></div>
      <div className="sparkle sparkle-4"></div>
      <div className={`ai-card-content ${className}`}>
        {children}
      </div>
      
      <style jsx>{`
        .ai-card {
          position: relative;
          border-radius: 16px;
          background: linear-gradient(
            90deg, 
            #8AEBCA, #94C9F2, #FFBAE7, #F8D9A3, #8AEBCA
          );
          background-size: 400% 100%;
          animation: hueRotate 8s linear infinite;
          padding: 2px;
          box-shadow: 0 4px 24px 0 rgba(0, 0, 0, 0.05);
          overflow: hidden;
        }
        
        .ai-card-content {
          background: var(--background, white);
          border-radius: 14px;
          overflow: hidden;
          position: relative;
          height: 100%;
          width: 100%;
          z-index: 1;
        }
        
        .sparkle {
          position: absolute;
          width: 20px;
          height: 20px;
          z-index: 2;
          pointer-events: none;
          opacity: 0;
        }
        
        .sparkle::before, .sparkle::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
        }
        
        .sparkle::before {
          transform: scale(0.6) rotate(45deg);
          background: currentColor;
          /* Star shape */
          clip-path: polygon(
            50% 0%, 61% 35%, 98% 35%, 68% 57%, 
            79% 91%, 50% 70%, 21% 91%, 32% 57%, 
            2% 35%, 39% 35%
          );
        }
        
        .sparkle::after {
          transform: scale(0.85) rotate(45deg);
          background: currentColor;
          filter: blur(1px);
          opacity: 0.7;
          /* Four-point star */
          clip-path: polygon(
            50% 0%, 65% 50%, 100% 50%, 65% 65%,
            50% 100%, 35% 65%, 0% 50%, 35% 50%
          );
        }
        
        .sparkle-1 {
          top: 15%;
          left: -4px;
          animation: sparkleAnimation 4s ease-in-out infinite;
          animation-delay: 1s;
          color: #8AEBCA;
          filter: drop-shadow(0 0 8px rgba(138, 235, 202, 0.9));
        }
        
        .sparkle-2 {
          top: 60%;
          right: -4px;
          animation: sparkleAnimation 3.5s ease-in-out infinite;
          animation-delay: 2.5s;
          color: #94C9F2;
          filter: drop-shadow(0 0 8px rgba(148, 201, 242, 0.9));
        }
        
        .sparkle-3 {
          bottom: 10%;
          left: 40%;
          animation: sparkleAnimation 4.5s ease-in-out infinite;
          animation-delay: 0.5s;
          color: #FFBAE7;
          filter: drop-shadow(0 0 8px rgba(255, 186, 231, 0.9));
        }
        
        .sparkle-4 {
          top: 8%;
          right: 35%;
          animation: sparkleAnimation 5s ease-in-out infinite;
          animation-delay: 3.5s;
          color: #F8D9A3;
          filter: drop-shadow(0 0 8px rgba(248, 217, 163, 0.9));
        }
        
        @keyframes sparkleAnimation {
          0%, 85%, 100% {
            opacity: 0;
            transform: scale(0.5) rotate(0deg);
          }
          5% {
            opacity: 0.5;
            transform: scale(0.8) rotate(0deg);
          }
          7%, 12% {
            opacity: 1;
            transform: scale(1.2) rotate(45deg);
          }
          15% {
            opacity: 0.4;
            transform: scale(0.9) rotate(90deg);
          }
          17% {
            opacity: 0;
            transform: scale(0.5) rotate(90deg);
          }
        }
        
        @keyframes hueRotate {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
    </div>
  );
} 