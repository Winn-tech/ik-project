
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const registerSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

  const form = useForm < RegisterFormValues > ({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const isLoading = form.formState.isSubmitting;

  async function onSubmit(data: RegisterFormValues) {
    try {
      await register(data.username, data.email, data.password);
      navigate("/");
    } catch (error) {
      console.error("Registration error:", error);
      // Error is already handled by the API interceptor
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-flicks-dark p-4">
      <div className="w-full max-w-md">
        <Card className="border-flicks-teal/30 bg-flicks-dark/80 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-flicks-light">Create an account</CardTitle>
            <CardDescription className="text-center text-flicks-light/70">
              Enter your details to create your FlicksLounge account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-flicks-light">Username</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="johndoe"
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
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-flicks-light">Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="your.email@example.com"
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
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-flicks-light">Password</FormLabel>
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
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center text-sm text-flicks-light/70">
              Already have an account?{" "}
              <Link to="/login" className="text-flicks-teal hover:underline">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
