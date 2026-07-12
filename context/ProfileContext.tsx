"use client";

import React, { createContext, useContext, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useUser } from "@/context/UserContext";
import { BusinessService } from "@/services/business.service";

// Define the shape of the user profile from the API
export interface UserProfileData {
  id: string;
  phone: string;
  email: string | null;
  accountType?: string;
  currentMode?: string;
  profile: {
    displayName: string;
    username: string;
    bio: string | null;
    avatarUrl: string | null;
    country: string | null;
    timezone: string;
    language: string;
  };
}

export interface ProfileFormData {
  displayName: string;
  username: string;
  email: string;
  phone: string;
  bio: string;
  country: string;
  timezone: string;
  language: string;
  companyName: string;
  category: string;
  description: string;
  website: string;
}

interface ProfileContextType {
  userData: UserProfileData | null;
  setUserData: React.Dispatch<React.SetStateAction<UserProfileData | null>>;
  formData: ProfileFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProfileFormData>>;
  avatarPreview: string | null;
  setAvatarPreview: React.Dispatch<React.SetStateAction<string | null>>;
  avatarFile: File | null;
  setAvatarFile: React.Dispatch<React.SetStateAction<File | null>>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  isLoading: boolean;
  isPending: boolean;
  activeMode: string;
  notificationsEnabled: boolean;
  setNotificationsEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  handleImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSaveProfile: () => void;
  handleLogout: () => Promise<void>;
  businessProfile: any;
  refreshProfile?: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { currentMode, updateCurrentMode, businessProfile, refetchBusinessProfile, refetchUser } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [userData, setUserData] = useState<UserProfileData | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({
    displayName: "",
    username: "",
    email: "",
    phone: "",
    bio: "",
    country: "",
    timezone: "UTC",
    language: "en",
    companyName: "",
    category: "Technology",
    description: "",
    website: "",
  });

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const activeMode = currentMode || userData?.currentMode || (userData?.accountType === "BUSINESS" ? "BUSINESS" : "PERSONAL");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          router.push("/login");
          return;
        }

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000/api/v1";
        const [res, bRes] = await Promise.all([
          fetch(`${baseUrl}/user/profile`, {
            headers: {
              "Authorization": `Bearer ${token}`
            }
          }),
          BusinessService.getProfile().catch(() => null)
        ]);

        const data = await res.json();
        const bData = bRes?.success ? bRes.data : businessProfile;

        if (data.success && data.data) {
          setUserData(data.data);
          if (data.data.currentMode) {
            updateCurrentMode(data.data.currentMode);
          }
          setFormData({
            displayName: data.data.profile.displayName || bData?.companyName || "",
            username: data.data.profile.username || "",
            email: data.data.email || "",
            phone: data.data.phone || "",
            bio: data.data.profile.bio || "",
            country: data.data.profile.country || "",
            timezone: data.data.profile.timezone || "UTC",
            language: data.data.profile.language || "en",
            companyName: bData?.companyName || data.data.profile.displayName || "",
            category: bData?.category || "Technology",
            description: bData?.description || "",
            website: bData?.website || "",
          });
          if (data.data.profile.avatarUrl) {
            setAvatarPreview(data.data.profile.avatarUrl);
          }
        } else {
          toast.error("Failed to load profile data");
        }
      } catch (error) {
        toast.error("Network error while fetching profile");
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, [router]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }
      setAvatarFile(file);
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
    }
  };

  const handleSaveProfile = () => {
    startTransition(async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000/api/v1";

        if (activeMode === "BUSINESS") {
          const cleanWebsite = formData.website?.trim() || null;
          const cleanDesc = formData.description?.trim() || null;
          const resBusiness = await BusinessService.updateProfile({
            companyName: (formData.companyName || formData.displayName || "My Business").trim(),
            category: (formData.category || "Technology").trim(),
            description: cleanDesc,
            website: cleanWebsite,
          }).catch(err => {
            console.error("Business profile update error:", err);
            return null;
          });
          if (resBusiness && !resBusiness.success && resBusiness.message) {
            toast.error(resBusiness.message);
          }
          await refetchBusinessProfile?.();
        }

        const submitData = new FormData();
        const effectiveName = activeMode === "BUSINESS" ? (formData.companyName || formData.displayName) : formData.displayName;
        if (effectiveName) submitData.append("displayName", effectiveName);
        if (formData.username) submitData.append("username", formData.username);
        if (formData.email !== undefined) submitData.append("email", formData.email);
        if (formData.bio) submitData.append("bio", formData.bio);
        if (formData.country) submitData.append("country", formData.country);
        if (formData.timezone) submitData.append("timezone", formData.timezone);
        if (formData.language) submitData.append("language", formData.language);
        if (avatarFile) submitData.append("avatar", avatarFile);

        const res = await fetch(`${baseUrl}/user/profile`, {
          method: "PATCH",
          headers: {
            "Authorization": `Bearer ${token}`
          },
          body: submitData
        });

        const data = await res.json();

        if (data.success || res.ok) {
          toast.success("Profile updated successfully!");
          await refetchUser?.();
        } else {
          toast.error(data.message || "Failed to update profile");
        }
      } catch (error) {
        toast.error("Network error while updating profile");
      }
    });
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");

      if (!token) {
        router.push("/login");
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000/api/v1";

      if (refreshToken) {
        await fetch(`${baseUrl}/auth/logout`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ refreshToken })
        }).catch(err => console.error("Logout API error:", err));
      }
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      document.cookie = "accessToken=; path=/; max-age=0";
      toast.success("Logged out successfully");
      router.push("/login");
    }
  };

  const refreshProfile = async () => {
    try {
      await Promise.all([
        refetchUser?.(),
        refetchBusinessProfile?.(),
      ]);
    } catch (err) {
      console.error("Failed to refresh profile:", err);
    }
  };

  return (
    <ProfileContext.Provider
      value={{
        userData,
        setUserData,
        formData,
        setFormData,
        avatarPreview,
        setAvatarPreview,
        avatarFile,
        setAvatarFile,
        fileInputRef,
        isLoading,
        isPending,
        activeMode,
        notificationsEnabled,
        setNotificationsEnabled,
        handleImageSelect,
        handleSaveProfile,
        handleLogout,
        businessProfile,
        refreshProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
}
