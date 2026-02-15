
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { circleThreadsAPI } from "@/lib/api";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CreateDiscussionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  circleId: string;
  onDiscussionCreated?: () => void;
}

const createDiscussionSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }).max(100, { message: "Title must be less than 100 characters" }),
  body: z.string().min(10, { message: "Body must be at least 10 characters" }).max(2000, { message: "Body must be less than 2000 characters" })
});

type CreateDiscussionFormValues = z.infer<typeof createDiscussionSchema>;

const CreateDiscussionDialog: React.FC<CreateDiscussionDialogProps> = ({ open, onOpenChange, circleId, onDiscussionCreated }) => {
  const queryClient = useQueryClient();
  
  const form = useForm<CreateDiscussionFormValues>({
    resolver: zodResolver(createDiscussionSchema),
    defaultValues: {
      title: "",
      body: ""
    }
  });

  const createDiscussionMutation = useMutation({
    mutationFn: (data: CreateDiscussionFormValues) => 
      circleThreadsAPI.createDiscussion(circleId, data.title, data.body),
    onSuccess: () => {
      toast.success("Discussion created successfully");
      if (onDiscussionCreated) {
        onDiscussionCreated();
      } else {
        queryClient.invalidateQueries({ queryKey: ["circleThreads", circleId] });
        queryClient.invalidateQueries({ queryKey: ["discussions", circleId] });
      }
      form.reset();
      onOpenChange(false);
    }
  });

  const onSubmit = (data: CreateDiscussionFormValues) => {
    createDiscussionMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-flicks-dark border-flicks-teal/30 text-flicks-light sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl text-flicks-light">Create a Discussion</DialogTitle>
          <DialogDescription className="text-flicks-light/70">
            Start a new conversation in this circle
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-flicks-light">Title</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Discussion title"
                      className="bg-flicks-dark/50 border-flicks-teal/50 text-flicks-light"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-flicks-light">Body</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="What would you like to discuss?"
                      className="bg-flicks-dark/50 border-flicks-teal/50 text-flicks-light min-h-[120px]"
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-flicks-light/50">
                    {field.value.length}/2000 characters
                  </p>
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                className="border-flicks-teal/50 text-flicks-light hover:bg-flicks-teal/10"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-flicks-teal hover:bg-flicks-sage text-black"
                disabled={createDiscussionMutation.isPending}
              >
                {createDiscussionMutation.isPending ? "Creating..." : "Create Discussion"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateDiscussionDialog;
