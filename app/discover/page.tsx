"use client";

import { useState } from "react";
import TabNavigation from "../components/ui/TabNavigation";
import DiscoverTabs, { DiscoverTabType } from "../components/discover/DiscoverTabs";
import LearnContent from "../components/discover/LearnContent";
import AnnouncedContent from "../components/discover/AnnouncedContent";
import FeedContent from "../components/discover/FeedContent";
import MoreContent from "../components/discover/MoreContent";

export default function Discover() {
  const [activeTab, setActiveTab] = useState<DiscoverTabType>("learn");

  const renderContent = () => {
    switch (activeTab) {
      case "learn":
        return <LearnContent />;
      case "announced":
        return <AnnouncedContent />;
      case "feed":
        return <FeedContent />;
      case "more":
        return <MoreContent />;
      default:
        return <LearnContent />;
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <div className="flex-1 pb-20">
        {/* Header */}
        <div className="px-5 pt-8 pb-2">
          <h1 className="text-2xl font-bold text-foreground">Discover</h1>
          <p className="text-sm mt-1 text-muted-foreground">
            Learn, explore, and stay updated
          </p>
        </div>

        {/* Tabs */}
        <div className="sticky top-0 z-10 bg-background shadow-sm">
          <div className="px-2">
            <DiscoverTabs activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-5 py-4">{renderContent()}</div>
      </div>

      {/* Tab Navigation */}
      {/* <TabNavigation activeTab="discover" /> */}
    </main>
  );
}
