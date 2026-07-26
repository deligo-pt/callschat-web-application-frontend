"use client";

import React, { useState, useEffect } from "react";
import { PhoneOff } from "lucide-react";
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
  const avatarUrl = groupAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=3B58F5&color=fff&size=128`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300 pointer-events-auto">
      <div className="flex flex-col items-center">
        <h2 className="text-white/80 text-lg mb-8 font-medium animate-pulse">Calling Group...</h2>
        
        <div className="flex flex-wrap justify-center gap-4 mb-8 z-10 max-w-[280px]">
          {members.length > 0 ? (
            members.map((m, idx) => {
              const mAvatar = m.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=3B58F5&color=fff&size=128`;
              return (
                <div key={m.id || idx} className="relative">
                  <div className="absolute inset-0 rounded-full border-2 border-[#3B58F5] animate-ping opacity-50" style={{ animationDuration: '2s', animationDelay: `${idx * 0.2}s` }} />
                  <img 
                    src={getOptimizedImageUrl(mAvatar)} 
                    alt={m.name}
                    className="relative h-20 w-20 rounded-full object-cover border-2 border-[#1D2A54] shadow-xl"
                  />
                </div>
              );
            })
          ) : (
            <div className="relative mb-12 z-10">
              <div className="absolute inset-0 rounded-full border-2 border-[#3B58F5] animate-ping opacity-75" style={{ animationDuration: '2s' }} />
              <div className="absolute -inset-4 rounded-full border-2 border-[#3B58F5]/50 animate-pulse" />
              
              <img 
                src={getOptimizedImageUrl(avatarUrl)} 
                alt={displayName}
                className="relative h-32 w-32 rounded-full object-cover border-4 border-[#1D2A54] shadow-2xl"
              />
            </div>
          )}
        </div>

        <h1 className="text-white text-3xl font-bold mb-16 tracking-tight">
          {displayName}
        </h1>

        <button
          onClick={(e) => {
            e.stopPropagation();
            cancelGroupCall(outgoingGroupCall.groupId);
          }}
          className="group flex flex-col items-center gap-3"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 transition-all hover:bg-red-600 hover:scale-105 active:scale-95 shadow-lg shadow-red-500/30">
            <PhoneOff className="h-7 w-7 text-white" fill="currentColor" />
          </div>
          <span className="text-sm font-semibold text-white/70">Cancel</span>
        </button>
      </div>
    </div>
  );
};
