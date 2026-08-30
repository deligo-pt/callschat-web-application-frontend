"use client";

import React, { useState, useEffect } from "react";
import { PhoneOff, Lock, Users } from "lucide-react";
import { useCallContext } from "@/components/providers/CallContext";
import { getOptimizedImageUrl } from "@/utils/image";

export const GroupOutgoingModal = () => {
  const { outgoingGroupCall, cancelGroupCall } = useCallContext();
  const [groupName, setGroupName] = useState<string>("Group Call");
  const [groupAvatar, setGroupAvatar] = useState<string>("");
  const [members, setMembers] = useState<{ id: string; name: string; avatarUrl: string | null }[]>([]);

  useEffect(() => {
    if (!outgoingGroupCall?.groupId) return;

    const fetchGroupProfile = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return;
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000/api/v1";
        
        const [res, membersRes] = await Promise.all([
          fetch(`${baseUrl}/groups/${outgoingGroupCall.groupId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${baseUrl}/groups/${outgoingGroupCall.groupId}/members`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        ]);
        
        const data = await res.json();
        const membersData = await membersRes.json();
        
        if (data.success && data.data) {
          setGroupName(data.data.name || "Group Call");
          setGroupAvatar(getOptimizedImageUrl(data.data.avatarUrl, 80, 80));
        }

        if (membersData.success && membersData.data && Array.isArray(membersData.data.members)) {
          // Exclude self if possible, but we don't have user id here. We just show top 4.
          setMembers(membersData.data.members.slice(0, 4).map((m: any) => ({
            id: m.userId || m.id,
            name: m.user?.name || m.name || m.profile?.name || "Unknown",
            avatarUrl: m.user?.avatarUrl || m.avatarUrl || m.profile?.avatarUrl || null
          })));
        }
      } catch (err) {
        console.error("Failed to fetch group profile or members", err);
      }
    };

    fetchGroupProfile();
  }, [outgoingGroupCall?.groupId]);

  if (!outgoingGroupCall) return null;

  const displayName = groupName;
  const avatarUrl = groupAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=00A884&color=fff&size=128`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md animate-in fade-in duration-300 pointer-events-auto">
      <div className="relative w-[380px] overflow-hidden rounded-[2.5rem] bg-[#111B21] p-8 shadow-[0_20px_80px_rgba(0,0,0,0.8)] border border-white/10 animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 ease-out flex flex-col items-center">
        
        {/* Subtle background emerald aura */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#00A884]/20 blur-[90px] rounded-full pointer-events-none" />

        {/* Top Header with E2EE Notice & Badge */}
        <div className="flex flex-col items-center gap-2 mb-8 z-10 w-full">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#8696A0] bg-white/5 px-3 py-1 rounded-full border border-white/5">
            <Lock className="w-3 h-3 text-[#00A884]" />
            <span>End-to-End Encrypted</span>
          </div>
          <span className="px-3.5 py-1 rounded-full bg-[#00A884]/15 text-[#25D366] text-[11.5px] font-semibold tracking-wide uppercase backdrop-blur-md border border-[#00A884]/30 shadow-xs animate-pulse">
            Calling Group...
          </span>
        </div>
        
        {/* Multi-member or Single Avatar Pulse Area */}
        <div className="flex flex-wrap justify-center gap-3 mb-8 z-10 max-w-[260px]">
          {members.length > 0 ? (
            members.map((m, idx) => {
              const mAvatar = m.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=00A884&color=fff&size=128`;
              return (
                <div key={m.id || idx} className="relative">
                  <div className="absolute inset-0 rounded-full border-2 border-[#25D366] animate-ping opacity-50" style={{ animationDuration: '2s', animationDelay: `${idx * 0.2}s` }} />
                  <img 
                    src={getOptimizedImageUrl(mAvatar)} 
                    alt={m.name}
                    className="relative h-16 w-16 rounded-full object-cover border-2 border-[#111B21] shadow-xl bg-[#202C33]"
                  />
                </div>
              );
            })
          ) : (
            <div className="relative mb-2 z-10">
              <div className="absolute inset-0 rounded-full border-2 border-[#25D366] animate-ping opacity-60" style={{ animationDuration: '2s' }} />
              <div className="absolute -inset-4 rounded-full border-2 border-[#00A884]/60 animate-pulse" />
              
              <img 
                src={getOptimizedImageUrl(avatarUrl)} 
                alt={displayName}
                className="relative h-28 w-28 rounded-full object-cover border-4 border-[#111B21] shadow-2xl bg-[#202C33]"
              />
            </div>
          )}
        </div>

        {/* Group Name & Info */}
        <div className="flex flex-col items-center text-center z-10 mb-10 w-full">
          <h2 className="text-[24px] font-bold text-[#E9EDEF] tracking-tight truncate w-full px-4">
            {displayName}
          </h2>
          <p className="mt-1 text-[13.5px] font-medium text-[#8696A0]">
            Connecting members...
          </p>
        </div>

        {/* Bottom Action Bar */}
        <div className="flex w-full justify-center items-center bg-[#202C33]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-4 z-10 shadow-inner shadow-white/5">
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                cancelGroupCall(outgoingGroupCall.groupId);
              }}
              className="group flex h-14 w-14 items-center justify-center rounded-full bg-[#EA0038] transition-all hover:bg-[#d00030] hover:scale-105 active:scale-95 shadow-[0_0_25px_rgba(234,0,56,0.4)] cursor-pointer"
              aria-label="Cancel Call"
            >
              <PhoneOff className="h-6 w-6 text-white transition-transform group-hover:rotate-12" fill="currentColor" />
            </button>
            <span className="text-[11.5px] font-medium text-red-400">Cancel</span>
          </div>
        </div>

      </div>
    </div>
  );
};

