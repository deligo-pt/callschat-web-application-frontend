"use client";

import React, { useState } from "react";
import { 
  ArrowLeft, 
  ArrowRight, 
  Camera, 
  Image as ImageIcon, 
  Search, 
  Megaphone, 
  Check, 
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { communityService } from "@/services/community.service";
import { uploadMedia } from "@/services/business.service";

export interface CommunityItem {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  memberCount: number;
  groupCount?: number;
  iconBg?: string;
  iconColor?: string;
  myRole?: string;
}

interface CreateCommunitiesUIProps {
  onBack: () => void;
  onCommunityCreated: (newCommunity: CommunityItem) => void;
}

interface SuggestedGroup {
  id: string;
  name: string;
  icon: string | React.ReactNode;
}

const CATEGORIES = [
  { id: "Technology", label: "Technology", icon: "✨" },
  { id: "Business", label: "Business", icon: "🏢" },
  { id: "Education", label: "Education", icon: "📖" },
  { id: "News", label: "News", icon: "📢" },
];

const SUGGESTED_GROUPS_LIST: SuggestedGroup[] = [
  { id: "mgmt", name: "Management Team", icon: "👥" },
  { id: "sales", name: "Sales Team", icon: "💼" },
  { id: "dev", name: "Dev Team", icon: "💻" },
  { id: "mktg", name: "Marketing", icon: "📈" },
];

export function CreateCommunitiesUI({ onBack, onCommunityCreated }: CreateCommunitiesUIProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [buttonStage, setButtonStage] = useState<"continue" | "create">("continue");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Step 1 State
  const [communityName, setCommunityName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Technology");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Step 2 State
  const [groupSearchQuery, setGroupSearchQuery] = useState("");
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(["mgmt", "sales"]);

  const handleNextToStep2 = () => {
    if (!communityName.trim()) {
      toast.error("Please enter a community name to continue");
      return;
    }
    setStep(2);
    setButtonStage("continue");
  };

  const handleToggleGroup = (groupId: string) => {
    setSelectedGroupIds((prev) => {
      const isCurrentlySelected = prev.includes(groupId);
      const updated = isCurrentlySelected
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId];
        
      if (updated.length > 0 && buttonStage === "continue") {
        setButtonStage("create");
      }
      return updated;
    });
  };

  const handleStep2Action = async () => {
    if (buttonStage === "continue") {
      setButtonStage("create");
      toast.info("Review your selected groups and click Create when ready");
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      let finalAvatarUrl: string | undefined = undefined;
      
      if (avatarFile) {
        toast.info("Uploading community avatar...");
        const mediaRes = await uploadMedia(avatarFile);
        finalAvatarUrl = mediaRes.url;
      }

      const selectedGroupNames = selectedGroupIds.map(
        (id) => SUGGESTED_GROUPS_LIST.find((g) => g.id === id)?.name || id
      );

      const res = await communityService.createCommunity({
        name: communityName.trim(),
        description: description.trim() || undefined,
        category,
        avatarUrl: finalAvatarUrl,
        groupNames: selectedGroupNames,
      });

      if (res.success && res.data) {
        toast.success(`🎉 "${res.data.name}" community created successfully!`);
        onCommunityCreated({
          ...res.data,
          iconBg: "bg-blue-100",
          iconColor: "text-blue-600",
        });
      } else {
        toast.error(res.error || "Failed to create community");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("An error occurred while creating the community");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSuggestedGroups = SUGGESTED_GROUPS_LIST.filter((g) =>
    g.name.toLowerCase().includes(groupSearchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-1 flex-col h-full w-full bg-white sm:bg-[#F8FAFC]/50 overflow-hidden relative select-none">
      {/* Blue Top Header Bar */}
      <header className="h-[68px] bg-[#2563EB] text-white px-6 sm:px-8 flex items-center gap-3.5 shrink-0 shadow-sm z-10 w-full">
        <button
          onClick={() => {
            if (step === 2) {
              setStep(1);
            } else {
              onBack();
            }
          }}
          disabled={isSubmitting}
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/15 transition-colors text-white disabled:opacity-50"
          title="Back"
        >
          <ArrowLeft className="h-5 w-5 stroke-[2.2]" />
        </button>
        <h1 className="text-[18px] sm:text-[20px] font-bold tracking-tight text-white select-none">
          Create Communities
        </h1>
      </header>

      {/* Main Form Scrollable Area */}
      <div className="flex-1 overflow-y-auto px-4 py-8 sm:p-10 flex flex-col items-center w-full">
        {step === 1 ? (
          /* Step 1: Basic Community Info (Image 1) */
          <div className="flex flex-col items-center w-full max-w-[480px] animate-in fade-in-50 duration-300">
            {/* Circular Avatar Upload Placeholder */}
            <div 
              className="relative mb-8 mt-2 cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="h-[116px] w-[116px] rounded-full bg-[#EFF4FF] border border-[#E0E7FF] flex items-center justify-center shadow-md shadow-blue-500/5 group-hover:bg-blue-100/60 transition-colors overflow-hidden">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-10 w-10 text-[#94A3B8] group-hover:text-[#64748B] transition-colors" />
                )}
              </div>
              <div className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-[#2563EB] text-white flex items-center justify-center shadow-md border-2 border-white group-hover:bg-blue-700 transition-colors">
                <Camera className="h-4 w-4" />
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setAvatarFile(file);
                    setAvatarPreview(URL.createObjectURL(file));
                  }
                }}
              />
            </div>

            {/* Form Fields */}
            <div className="w-full space-y-6">
              {/* Community Name */}
              <div>
                <label className="block text-[13px] font-bold text-[#0F172A] mb-2 select-none">
                  Community Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={communityName}
                  onChange={(e) => setCommunityName(e.target.value)}
                  placeholder="Type your community name"
                  className="w-full h-12 rounded-xl border border-[#E2E8F0] bg-white px-4 text-sm font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15 shadow-2xs transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-2 select-none">
                  <label className="text-[13px] font-bold text-[#0F172A]">
                    Description
                  </label>
                  <span className="text-[11px] font-semibold text-[#94A3B8]">
                    {description.length}/300 · Optional
                  </span>
                </div>
                <textarea
                  rows={4}
                  maxLength={300}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this community about?"
                  className="w-full rounded-xl border border-[#E2E8F0] bg-white p-4 text-sm font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15 shadow-2xs transition-all resize-none"
                />
              </div>

              {/* Category Selection */}
              <div>
                <label className="block text-[13px] font-bold text-[#0F172A] mb-3 select-none">
                  Category
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {CATEGORIES.map((cat) => {
                    const isSelected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={cn(
                          "px-4 py-2 rounded-full text-[13px] flex items-center gap-2 cursor-pointer transition-all select-none font-semibold",
                          isSelected
                            ? "bg-[#2563EB] text-white font-bold shadow-sm shadow-blue-500/20"
                            : "bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]/80 border border-transparent"
                        )}
                      >
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Continue Button */}
            <div className="mt-10 flex justify-center w-full">
              <button
                type="button"
                onClick={handleNextToStep2}
                className="h-12 w-full max-w-xs rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-[14px] shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2.5 group"
              >
                <span>Continue</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        ) : (
          /* Step 2: Groups Setup (Images 2, 3, 4) */
          <div className="flex flex-col w-full max-w-[540px] animate-in fade-in-50 duration-300 space-y-5">
            {/* Announcement Notice Banner */}
            <div className="rounded-2xl bg-[#EFF6FF] border border-[#DBEAFE] p-4 flex items-start gap-3.5 text-[#1E40AF] select-none">
              <div className="h-9 w-9 rounded-xl bg-white border border-blue-200 flex items-center justify-center text-[#2563EB] shrink-0 shadow-2xs mt-0.5">
                <Megaphone className="h-4 w-4 fill-blue-600/20" />
              </div>
              <p className="text-[13px] font-medium leading-relaxed">
                An <strong className="font-bold text-[#2563EB]">Announcements</strong> group is created automatically.<br />
                Add more groups for your teams.
              </p>
            </div>

            {/* Search input for group or channel */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
              <input
                type="text"
                value={groupSearchQuery}
                onChange={(e) => setGroupSearchQuery(e.target.value)}
                placeholder="search group ,channel"
                className="w-full h-12 rounded-xl border border-[#E2E8F0] bg-white pl-11 pr-4 text-sm font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15 shadow-2xs transition-all"
              />
            </div>

            {/* Required Announcements Card */}
            <div className="rounded-2xl border border-[#DBEAFE] bg-white p-4 flex items-center justify-between shadow-2xs select-none">
              <div className="flex items-center gap-3.5">
                <div className="h-11 w-11 rounded-xl bg-[#2563EB] text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/25">
                  <Megaphone className="h-5 w-5 fill-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[14px] font-bold text-[#0F172A] flex items-center gap-1.5">
                    📢 Announcements
                  </span>
                  <span className="text-[11px] font-semibold text-[#64748B]">
                    Auto-created · Admin only
                  </span>
                </div>
              </div>
              <span className="rounded-full bg-[#EFF6FF] border border-[#DBEAFE] px-3 py-1 text-[11px] font-bold text-[#2563EB] tracking-wide">
                Required
              </span>
            </div>

            {/* Suggested Groups Section Header */}
            <div className="pt-2">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-3 select-none">
                SUGGESTED GROUPS
              </h3>
              
              <div className="space-y-2.5">
                {filteredSuggestedGroups.map((group) => {
                  const isSelected = selectedGroupIds.includes(group.id);
                  return (
                    <div
                      key={group.id}
                      onClick={() => !isSubmitting && handleToggleGroup(group.id)}
                      className={cn(
                        "rounded-2xl border p-4 flex items-center justify-between transition-all cursor-pointer select-none",
                        isSelected
                          ? "border-[#2563EB] bg-[#EFF6FF]/40 shadow-xs"
                          : "border-[#E2E8F0] bg-white hover:border-[#CBD5E1]",
                        isSubmitting ? "opacity-60 cursor-not-allowed" : ""
                      )}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="h-10 w-10 rounded-xl bg-[#F1F5F9] flex items-center justify-center text-slate-700 text-lg shrink-0">
                          {group.icon}
                        </div>
                        <span className="text-[14px] font-bold text-[#0F172A]">
                          {group.name}
                        </span>
                      </div>

                      <div className="flex items-center shrink-0">
                        {isSelected ? (
                          <div className="h-6 w-6 rounded-full bg-[#2563EB] text-white flex items-center justify-center shadow-sm shadow-blue-500/30 transition-transform scale-105">
                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="h-6 w-6 rounded-full border-2 border-[#CBD5E1] bg-transparent hover:border-[#94A3B8] transition-colors" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Continue / Create Action Button */}
            <div className="mt-8 pt-2 flex justify-center w-full">
              <button
                type="button"
                onClick={handleStep2Action}
                disabled={isSubmitting}
                className={cn(
                  "h-12 w-full max-w-xs rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-[14px] shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 group select-none disabled:opacity-75",
                  buttonStage === "create" ? "px-10" : ""
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Creating Hub...</span>
                  </>
                ) : buttonStage === "continue" ? (
                  <>
                    <span>Continue</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                ) : (
                  <span>Create</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
