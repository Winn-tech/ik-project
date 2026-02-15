
import { useQuery } from '@tanstack/react-query';
import { fetchRssFeed, NewsItem } from '@/utils/rssParser';

// Define sources
export const newsSources = [
  { 
    id: 'deadline',
    name: 'Deadline',
    icon: 'Newspaper', 
    url: 'https://deadline.com/feed/' 
  },
  { 
    id: 'variety',
    name: 'Variety', 
    icon: 'Film',
    url: 'https://variety.com/feed/' 
  },
  { 
    id: 'hollywoodreporter',
    name: 'Hollywood Reporter', 
    icon: 'Film',
    url: 'https://www.hollywoodreporter.com/feed/' 
  },
  { 
    id: 'indiewire',
    name: 'IndieWire', 
    icon: 'Film',
    url: 'https://www.indiewire.com/feed/' 
  },
  { 
    id: 'screenrant',
    name: 'ScreenRant', 
    icon: 'Tv',
    url: 'https://screenrant.com/feed/' 
  },
  { 
    id: 'comingsoon',
    name: 'Coming Soon', 
    icon: 'Film',
    url: 'https://www.comingsoon.net/feed' 
  }
];

export const useNewsFeed = (selectedSources: string[] = []) => {
  return useQuery({
    queryKey: ['news', selectedSources],
    queryFn: async () => {
      // If no sources selected, fetch from all
      const sourcesToFetch = selectedSources.length > 0 
        ? newsSources.filter(src => selectedSources.includes(src.id)) 
        : newsSources;
      
      // Fetch from all selected sources
      const allPromises = sourcesToFetch.map(source => 
        fetchRssFeed(source.url, source.name, source.icon)
      );
      
      const results = await Promise.allSettled(allPromises);
      
      // Process results, handling both fulfilled and rejected promises
      const allNews = results
        .filter((result): result is PromiseFulfilledResult<NewsItem[]> => 
          result.status === 'fulfilled')
        .map(result => result.value)
        .flat();
      
      // Combine and sort by publication date
      return allNews.sort((a, b) => 
        new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
      );
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
};

export const useNewsCategories = (news: NewsItem[]) => {
  // Extract all categories from news items
  const categories = news.flatMap(item => item.categories || [])
    .filter(Boolean)
    .reduce<Record<string, number>>((acc, category) => {
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
  
  // Return categories sorted by frequency
  return Object.entries(categories)
    .filter(([_, count]) => count > 1) // Only categories that appear more than once
    .sort((a, b) => b[1] - a[1]) // Sort by frequency
    .map(([name]) => name);
};
