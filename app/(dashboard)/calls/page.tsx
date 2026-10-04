"use client";

import React, { useState, useEffect } from "react";
import { 
  Phone, 
  PhoneIncoming, 
  PhoneOutgoing, 
  PhoneMissed, 
  PhoneCall,
  Video, 
  Search, 
  Users, 
  Heart, 
  Lock, 
  X,
  Link2,
  ShieldCheck,
  ArrowUpRight,
  Clock,
  Calendar,
  MessageSquare,
  ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { useCallContext } from "@/components/providers/CallContext";
import { CallService, CallHistoryItem } from "@/services/call.service";
import { NewCallModal } from "@/components/call/NewCallModal";
import { getOptimizedImageUrl } from "@/utils/image";

function formatCallTimeOnly(dateStr: string) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  if (isToday) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatCallFullDateTime(dateStr: string) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDuration(seconds: number | null) {
  if (!seconds || seconds <= 0) return "";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

export default function CallsPage() {
  const pathname = usePathname();
  const router = useRouter();
  const chatBasePath = pathname.startsWith("/business") ? "/business/chats" : "/chats";
  const [filter, setFilter] = useState<"all" | "missed">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [calls, setCalls] = useState<CallHistoryItem[]>([]);
  const [selectedCall, setSelectedCall] = useState<CallHistoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isNewCallModalOpen, setIsNewCallModalOpen] = useState(false);
  const [newCallType, setNewCallType] = useState<"AUDIO" | "VIDEO">("AUDIO");
  const { initiateCall, startGroupCall } = useCallContext();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token) {
        try {
          const payload = JSON.parse(window.atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
          setCurrentUserId(payload.sub || payload.id || null);
        } catch {}
      }
    }
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const res = await CallService.getCallHistory(1, 50);
        if (res && Array.isArray(res.calls)) {
          setCalls(res.calls);
        }
      } catch (err) {
        console.error("Failed to fetch call history", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const filteredCalls = calls.filter((call) => {
    if (filter === "missed" && call.status !== "MISSED") return false;
    
    if (searchQuery) {
      const isGroup = Boolean(call.groupId);
      const peer = isGroup
        ? null
        : call.callerId === currentUserId
          ? call.receiver
          : call.initiator;

      const name = isGroup ? call.groupName || "Group Call" : peer?.displayName || "";
      if (!name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div className="flex h-full w-full bg-white dark:bg-[#111B21] overflow-hidden">
      {/* Left Sidebar (Call List) */}
      <div className={cn(
        "flex h-full w-full flex-col border-r border-[#E2E8F0] dark:border-[#222D34] bg-white dark:bg-[#111B21] md:w-[380px] lg:w-[420px] shrink-0",
        selectedCall ? "hidden md:flex" : "flex"
      )}>
        <div className="flex flex-col px-4 pt-5 pb-3 border-b border-[#E2E8F0]/60 dark:border-[#222D34]">
          {/* Header Bar */}
          <div className="flex items-center justify-between">
            <h1 className="text-[22px] font-bold tracking-tight text-[#111B21] dark:text-[#E9EDEF]">Calls</h1>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setNewCallType("AUDIO");
                  setIsNewCallModalOpen(true);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#54656F] dark:text-[#8696A0] hover:bg-black/5 dark:hover:bg-white/10 hover:text-[#00A884] dark:hover:text-[#00A884] transition-colors cursor-pointer"
                title="New Call"
              >
                <PhoneCall className="h-5 w-5" />
              </button>
              <Link 
                href={`${chatBasePath}/favorites`} 
                title="Favorites" 
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#F0F2F5] dark:hover:bg-[#202C33] text-[#54656F] dark:text-[#8696A0] hover:text-red-500 transition-colors focus:outline-none"
                aria-label="Favorites"
              >
                <Heart className="h-4.5 w-4.5" />
              </Link>
              <NotificationDropdown />
            </div>
          </div>

          {/* Search Input */}
          <div className="mt-3 relative flex items-center">
            <Search className="absolute left-3.5 h-4 w-4 text-[#8696A0] pointer-events-none" />
            <input
              type="text"
              placeholder="Search call history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-[38px] w-full rounded-xl bg-[#F0F2F5] dark:bg-[#202C33] pl-10 pr-9 text-[14px] font-normal text-[#111B21] dark:text-[#E9EDEF] placeholder-[#8696A0] focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 text-[#8696A0] hover:text-[#111B21] dark:hover:text-[#E9EDEF] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Quick Filter Chips */}
          <div className="mt-3 flex items-center gap-1.5">
            <button
              onClick={() => setFilter("all")}
              className={cn(
                "px-4 py-1 rounded-full text-[13px] font-semibold transition-all cursor-pointer",
                filter === "all"
                  ? "bg-[#00A884] text-white shadow-xs"
                  : "bg-[#F0F2F5] dark:bg-[#202C33] text-[#54656F] dark:text-[#8696A0] hover:bg-[#E5E9EC] dark:hover:bg-[#2A3942]"
              )}
            >
              All
            </button>
            <button
              onClick={() => setFilter("missed")}
              className={cn(
                "px-4 py-1 rounded-full text-[13px] font-semibold transition-all cursor-pointer",
                filter === "missed"
                  ? "bg-[#00A884] text-white shadow-xs"
                  : "bg-[#F0F2F5] dark:bg-[#202C33] text-[#54656F] dark:text-[#8696A0] hover:bg-[#E5E9EC] dark:hover:bg-[#2A3942]"
              )}
            >
              Missed
            </button>
          </div>
        </div>

        {/* WhatsApp-Style Create Call Link Shortcut */}
        {searchQuery === "" && filter === "all" && (
          <div 
            onClick={() => {
              setNewCallType("AUDIO");
              setIsNewCallModalOpen(true);
            }}
            className="flex items-center gap-3.5 px-4 py-3 border-b border-[#E2E8F0]/40 dark:border-[#222D34] hover:bg-[#F0F2F5] dark:hover:bg-[#202C33] transition-colors cursor-pointer group"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#00A884] text-white shadow-xs group-hover:scale-105 transition-transform">
              <Link2 className="h-5 w-5" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[14.5px] font-semibold text-[#111B21] dark:text-[#E9EDEF]">
                Start a new call
              </span>
              <span className="text-[12px] font-normal text-[#667781] dark:text-[#8696A0]">
                Call any contact via audio or video
              </span>
            </div>
            <ArrowUpRight className="h-4 w-4 text-[#8696A0] group-hover:text-[#00A884] transition-colors" />
          </div>
        )}

        {/* Call List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pb-24 md:pb-6">
          <div className="flex flex-col">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#00A884] border-t-transparent" />
              </div>
            ) : filteredCalls.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="h-12 w-12 rounded-full bg-[#F0F2F5] dark:bg-[#202C33] flex items-center justify-center text-[#8696A0] mb-3">
                  <Phone className="h-6 w-6" />
                </div>
                <p className="text-[14px] font-semibold text-[#111B21] dark:text-[#E9EDEF]">
                  {filter === "missed" ? "No missed calls" : "No call history found"}
                </p>
                <p className="text-[12px] text-[#8696A0] mt-0.5 max-w-xs">
                  {filter === "missed" ? "You're all caught up." : "Start a voice or video call with any contact."}
                </p>
              </div>
            ) : (
              filteredCalls.map((call) => {
                const isGroup = Boolean(call.groupId);
                const peer = isGroup
                  ? null
                  : call.callerId === currentUserId
                    ? call.receiver
                    : call.initiator;

                const displayName = isGroup
                  ? call.groupName || "Group Call"
                  : peer?.displayName || "Unknown";

                const avatarUrl = isGroup
                  ? call.groupAvatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=00A884&color=fff`
                  : peer?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=00A884&color=fff`;

                const isIncoming = call.callerId !== currentUserId;
                const isMissed = call.status === "MISSED";

                const getCallStatusDisplay = () => {
                  const typeLabel = call.type === 'VIDEO' ? 'Video' : 'Audio';
                  if (isMissed) {
                    return {
                      icon: call.type === 'VIDEO' ? Video : PhoneMissed,
                      color: "text-[#EF4444]",
                      text: `Missed ${typeLabel}`,
                    };
                  }
                  if (call.status === "DECLINED") {
                    return {
                      icon: isIncoming ? PhoneIncoming : PhoneOutgoing,
                      color: "text-[#64748B]",
                      text: "Declined",
                    };
                  }
                  if (isIncoming) {
                    return {
                      icon: call.type === 'VIDEO' ? Video : PhoneIncoming,
                      color: "text-[#25D366]",
                      text: `Incoming ${typeLabel}${call.durationSeconds ? ` · ${formatDuration(call.durationSeconds)}` : ""}`,
                    };
                  }
                  return {
                    icon: call.type === 'VIDEO' ? Video : PhoneOutgoing,
                    color: "text-[#00A884]",
                    text: `Outgoing ${typeLabel}${call.durationSeconds ? ` · ${formatDuration(call.durationSeconds)}` : ""}`,
                  };
                };

                const statusInfo = getCallStatusDisplay();
                const StatusIcon = statusInfo.icon;

                return (
                  <div 
                    key={call.id} 
                    onClick={() => setSelectedCall(call)}
                    className={cn(
                      "group relative flex w-full items-center justify-between px-4 py-3 transition-colors cursor-pointer",
                      selectedCall?.id === call.id
                        ? "bg-[#F0F2F5] dark:bg-[#202C33]"
                        : "hover:bg-[#F0F2F5]/70 dark:hover:bg-[#202C33]/70"
                    )}
                  >
                    <div className="flex items-center gap-3.5 min-w-0 pr-2">
                      <div className="relative shrink-0">
                        <img 
                          src={getOptimizedImageUrl(avatarUrl)} 
                          alt={displayName} 
                          className="h-[46px] w-[46px] rounded-full object-cover bg-gray-100 dark:bg-gray-800" 
                        />
                        {!isGroup && peer?.isOnline && (
                          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-[#111B21] bg-[#25D366]" />
                        )}
                        {isGroup && (
                          <div className="absolute bottom-0 right-0 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white dark:border-[#111B21] bg-[#00A884] text-white">
                            <Users className="h-2.5 w-2.5" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className={cn(
                          "text-[14.5px] font-semibold truncate",
                          isMissed ? "text-[#EF4444]" : "text-[#111B21] dark:text-[#E9EDEF]"
                        )}>
                          {displayName}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[12.5px] font-normal">
                          <StatusIcon className={cn("h-3.5 w-3.5 shrink-0", statusInfo.color)} />
                          <span className={cn("truncate", statusInfo.color)}>
                            {statusInfo.text}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[12px] font-normal text-[#667781] dark:text-[#8696A0]">
                        {formatCallTimeOnly(call.createdAt)}
                      </span>
                      {/* 1-Click Direct Redial Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isGroup && call.groupId) {
                            startGroupCall(call.groupId, call.type);
                          } else if (peer) {
                            initiateCall(peer.id, call.type, peer.displayName, peer.avatarUrl || undefined);
                          }
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00A884]/15 text-[#008069] dark:text-[#25D366] hover:bg-[#00A884] hover:text-white transition-colors cursor-pointer"
                        title={`Call ${displayName}`}
                      >
                        {call.type === 'VIDEO' ? (
                          <Video className="h-4 w-4" />
                        ) : (
                          <Phone className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Right Pane: WhatsApp Call Info or Standby View */}
      {selectedCall ? (
        (() => {
          const isGroup = Boolean(selectedCall.groupId);
          const peer = isGroup
            ? null
            : selectedCall.callerId === currentUserId
              ? selectedCall.receiver
              : selectedCall.initiator;

          const displayName = isGroup
            ? selectedCall.groupName || "Group Call"
            : peer?.displayName || "Unknown";

          const avatarUrl = isGroup
            ? selectedCall.groupAvatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=00A884&color=fff`
            : peer?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=00A884&color=fff`;

          const isIncoming = selectedCall.callerId !== currentUserId;
          const isMissed = selectedCall.status === "MISSED";

          const getSelectedCallStatus = () => {
            const typeLabel = selectedCall.type === 'VIDEO' ? 'Video' : 'Voice';
            if (isMissed) {
              return {
                icon: selectedCall.type === 'VIDEO' ? Video : PhoneMissed,
                color: "text-[#EF4444]",
                title: `Missed ${typeLabel} call`,
                subtitle: "Unanswered",
              };
            }
            if (selectedCall.status === "DECLINED") {
              return {
                icon: isIncoming ? PhoneIncoming : PhoneOutgoing,
                color: "text-[#64748B]",
                title: `${isIncoming ? "Incoming" : "Outgoing"} ${typeLabel} call`,
                subtitle: "Declined",
              };
            }
            if (isIncoming) {
              return {
                icon: selectedCall.type === 'VIDEO' ? Video : PhoneIncoming,
                color: "text-[#25D366]",
                title: `Incoming ${typeLabel} call`,
                subtitle: selectedCall.durationSeconds ? formatDuration(selectedCall.durationSeconds) : "Connected",
              };
            }
            return {
              icon: selectedCall.type === 'VIDEO' ? Video : PhoneOutgoing,
              color: "text-[#00A884]",
              title: `Outgoing ${typeLabel} call`,
              subtitle: selectedCall.durationSeconds ? formatDuration(selectedCall.durationSeconds) : "Connected",
            };
          };

          const status = getSelectedCallStatus();
          const StatusIcon = status.icon;

          return (
            <div className="flex-1 flex flex-col h-full bg-[#F0F2F5]/40 dark:bg-[#111B21] overflow-y-auto custom-scrollbar">
              {/* Top Bar */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] dark:border-[#222D34] bg-white dark:bg-[#111B21]">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedCall(null)}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-[#54656F] dark:text-[#8696A0] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    title="Close details"
                  >
                    <ChevronLeft className="h-5 w-5 md:hidden" />
                    <X className="hidden md:block h-5 w-5" />
                  </button>
                  <h2 className="text-[17px] font-semibold text-[#111B21] dark:text-[#E9EDEF]">Call info</h2>
                </div>
              </div>

              {/* Profile & Quick Actions */}
              <div className="flex flex-col items-center pt-8 pb-6 px-6 bg-white dark:bg-[#111B21] border-b border-[#E2E8F0] dark:border-[#222D34]">
                <div className="relative mb-4">
                  <img
                    src={getOptimizedImageUrl(avatarUrl)}
                    alt={displayName}
                    className="h-24 w-24 rounded-full object-cover shadow-sm bg-gray-100 dark:bg-gray-800"
                  />
                  {!isGroup && peer?.isOnline && (
                    <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white dark:border-[#111B21] bg-[#25D366]" />
                  )}
                  {isGroup && (
                    <div className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white dark:border-[#111B21] bg-[#00A884] text-white">
                      <Users className="h-3 w-3" />
                    </div>
                  )}
                </div>

                <h3 className="text-[20px] font-bold text-[#111B21] dark:text-[#E9EDEF] text-center">
                  {displayName}
                </h3>
                <p className="text-[13px] text-[#667781] dark:text-[#8696A0] mt-0.5">
                  {isGroup ? "Group Call" : peer?.isOnline ? "Online" : "Offline"}
                </p>

                {/* 3 WhatsApp-style Quick Action Buttons */}
                <div className="flex items-center gap-6 mt-6">
                  {/* Voice Call */}
                  <button
                    onClick={() => {
                      if (isGroup && selectedCall.groupId) {
                        startGroupCall(selectedCall.groupId, "AUDIO");
                      } else if (peer) {
                        initiateCall(peer.id, "AUDIO", peer.displayName, peer.avatarUrl || undefined);
                      }
                    }}
                    className="flex flex-col items-center gap-1.5 group cursor-pointer"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#00A884]/15 text-[#008069] dark:text-[#25D366] group-hover:bg-[#00A884] group-hover:text-white transition-all">
                      <Phone className="h-5 w-5" />
                    </div>
                    <span className="text-[12px] font-medium text-[#54656F] dark:text-[#8696A0]">Voice</span>
                  </button>

                  {/* Video Call */}
                  <button
                    onClick={() => {
                      if (isGroup && selectedCall.groupId) {
                        startGroupCall(selectedCall.groupId, "VIDEO");
                      } else if (peer) {
                        initiateCall(peer.id, "VIDEO", peer.displayName, peer.avatarUrl || undefined);
                      }
                    }}
                    className="flex flex-col items-center gap-1.5 group cursor-pointer"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#00A884]/15 text-[#008069] dark:text-[#25D366] group-hover:bg-[#00A884] group-hover:text-white transition-all">
                      <Video className="h-5 w-5" />
                    </div>
                    <span className="text-[12px] font-medium text-[#54656F] dark:text-[#8696A0]">Video</span>
                  </button>

                  {/* Message */}
                  <button
                    onClick={() => {
                      if (isGroup && selectedCall.groupId) {
                        router.push(`${chatBasePath}?groupId=${selectedCall.groupId}`);
                      } else if (peer) {
                        router.push(`${chatBasePath}?userId=${peer.id}`);
                      }
                    }}
                    className="flex flex-col items-center gap-1.5 group cursor-pointer"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F0F2F5] dark:bg-[#202C33] text-[#54656F] dark:text-[#8696A0] group-hover:bg-[#00A884] group-hover:text-white transition-all">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <span className="text-[12px] font-medium text-[#54656F] dark:text-[#8696A0]">Message</span>
                  </button>
                </div>
              </div>

              {/* Call Details Log Section */}
              <div className="p-6 max-w-2xl mx-auto w-full">
                <div className="text-[13px] font-semibold text-[#667781] dark:text-[#8696A0] uppercase tracking-wider mb-3 px-1">
                  Call Details
                </div>
                
                <div className="bg-white dark:bg-[#111B21] rounded-2xl border border-[#E2E8F0] dark:border-[#222D34] shadow-xs p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F0F2F5] dark:bg-[#202C33]",
                      status.color
                    )}>
                      <StatusIcon className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[14.5px] font-semibold text-[#111B21] dark:text-[#E9EDEF]">
                        {status.title}
                      </span>
                      <span className="text-[12.5px] text-[#667781] dark:text-[#8696A0]">
                        {formatCallFullDateTime(selectedCall.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[13.5px] font-semibold text-[#111B21] dark:text-[#E9EDEF]">
                      {status.subtitle}
                    </span>
                  </div>
                </div>

                {/* E2EE Info notice */}
                <div className="mt-8 flex items-center justify-center gap-1.5 text-[12px] text-[#8696A0] text-center">
                  <Lock className="h-3.5 w-3.5 text-[#00A884]" />
                  <span>End-to-end encrypted voice and video call</span>
                </div>
              </div>
            </div>
          );
        })()
      ) : (
        /* Main Content Standby Area (WhatsApp Web E2EE Design) */
        <div className="hidden md:flex flex-1 flex-col items-center justify-center chat-canvas-bg relative p-8 select-none">
          <div className="relative z-10 flex flex-col items-center max-w-[460px] text-center bg-white/80 dark:bg-[#202C33]/80 backdrop-blur-md p-8 rounded-3xl border border-white/60 dark:border-white/10 shadow-xl">
            {/* Animated Call Shield Graphic */}
            <div className="relative mb-6">
              <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-[#00A884] to-[#25D366] flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 animate-in zoom-in duration-300">
                <Phone className="h-9 w-9" />
              </div>
              <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-white dark:bg-[#111B21] flex items-center justify-center shadow-md">
                <ShieldCheck className="h-5 w-5 text-[#00A884]" />
              </div>
            </div>

            <h2 className="text-[24px] font-bold text-[#111B21] dark:text-[#E9EDEF] tracking-tight mb-2">
              CallsChat Audio & Video
            </h2>
            <p className="text-[14px] text-[#54656F] dark:text-[#8696A0] leading-relaxed mb-8">
              Stay connected with crisp, end-to-end encrypted audio and video calls. Connect with anyone instantly.
            </p>

            {/* Quick Call Action Buttons */}
            <div className="flex flex-wrap justify-center gap-3 w-full mb-6">
              <button 
                onClick={() => {
                  setNewCallType("VIDEO");
                  setIsNewCallModalOpen(true);
                }}
                className="flex-1 min-w-[170px] flex items-center justify-center gap-2 bg-[#00A884] hover:bg-[#008069] text-white px-5 py-3 rounded-2xl font-semibold text-[14px] shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <Video className="h-4.5 w-4.5" />
                <span>Start Video Call</span>
              </button>
              <button 
                onClick={() => {
                  setNewCallType("AUDIO");
                  setIsNewCallModalOpen(true);
                }}
                className="flex-1 min-w-[170px] flex items-center justify-center gap-2 bg-white dark:bg-[#2A3942] border border-[#E2E8F0] dark:border-[#374248] hover:bg-[#F0F2F5] dark:hover:bg-[#323D45] text-[#111B21] dark:text-[#E9EDEF] px-5 py-3 rounded-2xl font-semibold text-[14px] shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <Phone className="h-4.5 w-4.5 text-[#00A884]" />
                <span>Start Audio Call</span>
              </button>
            </div>

            {/* End-to-End Encryption Guarantee Footer */}
            <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#667781] dark:text-[#8696A0] bg-[#00A884]/10 dark:bg-[#00A884]/15 px-3 py-1.5 rounded-full">
              <Lock className="h-3.5 w-3.5 text-[#00A884]" />
              <span>End-to-end encrypted voice and video</span>
            </div>
          </div>
        </div>
      )}

      <NewCallModal 
        isOpen={isNewCallModalOpen} 
        onClose={() => setIsNewCallModalOpen(false)} 
        callType={newCallType} 
      />
    </div>
  );
}
