import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Film, Tv, Search, X, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import UpcomingFilterSelect from "@/components/UpcomingFilterSelect";
import { toast } from "sonner";
import { tmdbAPI } from "@/lib/api";

const regionOptions = [
  { value: "all", label: "All Regions" },
  { value: "US", label: "🇺🇸 United States" },
  { value: "GB", label: "🇬🇧 United Kingdom" },
  { value: "CA", label: "🇨🇦 Canada" },
  { value: "AU", label: "🇦🇺 Australia" },
  { value: "FR", label: "🇫🇷 France" },
  { value: "DE", label: "🇩🇪 Germany" },
  { value: "JP", label: "🇯🇵 Japan" },
  { value: "KR", label: "🇰🇷 South Korea" },
  { value: "IN", label: "🇮🇳 India" },
  { value: "NG", label: "🇳🇬 Nigeria" },
  { value: "BR", label: "🇧🇷 Brazil" },
  { value: "MX", label: "🇲🇽 Mexico" },
  { value: "RU", label: "🇷🇺 Russia" },
  { value: "ES", label: "🇪🇸 Spain" },
  { value: "IT", label: "🇮🇹 Italy" },
];

const UpcomingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentYear = new Date().getFullYear();

  const [mediaType, setMediaType] = useState("movie");
  const [sortBy, setSortBy] = useState("release_date.desc"); // Changed default to release date descending
  const [searchQuery, setSearchQuery] = useState("");
  const [region, setRegion] = useState("all");
  const [page, setPage] = useState(1);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  useEffect(() => {
    if (location.state?.preserveFilters) {
      const { preservedMediaType, preservedSortBy, preservedSearchQuery, preservedRegion, preservedPage } = location.state;

      if (preservedMediaType) setMediaType(preservedMediaType);
      if (preservedSortBy) setSortBy(preservedSortBy);
      if (preservedSearchQuery) setSearchQuery(preservedSearchQuery);
      if (preservedRegion) setRegion(preservedRegion);
      if (preservedPage) setPage(preservedPage);
    } else {
      setPage(1);
    }
  }, [location.state]);

  // Helper function to sort results based on sortBy parameter
  const sortResults = (results: any[], sortBy: string) => {
    const sortedResults = [...results];

    switch (sortBy) {
      case "popularity.desc":
        return sortedResults.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
      case "popularity.asc":
        return sortedResults.sort((a, b) => (a.popularity || 0) - (b.popularity || 0));
      case "release_date.desc":
        return sortedResults.sort((a, b) => {
          const dateA = new Date(a.release_date || a.first_air_date || '1900-01-01');
          const dateB = new Date(b.release_date || b.first_air_date || '1900-01-01');
          return dateB.getTime() - dateA.getTime();
        });
      case "release_date.asc":
        return sortedResults.sort((a, b) => {
          const dateA = new Date(a.release_date || a.first_air_date || '1900-01-01');
          const dateB = new Date(b.release_date || b.first_air_date || '1900-01-01');
          return dateA.getTime() - dateB.getTime();
        });
      case "vote_average.desc":
        return sortedResults.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
      case "vote_average.asc":
        return sortedResults.sort((a, b) => (a.vote_average || 0) - (b.vote_average || 0));
      default:
        return sortedResults;
    }
  };

  const fetchUpcomingMedia = async ({ queryKey }) => {
    const [_, mediaType, sortBy, page, searchQuery, region] = queryKey;

    if (searchQuery) {
      const response = await tmdbAPI.searchMulti(searchQuery);
      // Filter for current year and apply sorting
      const filteredResults = response.filter(item => {
        const releaseDate = item.release_date || item.first_air_date;
        return (item.media_type === mediaType || !item.media_type) &&
          releaseDate && new Date(releaseDate).getFullYear() === currentYear;
      });

      return {
        ...response,
        results: sortResults(filteredResults, sortBy)
      };
    }

    let response;
    if (mediaType === 'movie') {
      response = await tmdbAPI.getUpcomingMovies({
        queryKey: ['upcoming_movies', page, region === 'all' ? '' : region]
      });
    } else {
      response = await tmdbAPI.getUpcomingTVShows({
        queryKey: ['upcoming_tvshows', page, region === 'all' ? '' : region]
      });
    }

    // Apply client-side sorting to API results
    return {
      ...response,
      results: sortResults(response.results || [], sortBy)
    };
  };

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["upcoming", mediaType, sortBy, page, searchQuery, region],
    queryFn: fetchUpcomingMedia,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    meta: {
      errorHandler: (err) => {
        console.error("Query error:", err);
        toast.error("Failed to load upcoming releases. Please try again.");
      }
    }
  });

  useEffect(() => {
    console.log("Query state:", { mediaType, sortBy, page, searchQuery, region });
    console.log("Query result:", { data, isLoading, isError });
  }, [mediaType, sortBy, page, searchQuery, region, data, isLoading, isError]);

  const handleMediaDetails = (id: string) => {
    navigate(`/upcoming/${mediaType}/${id}`, {
      state: {
        preserveFilters: true,
        preservedMediaType: mediaType,
        preservedSortBy: sortBy,
        preservedSearchQuery: searchQuery,
        preservedRegion: region,
        preservedPage: page
      }
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "TBA";
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleApplyFilters = () => {
    refetch();
    setIsSheetOpen(false);
  };

  const filterOptions = [
    { value: "release_date.desc", label: "Release Date Descending" },
    { value: "release_date.asc", label: "Release Date Ascending" },
    { value: "popularity.desc", label: "Popularity Descending" },
    { value: "popularity.asc", label: "Popularity Ascending" },
    { value: "vote_average.desc", label: "Rating Descending" },
    { value: "vote_average.asc", label: "Rating Ascending" },
  ];

  const mediaTypeOptions = [
    { value: "movie", label: "Movies" },
    { value: "tv", label: "TV Shows" },
  ];

  return (
    <div className="container mx-auto py-24 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-flicks-light mb-4">
            {/* <Calendar className="h-8 w-8 text-flicks-teal" /> */}
            Upcoming Releases {currentYear}
          </h1>
          <p className="text-gray-400 mt-2">
            Stay updated with the latest movie and TV show releases for {currentYear}
          </p>
        </div>

        <div className="flex gap-2">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="border-flicks-teal text-flicks-light hover:bg-flicks-teal/10 hover:text-flicks-light">
                <Search className="h-4 w-4 mr-2" />
                Show Filters
              </Button>
            </SheetTrigger>
            <SheetContent className="bg-flicks-dark border-l border-flicks-teal/20 text-flicks-light">
              <SheetHeader>
                <SheetTitle className="text-flicks-light">Filter Upcoming Releases</SheetTitle>
              </SheetHeader>

              <div className="mt-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="search">Search</Label>
                    <div className="relative">
                      <Input
                        id="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search upcoming releases..."
                        className="bg-black/40 border-flicks-teal/20 text-flicks-light"
                      />
                      {searchQuery && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleClearSearch}
                          className="absolute right-1 top-1/2 -translate-y-1/2 hover:bg-flicks-teal/10"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <Separator className="bg-flicks-teal/20" />

                  <div>
                    <h3 className="mb-3 font-medium">Media Type</h3>
                    <UpcomingFilterSelect
                      value={mediaType}
                      onValueChange={setMediaType}
                      options={mediaTypeOptions}
                      placeholder="Select Media Type"
                      className="bg-black/40 border-flicks-teal/20 text-flicks-light"
                    />
                  </div>

                  <Separator className="bg-flicks-teal/20" />

                  <div>
                    <h3 className="mb-3 font-medium">Region</h3>
                    <UpcomingFilterSelect
                      value={region}
                      onValueChange={setRegion}
                      options={regionOptions}
                      placeholder="Select Region"
                      className="bg-black/40 border-flicks-teal/20 text-flicks-light"
                    />
                    {mediaType === "tv" && region && region !== "all" && (
                      <p className="mt-2 text-xs text-amber-400">
                        <span className="font-medium">Note:</span> Region filtering works best with movies. TV show availability may vary.
                      </p>
                    )}
                  </div>

                  <Separator className="bg-flicks-teal/20" />

                  <div>
                    <h3 className="mb-3 font-medium">Sort By</h3>
                    <UpcomingFilterSelect
                      value={sortBy}
                      onValueChange={setSortBy}
                      options={filterOptions}
                      placeholder="Select Sort Order"
                      className="bg-black/40 border-flicks-teal/20 text-flicks-light"
                    />
                  </div>

                  <Button
                    onClick={handleApplyFilters}
                    className="w-full mt-4 bg-flicks-teal hover:bg-flicks-sage text-black"
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {(searchQuery || region !== "all" || sortBy !== "release_date.desc" || mediaType !== "movie") && (
            <Button
              variant="ghost"
              className="border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-500"
              onClick={() => {
                setSearchQuery("");
                setRegion("all");
                setSortBy("release_date.desc");
                setMediaType("movie");
                setPage(1);
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {region && region !== "all" && (
        <div className="mb-4 flex items-center gap-2 bg-flicks-teal/10 rounded-md p-2">
          <Globe className="h-5 w-5 text-flicks-teal" />
          <span className="text-flicks-light">
            Filtering by region:
            <span className="ml-2 font-semibold">
              {regionOptions.find(r => r.value === region)?.label || region}
            </span>
          </span>
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="overflow-hidden border border-flicks-teal/20 bg-flicks-dark/60">
              <Skeleton className="w-full h-48" />
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6 mb-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-md p-4 text-center text-red-400">
          <h3 className="font-semibold text-lg">Failed to load upcoming releases</h3>
          <p className="mt-2">Please try again later or try different filter options.</p>
          <Button
            className="mt-4 bg-red-500/20 hover:bg-red-500/30 text-red-400"
            onClick={() => refetch()}
          >
            Try Again
          </Button>
        </div>
      )}

      {data?.results && data.results.length === 0 && !isLoading && (
        <div className="flex justify-center py-20">
          <div className="flex flex-col items-center gap-4 max-w-md text-center">
            <Film className="h-12 w-12 text-gray-500" />
            <h3 className="text-xl font-semibold text-flicks-light">No upcoming releases found</h3>
            <p className="text-gray-400">
              Try adjusting your search or filters.
            </p>
          </div>
        </div>
      )}

      {data?.results && data.results.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.results.map((media: any) => (
              <Card key={media.id} className="overflow-hidden border border-flicks-teal/20 bg-flicks-dark/60 hover:border-flicks-teal/40 transition-all duration-300">
                {media.poster_path ? (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={`https://image.tmdb.org/t/p/w500${media.poster_path}`}
                      alt={media.title || media.name}
                      className="w-full h-full object-cover transition-transform hover:scale-105 duration-500"
                    />
                  </div>
                ) : (
                  <div className="h-48 bg-flicks-dark flex items-center justify-center">
                    <Film className="h-16 w-16 text-flicks-teal/30" />
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                    <span className="font-medium text-flicks-teal">{mediaType === 'movie' ? 'Movie' : 'TV Show'}</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(media.release_date || media.first_air_date)}</span>
                    </div>
                  </div>
                  <CardTitle className="text-xl text-flicks-light hover:text-flicks-teal transition-colors line-clamp-2">
                    <button onClick={() => handleMediaDetails(media.id.toString())} className="w-full text-left">
                      {media.title || media.name}
                    </button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-300 line-clamp-3 mb-4">
                    {media.overview || "No description available."}
                  </CardDescription>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-flicks-teal text-flicks-light hover:bg-flicks-teal/10 hover:text-flicks-light"
                    onClick={() => handleMediaDetails(media.id.toString())}
                  >
                    View Details
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {data.total_pages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => handlePageChange(page - 1)}
                  className="border-flicks-teal/30 text-flicks-light"
                >
                  «
                </Button>
                {Array.from({ length: Math.min(5, data.total_pages) }).map((_, index) => {
                  let pageNumber = index + 1;
                  if (data.total_pages > 5) {
                    if (page <= 3) {
                      pageNumber = index + 1;
                    } else if (page >= data.total_pages - 2) {
                      pageNumber = data.total_pages - 4 + index;
                    } else {
                      pageNumber = page - 2 + index;
                    }
                  }
                  return (
                    <Button
                      key={pageNumber}
                      variant={page === pageNumber ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNumber)}
                      className={page === pageNumber
                        ? "bg-flicks-teal text-black hover:bg-flicks-sage"
                        : "border-flicks-teal/30 text-flicks-light"
                      }
                    >
                      {pageNumber}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === data.total_pages}
                  onClick={() => handlePageChange(page + 1)}
                  className="border-flicks-teal/30 text-flicks-light"
                >
                  »
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UpcomingPage;