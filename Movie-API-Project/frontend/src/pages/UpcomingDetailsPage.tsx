import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { tmdbAPI, watchlistAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  Clock,
  Star,
  ChevronLeft,
  Users,
  Clapperboard,
  Languages,
  Globe,
  Bookmark,
  Tv,
  Film,
  BookmarkPlus,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const UpcomingDetailsPage: React.FC = () => {
  const { id, mediaType } = useParams<{ id: string; mediaType: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  
  // Validate media type
  const validMediaType = mediaType === "movie" || mediaType === "tv" ? mediaType : "movie";
  
  const { data: media, isLoading } = useQuery({
    queryKey: ["upcomingDetails", validMediaType, id],
    queryFn: () => tmdbAPI.getUpcomingMediaDetails(id, validMediaType),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    meta: {
      error: (error: any) => {
        console.error("Error fetching media details:", error);
        toast.error("Failed to load details");
      }
    }
  });

  // Check if media is in watchlist
  const { data: watchlistData, refetch: refetchWatchlist } = useQuery({
    queryKey: ["watchlist"],
    queryFn: watchlistAPI.getAllWatchlist,
    enabled: isAuthenticated
  });

  const isInWatchlist = React.useMemo(() => {
    if (!watchlistData?.data || !id) return false;
    return watchlistData.data.some((item: any) => item.media_id.toString() === id);
  }, [watchlistData, id]);

  const isMovie = validMediaType === "movie";
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return "TBA";
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const getCertification = () => {
    if (!media) return "Not Rated";
    
    if (isMovie && media.release_dates?.results) {
      const usRelease = media.release_dates.results.find(
        (r: any) => r.iso_3166_1 === "US"
      );
      if (usRelease?.release_dates?.[0]?.certification) {
        return usRelease.release_dates[0].certification;
      }
    } else if (!isMovie && media.content_ratings?.results) {
      const usRating = media.content_ratings.results.find(
        (r: any) => r.iso_3166_1 === "US"
      );
      if (usRating?.rating) {
        return usRating.rating;
      }
    }
    
    return "Not Rated";
  };
  
  const getDirector = () => {
    if (!media?.credits?.crew) return "Unknown";
    
    const director = isMovie
      ? media.credits.crew.find((person: any) => person.job === "Director")
      : media.credits.crew.find((person: any) => 
          person.job === "Executive Producer" || person.job === "Creator"
        );
        
    return director?.name || "Unknown";
  };
  
  const getTrailerKey = () => {
    if (!media?.videos?.results) return null;
    
    const trailer = media.videos.results.find(
      (video: any) => video.type === "Trailer" && video.site === "YouTube"
    ) || media.videos.results[0];
    
    return trailer?.key || null;
  };

  const handleAddWatchlist = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to add to watchlist");
      navigate("/login");
      return;
    }

    try {
      if (isInWatchlist) {
        await watchlistAPI.removeFromWatchlist(parseInt(id || "0"));
        toast.success("Removed from watchlist");
      } else {
        await watchlistAPI.addToWatchlist(validMediaType, parseInt(id || "0"));
        toast.success("Added to watchlist");
      }
      refetchWatchlist();
    } catch (error) {
      console.error("Error updating watchlist:", error);
      toast.error("Failed to update watchlist");
    }
  };

  const handleNavigateBack = () => {
    navigate('/upcoming', { state: { preserveFilters: true } });
  };
  
  const trailerKey = getTrailerKey();
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-24 px-4">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/3">
            <Skeleton className="aspect-[2/3] w-full rounded-md" />
          </div>
          <div className="w-full md:w-2/3 flex flex-col gap-4">
            <Skeleton className="h-10 w-3/4 mb-2" />
            <Skeleton className="h-6 w-1/2 mb-4" />
            <Skeleton className="h-24 w-full mb-4" />
            <Skeleton className="h-6 w-1/4 mb-2" />
            <Skeleton className="h-6 w-1/3 mb-2" />
          </div>
        </div>
      </div>
    );
  }
  
  if (!media) {
    return (
      <div className="container mx-auto py-24 px-4 text-center">
        <h2 className="text-2xl font-bold text-flicks-light mb-4">
          Media not found
        </h2>
        <Button 
          variant="outline" 
          className="border-flicks-teal text-flicks-light hover:bg-flicks-teal/20"
          onClick={handleNavigateBack}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Upcoming
        </Button>
      </div>
    );
  }
  
  const posterUrl = media.poster_path
    ? `https://image.tmdb.org/t/p/w500${media.poster_path}`
    : "https://via.placeholder.com/500x750?text=No+Image";
    
  const backdropUrl = media.backdrop_path
    ? `https://image.tmdb.org/t/p/original${media.backdrop_path}`
    : null;
    
  const title = isMovie ? media.title : media.name;
  const releaseDate = isMovie ? media.release_date : media.first_air_date;
  
  return (
    <>
      {backdropUrl && (
        <div 
          className="absolute top-0 left-0 right-0 h-[500px] -z-10" 
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.9)), url(${backdropUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
      )}
      
      <div className="container mx-auto py-24 px-4 relative">
        <Button 
          variant="outline" 
          className="border-flicks-teal text-flicks-light hover:bg-flicks-teal/20 mb-6"
          onClick={handleNavigateBack}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Upcoming
        </Button>
        
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/3 lg:w-1/4">
            <div className="rounded-lg overflow-hidden border border-flicks-teal/30">
              <img 
                src={posterUrl} 
                alt={title} 
                className="w-full h-auto" 
              />
            </div>
            
            <div className="mt-4 space-y-2">
              {trailerKey && (
                <Button 
                  variant="default" 
                  className="w-full bg-red-600 hover:bg-red-700"
                  onClick={() => setShowTrailerModal(true)}
                >
                  <Clapperboard className="mr-2 h-4 w-4" />
                  Watch Trailer
                </Button>
              )}
              
              <Button 
                variant={isInWatchlist ? "secondary" : "outline"}
                onClick={handleAddWatchlist}
                className={`w-full ${isInWatchlist ? "bg-flicks-teal text-flicks-light hover:bg-flicks-sage" : "border-flicks-teal text-flicks-light hover:bg-flicks-teal/20"}`}
              >
                <BookmarkPlus className={`mr-2 h-4 w-4 ${isInWatchlist ? 'fill-current' : ''}`} />
                {isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
              </Button>
            </div>
          </div>
          
          <div className="w-full md:w-2/3 lg:w-3/4">
            <h1 className="text-3xl md:text-4xl font-bold text-flicks-light mb-2">
              {title}
            </h1>
            
            <div className="flex flex-wrap gap-4 mb-6 text-flicks-light/80">
              <div className="flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                <span>{formatDate(releaseDate)}</span>
              </div>
              
              {media.runtime && (
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4" />
                  <span>{Math.floor(media.runtime / 60)}h {media.runtime % 60}min</span>
                </div>
              )}
              
              {media.number_of_seasons && (
                <div className="flex items-center">
                  <Tv className="mr-2 h-4 w-4" />
                  <span>{media.number_of_seasons} Season{media.number_of_seasons > 1 ? 's' : ''}</span>
                </div>
              )}
              
              {media.number_of_episodes && (
                <div className="flex items-center">
                  <Film className="mr-2 h-4 w-4" />
                  <span>{media.number_of_episodes} Episode{media.number_of_episodes > 1 ? 's' : ''}</span>
                </div>
              )}
              
              <div className="flex items-center">
                <Star className="mr-2 h-4 w-4 text-yellow-400" />
                <span>{media.vote_average ? media.vote_average.toFixed(1) : "N/A"}</span>
              </div>
              
              <div className="flex items-center bg-flicks-teal/20 px-2 py-1 rounded">
                <span>{getCertification()}</span>
              </div>
            </div>
            
            {media.tagline && (
              <div className="italic text-flicks-light/70 mb-4">
                "{media.tagline}"
              </div>
            )}
            
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-flicks-light mb-2">Overview</h2>
              <p className="text-flicks-light/80">
                {media.overview || "No overview available yet."}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-8">
              <div>
                <h3 className="text-md font-semibold text-flicks-light mb-1">
                  {isMovie ? "Director" : "Creator"}
                </h3>
                <p className="text-flicks-light/80">{getDirector()}</p>
              </div>
              
              <div>
                <h3 className="text-md font-semibold text-flicks-light mb-1">Genres</h3>
                <div className="flex flex-wrap gap-2">
                  {media.genres?.map((genre: any) => (
                    <span key={genre.id} className="bg-flicks-teal/20 text-flicks-light/80 px-2 py-1 rounded text-sm">
                      {genre.name}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-md font-semibold text-flicks-light mb-1">Languages</h3>
                <div className="flex items-center">
                  <Languages className="mr-2 h-4 w-4 text-flicks-light/60" />
                  <span className="text-flicks-light/80">
                    {media.spoken_languages?.map((lang: any) => lang.english_name).join(", ") || "N/A"}
                  </span>
                </div>
              </div>
              
              <div>
                <h3 className="text-md font-semibold text-flicks-light mb-1">Countries</h3>
                <div className="flex items-center">
                  <Globe className="mr-2 h-4 w-4 text-flicks-light/60" />
                  <span className="text-flicks-light/80">
                    {media.production_countries?.map((country: any) => country.name).join(", ") || "N/A"}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-flicks-light mb-4">Top Cast</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {media.credits?.cast?.slice(0, 8).map((person: any) => (
                  <div key={person.id} className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-flicks-teal/20">
                      {person.profile_path ? (
                        <img 
                          src={`https://image.tmdb.org/t/p/w200${person.profile_path}`} 
                          alt={person.name}
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full">
                          <Users className="w-5 h-5 text-flicks-light/60" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-flicks-light line-clamp-1">{person.name}</p>
                      <p className="text-xs text-flicks-light/70 line-clamp-1">{person.character}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {media.production_companies?.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-flicks-light mb-4">Production</h2>
                <div className="flex flex-wrap gap-6 items-center">
                  {media.production_companies.map((company: any) => (
                    <div key={company.id} className="text-center">
                      {company.logo_path ? (
                        <div className="bg-white rounded p-2 h-16 flex items-center justify-center mb-2">
                          <img 
                            src={`https://image.tmdb.org/t/p/w200${company.logo_path}`} 
                            alt={company.name}
                            className="max-h-full" 
                          />
                        </div>
                      ) : (
                        <div className="bg-flicks-teal/20 rounded p-2 h-16 w-32 flex items-center justify-center mb-2">
                          <Bookmark className="w-8 h-8 text-flicks-light/40" />
                        </div>
                      )}
                      <p className="text-xs text-flicks-light/80">{company.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={showTrailerModal} onOpenChange={setShowTrailerModal}>
        <DialogContent className="bg-flicks-dark border-flicks-teal/20 max-w-4xl w-full p-1 sm:p-2">
          <DialogHeader className="p-4">
            <DialogTitle className="text-flicks-light">
              {title} - Trailer
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Watch the official trailer
            </DialogDescription>
          </DialogHeader>
          <div className="aspect-video w-full">
            {trailerKey && (
              <iframe
                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
                allowFullScreen
                className="w-full h-full"
                title={`${title} Trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UpcomingDetailsPage;