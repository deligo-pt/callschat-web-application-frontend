"use client";

import React, { useState, useEffect } from "react";
import { Hash, Lock, Users, Search, Loader2, Headset } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChannelService } from "@/services/channel.service";
import { MeetingService } from "@/services/meeting.service";
import { useMeetingStore } from "@/hooks/useMeetingStore";
import { useUser } from "@/context/UserContext";

interface ChannelHeaderProps {
  channelId: string;
  channelName: string;
  channelDescription?: string | null;
  isPrivate?: boolean;
  memberCount?: number;
}

interface RealMember {
  id: string;
  name: string;
  role?: string;
  isOnline?: boolean;
  avatarUrl?: string;
}

export function ChannelHeader({
  channelId,
  channelName,
  channelDescription,
  isPrivate = false,
  memberCount,
}: ChannelHeaderProps) {
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [members, setMembers] = useState<RealMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  const { isJoining, setIsJoining, setMeeting } = useMeetingStore();
  const { workspace } = useUser();

  useEffect(() => {
    if (!isMembersOpen) return;

    const loadMembers = async () => {
      if (!workspace?.id) return;
      try {
        setIsLoadingMembers(true);
        const res = await ChannelService.getChannelMembers(workspace.id, channelId);
        if (res?.success) {
          const rawList = res.data || [];
          const formatted: RealMember[] = rawList.map((c: any) => {
            return {
              id: c.id,
              name: c.name,
              role: c.role || "Member",
              isOnline: c.isOnline || false,
              avatarUrl: c.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=8B5CF6&color=fff`,
            };
          });
          setMembers(formatted);
        }
      } catch (err) {
        console.error("Failed to fetch channel members", err);
      } finally {
        setIsLoadingMembers(false);
      }
    };

    loadMembers();
  }, [isMembersOpen]);

  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(memberSearch.toLowerCase())
  );

  // Right: Members & Actions
  const handleStartHuddle = async () => {
    if (!channelId || isJoining) return;
    if (!workspace?.id) {
      console.error("No active workspace found");
      return;
    }
    
    setIsJoining(true);
    try {
      const { meetingId } = await MeetingService.startHuddle(channelId, workspace.id);
      const { token } = await MeetingService.getToken(meetingId, workspace.id);
      setMeeting(meetingId, token, channelId);
    } catch (err) {
      console.error("Failed to start huddle", err);
      setIsJoining(false);
    }
  };

  return (
    <div className="flex items-center justify-between border-b border-[#E6EAFA] bg-white px-6 py-3.5 shadow-xs shrink-0 z-20">
      {/* Left: Channel Name & Description */}
      <div className="flex flex-col overflow-hidden">
        <div className="flex items-center gap-2">
          <span className="text-[#8B5CF6]">
            {isPrivate ? <Lock className="h-5 w-5" /> : <Hash className="h-5 w-5 stroke-[2.5]" />}
          </span>
          <h2 className="text-lg font-extrabold text-[#11142D] tracking-tight truncate">
            {channelName}
          </h2>
        </div>
        {channelDescription ? (
          <p className="text-xs font-medium text-[#6B7280] truncate max-w-xl mt-0.5">
            {channelDescription}
          </p>
        ) : (
          <p className="text-xs font-medium text-[#9CA3AF] italic mt-0.5">
            Add a topic or description for this channel
          </p>
        )}
      </div>

      {/* Right: Members & Actions */}
      <div className="flex items-center gap-2">
        {/* Huddle Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleStartHuddle}
          disabled={isJoining}
          className="h-9 gap-2 rounded-xl border-[#E6EAFA] bg-[#F8FAFC] px-3 font-semibold text-[#1D2A54] hover:bg-[#EEF2FF] hover:border-purple-200 transition-all cursor-pointer"
        >
          {isJoining ? (
            <Loader2 className="h-4 w-4 text-[#8B5CF6] animate-spin" />
          ) : (
            <Headset className="h-4 w-4 text-[#8B5CF6]" />
          )}
          <span>Huddle</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMembersOpen(true)}
          className="h-9 gap-2 rounded-xl border-[#E6EAFA] bg-[#F8FAFC] px-3 font-semibold text-[#1D2A54] hover:bg-[#EEF2FF] hover:border-purple-200 transition-all cursor-pointer"
        >
          <Users className="h-4 w-4 text-[#8B5CF6]" />
          <span>{memberCount !== undefined ? memberCount : members.length || 1}</span>
        </Button>
      </div>

      {/* Members Side Panel Sheet */}
      <Sheet open={isMembersOpen} onOpenChange={setIsMembersOpen}>
        <SheetContent className="w-[340px] sm:w-[380px] bg-white border-l border-[#E6EAFA] p-0 flex flex-col">
          <SheetHeader className="p-6 border-b border-[#E6EAFA]">
            <div className="flex items-center gap-2">
              <span className="text-[#8B5CF6]">
                {isPrivate ? <Lock className="h-4 w-4" /> : <Hash className="h-4 w-4" />}
              </span>
              <SheetTitle className="text-lg font-bold text-[#11142D]">
                {channelName}
              </SheetTitle>
            </div>
            <SheetDescription className="text-xs text-[#6B7280]">
              Members with access to this channel.
            </SheetDescription>
          </SheetHeader>

          {/* Search bar inside sheet */}
          <div className="p-4 border-b border-[#E6EAFA]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8F95B2]" />
              <Input
                placeholder="Find members..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="h-9 rounded-xl border-[#E6EAFA] bg-[#F8FAFC] pl-9 text-xs font-medium"
              />
            </div>
          </div>

          {/* Member List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {isLoadingMembers ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-[#8B5CF6]" />
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-8 text-xs font-medium text-[#8F95B2]">
                No members found.
              </div>
            ) : (
              filteredMembers.map((member, idx) => (
                <div
                  key={`${member.id}-${idx}`}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-[#F8FAFC] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={member.avatarUrl}
                        alt={member.name}
                        className="h-9 w-9 rounded-full object-cover"
                      />
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${
                          member.isOnline ? "bg-emerald-500" : "bg-gray-300"
                        }`}
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#11142D]">{member.name}</span>
                      <span className="text-[10px] font-semibold text-[#8F95B2] uppercase tracking-wider">
                        {member.role}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
