import React from "react";
import { useQuery } from "@tanstack/react-query";
import { tmdbAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const ComingSoon: React.FC = () => {
  const navigate = useNavigate();

  const { data: upcomingData, isLoading } = useQuery({
    queryKey: ["upcomingMovies", 1, ""],
    queryFn: tmdbAPI.getUpcomingMovies,
    staleTime: 5 * 60 * 1000,
  });

  const handleNotify = (movieId: number, title: string) => {
    toast.success(`You'll be notified when ${title} is available!`, {
      style: {
        background: '#2D4A3E',
        border: '1px solid #4A7C59',
        color: '#F0F7F4',
      },
      closeButton: true,
    });
  };

  if (isLoading) {
    return (
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-flicks-light">Coming Soon</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-64 w-48 flex-shrink-0 bg-flicks-dark" />
          ))}
        </div>
      </div>
    );
  }

  const upcomingMovies = upcomingData && typeof upcomingData === 'object' && upcomingData !== null && 'results' in upcomingData 
    ? (upcomingData as { results: any[] }).results.slice(0, 6) 
    : [];

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-flicks-light">Coming Soon</h2>
        <Button
          variant="link"
          className="text-flicks-teal hover:text-flicks-sage"
          onClick={() => navigate("/upcoming")}
        >
          View Calendar
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {upcomingMovies.map((movie: any) => {
          const posterUrl = movie.poster_path
            ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
            : "https://via.placeholder.com/300x450?text=No+Image";
          
          const releaseDate = movie.release_date
            ? new Date(movie.release_date)
            : null;
          
          const formattedDate = releaseDate
            ? releaseDate.toLocaleDateString("en-US", { 
                month: "long", 
                day: "numeric", 
                year: "numeric" 
              })
            : "TBA";

          return (
            <div
              key={movie.id}
              className="flex-shrink-0 w-48 group cursor-pointer"
              onClick={() => navigate(`/movie/${movie.id}`)}
            >
              <div className="relative mb-3">
                <img
                  src={posterUrl}
                  alt={movie.title}
                  className="w-full rounded-lg shadow-lg transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
              </div>
              <h3 className="text-sm font-semibold text-flicks-light mb-1 line-clamp-2">
                {movie.title}
              </h3>
              <div className="flex items-center gap-2 text-xs text-flicks-light/60 mb-3">
                <Calendar className="w-3 h-3" />
                <span>{formattedDate}</span>
              </div>
              <Button
                size="sm"
                className="w-full bg-flicks-teal hover:bg-flicks-sage text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNotify(movie.id, movie.title);
                }}
              >
                <Bell className="w-3 h-3 mr-2" />
                Notify
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ComingSoon;

