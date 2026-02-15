import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Play, Heart, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

/**
 * HeroSection Component
 *
 * Large rotating hero banner that displays featured movies:
 * - Auto-rotates through 5 movies every 5 seconds
 * - Shows backdrop image with gradient overlay
 * - Displays movie title, overview, rating
 * - Includes favorite/watchlist/play buttons
 * - Manual navigation with arrow buttons and dots
 *
 * Props:
 * @param {Array} movies - Array of movie objects (typically top 5 trending)
 * @param {function} onAddFavorite - Callback for favorite button
 * @param {function} onAddWatchlist - Callback for watchlist button
 * @param {Array} favorites - Array of favorite movie IDs
 * @param {Array} watchlist - Array of watchlist movie IDs
 */

interface Movie {
  id: number;
  title: string;
  overview: string;
  backdrop_path: string;
  vote_average: number;
  release_date: string;
  media_type: "movie" | "tv";
}

interface HeroSectionProps {
  movies: Movie[];
  onAddFavorite: (id: number, mediaType: "movie" | "tv") => void;
  onAddWatchlist: (id: number, mediaType: "movie" | "tv") => void;
  favorites: number[];
  watchlist: number[];
}

const HeroSection: React.FC<HeroSectionProps> = ({
  movies,
  onAddFavorite,
  onAddWatchlist,
  favorites,
  watchlist,
}) => {
  // Track which movie is currently displayed
  const [currentIndex, setCurrentIndex] = useState(0);
  // Track if user is hovering (to pause auto-rotation)
  const [isPaused, setIsPaused] = useState(false);

  // Get current movie
  const currentMovie = movies[currentIndex];

  // Auto-rotate every 5 seconds (unless paused)
  useEffect(() => {
    if (isPaused || movies.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % movies.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [movies.length, isPaused]);

  // Navigation functions
  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + movies.length) % movies.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % movies.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (!currentMovie) return null;

  // Check if current movie is in favorites/watchlist
  const isFavorite = favorites.includes(currentMovie.id);
  const isInWatchlist = watchlist.includes(currentMovie.id);

  // TMDB backdrop URL (use original size for hero)
  const backdropUrl = currentMovie.backdrop_path
    ? `https://image.tmdb.org/t/p/original${currentMovie.backdrop_path}`
    : "/placeholder-backdrop.jpg";

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  };

  return (
    <div
      className="relative h-[600px] w-full overflow-hidden pl-6"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      
      <div className="absolute inset-0">
        <img
          src={backdropUrl}
          alt={currentMovie.title}
          className="h-full w-full object-cover"
        />
        {/* Multi-layer gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-flicks-dark via-flicks-dark/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-flicks-dark via-transparent to-transparent" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex h-full items-center">
        <div className="container mx-auto px-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentMovie.id}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="max-w-2xl space-y-6"
            >
            
              <motion.h1
                variants={itemVariants}
                className="text-5xl font-bold text-flicks-light md:text-6xl"
              >
                {currentMovie.title}
              </motion.h1>

              <motion.div
                variants={itemVariants}
                className="flex items-center gap-4 text-flicks-light/80"
              >
                <div className="flex items-center">
                  <span className="font-semibold bg-[#02ADC1] p-2 rounded">
                    {currentMovie.vote_average.toFixed(1)}
                  </span>
                </div>
                <span className="text-lg">
                  {new Date(currentMovie.release_date).getFullYear()}
                </span>
              </motion.div>

              {/* Overview */}
              <motion.p
                variants={itemVariants}
                className="text-lg leading-relaxed text-flicks-light/90"
              >
                {currentMovie.overview}
              </motion.p>

              {/* Action Buttons */}
              <motion.div
                variants={itemVariants}
                className="flex flex-wrap gap-4"
              >
                {/* Play/Watch Button */}
                <Button
                  asChild
                  size="lg"
                  className="bg-[#02ADC1] text-flicks-dark hover:bg-flicks-teal/90"
                >
                  <Link to={`/movie/${currentMovie.id}`}>
                    <Play className="mr-2 h-5 w-5" />
                    Watch Trailer
                  </Link>
                </Button>

               {/* Favorite Button */}
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onAddFavorite(currentMovie.id, "movie")}
                  className={`w-12 h-12 rounded-full transition-all ${
                    isFavorite
                      ? "bg-red-500/20 text-red-500 hover:bg-red-500/30 border-2 border-red-500"
                      : "bg-transparent text-white hover:bg-white/10 border-2 border-white/50"
                  }`}
                >
                  <Heart
                    className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`}
                  />
                </Button>

                {/* Watchlist Button */}
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onAddWatchlist(currentMovie.id, "movie")}
                  className={`w-12 h-12 rounded-full transition-all ${
                    isInWatchlist
                      ? "bg-flicks-teal/20 text-flicks-teal hover:bg-flicks-teal/30 border-2 border-flicks-teal"
                      : "bg-transparent text-white hover:bg-white/10 border-2 border-white/50"
                  }`}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation Arrows */}
      {movies.length > 1 && (
        <>
          {/* Left Arrow */}
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-flicks-dark/50 p-3 text-flicks-light transition-all hover:bg-flicks-dark/80"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          {/* Right Arrow */}
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-flicks-dark/50 p-3 text-flicks-light transition-all hover:bg-flicks-dark/80"
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Dot Indicators */}
      {movies.length > 1 && (
        <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {movies.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex
                  ? "w-8 bg-white"
                  : "w-2 bg-white/50 hover:bg-white/80"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HeroSection;