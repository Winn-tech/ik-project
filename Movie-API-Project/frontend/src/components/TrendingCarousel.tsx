import React, { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import MovieCard from "@/components/MovieCard";

interface TrendingCarouselProps {
  title: string;
  description: string;
  items: any[];
  mediaType: "movie" | "tv";
  favorites: number[];
  watchlist: number[];
  onAddFavorite: (id: number, mediaType: "movie" | "tv") => void;
  onAddWatchlist: (id: number, mediaType: "movie" | "tv") => void;
}

const TrendingCarousel: React.FC<TrendingCarouselProps> = ({
  title,
  description,
  items,
  mediaType,
  favorites,
  watchlist,
  onAddFavorite,
  onAddWatchlist,
}) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(true);

  // Force check scroll on mount - ensure buttons show
  useEffect(() => {
    const forceCheck = () => {
      setTimeout(() => {
        if (carouselRef.current) {
          const { scrollWidth, clientWidth } = carouselRef.current;
          if (scrollWidth > clientWidth) {
            setShowRightButton(true);
          }
        }
      }, 200);
    };
    forceCheck();
  }, []);

  // Scroll function
  const scroll = (direction: "left" | "right") => {
    if (carouselRef.current) {
      // Scroll by the full container width to show completely new cards
      const scrollAmount = carouselRef.current.clientWidth;
      const newScrollLeft =
        direction === "left"
          ? carouselRef.current.scrollLeft - scrollAmount
          : carouselRef.current.scrollLeft + scrollAmount;

      carouselRef.current.scrollTo({
        left: newScrollLeft,
        behavior: "smooth",
      });

      setTimeout(() => {
        if (carouselRef.current) {
          setShowLeftButton(carouselRef.current.scrollLeft > 0);
          setShowRightButton(
            carouselRef.current.scrollLeft <
              carouselRef.current.scrollWidth -
                carouselRef.current.clientWidth -
                10
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
            10
      );
    }
  };

  // Initialize button visibility on mount and when content changes
  useEffect(() => {
    const checkScroll = () => {
      if (carouselRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
        const hasScroll = scrollWidth > clientWidth;
        const canScrollRight = scrollLeft < scrollWidth - clientWidth - 5;
        setShowLeftButton(scrollLeft > 5);
        setShowRightButton(hasScroll && canScrollRight);
      }
    };

    // Check immediately
    checkScroll();

    // Check after delays to ensure DOM and images are fully rendered
    const timeouts = [
      setTimeout(checkScroll, 100),
      setTimeout(checkScroll, 300),
      setTimeout(checkScroll, 600),
      setTimeout(checkScroll, 1000),
    ];

    // Also check when window loads
    const handleLoad = () => {
      checkScroll();
    };
    window.addEventListener("load", handleLoad);

    // Check on resize
    window.addEventListener("resize", checkScroll);

    return () => {
      timeouts.forEach(clearTimeout);
      window.removeEventListener("load", handleLoad);
      window.removeEventListener("resize", checkScroll);
    };
  }, [items]);

  return (
    <div className="mt-12 w-[80vw] max-w-[90vw]">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-flicks-light sidebar__title">
            {title}
          </h2>
        </div>
        <div className="flex items-center gap-2 mr-8">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => scroll("left")}
            disabled={!showLeftButton}
            className={`w-10 h-10 rounded-full bg-flicks-teal/80 hover:bg-flicks-teal text-flicks-light shadow-lg transition-opacity ${
              showLeftButton ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => scroll("right")}
            disabled={!showRightButton}
            className={`w-10 h-10 rounded-full bg-flicks-teal/80 hover:bg-flicks-teal text-flicks-light shadow-lg transition-opacity ${
              showRightButton ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <p className="text-flicks-light/70 -mt-4 mb-8 sidebar__text_i">
        {description}
      </p>
      <div className="relative w-full max-w-full overflow-hidden">
        <div
          ref={carouselRef}
          onScroll={handleScroll}
          className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {items.length > 0 ? (
            items.map((item: any) => (
              <div
                key={item.id}
                className="flex-shrink-0"
                style={{ width: "180px" }}
              >
                <MovieCard
                  id={item.id}
                  title={mediaType === "movie" ? item.title : item.name}
                  posterPath={item.poster_path}
                  releaseDate={
                    mediaType === "movie"
                      ? item.release_date
                      : item.first_air_date
                  }
                  rating={item.vote_average}
                  mediaType={mediaType}
                  className="w-full"
                  isFavorite={favorites?.includes(item.id)}
                  isInWatchlist={watchlist?.includes(item.id)}
                  onAddFavorite={() => onAddFavorite(item.id, mediaType)}
                  onAddWatchlist={() => onAddWatchlist(item.id, mediaType)}
                />
              </div>
            ))
          ) : (
            <div className="text-flicks-light/70 p-4">
              No {mediaType === "movie" ? "movies" : "TV shows"} available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrendingCarousel;