
import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { tmdbAPI, favoritesAPI, watchlistAPI } from "@/lib/api";
import { toast } from "@/lib/toast";
import MovieCard from "@/components/MovieCard";
import { LoaderCircle, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [favorites, setFavorites] = useState<number[]>([]);
  const [watchlist, setWatchlist] = useState<number[]>([]);
  const { isAuthenticated } = useAuth();

  // Fetch search results
  const { 
    data: searchResults, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['search', queryParam],
    queryFn: () => tmdbAPI.searchMulti(queryParam),
    enabled: queryParam.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Fetch user's favorites
  const { data: favoritesData, refetch: refetchFavorites } = useQuery({
    queryKey: ["favorites"],
    queryFn: favoritesAPI.getAllFavorites,
    enabled: isAuthenticated,
  });

  // Fetch user's watchlist
  const { data: watchlistData, refetch: refetchWatchlist } = useQuery({
    queryKey: ["watchlist"],
    queryFn: watchlistAPI.getAllWatchlist,
    enabled: isAuthenticated,
  });

  useEffect(() => {
    setSearchQuery(queryParam);
  }, [queryParam]);

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery });
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchParams({});
  };
  
  const handleAddFavorite = async (id: number, mediaType: "movie" | "tv") => {
    if (!isAuthenticated) {
      toast.error("Please login to add to favorites");
      return;
    }

    try {
      if (favorites.includes(id)) {
        await favoritesAPI.removeFavorite(id);
        toast.success("Removed from favorites");
        setFavorites(favorites.filter((favId) => favId !== id));
      } else {
        await favoritesAPI.addFavorite(mediaType, id);
        toast.success("Added to favorites");
        setFavorites([...favorites, id]);
      }
      refetchFavorites();
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
        setWatchlist(watchlist.filter((watchId) => watchId !== id));
      } else {
        await watchlistAPI.addToWatchlist(mediaType, id);
        toast.success("Added to watchlist");
        setWatchlist([...watchlist, id]);
      }
      refetchWatchlist();
    } catch (error) {
      console.error("Error updating watchlist:", error);
      toast.error("Failed to update watchlist");
    }
  };

  // Filter results by media type
  const filteredResults = React.useMemo(() => {
    if (!searchResults) return [];
    
    if (activeTab === "all") {
      return searchResults.filter((item: any) => 
        item.media_type === "movie" || 
        item.media_type === "tv" ||
        item.media_type === "person"
      );
    }
    
    return searchResults.filter((item: any) => item.media_type === activeTab);
  }, [searchResults, activeTab]);

  // Count results by type
  const resultCounts = React.useMemo(() => {
    if (!searchResults) return { all: 0, movie: 0, tv: 0, person: 0 };
    
    return {
      all: searchResults.length,
      movie: searchResults.filter((item: any) => item.media_type === "movie").length,
      tv: searchResults.filter((item: any) => item.media_type === "tv").length,
      person: searchResults.filter((item: any) => item.media_type === "person").length
    };
  }, [searchResults]);

  if (error) {
    toast.error("Failed to load search results");
  }

  // Helper function to render results
  const renderResults = (results: any[]) => {
    if (isLoading) {
      return (
        <div className="flex justify-center p-12">
          <LoaderCircle className="animate-spin h-12 w-12 text-flicks-teal" />
        </div>
      );
    }
    
    if (results.length === 0) {
      return (
        <div className="text-center py-12 text-flicks-light/70">
          <h3 className="text-xl font-medium">No results found</h3>
          <p className="mt-2">Try searching for something else</p>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {results.map((item: any) => {
          if (item.media_type === "movie") {
            return (
              <MovieCard
                key={item.id}
                id={item.id}
                title={item.title}
                posterPath={item.poster_path}
                releaseDate={item.release_date}
                rating={item.vote_average}
                mediaType="movie"
                isFavorite={favorites.includes(item.id)}
                isInWatchlist={watchlist.includes(item.id)}
                onAddFavorite={() => handleAddFavorite(item.id, "movie")}
                onAddWatchlist={() => handleAddWatchlist(item.id, "movie")}
              />
            );
          } else if (item.media_type === "tv") {
            return (
              <MovieCard
                key={item.id}
                id={item.id}
                title={item.name}
                posterPath={item.poster_path}
                releaseDate={item.first_air_date}
                rating={item.vote_average}
                mediaType="tv"
                isFavorite={favorites.includes(item.id)}
                isInWatchlist={watchlist.includes(item.id)}
                onAddFavorite={() => handleAddFavorite(item.id, "tv")}
                onAddWatchlist={() => handleAddWatchlist(item.id, "tv")}
              />
            );
          } else if (item.media_type === "person") {
            return (
              <div key={item.id} className="relative overflow-hidden rounded-md bg-flicks-dark shadow-md">
                <div className="aspect-[2/3] overflow-hidden">
                  <img
                    src={item.profile_path ? `https://image.tmdb.org/t/p/w500${item.profile_path}` : "https://via.placeholder.com/500x750?text=No+Image"}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3">
                  <h3 className="font-semibold text-flicks-light">{item.name}</h3>
                  <p className="text-sm text-flicks-light/80">Person</p>
                </div>
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-24 px-4">
      <h1 className="text-3xl font-bold mb-8 text-flicks-light">Search Results</h1>
      
      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-8 relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input 
              type="search"
              placeholder="Search for movies, TV shows, or people..."
              className="w-full bg-flicks-dark border-flicks-teal text-flicks-light pl-4 pr-10 py-6 text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleClearSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-flicks-light/70 hover:text-flicks-light"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
          <Button 
            type="submit" 
            className="bg-flicks-teal hover:bg-flicks-sage px-8"
          >
            Search
          </Button>
        </div>
      </form>
      
      {queryParam ? (
        <div className="mb-6">
          <p className="text-flicks-light text-lg">
            Search results for: <Badge variant="outline" className="text-flicks-teal border-flicks-teal ml-2 text-base font-normal">{queryParam}</Badge>
          </p>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-flicks-light/70 text-lg">Enter a search term to find movies, TV shows, and people</p>
        </div>
      )}
      
      {queryParam && (
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="bg-flicks-dark border-b border-flicks-teal/30">
            <TabsTrigger 
              value="all" 
              className="text-flicks-light data-[state=active]:text-flicks-teal"
            >
              All ({resultCounts.all})
            </TabsTrigger>
            <TabsTrigger 
              value="movie" 
              className="text-flicks-light data-[state=active]:text-flicks-teal"
            >
              Movies ({resultCounts.movie})
            </TabsTrigger>
            <TabsTrigger 
              value="tv" 
              className="text-flicks-light data-[state=active]:text-flicks-teal"
            >
              TV Shows ({resultCounts.tv})
            </TabsTrigger>
            <TabsTrigger 
              value="person" 
              className="text-flicks-light data-[state=active]:text-flicks-teal"
            >
              People ({resultCounts.person})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            {renderResults(filteredResults)}
          </TabsContent>
          
          <TabsContent value="movie">
            {renderResults(filteredResults)}
          </TabsContent>
          
          <TabsContent value="tv">
            {renderResults(filteredResults)}
          </TabsContent>
          
          <TabsContent value="person">
            {renderResults(filteredResults)}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default SearchPage;
