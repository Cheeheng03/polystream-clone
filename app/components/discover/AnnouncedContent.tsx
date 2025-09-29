import React from 'react';

interface Announcement {
  id: string;
  title: string;
  date: string;
  content: string;
  type: 'product' | 'update' | 'protocol';
  isNew: boolean;
}

const AnnouncedContent: React.FC = () => {
  const announcements: Announcement[] = [
    {
      id: '1',
      title: 'Polystream Launch',
      date: 'Today',
      content: 'We\'re launching!',
      type: 'product',
      isNew: true,
    },
    {
      id: '2',
      title: 'New Yield Strategy: USDC-ETH LP',
      date: 'Yesterday',
      content: 'We\'ve added a new yield strategy for USDC-ETH liquidity providers with estimated APY of 8.2%. Available now in your portfolio.',
      type: 'protocol',
      isNew: true,
    },
    {
      id: '3',
      title: 'App Update v0.2.4',
      date: '3 days ago',
      content: 'Latest app update includes performance improvements, bug fixes, and enhanced security features. Update now for the best experience.',
      type: 'update',
      isNew: false,
    },
    {
      id: '4',
      title: 'Polygon Integration Live',
      date: '1 week ago',
      content: 'Polystream now supports Polygon network for lower gas fees and faster transactions. Connect your wallet to try it out.',
      type: 'protocol',
      isNew: false,
    },
    {
      id: '5',
      title: 'Community AMA Recap',
      date: '2 weeks ago',
      content: 'Thanks to everyone who joined our first community AMA. Check out the summary of questions and answers from our team.',
      type: 'update',
      isNew: false,
    }
  ];

  const getTypeColor = (type: Announcement['type']) => {
    switch(type) {
      case 'product':
        return { bg: 'bg-accent', text: 'text-primary' };
      case 'update':
        return { bg: 'bg-secondary', text: 'text-secondary-foreground' };
      case 'protocol':
        return { bg: 'bg-muted', text: 'text-muted-foreground' };
      default:
        return { bg: 'bg-muted', text: 'text-muted-foreground' };
    }
  };

  return (
    <div className="space-y-5 pt-2">
      <div className="space-y-4">
        {announcements.map((announcement) => {
          const typeColor = getTypeColor(announcement.type);
          
          return (
            <div 
              key={announcement.id} 
              className="bg-background rounded-xl p-4 shadow-sm"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-2">
                  <span 
                    className={`text-xs px-2 py-0.5 rounded-full capitalize ${typeColor.bg} ${typeColor.text}`}
                  >
                    {announcement.type}
                  </span>
                  {announcement.isNew && (
                    <span 
                      className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground"
                    >
                      New
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {announcement.date}
                </span>
              </div>
              
              <h3 className="font-medium text-base mb-2 text-foreground">
                {announcement.title}
              </h3>
              
              <p className="text-sm text-muted-foreground">
                {announcement.content}
              </p>
              
              <div className="mt-3 flex justify-end">
                <button
                  className="text-sm font-medium text-primary"
                >
                  Read more
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AnnouncedContent; 