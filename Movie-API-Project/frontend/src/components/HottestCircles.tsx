import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { circlesAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import dottedCircle from "@/components/images/dottedCircle.png";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import "@/styles/layout.css";

/**
 * HottestCircles Component - FINAL VERSION
 * 
 * Combines the correct UI design (overlapping hero, glassmorphism cards)
 * with the existing API integration from circlesAPI.
 * 
 * Features:
 * - Fetches from circlesAPI.getAllCircles() if authenticated
 * - Falls back to mock data if API fails or returns < 3 circles
 * - Glassmorphism cards that overlap hero section
 * - Shows icon, name, member count, online count, join button
 * - Displays recent discussions and user avatars
 */

interface Circle {
  _id: string;
  name: string;
  description?: string;
  members: string[] | number;
  online?: number;
  icon?: string;
  color?: string;
  discussions?: string[];
  likes?: string;
  avatars?: string[]; // Optional: active user avatars
}

const HottestCircles: React.FC = () => {
  const { isAuthenticated } = useAuth();

  // Fetch circles from API
  const { data: circlesData, isLoading } = useQuery({
    queryKey: ["hottestCircles"],
    queryFn: () => circlesAPI.getAllCircles(1, 3, "-createdAt"),
    enabled: isAuthenticated,
    retry: 1,
  });

  // Handle join circle action
  const handleJoinCircle = async (circleId: string, circleName?: string) => {
    if (!isAuthenticated) {
      toast.error("Please login to join circles", {
        style: {
          background: "#4A2D2D",
          border: "1px solid #7C4A4A",
          color: "#F7F0F0",
        },
        closeButton: true,
      });
      return;
    }

    // If it's a mock circle, just show a message
    if (!circleId || circleId.length < 5) {
      toast.info(`Feature coming soon: Join ${circleName || "this circle"}`, {
        style: {
          background: "#2D4A3E",
          border: "1px solid #4A7C59",
          color: "#F0F7F4",
        },
        closeButton: true,
      });
      return;
    }

    try {
      await circlesAPI.joinCircle(circleId);
      toast.success("Joined circle successfully", {
        style: {
          background: "#2D4A3E",
          border: "1px solid #4A7C59",
          color: "#F0F7F4",
        },
        closeButton: true,
      });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to join circle", {
        style: {
          background: "#4A2D2D",
          border: "1px solid #7C4A4A",
          color: "#F7F0F0",
        },
        closeButton: true,
      });
    }
  };

  // Mock data for demonstration (fallback)
  const mockCircles: Circle[] = [
    {
      _id: "mock-1",
      name: "Comedy Heads",
      description: "Join the funniest discussions",
      members: 12400,
      online: 324,
      icon: "S",
      color: "purple",
      discussions: [
        "Does the ending of Dune Part 2 deviate too much from the book? Let's discuss.",
        "What's your favorite comedy special of 2026?",
      ],
      likes: "2.4k",
      avatars: [
        "https://i.pravatar.cc/40?img=1",
        "https://i.pravatar.cc/40?img=2",
        "https://i.pravatar.cc/40?img=3",
      ],
    },
    {
      _id: "mock-2",
      name: "Horror Club",
      description: "For horror enthusiasts",
      members: 8200,
      online: 156,
      icon: "S",
      color: "green",
      discussions: [
        "Best A24 horror movie? Hereditary vs The Witch vs Talk to me.",
        "Poll: Scariest movie villain of all time?",
      ],
      likes: "2k",
      avatars: [
        "https://i.pravatar.cc/40?img=4",
        "https://i.pravatar.cc/40?img=5",
      ],
    },
    {
      _id: "mock-3",
      name: "Anime Dungeon",
      description: "Anime discussions",
      members: 25000,
      online: 1200,
      icon: "S",
      color: "pink",
      discussions: [
        "Solo leveling episode 8 discussion thread [SPOILERS]",
        "Cinema Meetup: Concord Fest 2026 - Lekki.",
      ],
      likes: "2k",
      avatars: [
        "https://i.pravatar.cc/40?img=6",
        "https://i.pravatar.cc/40?img=7",
        "https://i.pravatar.cc/40?img=8",
      ],
    },
  ];

  // Get circles from API or use mock data
  const apiCircles = circlesData?.data || [];
  const displayCircles =
    apiCircles.length >= 3 ? apiCircles.slice(0, 3) : mockCircles;

  // Format member count
  const formatMemberCount = (members: string[] | number): string => {
    const count = Array.isArray(members) ? members.length : members;
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  // Get background color class based on color
  const getColorClass = (color?: string): string => {
    switch (color) {
      case "green":
        return "bg-green-600";
      case "pink":
        return "bg-pink-600";
      case "blue":
        return "bg-blue-600";
      case "purple":
      default:
        return "bg-purple-600";
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8">
      {/* Section Header with notification dot */}
      <div className="mb-6 flex items-center gap-3">
        <div className="relative">
          <img
            src={dottedCircle}
            alt="Hottest Circles"
            className="w-6 h-6"
          />
          {/* Red notification dot */}
          <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 border-2 border-flicks-dark" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-flicks-light sidebar__title">
            Hottest Circles
          </h2>
          <p className="text-xs text-flicks-light/60">
            Join communities discussing your favorite genres
          </p>
        </div>
      </div>

      {/* Circles Container - Horizontal Scroll */}
      <div className="relative">
        <div
          className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {displayCircles.map((circle: Circle, index: number) => {
            const memberCount = formatMemberCount(circle.members);
            const onlineCount = circle.online || 0;
            const colorClass = getColorClass(circle.color);
            const isJoined = Array.isArray(circle.members);

            return (
              <div key={circle._id || index} className="group flex-shrink-0 w-72">
                {/* Circle Card with glassmorphism effect */}
                <div className="h-full rounded-xl bg-black/60 backdrop-blur-md p-4 transition-all hover:bg-black/70 border border-white/10 hover:border-white/20">
                  {/* Top section: Icon, Name, Join button */}
                  <div className="flex items-start gap-3 mb-3">
                    {/* Circular Icon */}
                    <div
                      className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${colorClass} text-white font-bold text-xl`}
                    >
                      {circle.icon || circle.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Name and Stats */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-flicks-light mb-1 group-hover:text-flicks-teal transition-colors">
                        {circle.name}
                      </h3>
                      <p className="text-xs text-flicks-light/60">
                        {memberCount} Members · {onlineCount} Online
                      </p>
                    </div>

                    {/* Join/Joined Button */}
                    <Button
                      size="sm"
                      className={`text-xs font-semibold px-4 py-1 h-7 rounded-md ${
                        isJoined
                          ? "bg-flicks-teal hover:bg-flicks-teal/80 text-white"
                          : "bg-flicks-teal hover:bg-flicks-teal/90 text-white"
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleJoinCircle(circle._id, circle.name);
                      }}
                    >
                      {isJoined ? "Joined" : "Join"}
                    </Button>
                  </div>

                  {/* Recent Discussions */}
                  <div className="mb-3 space-y-2">
                    {circle.discussions?.slice(0, 2).map((discussion, idx) => (
                      <Link
                        key={idx}
                        to={`/circles/${circle._id}/discussions`}
                        className="block"
                      >
                        <div className="flex items-start gap-2">
                          {/* Chat icon */}
                          <svg
                            className="h-4 w-4 text-flicks-light/40 flex-shrink-0 mt-0.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                          </svg>
                          <p className="text-xs text-flicks-light/70 line-clamp-2 hover:text-flicks-teal transition-colors">
                            {discussion}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* Active Users Avatars */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <div className="flex -space-x-2">
                        {(circle.avatars || mockCircles[index]?.avatars || [])
                          .slice(0, 3)
                          .map((avatar, avatarIdx) => (
                            <img
                              key={avatarIdx}
                              src={avatar}
                              alt={`User ${avatarIdx + 1}`}
                              className="h-6 w-6 rounded-full border-2 border-black/60 object-cover"
                            />
                          ))}
                      </div>
                      {circle.avatars && circle.avatars.length > 3 && (
                        <span className="text-xs text-flicks-light/50 ml-1">
                          +{circle.avatars.length - 3}
                        </span>
                      )}
                    </div>
                    {circle.likes && (
                      <span className="text-xs text-flicks-light/50">
                        {circle.likes} likes
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Fade effect on right side */}
        <div className="pointer-events-none absolute right-0 top-0 h-full w-20 bg-gradient-to-l from-flicks-dark to-transparent" />
      </div>
    </div>
  );
};

export default HottestCircles;