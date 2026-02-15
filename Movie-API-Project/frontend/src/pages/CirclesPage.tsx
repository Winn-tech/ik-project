
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { circlesAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Plus, Search, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useDebounce } from "@/hooks/useDebounce";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

interface Circle {
  _id: string;
  name: string;
  description: string;
  createdBy: string | { _id: string; username: string; profilePic?: string; };
  members: string[];
  moderators: string[];
  createdAt: string;
}

interface PaginatedResponse {
  data: Circle[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  }
}

const CirclesPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const limit = 9;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      localStorage.setItem('lastVisitedPath', '/circles');
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const { data, isLoading, error } = useQuery<PaginatedResponse>({
    queryKey: ["circles", currentPage, limit, debouncedSearchQuery],
    queryFn: () => {
      // Only search if query is at least 3 characters
      if (debouncedSearchQuery && debouncedSearchQuery.length >= 3) {
        return circlesAPI.searchCircles(debouncedSearchQuery, currentPage, limit);
      } else if (!debouncedSearchQuery) {
        return circlesAPI.getAllCircles(currentPage, limit);
      } else {
        // Return empty result for queries less than 3 characters
        return Promise.resolve({
          data: [],
          pagination: { page: 1, limit, total: 0, pages: 0 }
        });
      }
    },
    enabled: !!localStorage.getItem("token"),
  });

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  
  const renderPagination = () => {
    if (!data || !data.pagination || data.pagination.pages <= 1) return null;
    
    const { page, pages } = data.pagination;
    const pageItems = [];
    
    // Previous button
    pageItems.push(
      <PaginationItem key="prev">
        <PaginationPrevious 
          onClick={() => handlePageChange(Math.max(1, page - 1))}
          className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
        />
      </PaginationItem>
    );
    
    // First page
    pageItems.push(
      <PaginationItem key="1">
        <PaginationLink 
          onClick={() => handlePageChange(1)} 
          isActive={page === 1}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );
    
    // Ellipsis if needed
    if (page > 3) {
      pageItems.push(
        <PaginationItem key="ellipsis1">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Pages around current
    for (let i = Math.max(2, page - 1); i <= Math.min(pages - 1, page + 1); i++) {
      pageItems.push(
        <PaginationItem key={i}>
          <PaginationLink 
            onClick={() => handlePageChange(i)} 
            isActive={page === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Ellipsis if needed
    if (page < pages - 2) {
      pageItems.push(
        <PaginationItem key="ellipsis2">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Last page
    if (pages > 1) {
      pageItems.push(
        <PaginationItem key={pages}>
          <PaginationLink 
            onClick={() => handlePageChange(pages)} 
            isActive={page === pages}
          >
            {pages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Next button
    pageItems.push(
      <PaginationItem key="next">
        <PaginationNext 
          onClick={() => handlePageChange(Math.min(pages, page + 1))}
          className={page === pages ? "pointer-events-none opacity-50" : "cursor-pointer"}
        />
      </PaginationItem>
    );
    
    return (
      <Pagination className="mt-8">
        <PaginationContent>{pageItems}</PaginationContent>
      </Pagination>
    );
  };

  if (!localStorage.getItem("token")) {
    return null;
  }

  return (
    <div className="container max-w-screen-xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-flicks-light mb-2">Circles</h1>
          <p className="text-flicks-light/70">Join communities of movie and TV enthusiasts</p>
        </div>
        <Button asChild className="bg-flicks-teal hover:bg-flicks-sage text-black">
          <Link to="/circles/create" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Circle
          </Link>
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md mx-auto md:mx-0">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-flicks-light/50 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search circles (min 3 characters)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-flicks-dark/60 border-flicks-teal/20 text-flicks-light"
          />
        </div>
        {searchQuery.length > 0 && searchQuery.length < 3 && (
          <p className="text-flicks-light/50 text-xs mt-1 max-w-md mx-auto md:mx-0">Type at least 3 characters to search</p>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="bg-flicks-dark/60 border-flicks-teal/20">
              <CardHeader>
                <Skeleton className="h-7 w-3/4 bg-gray-700" />
                <Skeleton className="h-4 w-full bg-gray-700" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full bg-gray-700" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full bg-gray-700" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="bg-flicks-dark/60 border-red-500/30 text-flicks-light p-6">
          <p className="text-red-400">Failed to load circles. Please try again later.</p>
        </Card>
      ) : data?.data?.length === 0 ? (
        <Card className="bg-flicks-dark/60 border-flicks-teal/20 text-flicks-light">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-16 w-16 mb-4 text-flicks-teal opacity-80" />
            <h2 className="text-xl font-semibold mb-2">
              {searchQuery ? "No circles match your search" : "No circles yet"}
            </h2>
            <p className="text-flicks-light/70 text-center max-w-md mb-6">
              {searchQuery ? "Try a different search term or create a new circle" : "Be the first one to create a circle and start building your community!"}
            </p>
            {!searchQuery && (
              <Button asChild className="bg-flicks-teal hover:bg-flicks-sage text-black">
                <Link to="/circles/create">Create Circle</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.data?.map((circle: Circle) => {
              const memberCount = Array.isArray(circle.members) ? circle.members.length : 0;
              
              return (
                <Card key={circle._id} className="bg-flicks-dark/60 border-flicks-teal/20 text-flicks-light hover:border-flicks-teal/50 transition-colors">
                  <CardHeader>
                    <CardTitle className="text-xl">{circle.name}</CardTitle>
                    <CardDescription className="text-flicks-light/70">
                      {memberCount} {memberCount === 1 ? 'member' : 'members'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-flicks-light/90 line-clamp-3">{circle.description}</p>
                  </CardContent>
                  <CardFooter>
                    <Button asChild className="w-full bg-flicks-teal hover:bg-flicks-sage text-black">
                      <Link to={`/circles/${circle._id}`}>
                        View Circle
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
          {renderPagination()}
        </>
      )}
    </div>
  );
};

export default CirclesPage;
