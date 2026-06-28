"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import apiClient from "@/services/api.client";
import { BusinessService, BusinessProfileData } from "@/services/business.service";
import { WorkspaceService, WorkspaceData } from "@/services/workspace.service";

export interface UserProfileData {
  id: string;
  phone: string;
  email: string | null;
  role?: string;
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
  businessProfile: BusinessProfileData | null;
  refetchBusinessProfile: () => Promise<void>;
  workspace: WorkspaceData | null | undefined;
  setWorkspace: React.Dispatch<React.SetStateAction<WorkspaceData | null | undefined>>;
  refetchWorkspace: () => Promise<void>;
  currentMode: 'PERSONAL' | 'BUSINESS';
  updateCurrentMode: (mode: 'PERSONAL' | 'BUSINESS') => void;
  switchWorkspaceMode: (targetMode: 'PERSONAL' | 'BUSINESS') => Promise<void>;
  isSwitchingMode: boolean;
  isLoading: boolean;
  refetchUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfileData | null>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfileData | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceData | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentMode, setCurrentModeState] = useState<'PERSONAL' | 'BUSINESS'>('PERSONAL');
  const [isSwitchingMode, setIsSwitchingMode] = useState<boolean>(false);

  const fetchBusinessProfile = async () => {
    try {
      const res = await BusinessService.getProfile();
      if (res?.success) {
        setBusinessProfile(res.data);
      }
    } catch {
      setBusinessProfile(null);
    }
  };

  const fetchWorkspace = async () => {
    try {
      const res = await WorkspaceService.getMyWorkspace();
      if (res?.success) {
        setWorkspace(res.data);
      } else {
        setWorkspace(null);
      }
    } catch {
      setWorkspace(null);
    }
  };

  const updateCurrentMode = (mode: 'PERSONAL' | 'BUSINESS') => {
    setCurrentModeState(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("currentMode", mode);
    }
    setUser((prev) => (prev ? { ...prev, currentMode: mode } : null));
  };

  const switchWorkspaceMode = async (targetMode: 'PERSONAL' | 'BUSINESS') => {
    if (targetMode === currentMode || isSwitchingMode) return;
    setIsSwitchingMode(true);
    try {
      await BusinessService.switchMode(targetMode);
      setCurrentModeState(targetMode);
      if (typeof window !== "undefined") {
        localStorage.setItem("currentMode", targetMode);
        window.dispatchEvent(new CustomEvent('workspaceModeChanged', { detail: { mode: targetMode } }));
      }
      setUser((prev) => (prev ? { ...prev, currentMode: targetMode } : null));
      await fetchBusinessProfile();
      await fetchWorkspace();
    } catch (error) {
      console.error("Failed to switch workspace mode:", error);
      throw error;
    } finally {
      setIsSwitchingMode(false);
    }
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
    fetchBusinessProfile();
    fetchWorkspace();
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        businessProfile,
        refetchBusinessProfile: fetchBusinessProfile,
        workspace,
        setWorkspace,
        refetchWorkspace: fetchWorkspace,
        currentMode,
        updateCurrentMode,
        switchWorkspaceMode,
        isSwitchingMode,
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
