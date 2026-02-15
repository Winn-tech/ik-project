
import React from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ThumbsUp, ThumbsDown, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format } from "date-fns";

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

interface CommentSectionProps {
  comments: ReviewComment[];
  reviewId: string;
  user: any;
  isExpanded: boolean;
  onToggleExpanded: (reviewId: string) => void;
  onLikeComment: (reviewId: string, commentId: string) => void;
  onDislikeComment: (reviewId: string, commentId: string) => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({
  comments,
  reviewId,
  user,
  isExpanded,
  onToggleExpanded,
  onLikeComment,
  onDislikeComment,
}) => {
  if (comments.length === 0) return null;

  return (
    <Collapsible 
      open={isExpanded} 
      onOpenChange={() => onToggleExpanded(reviewId)}
    >
      <CollapsibleTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center gap-2 text-flicks-light/70 hover:text-flicks-light mb-2 p-0"
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          <span>{isExpanded ? 'Hide' : 'Show'} {comments.length} comment{comments.length !== 1 ? 's' : ''}</span>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2">
        <div className="border-t border-flicks-teal/10 pt-3 space-y-2">
          {comments.map((comment) => {
            if (!comment || !comment._id) return null;
            
            const commentUser = comment.uploadedBy?.username || "Unknown";
            const commentDate = comment.uploadedAt
              ? format(new Date(comment.uploadedAt), "MMM d, yyyy")
              : "";
            const commentLikes = Array.isArray(comment.likes) ? comment.likes : [];
            const commentDislikes = Array.isArray(comment.dislikes) ? comment.dislikes : [];
            const hasLikedComment = user && commentLikes.some(like => like._id === user.id);
            const hasDislikedComment = user && commentDislikes.some(dislike => dislike._id === user.id);

            return (
              <div key={comment._id} className="bg-flicks-dark/20 p-3 rounded text-xs">
                <div className="flex items-center gap-2 mb-1">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={comment.uploadedBy?.profilePic} />
                    <AvatarFallback className="bg-flicks-teal/50 text-flicks-light text-xs">
                      {commentUser.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-flicks-light font-medium">{commentUser}</span>
                  <span className="text-flicks-light/50 ml-auto">{commentDate}</span>
                </div>
                <p className="text-flicks-light/90 mb-2 ml-8">{comment.replyText}</p>
                <div className="flex gap-2 ml-8">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`flex items-center gap-1 h-6 px-2 ${
                      hasLikedComment ? "text-flicks-teal" : "text-flicks-light/50"
                    }`}
                    onClick={() => onLikeComment(reviewId, comment._id)}
                  >
                    <ThumbsUp className={`h-3 w-3 ${hasLikedComment ? "fill-flicks-teal" : ""}`} />
                    <span>{commentLikes.length}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`flex items-center gap-1 h-6 px-2 ${
                      hasDislikedComment ? "text-flicks-teal" : "text-flicks-light/50"
                    }`}
                    onClick={() => onDislikeComment(reviewId, comment._id)}
                  >
                    <ThumbsDown className={`h-3 w-3 ${hasDislikedComment ? "fill-flicks-teal" : ""}`} />
                    <span>{commentDislikes.length}</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default CommentSection;
