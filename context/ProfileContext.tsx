"use client";

import React, { createContext, useContext, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useUser } from "@/context/UserContext";
import { BusinessService } from "@/services/business.service";
import { UserService } from "@/services/user.service";
import { getOptimizedImageUrl, compressImage } from "@/utils/image";

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
  updateUserEmail: (newEmail: string | null) => Promise<boolean>;
  handleLogout: () => Promise<void>;
  businessProfile: any;
  refreshProfile?: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { 
    user: globalUser, 
    isLoading: isGlobalLoading, 
    currentMode, 
    updateCurrentMode, 
    businessProfile, 
    refetchBusinessProfile, 
    refetchUser 
  } = useUser();
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
    if (isGlobalLoading) return; // Wait for UserContext to finish its initial fetch

    if (!globalUser) {
      router.push("/login");
      return;
    }

    setUserData(globalUser);

    setFormData(prev => ({
      ...prev,
      displayName: globalUser.profile?.displayName || businessProfile?.companyName || "",
      username: globalUser.profile?.username || "",
      email: globalUser.email || "",
      phone: globalUser.phone || "",
      bio: globalUser.profile?.bio || "",
      country: globalUser.profile?.country || "",
      timezone: globalUser.profile?.timezone || "UTC",
      language: globalUser.profile?.language || "en",
      companyName: businessProfile?.companyName || globalUser.profile?.displayName || "",
      category: businessProfile?.category || "Technology",
      description: businessProfile?.description || "",
      website: businessProfile?.website || "",
    }));

    if (globalUser.profile?.avatarUrl && !avatarFile) {
      setAvatarPreview(getOptimizedImageUrl(globalUser.profile.avatarUrl, 200, 200));
    }

    setIsLoading(false);
  }, [globalUser, businessProfile, isGlobalLoading, router]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Show loading toast if it's a huge file that might take a second to compress
      let toastId;
      if (file.size > 2 * 1024 * 1024) {
        toastId = toast.loading("Optimizing image...");
      }

      try {
        // Compress the image down to a max dimension of 800px and 70% JPEG quality
        // This takes a 10MB photo and turns it into a ~150KB fast-loading avatar!
        const compressedFile = await compressImage(file, 800, 0.7);
        
        if (toastId) toast.dismiss(toastId);
        
        setAvatarFile(compressedFile);
        const url = URL.createObjectURL(compressedFile);
        setAvatarPreview(url);
      } catch (err) {
        if (toastId) toast.dismiss(toastId);
        toast.error("Failed to process image");
      }
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
        if (avatarFile) {
          submitData.append("avatar", avatarFile);
        }

        const data = await UserService.updateProfile(submitData).catch((err: any) => {
          console.error("Profile update error:", err);
          return err?.response?.data || null;
        });

        if (data && data.success) {
          if (data.data) {
            setUserData(prev => prev ? { ...prev, email: data.data.email !== undefined ? data.data.email : prev.email } : prev);
          }
          toast.success("Profile updated successfully!");
          await refetchUser?.();
        } else {
          toast.error(data?.error?.message || data?.message || "Failed to update profile");
        }
      } catch (error) {
        toast.error("Network error while updating profile");
      }
    });
  };

  const updateUserEmail = async (newEmail: string | null): Promise<boolean> => {
    try {
      const res = await UserService.updateEmail({ email: newEmail });
      if (res && res.success) {
        setFormData(prev => ({ ...prev, email: res.data.email || "" }));
        setUserData(prev => prev ? { ...prev, email: res.data.email } : prev);
        toast.success("Email address updated successfully!");
        await refetchUser?.();
        return true;
      } else {
        toast.error(res?.error?.message || res?.message || "Failed to update email address");
        return false;
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || "Error updating email address");
      return false;
    }
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
        updateUserEmail,
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
