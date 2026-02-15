
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

interface CommentFormProps {
  reviewId: string;
  commentText: string;
  onCommentTextChange: (reviewId: string, text: string) => void;
  onSubmitComment: (reviewId: string) => void;
}

const CommentForm: React.FC<CommentFormProps> = ({
  reviewId,
  commentText,
  onCommentTextChange,
  onSubmitComment,
}) => {
  return (
    <div className="border-t border-flicks-teal/10 pt-3 mt-auto">
      <div className="flex gap-2">
        <Input
          placeholder="Write a comment..."
          value={commentText}
          onChange={(e) => onCommentTextChange(reviewId, e.target.value)}
          className="bg-flicks-dark border-flicks-teal/50 text-flicks-light text-sm"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              onSubmitComment(reviewId);
            }
          }}
        />
        <Button
          size="sm"
          onClick={() => onSubmitComment(reviewId)}
          className="bg-flicks-teal hover:bg-flicks-sage"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default CommentForm;
