import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Film, Home, Tv, Search, Newspaper, CalendarClock } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-flicks-dark to-black px-4 py-20">
      <div className="text-center max-w-md">
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <Film className="h-20 w-20 text-flicks-teal animate-pulse" />
            <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-5xl font-bold text-flicks-light">
              404
            </span>
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-flicks-light mb-4">
          Scene Not Found
        </h1>

        <p className="text-gray-400 text-lg mb-8">
          {/* Oops! Looks like you've wandered onto an empty set. The scene you're looking for isn't in our script. */}
          The movie or TV show you're looking for isn't in our database. The
          director might have called "cut" on this one.
        </p>

        <div className="space-y-4">
          <Button
            asChild
            className="bg-flicks-teal hover:bg-flicks-teal/90 text-black w-full"
          >
            <Link to="/" className="flex items-center justify-center">
              <Home className="mr-2 h-4 w-4" />
              Return to Home
            </Link>
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Button
              asChild
              variant="outline"
              className="border-flicks-teal/50 text-flicks-light hover:bg-flicks-teal/10"
            >
              <Link to="/movies" className="flex items-center justify-center">
                <Film className="mr-2 h-4 w-4" />
                Movies
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="border-flicks-teal/50 text-flicks-light hover:bg-flicks-teal/10"
            >
              <Link to="/tv" className="flex items-center justify-center">
                <Tv className="mr-2 h-4 w-4" />
                TV Shows
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="border-flicks-teal/50 text-flicks-light hover:bg-flicks-teal/10"
            >
              <Link to="/news" className="flex items-center justify-center">
                <Newspaper className="mr-2 h-4 w-4" />
                News
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="border-flicks-teal/50 text-flicks-light hover:bg-flicks-teal/10"
            >
              <Link to="/upcoming" className="flex items-center justify-center">
                <CalendarClock className="mr-2 h-4 w-4" />
                Coming Soon
              </Link>
            </Button>
          </div>

          <Button
            asChild
            variant="ghost"
            className="text-gray-400 hover:text-gray-200 w-full"
          >
            <Link to="/search" className="flex items-center justify-center">
              <Search className="mr-2 h-4 w-4" />
              Search for something else
            </Link>
          </Button>
        </div>

        <div className="mt-12 text-gray-500 text-sm">
          <p>Error code: 404 - Page Not Found</p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
