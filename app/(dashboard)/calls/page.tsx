"use client";

import React, { useState, useEffect } from "react";
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, Video, Search, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCallContext } from "@/components/providers/CallContext";
import { CallService, CallHistoryItem } from "@/services/call.service";

function formatCallTime(dateStr: string) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isToday) return `Today, ${timeStr}`;
  if (isYesterday) return `Yesterday, ${timeStr}`;
  return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeStr}`;
}

function formatDuration(seconds: number | null) {
  if (!seconds || seconds <= 0) return "";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

export default function CallsPage() {
  const [filter, setFilter] = useState<"all" | "missed">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [calls, setCalls] = useState<CallHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
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
    <div className="flex h-full w-full bg-[#F8FAFC]">
      {/* Left Sidebar (Call List) */}
      <div className="flex h-full w-full flex-col border-r border-[#E6EAFA] bg-white md:w-[400px] shrink-0">
        <div className="flex flex-col px-6 pt-8 pb-4">
          <h1 className="text-[28px] font-extrabold tracking-tight text-[#11142D]">Calls</h1>
          
          {/* Tabs */}
          <div className="mt-6 flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={cn(
                "rounded-full px-5 py-1.5 text-[13px] font-bold transition-colors",
                filter === "all" ? "bg-[#3B58F5] text-white shadow-md shadow-[#3B58F5]/20" : "border border-[#E6EAFA] bg-white text-[#8F95B2] hover:bg-[#F4F6FC]"
              )}
            >
              All
            </button>
            <button
              onClick={() => setFilter("missed")}
              className={cn(
                "rounded-full px-5 py-1.5 text-[13px] font-bold transition-colors",
                filter === "missed" ? "bg-[#3B58F5] text-white shadow-md shadow-[#3B58F5]/20" : "border border-[#E6EAFA] bg-white text-[#8F95B2] hover:bg-[#F4F6FC]"
              )}
            >
              Missed
            </button>
          </div>

          {/* Search */}
          <div className="mt-6 relative">
            <Search className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#8F95B2]" />
            <input
              type="text"
              placeholder="Search calls..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-[48px] w-full rounded-2xl bg-[#F4F6FC] pl-11 pr-4 text-[14px] font-medium text-[#11142D] placeholder-[#8F95B2] focus:outline-none focus:ring-1 focus:ring-[#3B58F5]/50"
            />
          </div>
        </div>

        {/* Call List */}
        <div className="flex-1 overflow-y-auto scrollbar-hide pb-24 md:pb-6">
          <div className="flex flex-col">
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#3B58F5] border-t-transparent" />
              </div>
            ) : filteredCalls.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
                <p className="text-[14px] font-medium text-[#8F95B2]">
                  {filter === "missed" ? "No missed calls." : "No call history found."}
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
                  ? call.groupAvatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=3B58F5&color=fff`
                  : peer?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=3B58F5&color=fff`;

                const isIncoming = call.callerId !== currentUserId;
                const isMissed = call.status === "MISSED";

                const getCallStatusDisplay = () => {
                  if (isMissed) {
                    return {
                      icon: PhoneMissed,
                      color: "text-[#EF4444]",
                      text: isIncoming ? "Missed call" : "Unanswered",
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
                      icon: PhoneIncoming,
                      color: "text-[#22C55E]",
                      text: `Incoming${call.durationSeconds ? ` • ${formatDuration(call.durationSeconds)}` : ""}`,
                    };
                  }
                  return {
                    icon: PhoneOutgoing,
                    color: "text-[#3B58F5]",
                    text: `Outgoing${call.durationSeconds ? ` • ${formatDuration(call.durationSeconds)}` : ""}`,
                  };
                };

                const statusInfo = getCallStatusDisplay();
                const StatusIcon = statusInfo.icon;

                return (
                  <div key={call.id} className="group relative flex w-full items-center justify-between px-6 py-3.5 transition-colors hover:bg-[#F4F7FE]">
                    <div className="flex items-center gap-4 min-w-0 pr-2">
                      <div className="relative shrink-0">
                        <img src={avatarUrl} alt={displayName} className="h-[48px] w-[48px] rounded-full object-cover bg-gray-100" />
                        {!isGroup && peer?.isOnline && (
                          <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#22C55E]" />
                        )}
                        {isGroup && (
                          <div className="absolute bottom-0 right-0 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-[#3B58F5] text-white">
                            <Users className="h-2.5 w-2.5" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[15px] font-bold text-[#1D2A54] truncate">
                          {displayName}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[13px] font-medium">
                          <StatusIcon className={cn("h-3.5 w-3.5 shrink-0", statusInfo.color)} />
                          <span className={cn("truncate", statusInfo.color)}>
                            {statusInfo.text}
                          </span>
                          <span className="text-[#CBD5E1] shrink-0">•</span>
                          <span className="text-[#8F95B2] shrink-0 text-[12px]">
                            {formatCallTime(call.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button 
                        onClick={() => {
                          if (isGroup && call.groupId) {
                            startGroupCall(call.groupId, "AUDIO");
                          } else if (peer) {
                            initiateCall(peer.id, "AUDIO", peer.displayName, peer.avatarUrl || undefined);
                          }
                        }}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF2FF] text-[#3B58F5] transition-colors hover:bg-[#3B58F5] hover:text-white shadow-sm"
                        title="Audio Call"
                      >
                        <Phone className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={() => {
                          if (isGroup && call.groupId) {
                            startGroupCall(call.groupId, "VIDEO");
                          } else if (peer) {
                            initiateCall(peer.id, "VIDEO", peer.displayName, peer.avatarUrl || undefined);
                          }
                        }}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF2FF] text-[#3B58F5] transition-colors hover:bg-[#3B58F5] hover:text-white shadow-sm"
                        title="Video Call"
                      >
                        <Video className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-[#F8FAFC]">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-xl shadow-blue-500/5 mb-6">
          <Phone className="h-10 w-10 text-[#3B58F5]" strokeWidth={1.5} />
        </div>
        <h2 className="text-[24px] font-bold text-[#1D2A54]">Your Calls</h2>
        <p className="mt-2 text-[15px] font-medium text-[#8F95B2] max-w-sm text-center">
          Select a contact from the sidebar or your contacts list to start a voice or video call.
        </p>
      </div>
    </div>
  );
}
