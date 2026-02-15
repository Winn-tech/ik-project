
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { watchlistAPI, tmdbAPI } from "@/lib/api";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { LoaderCircle, Trash2, Film, Tv } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

interface WatchlistItem {
  _id: string;
  media_type: string;
  media_id: number;
  watchlist: boolean;
  uploadedBy: string;
  uploadedAt: string;
}

interface MediaDetails {
  id: number;
  title?: string;
  name?: string;
  poster_path: string;
  overview: string;
  vote_average: number;
  media_type: string;
}

const WatchlistPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [mediaDetailsMap, setMediaDetailsMap] = useState<Record<number, MediaDetails>>({});

  const { data: watchlist, isLoading, error, refetch } = useQuery({
    queryKey: ['watchlist'],
    queryFn: watchlistAPI.getAllWatchlist,
    enabled: isAuthenticated,
    retry: 1,
  });

  const removeFromWatchlist = async (mediaId: number) => {
    try {
      await watchlistAPI.removeFromWatchlist(mediaId);
      toast.success("Removed from watchlist");
      refetch();
    } catch (error) {
      toast.error("Failed to remove from watchlist");
    }
  };

  // Fetch details for all watchlist items in parallel
  useEffect(() => {
    const fetchMediaDetails = async () => {
      if (!watchlist?.data || !watchlist.data.length) return;
      
      const detailsPromises = watchlist.data.map(async (item: WatchlistItem) => {
        try {
          let mediaDetails;
          if (item.media_type === "movie") {
            mediaDetails = await tmdbAPI.getMovieDetails(item.media_id);
          } else if (item.media_type === "tv") {
            mediaDetails = await tmdbAPI.getTVShowDetails(item.media_id);
          }
          
          // Ensure we have a valid result
          if (mediaDetails) {
            return { mediaId: item.media_id, details: mediaDetails };
          }
          return null;
        } catch (error) {
          console.error(`Error fetching details for ${item.media_type} ${item.media_id}:`, error);
          return null;
        }
      });
      
      try {
        const results = await Promise.all(detailsPromises);
        const detailsMap: Record<number, MediaDetails> = {};
        
        results.forEach(result => {
          if (result) {
            detailsMap[result.mediaId] = {
              ...result.details,
              media_type: watchlist.data.find(
                (item: WatchlistItem) => item.media_id === result.mediaId
              )?.media_type || "unknown"
            };
          }
        });
        
        setMediaDetailsMap(detailsMap);
      } catch (error) {
        console.error("Error processing media details:", error);
      }
    };
    
    fetchMediaDetails();
  }, [watchlist]);

  if (error) {
    toast.error("Failed to load watchlist");
  }

  return (
    <div className="container mx-auto py-24 px-4">
      <h1 className="text-3xl font-bold mb-8 text-flicks-light">My Watchlist</h1>
      
      {isLoading ? (
        <div className="flex justify-center p-12">
          <LoaderCircle className="animate-spin h-12 w-12 text-flicks-teal" />
        </div>
      ) : (
        <>
          {watchlist?.data && watchlist.data.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {watchlist.data.map((item: WatchlistItem) => {
                const mediaDetails = mediaDetailsMap[item.media_id];
                
                return (
                  <Card key={item._id} className="bg-flicks-dark/70 border-flicks-teal/30 overflow-hidden">
                    <div className="flex h-[200px]">
                      <div className="w-1/3 overflow-hidden">
                        <img 
                          src={mediaDetails?.poster_path ? `https://image.tmdb.org/t/p/w342${mediaDetails.poster_path}` : '/placeholder.svg'} 
                          alt={mediaDetails?.title || mediaDetails?.name || "Media poster"}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder.svg';
                          }}
                        />
                      </div>
                      <div className="w-2/3 p-4">
                        <CardHeader className="p-0 pb-2">
                          <CardTitle className="text-lg text-flicks-light">
                            {mediaDetails?.title || mediaDetails?.name || "Loading title..."}
                          </CardTitle>
                          <div className="flex items-center mt-1">
                            <span className="bg-flicks-teal/20 text-flicks-light px-2 py-1 rounded-md text-xs flex items-center gap-1">
                              {item.media_type === "movie" ? (
                                <><Film className="h-3 w-3" /> Movie</>
                              ) : (
                                <><Tv className="h-3 w-3" /> TV Show</>
                              )}
                            </span>
                            {mediaDetails && (
                              <span className="ml-2 text-xs text-flicks-light/70">
                                Rating: {mediaDetails.vote_average.toFixed(1)}/10
                              </span>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="p-0 py-2">
                          <p className="text-xs text-flicks-light/80 line-clamp-4">
                            {mediaDetails?.overview || "Loading description..."}
                          </p>
                        </CardContent>
                      </div>
                    </div>
                    <CardFooter className="px-4 py-3 flex justify-between border-t border-flicks-teal/20">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeFromWatchlist(item.media_id)}
                        className="text-flicks-light hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        asChild
                        className="border-flicks-teal/50 text-flicks-light hover:bg-flicks-teal/20"
                      >
                        <a 
                          href={`/${item.media_type}/${item.media_id}`} 
                          className="flex items-center gap-1"
                        >
                          View Details
                        </a>
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-flicks-light/70 bg-flicks-dark/50 rounded-lg">
              <Film className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-medium">Your watchlist is empty</h3>
              <p className="mt-2 mb-6">Browse movies and TV shows to add to your watchlist</p>
              <div className="flex justify-center gap-4">
                <Button asChild variant="outline" className="border-flicks-teal/50 text-flicks-light hover:bg-flicks-teal/20">
                  <a href="/movies">Browse Movies</a>
                </Button>
                <Button asChild variant="outline" className="border-flicks-teal/50 text-flicks-light hover:bg-flicks-teal/20">
                  <a href="/tv">Browse TV Shows</a>
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WatchlistPage;
