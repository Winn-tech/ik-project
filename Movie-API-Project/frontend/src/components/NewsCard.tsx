
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, ExternalLink } from "lucide-react";
import { NewsItem } from "@/utils/rssParser";
import { formatDistanceToNow } from "date-fns";

interface NewsCardProps {
  news: NewsItem;
  onCategoryClick?: (category: string) => void;
}

const NewsCard: React.FC<NewsCardProps> = ({ news, onCategoryClick }) => {
  const formatPublishDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return "Recently";
    }
  };

  return (
    <Card className="overflow-hidden border border-flicks-teal/20 bg-flicks-dark/60 hover:border-flicks-teal/40 transition-all duration-300 h-full flex flex-col">
      {news.image && (
        <div className="relative h-48 overflow-hidden">
          <img 
            src={news.image} 
            alt={news.title} 
            className="w-full h-full object-cover transition-transform hover:scale-105 duration-500"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}
      
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
          <span className="font-medium text-flicks-teal">{news.source}</span>
          <span>•</span>
          <div className="flex items-center gap-1">
            <CalendarClock className="h-3 w-3" />
            <span>{formatPublishDate(news.pubDate)}</span>
          </div>
        </div>
        <CardTitle className="text-xl text-flicks-light hover:text-flicks-teal transition-colors line-clamp-2">
          <a href={news.link} target="_blank" rel="noopener noreferrer">
            {news.title}
          </a>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-grow">
        <CardDescription className="text-gray-300 line-clamp-3 mb-4">
          {news.contentSnippet}
        </CardDescription>
        
        <div className="flex flex-wrap gap-1 mt-2">
          {(news.categories || []).slice(0, 3).map((category, idx) => (
            <Badge 
              key={idx} 
              variant="outline"
              className="cursor-pointer bg-flicks-teal/10 text-flicks-teal hover:bg-flicks-teal/20"
              onClick={() => onCategoryClick && onCategoryClick(category)}
            >
              {category}
            </Badge>
          ))}
          {news.categories && news.categories.length > 3 && (
            <Badge variant="outline" className="bg-gray-700/30 text-gray-400">
              +{news.categories.length - 3}
            </Badge>
          )}
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full border-flicks-teal text-flicks-light hover:bg-flicks-teal/10 hover:text-flicks-light"
          asChild
        >
          <a href={news.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
            Read Full Article
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default NewsCard;