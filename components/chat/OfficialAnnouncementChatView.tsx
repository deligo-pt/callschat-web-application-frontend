"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Megaphone,
  ArrowLeft,
  Pin,
  Lock,
  Eye,
  CheckCheck,
  ExternalLink,
  Play,
  Clock,
  ShieldCheck,
  X,
  Volume2,
  VolumeX,
  Maximize2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { announcementService } from "@/services/announcement.service";
import type { AnnouncementItem, AnnouncementPriority } from "@/services/admin-announcement.service";
import { useSocket } from "@/components/providers/SocketProvider";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function OfficialAnnouncementChatView() {
  const router = useRouter();
  const { socket } = useSocket();
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeMediaModal, setActiveMediaModal] = useState<string | null>(null);
  const feedEndRef = useRef<HTMLDivElement>(null);

  const fetchAnnouncements = async () => {
    try {
      setIsLoading(true);
      const res = await announcementService.getAnnouncements(1, 50);
      if (res?.success) {
        setAnnouncements(res.data);
      }
      // Auto mark all announcements as read when opening official channel
      void announcementService.markAllAsRead().catch(() => {});
    } catch (err) {
      console.error("Failed to load official announcements:", err);
      toast.error("Failed to load official announcements");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // Real-time socket sync: Listen for new announcements broadcasted by admin
  useEffect(() => {
    if (!socket) return;

    const handleNewAnnouncement = (newAnn: AnnouncementItem) => {
      setAnnouncements((prev) => {
        if (prev.some((a) => a.id === newAnn.id)) return prev;
        return [newAnn, ...prev];
      });
      // Mark as read since user is actively viewing the channel
      void announcementService.markAsRead(newAnn.id).catch(() => {});
    };

    socket.on("announcement:new", handleNewAnnouncement);

    return () => {
      socket.off("announcement:new", handleNewAnnouncement);
    };
  }, [socket]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && activeMediaModal) {
        setActiveMediaModal(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeMediaModal]);

  const getPriorityBadge = (p: AnnouncementPriority) => {
    switch (p) {
      case "URGENT":
        return {
          pill: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25",
          dot: "bg-rose-500",
          cardAccent: "border-l-4 border-l-rose-500",
        };
      case "HIGH":
        return {
          pill: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25",
          dot: "bg-amber-500",
          cardAccent: "border-l-4 border-l-amber-500",
        };
      case "LOW":
        return {
          pill: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20",
          dot: "bg-slate-400",
          cardAccent: "border-l-2 border-l-slate-300 dark:border-l-slate-600",
        };
      default:
        return {
          pill: "bg-[#00A884]/10 text-[#008069] dark:text-[#00A884] border border-[#00A884]/25",
          dot: "bg-[#00A884]",
          cardAccent: "border-l-2 border-l-[#00A884]/40",
        };
    }
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#EFEAE2] dark:bg-[#0C1317] overflow-hidden select-text font-sans">
      {/* Official Channel Header */}
      <header className="flex items-center justify-between bg-white/95 dark:bg-[#202C33]/95 backdrop-blur-md px-4 py-3 border-b border-[#E2E8F0] dark:border-[#222D34] shadow-[0_1px_2px_rgba(0,0,0,0.04)] z-20 shrink-0 text-[#111B21] dark:text-[#E9EDEF]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/chats")}
            className="md:hidden rounded-full p-2 transition-colors hover:bg-black/5 dark:hover:bg-white/10 text-[#54656F] dark:text-[#8696A0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A884]"
            aria-label="Back to conversations list"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2} />
          </button>

          {/* Official Channel Avatar */}
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#00A884] to-[#128C7E] text-white shadow-sm">
            <Megaphone className="h-5 w-5 text-white" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <h1 className="text-[15.5px] font-bold text-[#111B21] dark:text-[#E9EDEF] tracking-tight">
                CallsChat Official
              </h1>
              <VerifiedBadge type="BUSINESS" size="xs" showTooltip={false} />
            </div>
            <span className="text-[11.5px] text-[#54656F] dark:text-[#8696A0] font-medium flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-[#00A884]" />
              Verified Official Channel · Read-only
            </span>
          </div>
        </div>

        {/* Security badge pill */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-[#00A884]/10 dark:bg-[#00A884]/15 border border-[#00A884]/25 px-3 py-1 text-xs font-semibold text-[#008069] dark:text-[#00A884]">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Official Announcements</span>
        </div>
      </header>

      {/* Announcements Stream */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4.5 custom-scrollbar">
        {/* Safety Header Banner */}
        <div className="mx-auto max-w-lg rounded-xl bg-white/90 dark:bg-[#182229]/90 border border-[#E2E8F0] dark:border-[#222D34] py-2.5 px-4 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04)] backdrop-blur-xs">
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[#008069] dark:text-[#00A884]">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Official CallsChat Broadcast Feed</span>
          </div>
          <p className="mt-0.5 text-[11px] text-[#54656F] dark:text-[#8696A0] leading-relaxed">
            All messages in this feed are official communications verified by CallsChat administrators.
            Members cannot post in this channel.
          </p>
        </div>

        {/* Loading Skeletons */}
        {isLoading ? (
          <div className="mx-auto w-full max-w-2xl flex flex-col gap-4 animate-pulse">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="rounded-2xl bg-white dark:bg-[#1F2C34] border border-[#E2E8F0] dark:border-[#222D34] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded-full" />
                  <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
                </div>
                <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-700 rounded-md" />
                <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-md" />
                <div className="h-4 w-5/6 bg-slate-100 dark:bg-slate-800 rounded-md" />
                <div className="h-8 w-full bg-slate-200 dark:bg-slate-700 rounded-xl mt-2" />
              </div>
            ))}
          </div>
        ) : announcements.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center p-12 text-center my-auto">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#00A884]/15 text-[#008069] dark:text-[#00A884] mb-3 border border-[#00A884]/20 shadow-xs">
              <Megaphone className="h-7 w-7" />
            </div>
            <h2 className="text-base font-bold text-[#111B21] dark:text-[#E9EDEF]">
              No Announcements Yet
            </h2>
            <p className="mt-1 text-xs text-[#54656F] dark:text-[#8696A0] max-w-xs leading-relaxed">
              When platform updates, maintenance notices, or new features are released, they will appear here.
            </p>
          </div>
        ) : (
          announcements.map((item) => {
            const priorityConfig = getPriorityBadge(item.priority);
            return (
              <article
                key={item.id}
                className={cn(
                  "mx-auto w-full max-w-2xl rounded-2xl bg-white dark:bg-[#1F2C34] shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-[#E2E8F0] dark:border-[#222D34] overflow-hidden transition-all duration-150 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]",
                  priorityConfig.cardAccent
                )}
              >
                {/* Announcement Card Header Strip */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#F0F2F5] dark:border-[#222D34] bg-[#F7F5F3]/60 dark:bg-[#182229]/60">
                  <div className="flex items-center gap-2">
                    {item.isPinned && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 px-2 py-0.5 text-[10px] font-bold border border-amber-500/30">
                        <Pin className="h-2.5 w-2.5" /> PINNED
                      </span>
                    )}
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                        priorityConfig.pill
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", priorityConfig.dot)} />
                      {item.priority}
                    </span>
                  </div>

                  <span className="text-[11.5px] text-[#54656F] dark:text-[#8696A0] font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3 text-[#8696A0]" />
                    {formatDate(item.publishedAt || item.createdAt)}
                  </span>
                </div>

                {/* Media Attachment (Video or Image) */}
                {item.mediaUrl && (
                  <div className="relative bg-black flex items-center justify-center overflow-hidden border-b border-[#F0F2F5] dark:border-[#222D34]">
                    {item.mediaType === "VIDEO" ? (
                      <div className="w-full aspect-video relative flex items-center justify-center bg-black">
                        <video
                          src={item.mediaUrl}
                          controls
                          playsInline
                          preload="metadata"
                          className="w-full h-full object-contain max-h-[380px]"
                        />
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setActiveMediaModal(item.mediaUrl || null)}
                        className="w-full relative group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A884]"
                        aria-label={`View full image for ${item.title}`}
                      >
                        <img
                          src={item.mediaUrl}
                          alt={item.title}
                          className="w-full max-h-[380px] object-cover transition-opacity duration-150 group-hover:opacity-95"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-[11px] font-medium px-3 py-1.5 rounded-full backdrop-blur-xs">
                            Click to expand image
                          </span>
                        </div>
                      </button>
                    )}
                  </div>
                )}

                {/* Announcement Content */}
                <div className="p-4 sm:p-5 flex flex-col gap-2.5">
                  <h2 className="text-[16px] sm:text-[17px] font-bold text-[#111B21] dark:text-[#E9EDEF] tracking-tight leading-snug">
                    {item.title}
                  </h2>

                  <p className="text-[13.5px] text-[#3B4A54] dark:text-[#D1D7DB] leading-relaxed whitespace-pre-wrap font-normal">
                    {item.content}
                  </p>

                  {/* Interactive Action Button (Call-to-Action) */}
                  {item.actionText && item.actionUrl && (
                    <div className="mt-2 pt-3 border-t border-[#F0F2F5] dark:border-[#222D34]">
                      <a
                        href={item.actionUrl}
                        target={item.actionUrl.startsWith("http") ? "_blank" : "_self"}
                        rel="noreferrer"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#00A884] hover:bg-[#008F6F] active:bg-[#007A5E] px-4 py-2.5 text-[13px] font-semibold text-white shadow-xs transition-all duration-120 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A884] focus-visible:ring-offset-2"
                      >
                        <span>{item.actionText}</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  )}

                  {/* Footer Stats & Read Receipt Indicator */}
                  <div className="mt-2 flex items-center justify-between text-[11.5px] text-[#54656F] dark:text-[#8696A0] pt-2.5 border-t border-[#F0F2F5] dark:border-[#222D34]/50">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Eye className="h-3.5 w-3.5 text-[#8696A0]" />
                      <span>{item.viewsCount} views</span>
                    </span>

                    <span className="flex items-center gap-1 text-[#53BDEB] font-medium">
                      <CheckCheck className="h-4 w-4" />
                      <span>Verified Broadcast</span>
                    </span>
                  </div>
                </div>
              </article>
            );
          })
        )}
        <div ref={feedEndRef} />
      </main>

      {/* Locked Read-Only Bottom Bar */}
      <footer className="shrink-0 bg-white/95 dark:bg-[#111B21]/95 border-t border-[#E2E8F0] dark:border-[#222D34] px-4 py-3 shadow-[0_-1px_3px_rgba(0,0,0,0.03)]">
        <div className="mx-auto max-w-2xl rounded-xl bg-[#F0F2F5] dark:bg-[#202C33] border border-[#E2E8F0] dark:border-[#2A3942] py-2.5 px-4 flex items-center justify-center gap-2 text-center">
          <Lock className="h-4 w-4 text-[#54656F] dark:text-[#8696A0] shrink-0" />
          <span className="text-[12.5px] font-semibold text-[#54656F] dark:text-[#8696A0]">
            🔒 This is an official announcement channel. Only administrators can post messages.
          </span>
        </div>
      </footer>

      {/* Image Lightbox Modal */}
      {activeMediaModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Expanded media preview"
          onClick={() => setActiveMediaModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md cursor-pointer animate-in fade-in duration-150"
        >
          <button
            onClick={() => setActiveMediaModal(null)}
            className="absolute top-4 right-4 rounded-full bg-black/60 p-2.5 text-white hover:bg-black/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Close image preview"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={activeMediaModal}
            alt="Expanded view"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
