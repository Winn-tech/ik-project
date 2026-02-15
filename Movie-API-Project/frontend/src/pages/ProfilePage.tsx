/* eslint-disable @typescript-eslint/no-explicit-any */

// import React, { useState, useRef } from "react";
// import { useAuth } from "@/contexts/AuthContext";
// import { useNavigate } from "react-router-dom";
// import { toast } from "@/lib/toast";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { Label } from "@/components/ui/label";
// import { profileAPI, favoritesAPI, watchlistAPI, tmdbAPI } from "@/lib/api";
// import { useQuery } from "@tanstack/react-query";
// import { UserRound, Settings, Heart, BookmarkPlus, LoaderCircle, Camera } from "lucide-react";
// import MovieCard from "@/components/MovieCard";

// const ProfilePage: React.FC = () => {
//   const { user, isAuthenticated } = useAuth();
//   const navigate = useNavigate();
//   const fileInputRef = useRef<HTMLInputElement>(null);
//   const [uploading, setUploading] = useState(false);
//   const [favorites, setFavorites] = useState<any[]>([]);
//   const [watchlistItems, setWatchlistItems] = useState<any[]>([]);

//   React.useEffect(() => {
//     if (!isAuthenticated) {
//       toast.error("Please login to view your profile");
//       navigate("/login");
//     }
//   }, [isAuthenticated, navigate]);

//   // Fetch user's favorites
//   const { 
//     data: favoritesData, 
//     isLoading: favoritesLoading,
//     refetch: refetchFavorites
//   } = useQuery({
//     queryKey: ["favorites"],
//     queryFn: favoritesAPI.getAllFavorites,
//     enabled: isAuthenticated,
//   });

//   // Fetch user's watchlist
//   const { 
//     data: watchlist, 
//     isLoading: watchlistLoading,
//     refetch: refetchWatchlist
//   } = useQuery({
//     queryKey: ["watchlist"],
//     queryFn: watchlistAPI.getAllWatchlist,
//     enabled: isAuthenticated,
//   });

//   // Load media details for favorites and watchlist
//   React.useEffect(() => {
//     const loadFavoritesDetails = async () => {
//       if (!favoritesData?.data) return;

//       const detailedFavorites = await Promise.all(
//         favoritesData.data.map(async (fav: any) => {
//           try {
//             let details;
//             if (fav.media_type === "movie") {
//               details = await tmdbAPI.getMovieDetails(fav.media_id);
//             } else if (fav.media_type === "tv") {
//               details = await tmdbAPI.getTVShowDetails(fav.media_id);
//             }

//             return {
//               ...fav,
//               details,
//               title: details?.title || details?.name || "Unknown",
//               poster_path: details?.poster_path
//             };
//           } catch (error) {
//             console.error("Error fetching favorite details:", error);
//             return fav;
//           }
//         })
//       );

//       setFavorites(detailedFavorites.filter(item => item.details));
//     };

//     const loadWatchlistDetails = async () => {
//       if (!watchlist?.data) return;

//       const detailedWatchlist = await Promise.all(
//         watchlist.data.map(async (item: any) => {
//           try {
//             let details;
//             if (item.media_type === "movie") {
//               details = await tmdbAPI.getMovieDetails(item.media_id);
//             } else if (item.media_type === "tv") {
//               details = await tmdbAPI.getTVShowDetails(item.media_id);
//             }

//             return {
//               ...item,
//               details,
//               title: details?.title || details?.name || "Unknown",
//               poster_path: details?.poster_path
//             };
//           } catch (error) {
//             console.error("Error fetching watchlist details:", error);
//             return item;
//           }
//         })
//       );

//       setWatchlistItems(detailedWatchlist.filter(item => item.details));
//     };

//     loadFavoritesDetails();
//     loadWatchlistDetails();
//   }, [favoritesData, watchlist]);

//   // Handle profile picture upload
//   const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     // Check file type
//     if (!file.type.startsWith("image/")) {
//       toast.error("Please upload an image file");
//       return;
//     }

//     // Check file size (max 5MB)
//     if (file.size > 5 * 1024 * 1024) {
//       toast.error("File size should be less than 5MB");
//       return;
//     }

//     // Create FormData object to send file
//     const formData = new FormData();
//     formData.append("image", file); // Match the backend field name expectation

//     try {
//       setUploading(true);
//       await profileAPI.uploadProfilePicture(formData);
//       toast.success("Profile picture updated successfully");

//       // Instead of reloading the page which causes logout, 
//       // fetch updated user info or just update the UI directly
//       setTimeout(() => {
//         setUploading(false);
//         // Force refetch of user data instead of page reload
//       }, 500);
//     } catch (error) {
//       console.error("Error uploading profile picture:", error);
//       toast.error("Failed to upload profile picture");
//       setUploading(false);
//     }
//   };

//   const handleRemoveProfilePic = async () => {
//     try {
//       await profileAPI.removeProfilePicture();
//       toast.success("Profile picture removed");

//       // Instead of reloading the page which causes logout,
//       // we'll update the UI directly
//       setTimeout(() => {
//         // Force refetch of user data instead of page reload
//       }, 500);
//     } catch (error) {
//       console.error("Error removing profile picture:", error);
//       toast.error("Failed to remove profile picture");
//     }
//   };

//   const handleRemoveFavorite = async (id: number) => {
//     try {
//       await favoritesAPI.removeFavorite(id);
//       toast.success("Removed from favorites");
//       refetchFavorites();
//       // Update local state
//       setFavorites(favorites.filter(fav => fav.media_id !== id));
//     } catch (error) {
//       console.error("Error removing favorite:", error);
//       toast.error("Failed to remove from favorites");
//     }
//   };

//   const handleRemoveFromWatchlist = async (id: number) => {
//     try {
//       await watchlistAPI.removeFromWatchlist(id);
//       toast.success("Removed from watchlist");
//       refetchWatchlist();
//       // Update local state
//       setWatchlistItems(watchlistItems.filter(item => item.media_id !== id));
//     } catch (error) {
//       console.error("Error removing from watchlist:", error);
//       toast.error("Failed to remove from watchlist");
//     }
//   };

//   if (!isAuthenticated) {
//     return null; // We already redirect in the effect
//   }

//   const userInitials = user?.username
//     ? user.username.substring(0, 2).toUpperCase()
//     : "U";

//   return (
//     <div className="container mx-auto py-24 px-4">
//       <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
//         <h1 className="text-3xl font-bold text-flicks-light">My Profile</h1>

//         <Button 
//           variant="outline" 
//           onClick={() => navigate("/settings")}
//           className="mt-4 md:mt-0 border-flicks-teal text-flicks-light hover:bg-flicks-teal/20"
//         >
//           <Settings className="mr-2 h-4 w-4" />
//           Settings
//         </Button>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//         <div className="md:col-span-1">
//           <Card className="bg-flicks-dark border-flicks-teal/20">
//             <CardHeader>
//               <CardTitle className="text-flicks-light flex items-center">
//                 <UserRound className="h-5 w-5 mr-2 text-flicks-teal" />
//                 Profile Information
//               </CardTitle>
//             </CardHeader>
//             <CardContent className="flex flex-col items-center">
//               <div className="relative mb-6">
//                 <Avatar className="w-32 h-32 border-4 border-flicks-teal">
//                   <AvatarImage src={user?.profilePic} alt={userInitials} className="object-cover" />
//                   <AvatarFallback className="text-3xl bg-flicks-teal text-flicks-light">
//                     {userInitials}
//                   </AvatarFallback>
//                 </Avatar>

//                 <Button 
//                   size="icon"
//                   variant="outline"
//                   className="absolute bottom-0 right-0 rounded-full bg-flicks-teal border-flicks-light"
//                   onClick={() => fileInputRef.current?.click()}
//                   disabled={uploading}
//                 >
//                   {uploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
//                 </Button>

//                 <input
//                   type="file"
//                   ref={fileInputRef}
//                   className="hidden"
//                   onChange={handleFileUpload}
//                   accept="image/*"
//                 />
//               </div>

//               <h2 className="text-xl font-semibold text-flicks-light mb-1">{user?.username}</h2>
//               <p className="text-flicks-light/70 mb-4">{user?.email}</p>

//               {user?.profilePic && (
//                 <Button 
//                   variant="ghost" 
//                   onClick={handleRemoveProfilePic}
//                   className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
//                 >
//                   Remove Profile Picture
//                 </Button>
//               )}
//             </CardContent>
//           </Card>

//           <Card className="bg-flicks-dark border-flicks-teal/20 mt-6">
//             <CardHeader>
//               <CardTitle className="text-flicks-light">Account Statistics</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="space-y-4">
//                 <div className="flex justify-between items-center">
//                   <span className="text-flicks-light/70">Favorites</span>
//                   <span className="text-flicks-light font-medium">
//                     {favoritesLoading ? "..." : favorites.length || 0}
//                   </span>
//                 </div>

//                 <div className="flex justify-between items-center">
//                   <span className="text-flicks-light/70">Watchlist</span>
//                   <span className="text-flicks-light font-medium">
//                     {watchlistLoading ? "..." : watchlistItems.length || 0}
//                   </span>
//                 </div>

//                 <div className="flex justify-between items-center">
//                   <span className="text-flicks-light/70">Reviews</span>
//                   <span className="text-flicks-light font-medium">0</span>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         </div>

//         <div className="md:col-span-2">
//           <Tabs defaultValue="favorites" className="space-y-6">
//             <TabsList className="bg-flicks-dark border-b border-flicks-teal/30">
//               <TabsTrigger value="favorites" className="text-flicks-light data-[state=active]:text-flicks-teal">
//                 <Heart className="h-4 w-4 mr-2" />
//                 Favorites
//               </TabsTrigger>
//               <TabsTrigger value="watchlist" className="text-flicks-light data-[state=active]:text-flicks-teal">
//                 <BookmarkPlus className="h-4 w-4 mr-2" />
//                 Watchlist
//               </TabsTrigger>
//             </TabsList>

//             <TabsContent value="favorites">
//               {favoritesLoading ? (
//                 <div className="flex justify-center p-12">
//                   <LoaderCircle className="animate-spin h-10 w-10 text-flicks-teal" />
//                 </div>
//               ) : favorites.length > 0 ? (
//                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                   {favorites.map((favorite: any) => (
//                     <MovieCard
//                       key={favorite.media_id}
//                       id={favorite.media_id}
//                       title={favorite.details?.title || favorite.details?.name || "Unknown Title"}
//                       posterPath={favorite.details?.poster_path}
//                       mediaType={favorite.media_type}
//                       isFavorite={true}
//                       onAddFavorite={() => handleRemoveFavorite(favorite.media_id)}
//                     />
//                   ))}
//                 </div>
//               ) : (
//                 <div className="text-center py-12 text-flicks-light/70">
//                   <Heart className="mx-auto h-16 w-16 mb-4 text-flicks-teal/50" />
//                   <h3 className="text-xl font-medium">No favorites yet</h3>
//                   <p className="mt-2">Browse movies and TV shows to add to your favorites</p>
//                   <div className="mt-6 flex justify-center gap-4">
//                     <Button onClick={() => navigate("/movies")} className="bg-flicks-teal hover:bg-flicks-sage">
//                       Browse Movies
//                     </Button>
//                     <Button onClick={() => navigate("/tv")} variant="outline" className="border-flicks-teal text-flicks-light hover:bg-flicks-teal/20">
//                       Browse TV Shows
//                     </Button>
//                   </div>
//                 </div>
//               )}
//             </TabsContent>

//             <TabsContent value="watchlist">
//               {watchlistLoading ? (
//                 <div className="flex justify-center p-12">
//                   <LoaderCircle className="animate-spin h-10 w-10 text-flicks-teal" />
//                 </div>
//               ) : watchlistItems.length > 0 ? (
//                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                   {watchlistItems.map((item: any) => (
//                     <MovieCard
//                       key={item.media_id}
//                       id={item.media_id}
//                       title={item.details?.title || item.details?.name || "Unknown Title"}
//                       posterPath={item.details?.poster_path}
//                       mediaType={item.media_type}
//                       isInWatchlist={true}
//                       onAddWatchlist={() => handleRemoveFromWatchlist(item.media_id)}
//                     />
//                   ))}
//                 </div>
//               ) : (
//                 <div className="text-center py-12 text-flicks-light/70">
//                   <BookmarkPlus className="mx-auto h-16 w-16 mb-4 text-flicks-teal/50" />
//                   <h3 className="text-xl font-medium">Your watchlist is empty</h3>
//                   <p className="mt-2">Find movies and TV shows you want to watch later</p>
//                   <div className="mt-6 flex justify-center gap-4">
//                     <Button onClick={() => navigate("/movies")} className="bg-flicks-teal hover:bg-flicks-sage">
//                       Browse Movies
//                     </Button>
//                     <Button onClick={() => navigate("/tv")} variant="outline" className="border-flicks-teal text-flicks-light hover:bg-flicks-teal/20">
//                       Browse TV Shows
//                     </Button>
//                   </div>
//                 </div>
//               )}
//             </TabsContent>
//           </Tabs>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ProfilePage;



import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { profileAPI, favoritesAPI, watchlistAPI, tmdbAPI } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import {
  UserRound,
  Settings,
  Heart,
  BookmarkPlus,
  LoaderCircle,
  Camera
} from "lucide-react";
import MovieCard from "@/components/MovieCard";

const ProfilePage: React.FC = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef < HTMLInputElement > (null);

  const [uploading, setUploading] = useState(false);
  const [favorites, setFavorites] = useState < any[] > ([]);
  const [watchlistItems, setWatchlistItems] = useState < any[] > ([]);

  useEffect(() => {
    if (authLoading) return; // don't redirect if still loading auth
    if (!isAuthenticated) {
      toast.error("Please login to view your profile");
      // store 'from' so we can return after login
      navigate("/login", { state: { from: "/profile" } });
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Get user's favorites (ids), then fetch details
  const {
    data: favoritesData,
    isLoading: favoritesLoading,
    refetch: refetchFavorites
  } = useQuery({
    queryKey: ["favorites"],
    queryFn: favoritesAPI.getAllFavorites,
    enabled: isAuthenticated
  });

  // Get user's watchlist (ids), then fetch details
  const {
    data: watchlist,
    isLoading: watchlistLoading,
    refetch: refetchWatchlist
  } = useQuery({
    queryKey: ["watchlist"],
    queryFn: watchlistAPI.getAllWatchlist,
    enabled: isAuthenticated
  });

  // once favorites/watchlist is goten, fetch the tmdb details
  useEffect(() => {
    const loadFavoritesDetails = async () => {
      if (!favoritesData?.data) return;
      const detailedFavorites = await Promise.all(
        favoritesData.data.map(async (fav: any) => {
          try {
            let details;
            if (fav.media_type === "movie") {
              details = await tmdbAPI.getMovieDetails(fav.media_id);
            } else if (fav.media_type === "tv") {
              details = await tmdbAPI.getTVShowDetails(fav.media_id);
            }
            return {
              ...fav,
              details,
              title: details?.title || details?.name || "Unknown",
              poster_path: details?.poster_path
            };
          } catch (error) {
            console.error("Error fetching favorite details:", error);
            return fav; // fallback
          }
        })
      );
      setFavorites(
        detailedFavorites.filter((item) => item.details) // only valid
      );
    };

    const loadWatchlistDetails = async () => {
      if (!watchlist?.data) return;
      const detailedWatchlist = await Promise.all(
        watchlist.data.map(async (wl: any) => {
          try {
            let details;
            if (wl.media_type === "movie") {
              details = await tmdbAPI.getMovieDetails(wl.media_id);
            } else if (wl.media_type === "tv") {
              details = await tmdbAPI.getTVShowDetails(wl.media_id);
            }
            return {
              ...wl,
              details,
              title: details?.title || details?.name || "Unknown",
              poster_path: details?.poster_path
            };
          } catch (error) {
            console.error("Error fetching watchlist details:", error);
            return wl; // fallback
          }
        })
      );
      setWatchlistItems(
        detailedWatchlist.filter((item) => item.details) // only valid
      );
    };

    loadFavoritesDetails();
    loadWatchlistDetails();
  }, [favoritesData, watchlist]);

  // Profile picture upload
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    // max 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    try {
      setUploading(true);
      await profileAPI.uploadProfilePicture(formData);
      toast.success("Profile picture updated successfully");
      setTimeout(() => {
        setUploading(false);
        // optional refresh
      }, 500);
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      toast.error("Failed to upload profile picture");
      setUploading(false);
    }
  };

  const handleRemoveProfilePic = async () => {
    try {
      await profileAPI.removeProfilePicture();
      toast.success("Profile picture removed");
      setTimeout(() => {
        // optional refresh

      }, 500);
    } catch (error) {
      console.error("Error removing profile picture:", error);
      toast.error("Failed to remove profile picture");
    }
  };

  // remove favs
  const handleRemoveFavorite = async (id: number) => {
    try {
      await favoritesAPI.removeFavorite(id);
      toast.success("Removed from favorites");
      refetchFavorites();
      setFavorites((prev) => prev.filter((f) => f.media_id !== id));
    } catch (error) {
      console.error("Error removing favorite:", error);
      toast.error("Failed to remove from favorites");
    }
  };

  // remove watchlist
  const handleRemoveFromWatchlist = async (id: number) => {
    try {
      await watchlistAPI.removeFromWatchlist(id);
      toast.success("Removed from watchlist");
      refetchWatchlist();
      setWatchlistItems((prev) => prev.filter((wl) => wl.media_id !== id));
    } catch (error) {
      console.error("Error removing from watchlist:", error);
      toast.error("Failed to remove from watchlist");
    }
  };

  // If still checking auth or not authenticated => spinner
  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoaderCircle className="animate-spin h-12 w-12 text-flicks-teal" />
      </div>
    );
  }

  // get user initials
  const userInitials = user?.username
    ? user.username.substring(0, 2).toUpperCase()
    : "U";

  return (
    <div className="container mx-auto py-24 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="text-3xl font-bold text-flicks-light">My Profile</h1>

        <Button
          variant="outline"
          onClick={() => navigate("/settings")}
          className="mt-4 md:mt-0 border-flicks-teal text-flicks-light hover:bg-flicks-teal/20"
        >
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: Profile Card + Stats */}
        <div className="md:col-span-1">
          <Card className="bg-flicks-dark border-flicks-teal/20">
            <CardHeader>
              <CardTitle className="text-flicks-light flex items-center">
                <UserRound className="h-5 w-5 mr-2 text-flicks-teal" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="relative mb-6">
                <Avatar className="w-32 h-32 border-4 border-flicks-teal">
                  <AvatarImage src={user?.profilePic} alt={userInitials} />
                  <AvatarFallback className="text-3xl bg-flicks-teal text-flicks-light">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>

                <Button
                  size="icon"
                  variant="outline"
                  className="absolute bottom-0 right-0 rounded-full bg-flicks-teal border-flicks-light"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </Button>

                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileUpload}
                  accept="image/*"
                />
              </div>

              <h2 className="text-xl font-semibold text-flicks-light mb-1">
                {user?.username}
              </h2>
              <p className="text-flicks-light/70 mb-4">{user?.email}</p>

              {user?.profilePic && (
                <Button
                  variant="ghost"
                  onClick={handleRemoveProfilePic}
                  className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                >
                  Remove Profile Picture
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="bg-flicks-dark border-flicks-teal/20 mt-6">
            <CardHeader>
              <CardTitle className="text-flicks-light">Account Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-flicks-light/70">Favorites</span>
                  <span className="text-flicks-light font-medium">
                    {/* show loading or actual count */}
                    {favoritesLoading ? "..." : favorites.length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-flicks-light/70">Watchlist</span>
                  <span className="text-flicks-light font-medium">
                    {watchlistLoading ? "..." : watchlistItems.length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-flicks-light/70">Reviews</span>
                  <span className="text-flicks-light font-medium">0</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Favorites + Watchlist tabs */}
        <div className="md:col-span-2">
          <Tabs defaultValue="favorites" className="space-y-6">
            <TabsList className="bg-flicks-dark border-b border-flicks-teal/30">
              <TabsTrigger
                value="favorites"
                className="text-flicks-light data-[state=active]:text-flicks-teal"
              >
                <Heart className="h-4 w-4 mr-2" />
                Favorites
              </TabsTrigger>
              <TabsTrigger
                value="watchlist"
                className="text-flicks-light data-[state=active]:text-flicks-teal"
              >
                <BookmarkPlus className="h-4 w-4 mr-2" />
                Watchlist
              </TabsTrigger>
            </TabsList>

            <TabsContent value="favorites">
              {favoritesLoading ? (
                <div className="flex justify-center p-12">
                  <LoaderCircle className="animate-spin h-10 w-10 text-flicks-teal" />
                </div>
              ) : favorites.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favorites.map((favorite: any) => (
                    <MovieCard
                      key={favorite.media_id}
                      id={favorite.media_id}
                      title={
                        favorite.details?.title ||
                        favorite.details?.name ||
                        "Unknown Title"
                      }
                      posterPath={favorite.details?.poster_path}
                      mediaType={favorite.media_type}
                      isFavorite={true}
                      onAddFavorite={() =>
                        handleRemoveFavorite(favorite.media_id)
                      }
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-flicks-light/70">
                  <Heart className="mx-auto h-16 w-16 mb-4 text-flicks-teal/50" />
                  <h3 className="text-xl font-medium">No favorites yet</h3>
                  <p className="mt-2">
                    Browse movies and TV shows to add to your favorites
                  </p>
                  <div className="mt-6 flex justify-center gap-4">
                    <Button
                      onClick={() => navigate("/movies")}
                      className="bg-flicks-teal hover:bg-flicks-sage"
                    >
                      Browse Movies
                    </Button>
                    <Button
                      onClick={() => navigate("/tv")}
                      variant="outline"
                      className="border-flicks-teal text-flicks-light hover:bg-flicks-teal/20"
                    >
                      Browse TV Shows
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="watchlist">
              {watchlistLoading ? (
                <div className="flex justify-center p-12">
                  <LoaderCircle className="animate-spin h-10 w-10 text-flicks-teal" />
                </div>
              ) : watchlistItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {watchlistItems.map((item: any) => (
                    <MovieCard
                      key={item.media_id}
                      id={item.media_id}
                      title={
                        item.details?.title ||
                        item.details?.name ||
                        "Unknown Title"
                      }
                      posterPath={item.details?.poster_path}
                      mediaType={item.media_type}
                      isInWatchlist={true}
                      onAddWatchlist={() =>
                        handleRemoveFromWatchlist(item.media_id)
                      }
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-flicks-light/70">
                  <BookmarkPlus className="mx-auto h-16 w-16 mb-4 text-flicks-teal/50" />
                  <h3 className="text-xl font-medium">Your watchlist is empty</h3>
                  <p className="mt-2">
                    Find movies and TV shows you want to watch later
                  </p>
                  <div className="mt-6 flex justify-center gap-4">
                    <Button
                      onClick={() => navigate("/movies")}
                      className="bg-flicks-teal hover:bg-flicks-sage"
                    >
                      Browse Movies
                    </Button>
                    <Button
                      onClick={() => navigate("/tv")}
                      variant="outline"
                      className="border-flicks-teal text-flicks-light hover:bg-flicks-teal/20"
                    >
                      Browse TV Shows
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
