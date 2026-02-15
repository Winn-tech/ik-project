import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { tmdbAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Share2, Plus } from "lucide-react";
import { toast } from "sonner";

interface SpotlightSelectionProps {
  onAddWatchlist?: (id: number, mediaType: "movie" | "tv") => void;
  watchlist?: number[];
}

const SpotlightSelection: React.FC<SpotlightSelectionProps> = ({
  onAddWatchlist,
  watchlist = [],
}) => {
  const navigate = useNavigate();

  // Fetch a popular movie for spotlight
  const { data: popularMovies, isLoading } = useQuery({
    queryKey: ["popularMovies", 1],
    queryFn: tmdbAPI.getPopularMovies,
    staleTime: 5 * 60 * 1000,
  });

  // Get movie details and credits
  const spotlightMovie = popularMovies?.[0];
  const { data: movieDetails } = useQuery({
    queryKey: ["movieDetails", spotlightMovie?.id],
    queryFn: () => spotlightMovie ? tmdbAPI.getMovieDetails(spotlightMovie.id) : null,
    enabled: !!spotlightMovie,
  });

  const { data: credits } = useQuery({
    queryKey: ["movieCredits", spotlightMovie?.id],
    queryFn: () => spotlightMovie ? tmdbAPI.getMovieCredits(spotlightMovie.id) : null,
    enabled: !!spotlightMovie,
  });

  if (isLoading) {
    return (
      <div className="mb-12 bg-[#141414] rounded-2xl px-6 py-6">
        <h2 className="text-2xl font-bold text-white mb-6">Spotlight Selection</h2>
        <Skeleton className="h-96 w-full bg-black/40" />
      </div>
    );
  }

  if (!spotlightMovie) {
    return null;
  }

  const posterUrl = spotlightMovie.poster_path
    ? `https://image.tmdb.org/t/p/w500${spotlightMovie.poster_path}`
    : "https://via.placeholder.com/500x750?text=No+Image";

  const year = spotlightMovie.release_date
    ? new Date(spotlightMovie.release_date).getFullYear()
    : "";
  
  const runtime = movieDetails?.runtime ? `${movieDetails.runtime}m` : "";
  const genres = movieDetails?.genres?.map((g: any) => g.name).join(", ") || "";
  // Try to get rating from release_dates or content_ratings
  const rating = movieDetails?.release_dates?.results?.[0]?.release_dates?.[0]?.certification 
    || movieDetails?.content_ratings?.results?.[0]?.rating
    || "N/A";
  
  // Calculate Flickslounge score (based on vote_average, scaled to 10)
  const flicksloungeScore = spotlightMovie.vote_average 
    ? spotlightMovie.vote_average.toFixed(1)
    : "0.0";

  const cast = credits?.cast?.slice(0, 4) || [];
  const isInWatchlist = watchlist.includes(spotlightMovie.id);

  return (
    <div className="mb-12 bg-[#141414] rounded-2xl px-6 py-6 text-white">
      <h2 className="text-2xl font-bold mb-6">Spotlight Selection</h2>
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Poster */}
        <div className="flex-shrink-0">
          <img
            src={posterUrl}
            alt={spotlightMovie.title || spotlightMovie.name}
            className="w-full max-w-[300px] rounded-lg shadow-lg"
          />
        </div>

        {/* Details */}
        <div className="flex-1">
          <h1 className="text-4xl font-bold mb-4">
            {spotlightMovie.title || spotlightMovie.name}
          </h1>
          
          <div className="flex items-center gap-4 mb-4 text-white/80">
            {year && <span>{year}</span>}
            {rating && <span>• {rating}</span>}
            {runtime && <span>• {runtime}</span>}
            {genres && <span>• {genres}</span>}
          </div>

          {/* Score */}
          <div className="flex items-center gap-3 mb-6">
            <div className="text-5xl font-bold">{flicksloungeScore}</div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded-full bg-green-500"></div>
                <span className="text-sm text-white/80">Flickslounge score</span>
              </div>
              <div className="text-xs text-white/60">Trending upward</div>
            </div>
          </div>

          {/* Synopsis */}
          <p className="text-white/90 mb-6 leading-relaxed">
            {spotlightMovie.overview || "No synopsis available."}
          </p>

          {/* Where to watch */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-white/70 mb-2">Where to watch</h3>
            <div className="flex gap-3">
              <Button variant="outline" className="border-flicks-teal text-white hover:bg-flicks-teal/20">
                Netflix
              </Button>
              <Button variant="outline" className="border-flicks-teal text-white hover:bg-flicks-teal/20">
                Prime
              </Button>
              <Button variant="outline" className="border-flicks-teal text-white hover:bg-flicks-teal/20">
                Tickets
              </Button>
            </div>
          </div>

          {/* Cast */}
          {cast.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-white/70 mb-3">Cast</h3>
              <div className="flex gap-4">
                {cast.map((actor: any) => (
                  <div key={actor.id} className="flex flex-col items-center">
                    <Avatar className="w-16 h-16 border border-flicks-teal">
                      <AvatarImage 
                        src={actor.profile_path 
                          ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
                          : undefined
                        } 
                      />
                      <AvatarFallback className="bg-flicks-teal text-flicks-light">
                        {actor.name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-white/80 mt-2 text-center max-w-[80px] truncate">
                      {actor.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-6 pt-4 border-t border-flicks-teal/20">
            <Button
              variant="link"
              className="text-flicks-teal hover:text-flicks-sage p-0"
              onClick={() => onAddWatchlist && onAddWatchlist(spotlightMovie.id, "movie")}
            >
              <Plus className="w-4 h-4 mr-2" />
              {isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
            </Button>
            <span className="text-white/60">248 Reviews</span>
            <Button
              variant="ghost"
              size="icon"
              className="text-white/60 hover:text-white"
            >
              <Share2 className="w-4 h-4" />
            </Button>
            <span className="text-white/60">Share</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpotlightSelection;

