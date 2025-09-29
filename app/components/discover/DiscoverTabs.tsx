import React from 'react';

export type DiscoverTabType = 'learn' | 'announced' | 'feed' | 'more';

interface DiscoverTabsProps {
  activeTab: DiscoverTabType;
  onTabChange: (tab: DiscoverTabType) => void;
}

const DiscoverTabs: React.FC<DiscoverTabsProps> = ({ activeTab, onTabChange }) => {
  const tabs: DiscoverTabType[] = ['learn', 'announced', 'feed', 'more'];

  return (
    <div className="flex overflow-x-auto no-scrollbar">
      <div className="flex w-full">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`flex-1 py-3 px-2 text-sm font-medium relative transition-colors duration-200 whitespace-nowrap ${
              activeTab === tab ? 'text-foreground' : 'text-muted-foreground'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {activeTab === tab && (
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-primary"
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DiscoverTabs; 