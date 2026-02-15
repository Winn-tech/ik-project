
import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { circlesAPI, circleThreadsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import CirclePoll from '@/components/circles/CirclePoll';
import CircleDiscussion from '@/components/circles/CircleDiscussion';
import CircleRecommendation from '@/components/circles/CircleRecommendation';
import { useAuth } from '@/contexts/AuthContext';

const ThreadDetailsPage: React.FC = () => {
  const { circleId, threadType, threadId } = useParams<{
    circleId: string;
    threadType: string;
    threadId: string;
  }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const { data: circleData, isLoading: isCircleLoading } = useQuery({
    queryKey: ["circle", circleId],
    queryFn: () => circleId ? circlesAPI.getCircleById(circleId) : null,
    enabled: !!circleId && isAuthenticated,
  });

  const { data: threadData, isLoading: isThreadLoading, refetch } = useQuery({
    queryKey: ["thread", threadType, threadId],
    queryFn: async () => {
      if (!threadId || !threadType) return null;
      
      switch (threadType) {
        case 'poll':
          return circleThreadsAPI.getPollResults(threadId);
        case 'discussion': {
          const discussions = await circleThreadsAPI.getAllDiscussions(circleId || "");
          return discussions.data.find((d: any) => d._id === threadId);
        }
        case 'recommendation':
          return circleThreadsAPI.getRecommendation(threadId);
        default:
          throw new Error(`Unknown thread type: ${threadType}`);
      }
    },
    enabled: !!threadId && !!threadType && isAuthenticated,
  });

  if (!isAuthenticated) {
    return null;
  }

  if (isCircleLoading || isThreadLoading) {
    return (
      <div className="container max-w-screen-xl mx-auto py-8 px-4">
        <div className="mb-6">
          <Skeleton className="h-6 w-40 bg-gray-700" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/4 bg-gray-700" />
          <Skeleton className="h-4 w-1/3 bg-gray-700" />
          <Skeleton className="h-64 w-full bg-gray-700 mt-6" />
        </div>
      </div>
    );
  }

  if (!circleData || !threadData) {
    return (
      <div className="container max-w-screen-xl mx-auto py-8 px-4">
        <Card className="bg-flicks-dark/60 border-red-500/30 text-flicks-light p-6">
          <p className="text-red-400">Thread not found or you don't have permission to view it.</p>
          <Button 
            asChild 
            variant="outline" 
            className="mt-4 border-flicks-teal/50 text-flicks-teal hover:bg-flicks-teal/10"
          >
            <Link to={`/circles/${circleId}`}>Back to Circle</Link>
          </Button>
        </Card>
      </div>
    );
  }
  
  const renderThread = () => {
    switch (threadType) {
      case 'poll':
        return <CirclePoll poll={threadData} circleId={circleId || ""} showDetails onRefresh={refetch} />;
      case 'discussion':
        return <CircleDiscussion discussion={threadData} circleId={circleId || ""} showDetails onRefresh={refetch} />;
      case 'recommendation':
        return <CircleRecommendation recommendation={threadData} circleId={circleId || ""} showDetails onRefresh={refetch} />;
      default:
        return <p className="text-flicks-light">Unknown thread type</p>;
    }
  };

  return (
    <div className="container max-w-screen-xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Link 
          to={`/circles/${circleId}`} 
          className="inline-flex items-center text-flicks-teal hover:text-flicks-sage transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to {circleData.name}
        </Link>
      </div>
      
      {renderThread()}
    </div>
  );
};

export default ThreadDetailsPage;
