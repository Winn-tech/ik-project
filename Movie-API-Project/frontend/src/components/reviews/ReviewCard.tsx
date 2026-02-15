import React from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ThumbsUp, ThumbsDown, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import CommentSection from "./CommentSection";
import CommentForm from "./CommentForm";

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

interface ReviewCardProps {
  review: Review;
  user: any;
  commentText: string;
  showCommentForm: boolean;
  isCommentsExpanded: boolean;
  onLikeReview: (reviewId: string) => void;
  onDislikeReview: (reviewId: string) => void;
  onToggleCommentForm: (reviewId: string) => void;
  onToggleCommentsExpanded: (reviewId: string) => void;
  onCommentTextChange: (reviewId: string, text: string) => void;
  onSubmitComment: (reviewId: string) => void;
  onLikeComment: (reviewId: string, commentId: string) => void;
  onDislikeComment: (reviewId: string, commentId: string) => void;
}

const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  user,
  commentText,
  showCommentForm,
  isCommentsExpanded,
  onLikeReview,
  onDislikeReview,
  onToggleCommentForm,
  onToggleCommentsExpanded,
  onCommentTextChange,
  onSubmitComment,
  onLikeComment,
  onDislikeComment,
}) => {
  if (!review || !review._id) return null;

  const userName = review.uploadedBy?.username || "Unknown";
  const userPic = review.uploadedBy?.profilePic || "";
  const dateStr = review.uploadedAt
    ? format(new Date(review.uploadedAt), "MMMM d, yyyy")
    : "";
  const likesArr = Array.isArray(review.likes) ? review.likes : [];
  const dislikesArr = Array.isArray(review.dislikes) ? review.dislikes : [];
  const hasLiked = user && likesArr.some(like => like._id === user.id);
  const hasDisliked = user && dislikesArr.some(dislike => dislike._id === user.id);
  const comments = Array.isArray(review.reply) ? review.reply : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-flicks-dark/30 border border-flicks-teal/20 p-4 rounded-md flex flex-col"
    >
      <div className="flex items-center gap-3 mb-2">
        <Avatar>
          <AvatarImage src={userPic} />
          <AvatarFallback className="bg-flicks-teal text-flicks-light">
            {userName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="text-sm text-flicks-light">{userName}</div>
        <span className="ml-auto text-flicks-light/70 text-xs">
          {dateStr}
        </span>
      </div>
      <h4 className="text-base text-flicks-light font-semibold mb-1">
        {review.Subject || "No Subject"}
      </h4>
      <p className="text-sm text-flicks-light/90 mb-3">
        {review.reviewText}
      </p>
      <div className="flex items-center justify-between text-xs text-flicks-light/80 mb-3">
        <span>Rating: {review.rating}/10</span>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className={`flex items-center gap-1 transition-colors ${
              hasLiked ? "text-flicks-teal hover:text-flicks-sage" : "text-flicks-light/70 hover:text-flicks-light"
            }`}
            onClick={() => onLikeReview(review._id)}
          >
            <ThumbsUp
              className="h-4 w-4"
              fill={hasLiked ? "#387478" : "none"}
            />
            <span>{likesArr.length}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`flex items-center gap-1 transition-colors ${
              hasDisliked ? "text-flicks-teal hover:text-flicks-sage" : "text-flicks-light/70 hover:text-flicks-light"
            }`}
            onClick={() => onDislikeReview(review._id)}
          >
            <ThumbsDown
              className="h-4 w-4"
              fill={hasDisliked ? "#387478" : "none"}
            />
            <span>{dislikesArr.length}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1 text-flicks-light/70 hover:text-flicks-light transition-colors"
            onClick={() => onToggleCommentForm(review._id)}
          >
            <MessageCircle className="h-4 w-4" />
            <span>{comments.length}</span>
          </Button>
        </div>
      </div>

      <CommentSection
        comments={comments}
        reviewId={review._id}
        user={user}
        isExpanded={isCommentsExpanded}
        onToggleExpanded={onToggleCommentsExpanded}
        onLikeComment={onLikeComment}
        onDislikeComment={onDislikeComment}
      />

      {showCommentForm && (
        <CommentForm
          reviewId={review._id}
          commentText={commentText}
          onCommentTextChange={onCommentTextChange}
          onSubmitComment={onSubmitComment}
        />
      )}
    </motion.div>
  );
};

export default ReviewCard;