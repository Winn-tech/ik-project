/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  tmdbAPI,
  favoritesAPI,
  watchlistAPI,
} from "@/lib/api";
import { toast } from "@/lib/toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Heart,
  BookmarkPlus,
  Star,
  Clock,
  CalendarDays,
  Users,
  Film,
  PlayCircle,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import MovieCard from "@/components/MovieCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import UserReviews from "@/components/UserReviews";

const fallbackToken =
  "";

const MediaDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const mediaType = location.pathname.includes("/movie/") ? "movie" : "tv";
  const { isAuthenticated } = useAuth();

  // Local states for immediate UI updates
  const [favorites, setFavorites] = useState<number[]>([]);
  const [watchlist, setWatchlist] = useState<number[]>([]);
  const [showTrailerModal, setShowTrailerModal] = useState(false);

  const fetchDetails = async () => {
    if (mediaType === "movie") {
      return tmdbAPI.getMovieDetails(Number(id));
    } else {
      return tmdbAPI.getTVShowDetails(Number(id));
    }
  };

  const {
    data: details,
    isLoading,
    error,
    refetch: refetchDetails,
  } = useQuery({
    queryKey: [`${mediaType}Details`, id],
    queryFn: fetchDetails,
    enabled: !!id,
  });

  // For cast, similar, trailer
  const fetchCast = async () => {
    try {
      const token = import.meta.env.VITE_TMDB_API_TOKEN || fallbackToken;
      const res = await fetch(
        `https://api.themoviedb.org/3/${mediaType}/${id}/credits`,
        {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        }
      );
      return await res.json();
    } catch {
      return { cast: [], crew: [] };
    }
  };

  const fetchSimilar = async () => {
    try {
      const token = import.meta.env.VITE_TMDB_API_TOKEN || fallbackToken;
      const res = await fetch(
        `https://api.themoviedb.org/3/${mediaType}/${id}/similar`,
        {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        }
      );
      const data = await res.json();
      return data.results || [];
    } catch {
      return [];
    }
  };

  const fetchVideos = async () => {
    try {
      const token = import.meta.env.VITE_TMDB_API_TOKEN || fallbackToken;
      const res = await fetch(
        `https://api.themoviedb.org/3/${mediaType}/${id}/videos`,
        {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        }
      );
      const data = await res.json();
      return data.results || [];
    } catch {
      return [];
    }
  };

  const { data: credits, isLoading: creditsLoading } = useQuery({
    queryKey: [`${mediaType}Credits`, id],
    queryFn: fetchCast,
    enabled: !!id,
  });

  const {
    data: similarData,
    refetch: refetchSimilar,
    isLoading: similarLoading,
  } = useQuery({
    queryKey: [`${mediaType}Similar`, id],
    queryFn: fetchSimilar,
    enabled: !!id,
  });

  const { data: videos } = useQuery({
    queryKey: [`${mediaType}Videos`, id],
    queryFn: fetchVideos,
    enabled: !!id,
  });

  // Favorites
  const {
    data: favData,
    refetch: refetchFav,
  } = useQuery({
    queryKey: ["favorites"],
    queryFn: favoritesAPI.getAllFavorites,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  // Watchlist
  const {
    data: watchlistData,
    refetch: refetchWatch,
  } = useQuery({
    queryKey: ["watchlist"],
    queryFn: watchlistAPI.getAllWatchlist,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  // On fetch success, store IDs for immediate UI toggling
  useEffect(() => {
    if (favData?.data) {
      const ids = favData.data.map((f: any) => f.media_id);
      setFavorites(ids);
    }
  }, [favData]);

  useEffect(() => {
    if (watchlistData?.data) {
      const ids = watchlistData.data.map((w: any) => w.media_id);
      setWatchlist(ids);
    }
  }, [watchlistData]);

  const isFavorite = favorites.includes(Number(id));
  const isInWatchlist = watchlist.includes(Number(id));

  // Add/Remove Favorite (main item)
  const handleToggleFavoriteMain = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to add to favorites");
      navigate("/login");
      return;
    }
    try {
      if (isFavorite) {
        await favoritesAPI.removeFavorite(Number(id));
        toast.success("Removed from favorites");
        setFavorites((prev) => prev.filter((favId) => favId !== Number(id)));
      } else {
        await favoritesAPI.addFavorite(mediaType, Number(id));
        toast.success("Added to favorites");
        setFavorites((prev) => [...prev, Number(id)]);
      }
      refetchFav();
    } catch {
      toast.error("Failed to update favorites");
    }
  };

  // Add/Remove Watchlist (main item)
  const handleToggleWatchMain = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to add to watchlist");
      navigate("/login");
      return;
    }
    try {
      if (isInWatchlist) {
        await watchlistAPI.removeFromWatchlist(Number(id));
        toast.success("Removed from watchlist");
        setWatchlist((prev) => prev.filter((wid) => wid !== Number(id)));
      } else {
        await watchlistAPI.addToWatchlist(mediaType, Number(id));
        toast.success("Added to watchlist");
        setWatchlist((prev) => [...prev, Number(id)]);
      }
      refetchWatch();
    } catch {
      toast.error("Failed to update watchlist");
    }
  };

  // Similar toggles
  const handleToggleFavoriteSimilar = async (itemId: number) => {
    if (!isAuthenticated) {
      toast.error("Please login to add to favorites");
      navigate("/login");
      return;
    }
    const alreadyFav = favorites.includes(itemId);
    try {
      if (alreadyFav) {
        await favoritesAPI.removeFavorite(itemId);
        toast.success("Removed from favorites");
        setFavorites((prev) => prev.filter((f) => f !== itemId));
      } else {
        await favoritesAPI.addFavorite(mediaType, itemId);
        toast.success("Added to favorites");
        setFavorites((prev) => [...prev, itemId]);
      }
      refetchFav();
    } catch {
      toast.error("Failed to update favorites");
    }
  };

  const handleToggleWatchSimilar = async (itemId: number) => {
    if (!isAuthenticated) {
      toast.error("Please login to add to watchlist");
      navigate("/login");
      return;
    }
    const inWatch = watchlist.includes(itemId);
    try {
      if (inWatch) {
        await watchlistAPI.removeFromWatchlist(itemId);
        toast.success("Removed from watchlist");
        setWatchlist((prev) => prev.filter((w) => w !== itemId));
      } else {
        await watchlistAPI.addToWatchlist(mediaType, itemId);
        toast.success("Added to watchlist");
        setWatchlist((prev) => [...prev, itemId]);
      }
      refetchWatch();
    } catch {
      toast.error("Failed to update watchlist");
    }
  };

  const getTrailerKey = () => {
    if (!videos || !videos.length) return null;
    const official = videos.find(
      (v: any) =>
        v.type.toLowerCase() === "trailer" &&
        v.site.toLowerCase() === "youtube" &&
        v.official
    );
    if (official) return official.key;
    const anyTrailer = videos.find(
      (v: any) =>
        v.type.toLowerCase() === "trailer" && v.site.toLowerCase() === "youtube"
    );
    if (anyTrailer) return anyTrailer.key;
    const anyVid = videos.find((v: any) => v.site.toLowerCase() === "youtube");
    return anyVid ? anyVid.key : null;
  };

  useEffect(() => {
    if (id) {
      refetchDetails();
      // refetchFav();
      // refetchWatch();
      refetchSimilar();
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-24 px-4">
        <div className="w-full h-96 bg-flicks-dark/50 animate-pulse rounded-xl mb-8" />
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/3">
            <Skeleton className="w-full aspect-[2/3] rounded-xl" />
          </div>
          <div className="md:w-2/3 space-y-4">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-24 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-24" />
            </div>
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="container mx-auto py-24 px-4">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h2 className="text-2xl font-bold text-flicks-light mb-4">
            Failed to load {mediaType} details
          </h2>
          <p className="text-flicks-light/70 mb-6">
            There was an error loading the content. Please try again later.
          </p>
          <Button onClick={() => navigate(-1)}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Go Back
          </Button>
        </div>
      </div>
    );
  }

  const title = mediaType === "movie" ? details.title : details.name;
  const releaseDate =
    mediaType === "movie" ? details.release_date : details.first_air_date;
  const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : "";
  const backdropUrl = details.backdrop_path
    ? `https://image.tmdb.org/t/p/original${details.backdrop_path}`
    : null;
  const posterUrl = details.poster_path
    ? `https://image.tmdb.org/t/p/w500${details.poster_path}`
    : "https://via.placeholder.com/500x750?text=No+Image";

  return (
    <>
      <div
        className="w-full h-[50vh] relative bg-flicks-dark"
        style={
          backdropUrl
            ? {
                backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.9) 100%), url(${backdropUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "top center",
              }
            : undefined
        }
      >
        <div className="container mx-auto h-full flex items-end pb-16">
          <div className="flex flex-col md:flex-row items-end gap-6">
            <div className="hidden md:block md:w-1/4 lg:w-1/5 aspect-[2/3] relative bottom-16 shadow-xl rounded-lg overflow-hidden">
              <img
                src={posterUrl}
                alt={title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-flicks-light mb-2">
                {title}{" "}
                {releaseYear && (
                  <span className="text-flicks-light/70">({releaseYear})</span>
                )}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4">
                {details.vote_average > 0 && (
                  <div className="flex items-center">
                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400 mr-1" />
                    <span className="text-flicks-light">
                      {details.vote_average.toFixed(1)}/10
                    </span>
                  </div>
                )}
                {details.runtime && (
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-flicks-light/60 mr-1" />
                    <span className="text-flicks-light">
                      {Math.floor(details.runtime / 60)}h {details.runtime % 60}
                      m
                    </span>
                  </div>
                )}
                {details.episode_run_time && details.episode_run_time[0] && (
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-flicks-light/60 mr-1" />
                    <span className="text-flicks-light">
                      {details.episode_run_time[0]} min/ep
                    </span>
                  </div>
                )}
                {details.genres?.map((g: any) => (
                  <Badge
                    key={g.id}
                    variant="outline"
                    className="text-flicks-light border-flicks-teal/50"
                  >
                    {g.name}
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                <Button
                  onClick={() => setShowTrailerModal(true)}
                  disabled={!getTrailerKey()}
                  className="bg-flicks-teal hover:bg-flicks-sage"
                >
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Watch Trailer
                </Button>
                <Button
                  variant={isFavorite ? "secondary" : "outline"}
                  onClick={handleToggleFavoriteMain}
                  className={
                    isFavorite
                      ? "bg-flicks-teal text-flicks-light hover:bg-flicks-sage"
                      : "border-flicks-teal text-flicks-light hover:bg-flicks-teal/20 hover:text-flicks-light"
                  }
                >
                  <Heart
                    className={`mr-2 h-4 w-4 ${
                      isFavorite ? "fill-current" : ""
                    }`}
                  />
                  {isFavorite ? "Added to Favorites" : "Add to Favorites"}
                </Button>
                <Button
                  variant={isInWatchlist ? "secondary" : "outline"}
                  onClick={handleToggleWatchMain}
                  className={
                    isInWatchlist
                      ? "bg-flicks-teal text-flicks-light hover:bg-flicks-sage"
                      : "border-flicks-teal text-flicks-light hover:bg-flicks-teal/20 hover:text-flicks-light"
                  }
                >
                  <BookmarkPlus
                    className={`mr-2 h-4 w-4 ${
                      isInWatchlist ? "fill-current" : ""
                    }`}
                  />
                  {isInWatchlist ? "Added to Watchlist" : "Add to Watchlist"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-12 px-4">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:hidden w-1/2 mx-auto mb-6">
            <img
              src={posterUrl}
              alt={title}
              className="w-full rounded-lg shadow-lg"
            />
          </div>

          <div className="flex-1">
            <Tabs defaultValue="overview">
              <TabsList className="bg-flicks-dark/50 border-b border-flicks-teal/30 mb-6">
                <TabsTrigger
                  value="overview"
                  className="text-flicks-light data-[state=active]:text-flicks-teal"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="reviews"
                  className="text-flicks-light data-[state=active]:text-flicks-teal"
                >
                  Reviews
                </TabsTrigger>
                <TabsTrigger
                  value="similar"
                  className="text-flicks-light data-[state=active]:text-flicks-teal"
                >
                  Similar
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                {details.tagline && (
                  <p className="text-flicks-teal italic text-lg mb-4">
                    "{details.tagline}"
                  </p>
                )}
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-flicks-light mb-2">
                    Synopsis
                  </h2>
                  <p className="text-flicks-light/90 leading-relaxed">
                    {details.overview || "No overview available."}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <h3 className="text-lg font-semibold text-flicks-light mb-2 flex items-center">
                      <CalendarDays className="mr-2 h-5 w-5 text-flicks-teal" />
                      Release Information
                    </h3>
                    <ul className="space-y-2 text-flicks-light/80">
                      <li>
                        <span className="font-medium">Release Date:</span>{" "}
                        {releaseDate
                          ? new Date(releaseDate).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          : "Unknown"}
                      </li>
                      {details.status && (
                        <li>
                          <span className="font-medium">Status:</span>{" "}
                          {details.status}
                        </li>
                      )}
                      {mediaType === "tv" && details.number_of_seasons && (
                        <li>
                          <span className="font-medium">Seasons:</span>{" "}
                          {details.number_of_seasons}
                        </li>
                      )}
                      {mediaType === "tv" && details.number_of_episodes && (
                        <li>
                          <span className="font-medium">Episodes:</span>{" "}
                          {details.number_of_episodes}
                        </li>
                      )}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-flicks-light mb-2 flex items-center">
                      <Film className="mr-2 h-5 w-5 text-flicks-teal" />
                      Production Information
                    </h3>
                    <ul className="space-y-2 text-flicks-light/80">
                      {details.production_companies?.length > 0 && (
                        <li>
                          <span className="font-medium">Production:</span>{" "}
                          {details.production_companies
                            .map((c: any) => c.name)
                            .join(", ")}
                        </li>
                      )}
                      {details.production_countries?.length > 0 && (
                        <li>
                          <span className="font-medium">Country:</span>{" "}
                          {details.production_countries
                            .map((ct: any) => ct.name)
                            .join(", ")}
                        </li>
                      )}
                      {details.spoken_languages?.length > 0 && (
                        <li className="flex items-start">
                          <span className="font-medium mr-1">Languages:</span>
                          <span>
                            {details.spoken_languages
                              .map((l: any) => l.english_name)
                              .join(", ")}
                          </span>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-flicks-light mb-4 flex items-center">
                    <Users className="mr-2 h-5 w-5 text-flicks-teal" />
                    Cast & Crew
                  </h3>
                  {creditsLoading ? (
                    <div className="flex justify-center p-6">
                      <div className="animate-spin h-10 w-10 border-4 border-flicks-teal border-t-transparent rounded-full" />
                    </div>
                  ) : credits && credits.cast && credits.cast.length > 0 ? (
                    <ScrollArea className="h-72 rounded-md border border-flicks-teal/20 p-4 bg-flicks-dark/30">
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {credits.cast.slice(0, 16).map((person: any) => (
                          <div
                            key={person.id}
                            className="flex items-center space-x-3"
                          >
                            <div className="shrink-0">
                              <Avatar>
                                <AvatarImage
                                  src={
                                    person.profile_path
                                      ? `https://image.tmdb.org/t/p/w185${person.profile_path}`
                                      : undefined
                                  }
                                />
                                <AvatarFallback className="bg-flicks-teal/30 text-flicks-light">
                                  {person.name
                                    .split(" ")
                                    .map((n: string) => n[0])
                                    .join("")
                                    .substring(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                            <div>
                              <p className="font-medium text-flicks-light">
                                {person.name}
                              </p>
                              <p className="text-sm text-flicks-light/70">
                                {person.character}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {credits.cast.length > 16 && (
                        <p className="text-center text-flicks-light/50 mt-4 text-sm">
                          + {credits.cast.length - 16} more cast members
                        </p>
                      )}
                    </ScrollArea>
                  ) : (
                    <div className="text-center text-flicks-light/70 py-6">
                      <p>No cast information available.</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="reviews">
                <UserReviews mediaId={id || ""} mediaType={mediaType} />
              </TabsContent>

              <TabsContent value="similar">
                <h2 className="text-xl font-bold text-flicks-light mb-6">
                  Similar {mediaType === "movie" ? "Movies" : "Shows"}
                </h2>
                {similarLoading ? (
                  <div className="flex justify-center p-6">
                    <div className="animate-spin h-10 w-10 border-4 border-flicks-teal border-t-transparent rounded-full" />
                  </div>
                ) : similarData && similarData.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6">
                    {similarData.slice(0, 10).map((item: any) => {
                      const isFav = favorites.includes(item.id);
                      const inWatch = watchlist.includes(item.id);

                      return (
                        <MovieCard
                          key={item.id}
                          id={item.id}
                          title={mediaType === "movie" ? item.title : item.name}
                          posterPath={item.poster_path}
                          releaseDate={
                            mediaType === "movie"
                              ? item.release_date
                              : item.first_air_date
                          }
                          rating={item.vote_average}
                          mediaType={mediaType}
                          isFavorite={isFav}
                          isInWatchlist={inWatch}
                          onAddFavorite={() => handleToggleFavoriteSimilar(item.id)}
                          onAddWatchlist={() => handleToggleWatchSimilar(item.id)}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-flicks-light/70">
                    <p className="text-xl">No similar content found</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <Dialog open={showTrailerModal} onOpenChange={setShowTrailerModal}>
        <DialogContent className="bg-flicks-dark border-flicks-teal/20 max-w-4xl w-full p-1 sm:p-2">
          <DialogHeader className="p-4">
            <DialogTitle className="text-flicks-light">
              {title} - Trailer
            </DialogTitle>
          </DialogHeader>
          <div className="aspect-video w-full">
            {getTrailerKey() && (
              <iframe
                src={`https://www.youtube.com/embed/${getTrailerKey()}?autoplay=1`}
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

export default MediaDetailsPage;
