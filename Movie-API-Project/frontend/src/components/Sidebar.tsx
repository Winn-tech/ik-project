import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Compass,
  Calendar,
  Users,
  Bookmark,
  Star,
  Settings,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import popcornImage from "@/components/images/popcorn.png";
import "@/styles/layout.css";

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  const navItems = [
    {
      name: "Discover",
      icon: Compass,
      path: "/",
      section: "discover",
      iconColor: "text-flicks-teal",
    },
    {
      name: "Upcoming",
      icon: Calendar,
      path: "/upcoming",
      section: "discover",
      iconColor: "text-white",
    },
    {
      name: "Circles",
      icon: Users,
      path: "/circles",
      section: "discover",
      iconColor: "text-purple-400",
      badge: 3,
    },
  ];

  const libraryItems = [
    {
      name: "Watchlist",
      icon: Bookmark,
      path: "/watchlist",
      section: "library",
      iconColor: "text-flicks-light/60",
    },
    {
      name: "Ratings",
      icon: Star,
      path: "/favorites",
      section: "library",
      iconColor: "text-flicks-light/60",
    },
  ];

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex w-64 bg-black border-r border-flicks-teal/20 h-screen fixed left-0 top-0 pt-2 z-40 flex-col">
      {/* Header with Icon */}
      <div className="px-6 py-4 border-b border-flicks-teal/20 mb-8">
        <Link to="/" className="flex items-center space-x-2">
          <img
            src={popcornImage}
            alt="Popcorn"
            className="w-8 h-8 object-contain"
          />
          <span className="font-heading text-lg font-bold sidebar__title">
            <span className="text-[#02ADC1]">Flicks</span>
            <span className="text-[#02ADC1]">Lounge</span>
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        {/* Discover Section */}
        <div className="px-4 mb-10">
          {/* <h3 className="text-xs font-semibold text-flicks-light/50 uppercase tracking-wider mb-4 px-2 sidebar__text">
            DISCOVER
          </h3> */}
          <div className="space-y-1 mb-4 sidebar__text">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-lg transition-colors h-10 mb-4 sidebar__text",
                    active
                      ? "bg-[#18181B] text-white"
                      : "text-white hover:bg-gray-700/30",
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <Icon
                      className={cn(
                        "w-5 h-5",
                        item.name === "Circles"
                          ? "text-purple-400"
                          : "text-white",
                      )}
                    />
                    <span className="text-sm font-medium text-white">
                      {item.name}
                    </span>
                  </div>
                  {item.badge && (
                    <span className="bg-purple-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* My Library Section */}
        <div className="px-4 mb-6">
          <h3 className="text-xs font-semibold text-flicks-light/50 uppercase tracking-wider mb-3 px-2 sidebar__text_i">
            MY LIBRARY
          </h3>
          <div className="space-y-1">
            {libraryItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                    active
                      ? "bg-blue-900/40 text-[#A1A1AA]"
                      : "text-[#A1A1AA] hover:bg-gray-700/30",
                  )}
                >
                  <Icon className="w-5 h-5 text-flicks-light/60" />
                  <span className="text-sm font-medium text-[#A1A1AA] sidebar__text">
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Active Circles */}
        <div className="px-4 mb-6">
          <h3 className="text-xs font-semibold text-flicks-light/50 uppercase tracking-wider mb-3 px-2">
            ACTIVE CIRCLES
          </h3>
          <div className="space-y-2">
            <Link
              to="/circles"
              className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-green-500/10 transition-colors group"
            >
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                H
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  Horror Club
                </p>
                <p className="text-xs text-flicks-light/60">
                  112 new discussions
                </p>
              </div>
            </Link>
            <Link
              to="/circles"
              className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-purple-500/10 transition-colors group"
            >
              <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                SF
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  Sci-Fi Geeks
                </p>
                <p className="text-xs text-flicks-light/60">
                  Poll: Best ending?
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* User Profile Section */}
      <div className="px-4 py-4 border-t border-flicks-teal/20 mt-auto">
        <div className="flex items-center space-x-3">
          <Link
            to={isAuthenticated ? "/profile" : "/login"}
            className="flex items-center space-x-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
          >
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src={user?.profilePic} />
              <AvatarFallback className="bg-gray-600 text-white">
                {user?.username?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.username || user?.email?.split("@")[0] || "Alex Choi"}
              </p>
              <p className="text-xs text-flicks-light/60">Pro Member</p>
            </div>
          </Link>
          <Link
            to={isAuthenticated ? "/settings" : "/login"}
            className="flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <Settings className="w-4 h-4 text-flicks-light/60 hover:text-white transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
