
/* eslint-disable react-refresh/only-export-components */

import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI, profileAPI } from "@/lib/api";
import { toast } from "sonner";

interface User {
  id: string;
  username: string;
  email?: string;
  profilePic?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfilePicture = async (userId: string, username: string) => {
    try {
      const profileData = await profileAPI.getProfilePicture();
      const profilePic = profileData?.profilePic || null;
      setUser({ id: userId, username, profilePic });
    } catch (error) {
      console.error("Failed to fetch profile picture:", error);
      setUser({ id: userId, username });
    }
  };

  const refreshUserProfile = async () => {
    try {
      if (!user) return;
      
      const profileData = await profileAPI.getProfilePicture();
      setUser(prev => prev ? { ...prev, profilePic: profileData?.profilePic || null } : null);
    } catch (error) {
      console.error("Failed to refresh profile:", error);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const userData = await authAPI.getUserInfo();
          await fetchProfilePicture(userData.id, userData.user);
        } catch (error) {
          console.error("Auth initialization error:", error);
          localStorage.removeItem("token");
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { token } = await authAPI.login(email, password);
      localStorage.setItem("token", token);
      const userData = await authAPI.getUserInfo();
      await fetchProfilePicture(userData.id, userData.user);
      
      toast.success("Successfully logged in!", {
        style: {
          background: '#2D4A3E',
          border: '1px solid #4A7C59',
          color: '#F0F7F4',
        },
        className: 'border-flicks-sage',
      });
    } catch (error) {
      toast.error("Login failed. Please check your credentials.", {
        style: {
          background: '#3D2D2D',
          border: '1px solid #7C4A4A',
          color: '#F7F0F0',
        },
        className: 'border-red-500',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      await authAPI.register(username, email, password);
      await login(email, password);
      toast.success("Account created successfully!", {
        style: {
          background: '#2D4A3E',
          border: '1px solid #4A7C59',
          color: '#F0F7F4',
        },
        className: 'border-flicks-sage',
      });
    } catch (error) {
      toast.error("Registration failed. Please try again.", {
        style: {
          background: '#3D2D2D',
          border: '1px solid #7C4A4A',
          color: '#F7F0F0',
        },
        className: 'border-red-500',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    toast.success("You have been logged out", {
      style: {
        background: '#2D3D4A',
        border: '1px solid #4A7C8A',
        color: '#F0F4F7',
      },
      className: 'border-flicks-teal',
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
