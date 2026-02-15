
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { favoritesAPI, tmdbAPI } from "@/lib/api";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { LoaderCircle, Trash2, Film, Tv, Heart } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

interface FavoriteItem {
  _id: string;
  media_type: string;
  media_id: number;
  favorite: boolean;
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

const FavoritesPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  const { data: favorites, isLoading, error, refetch } = useQuery({
    queryKey: ['favorites'],
    queryFn: favoritesAPI.getAllFavorites,
    enabled: isAuthenticated,
  });

  const removeFromFavorites = async (mediaId: number) => {
    try {
      await favoritesAPI.removeFavorite(mediaId);
      toast.success("Removed from favorites");
      refetch();
    } catch (error) {
      toast.error("Failed to remove from favorites");
    }
  };

  // Fetch details for each favorite item
  const fetchMediaDetails = async (item: FavoriteItem) => {
    try {
      if (item.media_type === "movie") {
        return await tmdbAPI.getMovieDetails(item.media_id);
      } else if (item.media_type === "tv") {
        return await tmdbAPI.getTVShowDetails(item.media_id);
      }
    } catch (error) {
      console.error("Error fetching media details:", error);
      return null;
    }
  };

  const { data: mediaDetailsArray, isLoading: detailsLoading } = useQuery({
    queryKey: ['favoritesDetails', favorites],
    queryFn: async () => {
      if (!favorites?.data) return [];
      
      const promises = favorites.data.map(fetchMediaDetails);
      const results = await Promise.all(promises);
      
      return results.filter(result => result !== null) as MediaDetails[];
    },
    enabled: !!favorites?.data && favorites.data.length > 0,
  });

  if (error) {
    toast.error("Failed to load favorites");
  }

  return (
    <div className="container mx-auto py-24 px-4">
      <h1 className="text-3xl font-bold mb-8 text-flicks-light">My Favorites</h1>
      
      {(isLoading || detailsLoading) ? (
        <div className="flex justify-center p-12">
          <LoaderCircle className="animate-spin h-12 w-12 text-flicks-teal" />
        </div>
      ) : (
        <>
          {mediaDetailsArray && mediaDetailsArray.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {mediaDetailsArray.map((media, index) => {
                const favoriteItem = favorites?.data[index];
                if (!favoriteItem || !media) return null;
                
                const title = media.title || media.name || "Unknown Title";
                
                return (
                  <Card key={favoriteItem._id} className="bg-flicks-dark/70 border-flicks-teal/30 overflow-hidden">
                    <div className="relative">
                      <img 
                        src={media.poster_path ? `https://image.tmdb.org/t/p/w500${media.poster_path}` : '/placeholder.svg'} 
                        alt={title}
                        className="w-full aspect-[2/3] object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder.svg';
                        }}
                      />
                      <div className="absolute top-2 right-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="rounded-full bg-flicks-teal/80 text-white h-8 w-8 p-0"
                          onClick={() => removeFromFavorites(favoriteItem.media_id)}
                        >
                          <Heart className="h-4 w-4 fill-current" />
                        </Button>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                        <div className="flex items-center gap-2">
                          <span className="bg-flicks-teal/80 text-white px-2 py-1 rounded text-xs">
                            {media.vote_average.toFixed(1)}
                          </span>
                          <span className="bg-flicks-dark/80 text-flicks-light px-2 py-1 rounded-md text-xs flex items-center gap-1">
                            {favoriteItem.media_type === "movie" ? (
                              <><Film className="h-3 w-3" /> Movie</>
                            ) : (
                              <><Tv className="h-3 w-3" /> TV</>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-md text-flicks-light line-clamp-1" title={title}>
                        {title}
                      </CardTitle>
                    </CardHeader>
                    <CardFooter className="p-3 pt-0 flex justify-between">
                      <Button 
                        variant="outline" 
                        size="sm"
                        asChild
                        className="border-flicks-teal/50 text-flicks-light hover:bg-flicks-teal/20 w-full"
                      >
                        <a 
                          href={`/${favoriteItem.media_type}/${favoriteItem.media_id}`} 
                          className="flex items-center justify-center gap-1"
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
              <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-medium">Your favorites list is empty</h3>
              <p className="mt-2 mb-6">Browse movies and TV shows to add to your favorites</p>
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

export default FavoritesPage;
