// /* eslint-disable @typescript-eslint/no-explicit-any */

// import React, { useEffect, useState } from "react";
// import { reviewsAPI, tmdbAPI } from "@/lib/api";
// import ReviewsCarousel from "@/components/ReviewsCarousel";
// import { useAuth } from "@/contexts/AuthContext";
// import { toast } from "sonner";
// import { LoaderCircle } from "lucide-react";

// interface ReviewUser {
//   _id: string;
//   username: string;
//   profilePic?: string;
// }

// interface ReviewComment {
//   _id: string;
//   replyText: string;
//   uploadedBy: ReviewUser;
//   uploadedAt: string;
//   likes?: ReviewUser[];
//   dislikes?: ReviewUser[];
// }

// interface Review {
//   _id: string;
//   mediaId: string;
//   mediaType: string;
//   rating: number;
//   reviewText?: string;
//   Subject?: string;
//   uploadedBy?: ReviewUser;
//   uploadedAt?: string;
//   likes?: ReviewUser[];
//   dislikes?: ReviewUser[];
//   reply?: ReviewComment[];
//   movieTitle?: string;
//   moviePoster?: string;
// }

// export default function AllReviews() {
//   const { user } = useAuth();
//   const [reviews, setReviews] = useState < Review[] > ([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const response = await reviewsAPI.getAllReviews();

//         // Handle the API response structure { success: true, data: [...] }
//         let allReviews: Review[] = [];
//         if (response.success && Array.isArray(response.data)) {
//           allReviews = response.data;
//         } else if (Array.isArray(response)) {
//           allReviews = response;
//         } else {
//           console.error("Unexpected API response structure:", response);
//           setError("Invalid response format");
//           return;
//         }

//         const augmented = await Promise.all(
//           allReviews.map(async (rev: Review) => {
//             // Ensure likes/dislikes are arrays
//             rev.likes = Array.isArray(rev.likes) ? rev.likes : [];
//             rev.dislikes = Array.isArray(rev.dislikes) ? rev.dislikes : [];
//             rev.reply = Array.isArray(rev.reply) ? rev.reply : [];

//             // 1) TMDB details
//             if (rev.mediaType === "movie") {
//               try {
//                 const details = await tmdbAPI.getMovieDetails(Number(rev.mediaId));
//                 rev.movieTitle = details?.title || "Untitled";
//                 rev.moviePoster = details?.poster_path
//                   ? "https://image.tmdb.org/t/p/w500" + details.poster_path
//                   : "";
//               } catch {
//                 rev.movieTitle = "Untitled";
//                 rev.moviePoster = "";
//               }
//             } else {
//               try {
//                 const details = await tmdbAPI.getTVShowDetails(Number(rev.mediaId));
//                 rev.movieTitle = details?.name || "Untitled";
//                 rev.moviePoster = details?.poster_path
//                   ? "https://image.tmdb.org/t/p/w500" + details.poster_path
//                   : "";
//               } catch {
//                 rev.movieTitle = "Untitled";
//                 rev.moviePoster = "";
//               }
//             }

//             return rev;
//           })
//         );

//         setReviews(augmented);
//       } catch (err: any) {
//         console.error("Error fetching reviews:", err);
//         setError(err.message || "Error fetching reviews");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, [user]);

//   // Like
//   const handleLike = async (reviewId: string) => {
//     if (!user) {
//       console.error("Please login to like reviews");
//       toast.error("Please login to like reviews", {
//         style: {
//           background: '#4A2D2D',
//           border: '1px solid #7C4A4A',
//           color: '#F7F0F0',
//         },
//         closeButton: true,
//       });
//       return;
//     }
//     try {
//       await reviewsAPI.likeReview(reviewId);
//       setReviews((prev) =>
//         prev.map((r) => {
//           if (r._id !== reviewId) return r;
//           const likesArray = Array.isArray(r.likes) ? r.likes : [];
//           const dislikesArray = Array.isArray(r.dislikes) ? r.dislikes : [];
//           const hasLiked = likesArray.some(like => like._id === user.id);
//           const hasDisliked = dislikesArray.some(dislike => dislike._id === user.id);

//           if (hasLiked) {
//             r.likes = likesArray.filter((like) => like._id !== user.id);
//           } else {
//             r.likes = [...likesArray, { _id: user.id, username: user.username || "Unknown" }];
//             if (hasDisliked) {
//               r.dislikes = dislikesArray.filter((dislike) => dislike._id !== user.id);
//             }
//           }
//           return { ...r };
//         })
//       );
//     } catch (err) {
//       console.error("Like error:", err);
//     }
//   };

//   // Dislike
//   const handleDislike = async (reviewId: string) => {
//     if (!user) {
//       console.error("Please login to dislike reviews");
//       toast.error("Please login to dislike reviews", {
//         style: {
//           background: '#4A2D2D',
//           border: '1px solid #7C4A4A',
//           color: '#F7F0F0',
//         },
//         closeButton: true,
//       });
//       return;
//     }
//     try {
//       await reviewsAPI.dislikeReview(reviewId);
//       setReviews((prev) =>
//         prev.map((r) => {
//           if (r._id !== reviewId) return r;
//           const likesArray = Array.isArray(r.likes) ? r.likes : [];
//           const dislikesArray = Array.isArray(r.dislikes) ? r.dislikes : [];
//           const hasDisliked = dislikesArray.some(dislike => dislike._id === user.id);
//           const hasLiked = likesArray.some(like => like._id === user.id);

//           if (hasDisliked) {
//             r.dislikes = dislikesArray.filter((dislike) => dislike._id !== user.id);
//           } else {
//             r.dislikes = [...dislikesArray, { _id: user.id, username: user.username || "Unknown" }];
//             if (hasLiked) {
//               r.likes = likesArray.filter((like) => like._id !== user.id);
//             }
//           }
//           return { ...r };
//         })
//       );
//     } catch (err) {
//       console.error("Dislike error:", err);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-screen">
//         <LoaderCircle className="h-8 w-8 text-flicks-teal animate-spin" />
//       </div>
//     );
//   }

//   if (error) {
//     return <div className="text-red-500">Failed to load reviews: {error}</div>;
//   }

//   if (!reviews.length) {
//     return <div className="p-8 text-flicks-light/80">No reviews yet.</div>;
//   }

//   return (
//     <div className="py-8">
//       <h2 className="text-xl mb-4 text-flicks-light">User Reviews</h2>
//       <ReviewsCarousel
//         reviews={reviews}
//         onLike={handleLike}
//         onDislike={handleDislike}
//       />
//     </div>
//   );
// }


/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useState } from "react";
import { reviewsAPI, tmdbAPI } from "@/lib/api";
import ReviewsCarousel from "@/components/ReviewsCarousel";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { LoaderCircle, Star } from "lucide-react";

interface ReviewUser {
  _id: string;
  username: string;
  profilePic?: string;
}

interface ReviewComment {
  _id: string;
  replyText: string;
  uploadedBy: ReviewUser;
  uploadedAt: string;
  likes?: ReviewUser[];
  dislikes?: ReviewUser[];
}

interface Review {
  _id: string;
  mediaId: string;
  mediaType: string;
  rating: number;
  reviewText?: string;
  Subject?: string;
  uploadedBy?: ReviewUser;
  uploadedAt?: string;
  likes?: ReviewUser[];
  dislikes?: ReviewUser[];
  reply?: ReviewComment[];
  movieTitle?: string;
  moviePoster?: string;
}

export default function AllReviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await reviewsAPI.getAllReviews();

        // Handle the API response structure { success: true, data: [...] }
        let allReviews: Review[] = [];
        if (response.success && Array.isArray(response.data)) {
          allReviews = response.data;
        } else if (Array.isArray(response)) {
          allReviews = response;
        } else {
          console.error("Unexpected API response structure:", response);
          setError("Invalid response format");
          return;
        }

        const augmented = await Promise.all(
          allReviews.map(async (rev: Review) => {
            // Ensure likes/dislikes are arrays
            rev.likes = Array.isArray(rev.likes) ? rev.likes : [];
            rev.dislikes = Array.isArray(rev.dislikes) ? rev.dislikes : [];
            rev.reply = Array.isArray(rev.reply) ? rev.reply : [];

            // 1) TMDB details
            if (rev.mediaType === "movie") {
              try {
                const details = await tmdbAPI.getMovieDetails(Number(rev.mediaId));
                rev.movieTitle = details?.title || "Untitled";
                rev.moviePoster = details?.poster_path
                  ? "https://image.tmdb.org/t/p/w500" + details.poster_path
                  : "";
              } catch {
                rev.movieTitle = "Untitled";
                rev.moviePoster = "";
              }
            } else {
              try {
                const details = await tmdbAPI.getTVShowDetails(Number(rev.mediaId));
                rev.movieTitle = details?.name || "Untitled";
                rev.moviePoster = details?.poster_path
                  ? "https://image.tmdb.org/t/p/w500" + details.poster_path
                  : "";
              } catch {
                rev.movieTitle = "Untitled";
                rev.moviePoster = "";
              }
            }

            return rev;
          })
        );

        setReviews(augmented);
      } catch (err: any) {
        console.error("Error fetching reviews:", err);
        setError(err.message || "Error fetching reviews");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // Like
  const handleLike = async (reviewId: string) => {
    if (!user) {
      console.error("Please login to like reviews");
      toast.error("Please login to like reviews", {
        style: {
          background: '#4A2D2D',
          border: '1px solid #7C4A4A',
          color: '#F7F0F0',
        },
        closeButton: true,
      });
      return;
    }
    try {
      await reviewsAPI.likeReview(reviewId);
      setReviews((prev) =>
        prev.map((r) => {
          if (r._id !== reviewId) return r;
          const likesArray = Array.isArray(r.likes) ? r.likes : [];
          const dislikesArray = Array.isArray(r.dislikes) ? r.dislikes : [];
          const hasLiked = likesArray.some(like => like._id === user.id);
          const hasDisliked = dislikesArray.some(dislike => dislike._id === user.id);

          if (hasLiked) {
            r.likes = likesArray.filter((like) => like._id !== user.id);
          } else {
            r.likes = [...likesArray, { _id: user.id, username: user.username || "Unknown" }];
            if (hasDisliked) {
              r.dislikes = dislikesArray.filter((dislike) => dislike._id !== user.id);
            }
          }
          return { ...r };
        })
      );
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  // Dislike
  const handleDislike = async (reviewId: string) => {
    if (!user) {
      console.error("Please login to dislike reviews");
      toast.error("Please login to dislike reviews", {
        style: {
          background: '#4A2D2D',
          border: '1px solid #7C4A4A',
          color: '#F7F0F0',
        },
        closeButton: true,
      });
      return;
    }
    try {
      await reviewsAPI.dislikeReview(reviewId);
      setReviews((prev) =>
        prev.map((r) => {
          if (r._id !== reviewId) return r;
          const likesArray = Array.isArray(r.likes) ? r.likes : [];
          const dislikesArray = Array.isArray(r.dislikes) ? r.dislikes : [];
          const hasDisliked = dislikesArray.some(dislike => dislike._id === user.id);
          const hasLiked = likesArray.some(like => like._id === user.id);

          if (hasDisliked) {
            r.dislikes = dislikesArray.filter((dislike) => dislike._id !== user.id);
          } else {
            r.dislikes = [...dislikesArray, { _id: user.id, username: user.username || "Unknown" }];
            if (hasLiked) {
              r.likes = likesArray.filter((like) => like._id !== user.id);
            }
          }
          return { ...r };
        })
      );
    } catch (err) {
      console.error("Dislike error:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-flicks-dark">
        <div className="flex flex-col items-center gap-4">
          <LoaderCircle className="h-10 w-10 text-flicks-teal animate-spin" />
          <p className="text-flicks-light/70 text-sm">Loading reviews...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-flicks-dark px-4">
        <div className="text-center">
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 max-w-md">
            <h3 className="text-red-400 font-semibold mb-2">Error Loading Reviews</h3>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!reviews.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-flicks-dark px-4">
        <div className="text-center max-w-md">
          <div className="bg-flicks-light/5 border border-flicks-light/10 rounded-lg p-8">
            <Star className="h-12 w-12 text-flicks-light/30 mx-auto mb-4" />
            <h3 className="text-flicks-light font-semibold text-lg mb-2">No Reviews Yet</h3>
            <p className="text-flicks-light/60 text-sm">
              Be the first to share your thoughts on movies and shows!
            </p>
          </div>
        </div>
      </div>
    );
  }

  const totalReviews = reviews.length;
  const averageRating = reviews.reduce((acc, review) => acc + (review.rating || 0), 0) / totalReviews;

  return (
    <div className="min-h-screen bg-flicks-dark">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-flicks-dark via-flicks-dark/95 to-flicks-dark border-b border-flicks-light/10">
        <div className="mx-auto pb-8">
          <div className="text-left sm:text-left">
            <h2 className="text-2xl sm:text-3xl font-bold text-flicks-light mb-2">
              Community Reviews
            </h2>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-flicks-light/70">
              <span className="text-sm">
                {totalReviews} review{totalReviews !== 1 ? 's' : ''}
              </span>
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={
                        i < Math.round(averageRating / 2)
                          ? "h-4 w-4 fill-yellow-400 text-yellow-400"
                          : "h-4 w-4 text-gray-600"
                      }
                    />
                  ))}
                </div>
                <span className="text-sm">
                  {averageRating.toFixed(1)}/10 average
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Content */}
      <div className="max-auto mx-auto py-8">
        <ReviewsCarousel
          reviews={reviews}
          onLike={handleLike}
          onDislike={handleDislike}
        />
      </div>
    </div>
  );
}