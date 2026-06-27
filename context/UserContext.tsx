"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import apiClient from "@/services/api.client";

export interface UserProfileData {
  id: string;
  phone: string;
  email: string | null;
  accountType?: string;
  currentMode?: 'PERSONAL' | 'BUSINESS';
  profile?: {
    displayName: string;
    username: string;
    bio: string | null;
    avatarUrl: string | null;
    country: string | null;
    timezone: string;
    language: string;
  };
}

interface UserContextType {
  user: UserProfileData | null;
  setUser: React.Dispatch<React.SetStateAction<UserProfileData | null>>;
  currentMode: 'PERSONAL' | 'BUSINESS';
  updateCurrentMode: (mode: 'PERSONAL' | 'BUSINESS') => void;
  isLoading: boolean;
  refetchUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentMode, setCurrentModeState] = useState<'PERSONAL' | 'BUSINESS'>('PERSONAL');

  const updateCurrentMode = (mode: 'PERSONAL' | 'BUSINESS') => {
    setCurrentModeState(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("currentMode", mode);
    }
    setUser((prev) => (prev ? { ...prev, currentMode: mode } : null));
  };

  const fetchUser = async () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await apiClient.get("/user/profile");
      if (res.data && res.data.data) {
        const profileData = res.data.data as UserProfileData;
        setUser(profileData);
        
        const mode = (profileData.currentMode as 'PERSONAL' | 'BUSINESS') || 
                     (localStorage.getItem("currentMode") as 'PERSONAL' | 'BUSINESS') || 
                     (profileData.accountType === 'BUSINESS' ? 'BUSINESS' : 'PERSONAL');
        setCurrentModeState(mode);
        if (typeof window !== "undefined") {
          localStorage.setItem("currentMode", mode);
        }
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const savedMode = typeof window !== "undefined" ? localStorage.getItem("currentMode") as 'PERSONAL' | 'BUSINESS' : null;
    if (savedMode === 'PERSONAL' || savedMode === 'BUSINESS') {
      setCurrentModeState(savedMode);
    }
    fetchUser();
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        currentMode,
        updateCurrentMode,
        isLoading,
        refetchUser: fetchUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
