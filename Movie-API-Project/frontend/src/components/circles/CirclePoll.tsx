import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { circleThreadsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, ThumbsDown, ThumbsUp, Users, Check, AlertCircle, BarChart3 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';

interface PollOption {
  text: string;
  votes: number;
}

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

interface VotedUser {
  _id: string;
  username: string;
  profilePic?: string;
}

interface PollData {
  _id: string;
  createdBy: {
    _id: string;
    username: string;
    profilePic?: string;
  };
  content: {
    question: string;
    options?: PollOption[];
    votedUsers?: VotedUser | VotedUser[];
  };
  likes: string[];
  dislikes: string[];
  likesCount: number;
  dislikesCount: number;
  comments: Comment[];
  createdAt: string;
}

interface CirclePollProps {
  poll: {
    _id: string;
    content: {
      question: string;
      options?: PollOption[];
    };
    createdAt: string;
    createdBy: {
      username: string;
      profilePic?: string;
    };
    likesCount?: number;
    dislikesCount?: number;
  };
  circleId: string;
  showDetails?: boolean;
  onRefresh?: () => void;
}

const CirclePoll: React.FC<CirclePollProps> = ({ poll, circleId, showDetails = false, onRefresh }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [comment, setComment] = React.useState("");
  const [votingFeedback, setVotingFeedback] = React.useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  
  const { data: pollDetails, isLoading, refetch } = useQuery({
    queryKey: ["poll", poll._id],
    queryFn: () => circleThreadsAPI.getPollResults(poll._id),
    enabled: showDetails,
  });

  const voteMutation = useMutation({
    mutationFn: (optionText: string) => circleThreadsAPI.voteOnPoll(poll._id, optionText),
    onSuccess: () => {
      setVotingFeedback({
        type: 'success',
        message: 'Your vote has been recorded successfully! 🎉'
      });
      setTimeout(() => setVotingFeedback({ type: null, message: '' }), 3000);
      refetch();
      if (onRefresh) onRefresh();
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || "Failed to vote";
      
      if (errorMessage.includes("already voted")) {
        setVotingFeedback({
          type: 'error',
          message: `You've already cast your vote! Thanks for participating 😊`
        });
      } else {
        setVotingFeedback({
          type: 'error',
          message: errorMessage
        });
      }
      setTimeout(() => setVotingFeedback({ type: null, message: '' }), 4000);
    }
  });

  const likeMutation = useMutation({
    mutationFn: () => circleThreadsAPI.likeThread(poll._id, "poll"),
    onSuccess: () => {
      refetch();
      if (onRefresh) onRefresh();
    }
  });

  const dislikeMutation = useMutation({
    mutationFn: () => circleThreadsAPI.dislikeThread(poll._id, "poll"),
    onSuccess: () => {
      refetch();
      if (onRefresh) onRefresh();
    }
  });

  const addCommentMutation = useMutation({
    mutationFn: (text: string) => circleThreadsAPI.addComment(poll._id, "poll", text),
    onSuccess: () => {
      setComment("");
      refetch();
      if (onRefresh) onRefresh();
    }
  });

  const likeCommentMutation = useMutation({
    mutationFn: (commentId: string) => circleThreadsAPI.likeComment(poll._id, "poll", commentId),
    onSuccess: () => {
      refetch();
      if (onRefresh) onRefresh();
    }
  });

  const dislikeCommentMutation = useMutation({
    mutationFn: (commentId: string) => circleThreadsAPI.dislikeComment(poll._id, "poll", commentId),
    onSuccess: () => {
      refetch();
      if (onRefresh) onRefresh();
    }
  });

  const handleVote = (optionText: string) => {
    if (!user) {
      setVotingFeedback({
        type: 'error',
        message: 'Please login to participate in this poll 🔐'
      });
      setTimeout(() => setVotingFeedback({ type: null, message: '' }), 3000);
      return;
    }
    voteMutation.mutate(optionText);
  };

  const handleAddComment = () => {
    if (!comment.trim()) return;
    addCommentMutation.mutate(comment);
  };
  
  const hasVoted = React.useMemo(() => {
    if (!pollDetails || !user) return false;
    
    const votedUsers = pollDetails.content?.votedUsers;
    if (!votedUsers) return false;
    
    // Handle both single object and array cases
    if (Array.isArray(votedUsers)) {
      return votedUsers.some((voter: VotedUser) => voter._id === user.id);
    } else {
      // Single object case
      return votedUsers._id === user.id;
    }
  }, [pollDetails, user]);

  // For basic poll card view (used in lists)
  if (!showDetails) {
    const pollOptions = poll.content.options || [];
    
    return (
      <Card className="bg-flicks-dark/70 border-flicks-teal/20 text-flicks-light hover:border-flicks-teal/40 transition-all duration-300 hover:shadow-lg hover:shadow-flicks-teal/5">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-4">
            <CardTitle className="text-lg font-semibold leading-tight">{poll.content.question}</CardTitle>
            <div className="text-flicks-light/60 text-sm whitespace-nowrap">
              {format(new Date(poll.createdAt), 'MMM d')}
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-flicks-light/70">
            <Avatar className="h-6 w-6">
              <AvatarImage src={poll.createdBy?.profilePic} />
              <AvatarFallback className="text-xs">{poll.createdBy?.username?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <span>{poll.createdBy?.username}</span>
          </div>
        </CardHeader>
        
        {pollOptions.length > 0 && (
          <CardContent className="py-2">
            <div className="space-y-2">
              {pollOptions.slice(0, 2).map((option, index) => (
                <div key={index} className="bg-flicks-dark/50 px-3 py-2 rounded-lg border border-flicks-teal/10">
                  <div className="flex justify-between items-center">
                    <span className="text-flicks-light/90 text-sm">{option.text}</span>
                    <span className="text-flicks-teal/80 text-xs font-medium">{option.votes || 0}</span>
                  </div>
                </div>
              ))}
              {pollOptions.length > 2 && (
                <div className="text-flicks-light/50 text-xs px-3">
                  +{pollOptions.length - 2} more options
                </div>
              )}
            </div>
          </CardContent>
        )}
        
        <CardFooter className="flex justify-between items-center pt-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <ThumbsUp className="h-4 w-4 text-flicks-teal/60" />
              <span className="text-sm text-flicks-light/60">{poll.likesCount || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <ThumbsDown className="h-4 w-4 text-flicks-teal/60" />
              <span className="text-sm text-flicks-light/60">{poll.dislikesCount || 0}</span>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="text-flicks-teal hover:text-flicks-sage hover:bg-flicks-teal/10 p-2 h-auto text-sm"
            size="sm"
          >
            View Poll
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Detailed poll view
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-flicks-dark/70 border border-flicks-teal/20 rounded-xl p-6">
          <Skeleton className="h-8 w-3/4 bg-flicks-dark/80 mb-4" />
          <Skeleton className="h-4 w-1/4 bg-flicks-dark/80 mb-6" />
          <div className="space-y-3">
            <Skeleton className="h-14 w-full bg-flicks-dark/80" />
            <Skeleton className="h-14 w-full bg-flicks-dark/80" />
            <Skeleton className="h-14 w-full bg-flicks-dark/80" />
          </div>
        </div>
      </div>
    );
  }

  if (!pollDetails) {
    return (
      <div className="p-6 border border-red-500/30 rounded-xl bg-flicks-dark/70 text-red-400 text-center">
        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
        <p>Failed to load poll details. Please try again later.</p>
      </div>
    );
  }

  const pollOptions = pollDetails.content?.options || [];
  const totalVotes = pollOptions.reduce((total: number, option: PollOption) => total + (option.votes || 0), 0) || 0;
  
  // Handle votedUsers count - can be single object or array
  let votedUsersCount = 0;
  let votersArray: VotedUser[] = [];
  const votedUsers = pollDetails.content?.votedUsers;
  if (votedUsers) {
    if (Array.isArray(votedUsers)) {
      votedUsersCount = votedUsers.length;
      votersArray = votedUsers;
    } else {
      votedUsersCount = 1; // Single user object
      votersArray = [votedUsers];
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-flicks-dark/70 border border-flicks-teal/20 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-flicks-teal/10">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
            <h1 className="text-xl sm:text-2xl font-bold text-flicks-light leading-tight">
              {pollDetails.content?.question}
            </h1>
            <div className="text-flicks-light/60 text-sm whitespace-nowrap">
              {format(new Date(poll.createdAt), 'MMM d, yyyy')}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-flicks-light/70">
              <Avatar className="h-7 w-7">
                <AvatarImage src={pollDetails.createdBy?.profilePic} />
                <AvatarFallback className="text-xs">{pollDetails.createdBy?.username?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{pollDetails.createdBy?.username}</span>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-flicks-light/60">
              <div className="flex items-center gap-1">
                <BarChart3 className="h-4 w-4" />
                <span>{totalVotes} votes</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{votedUsersCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Voting Feedback */}
        {votingFeedback.type && (
          <div className={`mx-6 mt-6 p-4 rounded-lg border flex items-center gap-3 ${
            votingFeedback.type === 'success' 
              ? 'bg-green-500/10 border-green-500/30 text-green-400' 
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          }`}>
            {votingFeedback.type === 'success' ? (
              <Check className="h-5 w-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
            )}
            <span className="text-sm font-medium">{votingFeedback.message}</span>
          </div>
        )}

        {/* Poll Options */}
        <div className="p-6 space-y-3">
          {pollOptions.map((option: PollOption, index: number) => {
            const votes = option.votes || 0;
            const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
            
            return (
              <div key={index} className="relative group">
                <Button 
                  className={`w-full text-left relative overflow-hidden p-4 h-auto transition-all duration-300 ${
                    hasVoted 
                      ? "bg-flicks-dark/50 border-flicks-teal/20 cursor-default" 
                      : "bg-flicks-dark/30 hover:bg-flicks-dark/50 border-flicks-teal/30 hover:border-flicks-teal/50 hover:shadow-md"
                  } text-flicks-light rounded-lg border`}
                  onClick={() => !hasVoted && handleVote(option.text)}
                  disabled={hasVoted || voteMutation.isPending}
                >
                  {/* Progress Bar */}
                  {hasVoted && (
                    <div 
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-flicks-teal/20 to-flicks-sage/10 transition-all duration-700 ease-out"
                      style={{ width: `${percentage}%` }}
                    />
                  )}
                  
                  <div className="relative z-10 flex items-center justify-between w-full">
                    <div className="flex-1 min-w-0">
                      <span className="text-base font-medium text-flicks-light block truncate pr-4">
                        {option.text}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {hasVoted && (
                        <div className="text-right">
                          <div className="text-flicks-teal font-bold text-lg">
                            {percentage}%
                          </div>
                          <div className="text-flicks-light/60 text-xs">
                            {votes} vote{votes !== 1 ? 's' : ''}
                          </div>
                        </div>
                      )}
                      {!hasVoted && (
                        <div className="text-flicks-light/60 text-sm">
                          {votes} vote{votes !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                </Button>
              </div>
            );
          })}
        </div>

        {/* Participants Section */}
        {votersArray.length > 0 && (
          <div className="px-6 pb-6">
            <div className="bg-flicks-dark/30 rounded-lg p-4 border border-flicks-teal/10">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-5 w-5 text-flicks-teal" />
                <h3 className="font-semibold text-flicks-light">
                  {votedUsersCount} Participant{votedUsersCount !== 1 ? 's' : ''}
                </h3>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {votersArray.slice(0, 8).map((voter, index) => (
                  <div 
                    key={voter._id || index} 
                    className="flex items-center gap-2 bg-flicks-dark/50 px-3 py-2 rounded-full border border-flicks-teal/10"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={voter.profilePic} />
                      <AvatarFallback className="text-xs bg-flicks-teal/20 text-flicks-teal">
                        {voter.username?.[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-flicks-light/90 font-medium">
                      {voter.username || 'Anonymous'}
                    </span>
                  </div>
                ))}
                {votersArray.length > 8 && (
                  <div className="flex items-center px-3 py-2 text-flicks-light/60 text-sm">
                    +{votersArray.length - 8} more
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-6 pb-6">
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2 border-flicks-teal/30 text-flicks-light hover:bg-flicks-teal/10 hover:border-flicks-teal/50"
              onClick={() => likeMutation.mutate()}
            >
              <ThumbsUp className="h-4 w-4" /> {pollDetails.likesCount || 0}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2 border-flicks-teal/30 text-flicks-light hover:bg-flicks-teal/10 hover:border-flicks-teal/50"
              onClick={() => dislikeMutation.mutate()}
            >
              <ThumbsDown className="h-4 w-4" /> {pollDetails.dislikesCount || 0}
            </Button>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-flicks-dark/70 border border-flicks-teal/20 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-flicks-light flex items-center gap-2 mb-4">
          <MessageSquare className="h-5 w-5" /> 
          Comments ({pollDetails.comments?.length || 0})
        </h3>
        
        {/* Add Comment */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              className="bg-flicks-dark/50 border-flicks-teal/30 text-flicks-light resize-none min-h-[80px] focus:border-flicks-teal/50"
            />
          </div>
          <Button
            className="bg-flicks-teal hover:bg-flicks-sage text-black font-medium px-6 self-end"
            onClick={handleAddComment}
            disabled={!comment.trim() || addCommentMutation.isPending}
          >
            Post
          </Button>
        </div>
        
        {/* Comments List */}
        <div className="space-y-4">
          {pollDetails.comments && pollDetails.comments.length > 0 ? (
            pollDetails.comments.map((comment: Comment) => (
              <div key={comment._id} className="bg-flicks-dark/40 p-4 rounded-lg border border-flicks-teal/10">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={comment.uploadedBy?.profilePic} />
                      <AvatarFallback className="text-xs">{comment.uploadedBy?.username?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="text-flicks-light/90 font-medium text-sm">
                      {comment.uploadedBy?.username}
                    </span>
                  </div>
                  <span className="text-xs text-flicks-light/50">
                    {format(new Date(comment.uploadedAt), 'MMM d, yyyy')}
                  </span>
                </div>
                
                <p className="text-flicks-light/80 mb-3 leading-relaxed">{comment.replyText}</p>
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-8 px-3 flex items-center gap-1 text-flicks-light/60 hover:text-flicks-teal hover:bg-flicks-teal/10"
                    onClick={() => likeCommentMutation.mutate(comment._id)}
                  >
                    <ThumbsUp className="h-3 w-3" /> {comment.likesCount || 0}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-8 px-3 flex items-center gap-1 text-flicks-light/60 hover:text-flicks-teal hover:bg-flicks-teal/10"
                    onClick={() => dislikeCommentMutation.mutate(comment._id)}
                  >
                    <ThumbsDown className="h-3 w-3" /> {comment.dislikesCount || 0}
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-flicks-light/30 mx-auto mb-3" />
              <p className="text-flicks-light/50 italic">No comments yet. Be the first to share your thoughts!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CirclePoll;