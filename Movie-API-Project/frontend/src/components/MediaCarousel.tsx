import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import MovieCard from "@/components/MovieCard";

interface Media {
  id: number;
  title?: string;
  name?: string;
  poster_path: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  media_type: "movie" | "tv";
}

interface MediaCarouselProps {
  title: string;
  items: Media[];
  onAddFavorite?: (id: number, mediaType: "movie" | "tv") => void;
  onAddWatchlist?: (id: number, mediaType: "movie" | "tv") => void;
  favorites?: number[];
  watchlist?: number[];
  className?: string;
}

const MediaCarousel: React.FC<MediaCarouselProps> = ({
  title,
  items,
  onAddFavorite,
  onAddWatchlist,
  favorites = [],
  watchlist = [],
  className,
}) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(true);

  const scroll = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const scrollAmount = carouselRef.current.clientWidth * 0.75;
      const newScrollLeft =
        direction === "left"
          ? carouselRef.current.scrollLeft - scrollAmount
          : carouselRef.current.scrollLeft + scrollAmount;

      carouselRef.current.scrollTo({
        left: newScrollLeft,
        behavior: "smooth",
      });

      // Update buttons after scrolling
      setTimeout(() => {
        if (carouselRef.current) {
          setShowLeftButton(carouselRef.current.scrollLeft > 0);
          setShowRightButton(
            carouselRef.current.scrollLeft <
              carouselRef.current.scrollWidth -
                carouselRef.current.clientWidth -
                10,
          );
        }
      }, 300);
    }
  };

  const handleScroll = () => {
    if (carouselRef.current) {
      setShowLeftButton(carouselRef.current.scrollLeft > 0);
      setShowRightButton(
        carouselRef.current.scrollLeft <
          carouselRef.current.scrollWidth -
            carouselRef.current.clientWidth -
            10,
      );
    }
  };

  useEffect(() => {
    // Initialize button visibility on mount and when items change
    if (carouselRef.current) {
      const checkScroll = () => {
        if (carouselRef.current) {
          setShowLeftButton(carouselRef.current.scrollLeft > 0);
          setShowRightButton(
            carouselRef.current.scrollLeft <
              carouselRef.current.scrollWidth -
                carouselRef.current.clientWidth -
                10,
          );
        }
      };
      
      // Check immediately
      checkScroll();
      
      // Check after a short delay to ensure layout is complete
      const timeout = setTimeout(checkScroll, 100);
      
      // Also check on window resize
      window.addEventListener("resize", checkScroll);
      
      return () => {
        clearTimeout(timeout);
        window.removeEventListener("resize", checkScroll);
      };
    }
  }, [items]);

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className={cn("relative w-full py-4", className)}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-flicks-light">{title}</h2>
      </div>

      <div className="relative w-full overflow-hidden">
        {showLeftButton && (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-flicks-teal/20 hover:bg-flicks-teal/30 text-flicks-light shadow-lg"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        <div
          ref={carouselRef}
          onScroll={handleScroll}
          className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
        {items.map((item) => (
          <div
            key={`${item.media_type}-${item.id}`}
            className="flex-shrink-0"
            style={{ width: "180px" }}
          >
            <MovieCard
              id={item.id}
              title={item.title || item.name || "Unknown"}
              posterPath={item.poster_path}
              releaseDate={item.release_date || item.first_air_date}
              rating={item.vote_average}
              mediaType={item.media_type}
              className="w-full"
              isFavorite={favorites?.includes(item.id)}
              isInWatchlist={watchlist?.includes(item.id)}
              onAddFavorite={() =>
                onAddFavorite && onAddFavorite(item.id, item.media_type)
              }
              onAddWatchlist={() =>
                onAddWatchlist && onAddWatchlist(item.id, item.media_type)
              }
            />
          </div>
        ))}
        </div>
        {showRightButton && (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-flicks-teal/20 hover:bg-flicks-teal/30 text-flicks-light shadow-lg"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default MediaCarousel;
