
import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { circleThreadsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, ThumbsDown, ThumbsUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/lib/toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';

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

interface DiscussionData {
  _id: string;
  createdBy: {
    _id: string;
    username: string;
    profilePic?: string;
  };
  content: {
    title: string;
    body: string;
  };
  likes: string[];
  dislikes: string[];
  likesCount: number;
  dislikesCount: number;
  comments: Comment[];
  createdAt: string;
}

interface CircleDiscussionProps {
  discussion: {
    _id: string;
    content: {
      title: string;
      body: string;
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

const CircleDiscussion: React.FC<CircleDiscussionProps> = ({ discussion, circleId, showDetails = false, onRefresh }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [comment, setComment] = React.useState("");
  
  const likeMutation = useMutation({
    mutationFn: () => circleThreadsAPI.likeThread(discussion._id, "discussion"),
    onSuccess: () => {
      if (onRefresh) onRefresh();
    }
  });

  const dislikeMutation = useMutation({
    mutationFn: () => circleThreadsAPI.dislikeThread(discussion._id, "discussion"),
    onSuccess: () => {
      if (onRefresh) onRefresh();
    }
  });

  const addCommentMutation = useMutation({
    mutationFn: (text: string) => circleThreadsAPI.addComment(discussion._id, "discussion", text),
    onSuccess: () => {
      toast.success("Comment added");
      setComment("");
      if (onRefresh) onRefresh();
    }
  });

  const likeCommentMutation = useMutation({
    mutationFn: (commentId: string) => circleThreadsAPI.likeComment(discussion._id, "discussion", commentId),
    onSuccess: () => {
      if (onRefresh) onRefresh();
    }
  });

  const dislikeCommentMutation = useMutation({
    mutationFn: (commentId: string) => circleThreadsAPI.dislikeComment(discussion._id, "discussion", commentId),
    onSuccess: () => {
      if (onRefresh) onRefresh();
    }
  });

  const handleAddComment = () => {
    if (!comment.trim()) return;
    addCommentMutation.mutate(comment);
  };

  // For basic discussion card view (used in lists)
  if (!showDetails) {
    return (
      <Card className="bg-flicks-dark/60 border-flicks-teal/20 text-flicks-light hover:border-flicks-teal/50 transition-colors">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">{discussion.content.title}</CardTitle>
            <div className="text-flicks-light/70 text-sm">
              {format(new Date(discussion.createdAt), 'MMM d, yyyy')}
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-flicks-light/70">
            <Avatar className="h-6 w-6">
              <AvatarImage src={discussion.createdBy?.profilePic} />
              <AvatarFallback>{discussion.createdBy?.username?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <span>{discussion.createdBy?.username}</span>
          </div>
        </CardHeader>
        <CardContent className="py-2">
          <p className="text-flicks-light/80 line-clamp-2">{discussion.content.body}</p>
        </CardContent>
        <CardFooter className="flex justify-between pt-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <ThumbsUp className="h-4 w-4 text-flicks-teal/70" />
              <span className="text-sm text-flicks-light/70">{discussion.likesCount || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <ThumbsDown className="h-4 w-4 text-flicks-teal/70" />
              <span className="text-sm text-flicks-light/70">{discussion.dislikesCount || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4 text-flicks-teal/70" />
              <span className="text-sm text-flicks-light/70">{discussion.comments?.length || 0}</span>
            </div>
          </div>
          <Button 
            variant="link" 
            className="text-flicks-teal hover:text-flicks-sage p-0"
            size="sm"
          >
            View Discussion
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Detailed discussion view
  return (
    <div className="space-y-6">
      <div className="bg-flicks-dark/60 border border-flicks-teal/20 rounded-md p-4">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold text-flicks-light">{discussion.content.title}</h2>
          <div className="text-flicks-light/70 text-sm">
            {format(new Date(discussion.createdAt), 'MMM d, yyyy')}
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6 text-flicks-light/70 text-sm">
          <Avatar className="h-6 w-6">
            <AvatarImage src={discussion.createdBy?.profilePic} />
            <AvatarFallback>{discussion.createdBy?.username?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <span>{discussion.createdBy?.username}</span>
        </div>

        <div className="prose prose-invert max-w-none mb-6">
          <p className="text-flicks-light/90 whitespace-pre-wrap">{discussion.content.body}</p>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2 border-flicks-teal/50 text-flicks-light hover:bg-flicks-teal/10"
            onClick={() => likeMutation.mutate()}
          >
            <ThumbsUp className="h-4 w-4" /> {discussion.likesCount || 0}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2 border-flicks-teal/50 text-flicks-light hover:bg-flicks-teal/10"
            onClick={() => dislikeMutation.mutate()}
          >
            <ThumbsDown className="h-4 w-4" /> {discussion.dislikesCount || 0}
          </Button>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-flicks-light flex items-center gap-2">
            <MessageSquare className="h-5 w-5" /> Comments
          </h3>
          
          <div className="flex gap-3 mb-6">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              className="bg-flicks-dark/50 border-flicks-teal/50 text-flicks-light resize-none"
            />
            <Button
              className="bg-flicks-teal hover:bg-flicks-sage text-black h-auto"
              onClick={handleAddComment}
              disabled={!comment.trim() || addCommentMutation.isPending}
            >
              Post
            </Button>
          </div>
          
          <div className="space-y-4">
            {discussion.comments && discussion.comments.length > 0 ? (
              discussion.comments.map((comment: Comment) => (
                <div key={comment._id} className="bg-flicks-dark/40 p-3 rounded-md border border-flicks-teal/10">
                  <div className="flex justify-between">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={comment.uploadedBy?.profilePic} />
                        <AvatarFallback>{comment.uploadedBy?.username?.[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="text-flicks-light/90 font-medium">
                        {comment.uploadedBy?.username}
                      </span>
                    </div>
                    <span className="text-xs text-flicks-light/50">
                      {format(new Date(comment.uploadedAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                  
                  <p className="text-flicks-light/80 mb-2">{comment.replyText}</p>
                  
                  <div className="flex items-center gap-4">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-6 p-2 flex items-center gap-1 text-flicks-light/70 hover:text-flicks-teal"
                      onClick={() => likeCommentMutation.mutate(comment._id)}
                    >
                      <ThumbsUp className="h-3 w-3" /> {comment.likesCount || 0}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-6 p-2 flex items-center gap-1 text-flicks-light/70 hover:text-flicks-teal"
                      onClick={() => dislikeCommentMutation.mutate(comment._id)}
                    >
                      <ThumbsDown className="h-3 w-3" /> {comment.dislikesCount || 0}
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-flicks-light/50 text-center italic">No comments yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CircleDiscussion;
