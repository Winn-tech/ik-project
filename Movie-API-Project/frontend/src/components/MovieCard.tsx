
import React from "react";
import { Link } from "react-router-dom";
import { Heart, BookmarkPlus, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MovieCardProps {
  id: number;
  title: string;
  posterPath: string;
  releaseDate?: string;
  rating?: number;
  mediaType: "movie" | "tv";
  className?: string;
  isFavorite?: boolean;
  isInWatchlist?: boolean;
  onAddFavorite?: () => void;
  onAddWatchlist?: () => void;
}

const MovieCard: React.FC<MovieCardProps> = ({
  id,
  title,
  posterPath,
  releaseDate,
  rating,
  mediaType,
  className,
  isFavorite = false,
  isInWatchlist = false,
  onAddFavorite,
  onAddWatchlist,
}) => {
  const imageUrl = posterPath && posterPath !== "null" && posterPath !== ""
    ? `https://image.tmdb.org/t/p/w500${posterPath}`
    : "";

  const year = releaseDate ? new Date(releaseDate).getFullYear() : "";

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddFavorite) onAddFavorite();
  };

  const handleWatchlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddWatchlist) onAddWatchlist();
  };

  return (
    <Link
      to={`/${mediaType}/${id}`}
      className={cn(
        "movie-card group block relative overflow-hidden rounded-md bg-flicks-dark shadow-md w-full",
        className
      )}
    >
      <div className="aspect-[2/3] w-full overflow-hidden relative bg-flicks-dark">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
            }}
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-flicks-dark/50 flex items-center justify-center">
            <span className="text-flicks-light/50 text-sm">No Image</span>
          </div>
        )}
      </div>

      {/* Overlay with gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
        <h3 className="font-semibold text-flicks-light truncate">{title}</h3>
        
        {year && (
          <p className="text-sm text-flicks-light/80 mb-2">{year}</p>
        )}
        
        {rating && (
          <div className="flex items-center mb-3">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-1" />
            <span className="text-sm text-flicks-light/90">{rating.toFixed(1)}</span>
          </div>
        )}
        
        <div className="flex justify-between space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className={cn(
                    "w-8 h-8 rounded-full",
                    isFavorite ? "bg-flicks-teal text-white" : "bg-flicks-dark/80 text-flicks-light"
                  )}
                  onClick={handleFavoriteClick}
                >
                  <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{isFavorite ? "Remove from favorites" : "Add to favorites"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className={cn(
                    "w-8 h-8 rounded-full",
                    isInWatchlist ? "bg-flicks-teal text-white" : "bg-flicks-dark/80 text-flicks-light"
                  )}
                  onClick={handleWatchlistClick}
                >
                  <BookmarkPlus className={cn("w-4 h-4", isInWatchlist && "fill-current")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </Link>
  );
};

export default MovieCard;
