import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import RequireAuth from "@/components/RequireAuth";
import Layout from "@/components/Layout";
import HomePage from "@/pages/HomePage";
import MoviesPage from "@/pages/MoviesPage";
import TvShowsPage from "@/pages/TvShowsPage";
import CinemasPage from "@/pages/CinemasPage";
import FavoritesPage from "@/pages/FavoritesPage";
import WatchlistPage from "@/pages/WatchlistPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import NotFound from "@/pages/NotFound";
import MediaDetailsPage from "@/pages/MediaDetailsPage";
import SettingsPage from "@/pages/SettingsPage";
import ProfilePage from "@/pages/ProfilePage";
import SearchPage from "@/pages/SearchPage";
import NewsPage from "@/pages/NewsPage";
import UpcomingPage from "@/pages/UpcomingPage";
import UpcomingDetailsPage from "@/pages/UpcomingDetailsPage";
import Review from "./components/AllReviews";
import CirclesPage from "@/pages/CirclesPage";
import CircleDetailsPage from "@/pages/CircleDetailsPage";
import CreateCirclePage from "@/pages/CreateCirclePage";
import ThreadDetailsPage from "@/pages/ThreadDetailsPage";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <SonnerToaster 
          position="top-right"
          toastOptions={{
            style: {
              background: '#2D4A3E',
              border: '1px solid #4A7C59',
              color: '#F0F7F4',
            },
            className: 'border-flicks-sage',
            closeButton: true,
          }}
        />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="movies" element={<MoviesPage />} />
              <Route path="tv" element={<TvShowsPage />} />
              <Route path="cinemas" element={<CinemasPage />} />
              <Route path="movie/:id" element={<MediaDetailsPage />} />
              <Route path="tv/:id" element={<MediaDetailsPage />} />
              <Route path="news" element={<NewsPage />} />
              <Route path="upcoming" element={<UpcomingPage />} />
              <Route path="upcoming/:mediaType/:id" element={<UpcomingDetailsPage />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="reviews" element={<Review />} />
              
              {/* Protected Routes */}
              <Route path="favorites" element={<RequireAuth><FavoritesPage /></RequireAuth>} />
              <Route path="watchlist" element={<RequireAuth><WatchlistPage /></RequireAuth>} />
              <Route path="settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
              <Route path="profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
              <Route path="circles" element={<RequireAuth><CirclesPage /></RequireAuth>} />
              <Route path="circles/create" element={<RequireAuth><CreateCirclePage /></RequireAuth>} />
              <Route path="circles/:circleId" element={<RequireAuth><CircleDetailsPage /></RequireAuth>} />
              <Route path="circles/:circleId/:threadType/:threadId" element={<RequireAuth><ThreadDetailsPage /></RequireAuth>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
