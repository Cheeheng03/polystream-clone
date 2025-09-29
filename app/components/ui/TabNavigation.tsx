"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type TabType = "home" | "vault" | "tap-trade" | "news-market" | "rewards" | "portfolio";

interface TabNavigationProps {
  activeTab: TabType;
}

export default function TabNavigation({ activeTab }: TabNavigationProps) {
  const pathname = usePathname();
  const currentPath = pathname?.split("/")[1] || "home";

  const tabs: {
    name: TabType;
    icon: React.ReactNode;
    activeIcon: React.ReactNode;
    href: string;
  }[] = [
    {
      name: "home",
      href: "/home",
      icon: (
        <svg
          height="24"
          width="24"
          viewBox="0 0 16 16"
          xmlns="http://www.w3.org/2000/svg"
          className="text-gray-500"
        >
          <path
            d="m8.68701 1.26145c-.3855-.36447-.98852-.36447-1.37402 0l-4.84351 4.57934c-.29968.28334-.46948.67756-.46948 1.08997v5.56924c0 .8284.67157 1.5 1.5 1.5h1.5c.82843 0 1.5-.6716 1.5-1.5v-2.5c0-.27611.22386-.49997.5-.49997h2c.27614 0 .5.22386.5.49997v2.5c0 .8284.6716 1.5 1.5 1.5h1.5c.8284 0 1.5-.6716 1.5-1.5v-5.56924c0-.41241-.1698-.80663-.4695-1.08997z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          />
        </svg>
      ),
      activeIcon: (
        <svg
          height="24"
          width="24"
          viewBox="0 0 16 16"
          xmlns="http://www.w3.org/2000/svg"
          className="text-gray-900"
        >
          <path
            d="m8.68701 1.26145c-.3855-.36447-.98852-.36447-1.37402 0l-4.84351 4.57934c-.29968.28334-.46948.67756-.46948 1.08997v5.56924c0 .8284.67157 1.5 1.5 1.5h1.5c.82843 0 1.5-.6716 1.5-1.5v-2.5c0-.27611.22386-.49997.5-.49997h2c.27614 0 .5.22386.5.49997v2.5c0 .8284.6716 1.5 1.5 1.5h1.5c.8284 0 1.5-.6716 1.5-1.5v-5.56924c0-.41241-.1698-.80663-.4695-1.08997z"
            fill="currentColor"
          />
        </svg>
      ),
    },
    {
      name: "vault",
      href: "/market",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-gray-500"
        >
          <path
            d="M12 2L2 7L12 12L22 7L12 2Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2 17L12 22L22 17"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2 12L12 17L22 12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      activeIcon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-gray-900"
        >
          <path
            d="M12 2L2 7L12 12L22 7L12 2Z"
            stroke="currentColor"
            fill="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2 17L12 22L22 17"
            stroke="currentColor"
            fill="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2 12L12 17L22 12"
            stroke="currentColor"
            fill="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      name: "tap-trade",
      href: "/tap-trade",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-gray-500"
        >
          <path
            d="M3 3H21V21H3V3Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9 9H15V15H9V9Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 3V21"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M3 12H21"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      activeIcon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-gray-900"
        >
          <path
            d="M3 3H21V21H3V3Z"
            stroke="currentColor"
            fill="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9 9H15V15H9V9Z"
            stroke="#FFF"
            fill="#FFF"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 3V21"
            stroke="#FFF"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M3 12H21"
            stroke="#FFF"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      name: "news-market",
      href: "/predictions",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-muted-foreground"
        >
          <path
            d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6.5 2H20V22H6.5A2.5 2.5 0 0 1 4 19.5V4.5A2.5 2.5 0 0 1 6.5 2Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8 6H16M8 10H16M8 14H12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      activeIcon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-primary"
        >
          <path
            d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
            stroke="currentColor"
            fill="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6.5 2H20V22H6.5A2.5 2.5 0 0 1 4 19.5V4.5A2.5 2.5 0 0 1 6.5 2Z"
            stroke="currentColor"
            fill="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8 6H16M8 10H16M8 14H12"
            stroke="#FFF"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      name: "rewards",
      href: "/rewards",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-muted-foreground"
        >
          <path
            d="M20 12V22H4V12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M22 7H2V12H22V7Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 22V7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 7H7.5C6.83696 7 6.20107 6.73661 5.73223 6.26777C5.26339 5.79893 5 5.16304 5 4.5C5 3.83696 5.26339 3.20107 5.73223 2.73223C6.20107 2.26339 6.83696 2 7.5 2C11 2 12 7 12 7Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 7H16.5C17.163 7 17.7989 6.73661 18.2678 6.26777C18.7366 5.79893 19 5.16304 19 4.5C19 3.83696 18.7366 3.20107 18.2678 2.73223C17.7989 2.26339 17.163 2 16.5 2C13 2 12 7 12 7Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      activeIcon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-muted-foreground"
        >
          <path
            d="M20 12V22H4V12"
            stroke="black"
            fill="black"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M22 7H2V12H22V7Z"
            stroke="black"
            fill="black"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line
            x1="1"
            y1="12"
            x2="23"
            y2="12"
            stroke="white"
            strokeWidth="1.5"
          />
          <path
            d="M12 22V7"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 7H7.5C6.83696 7 6.20107 6.73661 5.73223 6.26777C5.26339 5.79893 5 5.16304 5 4.5C5 3.83696 5.26339 3.20107 5.73223 2.73223C6.20107 2.26339 6.83696 2 7.5 2C11 2 12 7 12 7Z"
            stroke="black"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 7H16.5C17.163 7 17.7989 6.73661 18.2678 6.26777C18.7366 5.79893 19 5.16304 19 4.5C19 3.83696 18.7366 3.20107 18.2678 2.73223C17.7989 2.26339 17.163 2 16.5 2C13 2 12 7 12 7Z"
            stroke="black"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      name: "portfolio",
      href: "/portfolio",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-muted-foreground"
        >
          <path
            d="M21 14H3M18 4H6C4.89543 4 4 4.89543 4 6V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V6C20 4.89543 19.1046 4 18 4Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8 8H16M8 12H16M8 16H12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      activeIcon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-primary"
        >
          <path
            d="M21 14H3M18 4H6C4.89543 4 4 4.89543 4 6V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V6C20 4.89543 19.1046 4 18 4Z"
            stroke="currentColor"
            fill="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8 8H16M8 12H16M8 16H12"
            stroke="#FFF"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/85 backdrop-blur-md rounded-t-[24px] border-t border-border pb-[20px] z-99">
      <div className="flex justify-around items-center h-16 px-2">
        {tabs.map((tab) => (
          <Link
            key={tab.name}
            href={tab.href}
            className="flex flex-col items-center justify-center h-full w-full"
          >
            <div className="flex flex-col items-center">
              {currentPath === tab.name ? tab.activeIcon : tab.icon}
              <span
                className={`mt-1 text-[10px] font-medium ${
                  currentPath === tab.name
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {tab.name === "tap-trade" ? "Trade" : 
                 tab.name === "news-market" ? "Predictions" :
                 tab.name.charAt(0).toUpperCase() + tab.name.slice(1)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}