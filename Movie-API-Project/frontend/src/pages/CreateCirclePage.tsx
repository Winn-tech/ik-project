
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { circlesAPI } from "@/lib/api";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const createCircleSchema = z.object({
  name: z.string().min(3, { message: "Circle name must be at least 3 characters" }).max(50, { message: "Circle name must be less than 50 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }).max(500, { message: "Description must be less than 500 characters" }),
});

type CreateCircleFormValues = z.infer<typeof createCircleSchema>;

const CreateCirclePage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const form = useForm<CreateCircleFormValues>({
    resolver: zodResolver(createCircleSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const isLoading = form.formState.isSubmitting;

  async function onSubmit(data: CreateCircleFormValues) {
    try {
      const response = await circlesAPI.createCircle(data.name, data.description);
      toast.success("Circle created successfully!");
      navigate(`/circles/${response.data._id}`);
    } catch (error) {
      console.error("Create circle error:", error);
      // Error is already handled by the API interceptor
    }
  }

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container max-w-screen-lg mx-auto py-8 px-4">
      <div className="mb-6">
        <Link 
          to="/circles" 
          className="inline-flex items-center text-flicks-teal hover:text-flicks-sage transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Circles
        </Link>
      </div>

      <Card className="bg-flicks-dark/60 border-flicks-teal/20 text-flicks-light">
        <CardHeader>
          <CardTitle className="text-2xl">Create a New Circle</CardTitle>
          <CardDescription className="text-flicks-light/70">
            Create a community where people can discuss movies and TV shows together
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-flicks-light">Circle Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="E.g., Sci-Fi Enthusiasts"
                        className="bg-flicks-dark/50 border-flicks-teal/50 text-flicks-light"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-flicks-light">Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Describe what your circle is about..."
                        className="bg-flicks-dark/50 border-flicks-teal/50 text-flicks-light min-h-[120px]"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-flicks-light/50">
                      {field.value.length}/500 characters
                    </p>
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="border-flicks-teal/50 text-flicks-light hover:bg-flicks-teal/10"
                  onClick={() => navigate("/circles")}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-flicks-teal hover:bg-flicks-sage text-black"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating..." : "Create Circle"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateCirclePage;
