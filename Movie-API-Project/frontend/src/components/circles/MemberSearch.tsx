
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { circlesAPI } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce } from '@/hooks/useDebounce';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Users } from 'lucide-react';

interface MemberSearchProps {
  circleId: string;
}

const MemberSearch: React.FC<MemberSearchProps> = ({ circleId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 500);

  const { data: circleData, isLoading: isCircleLoading } = useQuery({
    queryKey: ['circle', circleId],
    queryFn: () => circlesAPI.getCircleById(circleId),
    enabled: !!circleId,
  });

  const { data: memberResults, isLoading: isSearching } = useQuery({
    queryKey: ['members', circleId, debouncedQuery],
    queryFn: () => {
      if (debouncedQuery && debouncedQuery.length >= 2) {
        return circlesAPI.searchMembers(circleId, debouncedQuery);
      }
      return null;
    },
    enabled: !!circleId && debouncedQuery.length >= 2,
  });

  const renderMembers = () => {
    if (isCircleLoading) {
      return (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-14 w-full bg-flicks-dark/80" />
          ))}
        </div>
      );
    }

    if (!circleData || !circleData.members || circleData.members.length === 0) {
      return <div className="text-flicks-light/70 text-center py-6">No members in this circle</div>;
    }

    const displayMembers = debouncedQuery && memberResults ? memberResults.data : circleData.members;

    return (
      <div className="space-y-2">
        {displayMembers.map((member: any) => (
          <Card key={member._id} className="bg-flicks-dark/60 border-flicks-teal/20 hover:border-flicks-teal/50 transition-colors p-3">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={member.profilePic} />
                <AvatarFallback>{member.username?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-flicks-light font-medium">{member.username}</p>
                {member.isCreator && <p className="text-xs text-flicks-teal">Creator</p>}
                {member.isModerator && !member.isCreator && <p className="text-xs text-flicks-teal">Moderator</p>}
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-flicks-light/50 h-4 w-4" />
        <Input
          type="text"
          placeholder="Search members..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-flicks-dark/60 border-flicks-teal/20 text-flicks-light focus:border-flicks-teal"
        />
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-flicks-light flex items-center gap-2">
          <Users className="h-5 w-5" /> 
          Members {circleData?.members?.length ? `(${circleData.members.length})` : ''}
        </h2>
      </div>

      {isSearching ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full bg-flicks-dark/80" />
          ))}
        </div>
      ) : (
        renderMembers()
      )}
    </div>
  );
};

export default MemberSearch;
