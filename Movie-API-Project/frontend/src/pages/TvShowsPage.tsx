/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-const */

import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { tmdbAPI, favoritesAPI, watchlistAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoaderCircle, Search, Filter, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import MovieCard from "@/components/MovieCard";
import { toast } from "@/lib/toast";

const TvShowsPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [watchlist, setWatchlist] = useState<number[]>([]);
  const [tvShows, setTvShows] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const loadingRef = useRef<HTMLDivElement>(null);

  // Fetch genres
  const { data: genresData } = useQuery({
    queryKey: ["tvGenres"],
    queryFn: tmdbAPI.getTVGenres,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });

  // Fetch search results if search query exists
  const { 
    data: searchResults, 
    isLoading: searchLoading,
    isFetching: searchFetching,
    refetch: refetchSearch
  } = useQuery({
    queryKey: ["tvSearch", debouncedSearchQuery, page],
    queryFn: async () => {
      if (!debouncedSearchQuery) return null;
      const response = await fetch(
        `https://tmdb-proxy-server-kappa.vercel.app/api/tmdb/search/tv?query=${encodeURIComponent(debouncedSearchQuery)}&page=${page}`,
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_TMDB_API_TOKEN || ""}`,
            "Content-Type": "application/json"
          }
        }
      );
      const data = await response.json();
      return data;
    },
    enabled: debouncedSearchQuery !== "",
  });

  // Fetch trending TV shows for first page
  const { data: trendingTvData } = useQuery({
    queryKey: ["trendingTv"],
    queryFn: tmdbAPI.getTrendingTVShows,
    enabled: page === 1 && debouncedSearchQuery === "" && selectedGenres.length === 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch popular/discover TV shows if no search query
  const { 
    data: discoverTvShowsData, 
    isLoading: discoverLoading,
    isFetching: discoverFetching,
    refetch: refetchDiscover
  } = useQuery({
    queryKey: ["discoverTvShows", page, selectedGenres],
    queryFn: async () => {
      let url = selectedGenres.length > 0
        ? `https://tmdb-proxy-server-kappa.vercel.app/api/tmdb/discover/tv?page=${page}&with_genres=${selectedGenres.join(',')}&sort_by=popularity.desc`
        : `https://tmdb-proxy-server-kappa.vercel.app/api/tmdb/tv/popular?page=${page}`;

      const response = await fetch(
        url,
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_TMDB_API_TOKEN || ""}`,
            "Content-Type": "application/json"
          }
        }
      );
      const data = await response.json();
      return data;
    },
    enabled: debouncedSearchQuery === "",
  });

  // Fetch user favorites if authenticated
  const { data: favoritesData } = useQuery({
    queryKey: ["favorites"],
    queryFn: favoritesAPI.getAllFavorites,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch user watchlist if authenticated
  const { data: watchlistData } = useQuery({
    queryKey: ["watchlist"],
    queryFn: watchlistAPI.getAllWatchlist,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Handle infinite scrolling
  useEffect(() => {
    // Create a new IntersectionObserver 
    const observer = new IntersectionObserver(
      (entries) => {
        // Check if the loading element is visible and to fetch more data
        if (entries[0].isIntersecting && hasMore && !discoverLoading && !searchLoading) {
          console.log("Loading more TV shows...");
          setPage((prevPage) => prevPage + 1);
        }
      },
      { threshold: 0.1 }
    );

    // Observe the loading element
    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }

    // Cleanup
    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [hasMore, discoverLoading, searchLoading, page]);

  // Handle search input with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchQuery !== debouncedSearchQuery) {
        setDebouncedSearchQuery(searchQuery);
        setPage(1);
        setTvShows([]);
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // Process search results
  useEffect(() => {
    if (searchResults) {
      if (page === 1) {
        setTvShows(searchResults.results.map((show: any) => ({ ...show, media_type: "tv" })));
      } else {
        setTvShows(prev => [
          ...prev,
          ...searchResults.results.map((show: any) => ({ ...show, media_type: "tv" }))
        ]);
      }
      setHasMore(page < searchResults.total_pages && searchResults.results.length > 0);
    }
  }, [searchResults, page]);

  // Process trending TV shows for first page - ensuring popular shows load first
  useEffect(() => {
    if (trendingTvData && page === 1 && debouncedSearchQuery === "" && selectedGenres.length === 0) {
      // Sort trending shows by popularity
      const sortedTrendingShows = [...trendingTvData].sort((a, b) => b.popularity - a.popularity);
      setTvShows(sortedTrendingShows.map((show: any) => ({ ...show, media_type: "tv" })));
      console.log("Loaded trending TV shows for first page");
    }
  }, [trendingTvData, page, debouncedSearchQuery, selectedGenres]);

  // Process discover/popular TV shows
  useEffect(() => {
    if (discoverTvShowsData) {
      // Sort results to put popular shows first
      const results = discoverTvShowsData.results.sort((a: any, b: any) => b.popularity - a.popularity);

      if (page === 1) {
        if (!(trendingTvData && debouncedSearchQuery === "" && selectedGenres.length === 0)) {
          setTvShows(results.map((show: any) => ({ ...show, media_type: "tv" })));
          console.log("Loaded discover/popular TV shows for first page");
        }
      } else {
        setTvShows(prev => [
          ...prev,
          ...results.map((show: any) => ({ ...show, media_type: "tv" }))
        ]);
        console.log(`Added page ${page} TV shows, total now: ${tvShows.length + results.length}`);
      }
      setHasMore(page < discoverTvShowsData.total_pages && discoverTvShowsData.results.length > 0);
    }
  }, [discoverTvShowsData, page, trendingTvData, debouncedSearchQuery, selectedGenres]);

  // Process favorites
  useEffect(() => {
    if (favoritesData?.data) {
      const favIds = favoritesData.data.map((fav: any) => fav.media_id);
      setFavorites(favIds);
    }
  }, [favoritesData]);

  // Process watchlist
  useEffect(() => {
    if (watchlistData?.data) {
      const watchIds = watchlistData.data.map((item: any) => item.media_id);
      setWatchlist(watchIds);
    }
  }, [watchlistData]);

  // Refetch when genres change
  useEffect(() => {
    if (debouncedSearchQuery) {
      refetchSearch();
    } else {
      refetchDiscover();
    }
  }, [selectedGenres, debouncedSearchQuery, refetchSearch, refetchDiscover]);

  const handleAddFavorite = async (id: number, mediaType: "movie" | "tv") => {
    if (!isAuthenticated) {
      toast.error("Please login to add to favorites");
      return;
    }

    try {
      if (favorites.includes(id)) {
        await favoritesAPI.removeFavorite(id);
        toast.success("Removed from favorites");
        setFavorites(favorites.filter(favId => favId !== id));
      } else {
        await favoritesAPI.addFavorite(mediaType, id);
        toast.success("Added to favorites");
        setFavorites([...favorites, id]);
      }
    } catch (error) {
      console.error("Error updating favorites:", error);
      toast.error("Failed to update favorites");
    }
  };

  const handleAddWatchlist = async (id: number, mediaType: "movie" | "tv") => {
    if (!isAuthenticated) {
      toast.error("Please login to add to watchlist");
      return;
    }

    try {
      if (watchlist.includes(id)) {
        await watchlistAPI.removeFromWatchlist(id);
        toast.success("Removed from watchlist");
        setWatchlist(watchlist.filter(watchId => watchId !== id));
      } else {
        await watchlistAPI.addToWatchlist(mediaType, id);
        toast.success("Added to watchlist");
        setWatchlist([...watchlist, id]);
      }
    } catch (error) {
      console.error("Error updating watchlist:", error);
      toast.error("Failed to update watchlist");
    }
  };

  const toggleGenre = (genreId: number) => {
    if (selectedGenres.includes(genreId)) {
      setSelectedGenres(selectedGenres.filter(id => id !== genreId));
    } else {
      setSelectedGenres([...selectedGenres, genreId]);
    }
    setPage(1);
    setTvShows([]);
  };

  const clearFilters = () => {
    setSelectedGenres([]);
    setPage(1);
    setTvShows([]);
  };

  const isLoading = discoverLoading || searchLoading || (!tvShows.length && (discoverFetching || searchFetching));

  return (
    <div className="container mx-auto py-24 px-4">
      <div className="flex flex-col mb-8">
        <h1 className="text-3xl font-bold text-flicks-light mb-4">TV Shows</h1>
        
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-start">
          {/* Search Bar */}
          <div className="relative w-full md:w-1/2">
            <Input
              type="search"
              placeholder="Search TV shows..."
              className="pl-10 bg-flicks-dark/50 border-flicks-teal text-flicks-light"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-flicks-light/70" />
          </div>
          
          {/* Filter Button */}
          <Button 
            variant="outline" 
            className="border-flicks-teal text-flicks-light hover:bg-flicks-teal/20"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="mr-2 h-4 w-4" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>
          
          {selectedGenres.length > 0 && (
            <Button 
              variant="ghost" 
              className="text-flicks-light hover:bg-red-500/20 hover:text-red-500"
              onClick={clearFilters}
            >
              <X className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          )}
        </div>
        
        {/* Genre Filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-2 mb-6 bg-flicks-dark/30 p-4 rounded-lg border border-flicks-teal/20">
            <h3 className="w-full text-flicks-light mb-2 font-medium">Filter by Genre:</h3>
            {genresData?.map((genre: { id: number; name: string }) => (
              <Button
                key={genre.id}
                variant={selectedGenres.includes(genre.id) ? "default" : "outline"}
                size="sm"
                className={
                  selectedGenres.includes(genre.id)
                    ? "bg-flicks-teal hover:bg-flicks-sage text-white"
                    : "border-flicks-teal/50 text-flicks-light hover:bg-flicks-teal/20"
                }
                onClick={() => toggleGenre(genre.id)}
              >
                {genre.name}
              </Button>
            ))}
          </div>
        )}
      </div>

      {isLoading && tvShows.length === 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex flex-col">
              <Skeleton className="aspect-[2/3] w-full rounded-md mb-2" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : tvShows.length === 0 && !isLoading ? (
        <div className="text-center py-16">
          <p className="text-2xl text-flicks-light mb-4">No TV shows found</p>
          <p className="text-flicks-light/70">Try adjusting your search or filters</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {tvShows.map((show) => (
              <MovieCard
                key={show.id}
                id={show.id}
                title={show.name || "Unknown"}
                posterPath={show.poster_path}
                releaseDate={show.first_air_date}
                rating={show.vote_average}
                mediaType="tv"
                isFavorite={favorites.includes(show.id)}
                isInWatchlist={watchlist.includes(show.id)}
                onAddFavorite={() => handleAddFavorite(show.id, "tv")}
                onAddWatchlist={() => handleAddWatchlist(show.id, "tv")}
              />
            ))}
          </div>
          
          <div 
            ref={loadingRef} 
            className="flex justify-center items-center p-8"
          >
            {hasMore && (
              <LoaderCircle className={`h-8 w-8 text-flicks-teal ${(discoverFetching || searchFetching) ? 'animate-spin' : ''}`} />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TvShowsPage;
