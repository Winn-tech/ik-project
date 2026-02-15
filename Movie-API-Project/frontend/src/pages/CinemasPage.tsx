import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { cinemaAPI } from "@/lib/api";
import { LoaderCircle, Map, Calendar, Film, Clock, ExternalLink, Ticket, LayoutGrid, Grid3X3, Info, Search, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/lib/toast";

interface ShowTime {
  cinema: string;
  showtimes: string[];
}

interface ScreeningsByLocation {
  [location: string]: ShowTime[];
}

interface FilmhouseMovie {
  title: string;
  genres: string[];
  poster: string;
  detailPage: string;
  screenings: ScreeningsByLocation;
}

interface EbonylifeMovie {
  title: string;
  description: string;
  genres: string[];
  poster: string;
  detailPage: string;
  showtimes: string[];
}

const CinemasPage: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<string>("Lagos");
  const [locations, setLocations] = useState<string[]>([]);
  const [gridColumns, setGridColumns] = useState<"3" | "4">(() => {
    // Initialize from memory storage (simulating localStorage)
    const stored = window.gridLayoutPreference || "4";
    return stored as "3" | "4";
  });
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [timeRangeFilter, setTimeRangeFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState<boolean>(false);
  
  // Fetch filmhouse data
  const { data: filmhouseData, isLoading: filmhouseLoading, error: filmhouseError } = useQuery({
    queryKey: ["filmhouse"],
    queryFn: cinemaAPI.getFilmhouseData,
    retry: 1
  });
  
  // Fetch ebonylife data
  const { data: ebonylifeData, isLoading: ebonylifeLoading, error: ebonylifeError } = useQuery({
    queryKey: ["ebonylife"],
    queryFn: cinemaAPI.getEbonylifeData,
    retry: 1
  });
  
  const isLoading = filmhouseLoading || ebonylifeLoading;
  const hasError = filmhouseError || ebonylifeError;
  
  useEffect(() => {
    if (filmhouseData?.movies) {
      // Extract all locations from filmhouse data
      const filmhouseLocations = Object.keys(filmhouseData.movies[0]?.screenings || {});
      
      // Combine with Lagos (always present for Ebonylife)
      const allLocations = [...new Set([...filmhouseLocations, "Lagos"])];
      
      // Sort locations with Lagos first
      const sortedLocations = allLocations.sort((a, b) => {
        if (a === "Lagos") return -1;
        if (b === "Lagos") return 1;
        return a.localeCompare(b);
      });
      
      setLocations(sortedLocations);
    }
  }, [filmhouseData]);

  // Save grid preference to memory (simulating localStorage)
  useEffect(() => {
    window.gridLayoutPreference = gridColumns;
  }, [gridColumns]);
  
  // Handle errors
  useEffect(() => {
    if (hasError) {
      toast.error("Failed to load cinema data. Please try again later.");
    }
  }, [hasError]);

  // Utility function to parse time and check if it falls within range
  const isTimeInRange = (timeStr: string, range: string): boolean => {
    if (range === "all") return true;
    
    // Parse time string (e.g., "2:30 PM", "14:30", "2:30PM")
    const timeMatch = timeStr.match(/(\d{1,2}):?(\d{0,2})\s*(AM|PM|am|pm)?/i);
    if (!timeMatch) return true; // If can't parse, include it
    
    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2] || "0");
    const period = timeMatch[3]?.toUpperCase();
    
    // Convert to 24-hour format
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    
    const timeInMinutes = hours * 60 + minutes;
    
    switch (range) {
      case "morning": // 6 AM - 12 PM
        return timeInMinutes >= 360 && timeInMinutes < 720;
      case "afternoon": // 12 PM - 6 PM
        return timeInMinutes >= 720 && timeInMinutes < 1080;
      case "evening": // 6 PM - 12 AM
        return timeInMinutes >= 1080 && timeInMinutes < 1440;
      case "night": // 12 AM - 6 AM
        return timeInMinutes >= 0 && timeInMinutes < 360;
      default:
        return true;
    }
  };

  // Filter functions
  const filterMovies = <T extends FilmhouseMovie | EbonylifeMovie>(
    movies: T[], 
    isEbonylife = false
  ): T[] => {
    return movies.filter(movie => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const titleMatch = movie.title.toLowerCase().includes(searchLower);
      
      let cinemaMatch = false;
      if (isEbonylife) {
        cinemaMatch = "ebonylife".includes(searchLower);
      } else {
        const filmhouseMovie = movie as FilmhouseMovie;
        cinemaMatch = filmhouseMovie.screenings[selectedLocation]?.some(screening => 
          screening.cinema.toLowerCase().includes(searchLower)
        ) || "filmhouse".includes(searchLower);
      }
      
      if (!titleMatch && !cinemaMatch) return false;
      
      // Time range filter
      if (timeRangeFilter !== "all") {
        if (isEbonylife) {
          const ebonylifeMovie = movie as EbonylifeMovie;
          const hasMatchingTime = ebonylifeMovie.showtimes.some(time => 
            isTimeInRange(time, timeRangeFilter)
          );
          if (!hasMatchingTime) return false;
        } else {
          const filmhouseMovie = movie as FilmhouseMovie;
          const hasMatchingTime = filmhouseMovie.screenings[selectedLocation]?.some(screening =>
            screening.showtimes.some(time => isTimeInRange(time, timeRangeFilter))
          );
          if (!hasMatchingTime) return false;
        }
      }
      
      return true;
    });
  };

  // Extract movies for selected location
  const getFilmhouseMoviesForLocation = () => {
    if (!filmhouseData?.movies || !selectedLocation) return [];
    
    const movies = filmhouseData.movies.filter(movie => 
      movie.screenings && movie.screenings[selectedLocation]
    );
    
    return filterMovies(movies);
  };
  
  // Get ebonylife movies (only available in Lagos)
  const getEbonylifeMovies = () => {
    if (!ebonylifeData?.lagos || selectedLocation !== "Lagos") return [];
    return filterMovies(ebonylifeData.lagos, true);
  };

  const filmhouseMovies = getFilmhouseMoviesForLocation();
  const ebonylifeMovies = getEbonylifeMovies();
  const hasMovies = filmhouseMovies.length > 0 || ebonylifeMovies.length > 0;
  const totalMovies = filmhouseMovies.length + ebonylifeMovies.length;

  const gridClasses = gridColumns === "3" 
    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6";

  const hasActiveFilters = searchQuery || timeRangeFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setTimeRangeFilter("all");
  };

  return (
    <div className="container mx-auto py-24 px-4">
      <h1 className="text-3xl font-bold mb-6 text-flicks-light">Cinemas</h1>
      
      {/* Notice Alert */}
      <Alert className="mb-6 border-amber-500/50 bg-amber-500/10">
        <Info className="h-4 w-4 text-amber-500" />
        <AlertDescription className="text-amber-100">
          <strong>Important Notice:</strong> Showtimes displayed here may differ from those on the actual cinema websites. 
          Cinema schedules can change frequently, and tickets may sell out quickly. Please verify showtimes and availability 
          directly on the cinema's official website before making your plans.
        </AlertDescription>
      </Alert>
      
      {isLoading ? (
        <div className="flex justify-center p-12">
          <LoaderCircle className="animate-spin h-12 w-12 text-flicks-teal" />
        </div>
      ) : (
        <>
          <div className="mb-8 space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center">
                <Map className="h-5 w-5 text-flicks-teal mr-2" />
                <span className="text-flicks-light font-medium">Select Location:</span>
              </div>
              
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="w-[200px] bg-flicks-dark border-flicks-teal/50">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent className="bg-flicks-dark border-flicks-teal/50">
                  {locations.map(location => (
                    <SelectItem key={location} value={location} className="text-flicks-light">
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Grid Layout Controls */}
              <div className="flex items-center gap-2 ml-4">
                <span className="text-flicks-light font-medium text-sm">Layout:</span>
                <Button
                  variant={gridColumns === "3" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setGridColumns("3")}
                  className="p-2 border-flicks-teal/50"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={gridColumns === "4" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setGridColumns("4")}
                  className="p-2 border-flicks-teal/50"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Search and Filter Toggle */}
              <div className="flex items-center gap-2 ml-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="border-flicks-teal/50 text-flicks-light hover:bg-flicks-teal/20"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-2 h-4 w-4 p-0 bg-flicks-teal text-white">
                      !
                    </Badge>
                  )}
                </Button>
              </div>
              
              <div className="text-sm text-flicks-light/70">
                {!isLoading && (
                  <>
                    Filmhouse last updated: {filmhouseData?.lastUpdated ? new Date(filmhouseData.lastUpdated).toLocaleDateString() : 'N/A'}
                    <br />
                    EbonyLife last updated: {ebonylifeData?.lastUpdated ? new Date(ebonylifeData.lastUpdated).toLocaleDateString() : 'N/A'}
                  </>
                )}
              </div>
            </div>

            {/* Search and Filter Panel */}
            {showFilters && (
              <div className="bg-flicks-dark/50 border border-flicks-teal/30 rounded-lg p-4 space-y-4">
                <div className="flex flex-wrap gap-4">
                  {/* Search Input */}
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-flicks-light/50" />
                      <Input
                        placeholder="Search movies or cinemas..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-flicks-dark border-flicks-teal/50 text-flicks-light placeholder:text-flicks-light/50"
                      />
                    </div>
                  </div>
                  
                  {/* Time Range Filter */}
                  <div className="min-w-[180px]">
                    <Select value={timeRangeFilter} onValueChange={setTimeRangeFilter}>
                      <SelectTrigger className="bg-flicks-dark border-flicks-teal/50">
                        <Clock className="h-4 w-4 mr-2 text-flicks-teal" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-flicks-dark border-flicks-teal/50">
                        <SelectItem value="all" className="text-flicks-light">All Times</SelectItem>
                        <SelectItem value="morning" className="text-flicks-light">Morning (6AM-12PM)</SelectItem>
                        <SelectItem value="afternoon" className="text-flicks-light">Afternoon (12PM-6PM)</SelectItem>
                        <SelectItem value="evening" className="text-flicks-light">Evening (6PM-12AM)</SelectItem>
                        <SelectItem value="night" className="text-flicks-light">Night (12AM-6AM)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Clear Filters */}
                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      className="border-flicks-teal/50 text-flicks-light hover:bg-flicks-teal/20"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
                
                {/* Active Filters Display */}
                {hasActiveFilters && (
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm text-flicks-light/70">Active filters:</span>
                    {searchQuery && (
                      <Badge variant="secondary" className="bg-flicks-teal/20 text-flicks-light">
                        Search: "{searchQuery}"
                      </Badge>
                    )}
                    {timeRangeFilter !== "all" && (
                      <Badge variant="secondary" className="bg-flicks-teal/20 text-flicks-light">
                        Time: {timeRangeFilter.charAt(0).toUpperCase() + timeRangeFilter.slice(1)}
                      </Badge>
                    )}
                  </div>
                )}
                
                {/* Results Summary */}
                <div className="text-sm text-flicks-light/70">
                  Showing {totalMovies} movie{totalMovies !== 1 ? 's' : ''} in {selectedLocation}
                </div>
              </div>
            )}
          </div>
          
          {selectedLocation && (
            <Tabs defaultValue="all" className="space-y-6">
              <TabsList className="bg-flicks-dark border-b border-flicks-teal/30">
                <TabsTrigger value="all" className="text-flicks-light data-[state=active]:text-flicks-teal">
                  All Cinemas
                </TabsTrigger>
                {filmhouseMovies.length > 0 && (
                  <TabsTrigger value="filmhouse" className="text-flicks-light data-[state=active]:text-flicks-teal">
                    Filmhouse
                  </TabsTrigger>
                )}
                {ebonylifeMovies.length > 0 && (
                  <TabsTrigger value="ebonylife" className="text-flicks-light data-[state=active]:text-flicks-teal">
                    EbonyLife
                  </TabsTrigger>
                )}
              </TabsList>
              
              <TabsContent value="all">
                {hasMovies ? (
                  <div className={gridClasses}>
                    {/* Filmhouse Movies */}
                    {filmhouseMovies.map((movie, index) => (
                      <MovieCard 
                        key={`filmhouse-${index}`}
                        movie={movie}
                        location={selectedLocation}
                        cinemaName="Filmhouse"
                      />
                    ))}
                    
                    {/* EbonyLife Movies */}
                    {ebonylifeMovies.map((movie, index) => (
                      <EbonylifeCard 
                        key={`ebonylife-${index}`}
                        movie={movie}
                      />
                    ))}
                  </div>
                ) : (
                  <NoMoviesMessage 
                    location={selectedLocation} 
                    hasFilters={hasActiveFilters}
                    onClearFilters={clearFilters}
                  />
                )}
              </TabsContent>
              
              <TabsContent value="filmhouse">
                {filmhouseMovies.length > 0 ? (
                  <div className={gridClasses}>
                    {filmhouseMovies.map((movie, index) => (
                      <MovieCard 
                        key={`filmhouse-${index}`}
                        movie={movie}
                        location={selectedLocation}
                        cinemaName="Filmhouse"
                      />
                    ))}
                  </div>
                ) : (
                  <NoMoviesMessage 
                    cinema="Filmhouse" 
                    location={selectedLocation}
                    hasFilters={hasActiveFilters}
                    onClearFilters={clearFilters}
                  />
                )}
              </TabsContent>
              
              <TabsContent value="ebonylife">
                {ebonylifeMovies.length > 0 ? (
                  <div className={gridClasses}>
                    {ebonylifeMovies.map((movie, index) => (
                      <EbonylifeCard 
                        key={`ebonylife-${index}`}
                        movie={movie}
                      />
                    ))}
                  </div>
                ) : (
                  <NoMoviesMessage 
                    cinema="EbonyLife" 
                    location={selectedLocation}
                    hasFilters={hasActiveFilters}
                    onClearFilters={clearFilters}
                  />
                )}
              </TabsContent>
            </Tabs>
          )}
        </>
      )}
    </div>
  );
};

const ShowtimesDialog: React.FC<{ 
  screenings: ShowTime[]; 
  movieTitle: string; 
  detailPage: string; 
}> = ({ screenings, movieTitle, detailPage }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline"
          size="sm"
          className="border-flicks-teal/50 text-flicks-light hover:bg-flicks-teal/20 hover:text-flicks-light"
        >
          <Calendar className="h-4 w-4 mr-1" />
          See Showtimes
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-flicks-dark border-flicks-teal/30 text-flicks-light max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-flicks-light">
            {movieTitle} - Showtimes
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {screenings.map((screening, idx) => (
            <div key={idx} className="border border-flicks-teal/20 rounded-lg p-4 bg-flicks-dark/50">
              <h4 className="text-lg font-medium text-flicks-light flex items-center mb-3">
                <Film className="h-4 w-4 mr-2 text-flicks-teal" />
                {screening.cinema}
              </h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {screening.showtimes.map((time, timeIdx) => (
                  <div key={timeIdx} className="text-center">
                    <span className="inline-block text-sm bg-flicks-teal/20 border border-flicks-teal/40 text-flicks-light rounded-lg px-3 py-2 w-full">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end pt-4 border-t border-flicks-teal/20">
          <Button 
            className="bg-flicks-teal hover:bg-flicks-teal/80 text-white"
            asChild
          >
            <a href={detailPage} target="_blank" rel="noopener noreferrer" className="flex items-center">
              <Ticket className="h-4 w-4 mr-2" />
              Buy Tickets
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const EbonylifeShowtimesDialog: React.FC<{ 
  showtimes: string[]; 
  movieTitle: string; 
  detailPage: string; 
}> = ({ showtimes, movieTitle, detailPage }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline"
          size="sm"
          className="border-flicks-teal/50 text-flicks-light hover:bg-flicks-teal/20 hover:text-flicks-light"
        >
          <Calendar className="h-4 w-4 mr-1" />
          See Showtimes
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-flicks-dark border-flicks-teal/30 text-flicks-light">
        <DialogHeader>
          <DialogTitle className="text-flicks-light">
            {movieTitle} - Showtimes
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="border border-flicks-teal/20 rounded-lg p-4 bg-flicks-dark/50">
            <h4 className="text-lg font-medium text-flicks-light flex items-center mb-3">
              <Film className="h-4 w-4 mr-2 text-flicks-teal" />
              EbonyLife Place
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-2 gap-2">
              {showtimes.map((time, timeIdx) => (
                <div key={timeIdx} className="text-center">
                  <span className="inline-block text-sm bg-flicks-teal/20 border border-flicks-teal/40 text-flicks-light rounded-lg px-3 py-2 w-full">
                    <Clock className="h-3 w-3 inline mr-1" />
                    {time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end pt-4 border-t border-flicks-teal/20">
          <Button 
            className="bg-flicks-teal hover:bg-flicks-teal/80 text-white"
            asChild
          >
            <a href={detailPage} target="_blank" rel="noopener noreferrer" className="flex items-center">
              <Ticket className="h-4 w-4 mr-2" />
              Buy Tickets
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const MovieCard: React.FC<{ movie: FilmhouseMovie; location: string; cinemaName: string }> = ({ 
  movie, 
  location,
  cinemaName
}) => {
  return (
    <Card className="bg-flicks-dark border-flicks-teal/30 overflow-hidden h-full flex flex-col">
      <div className="aspect-[2/3] overflow-hidden">
        <img 
          src={movie.poster || '/placeholder.svg'} 
          alt={movie.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/placeholder.svg';
          }}
        />
      </div>
      
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg text-flicks-light line-clamp-2">{movie.title}</CardTitle>
            <div className="flex flex-wrap gap-1 mt-1">
              {movie.genres.slice(0, 3).map((genre, idx) => (
                <span key={idx} className="text-xs bg-flicks-teal/20 text-flicks-light rounded px-2 py-0.5">
                  {genre}
                </span>
              ))}
              {movie.genres.length > 3 && (
                <span className="text-xs text-flicks-light/70">+{movie.genres.length - 3}</span>
              )}
            </div>
          </div>
          <span className="text-xs py-1 px-2 bg-flicks-teal/30 text-flicks-light rounded ml-2 shrink-0">
            {cinemaName}
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="pb-0 flex-1">
        <div className="text-sm text-flicks-light/70 mb-2">
          Available at {movie.screenings[location].length} location{movie.screenings[location].length > 1 ? 's' : ''}
        </div>
      </CardContent>
      
      <CardFooter className="pt-4 gap-2">
        <ShowtimesDialog 
          screenings={movie.screenings[location]}
          movieTitle={movie.title}
          detailPage={movie.detailPage}
        />
        <Button 
          variant="default"
          size="sm"
          className="bg-flicks-teal hover:bg-flicks-teal/80 text-white"
          asChild
        >
          <a href={movie.detailPage} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
            <Ticket className="h-4 w-4 mr-1" />
            Buy Tickets
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
};

const EbonylifeCard: React.FC<{ movie: EbonylifeMovie }> = ({ movie }) => {
  return (
    <Card className="bg-flicks-dark border-flicks-teal/30 overflow-hidden h-full flex flex-col">
      <div className="aspect-[2/3] overflow-hidden">
        <img 
          src={movie.poster || '/placeholder.svg'} 
          alt={movie.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/placeholder.svg';
          }}
        />
      </div>
      
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg text-flicks-light line-clamp-2">{movie.title}</CardTitle>
            <div className="flex flex-wrap gap-1 mt-1">
              {movie.genres.slice(0, 3).map((genre, idx) => (
                <span key={idx} className="text-xs bg-flicks-teal/20 text-flicks-light rounded px-2 py-0.5">
                  {genre}
                </span>
              ))}
              {movie.genres.length > 3 && (
                <span className="text-xs text-flicks-light/70">+{movie.genres.length - 3}</span>
              )}
            </div>
          </div>
          <span className="text-xs py-1 px-2 bg-flicks-teal/30 text-flicks-light rounded ml-2 shrink-0">
            EbonyLife
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="pb-0 flex-1">
        <p className="text-sm text-flicks-light/80 line-clamp-3">
          {movie.description || "No description available."}
        </p>
      </CardContent>
      
      <CardFooter className="pt-4 gap-2">
        <EbonylifeShowtimesDialog 
          showtimes={movie.showtimes}
          movieTitle={movie.title}
          detailPage={movie.detailPage}
        />
        <Button 
          variant="default"
          size="sm"
          className="bg-flicks-teal hover:bg-flicks-teal/80 text-white"
          asChild
        >
          <a href={movie.detailPage} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
            <Ticket className="h-4 w-4 mr-1" />
            Buy Tickets
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
};

const NoMoviesMessage: React.FC<{ 
  cinema?: string; 
  location: string;
  hasFilters?: boolean;
  onClearFilters?: () => void;
}> = ({ cinema, location, hasFilters, onClearFilters }) => (
  <div className="text-center py-12 bg-flicks-dark/50 rounded-lg">
    <Film className="h-16 w-16 mx-auto mb-4 text-flicks-teal/30" />
    <h3 className="text-xl font-medium text-flicks-light mb-1">
      {hasFilters ? "No movies match your filters" : (cinema ? `No ${cinema} movies found` : "No movies found")}
    </h3>
    <p className="text-flicks-light/70 mb-4">
      {hasFilters 
        ? "Try adjusting your search or time range filters to see more results."
        : (location === "Lagos" && cinema === "EbonyLife" 
          ? "EbonyLife data may be unavailable at the moment."
          : `There are currently no screenings in ${location}${cinema ? ` for ${cinema}` : ""}.`)
      }
    </p>
    {hasFilters && onClearFilters && (
      <Button
        variant="outline"
        onClick={onClearFilters}
        className="border-flicks-teal/50 text-flicks-light hover:bg-flicks-teal/20"
      >
        <X className="h-4 w-4 mr-2" />
        Clear Filters
      </Button>
    )}
  </div>
);

export default CinemasPage;