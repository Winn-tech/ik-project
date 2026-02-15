/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { toast } from "sonner";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:9000";
// const TMDB_BASE_URL = "https://api.themoviedb.org/3";
// const TMDB_API_TOKEN = import.meta.env.VITE_TMDB_API_TOKEN;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// const tmdbApi = axios.create({
//   baseURL: TMDB_BASE_URL,
//   headers: {
//     Authorization: `Bearer ${TMDB_API_TOKEN}`,
//   },
// });

const TMDB_PROXY_URL =
  import.meta.env.VITE_TMDB_PROXY_URL ||
  "https://tmdb-proxy-server-kappa.vercel.app/api/tmdb";

const tmdbApi = axios.create({
  baseURL: TMDB_PROXY_URL ,
  // no headers—backend injects the TMDB token
  headers: {
     Authorization: `Bearer ${ import.meta.env.VITE_TMDB_API_TOKEN}`,
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.withCredentials = true;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const data = error.response?.data || {};
    // try each common key for an error message
    const errMsg =
      data.message || data.msg || data.error || "An error occurred";

    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      // toast.error("Session expired. Please log in again.", {
      //   style: {
      //     background: '#3D2D2D',
      //     border: '1px solid #7C4A4A',
      //     color: '#F7F0F4',
      //   },
      //   className: 'border-red-500',
      // });
    } else {
      toast.error(errMsg, {
        style: {
          background: "#3D2D2D",
          border: "1px solid #7C4A4A",
          color: "#F7F0F4",
        },
        className: "border-red-500",
      });
    }

    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post("/api/v1/auth/login", { email, password });
    if (response.data?.token) {
      localStorage.setItem("token", response.data.token);
    }
    return response.data;
  },
  register: async (username: string, email: string, password: string) => {
    const response = await api.post("/api/v1/auth/register", {
      username,
      email,
      password,
    });
    return response.data;
  },
  getUserInfo: async () => {
    const response = await api.get("/api/v1/home");
    return response.data;
  },
  forgotPassword: async (email: string) => {
    const response = await api.post("/api/v1/auth/forgotpassword", { email });
    return response.data;
  },
  resetPassword: async (token: string, newPassword: string) => {
    const response = await api.post(
      `/api/v1/auth/reset-password?token=${token}`,
      {
        newPassword,
      }
    );
    return response.data;
  },
};

// Profile
export const profileAPI = {
  getProfilePicture: async () => {
    const response = await api.get("/api/v1/user/profile/picture");
    return response.data;
  },
  uploadProfilePicture: async (formData: FormData) => {
    const response = await api.post("/api/v1/user/profile/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
  removeProfilePicture: async () => {
    const response = await api.delete("/api/v1/user/profile/remove");
    return response.data;
  },
};

// Example of Public user fetch
export const userAPI = {
  getPublicUser: async (userId: string) => {
    const response = await axios.get(
      `${API_BASE_URL}/api/v1/public/users/${userId}`
    );
    return response.data;
  },
};

// Ratings
export const ratingsAPI = {
  addRating: async (mediaType: string, mediaId: number, rating: number) => {
    const response = await api.post("/api/v1/user/profile/ratings", {
      media_type: mediaType,
      media_id: mediaId,
      rating,
    });
    return response.data;
  },
  getAllRatings: async () => {
    const response = await api.get("/api/v1/user/profile/ratings");
    return response.data;
  },
};

// Favorites
export const favoritesAPI = {
  addFavorite: async (mediaType: string, mediaId: number) => {
    const response = await api.post("/api/v1/user/favourites", {
      media_type: mediaType,
      media_id: mediaId,
      favorite: true,
    });
    return response.data;
  },
  getAllFavorites: async () => {
    const response = await api.get("/api/v1/user/favourites");
    return response.data;
  },
  getFavoriteById: async (mediaId: number) => {
    const response = await api.get(`/api/v1/user/favourites/${mediaId}`);
    return response.data;
  },
  removeFavorite: async (mediaId: number) => {
    const response = await api.delete(`/api/v1/user/favourites/${mediaId}`);
    return response.data;
  },
};

// Watchlist
export const watchlistAPI = {
  addToWatchlist: async (mediaType: string, mediaId: number) => {
    const response = await api.post("/api/v1/user/watchlist", {
      media_type: mediaType,
      media_id: mediaId,
      watchlist: true,
    });
    return response.data;
  },
  getAllWatchlist: async () => {
    const response = await api.get("/api/v1/user/watchlist");
    return response.data;
  },
  removeFromWatchlist: async (mediaId: number) => {
    const response = await api.delete(`/api/v1/user/watchlist/${mediaId}`);
    return response.data;
  },
};

// Reviews
export const reviewsAPI = {
  addReview: async (
    mediaId: string,
    mediaType: string,
    rating: number,
    reviewText: string,
    subject: string
  ) => {
    const response = await api.post("/api/v1/user/review", {
      mediaId,
      mediaType,
      rating,
      reviewText,
      Subject: subject,
    });
    return response.data;
  },
  getAllReviews: async () => {
    const response = await api.get("/api/v1/user/review");
    return response.data;
  },
  likeReview: async (reviewId: string) => {
    const response = await api.patch(`/api/v1/user/review/${reviewId}/like`);
    return response.data;
  },
  dislikeReview: async (reviewId: string) => {
    const response = await api.patch(`/api/v1/user/review/${reviewId}/dislike`);
    return response.data;
  },
  addReplyToReview: async (reviewId: string, replyText: string) => {
    const response = await api.patch(`/api/v1/user/review/${reviewId}`, {
      replytext: replyText,
    });
    return response.data;
  },
  likeReply: async (reviewId: string, replyId: string) => {
    const response = await api.patch(
      `/api/v1/user/review/${reviewId}/reply/${replyId}/like`
    );
    return response.data;
  },
  dislikeReply: async (reviewId: string, replyId: string) => {
    const response = await api.patch(
      `/api/v1/user/review/${reviewId}/reply/${replyId}/dislike`
    );
    return response.data;
  },
};

// Circles API
export const circlesAPI = {
  createCircle: async (name: string, description: string) => {
    const response = await api.post("/api/v1/user/circle", {
      name,
      description,
    });
    return response.data;
  },
  getAllCircles: async (
    page: number = 1,
    limit: number = 10,
    sortBy: string = "-createdAt"
  ) => {
    const response = await api.get("/api/v1/user/circle", {
      params: { page, limit, sortBy },
    });
    return response.data;
  },
  getCircleById: async (circleId: string) => {
    const response = await api.get(`/api/v1/user/circle/${circleId}`);
    return response.data;
  },
  getCircleStatus: async (circleId: string) => {
    const response = await api.get(`/api/v1/user/circle/${circleId}/status`);
    return response.data;
  },
  joinCircle: async (circleId: string) => {
    const response = await api.patch(`/api/v1/user/circle/${circleId}/join`);
    return response.data;
  },
  leaveCircle: async (circleId: string) => {
    const response = await api.patch(`/api/v1/user/circle/${circleId}/leave`);
    return response.data;
  },
  deleteCircle: async (circleId: string) => {
    const response = await api.delete(`/api/v1/user/circle/${circleId}`);
    return response.data;
  },
  searchCircles: async (
    query: string,
    page: number = 1,
    limit: number = 10
  ) => {
    const response = await api.get("/api/v1/user/circleThread/search/circles", {
      params: { query, page, limit },
    });
    return response.data;
  },
  searchMembers: async (
    circleId: string,
    query: string,
    page: number = 1,
    limit: number = 10
  ) => {
    const response = await api.get(
      `/api/v1/user/circleThread/${circleId}/search/members`,
      {
        params: { query, page, limit },
      }
    );
    return response.data;
  },
};

// Circle Threads API
export const circleThreadsAPI = {
  // ========= POLLS =========
  createPoll: async (
    circleId: string,
    question: string,
    options: { text: string }[]
  ) => {
    const response = await api.post(
      `/api/v1/user/circleThread/${circleId}/poll`,
      {
        type: "poll",
        content: {
          question,
          options,
        },
      }
    );
    return response.data;
  },
  getAllPolls: async (
    circleId: string,
    page: number = 1,
    limit: number = 10,
    sortBy: string = "-createdAt"
  ) => {
    const response = await api.get(
      `/api/v1/user/circleThread/${circleId}/polls`,
      {
        params: { page, limit, sortBy },
      }
    );
    return response.data;
  },
  getPollResults: async (pollId: string) => {
    const response = await api.get(`/api/v1/user/circleThread/${pollId}/poll`);
    // The response is the direct poll object, not wrapped in { data: ... }
    return response.data;
  },
  voteOnPoll: async (pollId: string, optionText: string) => {
    const response = await api.patch(
      `/api/v1/user/circleThread/${pollId}/poll`,
      { text: optionText }
    );
    // Handle both success response formats
    return response.data.success ? response.data.data : response.data;
  },

  // ========= DISCUSSIONS =========
  createDiscussion: async (circleId: string, title: string, body: string) => {
    const response = await api.post(
      `/api/v1/user/circleThread/${circleId}/discussion`,
      {
        type: "discussion",
        content: {
          title,
          body,
        },
      }
    );
    return response.data;
  },
  getAllDiscussions: async (
    circleId: string,
    page: number = 1,
    limit: number = 10,
    sortBy: string = "-createdAt"
  ) => {
    const response = await api.get(
      `/api/v1/user/circleThread/${circleId}/discussions`,
      {
        params: { page, limit, sortBy },
      }
    );
    return response.data;
  },
  getDiscussion: async (discussId: string) => {
    const response = await api.get(
      `/api/v1/user/circleThread/${discussId}/discussion`
    );
    return response.data;
  },
  searchDiscussions: async (
    circleId: string,
    query: string,
    page: number = 1,
    limit: number = 10
  ) => {
    const response = await api.get(
      `/api/v1/user/circleThread/${circleId}/discussions/search`,
      {
        params: { query, page, limit },
      }
    );
    return response.data;
  },

  // ========= RECOMMENDATIONS =========
  createRecommendation: async (
    circleId: string,
    mediaName: string,
    reviewText: string,
    rating: number
  ) => {
    const response = await api.post(
      `/api/v1/user/circleThread/${circleId}/recommendation`,
      {
        type: "recommendation",
        content: {
          mediaName,
          reviewText,
          rating,
        },
      }
    );
    return response.data;
  },
  getAllRecommendations: async (
    circleId: string,
    page: number = 1,
    limit: number = 10,
    sortBy: string = "-createdAt"
  ) => {
    const response = await api.get(
      `/api/v1/user/circleThread/${circleId}/recommendations`,
      {
        params: { page, limit, sortBy },
      }
    );
    return response.data;
  },
  getRecommendation: async (recommendId: string) => {
    const response = await api.get(
      `/api/v1/user/circleThread/${recommendId}/recommendation`
    );
    return response.data;
  },

  // ========= GENERIC THREAD INTERACTIONS (Likes, Dislikes, Comments) =========
  likeThread: async (
    threadId: string,
    threadType: "poll" | "discussion" | "recommendation"
  ) => {
    const response = await api.patch(
      `/api/v1/user/circleThread/${threadId}/${threadType}/like`
    );
    return response.data;
  },
  dislikeThread: async (
    threadId: string,
    threadType: "poll" | "discussion" | "recommendation"
  ) => {
    const response = await api.patch(
      `/api/v1/user/circleThread/${threadId}/${threadType}/dislike`
    );
    return response.data;
  },
  addComment: async (
    threadId: string,
    threadType: "poll" | "discussion" | "recommendation",
    replyText: string
  ) => {
    const response = await api.patch(
      `/api/v1/user/circleThread/${threadId}/${threadType}/addcomment`,
      { replyText }
    );
    return response.data;
  },
  likeComment: async (
    threadId: string,
    threadType: "poll" | "discussion" | "recommendation",
    commentId: string
  ) => {
    const response = await api.patch(
      `/api/v1/user/circleThread/${threadId}/${threadType}/${commentId}/like`
    );
    return response.data;
  },
  dislikeComment: async (
    threadId: string,
    threadType: "poll" | "discussion" | "recommendation",
    commentId: string
  ) => {
    const response = await api.patch(
      `/api/v1/user/circleThread/${threadId}/${threadType}/${commentId}/dislike`
    );
    return response.data;
  },
};

// Cinema
export const cinemaAPI = {
  getFilmhouseData: async () => {
    const response = await api.get("/api/filmhouse");
    return response.data;
  },
  getEbonylifeData: async () => {
    const response = await api.get("/api/ebonylife");
    return response.data;
  },
};

// TMDB
export const tmdbAPI = {
  getTrendingMovies: async () => {
    const response = await tmdbApi.get("/trending/movie/week");
    return response.data.results;
  },
  getTrendingTVShows: async () => {
    const response = await tmdbApi.get("/trending/tv/week");
    return response.data.results;
  },
  getPopularMovies: async ({ queryKey }) => {
    const [_, page = 1] = queryKey;
    const response = await tmdbApi.get("/movie/popular", { params: { page } });
    return response.data.results;
  },
  getPopularTVShows: async ({ queryKey }) => {
    const [_, page = 1] = queryKey;
    const response = await tmdbApi.get("/tv/popular", { params: { page } });
    return response.data.results;
  },
  getMovieDetails: async (id: number) => {
    const response = await tmdbApi.get(`/movie/${id}`);
    return response.data;
  },
  getTVShowDetails: async (id: number) => {
    const response = await tmdbApi.get(`/tv/${id}`);
    return response.data;
  },
  getMovieGenres: async () => {
    const response = await tmdbApi.get("/genre/movie/list");
    return response.data.genres;
  },
  getTVGenres: async () => {
    const response = await tmdbApi.get("/genre/tv/list");
    return response.data.genres;
  },
  searchMulti: async (query: string) => {
    const response = await tmdbApi.get("/search/multi", { params: { query } });
    return response.data.results;
  },
  getMovieCredits: async (id: number) => {
    const response = await tmdbApi.get(`/movie/${id}/credits`);
    return response.data;
  },
  getTVShowCredits: async (id: number) => {
    const response = await tmdbApi.get(`/tv/${id}/credits`);
    return response.data;
  },
  getSimilarMovies: async (id: number) => {
    const response = await tmdbApi.get(`/movie/${id}/similar`);
    return response.data.results;
  },
  getSimilarTVShows: async (id: number) => {
    const response = await tmdbApi.get(`/tv/${id}/similar`);
    return response.data.results;
  },
  getMovieReviews: async (id: number) => {
    const response = await tmdbApi.get(`/movie/${id}/reviews`);
    return response.data.results;
  },
  getTVShowReviews: async (id: number) => {
    const response = await tmdbApi.get(`/tv/${id}/reviews`);
    return response.data.results;
  },
  getUpcomingMovies: async ({ queryKey }) => {
    const [_, page = 1, region = ""] = queryKey;
    const currentDate = new Date().toISOString().split("T")[0];
    const currentYear = new Date().getFullYear();
    const endOfYear = `${currentYear}-12-31`;

    const response = await tmdbApi.get("/movie/upcoming", {
      params: {
        page,
        region,
        "primary_release_date.gte": currentDate,
        "primary_release_date.lte": endOfYear,
      },
    });
    return response.data;
  },
  getUpcomingTVShows: async ({ queryKey }) => {
    const [_, page = 1, region = ""] = queryKey;
    const currentDate = new Date().toISOString().split("T")[0];
    const currentYear = new Date().getFullYear();
    const endOfYear = `${currentYear}-12-31`;

    const response = await tmdbApi.get("/tv/on_the_air", {
      params: {
        page,
        region,
        "first_air_date.gte": currentDate,
        "first_air_date.lte": endOfYear,
      },
    });
    return response.data;
  },
  getCountries: async () => {
    try {
      const response = await tmdbApi.get("/configuration/countries");
      return response.data;
    } catch (error) {
      console.error("Error fetching countries:", error);
      throw error;
    }
  },
  getUpcomingMediaDetails: async (id, mediaType) => {
    try {
      const endpoint = mediaType === "movie" ? `/movie/${id}` : `/tv/${id}`;
      const response = await tmdbApi.get(endpoint, {
        params: {
          append_to_response:
            "videos,credits,images,release_dates,content_ratings",
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${mediaType} details:`, error);
      throw error;
    }
  },
  getVideos: async (mediaId: number, mediaType: "movie" | "tv") => {
    const response = await tmdbApi.get(`/${mediaType}/${mediaId}/videos`);
    return response.data.results;
  },
};

export default api;
