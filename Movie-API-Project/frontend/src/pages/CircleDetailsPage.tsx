/* eslint-disable no-case-declarations */
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { circlesAPI, circleThreadsAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, MessageSquare, Plus, Search, ThumbsUp, Trash, Users, Info } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import CreatePollDialog from "@/components/circles/CreatePollDialog";
import CreateDiscussionDialog from "@/components/circles/CreateDiscussionDialog";
import CreateRecommendationDialog from "@/components/circles/CreateRecommendationDialog";
import CirclePoll from "@/components/circles/CirclePoll";
import CircleDiscussion from "@/components/circles/CircleDiscussion";
import CircleRecommendation from "@/components/circles/CircleRecommendation";
import MemberSearch from "@/components/circles/MemberSearch";

interface UserReference {
  _id: string;
  username: string;
  profilePic?: string;
}

interface BaseThreadContent {
  question?: string;
  options?: { text: string; votes: number; _id: string }[];
  votedUsers?: string[];
  title?: string;
  body?: string;
  mediaName?: string;
  reviewText?: string;
  rating?: number;
}

interface Thread {
  _id: string;
  circleId: string;
  createdBy: string | UserReference;
  type: "poll" | "discussion" | "recommendation";
  content: BaseThreadContent;
  createdAt: string;
  likesCount?: number;
  dislikesCount?: number;
  comments?: any[];
  likes?: string[] | UserReference[];
  dislikes?: string[] | UserReference[];
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    searched?: boolean;
  };
}

interface CircleStatus {
  isMember: boolean;
  isModerator: boolean;
  isCreator: boolean;
}

type ActiveThreadTab = "threads" | "polls" | "discussions" | "recommendations" | "members";

const CircleDetailsPage: React.FC = () => {
  const { circleId } = useParams < { circleId: string } > ();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState < ActiveThreadTab > ("threads");
  const [isPollDialogOpen, setIsPollDialogOpen] = useState(false);
  const [isDiscussionDialogOpen, setIsDiscussionDialogOpen] = useState(false);
  const [isRecommendationDialogOpen, setIsRecommendationDialogOpen] = useState(false);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      localStorage.setItem('lastVisitedPath', `/circles/${circleId}`);
      navigate("/login", { replace: true });
    }
  }, [navigate, circleId]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const { data: circleData, isLoading: isCircleLoading, error: circleError } = useQuery({
    queryKey: ["circle", circleId],
    queryFn: () => {
      if (!circleId) return Promise.reject(new Error("Circle ID is missing"));
      return circlesAPI.getCircleById(circleId);
    },
    enabled: !!circleId && !!localStorage.getItem("token"),
  });

  // Use the status endpoint
  const { data: circleStatus } = useQuery < CircleStatus > ({
    queryKey: ["circleStatus", circleId],
    queryFn: () => {
      if (!circleId) return Promise.reject(new Error("Circle ID is missing"));
      return circlesAPI.getCircleStatus(circleId);
    },
    enabled: !!circleId && !!localStorage.getItem("token"),
  });

  const fetchThreads = useCallback(async (): Promise<PaginatedResponse<Thread>> => {
    const defaultEmptyResponse: PaginatedResponse<Thread> = {
      data: [],
      pagination: { page: currentPage, limit: 10, total: 0, pages: 0 },
    };

    if (!circleId) return defaultEmptyResponse;

    try {
      if (debouncedSearchQuery && debouncedSearchQuery.length >= 3) {
        if (activeTab === "discussions" || activeTab === "threads") {
          const response = await circleThreadsAPI.searchDiscussions(circleId, debouncedSearchQuery, currentPage);
          return response || defaultEmptyResponse;
        } else {
          return { ...defaultEmptyResponse, pagination: { ...defaultEmptyResponse.pagination, searched: true } };
        }
      } else {
        let response;
        switch (activeTab) {
          case "discussions":
            response = await circleThreadsAPI.getAllDiscussions(circleId, currentPage);
            break;
          case "polls":
            response = await circleThreadsAPI.getAllPolls(circleId, currentPage);
            break;
          case "recommendations":
            response = await circleThreadsAPI.getAllRecommendations(circleId, currentPage);
            break;
          case "threads":
            // For "threads" tab, get all types of content
            const [pollsRes, discussionsRes, recommendationsRes] = await Promise.all([
              circleThreadsAPI.getAllPolls(circleId, 1, 5).catch(() => ({ data: [] })),
              circleThreadsAPI.getAllDiscussions(circleId, 1, 5).catch(() => ({ data: [] })),
              circleThreadsAPI.getAllRecommendations(circleId, 1, 5).catch(() => ({ data: [] }))
            ]);

            const allThreads = [
              ...(pollsRes?.data || []),
              ...(discussionsRes?.data || []),
              ...(recommendationsRes?.data || [])
            ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            return {
              data: allThreads,
              pagination: { page: 1, limit: 15, total: allThreads.length, pages: 1 }
            };
          default:
            return defaultEmptyResponse;
        }
        return response || defaultEmptyResponse;
      }
    } catch (error) {
      console.error("Error fetching threads:", error);
      return defaultEmptyResponse;
    }
  }, [circleId, activeTab, currentPage, debouncedSearchQuery]);

  const {
    data: threadsData,
    isLoading: isThreadsLoading,
    error: threadsError,
  } = useQuery < PaginatedResponse < Thread >> ({
    queryKey: ["circleThreads", circleId, activeTab, currentPage, debouncedSearchQuery],
    queryFn: fetchThreads,
    enabled: !!circleId && !!localStorage.getItem("token") && activeTab !== "members",
    placeholderData: (prevData) => prevData,
  });

  const invalidateRelevantQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["circle", circleId] });
    queryClient.invalidateQueries({ queryKey: ["circleStatus", circleId] });
    queryClient.invalidateQueries({ queryKey: ["circleThreads", circleId] });
    queryClient.invalidateQueries({ queryKey: ["polls", circleId] });
    queryClient.invalidateQueries({ queryKey: ["discussions", circleId] });
    queryClient.invalidateQueries({ queryKey: ["recommendations", circleId] });
  };

  const joinCircleMutation = useMutation({
    mutationFn: () => {
      if (!circleId) return Promise.reject(new Error("Circle ID is missing"));
      return circlesAPI.joinCircle(circleId);
    },
    onSuccess: () => {
      toast.success("Joined circle successfully");
      invalidateRelevantQueries();
    },
  });

  const leaveCircleMutation = useMutation({
    mutationFn: () => {
      if (!circleId) return Promise.reject(new Error("Circle ID is missing"));
      return circlesAPI.leaveCircle(circleId);
    },
    onSuccess: () => {
      toast.success("Left circle successfully");
      invalidateRelevantQueries();
      setIsLeaveDialogOpen(false);
    },
  });

  const deleteCircleMutation = useMutation({
    mutationFn: () => {
      if (!circleId) return Promise.reject(new Error("Circle ID is missing"));
      return circlesAPI.deleteCircle(circleId);
    },
    onSuccess: () => {
      toast.success("Circle deleted successfully");
      setIsDeleteDialogOpen(false);
      queryClient.removeQueries({ queryKey: ["circle", circleId] });
      queryClient.removeQueries({ queryKey: ["circleThreads", circleId] });
      navigate("/circles");
    },
  });

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderThreads = () => {
    if (isThreadsLoading && (!threadsData || threadsData.data.length === 0)) {
      return (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 w-full bg-flicks-dark/80" />)}
        </div>
      );
    }

    if (threadsError) {
      return <div className="text-center p-10 text-red-400">Error loading content: {(threadsError as Error).message}</div>;
    }

    if (!threadsData || threadsData.data.length === 0) {
      const isSearchAttempt = debouncedSearchQuery && debouncedSearchQuery.length >= 3;
      let noContentMessage = `No ${activeTab === "threads" ? "content" : activeTab.slice(0, -1)} in this circle yet.`;

      if (isSearchAttempt) {
        noContentMessage = `No ${activeTab === "discussions" ? "discussions" : "content"} found matching "${debouncedSearchQuery}".`;
      }

      return (
        <div className="text-center p-10">
          <div className="flex flex-col items-center justify-center text-flicks-light/70">
            <Info size={48} className="mb-4" />
            <p className="mb-4">{noContentMessage}</p>
          </div>
          {circleStatus?.isMember && !debouncedSearchQuery && (
            <Button onClick={handleCreateContentForTab} className="bg-flicks-teal hover:bg-flicks-sage text-black">
              <Plus className="h-4 w-4 mr-2" /> Create {activeTab === "threads" ? "Content" : activeTab.slice(0, -1)}
            </Button>
          )}
        </div>
      );
    }

    return (
      <>
        <div className="space-y-6">
          {threadsData.data.map((thread) => {
            const createdByObject = typeof thread.createdBy === 'string'
              ? { _id: thread.createdBy, username: "Unknown User", profilePic: undefined }
              : thread.createdBy;

            const displayThread = { ...thread, createdBy: createdByObject };
            const onThreadAction = () => queryClient.invalidateQueries({ queryKey: ["circleThreads", circleId] });

            if (thread.type === "poll") {
              return (
                <Link key={thread._id} to={`/circles/${circleId}/poll/${thread._id}`}>
                  <CirclePoll poll={displayThread as any} circleId={circleId || ""} onRefresh={onThreadAction} />
                </Link>
              );
            } else if (thread.type === "discussion") {
              return (
                <Link key={thread._id} to={`/circles/${circleId}/discussion/${thread._id}`}>
                  <CircleDiscussion discussion={displayThread as any} circleId={circleId || ""} onRefresh={onThreadAction} />
                </Link>
              );
            } else if (thread.type === "recommendation") {
              return (
                <Link key={thread._id} to={`/circles/${circleId}/recommendation/${thread._id}`}>
                  <CircleRecommendation recommendation={displayThread as any} circleId={circleId || ""} onRefresh={onThreadAction} />
                </Link>
              );
            }
            return null;
          })}
        </div>
        {renderPagination()}
      </>
    );
  };

  const renderPagination = () => {
    if (!threadsData?.pagination || threadsData.pagination.pages <= 1) return null;
    const { page, pages } = threadsData.pagination;

    const pageItems = [];
    pageItems.push(
      <PaginationItem key="prev">
        <PaginationPrevious onClick={() => handlePageChange(Math.max(1, page - 1))} className={page === 1 ? "pointer-events-none opacity-50 cursor-not-allowed" : "cursor-pointer"} />
      </PaginationItem>
    );

    const pageNumbers = [];
    const visiblePages = 5;
    if (pages <= visiblePages) {
      for (let i = 1; i <= pages; i++) pageNumbers.push(i);
    } else {
      pageNumbers.push(1);
      let start = Math.max(2, page - 1);
      let end = Math.min(pages - 1, page + 1);
      if (page <= 3) {
        end = Math.min(pages - 1, visiblePages - 2);
      } else if (page >= pages - 2) {
        start = Math.max(2, pages - (visiblePages - 3));
      }
      if (start > 2) pageNumbers.push(-1);
      for (let i = start; i <= end; i++) pageNumbers.push(i);
      if (end < pages - 1) pageNumbers.push(-2);
      pageNumbers.push(pages);
    }

    pageNumbers.forEach((pNum) => {
      if (pNum === -1 || pNum === -2) {
        pageItems.push(<PaginationItem key={`ellipsis-${pNum === -1 ? 'start' : 'end'}`}><PaginationEllipsis /></PaginationItem>);
      } else {
        pageItems.push(<PaginationItem key={pNum}><PaginationLink onClick={() => handlePageChange(pNum)} isActive={page === pNum}>{pNum}</PaginationLink></PaginationItem>);
      }
    });

    pageItems.push(
      <PaginationItem key="next">
        <PaginationNext onClick={() => handlePageChange(Math.min(pages, page + 1))} className={page === pages ? "pointer-events-none opacity-50 cursor-not-allowed" : "cursor-pointer"} />
      </PaginationItem>
    );

    return (<Pagination className="mt-8"><PaginationContent>{pageItems}</PaginationContent></Pagination>);
  };

  const handleCreateContentForTab = () => {
    if (activeTab === "polls") {
      setIsPollDialogOpen(true);
    } else if (activeTab === "discussions") {
      setIsDiscussionDialogOpen(true);
    } else if (activeTab === "recommendations") {
      setIsRecommendationDialogOpen(true);
    }
  };

  const handleCreateAllContent = (type: "poll" | "discussion" | "recommendation") => {
    if (type === "poll") {
      setIsPollDialogOpen(true);
    } else if (type === "discussion") {
      setIsDiscussionDialogOpen(true);
    } else if (type === "recommendation") {
      setIsRecommendationDialogOpen(true);
    }
  };

  if (!user && !!localStorage.getItem("token")) {
    return <div className="flex justify-center items-center h-screen text-flicks-light">Loading user data...</div>;
  }
  if (!localStorage.getItem("token")) {
    return <div className="flex justify-center items-center h-screen text-flicks-light">Redirecting to login...</div>;
  }

  if (isCircleLoading && !circleData) {
    return (
      <div className="container max-w-screen-xl mx-auto py-8 px-4">
        <Skeleton className="h-8 w-1/4 mb-6 bg-flicks-dark/80" />
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
          <div className="space-y-2"><Skeleton className="h-10 w-72 bg-flicks-dark/80" /><Skeleton className="h-6 w-32 bg-flicks-dark/80" /></div>
          <div className="flex gap-2"><Skeleton className="h-10 w-28 bg-flicks-dark/80" /><Skeleton className="h-10 w-28 bg-flicks-dark/80" /></div>
        </div>
        <Skeleton className="h-24 w-full bg-flicks-dark/80 mb-8" />
        <Skeleton className="h-12 w-full bg-flicks-dark/80 mb-6" />
        <Skeleton className="h-10 w-full sm:w-96 bg-flicks-dark/80 mb-6" />
        <div className="space-y-6"><Skeleton className="h-40 w-full bg-flicks-dark/80" /><Skeleton className="h-40 w-full bg-flicks-dark/80" /></div>
      </div>
    );
  }

  if (circleError || !circleData) {
    const errorMsg = (circleError as any)?.response?.data?.message || (circleError as Error)?.message || "Circle not found or failed to load.";
    return (
      <div className="container max-w-screen-xl mx-auto py-8 px-4">
        <Card className="bg-flicks-dark/60 border-red-500/30 text-flicks-light p-6 text-center">
          <p className="text-red-400 text-xl mb-4">Oops! Something went wrong.</p>
          <p className="text-flicks-light/80 mb-6">{errorMsg}</p>
          <Button asChild variant="outline" className="border-flicks-teal/50 text-flicks-teal hover:bg-flicks-teal/10 hover:text-flicks-teal">
            <Link to="/circles">Back to Circles</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    // <div className="container max-w-screen-xl mx-auto py-8 px-4 text-flicks-light">
    <div className="container max-w-screen-xl mx-auto py-4 sm:py-8 px-3 sm:px-4 text-flicks-light">
      {/* <div className="mb-6">
        <Link to="/circles" className="inline-flex items-center text-flicks-teal hover:text-flicks-sage transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Circles
        </Link>
      </div> */}
      <div className="mb-4 sm:mb-6">
        <Link to="/circles" className="inline-flex items-center text-flicks-teal hover:text-flicks-sage transition-colors text-sm sm:text-base">
          <ArrowLeft className="mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" /> Back to Circles
        </Link>
      </div>

      {/* <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-flicks-light mb-2">{circleData?.name}</h1>
          <p className="text-flicks-light/70 flex items-center gap-2">
            <Users className="h-4 w-4" /> {Array.isArray(circleData?.members) ? circleData.members.length : 0} {Array.isArray(circleData?.members) && circleData.members.length === 1 ? 'member' : 'members'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {circleStatus?.isCreator && (
            <Button variant="outline" className="text-red-400 border-red-400/50 hover:bg-red-400/10 hover:text-red-500" onClick={() => setIsDeleteDialogOpen(true)}>
              <Trash className="h-4 w-4 mr-2" /> Delete Circle
            </Button>
          )}
          {user && (circleStatus?.isMember ? (
            <Button variant="outline" className="border-flicks-teal/50 text-flicks-light hover:bg-flicks-teal/10" onClick={() => setIsLeaveDialogOpen(true)}>
              Leave Circle
            </Button>
          ) : (
            <Button className="bg-flicks-teal hover:bg-flicks-sage text-black" onClick={() => joinCircleMutation.mutate()} disabled={joinCircleMutation.isPending}>
              {joinCircleMutation.isPending ? "Joining..." : "Join Circle"}
            </Button>
          ))}
        </div>
      </div> */}

      <div className="flex flex-col gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-flicks-light mb-2 break-words">{circleData?.name}</h1>
          <p className="text-flicks-light/70 flex items-center gap-2 text-sm sm:text-base">
            <Users className="h-4 w-4 flex-shrink-0" /> {Array.isArray(circleData?.members) ? circleData.members.length : 0} {Array.isArray(circleData?.members) && circleData.members.length === 1 ? 'member' : 'members'}
          </p>
        </div>
        <div className="flex flex-col xs:flex-row gap-2 w-full xs:w-auto">
          {circleStatus?.isCreator && (
            <Button variant="outline" className="text-red-400 border-red-400/50 hover:bg-red-400/10 hover:text-red-500 w-full xs:w-auto text-sm" onClick={() => setIsDeleteDialogOpen(true)}>
              <Trash className="h-4 w-4 mr-2 flex-shrink-0" /> Delete Circle
            </Button>
          )}
          {user && (circleStatus?.isMember ? (
            <Button variant="outline" className="border-flicks-teal/50 text-flicks-light hover:bg-flicks-teal/10 w-full xs:w-auto text-sm" onClick={() => setIsLeaveDialogOpen(true)}>
              Leave Circle
            </Button>
          ) : (
            <Button className="bg-flicks-teal hover:bg-flicks-sage text-black w-full xs:w-auto text-sm" onClick={() => joinCircleMutation.mutate()} disabled={joinCircleMutation.isPending}>
              {joinCircleMutation.isPending ? "Joining..." : "Join Circle"}
            </Button>
          ))}
        </div>
      </div>

      <Card className="bg-flicks-dark/60 border-flicks-teal/20 text-flicks-light mb-8">
        <div className="p-6">
          <p className="text-flicks-light/90 whitespace-pre-wrap">{circleData?.description}</p>
          <p className="text-flicks-light/50 text-sm mt-4">
            Created by {typeof circleData?.createdBy === 'object' && circleData.createdBy ? circleData.createdBy.username : 'Unknown User'} on {circleData?.createdAt ? format(new Date(circleData.createdAt), 'MMMM d, yyyy') : 'an unknown date'}
          </p>
        </div>
      </Card>

      {/* Search - only show for searchable tabs */}
      {activeTab === "discussions" && (
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-flicks-light/50 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search discussions (min 3 characters)..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="pl-10 bg-flicks-dark/60 border-flicks-teal/20 text-flicks-light focus:border-flicks-teal"
            />
          </div>
          {searchQuery.length > 0 && searchQuery.length < 3 && (
            <p className="text-flicks-light/50 text-xs mt-1">Type at least 3 characters to search</p>
          )}
        </div>
      )}

      {/* <Tabs defaultValue="threads" value={activeTab} className="w-full" onValueChange={(value) => {
        setActiveTab(value as ActiveThreadTab);
        setSearchQuery("");
        setCurrentPage(1);
      }}>
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <TabsList className="bg-flicks-dark/60 border border-flicks-teal/20">
            <TabsTrigger value="threads" className="data-[state=active]:bg-flicks-teal/20 data-[state=active]:text-flicks-light text-flicks-light/70">All</TabsTrigger>
            <TabsTrigger value="polls" className="data-[state=active]:bg-flicks-teal/20 data-[state=active]:text-flicks-light text-flicks-light/70">Polls</TabsTrigger>
            <TabsTrigger value="discussions" className="data-[state=active]:bg-flicks-teal/20 data-[state=active]:text-flicks-light text-flicks-light/70">Discussions</TabsTrigger>
            <TabsTrigger value="recommendations" className="data-[state=active]:bg-flicks-teal/20 data-[state=active]:text-flicks-light text-flicks-light/70">Recommendations</TabsTrigger>
            <TabsTrigger value="members" className="data-[state=active]:bg-flicks-teal/20 data-[state=active]:text-flicks-light text-flicks-light/70">Members</TabsTrigger>
          </TabsList>

          {circleStatus?.isMember && activeTab !== "members" && (
            <div className="flex gap-2 flex-wrap">
              {activeTab === "threads" ? (
                <div className="flex gap-2">
                  <Button
                    className="bg-flicks-teal hover:bg-flicks-sage text-black"
                    onClick={() => handleCreateAllContent("poll")}
                  >
                    <Plus className="h-4 w-4 mr-1" /> New Poll
                  </Button>
                  <Button
                    className="bg-flicks-teal hover:bg-flicks-sage text-black"
                    onClick={() => handleCreateAllContent("discussion")}
                  >
                    <Plus className="h-4 w-4 mr-1" /> New Discussion
                  </Button>
                  <Button
                    className="bg-flicks-teal hover:bg-flicks-sage text-black"
                    onClick={() => handleCreateAllContent("recommendation")}
                  >
                    <Plus className="h-4 w-4 mr-1" /> New Recommendation
                  </Button>
                </div>
              ) : (
                <Button
                  className="bg-flicks-teal hover:bg-flicks-sage text-black"
                  onClick={handleCreateContentForTab}
                >
                  <Plus className="h-4 w-4 mr-1" /> New {activeTab.slice(0, -1)}
                </Button>
              )}
            </div>
          )}
        </div> */}

      <Tabs defaultValue="threads" value={activeTab} className="w-full" onValueChange={(value) => {
        setActiveTab(value as ActiveThreadTab);
        setSearchQuery("");
        setCurrentPage(1);
      }}>
        <div className="flex flex-col gap-4 mb-6">
          <div className="w-full overflow-x-auto">
            <TabsList className="bg-flicks-dark/60 border border-flicks-teal/20 flex w-full min-w-max">
              <TabsTrigger value="threads" className="data-[state=active]:bg-flicks-teal/20 data-[state=active]:text-flicks-light text-flicks-light/70 px-2 sm:px-4 py-2 text-xs sm:text-sm whitespace-nowrap">All</TabsTrigger>
              <TabsTrigger value="polls" className="data-[state=active]:bg-flicks-teal/20 data-[state=active]:text-flicks-light text-flicks-light/70 px-2 sm:px-4 py-2 text-xs sm:text-sm whitespace-nowrap">Polls</TabsTrigger>
              <TabsTrigger value="discussions" className="data-[state=active]:bg-flicks-teal/20 data-[state=active]:text-flicks-light text-flicks-light/70 px-2 sm:px-4 py-2 text-xs sm:text-sm whitespace-nowrap">Discussions</TabsTrigger>
              <TabsTrigger value="recommendations" className="data-[state=active]:bg-flicks-teal/20 data-[state=active]:text-flicks-light text-flicks-light/70 px-2 sm:px-4 py-2 text-xs sm:text-sm whitespace-nowrap">Recommendations</TabsTrigger>
              <TabsTrigger value="members" className="data-[state=active]:bg-flicks-teal/20 data-[state=active]:text-flicks-light text-flicks-light/70 px-2 sm:px-4 py-2 text-xs sm:text-sm whitespace-nowrap">Members</TabsTrigger>
            </TabsList>
          </div>
          {circleStatus?.isMember && activeTab !== "members" && (
            <div className="flex flex-col xs:flex-row gap-2 w-full">
              {activeTab === "threads" ? (
                <div className="flex flex-col xs:flex-row gap-2 w-full">
                  <Button
                    className="bg-flicks-teal hover:bg-flicks-sage text-black w-full xs:w-auto text-xs sm:text-sm"
                    onClick={() => handleCreateAllContent("poll")}
                  >
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" /> New Poll
                  </Button>
                  <Button
                    className="bg-flicks-teal hover:bg-flicks-sage text-black w-full xs:w-auto text-xs sm:text-sm"
                    onClick={() => handleCreateAllContent("discussion")}
                  >
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" /> New Discussion
                  </Button>
                  <Button
                    className="bg-flicks-teal hover:bg-flicks-sage text-black w-full xs:w-auto text-xs sm:text-sm"
                    onClick={() => handleCreateAllContent("recommendation")}
                  >
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" /> New Recommendation
                  </Button>
                </div>
              ) : (
                <Button
                  className="bg-flicks-teal hover:bg-flicks-sage text-black w-full xs:w-auto text-xs sm:text-sm"
                  onClick={handleCreateContentForTab}
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" /> New {activeTab.slice(0, -1)}
                </Button>
              )}
            </div>
          )}
        </div>

        <TabsContent value="threads">{renderThreads()}</TabsContent>
        <TabsContent value="polls">{renderThreads()}</TabsContent>
        <TabsContent value="discussions">{renderThreads()}</TabsContent>
        <TabsContent value="recommendations">{renderThreads()}</TabsContent>
        <TabsContent value="members">
          {circleId && <MemberSearch circleId={circleId} />}
        </TabsContent>
      </Tabs>

      <CreatePollDialog open={isPollDialogOpen} onOpenChange={setIsPollDialogOpen} circleId={circleId || ""} onPollCreated={invalidateRelevantQueries} />
      <CreateDiscussionDialog open={isDiscussionDialogOpen} onOpenChange={setIsDiscussionDialogOpen} circleId={circleId || ""} onDiscussionCreated={invalidateRelevantQueries} />
      <CreateRecommendationDialog open={isRecommendationDialogOpen} onOpenChange={setIsRecommendationDialogOpen} circleId={circleId || ""} onRecommendationCreated={invalidateRelevantQueries} />

      <AlertDialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
        <AlertDialogContent className="bg-flicks-dark border-flicks-teal/30 text-flicks-light">
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Circle</AlertDialogTitle>
            <AlertDialogDescription className="text-flicks-light/70">
              Are you sure you want to leave this circle? You can rejoin later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-flicks-teal/30 text-flicks-light hover:bg-flicks-teal/10">Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-500/70 hover:bg-red-600 text-white" onClick={(e) => { e.preventDefault(); leaveCircleMutation.mutate(); }} disabled={leaveCircleMutation.isPending}>
              {leaveCircleMutation.isPending ? "Leaving..." : "Leave Circle"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-flicks-dark border-flicks-teal/30 text-flicks-light">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Circle</AlertDialogTitle>
            <AlertDialogDescription className="text-flicks-light/70">
              This action cannot be undone. This will permanently delete the circle and all its content.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-flicks-teal/30 text-flicks-light hover:bg-flicks-teal/10">Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-500/70 hover:bg-red-600 text-white" onClick={(e) => { e.preventDefault(); deleteCircleMutation.mutate(); }} disabled={deleteCircleMutation.isPending}>
              {deleteCircleMutation.isPending ? "Deleting..." : "Delete Circle"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CircleDetailsPage;
