import React from 'react';

interface FeedItem {
  id: string;
  author: {
    name: string;
    avatar: string;
    verified: boolean;
  };
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  hasImage?: boolean;
  imageUrl?: string;
}

const FeedContent: React.FC = () => {
  const feedItems: FeedItem[] = [
    {
      id: '1',
      author: {
        name: 'Polystream',
        avatar: 'https://images.unsplash.com/photo-1587831990625-a6cc8afe4b99',
        verified: true,
      },
      content: 'Excited to announce that we\'ve reached 10,000 users on Polystream! Thanks to our community for the support. We\'re just getting started! 🚀',
      timestamp: '2 hours ago',
      likes: 342,
      comments: 28,
      shares: 67,
      hasImage: true,
      imageUrl: 'https://images.unsplash.com/photo-1642104704074-907c0698cbd9'
    },
    {
      id: '2',
      author: {
        name: 'DeFi Daily',
        avatar: 'https://images.unsplash.com/photo-1611179099564-95fce1c08221',
        verified: true,
      },
      content: 'Yield farming rates update: ETH staking now averaging 4.2% APY across major protocols. Polystream offering competitive 5.1% with their auto-compounding strategy.',
      timestamp: '5 hours ago',
      likes: 156,
      comments: 12,
      shares: 23,
    },
    {
      id: '3',
      author: {
        name: 'Crypto Insider',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956',
        verified: false,
      },
      content: 'New DEX aggregator comparison shows Polystream delivering better yields through their smart routing algorithm. Worth checking out if you\'re looking to optimize returns.',
      timestamp: '8 hours ago',
      likes: 89,
      comments: 7,
      shares: 12,
      hasImage: true,
      imageUrl: 'https://images.unsplash.com/photo-1639152201720-5e536d254d81'
    },
    {
      id: '4',
      author: {
        name: 'Yield Hunter',
        avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e',
        verified: false,
      },
      content: 'Just moved my USDC to Polystream\'s stable yield strategy. The auto-rebalancing between protocols is saving me so much time and gas fees! 💰',
      timestamp: '1 day ago',
      likes: 211,
      comments: 34,
      shares: 18,
    }
  ];

  return (
    <div className="space-y-5 pt-2">
      <div className="space-y-5">
        {feedItems.map((item) => (
          <div 
            key={item.id} 
            className="bg-background rounded-xl p-4 shadow-sm"
          >
            <div className="flex items-start mb-3">
              <div 
                className="w-10 h-10 rounded-full bg-cover bg-center mr-3"
                style={{ backgroundImage: `url(${item.author.avatar})` }}
              />
              <div>
                <div className="flex items-center">
                  <h3 className="font-medium text-foreground">
                    {item.author.name}
                  </h3>
                  {item.author.verified && (
                    <svg className="w-4 h-4 ml-1 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {item.timestamp}
                </span>
              </div>
            </div>
            
            <p className="text-sm mb-3 text-foreground">
              {item.content}
            </p>
            
            {item.hasImage && item.imageUrl && (
              <div 
                className="w-full h-48 rounded-lg bg-cover bg-center mb-3"
                style={{ backgroundImage: `url(${item.imageUrl})` }}
              />
            )}
            
            <div className="flex justify-between border-t pt-3 border-border">
              <button className="flex items-center text-xs text-muted-foreground">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {item.likes}
              </button>
              
              <button className="flex items-center text-xs text-muted-foreground">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {item.comments}
              </button>
              
              <button className="flex items-center text-xs text-muted-foreground">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                {item.shares}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeedContent; 