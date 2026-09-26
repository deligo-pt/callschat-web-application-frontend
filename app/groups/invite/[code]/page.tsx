"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Lock,
  ShieldCheck,
  Clock,
  AlertCircle,
  Loader2,
  ArrowRight,
  MessageSquare,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { groupService } from "@/services/group.service";
import { getOptimizedImageUrl } from "@/utils/image";
import { toast } from "sonner";

interface GroupPreviewData {
  id: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  isPublic: boolean;
  maxMembers: number;
  memberCount: number;
  joinApprovalMode: "DIRECT" | "APPROVAL_REQUIRED";
  createdAt: string;
  isAlreadyMember?: boolean;
  hasPendingRequest?: boolean;
}

export default function GroupInvitePage() {
  const params = useParams();
  const router = useRouter();
  const inviteCode = (params?.code as string) || "";

  const [preview, setPreview] = useState<GroupPreviewData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      setIsAuthenticated(Boolean(token));
    }
  }, []);

  useEffect(() => {
    if (!inviteCode) {
      setErrorMessage("No invite code was provided.");
      setIsLoading(false);
      return;
    }

    async function loadGroupPreview() {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        const response = await groupService.previewGroupByInvite(inviteCode);

        if (response.success && response.data) {
          setPreview(response.data);
        } else {
          setErrorMessage(response.error || "This invite link is invalid or has expired.");
        }
      } catch {
        setErrorMessage("Failed to load group information. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    loadGroupPreview();
  }, [inviteCode]);

  const handleJoinGroup = async () => {
    if (!preview || !inviteCode) return;

    if (!isAuthenticated) {
      const returnUrl = encodeURIComponent(`/groups/invite/${inviteCode}`);
      router.push(`/login?returnUrl=${returnUrl}`);
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await groupService.joinGroupByInvite(inviteCode);

      if (response.success && response.data) {
        const result = response.data;

        if (result.status === "ALREADY_MEMBER") {
          toast.info("You are already a member of this group");
          router.push(`/groups/${preview.id}`);
          return;
        }

        if (result.status === "APPROVAL_PENDING") {
          toast.success("Join request submitted! An admin will review your request.");
          setPreview((prev) => (prev ? { ...prev, hasPendingRequest: true } : null));
          return;
        }

        if (result.status === "JOINED") {
          toast.success(`Joined "${preview.name}" successfully!`);
          router.push(`/groups/${preview.id}`);
          return;
        }
      } else {
        toast.error(response.error || "Failed to join group");
      }
    } catch {
      toast.error("An unexpected error occurred while joining");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenGroupChat = () => {
    if (preview?.id) {
      router.push(`/groups/${preview.id}`);
    }
  };

  const handleGoToLogin = () => {
    const returnUrl = encodeURIComponent(`/groups/invite/${inviteCode}`);
    router.push(`/login?returnUrl=${returnUrl}`);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F0F2F5] dark:bg-[#0C1317] p-4 font-sans antialiased text-gray-900 dark:text-gray-100">
      {/* Brand Header */}
      <div className="mb-6 flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-md">
          <MessageSquare className="w-5 h-5 fill-current" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
            CallsChat
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Group Invite</p>
        </div>
      </div>

      {/* Main Preview Card */}
      <div className="w-full max-w-md bg-white dark:bg-[#111B21] rounded-2xl shadow-xl border border-black/5 dark:border-white/10 overflow-hidden">
        {/* Loading View */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 px-6 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Loading group information...
            </p>
          </div>
        )}

        {/* Error / Invalid Link View */}
        {!isLoading && errorMessage && (
          <div className="p-8 flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Invalid Invite Link
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-400 max-w-xs leading-relaxed">
                {errorMessage}
              </p>
            </div>
            <Button
              type="button"
              onClick={() => router.push("/chats")}
              className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl h-11 text-sm shadow-xs"
            >
              Go to Chats
            </Button>
          </div>
        )}

        {/* Active Group Preview View */}
        {!isLoading && !errorMessage && preview && (
          <div>
            {/* Group Banner / Avatar Area */}
            <div className="relative pt-8 pb-4 px-6 flex flex-col items-center text-center border-b border-gray-100 dark:border-gray-800/80 bg-gray-50/50 dark:bg-[#182229]/40">
              <div className="relative mb-3.5">
                {preview.avatarUrl ? (
                  <img
                    src={getOptimizedImageUrl(preview.avatarUrl, 160, 160)}
                    alt={preview.name}
                    className="w-24 h-24 rounded-full object-cover shadow-md border-2 border-white dark:border-[#202C33]"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white text-3xl font-bold shadow-md border-2 border-white dark:border-[#202C33]">
                    {preview.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              <h2 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-1 px-4">
                {preview.name}
              </h2>

              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
                  <Users className="w-3.5 h-3.5" />
                  <span>
                    {preview.memberCount} {preview.memberCount === 1 ? "participant" : "participants"}
                  </span>
                </span>
                {preview.joinApprovalMode === "APPROVAL_REQUIRED" && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Approval Required
                  </span>
                )}
              </div>
            </div>

            {/* Content & Details */}
            <div className="p-6 space-y-5">
              {/* Group Description */}
              {preview.description ? (
                <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#182229] border border-gray-100 dark:border-gray-800 text-xs text-gray-700 dark:text-gray-300 leading-relaxed max-h-32 overflow-y-auto">
                  {preview.description}
                </div>
              ) : (
                <p className="text-xs text-center text-gray-400 italic">
                  No description provided for this group.
                </p>
              )}

              {/* End-to-End Encryption Notice */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 text-xs border border-emerald-100/80 dark:border-emerald-900/30">
                <Lock className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                <p className="text-[11px] leading-relaxed">
                  Messages and calls in this group are protected with end-to-end encryption.
                </p>
              </div>

              {/* Action Buttons Based on Status */}
              <div className="space-y-2.5 pt-1">
                {/* 1. Unauthenticated Visitor */}
                {!isAuthenticated && (
                  <Button
                    type="button"
                    onClick={handleGoToLogin}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl h-11 text-sm shadow-xs flex items-center justify-center gap-2"
                  >
                    <span>Log in to Join Group</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                )}

                {/* 2. Authenticated - Already a Member */}
                {isAuthenticated && preview.isAlreadyMember && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium py-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>You are already a member of this group</span>
                    </div>
                    <Button
                      type="button"
                      onClick={handleOpenGroupChat}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl h-11 text-sm shadow-xs flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Open Group Chat</span>
                    </Button>
                  </div>
                )}

                {/* 3. Authenticated - Pending Approval Request */}
                {isAuthenticated && !preview.isAlreadyMember && preview.hasPendingRequest && (
                  <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-center space-y-1.5">
                    <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
                      <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>Join Request Pending</span>
                    </div>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400">
                      An administrator must approve your request before you can access this group.
                    </p>
                  </div>
                )}

                {/* 4. Authenticated - Not a Member & Needs Approval */}
                {isAuthenticated &&
                  !preview.isAlreadyMember &&
                  !preview.hasPendingRequest &&
                  preview.joinApprovalMode === "APPROVAL_REQUIRED" && (
                    <Button
                      type="button"
                      onClick={handleJoinGroup}
                      disabled={isSubmitting}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl h-11 text-sm shadow-xs flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="w-4 h-4" />
                      )}
                      <span>{isSubmitting ? "Submitting Request..." : "Request to Join Group"}</span>
                    </Button>
                  )}

                {/* 5. Authenticated - Not a Member & Direct Join */}
                {isAuthenticated &&
                  !preview.isAlreadyMember &&
                  !preview.hasPendingRequest &&
                  preview.joinApprovalMode === "DIRECT" && (
                    <Button
                      type="button"
                      onClick={handleJoinGroup}
                      disabled={isSubmitting}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl h-11 text-sm shadow-xs flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ArrowRight className="w-4 h-4" />
                      )}
                      <span>{isSubmitting ? "Joining Group..." : "Join Group"}</span>
                    </Button>
                  )}

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.push("/chats")}
                  className="w-full text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 h-9"
                >
                  Cancel
                </Button>
              </div>

              {!isAuthenticated && (
                <div className="text-center pt-1 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-[11px] text-gray-500">
                    Don&apos;t have an account?{" "}
                    <Link
                      href={`/register?returnUrl=${encodeURIComponent(`/groups/invite/${inviteCode}`)}`}
                      className="text-emerald-600 hover:underline font-semibold"
                    >
                      Create an account
                    </Link>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
