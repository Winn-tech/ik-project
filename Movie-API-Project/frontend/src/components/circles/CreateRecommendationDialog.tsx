import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { circleThreadsAPI, tmdbAPI } from "@/lib/api";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Star } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

interface CreateRecommendationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  circleId: string;
  onRecommendationCreated?: () => void;
}

const createRecommendationSchema = z.object({
  mediaName: z.string().min(1, { message: "Media name is required" }),
  reviewText: z.string().min(10, { message: "Review must be at least 10 characters" }).max(500, { message: "Review must be less than 500 characters" }),
  rating: z.number().min(1, { message: "Rating must be at least 1" }).max(10, { message: "Rating must be at most 10" })
});

type CreateRecommendationFormValues = z.infer<typeof createRecommendationSchema>;

interface Media {
  id: number;
  title?: string;
  name?: string;
  media_type: string;
  poster_path: string;
  release_date?: string;
  first_air_date?: string;
}

const CreateRecommendationDialog: React.FC<CreateRecommendationDialogProps> = ({ open, onOpenChange, circleId, onRecommendationCreated }) => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Media[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [hasSelectedResult, setHasSelectedResult] = useState(false);
  const debouncedSearchTerm = useDebounce(searchQuery, 500);
  
  const form = useForm<CreateRecommendationFormValues>({
    resolver: zodResolver(createRecommendationSchema),
    defaultValues: {
      mediaName: "",
      reviewText: "",
      rating: 8
    }
  });

  React.useEffect(() => {
    const searchMedia = async () => {
      if (debouncedSearchTerm.length < 2) {
        setSearchResults([]);
        setShowResults(false);
        setHasSelectedResult(false);
        return;
      }

      setIsSearching(true);
      try {
        const results = await tmdbAPI.searchMulti(debouncedSearchTerm);
        const filteredResults = results.filter(
          (item: any) => item.media_type === "movie" || item.media_type === "tv"
        );
        setSearchResults(filteredResults.slice(0, 5));
        if (!hasSelectedResult) {
          setShowResults(true);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    };

    searchMedia();
  }, [debouncedSearchTerm]);

  const createRecommendationMutation = useMutation({
    mutationFn: (data: CreateRecommendationFormValues) => 
      circleThreadsAPI.createRecommendation(circleId, data.mediaName, data.reviewText, data.rating),
    onSuccess: () => {
      toast.success("Recommendation created successfully");
      if (onRecommendationCreated) {
        onRecommendationCreated();
      } else {
        queryClient.invalidateQueries({ queryKey: ["circleThreads", circleId] });
        queryClient.invalidateQueries({ queryKey: ["recommendations", circleId] });
      }
      form.reset();
      setSearchQuery("");
      setSearchResults([]);
      setShowResults(false);
      setHasSelectedResult(false);
      onOpenChange(false);
    }
  });

  const onSubmit = (data: CreateRecommendationFormValues) => {
    createRecommendationMutation.mutate(data);
  };

  const selectMedia = (media: Media) => {
    const mediaTitle = media.title || media.name || "";
    form.setValue("mediaName", mediaTitle);
    setSearchQuery(mediaTitle);
    setSearchResults([]);
    setShowResults(false);
    setHasSelectedResult(true);
  };

  const stars = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-flicks-dark border-flicks-teal/30 text-flicks-light sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl text-flicks-light">Recommend Something</DialogTitle>
          <DialogDescription className="text-flicks-light/70">
            Share a movie or TV show you enjoyed with circle members
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="mediaName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-flicks-light">Movie/TV Show</FormLabel>
                  <div className="flex gap-2 relative">
                    <FormControl>
                      <Input
                        {...field}
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          field.onChange(e.target.value);
                          setHasSelectedResult(false);
                        }}
                        placeholder="Search for movies or TV shows..."
                        className="bg-flicks-dark/50 border-flicks-teal/50 text-flicks-light"
                        onFocus={() => {
                          if (searchResults.length > 0 && !hasSelectedResult) setShowResults(true);
                        }}
                      />
                    </FormControl>
                    <Button 
                      type="button"
                      variant="outline" 
                      size="icon"
                      className="border-flicks-teal/50 text-flicks-teal hover:bg-flicks-teal/10"
                    >
                      <Search className="h-4 w-4" />
                    </Button>

                    {showResults && searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-flicks-dark border border-flicks-teal/20 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                        <ul className="py-1">
                          {searchResults.map((media) => (
                            <li 
                              key={`${media.media_type}-${media.id}`}
                              className="flex items-start gap-2 p-2 hover:bg-flicks-teal/10 cursor-pointer"
                              onClick={() => selectMedia(media)}
                            >
                              <div className="h-10 w-8 flex-shrink-0 overflow-hidden rounded bg-gray-800">
                                {media.poster_path ? (
                                  <img
                                    src={`https://image.tmdb.org/t/p/w92${media.poster_path}`}
                                    alt={media.title || media.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-gray-800 text-xs text-gray-400">
                                    No image
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-medium text-flicks-light">
                                  {media.title || media.name}
                                </span>
                                <span className="text-xs text-flicks-light/70">
                                  {media.media_type === "movie" ? "Movie" : "TV Show"} &middot;{" "}
                                  {media.release_date
                                    ? new Date(media.release_date).getFullYear()
                                    : media.first_air_date
                                    ? new Date(media.first_air_date).getFullYear()
                                    : "Unknown year"}
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-flicks-light">Rating</FormLabel>
                  <div className="flex gap-1">
                    {stars.map((star) => (
                      <Button
                        key={star}
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 p-0 ${
                          field.value >= star
                            ? "text-yellow-400"
                            : "text-gray-400"
                        }`}
                        onClick={() => field.onChange(star)}
                      >
                        <Star className="h-5 w-5 fill-current" />
                      </Button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reviewText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-flicks-light">Your Review</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Why do you recommend this?"
                      className="bg-flicks-dark/50 border-flicks-teal/50 text-flicks-light min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-flicks-light/50">
                    {field.value.length}/500 characters
                  </p>
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                className="border-flicks-teal/50 text-flicks-light hover:bg-flicks-teal/10"
                onClick={() => {
                  onOpenChange(false);
                  setSearchQuery("");
                  setSearchResults([]);
                  setShowResults(false);
                  setHasSelectedResult(false);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-flicks-teal hover:bg-flicks-sage text-black"
                disabled={createRecommendationMutation.isPending}
              >
                {createRecommendationMutation.isPending ? "Creating..." : "Create Recommendation"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRecommendationDialog;