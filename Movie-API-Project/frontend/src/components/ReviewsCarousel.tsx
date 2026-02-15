
// import React, { useRef } from "react";
// import { Link } from "react-router-dom";
// import Slider from "react-slick";
// import { Card, CardContent, CardHeader } from "@/components/ui/card";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { Button } from "@/components/ui/button";
// import { ThumbsDown, ThumbsUp, Star, MessageCircle } from "lucide-react";
// import { formatDistanceToNow } from "date-fns";
// import { useAuth } from "@/contexts/AuthContext";
// import { ArrowLeft, ArrowRight } from "lucide-react";
// import "slick-carousel/slick/slick.css";
// import "slick-carousel/slick/slick-theme.css";

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
//   movieTitle?: string;
//   moviePoster?: string;
//   Subject?: string;
//   reviewText?: string;
//   rating?: number;
//   likes?: ReviewUser[];
//   dislikes?: ReviewUser[];
//   reply?: ReviewComment[];
//   uploadedAt?: string;
//   uploadedBy?: ReviewUser;
// }

// interface Props {
//   reviews: Review[];
//   onLike: (id: string) => void;
//   onDislike: (id: string) => void;
// }

// const ReviewsCarousel: React.FC<Props> = ({ reviews, onLike, onDislike }) => {
//   const { user } = useAuth();
//   const sliderRef = useRef < Slider | null > (null);

//   const settings = {
//     slidesToShow: 4,
//     slidesToScroll: 1,
//     infinite: true,
//     speed: 500,
//     autoplay: false,
//     autoplaySpeed: 4000,
//     dots: false,
//     arrows: false,
//     responsive: [
//       {
//         breakpoint: 1024,
//         settings: { slidesToShow: 3 },
//       },
//       {
//         breakpoint: 768,
//         settings: { slidesToShow: 2 },
//       },
//       {
//         breakpoint: 480,
//         settings: { slidesToShow: 1 },
//       },
//     ],
//   };

//   const formatTime = (dateStr?: string) => {
//     if (!dateStr) return "N/A";
//     const d = new Date(dateStr);
//     if (isNaN(d.getTime())) return "N/A";
//     return formatDistanceToNow(d, { addSuffix: true });
//   };

//   if (!reviews.length) return null;

//   return (
//     <div className="relative">
//       <Slider ref={sliderRef} {...settings}>
//         {reviews.map((r) => {
//           const likesArray = Array.isArray(r.likes) ? r.likes : [];
//           const dislikesArray = Array.isArray(r.dislikes) ? r.dislikes : [];
//           const commentsArray = Array.isArray(r.reply) ? r.reply : [];
//           const userHasLiked = user && likesArray.some(like => like._id === user.id);
//           const userHasDisliked = user && dislikesArray.some(dislike => dislike._id === user.id);
//           const stars = Math.round((r.rating || 0) / 2);
//           const timeAgo = formatTime(r.uploadedAt);
//           const mediaTitle = r.movieTitle || `Media ${r.mediaId}`;

//           return (
//             <div key={r._id} className="pr-2 mb-8">
//               <Link to={`/${r.mediaType}/${r.mediaId}`} className="block">
//                 <Card className="bg-flicks-dark border-flicks-teal/20 hover:border-flicks-teal/50 transition-colors">
//                   {r.moviePoster ? (
//                     <img
//                       src={r.moviePoster}
//                       alt="Poster"
//                       className="w-full h-40 object-cover rounded-t-lg"
//                     />
//                   ) : (
//                     <div className="w-full h-40 bg-flicks-light/10 flex items-center justify-center rounded-t-lg">
//                       <span className="text-flicks-light/50">No Poster</span>
//                     </div>
//                   )}

//                   <CardHeader className="pb-2 pt-2">
//                     <Link to={`/${r.mediaType}/${r.mediaId}`}>
//                       <h4 className="text-flicks-light font-medium mb-1 hover:text-flicks-teal transition-colors">
//                         {mediaTitle}
//                       </h4>
//                     </Link>
//                     <div className="flex items-center mb-1">
//                       {[...Array(5)].map((_, i) => (
//                         <Star
//                           key={i}
//                           className={
//                             i < stars
//                               ? "h-4 w-4 fill-yellow-400 text-yellow-400"
//                               : "h-4 w-4 text-gray-400"
//                           }
//                         />
//                       ))}
//                       <span className="ml-2 text-sm text-flicks-light/70">
//                         {r.rating || 0}/10
//                       </span>
//                     </div>
//                     <p className="text-sm text-flicks-light/60">{timeAgo}</p>
//                   </CardHeader>

//                   <CardContent className="pt-0">
//                     <div className="flex items-center gap-3 mb-2">
//                       <Avatar>
//                         <AvatarImage src={r.uploadedBy?.profilePic} />
//                         <AvatarFallback className="bg-flicks-teal text-flicks-light">
//                           {(r.uploadedBy?.username || "Unknown")
//                             .slice(0, 2).toUpperCase()}
//                         </AvatarFallback>
//                       </Avatar>
//                       <div className="text-sm text-flicks-light">
//                         {r.uploadedBy?.username || "Unknown User"}
//                       </div>
//                     </div>

//                     <h3 className="text-base text-flicks-light font-semibold mb-1">
//                       {r.Subject || "No Subject"}
//                     </h3>
//                     <p className="text-sm text-flicks-light/90 mb-3 line-clamp-3">
//                       {r.reviewText || ""}
//                     </p>

//                     <div className="flex gap-2">
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={(e) => {
//                           e.preventDefault();
//                           e.stopPropagation();
//                           onLike(r._id);
//                         }}
//                         className={
//                           userHasLiked ? "text-flicks-teal" : "text-flicks-light/70"
//                         }
//                       >
//                         <ThumbsUp
//                           className={`h-4 w-4 ${userHasLiked ? "fill-flicks-teal" : ""}`}
//                         />
//                         <span className="ml-1">{likesArray.length}</span>
//                       </Button>
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={(e) => {
//                           e.preventDefault();
//                           e.stopPropagation();
//                           onDislike(r._id);
//                         }}
//                         className={
//                           userHasDisliked
//                             ? "text-flicks-teal"
//                             : "text-flicks-light/70"
//                         }
//                       >
//                         <ThumbsDown
//                           className={`h-4 w-4 ${userHasDisliked ? "fill-flicks-teal" : ""}`}
//                         />
//                         <span className="ml-1">{dislikesArray.length}</span>
//                       </Button>
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         className="text-flicks-light/70"
//                         onClick={(e) => {
//                           e.preventDefault();
//                           e.stopPropagation();
//                         }}
//                       >
//                         <Link to={`/${r.mediaType}/${r.mediaId}`} className="flex items-center">
//                           <MessageCircle className="h-4 w-4" />
//                           <span className="ml-1">{commentsArray.length}</span>
//                         </Link>
//                       </Button>
//                     </div>
//                   </CardContent>
//                 </Card>
//               </Link>
//             </div>
//           );
//         })}
//       </Slider>

//       {reviews.length > 4 && (
//         <div className="absolute bottom-[0.5rem] right-0 flex space-x-4">
//           <Button
//             variant="outline"
//             size="icon"
//             className="rounded-full border-flicks-teal/50 text-flicks-light hover:bg-flicks-teal/20"
//             onClick={() => sliderRef.current?.slickPrev()}
//           >
//             <ArrowLeft className="h-5 w-5" />
//           </Button>
//           <Button
//             variant="outline"
//             size="icon"
//             className="rounded-full border-flicks-teal/50 text-flicks-light hover:bg-flicks-teal/20"
//             onClick={() => sliderRef.current?.slickNext()}
//           >
//             <ArrowRight className="h-5 w-5" />
//           </Button>
//         </div>
//       )}
//     </div>
//   );
// };

// export default ReviewsCarousel;


import React, { useRef } from "react";
import { Link } from "react-router-dom";
import Slider from "react-slick";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThumbsDown, ThumbsUp, Star, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, ArrowRight } from "lucide-react";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

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
  movieTitle?: string;
  moviePoster?: string;
  Subject?: string;
  reviewText?: string;
  rating?: number;
  likes?: ReviewUser[];
  dislikes?: ReviewUser[];
  reply?: ReviewComment[];
  uploadedAt?: string;
  uploadedBy?: ReviewUser;
}

interface Props {
  reviews: Review[];
  onLike: (id: string) => void;
  onDislike: (id: string) => void;
}

const ReviewsCarousel: React.FC<Props> = ({ reviews, onLike, onDislike }) => {
  const { user } = useAuth();
  const sliderRef = useRef<Slider | null>(null);

  const settings = {
    slidesToShow: 4,
    slidesToScroll: 1,
    infinite: true,
    speed: 500,
    autoplay: true,
    autoplaySpeed: 4000,
    dots: false,
    arrows: false,
    responsive: [
      {
        breakpoint: 1200,
        settings: { slidesToShow: 3 },
      },
      {
        breakpoint: 768,
        settings: { slidesToShow: 2 },
      },
      {
        breakpoint: 640,
        settings: { slidesToShow: 1 },
      },
    ],
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "N/A";
    return formatDistanceToNow(d, { addSuffix: true });
  };

  if (!reviews.length) return null;

  return (
    <div className="relative">
      <Slider ref={sliderRef} {...settings}>
        {reviews.map((r) => {
          const likesArray = Array.isArray(r.likes) ? r.likes : [];
          const dislikesArray = Array.isArray(r.dislikes) ? r.dislikes : [];
          const commentsArray = Array.isArray(r.reply) ? r.reply : [];
          const userHasLiked = user && likesArray.some(like => like._id === user.id);
          const userHasDisliked = user && dislikesArray.some(dislike => dislike._id === user.id);
          const stars = Math.round((r.rating || 0) / 2);
          const timeAgo = formatTime(r.uploadedAt);
          const mediaTitle = r.movieTitle || `Media ${r.mediaId}`;

          return (
            <div key={r._id} className="px-2">
              <Card className="bg-flicks-dark border-flicks-teal/20 hover:border-flicks-teal/50 transition-all duration-300 hover:shadow-lg hover:shadow-flicks-teal/10 h-full flex flex-col">
                {/* Poster Section - Fixed Height */}
                <div className="relative overflow-hidden rounded-t-lg">
                  {r.moviePoster ? (
                    <img
                      src={r.moviePoster}
                      alt={`${mediaTitle} poster`}
                      className="w-full h-48 sm:h-56 object-cover transition-transform duration-300 hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-48 sm:h-56 bg-gradient-to-br from-flicks-light/10 to-flicks-light/5 flex items-center justify-center">
                      <span className="text-flicks-light/40 text-sm">No Poster</span>
                    </div>
                  )}
                  
                  {/* Rating Overlay */}
                  <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs text-white font-medium">
                      {(r.rating || 0) / 10}
                    </span>
                  </div>
                </div>

                {/* Content Section - Flexible Height */}
                <div className="flex flex-col flex-1">
                  <CardHeader className="pb-3 pt-4 px-4">
                    {/* Movie Title */}
                    <Link to={`/${r.mediaType}/${r.mediaId}`} className="block">
                      <h4 className="text-flicks-light font-semibold text-base sm:text-lg mb-2 hover:text-flicks-teal transition-colors line-clamp-2 leading-tight">
                        {mediaTitle}
                      </h4>
                    </Link>

                    {/* Star Rating */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={
                              i < stars
                                ? "h-4 w-4 fill-yellow-400 text-yellow-400"
                                : "h-4 w-4 text-gray-600"
                            }
                          />
                        ))}
                      </div>
                      <span className="text-sm text-flicks-light/70 font-medium">
                        {r.rating || 0}/10
                      </span>
                    </div>

                    {/* User Info */}
                    <div className="flex items-center gap-2 mb-3">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={r.uploadedBy?.profilePic} />
                        <AvatarFallback className="bg-flicks-teal text-flicks-light text-xs">
                          {(r.uploadedBy?.username || "U")
                            .slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-sm text-flicks-light/90 font-medium truncate">
                          {r.uploadedBy?.username || "Unknown User"}
                        </span>
                        <span className="text-xs text-flicks-light/60">
                          {timeAgo}
                        </span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0 px-4 pb-4 flex-1 flex flex-col">
                    {/* Review Subject */}
                    {r.Subject && (
                      <h5 className="text-sm font-semibold text-flicks-light mb-2 line-clamp-1">
                        {r.Subject}
                      </h5>
                    )}

                    {/* Review Text */}
                    <p className="text-sm text-flicks-light/80 mb-4 line-clamp-3 flex-1 leading-relaxed">
                      {r.reviewText || "No review text provided."}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-flicks-light/10">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onLike(r._id);
                          }}
                          className={`h-8 px-2 hover:bg-flicks-teal/20 ${
                            userHasLiked ? "text-flicks-teal" : "text-flicks-light/60"
                          }`}
                        >
                          <ThumbsUp
                            className={`h-4 w-4 ${userHasLiked ? "fill-flicks-teal" : ""}`}
                          />
                          <span className="ml-1 text-xs">{likesArray.length}</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onDislike(r._id);
                          }}
                          className={`h-8 px-2 hover:bg-flicks-teal/20 ${
                            userHasDisliked ? "text-flicks-teal" : "text-flicks-light/60"
                          }`}
                        >
                          <ThumbsDown
                            className={`h-4 w-4 ${userHasDisliked ? "fill-flicks-teal" : ""}`}
                          />
                          <span className="ml-1 text-xs">{dislikesArray.length}</span>
                        </Button>
                      </div>

                      <Link to={`/${r.mediaType}/${r.mediaId}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-flicks-light/60 hover:text-flicks-teal hover:bg-flicks-teal/20"
                        >
                          <MessageCircle className="h-4 w-4" />
                          <span className="ml-1 text-xs">{commentsArray.length}</span>
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </div>
              </Card>
            </div>
          );
        })}
      </Slider>

      {/* Navigation Arrows */}
      {reviews.length > 1 && (
        <div className="flex justify-center gap-2 mt-6 sm:absolute sm:bottom-[-20px] sm:right-4 sm:mt-0">
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-9 rounded-full border-flicks-teal/40 bg-flicks-dark/80 backdrop-blur-sm text-flicks-light hover:bg-flicks-teal/20 hover:border-flicks-teal transition-all"
            onClick={() => sliderRef.current?.slickPrev()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-9 rounded-full border-flicks-teal/40 bg-flicks-dark/80 backdrop-blur-sm text-flicks-light hover:bg-flicks-teal/20 hover:border-flicks-teal transition-all"
            onClick={() => sliderRef.current?.slickNext()}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ReviewsCarousel;