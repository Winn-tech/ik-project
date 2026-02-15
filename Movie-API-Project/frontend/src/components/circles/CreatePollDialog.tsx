
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { circleThreadsAPI } from "@/lib/api";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, X } from "lucide-react";

interface CreatePollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  circleId: string;
  onPollCreated?: () => void;
}

const createPollSchema = z.object({
  question: z.string().min(5, { message: "Question must be at least 5 characters" }).max(200, { message: "Question must be less than 200 characters" }),
  options: z.array(
    z.object({
      text: z.string().min(1, { message: "Option cannot be empty" }).max(100, { message: "Option must be less than 100 characters" })
    })
  ).min(2, { message: "At least two options are required" })
});

type CreatePollFormValues = z.infer<typeof createPollSchema>;

const CreatePollDialog: React.FC<CreatePollDialogProps> = ({ open, onOpenChange, circleId, onPollCreated }) => {
  const queryClient = useQueryClient();
  
  const form = useForm<CreatePollFormValues>({
    resolver: zodResolver(createPollSchema),
    defaultValues: {
      question: "",
      options: [{ text: "" }, { text: "" }]
    }
  });

  const createPollMutation = useMutation({
    mutationFn: (data: CreatePollFormValues) => {
      const validatedOptions = data.options.map(option => ({
        text: option.text || ""
      }));
      return circleThreadsAPI.createPoll(circleId, data.question, validatedOptions);
    },
    onSuccess: () => {
      toast.success("Poll created successfully");
      if (onPollCreated) {
        onPollCreated();
      } else {
        queryClient.invalidateQueries({ queryKey: ["circleThreads", circleId] });
        queryClient.invalidateQueries({ queryKey: ["polls", circleId] });
      }
      form.reset();
      onOpenChange(false);
    }
  });

  const addOption = () => {
    const currentOptions = form.getValues("options");
    form.setValue("options", [...currentOptions, { text: "" }]);
  };

  const removeOption = (index: number) => {
    const currentOptions = form.getValues("options");
    if (currentOptions.length <= 2) {
      toast.error("At least two options are required");
      return;
    }
    form.setValue("options", currentOptions.filter((_, i) => i !== index));
  };

  const onSubmit = (data: CreatePollFormValues) => {
    const validOptions = data.options.filter(option => option.text.trim() !== "");
    
    if (validOptions.length < 2) {
      toast.error("At least two valid options are required");
      return;
    }
    
    createPollMutation.mutate({
      ...data,
      options: validOptions
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-flicks-dark border-flicks-teal/30 text-flicks-light sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl text-flicks-light">Create a Poll</DialogTitle>
          <DialogDescription className="text-flicks-light/70">
            Create a poll to get opinions from circle members
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-flicks-light">Question</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="What's your question?"
                      className="bg-flicks-dark/50 border-flicks-teal/50 text-flicks-light"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel className="text-flicks-light">Options</FormLabel>
              {form.watch("options").map((_, index) => (
                <div key={index} className="flex items-center gap-2">
                  <FormField
                    control={form.control}
                    name={`options.${index}.text`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={`Option ${index + 1}`}
                            className="bg-flicks-dark/50 border-flicks-teal/50 text-flicks-light"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-flicks-light/70 hover:text-red-400 hover:bg-transparent"
                    onClick={() => removeOption(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full mt-2 border-flicks-teal/50 text-flicks-teal hover:bg-flicks-teal/10"
                onClick={addOption}
              >
                <Plus className="h-4 w-4 mr-2" /> Add Option
              </Button>
            </div>

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
                disabled={createPollMutation.isPending}
              >
                {createPollMutation.isPending ? "Creating..." : "Create Poll"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePollDialog;
