import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { tmdbAPI, favoritesAPI, watchlistAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import HeroSection from "@/components/HeroSection";
import HottestCircles from "@/components/HottestCircles";
import TrendingCarousel from "@/components/TrendingCarousel";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";
import "@/styles/layout.css";

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState<number[]>([]);
  const [watchlist, setWatchlist] = useState<number[]>([]);

  // Fetch trending movies
  const {
    data: trendingMovies,
    isLoading: isLoadingTrendingMovies,
    error: trendingMoviesError,
  } = useQuery({
    queryKey: ["trendingMovies"],
    queryFn: tmdbAPI.getTrendingMovies,
    retry: 2,
    staleTime: 5 * 60 * 1000, 
  });

  // Fetch trending TV shows
  const {
    data: trendingTVShows,
    isLoading: isLoadingTrendingTVShows,
    error: trendingTVShowsError,
  } = useQuery({
    queryKey: ["trendingTVShows"],
    queryFn: tmdbAPI.getTrendingTVShows,
    retry: 2,
    staleTime: 5 * 60 * 1000, 
  });

  // Fetch popular movies - updated to use queryKey for page parameter
  const { data: popularMovies, isLoading: isLoadingPopularMovies } = useQuery({
    queryKey: ["popularMovies", 1],
    queryFn: tmdbAPI.getPopularMovies,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch popular TV shows - updated to use queryKey for page parameter
  const { data: popularTVShows, isLoading: isLoadingPopularTVShows } = useQuery(
    {
      queryKey: ["popularTVShows", 1],
      queryFn: tmdbAPI.getPopularTVShows,
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  );

  // Fetch user's favorites - only if authenticated
  const { data: favoritesData, refetch: refetchFavorites } = useQuery({
    queryKey: ["favorites"],
    queryFn: favoritesAPI.getAllFavorites,
    enabled: isAuthenticated,
    retry: 1,
  });

  // Fetch user's watchlist - only if authenticated
  const { data: watchlistData, refetch: refetchWatchlist } = useQuery({
    queryKey: ["watchlist"],
    queryFn: watchlistAPI.getAllWatchlist,
    enabled: isAuthenticated,
    retry: 1,
  });

  useEffect(() => {
    if (favoritesData?.data) {
      const favIds = favoritesData.data.map((fav: any) => fav.media_id);
      setFavorites(favIds);
    }
  }, [favoritesData]);

  useEffect(() => {
    if (watchlistData?.data) {
      const watchIds = watchlistData.data.map((item: any) => item.media_id);
      setWatchlist(watchIds);
    }
  }, [watchlistData]);

  const handleAddFavorite = async (id: number, mediaType: "movie" | "tv") => {
    if (!isAuthenticated) {
      toast.error("Please login to add to favorites", {
        style: {
          background: "#4A2D2D",
          border: "1px solid #7C4A4A",
          color: "#F7F0F0",
        },
        closeButton: true,
      });
      return;
    }

    try {
      if (favorites.includes(id)) {
        await favoritesAPI.removeFavorite(id);
        toast.success("Removed from favorites", {
          style: {
            background: "#2D4A3E",
            border: "1px solid #4A7C59",
            color: "#F0F7F4",
          },
          closeButton: true,
        });
        setFavorites(favorites.filter((favId) => favId !== id));
      } else {
        await favoritesAPI.addFavorite(mediaType, id);
        toast.success("Added to favorites", {
          style: {
            background: "#2D4A3E",
            border: "1px solid #4A7C59",
            color: "#F0F7F4",
          },
          closeButton: true,
        });
        setFavorites([...favorites, id]);
      }
      refetchFavorites();
    } catch (error) {
      console.error("Error updating favorites:", error);
      toast.error("Failed to update favorites", {
        style: {
          background: "#4A2D2D",
          border: "1px solid #7C4A4A",
          color: "#F7F0F0",
        },
        closeButton: true,
      });
    }
  };

  const handleAddWatchlist = async (id: number, mediaType: "movie" | "tv") => {
    if (!isAuthenticated) {
      toast.error("Please login to add to watchlist", {
        style: {
          background: "#4A2D2D",
          border: "1px solid #7C4A4A",
          color: "#F7F0F0",
        },
        closeButton: true,
      });
      return;
    }

    try {
      if (watchlist.includes(id)) {
        await watchlistAPI.removeFromWatchlist(id);
        toast.success("Removed from watchlist", {
          style: {
            background: "#2D4A3E",
            border: "1px solid #4A7C59",
            color: "#F0F7F4",
          },
          closeButton: true,
        });
        setWatchlist(watchlist.filter((watchId) => watchId !== id));
      } else {
        await watchlistAPI.addToWatchlist(mediaType, id);
        toast.success("Added to watchlist", {
          style: {
            background: "#2D4A3E",
            border: "1px solid #4A7C59",
            color: "#F0F7F4",
          },
          closeButton: true,
        });
        setWatchlist([...watchlist, id]);
      }
      refetchWatchlist();
    } catch (error) {
      console.error("Error updating watchlist:", error);
      toast.error("Failed to update watchlist", {
        style: {
          background: "#4A2D2D",
          border: "1px solid #7C4A4A",
          color: "#F7F0F0",
        },
        closeButton: true,
      });
    }
  };

  const isLoading =
    isLoadingTrendingMovies ||
    isLoadingTrendingTVShows ||
    isLoadingPopularMovies ||
    isLoadingPopularTVShows;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoaderCircle className="w-10 h-10 text-flicks-teal animate-spin" />
      </div>
    );
  }

  // Fallback data for carousels if trending endpoints fail
  const trendingMoviesForCarousel =
    (!trendingMoviesError &&
    Array.isArray(trendingMovies) &&
    trendingMovies.length > 0
      ? trendingMovies
      : popularMovies) || [];

  const trendingTVShowsForCarousel =
    (!trendingTVShowsError &&
    Array.isArray(trendingTVShows) &&
    trendingTVShows.length > 0
      ? trendingTVShows
      : popularTVShows) || [];

  // Movies to drive the hero section (top 5)
  const heroMovies =
    trendingMoviesForCarousel.slice(0, 5).map((movie: any) => ({
      ...movie,
      media_type: "movie" as const,
    })) || [];

  return (
    <div className="bg-flicks-dark">
      {/* Hero Section */}
      {heroMovies.length > 0 && (
        <HeroSection
          movies={heroMovies}
          onAddFavorite={handleAddFavorite}
          onAddWatchlist={handleAddWatchlist}
          favorites={favorites}
          watchlist={watchlist}
        />
      )}

      {/* Main content below hero */}
      <div className="homepage__container px-4 py-8 -mt-16 relative z-10 space-y-10">
        {/* Hottest Circles Section */}
        <HottestCircles />

        {/* Trending Movies Carousel */}
        <section className="max-w-[100vw]">
          {trendingMoviesForCarousel.length > 0 && (
          <TrendingCarousel
            title="Trending Movies"
            description="Discover the most popular movies right now."
            items={trendingMoviesForCarousel}
            mediaType="movie"
            favorites={favorites}
            watchlist={watchlist}
            onAddFavorite={handleAddFavorite}
            onAddWatchlist={handleAddWatchlist}
          />
        )}
        </section>

        {/* Trending TV Shows Carousel */}
        {trendingTVShowsForCarousel.length > 0 && (
          <TrendingCarousel
            title="Trending TV Shows"
            description="Explore the hottest TV series everyone's talking about."
            items={trendingTVShowsForCarousel}
            mediaType="tv"
            favorites={favorites}
            watchlist={watchlist}
            onAddFavorite={handleAddFavorite}
            onAddWatchlist={handleAddWatchlist}
          />
        )}
      </div>
    </div>
  );
};

export default HomePage;