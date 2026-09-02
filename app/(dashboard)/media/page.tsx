"use client";

import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Search,
  Users,
  MessageSquare,
  Phone,
  Video,
  FileText,
  Download,
  Link as LinkIcon,
  Heart,
  Image as ImageIcon,
  ExternalLink,
  Copy,
  Check,
  X,
  Play,
  Maximize2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { chatService } from "@/services/chat.service";
import { useContacts, type Contact } from "@/hooks/useContacts";
import { useAllMedia, type MediaItem } from "@/hooks/useAllMedia";
import { useTranslations } from "next-intl";
import { getOptimizedImageUrl, getRawMediaUrl } from "@/utils/image";
import { useCallContext } from "@/components/providers/CallContext";
import { toast } from "sonner";

export default function MediaPage() {
  const t = useTranslations("media");
  const tCommon = useTranslations("common");
  const tNav = useTranslations("nav");
  const router = useRouter();
  const { contacts, isLoading: contactsLoading, searchQuery: contactSearch, setSearchQuery: setContactSearch } = useContacts();
  const { media, isLoading: mediaLoading, loadMore, hasMore } = useAllMedia();
  const { initiateCall } = useCallContext();

  const [activeTab, setActiveTab] = useState<"Media" | "Docs" | "Links">("Media");
  const [gallerySearch, setGallerySearch] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  const handleStartChat = async (targetUserId: string) => {
    try {
      const res = await chatService.initiateConversation(targetUserId);
      if (res.success && res.data?.conversationId) {
        router.push(`/chats/${res.data.conversationId}?recipientId=${targetUserId}`);
      }
    } catch (error) {
      console.error("Failed to start conversation:", error);
      toast.error("Failed to start chat");
    }
  };

  // Filter contacts by contact search query
  const filteredContacts = useMemo(() => {
    const query = contactSearch.toLowerCase().trim();
    if (!query) return contacts;
    return contacts.filter(
      (contact) =>
        contact.name.toLowerCase().includes(query) || contact.phone.includes(query)
    );
  }, [contacts, contactSearch]);

  // Group contacts by first letter
  const groupedContacts = useMemo(() => {
    return filteredContacts.reduce((acc, contact) => {
      const letter = (contact.name || "Unknown").charAt(0).toUpperCase();
      const safeLetter = /[A-Z]/.test(letter) ? letter : "#";
      if (!acc[safeLetter]) {
        acc[safeLetter] = [];
      }
      acc[safeLetter].push(contact);
      return acc;
    }, {} as Record<string, Contact[]>);
  }, [filteredContacts]);

  const sortedLetters = useMemo(() => {
    return Object.keys(groupedContacts).sort((a, b) => {
      if (a === "#") return 1;
      if (b === "#") return -1;
      return a.localeCompare(b);
    });
  }, [groupedContacts]);

  // Filter media items by gallery search query
  const filteredMediaItems = useMemo(() => {
    const query = gallerySearch.toLowerCase().trim();
    if (!query) return media;
    return media.filter((item) => {
      const filename = item.mediaUrl.split("/").pop() || "";
      return filename.toLowerCase().includes(query) || item.mediaUrl.toLowerCase().includes(query);
    });
  }, [media, gallerySearch]);

  // Group media by date
  const groupMediaByDate = (items: MediaItem[]) => {
    const groups: { [key: string]: { label: string; dateLabel: string; items: MediaItem[] } } = {};

    items.forEach((item) => {
      const date = new Date(item.createdAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let groupKey = "";
      let label = "";
      let dateLabel = "";

      if (date.toDateString() === today.toDateString()) {
        groupKey = "today";
        label = t("today");
        dateLabel = date
          .toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
          .toLowerCase();
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupKey = "yesterday";
        label = t("yesterday");
        dateLabel = date
          .toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
          .toLowerCase();
      } else {
        groupKey = date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
        label = date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
        dateLabel = date
          .toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
          .toLowerCase();
      }

      if (!groups[groupKey]) {
        groups[groupKey] = { label, dateLabel, items: [] };
      }
      groups[groupKey].items.push(item);
    });

    return Object.values(groups);
  };

  const mediaGroups = useMemo(() => {
    return groupMediaByDate(
      filteredMediaItems.filter((m) => m.mediaType === "image" || m.mediaType === "video")
    );
  }, [filteredMediaItems]);

  const docsGroups = useMemo(() => {
    return groupMediaByDate(
      filteredMediaItems.filter(
        (m) =>
          m.mediaType === "document" ||
          m.mediaType === "raw" ||
          m.mediaType === "file" ||
          (!m.mediaType.startsWith("image") &&
            !m.mediaType.startsWith("video") &&
            !m.mediaType.startsWith("audio") &&
            m.mediaType !== "emoji" &&
            m.mediaType !== "call" &&
            m.mediaType !== "link")
      )
    );
  }, [filteredMediaItems]);

  const linksGroups = useMemo(() => {
    return groupMediaByDate(filteredMediaItems.filter((m) => m.mediaType === "link"));
  }, [filteredMediaItems]);

  const totalMediaCount = media.filter((m) => m.mediaType === "image" || m.mediaType === "video").length;
  const totalDocsCount = media.filter(
    (m) =>
      m.mediaType === "document" ||
      m.mediaType === "raw" ||
      m.mediaType === "file" ||
      (!m.mediaType.startsWith("image") &&
        !m.mediaType.startsWith("video") &&
        !m.mediaType.startsWith("audio") &&
        m.mediaType !== "emoji" &&
        m.mediaType !== "call" &&
        m.mediaType !== "link")
  ).length;
  const totalLinksCount = media.filter((m) => m.mediaType === "link").length;

  const handleCopyLink = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLinkId(id);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopiedLinkId(null), 2000);
  };

  return (
    <div className="flex h-full w-full bg-white dark:bg-[#111B21] overflow-hidden">
      {/* ── Left Panel: Contacts Sidebar ─────────────────────────────────── */}
      <div className="hidden md:flex h-full w-[360px] lg:w-[380px] flex-col border-r border-[#E2E8F0] dark:border-[#222D34] bg-white dark:bg-[#111B21] shrink-0">
        
        {/* Header Area */}
        <div className="flex flex-col bg-white dark:bg-[#111B21] px-4 pt-4 pb-2 shrink-0 border-b border-[#E2E8F0]/60 dark:border-[#222D34]">
          <div className="flex items-center justify-between h-11">
            <h1 className="text-[22px] font-bold text-[#111B21] dark:text-[#E9EDEF] tracking-tight">
              {tNav("media")}
            </h1>
            <div className="flex items-center gap-1">
              <Link
                href="/chats/favorites"
                title="Favorite Messages"
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#54656F] dark:text-[#AEBAC1] hover:bg-[#F0F2F5] dark:hover:bg-[#202C33] transition-colors"
              >
                <Heart className="h-4.5 w-4.5 fill-red-500 text-red-500" />
              </Link>
              <NotificationDropdown />
            </div>
          </div>

          {/* Capsule Search Bar */}
          <div className="mt-3 relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8696A0]" />
            <input
              type="text"
              placeholder={tCommon("search")}
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
              className="h-[38px] w-full rounded-xl bg-[#F0F2F5] dark:bg-[#202C33] pl-10 pr-9 text-[13.5px] font-normal text-[#111B21] dark:text-[#E9EDEF] placeholder-[#8696A0] focus:outline-none focus:ring-1 focus:ring-[#00A884] border border-transparent transition-all"
            />
            {contactSearch && (
              <button
                onClick={() => setContactSearch("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8696A0] hover:text-[#111B21] dark:hover:text-[#E9EDEF] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Contacts List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pb-20 md:pb-6">
          {contactsLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#00A884] border-t-transparent" />
            </div>
          ) : sortedLetters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="h-12 w-12 rounded-full bg-[#F0F2F5] dark:bg-[#202C33] flex items-center justify-center text-[#8696A0] mb-3">
                <Users className="h-6 w-6" />
              </div>
              <p className="text-[14.5px] font-semibold text-[#111B21] dark:text-[#E9EDEF]">No contacts found</p>
              <p className="text-[12.5px] text-[#8696A0] mt-1 max-w-xs">
                {contactSearch ? "Try searching with a different name or number." : "No contacts available."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {sortedLetters.map((letter) => (
                <div key={letter}>
                  {/* Sticky Alphabet Header */}
                  <div className="sticky top-0 z-10 bg-[#F0F2F5] dark:bg-[#182229] px-4 py-1 text-[11.5px] font-bold uppercase tracking-wider text-[#008069] dark:text-[#00A884] border-y border-[#E2E8F0]/60 dark:border-[#222D34]">
                    {letter}
                  </div>

                  {/* Contacts for this letter */}
                  <div className="flex flex-col">
                    {groupedContacts[letter].map((contact) => {
                      const avatarUrl =
                        contact.avatarUrl ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}&background=00A884&color=fff`;

                      return (
                        <div
                          key={contact.id}
                          onClick={() => {
                            if (!contact.isUnregistered && contact.userId) {
                              handleStartChat(contact.userId);
                            }
                          }}
                          className="group relative flex w-full items-center justify-between px-4 py-2.5 transition-colors hover:bg-[#F0F2F5] dark:hover:bg-[#202C33] cursor-pointer"
                        >
                          <div className="flex items-center gap-3.5 min-w-0 pr-2">
                            <div className="relative shrink-0">
                              <img
                                src={getOptimizedImageUrl(avatarUrl, 52, 52)}
                                alt={contact.name}
                                className="h-[44px] w-[44px] rounded-full object-cover bg-gray-100 dark:bg-gray-800"
                              />
                              {contact.isOnline && (
                                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-[#25D366] border-2 border-white dark:border-[#111B21]" />
                              )}
                            </div>

                            <div className="flex flex-col min-w-0">
                              <h3 className="text-[14.5px] font-semibold text-[#111B21] dark:text-[#E9EDEF] truncate">
                                {contact.name}
                              </h3>
                              <p className="text-[12px] font-normal text-[#667781] dark:text-[#8696A0] truncate">
                                {contact.phone}
                              </p>
                            </div>
                          </div>

                          {/* Quick Action Buttons */}
                          {!contact.isUnregistered && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartChat(contact.userId);
                                }}
                                title="Message"
                                className="hidden group-hover:flex h-8 w-8 items-center justify-center rounded-full text-[#54656F] dark:text-[#AEBAC1] hover:bg-[#00A884]/15 hover:text-[#008069] dark:hover:text-[#25D366] transition-colors cursor-pointer"
                              >
                                <MessageSquare className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  initiateCall(contact.userId, "AUDIO", contact.name, contact.avatarUrl || undefined);
                                }}
                                title="Voice Call"
                                className="hidden group-hover:flex h-8 w-8 items-center justify-center rounded-full text-[#54656F] dark:text-[#AEBAC1] hover:bg-[#00A884]/15 hover:text-[#008069] dark:hover:text-[#25D366] transition-colors cursor-pointer"
                              >
                                <Phone className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  initiateCall(contact.userId, "VIDEO", contact.name, contact.avatarUrl || undefined);
                                }}
                                title="Video Call"
                                className="hidden group-hover:flex h-8 w-8 items-center justify-center rounded-full text-[#54656F] dark:text-[#AEBAC1] hover:bg-[#00A884]/15 hover:text-[#008069] dark:hover:text-[#25D366] transition-colors cursor-pointer"
                              >
                                <Video className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Right Panel: Modernized Media Gallery ───────────────────────── */}
      <div className="flex flex-1 flex-col bg-[#F0F2F5]/40 dark:bg-[#0C1317] overflow-hidden">
        
        {/* Gallery Top Navigation Header */}
        <div className="flex flex-col bg-white dark:bg-[#111B21] border-b border-[#E2E8F0] dark:border-[#222D34] px-6 pt-5 pb-0 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-[20px] font-bold text-[#111B21] dark:text-[#E9EDEF] tracking-tight">
                {t("title")}
              </h2>
              <p className="text-[12.5px] text-[#667781] dark:text-[#8696A0] mt-0.5">
                All photos, videos, documents, and links shared across your chats
              </p>
            </div>

            {/* In-Gallery Filter Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8696A0]" />
              <input
                type="text"
                placeholder="Search files & links..."
                value={gallerySearch}
                onChange={(e) => setGallerySearch(e.target.value)}
                className="h-[34px] w-full rounded-lg bg-[#F0F2F5] dark:bg-[#202C33] pl-9 pr-8 text-[12.5px] text-[#111B21] dark:text-[#E9EDEF] placeholder-[#8696A0] focus:outline-none focus:ring-1 focus:ring-[#00A884] transition-all"
              />
              {gallerySearch && (
                <button
                  onClick={() => setGallerySearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8696A0] hover:text-[#111B21] dark:hover:text-[#E9EDEF]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Segmented Tabs (Media / Docs / Links) */}
          <div className="flex items-center gap-8 -mb-[1px]">
            {[
              { id: "Media", label: t("tab_media"), count: totalMediaCount, icon: ImageIcon },
              { id: "Docs", label: t("tab_docs"), count: totalDocsCount, icon: FileText },
              { id: "Links", label: t("tab_links"), count: totalLinksCount, icon: LinkIcon },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-2 py-3 text-[13.5px] font-medium border-b-2 transition-all cursor-pointer relative",
                    isActive
                      ? "border-[#00A884] text-[#00A884] font-semibold"
                      : "border-transparent text-[#667781] dark:text-[#8696A0] hover:text-[#111B21] dark:hover:text-[#E9EDEF]"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      "text-[11.5px] px-1.5 py-0.2 rounded-full",
                      isActive
                        ? "bg-[#00A884]/15 text-[#008069] dark:text-[#25D366] font-semibold"
                        : "bg-black/5 dark:bg-white/10 text-[#667781] dark:text-[#8696A0]"
                    )}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Gallery Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {mediaLoading && media.length === 0 ? (
            <div className="flex h-full items-center justify-center py-24">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#00A884] border-t-transparent" />
            </div>
          ) : (
            <div className="max-w-6xl mx-auto flex flex-col gap-8 pb-16">
              
              {/* ── TAB 1: Media (Photos & Videos) ────────────────────────── */}
              {activeTab === "Media" && (
                mediaGroups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="h-16 w-16 rounded-full bg-[#F0F2F5] dark:bg-[#202C33] flex items-center justify-center text-[#8696A0] mb-4">
                      <ImageIcon className="h-8 w-8 opacity-60" />
                    </div>
                    <p className="text-[15px] font-semibold text-[#111B21] dark:text-[#E9EDEF]">{t("no_media")}</p>
                    <p className="text-[13px] text-[#8696A0] mt-1 max-w-sm">
                      {gallerySearch ? "No photos or videos match your search query." : "Photos and videos shared in your chats will automatically show up here."}
                    </p>
                  </div>
                ) : (
                  mediaGroups.map((group, index) => (
                    <div key={index} className="flex flex-col">
                      <div className="flex items-center justify-between mb-3 border-b border-[#E2E8F0]/80 dark:border-[#222D34] pb-2">
                        <h3 className="text-[15px] font-bold text-[#111B21] dark:text-[#E9EDEF] capitalize">
                          {group.label}
                        </h3>
                        <span className="text-[12px] font-normal text-[#667781] dark:text-[#8696A0]">
                          {group.items.length} {group.items.length === 1 ? "item" : "items"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                        {group.items.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => setSelectedMedia(item)}
                            className="group relative aspect-square overflow-hidden rounded-xl bg-[#E2E8F0] dark:bg-[#202C33] border border-black/5 dark:border-white/5 cursor-pointer shadow-xs hover:shadow-md transition-all duration-200"
                          >
                            {item.mediaType === "image" ? (
                              <img
                                src={getOptimizedImageUrl(item.mediaUrl, 300, 300)}
                                alt="Media"
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                loading="lazy"
                              />
                            ) : item.mediaType === "video" ? (
                              <div className="relative h-full w-full">
                                <video
                                  src={getRawMediaUrl(item.mediaUrl)}
                                  className="h-full w-full object-cover"
                                  preload="metadata"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/35 group-hover:bg-black/20 transition-colors">
                                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20 group-hover:scale-110 transition-transform">
                                    <Play className="h-4 w-4 fill-white ml-0.5" />
                                  </div>
                                </div>
                              </div>
                            ) : null}

                            {/* Hover Overlay with expand icon */}
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-2 pointer-events-none">
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-xs">
                                <Maximize2 className="h-3.5 w-3.5" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )
              )}

              {/* ── TAB 2: Docs (Documents & Files) ───────────────────────── */}
              {activeTab === "Docs" && (
                docsGroups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="h-16 w-16 rounded-full bg-[#F0F2F5] dark:bg-[#202C33] flex items-center justify-center text-[#8696A0] mb-4">
                      <FileText className="h-8 w-8 opacity-60" />
                    </div>
                    <p className="text-[15px] font-semibold text-[#111B21] dark:text-[#E9EDEF]">{t("no_docs")}</p>
                    <p className="text-[13px] text-[#8696A0] mt-1 max-w-sm">
                      {gallerySearch ? "No documents match your search query." : "PDFs, spreadsheets, and other files shared in your chats will appear here."}
                    </p>
                  </div>
                ) : (
                  docsGroups.map((group, index) => (
                    <div key={index} className="flex flex-col">
                      <div className="flex items-center justify-between mb-3 border-b border-[#E2E8F0]/80 dark:border-[#222D34] pb-2">
                        <h3 className="text-[15px] font-bold text-[#111B21] dark:text-[#E9EDEF] capitalize">
                          {group.label}
                        </h3>
                        <span className="text-[12px] font-normal text-[#667781] dark:text-[#8696A0]">
                          {group.items.length} {group.items.length === 1 ? "file" : "files"}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {group.items.map((item) => {
                          const filename = item.mediaUrl.split("/").pop() || "Document";
                          const ext = filename.split(".").pop()?.toUpperCase() || "FILE";
                          
                          return (
                            <div
                              key={item.id}
                              className="flex items-center gap-3.5 bg-white dark:bg-[#111B21] p-3.5 rounded-2xl border border-[#E2E8F0] dark:border-[#222D34] hover:border-[#00A884]/50 dark:hover:border-[#00A884]/50 hover:shadow-md transition-all group"
                            >
                              {/* File Extension Badge */}
                              <div className="flex flex-col items-center justify-center h-12 w-12 shrink-0 rounded-xl bg-[#00A884]/10 text-[#00A884] font-bold text-[11px] border border-[#00A884]/20 group-hover:bg-[#00A884] group-hover:text-white transition-colors">
                                <FileText className="h-5 w-5 mb-0.5" />
                                <span className="leading-none text-[9px]">{ext}</span>
                              </div>

                              {/* File Details */}
                              <div className="flex-1 min-w-0">
                                <p className="text-[14px] font-semibold text-[#111B21] dark:text-[#E9EDEF] truncate group-hover:text-[#00A884] transition-colors">
                                  {filename}
                                </p>
                                <p className="text-[12px] text-[#667781] dark:text-[#8696A0] mt-0.5">
                                  {new Date(item.createdAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>

                              {/* Download Action */}
                              <a
                                href={getRawMediaUrl(item.mediaUrl)}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={filename}
                                title="Download file"
                                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F0F2F5] dark:bg-[#202C33] text-[#54656F] dark:text-[#AEBAC1] hover:bg-[#00A884] hover:text-white transition-colors shrink-0"
                              >
                                <Download className="h-4 w-4" />
                              </a>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )
              )}

              {/* ── TAB 3: Links (Shared Web URLs) ────────────────────────── */}
              {activeTab === "Links" && (
                linksGroups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="h-16 w-16 rounded-full bg-[#F0F2F5] dark:bg-[#202C33] flex items-center justify-center text-[#8696A0] mb-4">
                      <LinkIcon className="h-8 w-8 opacity-60" />
                    </div>
                    <p className="text-[15px] font-semibold text-[#111B21] dark:text-[#E9EDEF]">{t("no_links")}</p>
                    <p className="text-[13px] text-[#8696A0] mt-1 max-w-sm">
                      {gallerySearch ? "No links match your search query." : "Links shared in your conversations will be compiled here."}
                    </p>
                  </div>
                ) : (
                  linksGroups.map((group, index) => (
                    <div key={index} className="flex flex-col">
                      <div className="flex items-center justify-between mb-3 border-b border-[#E2E8F0]/80 dark:border-[#222D34] pb-2">
                        <h3 className="text-[15px] font-bold text-[#111B21] dark:text-[#E9EDEF] capitalize">
                          {group.label}
                        </h3>
                        <span className="text-[12px] font-normal text-[#667781] dark:text-[#8696A0]">
                          {group.items.length} {group.items.length === 1 ? "link" : "links"}
                        </span>
                      </div>

                      <div className="flex flex-col gap-3">
                        {group.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between gap-4 bg-white dark:bg-[#111B21] p-3.5 rounded-2xl border border-[#E2E8F0] dark:border-[#222D34] hover:border-[#00A884]/50 dark:hover:border-[#00A884]/50 hover:shadow-md transition-all group"
                          >
                            <div className="flex items-center gap-3.5 min-w-0 flex-1">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#00A884]/10 text-[#00A884] border border-[#00A884]/20 group-hover:bg-[#00A884] group-hover:text-white transition-colors">
                                <LinkIcon className="h-5 w-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <a
                                  href={item.mediaUrl.startsWith("http") ? item.mediaUrl : `https://${item.mediaUrl}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[14px] font-semibold text-[#111B21] dark:text-[#E9EDEF] truncate block group-hover:text-[#00A884] transition-colors"
                                >
                                  {item.mediaUrl}
                                </a>
                                <p className="text-[12px] text-[#667781] dark:text-[#8696A0] mt-0.5">
                                  {new Date(item.createdAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                            </div>

                            {/* Actions (Copy Link & Open External) */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => handleCopyLink(item.id, item.mediaUrl)}
                                title="Copy link"
                                className="flex h-8 w-8 items-center justify-center rounded-full text-[#54656F] dark:text-[#AEBAC1] hover:bg-[#F0F2F5] dark:hover:bg-[#202C33] transition-colors cursor-pointer"
                              >
                                {copiedLinkId === item.id ? (
                                  <Check className="h-4 w-4 text-[#25D366]" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </button>
                              <a
                                href={item.mediaUrl.startsWith("http") ? item.mediaUrl : `https://${item.mediaUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Open link in new tab"
                                className="flex h-8 w-8 items-center justify-center rounded-full text-[#54656F] dark:text-[#AEBAC1] hover:bg-[#00A884] hover:text-white transition-colors"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )
              )}

              {/* Pagination Load More Button */}
              {hasMore && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={loadMore}
                    disabled={mediaLoading}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#00A884] hover:bg-[#008069] text-white text-[13.5px] font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-60 cursor-pointer"
                  >
                    {mediaLoading && (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    )}
                    <span>{mediaLoading ? tCommon("loading") : t("load_more")}</span>
                  </button>
                </div>
              )}

            </div>
          )}
        </div>
      </div>

      {/* ── Fullscreen Lightbox Media Viewer Modal ───────────────────────── */}
      {selectedMedia && (
        <div
          onClick={() => setSelectedMedia(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200"
        >
          {/* Top action bar */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute top-4 left-4 right-4 flex items-center justify-between z-10"
          >
            <div className="flex items-center gap-2 text-white/80 text-sm font-medium">
              <span>{new Date(selectedMedia.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={getRawMediaUrl(selectedMedia.mediaUrl)}
                target="_blank"
                rel="noopener noreferrer"
                download
                title="Download original"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors"
              >
                <Download className="h-5 w-5" />
              </a>
              <button
                onClick={() => setSelectedMedia(null)}
                title="Close"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Media Presentation */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-5xl max-h-[85vh] flex items-center justify-center overflow-hidden rounded-2xl shadow-2xl"
          >
            {selectedMedia.mediaType === "image" ? (
              <img
                src={getOptimizedImageUrl(selectedMedia.mediaUrl, 1600, 1600)}
                alt="Full preview"
                className="max-h-[85vh] max-w-full object-contain rounded-2xl"
              />
            ) : selectedMedia.mediaType === "video" ? (
              <video
                src={getRawMediaUrl(selectedMedia.mediaUrl)}
                controls
                autoPlay
                playsInline
                className="max-h-[85vh] max-w-full rounded-2xl"
              />
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
