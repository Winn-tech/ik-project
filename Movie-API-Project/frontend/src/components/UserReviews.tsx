
import React, { useState } from "react";
import { reviewsAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import ReviewForm from "./reviews/ReviewForm";
import ReviewCard from "./reviews/ReviewCard";

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
  reviewText?: string;
  Subject?: string;
  rating?: number;
  uploadedAt?: string;
  uploadedBy?: ReviewUser;
  likes?: ReviewUser[];
  dislikes?: ReviewUser[];
  reply?: ReviewComment[];
}

interface UserReviewsProps {
  mediaId: string;
  mediaType: string;
}

const UserReviews: React.FC<UserReviewsProps> = ({ mediaId, mediaType }) => {
  const { user } = useAuth();
  const [commentTexts, setCommentTexts] = useState<{ [key: string]: string }>({}); 
  const [showCommentForm, setShowCommentForm] = useState<{ [key: string]: boolean }>({});
  const [expandedComments, setExpandedComments] = useState<{ [key: string]: boolean }>({});

  const {
    data: reviewsResponse,
    refetch,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["allReviews"],
    queryFn: reviewsAPI.getAllReviews,
    staleTime: 0,
  });

  const mediaReviews = React.useMemo(() => {
    console.log("Reviews response:", reviewsResponse);
    
    if (!reviewsResponse) {
      console.log("reviewsResponse is null/undefined");
      return [];
    }

    // Handle the API response structure { success: true, data: [...] }
    let allReviews;
    if (reviewsResponse.success && reviewsResponse.data) {
      allReviews = reviewsResponse.data;
    } else if (Array.isArray(reviewsResponse)) {
      allReviews = reviewsResponse;
    } else {
      console.log("Unexpected response structure:", reviewsResponse);
      return [];
    }
    
    if (!Array.isArray(allReviews)) {
      console.log("allReviews is not an array:", typeof allReviews, allReviews);
      return [];
    }

    try {
      return allReviews.filter(
        (r: Review) => r && r.mediaId === mediaId && r.mediaType === mediaType
      );
    } catch (err) {
      console.error("Error filtering reviews:", err);
      return [];
    }
  }, [reviewsResponse, mediaId, mediaType]);

  const handleLikeReview = async (reviewId: string) => {
    if (!user) {
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
      toast.success("Review liked!", {
        style: {
          background: '#2D4A3E',
          border: '1px solid #4A7C59',
          color: '#F0F7F4',
        },
        closeButton: true,
      });
      refetch();
    } catch {
      toast.error("Error liking review", {
        style: {
          background: '#4A2D2D',
          border: '1px solid #7C4A4A',
          color: '#F7F0F0',
        },
        closeButton: true,
      });
    }
  };

  const handleDislikeReview = async (reviewId: string) => {
    if (!user) {
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
      toast.success("Review disliked!", {
        style: {
          background: '#2D4A3E',
          border: '1px solid #4A7C59',
          color: '#F0F7F4',
        },
        closeButton: true,
      });
      refetch();
    } catch {
      toast.error("Error disliking review", {
        style: {
          background: '#4A2D2D',
          border: '1px solid #7C4A4A',
          color: '#F7F0F0',
        },
        closeButton: true,
      });
    }
  };

  const handleSubmitComment = async (reviewId: string) => {
    if (!user) {
      toast.error("Please login to comment", {
        style: {
          background: '#4A2D2D',
          border: '1px solid #7C4A4A',
          color: '#F7F0F0',
        },
        closeButton: true,
      });
      return;
    }

    const commentText = commentTexts[reviewId]?.trim();
    if (!commentText) {
      toast.error("Please enter a comment", {
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
      await reviewsAPI.addReplyToReview(reviewId, commentText);
      toast.success("Comment added!", {
        style: {
          background: '#2D4A3E',
          border: '1px solid #4A7C59',
          color: '#F0F7F4',
        },
        closeButton: true,
      });
      setCommentTexts(prev => ({ ...prev, [reviewId]: "" }));
      setShowCommentForm(prev => ({ ...prev, [reviewId]: false }));
      refetch();
    } catch {
      toast.error("Failed to add comment", {
        style: {
          background: '#4A2D2D',
          border: '1px solid #7C4A4A',
          color: '#F7F0F0',
        },
        closeButton: true,
      });
    }
  };

  const handleLikeComment = async (reviewId: string, commentId: string) => {
    if (!user) {
      toast.error("Please login to like comments", {
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
      await reviewsAPI.likeReply(reviewId, commentId);
      toast.success("Comment liked!", {
        style: {
          background: '#2D4A3E',
          border: '1px solid #4A7C59',
          color: '#F0F7F4',
        },
        closeButton: true,
      });
      refetch();
    } catch {
      toast.error("Error liking comment", {
        style: {
          background: '#4A2D2D',
          border: '1px solid #7C4A4A',
          color: '#F7F0F0',
        },
        closeButton: true,
      });
    }
  };

  const handleDislikeComment = async (reviewId: string, commentId: string) => {
    if (!user) {
      toast.error("Please login to dislike comments", {
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
      await reviewsAPI.dislikeReply(reviewId, commentId);
      toast.success("Comment disliked!", {
        style: {
          background: '#2D4A3E',
          border: '1px solid #4A7C59',
          color: '#F0F7F4',
        },
        closeButton: true,
      });
      refetch();
    } catch {
      toast.error("Error disliking comment", {
        style: {
          background: '#4A2D2D',
          border: '1px solid #7C4A4A',
          color: '#F7F0F0',
        },
        closeButton: true,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8 text-flicks-light/70">
        <p>Loading reviews...</p>
      </div>
    );
  }

  if (error) {
    console.error("Error loading reviews:", error);
    return (
      <div className="text-center py-8 text-flicks-light/70">
        <p>Error loading reviews. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ReviewForm
        mediaId={mediaId}
        mediaType={mediaType}
        onReviewSubmitted={refetch}
      />

      {!Array.isArray(mediaReviews) || mediaReviews.length === 0 ? (
        <div className="text-center py-8 text-flicks-light/70">
          <p className="text-xl">No reviews yet</p>
          <p>Be the first to write a review!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mediaReviews.map((review) => (
            <ReviewCard
              key={review._id}
              review={review}
              user={user}
              commentText={commentTexts[review._id] || ""}
              showCommentForm={showCommentForm[review._id] || false}
              isCommentsExpanded={expandedComments[review._id] || false}
              onLikeReview={handleLikeReview}
              onDislikeReview={handleDislikeReview}
              onToggleCommentForm={(reviewId) => setShowCommentForm(prev => ({ ...prev, [reviewId]: !prev[reviewId] }))}
              onToggleCommentsExpanded={(reviewId) => setExpandedComments(prev => ({ ...prev, [reviewId]: !prev[reviewId] }))}
              onCommentTextChange={(reviewId, text) => setCommentTexts(prev => ({ ...prev, [reviewId]: text }))}
              onSubmitComment={handleSubmitComment}
              onLikeComment={handleLikeComment}
              onDislikeComment={handleDislikeComment}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default UserReviews;
