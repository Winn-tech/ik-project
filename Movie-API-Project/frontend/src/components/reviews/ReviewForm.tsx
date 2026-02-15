
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { reviewsAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { toast } from "sonner";

interface ReviewFormProps {
  mediaId: string;
  mediaType: string;
  onReviewSubmitted: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ mediaId, mediaType, onReviewSubmitted }) => {
  const { isAuthenticated } = useAuth();
  const [reviewText, setReviewText] = useState("");
  const [reviewTitle, setReviewTitle] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverStar, setHoverStar] = useState(0);

  const handleSubmitReview = async () => {
    if (!isAuthenticated) {
      toast.error("Login to submit a review", {
        style: {
          background: '#4A2D2D',
          border: '1px solid #7C4A4A',
          color: '#F7F0F0',
        },
        closeButton: true,
      });
      return;
    }
    if (!reviewText.trim()) {
      toast.error("Please enter a review", {
        style: {
          background: '#4A2D2D',
          border: '1px solid #7C4A4A',
          color: '#F7F0F0',
        },
        closeButton: true,
      });
      return;
    }
    if (!rating) {
      toast.error("Please provide a rating", {
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
      const subject = reviewTitle.trim() || `Review of ${mediaType}-${mediaId}`;
      await reviewsAPI.addReview(mediaId, mediaType, rating, reviewText, subject);
      toast.success("Review submitted!", {
        style: {
          background: '#2D4A3E',
          border: '1px solid #4A7C59',
          color: '#F0F7F4',
        },
        closeButton: true,
      });
      setReviewText("");
      setReviewTitle("");
      setRating(0);
      onReviewSubmitted();
    } catch {
      toast.error("Failed to submit review", {
        style: {
          background: '#4A2D2D',
          border: '1px solid #7C4A4A',
          color: '#F7F0F0',
        },
        closeButton: true,
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-flicks-dark/30 p-4 border border-flicks-teal/10 rounded-lg text-center">
        <p className="text-flicks-light mb-3">Login to write a review</p>
        <Button className="bg-flicks-teal hover:bg-flicks-sage"><Link to="/login">Login</Link></Button>
      </div>
    );
  }

  return (
    <div className="bg-flicks-dark/30 p-4 border border-flicks-teal/10 rounded-lg">
      <h3 className="text-lg font-semibold text-flicks-light mb-3">
        Write a Review
      </h3>
      <div className="mb-3">
        <Input
          placeholder="Review Title (Optional)"
          value={reviewTitle}
          onChange={(e) => setReviewTitle(e.target.value)}
          className="bg-flicks-dark border-flicks-teal/50 text-flicks-light"
        />
      </div>
      <div className="mb-3">
        <Textarea
          placeholder="Share your thoughts..."
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          className="bg-flicks-dark border-flicks-teal/50 text-flicks-light min-h-[80px]"
        />
      </div>
      <div className="flex items-center mb-4">
        <span className="mr-2 text-flicks-light">Your Rating:</span>
        <div className="flex">
          {[1, 2, 3, 4, 5].map((num) => (
            <Star
              key={num}
              className={`h-6 w-6 cursor-pointer ${(hoverStar || rating) >= num * 2
                  ? "text-yellow-400 fill-yellow-400"
                  : (hoverStar || rating) >= num * 2 - 1
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-flicks-light/30"
                }`}
              onMouseEnter={() => setHoverStar(num * 2)}
              onMouseLeave={() => setHoverStar(0)}
              onClick={() => setRating(num * 2)}
            />
          ))}
        </div>
        {rating > 0 && (
          <span className="ml-2 text-flicks-light">{rating}/10</span>
        )}
      </div>
      <Button
        onClick={handleSubmitReview}
        className="bg-flicks-teal hover:bg-flicks-sage"
      >
        Submit
      </Button>
    </div>
  );
};

export default ReviewForm;
