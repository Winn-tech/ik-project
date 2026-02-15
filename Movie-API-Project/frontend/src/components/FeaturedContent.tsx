import React from "react";
import { useNavigate } from "react-router-dom";
import { Play, Heart, ThumbsUp, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface FeaturedContentProps {
  movie: {
    id: number;
    title?: string;
    name?: string;
    overview: string;
    backdrop_path: string;
    poster_path?: string;
    release_date?: string;
    first_air_date?: string;
    vote_average?: number;
    media_type: "movie" | "tv";
  };
  onAddFavorite?: (id: number, mediaType: "movie" | "tv") => void;
  onAddWatchlist?: (id: number, mediaType: "movie" | "tv") => void;
  favorites?: number[];
  watchlist?: number[];
}

const FeaturedContent: React.FC<FeaturedContentProps> = ({
  movie,
  onAddFavorite,
  onAddWatchlist,
  favorites = [],
  watchlist = [],
}) => {
  const navigate = useNavigate();
  const imageUrl = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
    : "https://via.placeholder.com/1920x1080?text=No+Image";
  
  const year = movie.release_date 
    ? new Date(movie.release_date).getFullYear()
    : movie.first_air_date
    ? new Date(movie.first_air_date).getFullYear()
    : "";

  const title = movie.title || movie.name || "Unknown";
  const isFavorite = favorites.includes(movie.id);
  const isInWatchlist = watchlist.includes(movie.id);

  return (
    <div className="relative w-full h-[500px] overflow-hidden rounded-lg mb-8">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-center bg-cover bg-no-repeat"
        style={{ backgroundImage: `url(${imageUrl})` }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-flicks-dark via-flicks-dark/80 to-transparent" />

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl"
        >
          <h1 className="text-5xl font-bold mb-4 text-flicks-light" style={{ color: '#90EE90' }}>
            {title}
          </h1>
          
          <div className="flex items-center gap-4 mb-4">
            {movie.vote_average && (
              <div className="bg-blue-500 text-white px-3 py-1 rounded text-sm font-semibold">
                {movie.vote_average.toFixed(1)}
              </div>
            )}
            {year && (
              <span className="text-flicks-light/80 text-lg">{year}</span>
            )}
          </div>

          <p className="text-flicks-light/90 mb-6 line-clamp-3 text-lg">
            {movie.overview}
          </p>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate(`/${movie.media_type}/${movie.id}`)}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Watch Trailer
            </Button>
            
            <Button
              onClick={() => onAddFavorite && onAddFavorite(movie.id, movie.media_type)}
              variant="ghost"
              size="icon"
              className={isFavorite ? "text-red-500" : "text-flicks-light hover:text-red-500"}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
            </Button>
            
            <Button
              onClick={() => onAddWatchlist && onAddWatchlist(movie.id, movie.media_type)}
              variant="ghost"
              size="icon"
              className={isInWatchlist ? "text-blue-500" : "text-flicks-light hover:text-blue-500"}
            >
              <ThumbsUp className={`w-5 h-5 ${isInWatchlist ? "fill-current" : ""}`} />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="text-flicks-light hover:text-flicks-teal"
            >
              <MoreVertical className="w-5 h-5" />
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FeaturedContent;

