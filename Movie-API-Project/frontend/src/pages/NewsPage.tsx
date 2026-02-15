
import React, { useState, useEffect } from "react";
import { useNewsFeed, useNewsCategories, newsSources } from "@/hooks/useNewsFeed";
import NewsCard from "@/components/NewsCard";
import { Newspaper, Filter, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { NewsItem } from "@/utils/rssParser";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const NewsPage = () => {
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  
  // Fetch news data
  const { data: news = [], isLoading, isError, refetch, isRefetching } = useNewsFeed(selectedSources);
  
  // Extract categories from all news items
  const allCategories = useNewsCategories(news);
  
  // Filter news based on selections and search
  const filteredNews = news.filter((item: NewsItem) => {
    // Filter by search query
    const matchesSearch = searchQuery === "" || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.contentSnippet?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Filter by categories if any selected
    const matchesCategory = selectedCategories.length === 0 || 
      selectedCategories.some(cat => 
        item.categories?.some(c => c.toLowerCase().includes(cat.toLowerCase()))
      );
    
    return matchesSearch && matchesCategory;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredNews.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentNews = filteredNews.slice(startIndex, endIndex);
  
  // Handle page changes
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSources, selectedCategories, searchQuery]);

  // Handle source selection
  const toggleSource = (sourceId: string) => {
    setSelectedSources(prev => 
      prev.includes(sourceId) 
        ? prev.filter(id => id !== sourceId)
        : [...prev, sourceId]
    );
  };

  // Handle category selection
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedSources([]);
    setSelectedCategories([]);
    setSearchQuery("");
  };

  return (
    <div className="container mx-auto py-24 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-flicks-light mb-4">
            {/* <Newspaper className="h-8 w-8 text-flicks-teal" /> */}
            Entertainment News
          </h1>
          <p className="text-gray-400 mt-2">
            The latest updates from the world of movies and TV shows
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="border-flicks-teal text-flicks-light hover:bg-flicks-teal/10 hover:text-flicks-light"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button 
                variant="outline" 
                className="border-flicks-teal text-flicks-light hover:bg-flicks-teal/10 hover:text-flicks-light"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filter News
              </Button>
            </SheetTrigger>
            <SheetContent className="bg-flicks-dark border-l border-flicks-teal/20 text-flicks-light">
              <SheetHeader>
                <SheetTitle className="text-flicks-light">Filter News</SheetTitle>
              </SheetHeader>
              
              <div className="mt-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="search">Search</Label>
                    <Input
                      id="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search news..."
                      className="bg-black/40 border-flicks-teal/20 text-flicks-light"
                    />
                  </div>
                  
                  <Separator className="bg-flicks-teal/20" />
                  
                  <div>
                    <h3 className="mb-3 font-medium">News Sources</h3>
                    <div className="space-y-2">
                      {newsSources.map((source) => (
                        <div key={source.id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`source-${source.id}`}
                            checked={selectedSources.includes(source.id)}
                            onCheckedChange={() => toggleSource(source.id)}
                            className="border-flicks-teal/50 data-[state=checked]:bg-flicks-teal data-[state=checked]:border-flicks-teal"
                          />
                          <Label 
                            htmlFor={`source-${source.id}`}
                            className="cursor-pointer"
                          >
                            {source.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {allCategories.length > 0 && (
                    <>
                      <Separator className="bg-flicks-teal/20" />
                      <div>
                        <h3 className="mb-3 font-medium">Categories</h3>
                        <div className="flex flex-wrap gap-2">
                          {allCategories.slice(0, 15).map((category, idx) => (
                            <Badge 
                              key={idx}
                              variant={selectedCategories.includes(category) ? "default" : "outline"}
                              className={`cursor-pointer ${
                                selectedCategories.includes(category) 
                                  ? "bg-flicks-teal text-black hover:bg-flicks-teal/90"
                                  : "bg-transparent text-flicks-light hover:bg-flicks-teal/10 border-flicks-teal/30"
                              }`}
                              onClick={() => toggleCategory(category)}
                            >
                              {category}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="mt-8">
                  <Button 
                    variant="outline"
                    className="border-red-400/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 w-full"
                    onClick={clearFilters}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear All Filters
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Applied filters */}
      {(selectedSources.length > 0 || selectedCategories.length > 0 || searchQuery) && (
        <div className="flex flex-wrap gap-2 mb-6">
          {searchQuery && (
            <Badge className="bg-flicks-teal/20 text-flicks-teal hover:bg-flicks-teal/30 pl-2 pr-1 py-1.5">
              Search: {searchQuery}
              <button onClick={() => setSearchQuery("")} className="ml-1 rounded-full hover:bg-black/20 p-0.5">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {selectedSources.map(sourceId => {
            const source = newsSources.find(s => s.id === sourceId);
            return (
              <Badge key={sourceId} className="bg-flicks-teal/20 text-flicks-teal hover:bg-flicks-teal/30 pl-2 pr-1 py-1.5">
                Source: {source?.name}
                <button onClick={() => toggleSource(sourceId)} className="ml-1 rounded-full hover:bg-black/20 p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
          
          {selectedCategories.map(category => (
            <Badge key={category} className="bg-flicks-teal/20 text-flicks-teal hover:bg-flicks-teal/30 pl-2 pr-1 py-1.5">
              {category}
              <button onClick={() => toggleCategory(category)} className="ml-1 rounded-full hover:bg-black/20 p-0.5">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          
          <Button 
            variant="ghost" 
            className="text-gray-400 hover:text-gray-300 p-0 h-6"
            onClick={clearFilters}
          >
            Clear All
          </Button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <RefreshCw className="h-12 w-12 text-flicks-teal animate-spin" />
            <p className="text-flicks-light text-lg">Loading news...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="flex justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-red-500/10">
              <X className="h-12 w-12 text-red-500" />
            </div>
            <p className="text-red-400 text-lg">Failed to load news</p>
            <Button onClick={() => refetch()} className="bg-flicks-teal hover:bg-flicks-sage text-black">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* No results */}
      {!isLoading && !isError && filteredNews.length === 0 && (
        <div className="flex justify-center py-20">
          <div className="flex flex-col items-center gap-4 max-w-md text-center">
            <Newspaper className="h-12 w-12 text-gray-500" />
            <h3 className="text-xl font-semibold text-flicks-light">No news found</h3>
            <p className="text-gray-400">
              Try adjusting your filters or check back later for fresh updates.
            </p>
            <Button onClick={clearFilters} variant="outline" className="border-flicks-teal text-flicks-teal">
              Clear All Filters
            </Button>
          </div>
        </div>
      )}

      {/* News grid */}
      {filteredNews.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {currentNews.map((item: NewsItem) => (
              <NewsCard key={item.id} news={item} onCategoryClick={toggleCategory} />
            ))}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => goToPage(currentPage - 1)}
                      className={`${currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer text-flicks-teal'}`} 
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                    let pageNumber: number;
                    
                    // Logic for showing which page numbers
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }
                    
                    // Only render if pageNumber is valid
                    if (pageNumber > 0 && pageNumber <= totalPages) {
                      return (
                        <PaginationItem key={pageNumber}>
                          <PaginationLink
                            onClick={() => goToPage(pageNumber)}
                            isActive={currentPage === pageNumber}
                            className={currentPage === pageNumber 
                              ? 'bg-flicks-teal text-black border-flicks-teal' 
                              : 'text-flicks-light hover:text-flicks-teal hover:bg-flicks-teal/10 cursor-pointer'
                            }
                          >
                            {pageNumber}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}
                  
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  
                  {totalPages > 5 && currentPage < totalPages - 1 && (
                    <PaginationItem>
                      <PaginationLink
                        onClick={() => goToPage(totalPages)}
                        className="text-flicks-light hover:text-flicks-teal hover:bg-flicks-teal/10 cursor-pointer"
                      >
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  )}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => goToPage(currentPage + 1)}
                      className={`${currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer text-flicks-teal'}`} 
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NewsPage;