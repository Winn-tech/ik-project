/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { tmdbAPI, favoritesAPI, watchlistAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoaderCircle, Search, Filter, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import MovieCard from "@/components/MovieCard";
import { toast } from "sonner";
import { useInView } from "react-intersection-observer";

const MoviesPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  // Search, pagination, genres
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);

  // Favorites / Watchlist
  const [favorites, setFavorites] = useState<number[]>([]);
  const [watchlist, setWatchlist] = useState<number[]>([]);

  // Fetched movie results
  const [movies, setMovies] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);

  // Show/hide filters
  const [showFilters, setShowFilters] = useState(false);

  // Intersection observer (like old code). threshold=0.5 => triggers sooner
  const { ref: loadMoreRef, inView } = useInView({ threshold: 0.5 });

  // Queries
  const { data: genresData } = useQuery({
    queryKey: ["movieGenres"],
    queryFn: tmdbAPI.getMovieGenres,
    staleTime: 24 * 60 * 60 * 1000
  });

  const {
    data: searchResults,
    isLoading: searchLoading,
    isFetching: searchFetching,
    refetch: refetchSearch
  } = useQuery({
    queryKey: ["movieSearch", debouncedSearchQuery, page],
    queryFn: async () => {
      if (!debouncedSearchQuery) return null;
      const url = `https://tmdb-proxy-server-kappa.vercel.app/api/tmdb/search/movie?query=${encodeURIComponent(
        debouncedSearchQuery
      )}&page=${page}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_TMDB_API_TOKEN || ""}`,
          "Content-Type": "application/json"
        }
      });
      return res.json();
    },
    enabled: !!debouncedSearchQuery
  });

  const {
    data: discoverMoviesData,
    isLoading: discoverLoading,
    isFetching: discoverFetching,
    refetch: refetchDiscover
  } = useQuery({
    queryKey: ["discoverMovies", page, selectedGenres],
    queryFn: async () => {
      const base = selectedGenres.length
        ? `https://tmdb-proxy-server-kappa.vercel.app/api/tmdb/discover/movie?page=${page}&with_genres=${selectedGenres.join(
            ","
          )}&sort_by=popularity.desc`
        : `https://tmdb-proxy-server-kappa.vercel.app/api/tmdb/movie/popular?page=${page}`;

      const res = await fetch(base, {
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_TMDB_API_TOKEN || ""}`,
          "Content-Type": "application/json"
        }
      });
      return res.json();
    },
    enabled: !debouncedSearchQuery
  });

  // Favorites
  const { data: favoritesData } = useQuery({
    queryKey: ["favorites"],
    queryFn: favoritesAPI.getAllFavorites,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000
  });

  // Watchlist
  const { data: watchlistData } = useQuery({
    queryKey: ["watchlist"],
    queryFn: watchlistAPI.getAllWatchlist,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000
  });

  // Debounce the search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== debouncedSearchQuery) {
        setDebouncedSearchQuery(searchQuery);
        setPage(1);
        setMovies([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (
      inView &&
      hasMore &&
      !searchLoading &&
      !discoverLoading
    ) {
      // Load next page
      console.log("Infinite scrolling: loading next page =>", page + 1);
      setPage((prev) => prev + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, hasMore, searchLoading, discoverLoading]);

  // Merge search results
  useEffect(() => {
    if (!searchResults) return;
    // If starting at page=1, replace array, else append
    if (page === 1) {
      setMovies(
        searchResults.results.map((m: any) => ({ ...m, media_type: "movie" }))
      );
    } else {
      setMovies((prev) => [
        ...prev,
        ...searchResults.results.map((m: any) => ({
          ...m,
          media_type: "movie"
        }))
      ]);
    }
    // stop infinite
    if (
      page >= searchResults.total_pages ||
      searchResults.results.length === 0
    ) {
      setHasMore(false);
    } else {
      setHasMore(true);
    }
  }, [searchResults, page]);

  // Merge discover/popular results
  useEffect(() => {
    if (!discoverMoviesData) return;
    const sorted = discoverMoviesData.results.sort(
      (a: any, b: any) => b.popularity - a.popularity
    );
    if (page === 1) {
      setMovies(sorted.map((m: any) => ({ ...m, media_type: "movie" })));
    } else {
      setMovies((prev) => [
        ...prev,
        ...sorted.map((m: any) => ({ ...m, media_type: "movie" }))
      ]);
    }
    if (
      page >= discoverMoviesData.total_pages ||
      discoverMoviesData.results.length === 0
    ) {
      setHasMore(false);
    } else {
      setHasMore(true);
    }
  }, [discoverMoviesData, page]);

  // Load local favorites
  useEffect(() => {
    if (favoritesData?.data) {
      const favIds = favoritesData.data.map((f: any) => f.media_id);
      setFavorites(favIds);
    }
  }, [favoritesData]);

  // Load local watchlist
  useEffect(() => {
    if (watchlistData?.data) {
      const wIds = watchlistData.data.map((w: any) => w.media_id);
      setWatchlist(wIds);
    }
  }, [watchlistData]);

  // If genres change or search changes => refetch
  useEffect(() => {
    if (debouncedSearchQuery) {
      refetchSearch();
    } else {
      refetchDiscover();
    }
  }, [selectedGenres, debouncedSearchQuery, refetchSearch, refetchDiscover]);

  // Handle add/remove favorites
  const handleAddFavorite = async (id: number, mediaType: "movie" | "tv") => {
    if (!isAuthenticated) {
      toast.error("Please login to add to favorites", {
        style: {
          background: '#4A2D2D',
          border: '1px solid #7C4A4A',
          color: '#F7F0F0',
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
            background: '#2D4A3E',
            border: '1px solid #4A7C59',
            color: '#F0F7F4',
          },
          closeButton: true,
        });
        setFavorites((prev) => prev.filter((fid) => fid !== id));
      } else {
        await favoritesAPI.addFavorite(mediaType, id);
        toast.success("Added to favorites", {
          style: {
            background: '#2D4A3E',
            border: '1px solid #4A7C59',
            color: '#F0F7F4',
          },
          closeButton: true,
        });
        setFavorites((prev) => [...prev, id]);
      }
    } catch (err) {
      console.error("Error updating favorites:", err);
      toast.error("Failed to update favorites", {
        style: {
          background: '#4A2D2D',
          border: '1px solid #7C4A4A',
          color: '#F7F0F0',
        },
        closeButton: true,
      });
    }
  };

  // Handle add/remove watchlist
  const handleAddWatchlist = async (id: number, mediaType: "movie" | "tv") => {
    if (!isAuthenticated) {
      toast.error("Please login to add to watchlist", {
        style: {
          background: '#4A2D2D',
          border: '1px solid #7C4A4A',
          color: '#F7F0F0',
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
            background: '#2D4A3E',
            border: '1px solid #4A7C59',
            color: '#F0F7F4',
          },
          closeButton: true,
        });
        setWatchlist((prev) => prev.filter((wid) => wid !== id));
      } else {
        await watchlistAPI.addToWatchlist(mediaType, id);
        toast.success("Added to watchlist", {
          style: {
            background: '#2D4A3E',
            border: '1px solid #4A7C59',
            color: '#F0F7F4',
          },
          closeButton: true,
        });
        setWatchlist((prev) => [...prev, id]);
      }
    } catch (err) {
      console.error("Error updating watchlist:", err);
      toast.error("Failed to update watchlist", {
        style: {
          background: '#4A2D2D',
          border: '1px solid #7C4A4A',
          color: '#F7F0F0',
        },
        closeButton: true,
      });
    }
  };

  // Toggle genres
  const toggleGenre = (genreId: number) => {
    if (selectedGenres.includes(genreId)) {
      setSelectedGenres((prev) => prev.filter((id) => id !== genreId));
    } else {
      setSelectedGenres((prev) => [...prev, genreId]);
    }
    setPage(1);
    setMovies([]);
  };

  // Clear filters
  const clearFilters = () => {
    setSelectedGenres([]);
    setPage(1);
    setMovies([]);
  };

  // Determine if its loading
  const isInitialLoad =
    (discoverLoading || searchLoading) &&
    movies.length === 0 &&
    (discoverFetching || searchFetching);

  return (
    <div className="container mx-auto py-24 px-4">
      <div className="flex flex-col mb-8">
        <h1 className="text-3xl font-bold text-flicks-light mb-4">Movies</h1>

        <div className="flex flex-col md:flex-row gap-4 mb-6 items-start">
          {/* Search Bar */}
          <div className="relative w-full md:w-1/2">
            <Input
              type="search"
              placeholder="Search movies..."
              className="pl-10 bg-flicks-dark/50 border-flicks-teal text-flicks-light"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-flicks-light/70" />
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
            <h3 className="w-full text-flicks-light mb-2 font-medium">
              Filter by Genre:
            </h3>
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

      {isInitialLoad ? (
        // Show skeleton placeholders
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex flex-col">
              <Skeleton className="aspect-[2/3] w-full rounded-md mb-2" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : movies.length === 0 ? (
        // No results
        <div className="text-center py-16">
          <p className="text-2xl text-flicks-light mb-4">No movies found</p>
          <p className="text-flicks-light/70">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <>
          {/* Movie Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {movies.map((movie) => (
              <MovieCard
                key={movie.id}
                id={movie.id}
                title={movie.title || "Unknown"}
                posterPath={movie.poster_path}
                releaseDate={movie.release_date}
                rating={movie.vote_average}
                mediaType="movie"
                isFavorite={favorites.includes(movie.id)}
                isInWatchlist={watchlist.includes(movie.id)}
                onAddFavorite={() => handleAddFavorite(movie.id, "movie")}
                onAddWatchlist={() => handleAddWatchlist(movie.id, "movie")}
              />
            ))}
          </div>

          {/* Intersection Observer Loader */}
          {hasMore && (
            <div ref={loadMoreRef} className="flex justify-center items-center p-8">
              {/* Keep it spinning if we are currently fetching */}
              <LoaderCircle
                className={`h-8 w-8 text-flicks-teal ${
                  discoverFetching || searchFetching ? "animate-spin" : ""
                }`}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MoviesPage;
