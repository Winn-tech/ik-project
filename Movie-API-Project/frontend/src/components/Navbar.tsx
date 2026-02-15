import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Film,
  Home,
  LogOut,
  Search,
  Settings,
  User,
  Tv,
  Heart,
  BookmarkPlus,
  MapPin,
  Menu,
  X,
  Newspaper,
  UserRound,
  CalendarClock,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion, AnimatePresence } from "framer-motion";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDrawer, setOpenDrawer] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      if (isMobile) {
        setIsMenuOpen(false);
        setOpenDrawer(false);
      }
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Close mobile menu when navigating
  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setIsMenuOpen(false);
      setOpenDrawer(false);
    }
  };

  const menuItems = [
    { name: "Home", icon: <Home className="w-5 h-5" />, path: "/" },
    { name: "Movies", icon: <Film className="w-5 h-5" />, path: "/movies" },
    { name: "TV Shows", icon: <Tv className="w-5 h-5" />, path: "/tv" },
    {
      name: "Upcoming",
      icon: <CalendarClock className="w-5 h-5" />,
      path: "/upcoming",
    },
    { name: "Cinemas", icon: <MapPin className="w-5 h-5" />, path: "/cinemas" },
    { name: "News", icon: <Newspaper className="w-5 h-5" />, path: "/news" },
    { name: "Circles", icon: <UserRound className="w-5 h-5" />, path: "/circles" },
  ];

  const authItems = isAuthenticated
    ? [
        {
          name: "Profile",
          icon: <User className="w-5 h-5" />,
          path: "/profile",
        },
        {
          name: "Favorites",
          icon: <Heart className="w-5 h-5" />,
          path: "/favorites",
        },
        {
          name: "Watchlist",
          icon: <BookmarkPlus className="w-5 h-5" />,
          path: "/watchlist",
        },
        {
          name: "Settings",
          icon: <Settings className="w-5 h-5" />,
          path: "/settings",
        },
      ]
    : [
        { name: "Login", icon: <User className="w-5 h-5" />, path: "/login" },
        {
          name: "Register",
          icon: <User className="w-5 h-5" />,
          path: "/register",
        },
      ];

  const mobileMenuVariants = {
    hidden: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.2,
        ease: "easeInOut",
      },
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut",
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-flicks-dark/95 shadow-md backdrop-blur-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-1">
          <Link to="/" className="flex items-center space-x-2">
            <Film className="w-8 h-8 text-flicks-teal" />
            <span className="font-heading text-2xl font-bold text-flicks-light">
              Flicks<span className="text-flicks-teal">Lounge</span>
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-6">
          <Link
            to="/"
            className="text-flicks-light hover:text-flicks-teal transition-colors flex items-center gap-1"
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </Link>
          <Link
            to="/movies"
            className="text-flicks-light hover:text-flicks-teal transition-colors flex items-center gap-1"
          >
            <Film className="w-4 h-4" />
            <span>Movies</span>
          </Link>
          <Link
            to="/tv"
            className="text-flicks-light hover:text-flicks-teal transition-colors flex items-center gap-1"
          >
            <Tv className="w-4 h-4" />
            <span>TV Shows</span>
          </Link>
          <Link
            to="/upcoming"
            className="text-flicks-light hover:text-flicks-teal transition-colors flex items-center gap-1"
          >
            <CalendarClock className="w-4 h-4" />
            <span>Upcoming</span>
          </Link>
          <Link
            to="/cinemas"
            className="text-flicks-light hover:text-flicks-teal transition-colors flex items-center gap-1"
          >
            <MapPin className="w-4 h-4" />
            <span>Cinemas</span>
          </Link>
          <Link
            to="/news"
            className="text-flicks-light hover:text-flicks-teal transition-colors flex items-center gap-1"
          >
            <Newspaper className="w-4 h-4" />
            <span>News</span>
          </Link>
          <Link
            to="/circles"
            className="text-flicks-light hover:text-flicks-teal transition-colors flex items-center gap-1"
          >
            <UserRound className="w-4 h-4" />
            <span>Circles</span>
          </Link>
        </div>

        {/* Search and Auth Section */}
        <div className="flex items-center space-x-4">
          {/* Desktop Search */}
          <form onSubmit={handleSearch} className="relative hidden md:block">
            <Input
              type="search"
              placeholder="Search..."
              className="w-[200px] bg-flicks-dark border-flicks-teal pl-8 text-flicks-light"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-flicks-light opacity-70" />
          </form>

          {/* Desktop User Menu */}
          {isAuthenticated ? (
            <div className="hidden md:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="cursor-pointer h-8 w-8 border border-flicks-teal">
                    <AvatarImage src={user?.profilePic} />
                    <AvatarFallback className="bg-flicks-teal text-flicks-light">
                      {user?.username?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-flicks-dark border-flicks-teal text-flicks-light"
                >
                  <DropdownMenuLabel className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>My Account</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-flicks-teal/30" />
                  <DropdownMenuItem
                    className="cursor-pointer hover:bg-flicks-teal/20"
                    onClick={() => navigate("/profile")}
                  >
                    <User className="h-4 w-4 mr-2" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer hover:bg-flicks-teal/20"
                    onClick={() => navigate("/favorites")}
                  >
                    <Heart className="h-4 w-4 mr-2" />
                    <span>Favorites</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer hover:bg-flicks-teal/20"
                    onClick={() => navigate("/watchlist")}
                  >
                    <BookmarkPlus className="h-4 w-4 mr-2" />
                    <span>Watchlist</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer hover:bg-flicks-teal/20"
                    onClick={() => navigate("/settings")}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-flicks-teal/30" />
                  <DropdownMenuItem
                    className="cursor-pointer hover:bg-flicks-teal/20"
                    onClick={logout}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-2">
              <Button
                asChild
                variant="ghost"
                className="text-flicks-light hover:text-flicks-teal hover:bg-transparent"
              >
                <Link to="/login">Login</Link>
              </Button>
              <Button
                asChild
                className="bg-flicks-teal hover:bg-flicks-sage text-white"
              >
                <Link to="/register">Register</Link>
              </Button>
            </div>
          )}

          {/* Mobile Menu Button */}
          <Drawer open={openDrawer} onOpenChange={setOpenDrawer}>
            <DrawerTrigger asChild>
              <Button
                variant="ghost"
                className="lg:hidden text-flicks-light p-1"
                aria-label="Menu"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </DrawerTrigger>
            <DrawerContent className="h-[80vh] bg-flicks-dark border-t border-flicks-teal/30">
              <div className="p-4">
                {/* Mobile Search */}
                <form onSubmit={handleSearch} className="relative mb-6">
                  <Input
                    type="search"
                    placeholder="Search..."
                    className="w-full bg-flicks-dark border-flicks-teal pl-8 text-flicks-light"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-flicks-light opacity-70" />
                  <Button
                    type="submit"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 bg-flicks-teal hover:bg-flicks-sage"
                    size="sm"
                  >
                    Search
                  </Button>
                </form>

                {/* Navigation Links */}
                <div className="space-y-6 pb-6">
                  <div className="space-y-2">
                    <h3 className="text-flicks-light/70 text-sm font-medium px-2">
                      Navigation
                    </h3>
                    {menuItems.map((item, index) => (
                      <motion.div
                        key={item.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-flicks-light hover:bg-flicks-teal/20 hover:text-flicks-teal"
                          onClick={() => handleNavigation(item.path)}
                        >
                          <span className="mr-2">{item.icon}</span>
                          {item.name}
                        </Button>
                      </motion.div>
                    ))}
                  </div>

                  {/* User Actions */}
                  <div className="space-y-2">
                    <h3 className="text-flicks-light/70 text-sm font-medium px-2">
                      {isAuthenticated ? "Account" : "Access"}
                    </h3>
                    {authItems.map((item, index) => (
                      <motion.div
                        key={item.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: (index + menuItems.length) * 0.05,
                        }}
                      >
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-flicks-light hover:bg-flicks-teal/20 hover:text-flicks-teal"
                          onClick={() => handleNavigation(item.path)}
                        >
                          <span className="mr-2">{item.icon}</span>
                          {item.name}
                        </Button>
                      </motion.div>
                    ))}

                    {isAuthenticated && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: (authItems.length + menuItems.length) * 0.05,
                        }}
                      >
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-flicks-light hover:bg-red-500/20 hover:text-red-500"
                          onClick={() => {
                            logout();
                            setOpenDrawer(false);
                          }}
                        >
                          <span className="mr-2">
                            <LogOut className="w-5 h-5" />
                          </span>
                          Logout
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* User Info */}
                {isAuthenticated && user && (
                  <div className="mt-auto pt-4 border-t border-flicks-teal/20">
                    <div className="flex items-center space-x-3 px-2">
                      <Avatar className="h-10 w-10 border border-flicks-teal">
                        <AvatarImage src={user.profilePic} />
                        <AvatarFallback className="bg-flicks-teal text-flicks-light">
                          {user.username?.charAt(0)?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-flicks-light font-medium">
                          {user.username || "User"}
                        </p>
                        <p className="text-flicks-light/60 text-sm">
                          {user.email || ""}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
