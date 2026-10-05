"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Megaphone,
  Plus,
  Search,
  Eye,
  Pin,
  PinOff,
  Trash2,
  Video,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  Sparkles,
  UploadCloud,
  X,
  Play,
  Filter,
  BarChart3,
  Users,
  ShieldCheck,
  Send,
  Loader2,
  Smartphone,
  Monitor,
  CheckCheck,
  FileText,
  Lock,
  Bell,
  BellOff,
  BellRing,
  Radio,
} from "lucide-react";
import {
  adminAnnouncementService,
  AnnouncementItem,
  AnnouncementPriority,
  AnnouncementTargetAudience,
  AnnouncementStatus,
  CreateAnnouncementPayload,
  AdminStatsResponse,
} from "@/services/admin-announcement.service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isComposerOpen, setIsComposerOpen] = useState<boolean>(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [pushConfirmItem, setPushConfirmItem] = useState<AnnouncementItem | null>(null);
  const [isBroadcastingPush, setIsBroadcastingPush] = useState<boolean>(false);
  const [forcePush, setForcePush] = useState<boolean>(false);
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "desktop">("mobile");
  const [previewType, setPreviewType] = useState<"chat" | "push">("chat");

  // Form State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<AnnouncementPriority>("NORMAL");
  const [status, setStatus] = useState<AnnouncementStatus>("PUBLISHED");
  const [targetAudience, setTargetAudience] = useState<AnnouncementTargetAudience>("ALL");
  const [isPinned, setIsPinned] = useState(false);
  const [sendPushNotification, setSendPushNotification] = useState(true);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaKey, setMediaKey] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"IMAGE" | "VIDEO" | null>(null);
  const [actionText, setActionText] = useState("");
  const [actionUrl, setActionUrl] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [listRes, statsRes] = await Promise.all([
        adminAnnouncementService.getAnnouncements({
          search: searchQuery || undefined,
          status: statusFilter !== "ALL" ? (statusFilter as AnnouncementStatus) : undefined,
        }),
        adminAnnouncementService.getStats(),
      ]);

      if (listRes?.success) {
        setAnnouncements(listRes.data);
      }
      if (statsRes?.success) {
        setStats(statsRes.data);
      }
    } catch (err: any) {
      console.error("Failed to load announcements:", err);
      toast.error(err?.response?.data?.message || "Failed to load announcements data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVid = file.type.startsWith("video/");
    const isImg = file.type.startsWith("image/");

    if (!isVid && !isImg) {
      toast.error("Please upload an image (PNG, JPG, WebP) or video (MP4, WebM)");
      return;
    }

    if (isVid && file.size > 50 * 1024 * 1024) {
      toast.error("Short video must be under 50MB");
      return;
    }

    if (isImg && file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB");
      return;
    }

    try {
      setIsUploading(true);
      toast.info("Uploading media to RustFS storage...");
      const result = await adminAnnouncementService.uploadMedia(file);

      setMediaUrl(result.url);
      setMediaKey(result.key);
      setMediaType(isVid ? "VIDEO" : "IMAGE");
      toast.success(`${isVid ? "Short video" : "Image"} uploaded successfully to RustFS!`);
    } catch (err: any) {
      console.error("Media upload error:", err);
      toast.error(err?.response?.data?.error || "Failed to upload file to RustFS");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeMedia = () => {
    setMediaUrl(null);
    setMediaKey(null);
    setMediaType(null);
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!content.trim()) {
      toast.error("Content body is required");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: CreateAnnouncementPayload = {
        title: title.trim(),
        content: content.trim(),
        priority,
        status,
        targetAudience,
        isPinned,
        sendPushNotification,
        mediaUrl: mediaUrl || undefined,
        mediaKey: mediaKey || undefined,
        mediaType: mediaType || undefined,
        actionText: actionText.trim() || undefined,
        actionUrl: actionUrl.trim() || undefined,
      };

      const res = await adminAnnouncementService.createAnnouncement(payload);
      if (res.success) {
        toast.success(
          status === "PUBLISHED"
            ? sendPushNotification
              ? "Announcement broadcasted live with push notifications dispatched!"
              : "Announcement broadcasted live to in-app feed!"
            : "Draft saved successfully"
        );
        setIsComposerOpen(false);
        resetForm();
        fetchData();
      }
    } catch (err: any) {
      console.error("Failed to create announcement:", err);
      toast.error(err?.response?.data?.message || "Failed to create announcement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setPriority("NORMAL");
    setStatus("PUBLISHED");
    setTargetAudience("ALL");
    setIsPinned(false);
    setSendPushNotification(true);
    setMediaUrl(null);
    setMediaKey(null);
    setMediaType(null);
    setActionText("");
    setActionUrl("");
    setPreviewType("chat");
  };

  const handleBroadcastPush = async (announcementId: string, force = false) => {
    try {
      setIsBroadcastingPush(true);
      const res = await adminAnnouncementService.broadcastPush(announcementId, force);
      if (res.success) {
        toast.success("Broadcast push notifications dispatched to FCM queue!");
        setPushConfirmItem(null);
        setForcePush(false);
        fetchData();
      } else {
        toast.error(res.message || "Failed to dispatch push notifications");
      }
    } catch (err: any) {
      console.error("Broadcast push error:", err);
      toast.error(err?.response?.data?.message || "Failed to broadcast push notifications");
    } finally {
      setIsBroadcastingPush(false);
    }
  };

  const handleTogglePin = async (id: string, currentPinned: boolean) => {
    try {
      await adminAnnouncementService.togglePin(id, !currentPinned);
      toast.success(currentPinned ? "Announcement unpinned" : "Announcement pinned to top");
      setAnnouncements((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isPinned: !currentPinned } : item))
      );
    } catch (err) {
      toast.error("Failed to update pin status");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminAnnouncementService.deleteAnnouncement(id);
      toast.success("Announcement deleted successfully");
      setAnnouncements((prev) => prev.filter((item) => item.id !== id));
      setDeleteConfirmId(null);
      if (stats) {
        setStats({ ...stats, totalPublished: Math.max(0, stats.totalPublished - 1) });
      }
    } catch (err) {
      toast.error("Failed to delete announcement");
    }
  };

  const getPriorityBadge = (p: AnnouncementPriority) => {
    switch (p) {
      case "URGENT":
        return "bg-rose-500/15 text-rose-400 border border-rose-500/30";
      case "HIGH":
        return "bg-amber-500/15 text-amber-400 border border-amber-500/30";
      case "LOW":
        return "bg-slate-700/60 text-slate-300 border border-slate-600";
      default:
        return "bg-[#00A884]/15 text-[#00A884] border border-[#00A884]/30";
    }
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#0B141A] p-6 lg:p-8 text-[#E9EDEF] font-sans">
      {/* Page Title & Action Bar */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222D34] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-[#00A884] to-[#128C7E] text-white shadow-md shadow-[#00A884]/20">
              <Megaphone className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Official Announcements
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#00A884]/15 text-[#00A884] font-semibold border border-[#00A884]/30">
                  Read-Only Broadcasts
                </span>
              </h1>
              <p className="text-xs text-[#8696A0] mt-0.5">
                Publish verified announcements, images, and short videos to the entire userbase
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsComposerOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#00A884] hover:bg-[#008F6F] active:bg-[#007A5E] px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-[#00A884]/20 transition-all duration-120 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A884] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B141A]"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>New Broadcast</span>
        </button>
      </header>

      {/* Metric Cards Grid */}
      <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Announcement metrics">
        <div className="rounded-2xl border border-[#222D34] bg-[#182229] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.1)] transition-transform duration-150 hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#8696A0]">Published Broadcasts</span>
            <div className="rounded-lg bg-[#00A884]/15 p-2 text-[#00A884]">
              <Send className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-white tracking-tight">
            {stats?.totalPublished ?? 0}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[#00A884] font-medium">
            <CheckCircle2 className="h-3 w-3" />
            <span>Active across Web & Mobile</span>
          </div>
        </div>

        <div className="rounded-2xl border border-[#222D34] bg-[#182229] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.1)] transition-transform duration-150 hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#8696A0]">Total Impressions</span>
            <div className="rounded-lg bg-emerald-500/15 p-2 text-emerald-400">
              <Eye className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-white tracking-tight">
            {stats?.totalImpressions?.toLocaleString() ?? 0}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[#8696A0]">
            <span>Views counted live</span>
          </div>
        </div>

        <div className="rounded-2xl border border-[#222D34] bg-[#182229] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.1)] transition-transform duration-150 hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#8696A0]">Pinned Announcements</span>
            <div className="rounded-lg bg-amber-500/15 p-2 text-amber-400">
              <Pin className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-white tracking-tight">
            {stats?.totalPinned ?? 0}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-amber-400 font-medium">
            <span>Anchored at top of user feed</span>
          </div>
        </div>

        <div className="rounded-2xl border border-[#222D34] bg-[#182229] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.1)] transition-transform duration-150 hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#8696A0]">Read Receipts</span>
            <div className="rounded-lg bg-teal-500/15 p-2 text-teal-400">
              <BarChart3 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-white tracking-tight">
            {stats?.totalReadReceipts?.toLocaleString() ?? 0}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-teal-400 font-medium">
            <span>Unique member acknowledgments</span>
          </div>
        </div>
      </section>

      {/* Search & Filter Toolbar */}
      <section className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Status Filter Segment */}
        <div className="flex items-center gap-1 rounded-xl bg-[#182229] p-1 border border-[#222D34] text-xs">
          {["ALL", "PUBLISHED", "DRAFT", "ARCHIVED"].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={cn(
                "rounded-lg px-3.5 py-1.5 font-semibold transition-all duration-120 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A884]",
                statusFilter === tab
                  ? "bg-[#00A884] text-white shadow-xs"
                  : "text-[#8696A0] hover:text-[#E9EDEF]"
              )}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8696A0]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search broadcasts..."
            className="w-full rounded-xl border border-[#222D34] bg-[#182229] pl-9.5 pr-8 py-2 text-xs text-white placeholder-[#8696A0] focus:border-[#00A884] focus:outline-none focus:ring-1 focus:ring-[#00A884] transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                fetchData();
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-[#8696A0] hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </form>
      </section>

      {/* Announcements List Container */}
      <section className="mt-4 flex-1 rounded-2xl border border-[#222D34] bg-[#182229] overflow-hidden flex flex-col shadow-xs">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center p-12 text-[#8696A0]">
            <Loader2 className="h-6 w-6 animate-spin text-[#00A884] mr-2" />
            <span className="text-sm font-medium">Loading broadcasts...</span>
          </div>
        ) : announcements.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center p-12 text-center my-auto">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#00A884]/15 text-[#00A884] mb-3 border border-[#00A884]/25 shadow-xs">
              <Megaphone className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-white">No announcements found</h3>
            <p className="mt-1 text-xs text-[#8696A0] max-w-sm leading-relaxed">
              Publish your first official announcement to send official updates, videos, and news to all users.
            </p>
            <button
              onClick={() => {
                resetForm();
                setIsComposerOpen(true);
              }}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#00A884] px-4 py-2 text-xs font-semibold text-white hover:bg-[#008F6F] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A884]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Announcement</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#222D34] overflow-y-auto">
            {announcements.map((item) => (
              <div
                key={item.id}
                className="flex flex-col md:flex-row md:items-center justify-between p-4.5 hover:bg-[#202C33]/50 transition-colors gap-4"
              >
                {/* Media Thumbnail & Details */}
                <div className="flex items-start gap-4">
                  {item.mediaUrl ? (
                    <div className="relative h-18 w-18 sm:h-20 sm:w-20 shrink-0 rounded-xl overflow-hidden bg-black border border-[#222D34] flex items-center justify-center group shadow-xs">
                      {item.mediaType === "VIDEO" ? (
                        <>
                          <video
                            src={item.mediaUrl}
                            className="h-full w-full object-cover"
                            preload="metadata"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Play className="h-5 w-5 text-white fill-white/80" />
                          </div>
                        </>
                      ) : (
                        <img
                          src={item.mediaUrl}
                          alt={item.title}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="flex h-18 w-18 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-xl bg-[#202C33] border border-[#222D34] text-[#8696A0]">
                      <Megaphone className="h-6 w-6 text-[#00A884]" />
                    </div>
                  )}

                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {item.isPinned && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/30">
                          <Pin className="h-2.5 w-2.5" /> Pinned
                        </span>
                      )}
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                          getPriorityBadge(item.priority)
                        )}
                      >
                        {item.priority}
                      </span>
                      <span className="rounded-full bg-[#202C33] text-[#8696A0] px-2 py-0.5 text-[10px] font-semibold border border-[#2A3942]">
                        Audience: {item.targetAudience}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          item.status === "PUBLISHED"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                            : "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                        )}
                      >
                        {item.status}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white tracking-tight leading-snug">
                      {item.title}
                    </h4>

                    <p className="text-xs text-[#8696A0] line-clamp-2 max-w-xl leading-relaxed">
                      {item.content}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#8696A0] mt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(item.publishedAt || item.createdAt)}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {item.viewsCount} views
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-[#00A884]">
                        <CheckCheck className="h-3.5 w-3.5" />
                        {item.readCount ?? 0} read receipts
                      </span>
                      {item.pushDispatchedAt ? (
                        <>
                          <span>•</span>
                          <span
                            className="flex items-center gap-1 text-[#00A884]"
                            title={`Dispatched: ${formatDate(item.pushDispatchedAt)} • ${item.pushSuccessCount ?? 0} succeeded, ${item.pushFailedCount ?? 0} failed`}
                          >
                            <Bell className="h-3 w-3" />
                            <span>Push ({item.pushSuccessCount ?? 0} sent)</span>
                          </span>
                        </>
                      ) : item.status === "PUBLISHED" ? (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-[#8696A0]" title="No push notifications sent yet">
                            <BellOff className="h-3 w-3" />
                            <span>No push</span>
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Actions Toolbar */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  {item.status === "PUBLISHED" && (
                    <button
                      onClick={() => {
                        setPushConfirmItem(item);
                        setForcePush(false);
                      }}
                      title="Broadcast FCM Push Notification to Target Audience"
                      className="flex items-center gap-1.5 rounded-lg border border-[#222D34] bg-[#202C33] px-2.5 py-1.5 text-xs font-semibold text-[#8696A0] hover:text-[#00A884] hover:border-[#00A884]/30 hover:bg-[#00A884]/10 transition-all duration-120 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A884]"
                    >
                      <BellRing className="h-3.5 w-3.5 text-[#00A884]" />
                      <span>Push</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleTogglePin(item.id, item.isPinned)}
                    title={item.isPinned ? "Unpin Announcement" : "Pin to Top"}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all duration-120 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A884]",
                      item.isPinned
                        ? "border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                        : "border-[#222D34] bg-[#202C33] text-[#8696A0] hover:text-white hover:border-[#2A3942]"
                    )}
                  >
                    {item.isPinned ? (
                      <>
                        <PinOff className="h-3.5 w-3.5" />
                        <span>Unpin</span>
                      </>
                    ) : (
                      <>
                        <Pin className="h-3.5 w-3.5" />
                        <span>Pin</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setDeleteConfirmId(item.id)}
                    title="Delete Announcement"
                    className="rounded-lg border border-[#222D34] bg-[#202C33] p-2 text-[#8696A0] hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Broadcast Composer Modal */}
      {isComposerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150"
        >
          <div className="relative w-full max-w-4xl max-h-[92vh] rounded-3xl border border-[#222D34] bg-[#182229] shadow-2xl flex flex-col overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#222D34] px-6 py-4 bg-[#202C33]/60">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00A884]/20 text-[#00A884]">
                  <Megaphone className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Create Official Broadcast</h3>
                  <p className="text-xs text-[#8696A0]">
                    Broadcast announcements, media, and interactive links to users
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsComposerOpen(false)}
                className="rounded-lg p-2 text-[#8696A0] hover:bg-[#202C33] hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A884]"
                aria-label="Close composer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body: Split Form & Live Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 overflow-y-auto flex-1">
              {/* Form Column */}
              <form
                onSubmit={handleCreateAnnouncement}
                className="lg:col-span-7 p-6 flex flex-col gap-4 border-r border-[#222D34]"
              >
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#8696A0] mb-1.5">
                    Announcement Headline *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. CallsChat 2.0 Live Rooms Are Now Available!"
                    className="w-full rounded-xl border border-[#222D34] bg-[#0B141A] px-3.5 py-2.5 text-sm text-white placeholder-[#8696A0] focus:border-[#00A884] focus:outline-none focus:ring-1 focus:ring-[#00A884] transition-all"
                  />
                </div>

                {/* Priority & Audience Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#8696A0] mb-1.5">
                      Priority Level
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as AnnouncementPriority)}
                      className="w-full rounded-xl border border-[#222D34] bg-[#0B141A] px-3 py-2 text-xs text-white focus:border-[#00A884] focus:outline-none transition-all"
                    >
                      <option value="NORMAL">Normal (Standard Update)</option>
                      <option value="HIGH">High (Important Feature)</option>
                      <option value="URGENT">Urgent (System Alert / Maintenance)</option>
                      <option value="LOW">Low (FYI / Tip)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#8696A0] mb-1.5">
                      Target Audience
                    </label>
                    <select
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value as AnnouncementTargetAudience)}
                      className="w-full rounded-xl border border-[#222D34] bg-[#0B141A] px-3 py-2 text-xs text-white focus:border-[#00A884] focus:outline-none transition-all"
                    >
                      <option value="ALL">Everyone (All App & Web Users)</option>
                      <option value="PERSONAL">Personal Mode Users Only</option>
                      <option value="BUSINESS">Business & Workspace Accounts</option>
                    </select>
                  </div>
                </div>

                {/* Body Content */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#8696A0] mb-1.5">
                    Message Body *
                  </label>
                  <textarea
                    rows={5}
                    required
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your announcement message here. Supports paragraphs and bullet points..."
                    className="w-full rounded-xl border border-[#222D34] bg-[#0B141A] p-3.5 text-sm text-white placeholder-[#8696A0] focus:border-[#00A884] focus:outline-none focus:ring-1 focus:ring-[#00A884] resize-none font-sans transition-all"
                  />
                </div>

                {/* Media Uploader (RustFS) */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#8696A0] mb-1.5 flex items-center justify-between">
                    <span>Media Attachment (RustFS Storage)</span>
                    <span className="text-[11px] text-[#8696A0] lowercase">Images & Videos up to 50MB</span>
                  </label>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*,video/mp4,video/webm"
                    className="hidden"
                  />

                  {mediaUrl ? (
                    <div className="relative rounded-2xl border border-[#222D34] bg-[#0B141A] p-3 flex items-center gap-3">
                      <div className="relative h-16 w-24 shrink-0 rounded-xl overflow-hidden bg-black border border-[#222D34] flex items-center justify-center">
                        {mediaType === "VIDEO" ? (
                          <video src={mediaUrl} className="h-full w-full object-cover" />
                        ) : (
                          <img src={mediaUrl} alt="Preview" className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div className="flex flex-col text-xs flex-1 min-w-0">
                        <span className="font-semibold text-white flex items-center gap-1.5">
                          {mediaType === "VIDEO" ? <Video className="h-3.5 w-3.5 text-[#00A884]" /> : <ImageIcon className="h-3.5 w-3.5 text-[#00A884]" />}
                          {mediaType === "VIDEO" ? "Short Video Attached" : "Image Attached"}
                        </span>
                        <span className="text-[11px] text-[#8696A0] truncate max-w-xs">{mediaUrl}</span>
                        <span className="text-[10px] text-[#00A884] font-medium mt-0.5">Stored securely in RustFS</span>
                      </div>
                      <button
                        type="button"
                        onClick={removeMedia}
                        className="rounded-lg p-2 text-rose-400 hover:bg-rose-500/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                        title="Remove Media"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="cursor-pointer rounded-2xl border-2 border-dashed border-[#222D34] hover:border-[#00A884]/60 bg-[#0B141A]/50 p-5 flex flex-col items-center justify-center gap-2 text-center transition-all group"
                    >
                      {isUploading ? (
                        <div className="flex flex-col items-center gap-2 text-[#00A884]">
                          <Loader2 className="h-6 w-6 animate-spin" />
                          <span className="text-xs font-semibold">Uploading to RustFS...</span>
                        </div>
                      ) : (
                        <>
                          <div className="rounded-xl bg-[#202C33] p-2.5 text-[#8696A0] group-hover:text-[#00A884] group-hover:bg-[#00A884]/15 transition-colors">
                            <UploadCloud className="h-5 w-5" />
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-[#E9EDEF]">Click to upload media</span>
                            <p className="text-[11px] text-[#8696A0] mt-0.5">PNG, JPG, WebP images or MP4, WebM short videos</p>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Call To Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#8696A0] mb-1.5">
                      Button Text (Optional)
                    </label>
                    <input
                      type="text"
                      value={actionText}
                      onChange={(e) => setActionText(e.target.value)}
                      placeholder="e.g. Join Audio Room"
                      className="w-full rounded-xl border border-[#222D34] bg-[#0B141A] px-3 py-2 text-xs text-white placeholder-[#8696A0] focus:border-[#00A884] focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#8696A0] mb-1.5">
                      Action Route / URL (Optional)
                    </label>
                    <input
                      type="text"
                      value={actionUrl}
                      onChange={(e) => setActionUrl(e.target.value)}
                      placeholder="e.g. /channels or https://..."
                      className="w-full rounded-xl border border-[#222D34] bg-[#0B141A] px-3 py-2 text-xs text-white placeholder-[#8696A0] focus:border-[#00A884] focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Push Notification Toggle Switch */}
                <div className="flex items-center justify-between rounded-xl bg-[#0B141A] border border-[#222D34] p-3">
                  <div className="flex items-center gap-2.5">
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                      sendPushNotification ? "bg-[#00A884]/20 text-[#00A884]" : "bg-[#202C33] text-[#8696A0]"
                    )}>
                      <BellRing className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">Broadcast Push Notification</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00A884]/15 text-[#00A884] font-bold border border-[#00A884]/30">
                          FCM Multi-Platform
                        </span>
                      </div>
                      <p className="text-[10px] text-[#8696A0] mt-0.5">
                        Immediately dispatches real-time push notification to {targetAudience === "ALL" ? "all devices" : `${targetAudience.toLowerCase()} accounts`} via Firebase Cloud Messaging
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={sendPushNotification}
                    onChange={(e) => setSendPushNotification(e.target.checked)}
                    className="h-4 w-4 rounded-sm border-[#222D34] bg-[#202C33] text-[#00A884] focus:ring-[#00A884] focus:ring-offset-[#0B141A]"
                  />
                </div>

                {/* Pin Toggle Switch */}
                <div className="flex items-center justify-between rounded-xl bg-[#0B141A] border border-[#222D34] p-3">
                  <div className="flex items-center gap-2.5">
                    <Pin className={cn("h-4 w-4", isPinned ? "text-amber-400" : "text-[#8696A0]")} />
                    <div>
                      <span className="text-xs font-semibold text-white">Pin to top of feed</span>
                      <p className="text-[10px] text-[#8696A0]">Keeps this announcement anchored at the top of the official chat</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="h-4 w-4 rounded-sm border-[#222D34] bg-[#202C33] text-[#00A884] focus:ring-[#00A884] focus:ring-offset-[#0B141A]"
                  />
                </div>

                {/* Form Action Buttons */}
                <div className="mt-4 flex items-center justify-end gap-3 pt-3 border-t border-[#222D34]">
                  <button
                    type="button"
                    onClick={() => setStatus("DRAFT")}
                    disabled={isSubmitting}
                    className="rounded-xl border border-[#222D34] bg-[#202C33] px-4 py-2 text-xs font-semibold text-[#8696A0] hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A884]"
                  >
                    Save as Draft
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting || isUploading}
                    onClick={() => setStatus("PUBLISHED")}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#00A884] hover:bg-[#008F6F] active:bg-[#007A5E] px-5 py-2 text-xs font-semibold text-white shadow-md shadow-[#00A884]/20 hover:opacity-95 disabled:opacity-50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A884]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Broadcasting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        <span>Publish & Broadcast Live</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Live Simulator Column (Right) */}
              <div className="lg:col-span-5 bg-[#0B141A] p-6 flex flex-col items-center justify-center">
                <div className="w-full flex flex-col gap-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#8696A0] flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-[#00A884]" />
                      Live Device Simulator
                    </span>

                    <div className="flex items-center gap-1 rounded-lg bg-[#182229] border border-[#222D34] p-1 text-[#8696A0]">
                      <button
                        type="button"
                        onClick={() => setPreviewDevice("mobile")}
                        className={cn(
                          "p-1 rounded-sm transition-colors",
                          previewDevice === "mobile" ? "bg-[#00A884] text-white" : "hover:text-white"
                        )}
                        title="Mobile Device Preview"
                      >
                        <Smartphone className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewDevice("desktop")}
                        className={cn(
                          "p-1 rounded-sm transition-colors",
                          previewDevice === "desktop" ? "bg-[#00A884] text-white" : "hover:text-white"
                        )}
                        title="Desktop Web Preview"
                      >
                        <Monitor className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Preview Type Switcher (In-App Chat vs Lock-Screen Push) */}
                  <div className="grid grid-cols-2 gap-1 rounded-xl bg-[#182229] p-1 border border-[#222D34] text-xs">
                    <button
                      type="button"
                      onClick={() => setPreviewType("chat")}
                      className={cn(
                        "rounded-lg py-1.5 font-semibold text-center transition-all flex items-center justify-center gap-1.5",
                        previewType === "chat"
                          ? "bg-[#00A884] text-white shadow-xs"
                          : "text-[#8696A0] hover:text-white"
                      )}
                    >
                      <Megaphone className="h-3 w-3" />
                      <span>In-App Feed</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewType("push")}
                      className={cn(
                        "rounded-lg py-1.5 font-semibold text-center transition-all flex items-center justify-center gap-1.5",
                        previewType === "push"
                          ? "bg-[#00A884] text-white shadow-xs"
                          : "text-[#8696A0] hover:text-white"
                      )}
                    >
                      <BellRing className="h-3 w-3" />
                      <span>Lock-Screen Push</span>
                    </button>
                  </div>
                </div>

                {/* Device Frame Mockup */}
                <div
                  className={cn(
                    "w-full rounded-3xl border border-[#222D34] bg-[#0C1317] shadow-2xl overflow-hidden flex flex-col transition-all",
                    previewDevice === "mobile" ? "max-w-[340px] h-[520px]" : "max-w-[420px] h-[480px]"
                  )}
                >
                  {previewType === "push" ? (
                    /* iOS / Android Lock-Screen Push Preview */
                    <div className="flex-1 flex flex-col justify-between p-4 bg-gradient-to-b from-[#131D22] via-[#0E161B] to-[#0A0F12] relative overflow-hidden">
                      {/* Lock Screen Time Display */}
                      <div className="flex flex-col items-center pt-4 pb-6 text-center">
                        <span className="text-[11px] font-medium text-[#8696A0] uppercase tracking-widest">
                          Monday, October 5
                        </span>
                        <span className="text-4xl font-extralight text-white tracking-tight mt-1">
                          09:41
                        </span>
                      </div>

                      {/* Push Notification Card */}
                      <div className="rounded-2xl border border-white/10 bg-[#1F2C34]/90 backdrop-blur-md p-3.5 shadow-xl text-left transition-all hover:bg-[#1F2C34]">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-[#00A884] text-white">
                              <Megaphone className="h-3 w-3" />
                            </div>
                            <span className="text-[11px] font-bold text-white tracking-wide uppercase">
                              CallsChat
                            </span>
                            <VerifiedBadge type="BUSINESS" size="xs" showTooltip={false} />
                          </div>
                          <span className="text-[10px] text-[#8696A0]">now</span>
                        </div>

                        <div className="flex gap-3 items-start">
                          <div className="flex-1 min-w-0">
                            <h6 className="text-xs font-bold text-white leading-snug line-clamp-1">
                              {title ? (priority === "URGENT" ? `[URGENT] ${title}` : title) : "CallsChat Official Announcement"}
                            </h6>
                            <p className="text-[11px] text-[#D1D7DB] mt-1 line-clamp-2 leading-relaxed">
                              {content || "Tap to view the latest official update and explore new features."}
                            </p>
                          </div>

                          {mediaUrl && (
                            <div className="h-12 w-12 shrink-0 rounded-lg overflow-hidden bg-black border border-[#222D34]">
                              {mediaType === "VIDEO" ? (
                                <div className="h-full w-full flex items-center justify-center bg-[#202C33]">
                                  <Play className="h-4 w-4 text-[#00A884] fill-[#00A884]" />
                                </div>
                              ) : (
                                <img src={mediaUrl} alt="Thumbnail" className="h-full w-full object-cover" />
                              )}
                            </div>
                          )}
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-[#8696A0]">
                          <span className="text-[#00A884] font-medium">
                            Target: {targetAudience} users
                          </span>
                          <span>Slide to open</span>
                        </div>
                      </div>

                      {/* Lock Screen Bottom Bar */}
                      <div className="pt-8 pb-2 flex flex-col items-center gap-1.5 text-center">
                        <div className="h-1 w-24 rounded-full bg-white/30" />
                        <span className="text-[9px] text-[#8696A0]/80">Swipe up to unlock</span>
                      </div>
                    </div>
                  ) : (
                    /* WhatsApp In-App Feed Mockup */
                    <>
                      {/* Mock Chat Header */}
                      <div className="flex items-center justify-between border-b border-[#222D34] bg-[#202C33] px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-[#00A884] to-[#128C7E] text-white shadow-xs">
                            <Megaphone className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-bold text-white">CallsChat Official</span>
                              <VerifiedBadge type="BUSINESS" size="xs" showTooltip={false} />
                            </div>
                            <span className="text-[10px] text-[#00A884] font-medium">Verified Channel</span>
                          </div>
                        </div>
                      </div>

                      {/* Mock Message Feed */}
                      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 custom-scrollbar">
                        <div className="rounded-2xl border border-[#222D34] bg-[#1F2C34] p-3.5 shadow-md">
                          {isPinned && (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-amber-400 mb-1.5">
                              <Pin className="h-3 w-3" /> PINNED ANNOUNCEMENT
                            </div>
                          )}

                          {/* Attached Media Preview */}
                          {mediaUrl && (
                            <div className="mb-2.5 rounded-xl overflow-hidden bg-black border border-[#222D34] aspect-video flex items-center justify-center relative">
                              {mediaType === "VIDEO" ? (
                                <video
                                  src={mediaUrl}
                                  controls
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <img
                                  src={mediaUrl}
                                  alt="Announcement media"
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase",
                                getPriorityBadge(priority)
                              )}
                            >
                              {priority}
                            </span>
                            <span className="text-[10px] text-[#8696A0]">Just now</span>
                          </div>

                          <h5 className="text-xs font-bold text-white mb-1 leading-snug">
                            {title || "Your Announcement Headline"}
                          </h5>

                          <p className="text-[11px] text-[#D1D7DB] leading-relaxed whitespace-pre-wrap">
                            {content || "Your message body content will appear here in the live broadcast feed..."}
                          </p>

                          {actionText && (
                            <div className="mt-2.5 pt-2 border-t border-[#222D34]">
                              <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#00A884] py-1.5 text-center text-xs font-semibold text-white">
                                {actionText}
                                <ExternalLink className="h-3 w-3" />
                              </span>
                            </div>
                          )}

                          <div className="mt-2 flex items-center justify-between text-[10px] text-[#8696A0] pt-1.5 border-t border-[#222D34]">
                            <span>0 views</span>
                            <span className="flex items-center gap-1 text-[#53BDEB]">
                              <CheckCheck className="h-3 w-3" />
                              <span>Delivered</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Mock Read-Only Footer Banner */}
                      <div className="border-t border-[#222D34] bg-[#111B21] p-2.5 text-center">
                        <span className="text-[10px] text-[#8696A0] font-medium flex items-center justify-center gap-1">
                          <Lock className="h-3 w-3" /> Read-only official channel · No replies
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-150"
        >
          <div className="w-full max-w-sm rounded-2xl border border-[#222D34] bg-[#182229] p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 mb-4 border border-rose-500/20">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h4 className="text-base font-bold text-white">Delete Announcement?</h4>
            <p className="mt-1.5 text-xs text-[#8696A0] leading-relaxed">
              This will permanently delete this official announcement and remove its attached media from RustFS storage.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-xl border border-[#222D34] bg-[#202C33] px-4 py-2 text-xs font-semibold text-[#8696A0] hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A884]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Re-Broadcast Push Notification Modal */}
      {pushConfirmItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-150"
        >
          <div className="w-full max-w-md rounded-2xl border border-[#222D34] bg-[#182229] p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#00A884]/15 text-[#00A884] border border-[#00A884]/25 shadow-xs">
                <BellRing className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Broadcast Push Notification</h4>
                <p className="text-xs text-[#8696A0]">Send real-time alerts to registered user devices</p>
              </div>
            </div>

            <div className="rounded-xl border border-[#222D34] bg-[#0B141A] p-3.5 mb-4 space-y-2 text-xs">
              <div className="flex items-center justify-between text-[#8696A0]">
                <span>Announcement Title:</span>
                <span className="font-semibold text-white truncate max-w-[200px]">{pushConfirmItem.title}</span>
              </div>
              <div className="flex items-center justify-between text-[#8696A0]">
                <span>Target Audience:</span>
                <span className="font-semibold text-[#00A884] uppercase">{pushConfirmItem.targetAudience}</span>
              </div>
              <div className="flex items-center justify-between text-[#8696A0]">
                <span>Last Dispatched:</span>
                <span className="font-semibold text-white">
                  {pushConfirmItem.pushDispatchedAt ? formatDate(pushConfirmItem.pushDispatchedAt) : "Never"}
                </span>
              </div>
              {pushConfirmItem.pushAttemptedCount ? (
                <div className="flex items-center justify-between text-[#8696A0]">
                  <span>Previous Delivery:</span>
                  <span className="font-semibold text-emerald-400">
                    {pushConfirmItem.pushSuccessCount ?? 0} delivered / {pushConfirmItem.pushAttemptedCount} attempted
                  </span>
                </div>
              ) : null}
            </div>

            {/* Cooldown Check: 10 minutes */}
            {(() => {
              const cooldownMs = 10 * 60 * 1000;
              const lastSentMs = pushConfirmItem.pushDispatchedAt
                ? new Date(pushConfirmItem.pushDispatchedAt).getTime()
                : 0;
              const elapsedMs = Date.now() - lastSentMs;
              const isCoolingDown = Boolean(pushConfirmItem.pushDispatchedAt && elapsedMs < cooldownMs);
              const minutesLeft = Math.ceil((cooldownMs - elapsedMs) / 60000);

              return (
                <>
                  {isCoolingDown ? (
                    <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                        <div>
                          <span className="font-bold">Rate-Limit Cooldown Active</span>
                          <p className="text-[11px] text-amber-400/90 mt-0.5">
                            A push was recently dispatched ~{Math.floor(elapsedMs / 60000)}m ago. Cooldown remaining: {minutesLeft}m.
                            Frequent pushes can disturb users.
                          </p>
                        </div>
                      </div>
                      <label className="mt-2.5 flex items-center gap-2 text-[11px] font-semibold text-amber-200 cursor-pointer pt-2 border-t border-amber-500/20">
                        <input
                          type="checkbox"
                          checked={forcePush}
                          onChange={(e) => setForcePush(e.target.checked)}
                          className="h-3.5 w-3.5 rounded-sm border-amber-500/40 bg-black/40 text-[#00A884]"
                        />
                        <span>Force Re-broadcast (Override cooldown)</span>
                      </label>
                    </div>
                  ) : (
                    <p className="text-xs text-[#8696A0] mb-4 leading-relaxed">
                      This will queue and dispatch high-throughput push notifications via Firebase Cloud Messaging to all users in the <span className="text-white font-medium">{pushConfirmItem.targetAudience}</span> audience segment.
                    </p>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPushConfirmItem(null);
                        setForcePush(false);
                      }}
                      disabled={isBroadcastingPush}
                      className="rounded-xl border border-[#222D34] bg-[#202C33] px-4 py-2 text-xs font-semibold text-[#8696A0] hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A884]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isBroadcastingPush || (isCoolingDown && !forcePush)}
                      onClick={() => handleBroadcastPush(pushConfirmItem.id, forcePush)}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#00A884] hover:bg-[#008F6F] active:bg-[#007A5E] px-4 py-2 text-xs font-semibold text-white shadow-md shadow-[#00A884]/20 disabled:opacity-50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A884]"
                    >
                      {isBroadcastingPush ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Dispatching...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5" />
                          <span>{isCoolingDown ? "Force Send Push" : "Send Push Broadcast"}</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
