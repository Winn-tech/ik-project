import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { circleThreadsAPI, tmdbAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Star, ThumbsDown, ThumbsUp, Play, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/lib/toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Comment {
  _id: string;
  uploadedBy: {
    _id: string;
    username: string;
    profilePic?: string;
  };
  replyText: string;
  likes: string[];
  dislikes: string[];
  likesCount: number;
  dislikesCount: number;
  uploadedAt: string;
}

interface RecommendationData {
  _id: string;
  createdBy: {
    _id: string;
    username: string;
    profilePic?: string;
  };
  content: {
    mediaName: string;
    reviewText: string;
    rating: number;
  };
  likes: string[];
  dislikes: string[];
  likesCount: number;
  dislikesCount: number;
  comments: Comment[];
  createdAt: string;
}

interface MediaData {
  id: number;
  media_type: string;
  poster_path: string | null;
  backdrop_path: string | null;
  title?: string;
  name?: string;
  overview: string;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
}

interface CircleRecommendationProps {
  recommendation: {
    _id: string;
    content: {
      mediaName: string;
      reviewText: string;
      rating: number;
    };
    createdAt: string;
    createdBy: {
      username: string;
      profilePic?: string;
    };
    likesCount?: number;
    dislikesCount?: number;
    comments?: Comment[];
  };
  circleId: string;
  showDetails?: boolean;
  onRefresh?: () => void;
}

const CircleRecommendation: React.FC<CircleRecommendationProps> = ({
  recommendation,
  circleId,
  showDetails = false,
  onRefresh
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [comment, setComment] = React.useState("");
  const [mediaData, setMediaData] = React.useState < MediaData | null > (null);
  const [showTrailer, setShowTrailer] = React.useState(false);
  const [trailerKey, setTrailerKey] = React.useState < string | null > (null);

  const { data: recommendationDetails, isLoading, refetch } = useQuery({
    queryKey: ["recommendation", recommendation._id],
    queryFn: () => circleThreadsAPI.getRecommendation(recommendation._id),
    enabled: showDetails,
  });

  // Fetch media data and trailer
  React.useEffect(() => {
    const fetchMediaData = async () => {
      if (recommendation.content.mediaName) {
        try {
          const searchResults = await tmdbAPI.searchMulti(recommendation.content.mediaName);
          if (searchResults && searchResults.length > 0) {
            const media = searchResults[0];
            setMediaData(media);

            // Fetch trailer
            if (media.id && media.media_type) {
              try {
                const endpoint = media.media_type === 'movie' ? 'movie' : 'tv';
                const details = await tmdbAPI.getUpcomingMediaDetails(media.id, endpoint);
                const trailers = details.videos?.results?.filter(
                  (video: any) => video.type === 'Trailer' && video.site === 'YouTube'
                );
                if (trailers && trailers.length > 0) {
                  setTrailerKey(trailers[0].key);
                }
              } catch (error) {
                console.error('Failed to fetch trailer:', error);
              }
            }
          }
        } catch (error) {
          console.error('Failed to fetch media data:', error);
        }
      }
    };

    fetchMediaData();
  }, [recommendation.content.mediaName]);

  const likeMutation = useMutation({
    mutationFn: () => circleThreadsAPI.likeThread(recommendation._id, "recommendation"),
    onSuccess: () => {
      refetch();
      if (onRefresh) onRefresh();
    }
  });

  const dislikeMutation = useMutation({
    mutationFn: () => circleThreadsAPI.dislikeThread(recommendation._id, "recommendation"),
    onSuccess: () => {
      refetch();
      if (onRefresh) onRefresh();
    }
  });

  const addCommentMutation = useMutation({
    mutationFn: (text: string) => circleThreadsAPI.addComment(recommendation._id, "recommendation", text),
    onSuccess: () => {
      toast.success("Comment added");
      setComment("");
      refetch();
      if (onRefresh) onRefresh();
    }
  });

  const likeCommentMutation = useMutation({
    mutationFn: (commentId: string) => circleThreadsAPI.likeComment(recommendation._id, "recommendation", commentId),
    onSuccess: () => {
      refetch();
      if (onRefresh) onRefresh();
    }
  });

  const dislikeCommentMutation = useMutation({
    mutationFn: (commentId: string) => circleThreadsAPI.dislikeComment(recommendation._id, "recommendation", commentId),
    onSuccess: () => {
      refetch();
      if (onRefresh) onRefresh();
    }
  });

  const handleAddComment = () => {
    if (!comment.trim()) return;
    addCommentMutation.mutate(comment);
  };

  // Compact card view for lists
  if (!showDetails) {
    return (
      <>
        <Card className="bg-flicks-dark/60 border-flicks-teal/20 text-flicks-light hover:border-flicks-teal/40 transition-all duration-200 overflow-hidden mb-3">
          <CardHeader className="pb-3">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                {mediaData?.poster_path ? (
                  <div className="relative group">
                    <img
                      src={`https://image.tmdb.org/t/p/w185${mediaData.poster_path}`}
                      alt={recommendation.content.mediaName}
                      className="w-12 h-18 sm:w-16 sm:h-24 object-cover rounded-md"
                    />
                    {trailerKey && (
                      <Button
                        onClick={() => setShowTrailer(true)}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-0 rounded-md"
                        variant="ghost"
                      >
                        <Play className="h-4 w-4 text-white" />
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="w-12 h-18 sm:w-16 sm:h-24 bg-flicks-teal/10 rounded-md flex items-center justify-center">
                    <Star className="h-6 w-6 text-flicks-teal/50" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                  <CardTitle className="text-base sm:text-lg font-medium line-clamp-1">
                    {recommendation.content.mediaName}
                  </CardTitle>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex items-center text-yellow-400 bg-yellow-900/30 px-2 py-0.5 rounded-full text-xs">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      {recommendation.content.rating}
                    </div>
                    <span className="text-xs text-flicks-light/60">
                      {format(new Date(recommendation.createdAt), 'MMM d')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={recommendation.createdBy?.profilePic} />
                    <AvatarFallback className="text-xs">
                      {recommendation.createdBy?.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-flicks-light/70 truncate">
                    {recommendation.createdBy?.username}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="py-0 pb-3">
            <p className="text-sm text-flicks-light/80 line-clamp-2 leading-relaxed">
              {recommendation.content.reviewText}
            </p>
          </CardContent>

          <CardFooter className="flex justify-between items-center pt-0">
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-flicks-light/60">
                <ThumbsUp className="h-3 w-3" />
                {recommendation.likesCount || 0}
              </span>
              <span className="flex items-center gap-1 text-flicks-light/60">
                <MessageSquare className="h-3 w-3" />
                {recommendation.comments?.length || 0}
              </span>
            </div>
            <Button
              variant="link"
              className="text-flicks-teal hover:text-flicks-sage p-0 h-auto text-sm"
            >
              View Details
            </Button>
          </CardFooter>
        </Card>

        <Dialog open={showTrailer} onOpenChange={setShowTrailer}>
          <DialogContent className="bg-flicks-dark border-flicks-teal/20 max-w-4xl w-full p-1 sm:p-2">
            <DialogHeader className="p-4">
              <DialogTitle className="text-flicks-light">
                {recommendation.content.mediaName} - Trailer
              </DialogTitle>
            </DialogHeader>
            <div className="aspect-video w-full">
              {trailerKey && (
                <iframe
                  src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
                  allowFullScreen
                  className="w-full h-full"
                  title={`${recommendation.content.mediaName} Trailer`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Loading state
  if (showDetails && isLoading) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex gap-4">
          <Skeleton className="w-32 h-48 bg-gray-700 rounded-md" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-6 w-3/4 bg-gray-700" />
            <Skeleton className="h-4 w-1/2 bg-gray-700" />
            <Skeleton className="h-4 w-1/4 bg-gray-700" />
          </div>
        </div>
        <Skeleton className="h-32 w-full bg-gray-700" />
      </div>
    );
  }

  const details = recommendationDetails || recommendation;

  // Detailed view
  return (
    <>
      <div className="space-y-6">
        <div className="bg-flicks-dark/60 border border-flicks-teal/20 rounded-lg overflow-hidden">
          {/* Header with backdrop */}
          {mediaData?.backdrop_path && (
            <div className="relative h-48 sm:h-64 overflow-hidden">
              <img
                src={`https://image.tmdb.org/t/p/w1280${mediaData.backdrop_path}`}
                alt={details.content.mediaName}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-flicks-dark via-flicks-dark/60 to-transparent" />
              {trailerKey && (
                <Button
                  onClick={() => setShowTrailer(true)}
                  className="absolute bottom-4 right-4 bg-flicks-teal hover:bg-flicks-sage text-black font-medium"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Watch Trailer
                </Button>
              )}
            </div>
          )}

          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              {/* Poster */}
              <div className="flex-shrink-0 self-start">
                {mediaData?.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w342${mediaData.poster_path}`}
                    alt={details.content.mediaName}
                    className="w-24 h-36 sm:w-32 sm:h-48 object-cover rounded-lg shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-36 sm:w-32 sm:h-48 bg-flicks-teal/10 rounded-lg flex items-center justify-center">
                    <Star className="h-8 w-8 text-flicks-teal/50" />
                  </div>
                )}
                <div className="flex justify-center items-center mt-2">
                  {mediaData?.release_date ? (
                    <p>{format(new Date(mediaData.release_date), 'MMMM d, yyyy')}</p>
                  ) : (
                    <div className="w-24 h-36 sm:w-32 sm:h-48 bg-flicks-teal/10 rounded-lg flex items-center justify-center">
                      <Star className="h-8 w-8 text-flicks-teal/50" />
                    </div>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-flicks-light mb-2">
                      {details.content.mediaName}
                    </h1>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center text-yellow-400 bg-yellow-900/30 px-3 py-1 rounded-full">
                        <Star className="h-4 w-4 mr-1 fill-current" />
                        <span className="font-medium">{details.content.rating}/10</span>
                      </div>
                      {mediaData?.vote_average && (
                        <div className="text-sm text-flicks-light/60">
                          TMDB: {mediaData.vote_average.toFixed(1)}/10
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-flicks-light/60">
                    {format(new Date(details.createdAt), 'MMMM d, yyyy')}
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={details.createdBy?.profilePic} />
                    <AvatarFallback>
                      {details.createdBy?.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-flicks-light font-medium">
                      {details.createdBy?.username}
                    </div>
                    <div className="text-xs text-flicks-light/60">Recommended</div>
                  </div>
                </div>

                {/* TMDB Overview */}
                {mediaData?.overview && (
                  <div className="mb-4 p-3 bg-flicks-dark/40 rounded-lg border border-flicks-teal/10">
                    <h3 className="text-sm font-medium text-flicks-teal mb-2">Synopsis</h3>
                    <p className="text-sm text-flicks-light/80 line-clamp-3">
                      {mediaData.overview}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Review */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-flicks-light mb-3">Recommendation Review</h3>
              <div className="prose prose-invert max-w-none">
                <p className="text-flicks-light/90 leading-relaxed whitespace-pre-wrap">
                  {details.content.reviewText}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-flicks-teal/10">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 border-flicks-teal/30 text-flicks-light hover:bg-flicks-teal/10 hover:border-flicks-teal/50"
                onClick={() => likeMutation.mutate()}
                disabled={likeMutation.isPending}
              >
                <ThumbsUp className="h-4 w-4" />
                {details.likesCount || 0}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 border-flicks-teal/30 text-flicks-light hover:bg-flicks-teal/10 hover:border-flicks-teal/50"
                onClick={() => dislikeMutation.mutate()}
                disabled={dislikeMutation.isPending}
              >
                <ThumbsDown className="h-4 w-4" />
                {details.dislikesCount || 0}
              </Button>
            </div>

            {/* Comments Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-flicks-light flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Comments ({details.comments?.length || 0})
              </h3>

              {/* Add Comment */}
              <div className="space-y-3">
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="bg-flicks-dark/40 border-flicks-teal/30 text-flicks-light placeholder:text-flicks-light/50 resize-none focus:border-flicks-teal/60"
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button
                    className="bg-flicks-teal hover:bg-flicks-sage text-black font-medium"
                    onClick={handleAddComment}
                    disabled={!comment.trim() || addCommentMutation.isPending}
                  >
                    {addCommentMutation.isPending ? "Posting..." : "Post Comment"}
                  </Button>
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-4">
                {details.comments && details.comments.length > 0 ? (
                  details.comments.map((comment: Comment) => (
                    <div key={comment._id} className="bg-flicks-dark/30 p-4 rounded-lg border border-flicks-teal/10">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={comment.uploadedBy?.profilePic} />
                            <AvatarFallback className="text-xs">
                              {comment.uploadedBy?.username?.[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-flicks-light font-medium text-sm">
                              {comment.uploadedBy?.username}
                            </div>
                            <div className="text-xs text-flicks-light/50">
                              {format(new Date(comment.uploadedAt), 'MMM d, yyyy')}
                            </div>
                          </div>
                        </div>
                      </div>

                      <p className="text-flicks-light/90 mb-3 leading-relaxed">
                        {comment.replyText}
                      </p>

                      <div className="flex items-center gap-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-3 flex items-center gap-2 text-flicks-light/60 hover:text-flicks-teal hover:bg-flicks-teal/10"
                          onClick={() => likeCommentMutation.mutate(comment._id)}
                        >
                          <ThumbsUp className="h-3 w-3" />
                          <span className="text-xs">{comment.likesCount || 0}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-3 flex items-center gap-2 text-flicks-light/60 hover:text-flicks-teal hover:bg-flicks-teal/10"
                          onClick={() => dislikeCommentMutation.mutate(comment._id)}
                        >
                          <ThumbsDown className="h-3 w-3" />
                          <span className="text-xs">{comment.dislikesCount || 0}</span>
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-flicks-light/30 mx-auto mb-3" />
                    <p className="text-flicks-light/50">No comments yet. Be the first to share your thoughts!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showTrailer} onOpenChange={setShowTrailer}>
        <DialogContent className="bg-flicks-dark border-flicks-teal/20 max-w-4xl w-full p-1 sm:p-2">
          <DialogHeader className="p-4">
            <DialogTitle className="text-flicks-light">
              {recommendation.content.mediaName} - Trailer
            </DialogTitle>
          </DialogHeader>
          <div className="aspect-video w-full">
            {trailerKey && (
              <iframe
                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
                allowFullScreen
                className="w-full h-full"
                title={`${recommendation.content.mediaName} Trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CircleRecommendation;