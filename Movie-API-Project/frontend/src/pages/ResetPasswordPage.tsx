
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { authAPI } from "@/lib/api";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, { message: "Password must be at least 8 characters" }),
  confirmPassword: z.string().min(8, { message: "Password must be at least 8 characters" }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isResetComplete, setIsResetComplete] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

  // Extract token from URL query params
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get("token");

  const form = useForm < ResetPasswordFormValues > ({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const isLoading = form.formState.isSubmitting;

  async function onSubmit(data: ResetPasswordFormValues) {
    if (!token) {
      toast.error("Reset token is missing");
      return;
    }

    try {
      await authAPI.resetPassword(token, data.newPassword);
      setIsResetComplete(true);
      toast.success("Password has been reset successfully");
    } catch (error) {
      console.error("Reset password error:", error);
      // Error is already handled by the API interceptor
    }
  }

  if (!token && !isResetComplete) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-flicks-dark p-4">
        <Card className="border-flicks-teal/30 bg-flicks-dark/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-center text-flicks-light">Invalid Reset Link</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-flicks-light/70">
              The password reset link is invalid or has expired.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button asChild variant="outline" className="border-flicks-teal/50 text-flicks-teal hover:bg-flicks-teal/10">
              <Link to="/forgot-password">Request a new reset link</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-flicks-dark p-4">
      <div className="w-full max-w-md">
        <Card className="border-flicks-teal/30 bg-flicks-dark/80 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-flicks-light">
              {isResetComplete ? "Password Reset Complete" : "Reset Your Password"}
            </CardTitle>
            <CardDescription className="text-center text-flicks-light/70">
              {isResetComplete
                ? "You can now log in with your new password"
                : "Create a new password for your account"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isResetComplete ? (
              <div className="text-center space-y-4">
                <p className="text-sm text-flicks-light/70">
                  Your password has been successfully reset.
                </p>
                <Button
                  className="mt-4 w-full bg-flicks-teal hover:bg-flicks-sage text-white"
                  onClick={() => navigate("/login")}
                >
                  Go to login
                </Button>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-flicks-light">New Password</FormLabel>
                        {/* <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="••••••••"
                            className="bg-flicks-dark/50 border-flicks-teal/50 text-flicks-light"
                            disabled={isLoading}
                          />
                        </FormControl> */}
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                              className="bg-flicks-dark/50 border-flicks-teal/50 text-flicks-light pr-10"
                              disabled={isLoading}
                            />
                            <button
                              type="button"
                              onClick={togglePasswordVisibility}
                              className="absolute right-2 top-1/2 -translate-y-1/2 h-[18px] text-flicks-light/60 hover:text-flicks-teal transition-colors"
                              tabIndex={-1}
                            >
                              <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                              <span className="inline-block transition-opacity duration-200 animate-fade-in">
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                              </span>
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-flicks-light">Confirm Password</FormLabel>
                        {/* <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="••••••••"
                            className="bg-flicks-dark/50 border-flicks-teal/50 text-flicks-light"
                            disabled={isLoading}
                          />
                        </FormControl> */}
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                              className="bg-flicks-dark/50 border-flicks-teal/50 text-flicks-light pr-10"
                              disabled={isLoading}
                            />
                            <button
                              type="button"
                              onClick={togglePasswordVisibility}
                              className="absolute right-2 top-1/2 -translate-y-1/2 h-[18px] text-flicks-light/60 hover:text-flicks-teal transition-colors"
                              tabIndex={-1}
                            >
                              <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                              <span className="inline-block transition-opacity duration-200 animate-fade-in">
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                              </span>
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full bg-flicks-teal hover:bg-flicks-sage text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? "Resetting..." : "Reset Password"}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center text-sm text-flicks-light/70">
              <Link to="/login" className="flex items-center justify-center gap-1 text-flicks-teal hover:underline">
                <ArrowLeft className="h-4 w-4" />
                Back to login
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
