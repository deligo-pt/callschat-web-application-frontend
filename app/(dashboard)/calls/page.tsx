"use client";

import React, { useState, useEffect } from "react";
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, Video, Search, Users, Star, Bell, VideoIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCallContext } from "@/components/providers/CallContext";
import { CallService, CallHistoryItem } from "@/services/call.service";
import { NewCallModal } from "@/components/call/NewCallModal";

function formatCallTimeOnly(dateStr: string) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
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
    <div className="flex h-full w-full bg-[#F8FAFC]">
      {/* Left Sidebar (Call List) */}
      <div className="flex h-full w-full flex-col border-r border-[#E6EAFA] bg-white md:w-[400px] shrink-0">
        <div className="flex flex-col px-6 pt-8 pb-4">
          <div className="flex items-center justify-between">
            <h1 className="text-[28px] font-extrabold tracking-tight text-[#3B58F5]">Calls</h1>
            <div className="flex items-center gap-3">
              <Star className="h-6 w-6 text-yellow-400 fill-yellow-400 cursor-pointer" />
              <Bell className="h-6 w-6 text-[#3B58F5] cursor-pointer" />
            </div>
          </div>

          {/* Search */}
          <div className="mt-6 relative">
            <Search className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#8F95B2]" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-[48px] w-full rounded-2xl bg-[#F0F2F5] pl-11 pr-4 text-[14px] font-medium text-[#11142D] placeholder-[#8F95B2] focus:outline-none focus:ring-1 focus:ring-[#3B58F5]/50"
            />
          </div>

          {/* Recent */}
          <div className="mt-6 flex">
             <button className="rounded-full bg-[#3B58F5] px-6 py-1.5 text-[13px] font-bold text-white shadow-md shadow-[#3B58F5]/20">
               Recent
             </button>
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
                      icon: PhoneIncoming,
                      color: "text-[#22C55E]",
                      text: `Incoming ${typeLabel}${call.durationSeconds ? ` · ${formatDuration(call.durationSeconds)}` : ""}`,
                    };
                  }
                  return {
                    icon: PhoneOutgoing,
                    color: "text-[#3B58F5]",
                    text: `Outgoing ${typeLabel}${call.durationSeconds ? ` · ${formatDuration(call.durationSeconds)}` : ""}`,
                  };
                };

                const statusInfo = getCallStatusDisplay();
                const StatusIcon = statusInfo.icon;

                return (
                  <div 
                    key={call.id} 
                    onClick={() => {
                      if (isGroup && call.groupId) {
                        startGroupCall(call.groupId, call.type);
                      } else if (peer) {
                        initiateCall(peer.id, call.type, peer.displayName, peer.avatarUrl || undefined);
                      }
                    }}
                    className="group relative flex w-full items-center justify-between px-6 py-4 transition-colors hover:bg-[#F4F7FE] cursor-pointer"
                  >
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
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center shrink-0">
                       <span className="text-[12px] font-semibold text-[#8F95B2]">
                          {formatCallTimeOnly(call.createdAt)}
                       </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-white">
        <div className="flex gap-8 mb-10">
          <button 
            onClick={() => {
              setNewCallType("VIDEO");
              setIsNewCallModalOpen(true);
            }}
            className="flex flex-col items-center justify-center h-[160px] w-[160px] bg-[#3B58F5] rounded-xl text-white shadow-lg shadow-[#3B58F5]/30 transition-transform hover:scale-105 active:scale-95"
          >
            <Video className="h-8 w-8 mb-4" />
            <span className="font-semibold text-[15px]">Start video call</span>
          </button>
          <button 
            onClick={() => {
              setNewCallType("AUDIO");
              setIsNewCallModalOpen(true);
            }}
            className="flex flex-col items-center justify-center h-[160px] w-[160px] bg-[#3B58F5] rounded-xl text-white shadow-lg shadow-[#3B58F5]/30 transition-transform hover:scale-105 active:scale-95"
          >
            <Phone className="h-8 w-8 mb-4" />
            <span className="font-semibold text-[15px]">Start Audio call</span>
          </button>
        </div>
        <p className="text-[15px] font-medium text-[#8F95B2] max-w-sm text-center mb-8">
          Select a contact from the list to start a voice or video call.
        </p>
        <button 
          onClick={() => {
            setNewCallType("AUDIO"); // Default to audio for "Call Now"
            setIsNewCallModalOpen(true);
          }}
          className="bg-[#11142D] text-white px-8 py-3 rounded-full font-semibold text-[15px] hover:bg-black transition-colors"
        >
          Call Now
        </button>
      </div>

      <NewCallModal 
        isOpen={isNewCallModalOpen} 
        onClose={() => setIsNewCallModalOpen(false)} 
        callType={newCallType} 
      />
    </div>
  );
}
