import React from 'react';

interface MoreItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  subtitle?: string;
  linkText?: string;
  comingSoon?: boolean;
}

const MoreContent: React.FC = () => {
  const moreItems: MoreItem[] = [
    {
      id: 'faq',
      title: 'Frequently Asked Questions',
      subtitle: 'Get answers to common questions',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      linkText: 'View FAQs',
    },
    {
      id: 'academy',
      title: 'Polystream Academy',
      subtitle: 'Learn everything about DeFi and yield',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M12 14l9-5-9-5-9 5 9 5z" />
          <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
        </svg>
      ),
      linkText: 'Start Learning',
    },
    {
      id: 'community',
      title: 'Community',
      subtitle: 'Join our Discord and Telegram',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      linkText: 'Join Now',
    },
    {
      id: 'docs',
      title: 'Documentation',
      subtitle: 'Technical documentation and guides',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      linkText: 'View Docs',
    },
    {
      id: 'referral',
      title: 'Refer a Friend',
      subtitle: 'Earn rewards for every friend you invite',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      ),
      linkText: 'Get Link',
    },
    {
      id: 'governance',
      title: 'Governance',
      subtitle: 'Participate in protocol decisions',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      comingSoon: true,
    },
  ];

  return (
    <div className="space-y-5 pt-2">
      <div className="grid gap-4">
        {moreItems.map((item) => (
          <div 
            key={item.id} 
            className="bg-background rounded-xl p-4 shadow-sm flex items-center"
          >
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center mr-4 bg-secondary text-foreground"
            >
              {item.icon}
            </div>
            
            <div className="flex-1">
              <h3 className="font-medium text-foreground">
                {item.title}
              </h3>
              {item.subtitle && (
                <p className="text-xs text-muted-foreground">
                  {item.subtitle}
                </p>
              )}
            </div>
            
            {item.comingSoon ? (
              <span 
                className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground"
              >
                Coming Soon
              </span>
            ) : (
              <button
                className="text-sm font-medium text-primary"
              >
                {item.linkText}
              </button>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-6 bg-background rounded-xl p-5 shadow-sm">
        <h3 className="font-medium mb-2 text-foreground">
          About Polystream
        </h3>
        <p className="text-sm mb-4 text-muted-foreground">
          Polystream is a mobile-first yield aggregation platform built for Web2 users new to DeFi. 
          We eliminate technical barriers that prevent mainstream adoption through intuitive UX and powerful automation.
        </p>
        <div className="flex space-x-4">
          <div className="text-center">
            <p className="text-lg font-semibold text-primary">
              v0.2.5
            </p>
            <span className="text-xs text-muted-foreground">
              App Version
            </span>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-primary">
              $150M+
            </p>
            <span className="text-xs text-muted-foreground">
              TVL
            </span>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-primary">
              15K+
            </p>
            <span className="text-xs text-muted-foreground">
              Active Users
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoreContent; 