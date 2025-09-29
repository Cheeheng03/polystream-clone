"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { FaXTwitter } from "react-icons/fa6";
import { FaTelegram, FaDiscord } from "react-icons/fa";

export default function SupportPage() {
  const router = useRouter();

  const socialLinks = [
    {
      name: "X",
      icon: <FaXTwitter className="h-6 w-6" />,
      url: "https://x.com/polystream_xyz",
      color: "hover:bg-black/5",
    },
    {
      name: "Telegram",
      icon: <FaTelegram className="h-6 w-6" />,
      url: "https://t.me/polystream_xyz",
      color: "hover:bg-[#0088cc]/5",
    },
    {
      name: "Discord",
      icon: <FaDiscord className="h-6 w-6" />,
      url: "https://discord.com/invite/s3a4F8R4ch",
      color: "hover:bg-[#5865F2]/5",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center px-4 pt-4 pb-2">
        <button
          className="mr-2 p-2 rounded-full hover:bg-muted"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-6 h-6 text-primary" />
        </button>
      </div>
      <div className="px-6 pb-2">
        <h1 className="text-3xl font-bold mb-1">Support</h1>
        <p className="text-muted-foreground text-base mb-4">
          Contact us through our social media channels for any assistance
        </p>
      </div>

      {/* Content */}
      <div className="px-3 pb-4 space-y-3">
        {socialLinks.map((social) => (
          <a
            key={social.name}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-4 p-4 bg-card rounded-xl border transition-colors card-tap-effect ${social.color}`}
          >
            <div className="p-2 bg-muted rounded-lg">{social.icon}</div>
            <div>
              <h2 className="font-medium">{social.name}</h2>
              <p className="text-sm text-muted-foreground">
                Join our {social.name} community
              </p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
