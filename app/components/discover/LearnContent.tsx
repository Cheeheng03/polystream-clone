import React from 'react';

interface LearnCard {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  readTime: string;
}

const LearnContent: React.FC = () => {
  const learnArticles: LearnCard[] = [
    {
      id: '1',
      title: 'Understanding Crypto Yield',
      description: 'Learn how yield is generated in crypto and how Polystream helps maximize your returns.',
      imageUrl: 'https://images.unsplash.com/photo-1621504450181-5d356f61d307',
      category: 'Basics',
      readTime: '5 min'
    },
    {
      id: '2',
      title: 'DeFi Strategies for Beginners',
      description: 'A simple guide to getting started with decentralized finance without the technical jargon.',
      imageUrl: 'https://images.unsplash.com/photo-1639322537228-f710d846310a',
      category: 'Strategy',
      readTime: '8 min'
    },
    {
      id: '3',
      title: 'What is Yield Farming?',
      description: 'Understand how yield farming works and how it differs from traditional investments.',
      imageUrl: 'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d',
      category: 'Basics',
      readTime: '6 min'
    },
    {
      id: '4',
      title: 'Risk Management in DeFi',
      description: 'Learn how to protect your investments while maximizing returns in decentralized finance.',
      imageUrl: 'https://images.unsplash.com/photo-1643101311886-78da84928615',
      category: 'Safety',
      readTime: '10 min'
    }
  ];

  return (
    <div className="space-y-5 pt-2">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-foreground">
          Popular Articles
        </h2>
        <button
          className="text-sm font-medium text-primary"
        >
          See All
        </button>
      </div>

      <div className="space-y-4">
        {learnArticles.map((article) => (
          <div 
            key={article.id} 
            className="bg-background rounded-xl overflow-hidden shadow-sm flex"
          >
            <div 
              className="w-24 h-24 bg-cover bg-center"
              style={{ 
                backgroundImage: `url(${article.imageUrl})`,
                minWidth: '6rem'
              }}
            />
            <div className="p-3 flex flex-col flex-1">
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                  {article.category}
                </span>
                <span className="text-xs text-muted-foreground">
                  {article.readTime}
                </span>
              </div>
              <h3 className="font-medium text-sm mb-1 text-foreground">
                {article.title}
              </h3>
              <p className="text-xs line-clamp-2 text-muted-foreground">
                {article.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-4 text-foreground">
          Learn By Category
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {['Basics', 'Strategy', 'Safety', 'Yield Farming', 'Staking', 'Liquidity'].map((category) => (
            <div 
              key={category}
              className="p-4 rounded-lg text-center bg-secondary border border-border"
            >
              <span className="font-medium text-foreground">
                {category}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LearnContent; 