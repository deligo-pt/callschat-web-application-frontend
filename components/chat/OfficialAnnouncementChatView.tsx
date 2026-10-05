"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Megaphone,
  ArrowLeft,
  Pin,
  Lock,
  Eye,
  CheckCheck,
  ExternalLink,
  Clock,
  ShieldCheck,
  X,
  Share2,
  Sparkles,
  Info,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { announcementService } from "@/services/announcement.service";
import type { AnnouncementItem, AnnouncementPriority } from "@/services/admin-announcement.service";
import { useSocket } from "@/components/providers/SocketProvider";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/** Helper to format URLs inside announcement text as clickable hyperlinks */
function formatAnnouncementText(text: string) {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.split(urlRegex).map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#00A884] dark:text-[#25D366] font-medium underline underline-offset-2 hover:opacity-85 transition-opacity break-all inline-flex items-center gap-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          <span>{part}</span>
          <ExternalLink className="h-3 w-3 inline shrink-0" />
        </a>
      );
    }
    return part;
  });
}

/** Formats a timestamp into a clean 12-hour string (e.g. 01:55 AM) */
function formatTime(isoString?: string | null) {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** Calculates date group label (Today, Yesterday, or full date) */
function getDateGroupLabel(isoString?: string | null): string {
  if (!isoString) return "Recent";
  const date = new Date(isoString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const itemDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((today.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString([], {
    month: "long",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

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
      if (res?.success && Array.isArray(res.data)) {
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

  // Handle ESC key to close lightbox modal
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
          label: "Urgent",
        };
      case "HIGH":
        return {
          pill: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25",
          dot: "bg-amber-500",
          label: "Important",
        };
      case "LOW":
        return {
          pill: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20",
          dot: "bg-slate-400",
          label: "Notice",
        };
      default:
        return {
          pill: "bg-[#00A884]/10 text-[#008069] dark:text-[#00A884] border border-[#00A884]/25",
          dot: "bg-[#00A884]",
          label: "Official",
        };
    }
  };

  const handleShare = (item: AnnouncementItem) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      const shareUrl = `${window.location.origin}/chats/official?id=${item.id}`;
      navigator.clipboard.writeText(`${item.title}\n\n${item.content}\n\n${shareUrl}`);
      toast.success("Announcement copied to clipboard");
    }
  };

  // Group announcements chronologically for WhatsApp date separators
  const groupedAnnouncements = useMemo(() => {
    // Sort oldest to newest for classic chat bottom flow, or newest first depending on preference
    // WhatsApp channels display chronologically descending or ascending; in chat stream, newest at bottom
    const sorted = [...announcements].sort((a, b) => {
      const tA = new Date(a.publishedAt || a.createdAt).getTime();
      const tB = new Date(b.publishedAt || b.createdAt).getTime();
      return tA - tB; // ascending order so newest is at the bottom
    });

    const groups: { dateGroup: string; items: AnnouncementItem[] }[] = [];
    sorted.forEach((item) => {
      const label = getDateGroupLabel(item.publishedAt || item.createdAt);
      const existingGroup = groups.find((g) => g.dateGroup === label);
      if (existingGroup) {
        existingGroup.items.push(item);
      } else {
        groups.push({ dateGroup: label, items: [item] });
      }
    });

    return groups;
  }, [announcements]);

  return (
    <div className="flex flex-col h-full w-full bg-[#EFEAE2] dark:bg-[#0B141A] chat-canvas-bg overflow-hidden select-text font-sans">
      {/* ── WhatsApp Official Channel Top Bar ─────────────────────────────── */}
      <header className="flex items-center justify-between bg-[#FFFFFF]/95 dark:bg-[#202C33]/95 backdrop-blur-md px-4 py-2.5 border-b border-[#E2E8F0] dark:border-[#222D34] shadow-[0_1px_2px_rgba(11,20,26,0.06)] z-20 shrink-0 text-[#111B21] dark:text-[#E9EDEF]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/chats")}
            className="md:hidden rounded-full p-2 transition-colors hover:bg-black/5 dark:hover:bg-white/10 text-[#54656F] dark:text-[#8696A0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A884]"
            aria-label="Back to conversations list"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2} />
          </button>

          {/* Official Channel Avatar */}
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#00A884] to-[#128C7E] text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10">
            <Megaphone className="h-5 w-5 text-white" />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-[15.5px] font-bold text-[#111B21] dark:text-[#E9EDEF] tracking-tight truncate">
                CallsChat Official
              </h1>
              <VerifiedBadge type="BUSINESS" size="xs" showTooltip={false} />
            </div>
            <span className="text-[11.5px] text-[#54656F] dark:text-[#8696A0] font-medium flex items-center gap-1 truncate">
              <ShieldCheck className="h-3 w-3 text-[#00A884] shrink-0" />
              Verified Official Channel · Read-only
            </span>
          </div>
        </div>

        {/* Security badge pill */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-[#00A884]/10 dark:bg-[#00A884]/15 border border-[#00A884]/25 px-3 py-1 text-xs font-semibold text-[#008069] dark:text-[#00A884]">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
          <span>Official Announcements</span>
        </div>
      </header>

      {/* ── WhatsApp Announcements Stream ─────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 flex flex-col gap-5 custom-scrollbar">
        {/* Safety Header Banner (WhatsApp Style intro card) */}
        <div className="mx-auto max-w-xl w-full rounded-2xl bg-white/90 dark:bg-[#182229]/90 border border-black/5 dark:border-white/10 py-3 px-4 text-center shadow-[0_1px_2px_rgba(11,20,26,0.08)] backdrop-blur-xs">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#008069] dark:text-[#00A884]">
            <ShieldCheck className="h-4 w-4 shrink-0 text-[#00A884]" />
            <span>Official CallsChat Broadcast Feed</span>
          </div>
          <p className="mt-1 text-[11.5px] text-[#54656F] dark:text-[#8696A0] leading-relaxed">
            All messages in this feed are official communications verified by CallsChat administrators.
            Members cannot post in this channel.
          </p>
        </div>

        {/* Loading Skeletons */}
        {isLoading ? (
          <div className="mx-auto w-full max-w-xl flex flex-col gap-4 animate-pulse">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="rounded-2xl rounded-tl-[4px] bg-white dark:bg-[#1F2C34] border border-[#E2E8F0] dark:border-[#222D34] p-4 shadow-[0_1px_2px_rgba(11,20,26,0.12)] flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <div className="h-4 w-28 bg-slate-200 dark:bg-slate-700 rounded-full" />
                  <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
                </div>
                <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-700 rounded-md" />
                <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-md" />
                <div className="h-4 w-5/6 bg-slate-100 dark:bg-slate-800 rounded-md" />
                <div className="h-9 w-full bg-slate-200 dark:bg-slate-700 rounded-xl mt-2" />
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
              When platform updates, security notices, or new features are released, they will appear here.
            </p>
          </div>
        ) : (
          /* Render grouped announcements with WhatsApp date dividers */
          groupedAnnouncements.map((group) => (
            <div key={group.dateGroup} className="flex flex-col gap-4">
              {/* WhatsApp Centered Floating Date Divider */}
              <div className="flex justify-center my-1 select-none">
                <span className="rounded-lg bg-white/90 dark:bg-[#182229]/90 px-3 py-1 text-[11px] font-semibold text-[#54656F] dark:text-[#8696A0] shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] uppercase tracking-wider backdrop-blur-xs border border-black/5 dark:border-white/5">
                  {group.dateGroup}
                </span>
              </div>

              {group.items.map((item) => {
                const priorityConfig = getPriorityBadge(item.priority);
                const titleText = item.title || "Official Announcement";
                const contentText = item.content || "";

                return (
                  <article
                    key={item.id}
                    className="mx-auto w-full max-w-xl rounded-2xl rounded-tl-[4px] bg-white dark:bg-[#1F2C34] shadow-[0_1px_2px_rgba(11,20,26,0.12)] border border-gray-200/70 dark:border-[#2A3942] overflow-hidden transition-all duration-150 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] flex flex-col group"
                  >
                    {/* Channel Author Strip Inside Bubble */}
                    <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-[#00A884] to-[#128C7E] flex items-center justify-center text-white text-[10px] font-bold shadow-xs">
                          <Megaphone className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-[13px] font-bold text-[#111B21] dark:text-[#E9EDEF]">
                          CallsChat Official
                        </span>
                        <VerifiedBadge type="BUSINESS" size="xs" showTooltip={false} />
                      </div>

                      <div className="flex items-center gap-1.5">
                        {item.isPinned && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2 py-0.5 text-[10px] font-bold border border-amber-500/25">
                            <Pin className="h-2.5 w-2.5 fill-amber-500/40" /> PINNED
                          </span>
                        )}
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                            priorityConfig.pill
                          )}
                        >
                          <span className={cn("h-1.5 w-1.5 rounded-full", priorityConfig.dot)} />
                          {priorityConfig.label}
                        </span>
                      </div>
                    </div>

                    {/* Edge-to-Edge Media Attachment (Image or Video) */}
                    {item.mediaUrl && (
                      <div className="relative bg-black/90 flex items-center justify-center overflow-hidden border-y border-gray-100 dark:border-[#2A3942]">
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
                            className="w-full relative group/media cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A884]"
                            aria-label={`View full image for ${titleText}`}
                          >
                            <img
                              src={item.mediaUrl}
                              alt={titleText}
                              className="w-full max-h-[380px] object-cover transition-transform duration-200 group-hover/media:scale-[1.01]"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover/media:bg-black/15 transition-colors flex items-center justify-center">
                              <span className="opacity-0 group-hover/media:opacity-100 transition-opacity bg-black/70 text-white text-[11px] font-medium px-3 py-1.5 rounded-full backdrop-blur-xs">
                                Click to view full image
                              </span>
                            </div>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Card Content Area */}
                    <div className="px-4 pt-3 pb-3 flex flex-col gap-2">
                      {/* Prominent Announcement Headline */}
                      <h2 className="text-[16px] sm:text-[17px] font-bold text-[#111B21] dark:text-[#E9EDEF] tracking-tight leading-snug">
                        {titleText}
                      </h2>

                      {/* Announcement Body Content */}
                      {contentText ? (
                        <div className="text-[13.5px] sm:text-[14px] text-[#111B21] dark:text-[#D1D7DB] leading-relaxed whitespace-pre-wrap break-words font-normal">
                          {formatAnnouncementText(contentText)}
                        </div>
                      ) : null}

                      {/* Interactive WhatsApp Action Button (Filtered: ignores incomplete routes like /channels) */}
                      {(() => {
                        const isChannelsRoute =
                          item.actionUrl?.toLowerCase().includes("channels") ||
                          item.actionText?.toLowerCase().includes("explore channels");
                        if (!item.actionText || !item.actionUrl || isChannelsRoute) return null;

                        return (
                          <div className="mt-2 pt-2">
                            <a
                              href={item.actionUrl}
                              target={item.actionUrl.startsWith("http") ? "_blank" : "_self"}
                              rel="noopener noreferrer"
                              className="w-full py-2.5 px-4 flex items-center justify-center gap-2 rounded-xl bg-[#00A884] hover:bg-[#008F6F] active:bg-[#007A5E] text-white font-semibold text-[13px] shadow-xs transition-all duration-120 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A884] focus-visible:ring-offset-2"
                            >
                              <span>{item.actionText}</span>
                              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                            </a>
                          </div>
                        );
                      })()}

                      {/* WhatsApp Bottom Metadata Strip */}
                      <div className="mt-1 pt-2 flex items-center justify-between text-[11px] sm:text-[11.5px] text-[#54656F] dark:text-[#8696A0] border-t border-gray-100 dark:border-[#2A3942]/60 select-none">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 font-medium">
                            <Eye className="h-3.5 w-3.5 text-[#8696A0]" />
                            <span>{item.viewsCount ?? 1} views</span>
                          </span>

                          <button
                            type="button"
                            onClick={() => handleShare(item)}
                            className="flex items-center gap-1 font-medium hover:text-[#00A884] transition-colors focus-visible:outline-none"
                            title="Copy announcement link"
                          >
                            <Share2 className="h-3 w-3" />
                            <span>Share</span>
                          </button>
                        </div>

                        {/* WhatsApp Clock & Blue Double Checkmarks */}
                        <div className="flex items-center gap-1.5 font-medium">
                          <span>{formatTime(item.publishedAt || item.createdAt)}</span>
                          <span className="text-[#53BDEB] flex items-center" title="Verified Delivery">
                            <CheckCheck className="h-4 w-4" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ))
        )}
        <div ref={feedEndRef} />
      </main>

      {/* ── WhatsApp Read-Only Footer Banner ──────────────────────────────── */}
      <footer className="shrink-0 bg-white/95 dark:bg-[#111B21]/95 border-t border-[#E2E8F0] dark:border-[#222D34] px-4 py-2.5 shadow-[0_-1px_3px_rgba(11,20,26,0.03)] z-20">
        <div className="mx-auto max-w-xl rounded-full bg-[#F0F2F5] dark:bg-[#202C33] border border-black/5 dark:border-white/5 py-2 px-4 flex items-center justify-center gap-2 text-center shadow-xs">
          <Lock className="h-3.5 w-3.5 text-[#54656F] dark:text-[#8696A0] shrink-0" />
          <span className="text-[12px] font-medium text-[#54656F] dark:text-[#8696A0]">
            🔒 Only administrators can post in this channel.
          </span>
        </div>
      </footer>

      {/* ── Lightbox Image Modal ──────────────────────────────────────────── */}
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
            className="absolute top-4 right-4 rounded-full bg-black/60 p-2.5 text-white hover:bg-black/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white cursor-pointer"
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
