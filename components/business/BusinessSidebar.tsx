"use client";

import {
  Building2,
  ChevronDown,
  ChevronRight,
  Hash,
  Lock,
  Plus,
  Settings
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { usePresence } from "@/context/PresenceContext";
import { useUser } from "@/context/UserContext";
import { cn } from "@/lib/utils";
import { ChannelService, type ChannelData } from "@/services/channel.service";
import { chatService } from "@/services/chat.service";
import { UserPlus } from "lucide-react";
import { CreateChannelModal } from "./CreateChannelModal";
import { InviteMemberModal } from "./InviteMemberModal";

interface Conversation {
  id: string;
  otherUserId: string | null;
  otherUserName: string;
  otherUserAvatar: string | null;
  otherUserOnline: boolean;
}

export function BusinessSidebar() {
  const { workspace } = useUser();
  const { isUserOnline } = usePresence();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeChannelId = searchParams.get("channelId");

  const [channels, setChannels] = useState<ChannelData[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingChannels, setIsLoadingChannels] = useState(true);
  const [isLoadingDms, setIsLoadingDms] = useState(true);

  // Collapsible state
  const [isChannelsOpen, setIsChannelsOpen] = useState(true);
  const [isDmsOpen, setIsDmsOpen] = useState(true);

  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const fetchChannels = useCallback(async () => {
    if (!workspace?.id) {
      setIsLoadingChannels(false);
      return;
    }
    try {
      setIsLoadingChannels(true);
      const res = await ChannelService.getChannels(workspace.id);
      if (res?.success && Array.isArray(res.data)) {
        setChannels(res.data);
      }
    } catch (err) {
      console.error("Failed to load workspace channels", err);
    } finally {
      setIsLoadingChannels(false);
    }
  }, [workspace?.id]);

  const fetchDms = useCallback(async () => {
    try {
      setIsLoadingDms(true);
      const res = await chatService.fetchMyConversations();
      if (res?.success && Array.isArray(res.data)) {
        setConversations(res.data);
      }
    } catch (err) {
      console.error("Failed to load workspace DMs", err);
    } finally {
      setIsLoadingDms(false);
    }
  }, []);

  useEffect(() => {
    fetchChannels();
    fetchDms();
  }, [fetchChannels, fetchDms]);

  const handleChannelClick = (channel: ChannelData) => {
    router.push(
      `/chats?channelId=${channel.id}&channelName=${encodeURIComponent(
        channel.name
      )}&channelDesc=${encodeURIComponent(channel.description || "")}&isPrivate=${
        channel.isPrivate
      }`
    );
  };

  return (
    <div className="flex h-full w-full flex-col bg-[#11142D] text-[#CBD5E1] select-none">
      {/* Workspace Header & Settings Dropdown Trigger */}
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 shrink-0 hover:bg-white/5 transition-colors cursor-pointer group">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-extrabold shadow-md shadow-purple-500/20">
            {workspace?.name?.charAt(0).toUpperCase() || <Building2 className="h-5 w-5" />}
          </div>
          <div className="flex flex-col truncate">
            <span className="text-base font-extrabold text-white truncate tracking-tight flex items-center gap-1.5">
              {workspace?.name || "Corporate Workspace"}
              <ChevronDown className="h-4 w-4 text-[#8F95B2] group-hover:text-white transition-colors" />
            </span>
            <span className="text-[11px] font-semibold text-purple-400 truncate">
              @{workspace?.businessId || "business"}
            </span>
          </div>
        </div>
        <Link
          href="/business/settings"
          onClick={(e) => e.stopPropagation()}
          className="p-2 rounded-lg hover:bg-white/10 text-[#8F95B2] hover:text-white transition-colors"
          title="Workspace Settings"
        >
          <Settings className="h-4 w-4" />
        </Link>
      </div>

      {/* Navigation Scroll Area */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
        {/* CHANNELS SECTION */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between px-2 mb-1.5 group">
            <button
              onClick={() => setIsChannelsOpen(!isChannelsOpen)}
              className="flex items-center gap-1.5 text-xs font-bold text-[#8F95B2] uppercase tracking-wider hover:text-white transition-colors"
            >
              {isChannelsOpen ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
              <span>Channels</span>
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="p-1 rounded hover:bg-white/10 text-[#8F95B2] hover:text-white transition-colors opacity-80 group-hover:opacity-100"
              title="Create a Channel"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {isChannelsOpen && (
            <div className="space-y-0.5 mt-1">
              {isLoadingChannels ? (
                // Skeleton Loader
                <div className="space-y-2 px-2 py-1">
                  <div className="h-7 w-full animate-pulse rounded-lg bg-white/5" />
                  <div className="h-7 w-4/5 animate-pulse rounded-lg bg-white/5" />
                  <div className="h-7 w-3/4 animate-pulse rounded-lg bg-white/5" />
                </div>
              ) : channels.length === 0 ? (
                <div className="px-3 py-3 text-xs text-[#8F95B2] italic">
                  No channels yet. Click + to create one.
                </div>
              ) : (
                channels.map((channel) => {
                  const isActive = activeChannelId === channel.id;
                  return (
                    <button
                      key={channel.id}
                      onClick={() => handleChannelClick(channel)}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold transition-all group",
                        isActive
                          ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                          : "text-[#CBD5E1] hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <span className={cn("shrink-0", isActive ? "text-white" : "text-[#8F95B2] group-hover:text-white")}>
                        {channel.isPrivate ? (
                          <Lock className="h-4 w-4" />
                        ) : (
                          <Hash className="h-4 w-4" />
                        )}
                      </span>
                      <span className="truncate">{channel.name}</span>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* DIRECT MESSAGES SECTION */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between px-2 mb-1.5">
            <button
              onClick={() => setIsDmsOpen(!isDmsOpen)}
              className="flex items-center gap-1.5 text-xs font-bold text-[#8F95B2] uppercase tracking-wider hover:text-white transition-colors"
            >
              {isDmsOpen ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
              <span>Direct Messages</span>
            </button>
          </div>

          {isDmsOpen && (
            <div className="space-y-0.5 mt-1">
              {isLoadingDms ? (
                // Skeleton Loader
                <div className="space-y-2 px-2 py-1">
                  <div className="h-7 w-full animate-pulse rounded-lg bg-white/5" />
                  <div className="h-7 w-5/6 animate-pulse rounded-lg bg-white/5" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="px-3 py-3 text-xs text-[#8F95B2] italic">
                  No active coworker chats.
                </div>
              ) : (
                conversations.map((conv) => {
                  const isActive = !activeChannelId && pathname === `/chats/${conv.id}`;
                  const isOnline = isUserOnline(conv.otherUserId ?? "") || conv.otherUserOnline;
                  const avatarUrl =
                    conv.otherUserAvatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      conv.otherUserName
                    )}&background=2E3258&color=8B5CF6`;

                  return (
                    <Link
                      key={conv.id}
                      href={`/chats/${conv.id}?recipientId=${conv.otherUserId}`}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-all group",
                        isActive
                          ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                          : "text-[#CBD5E1] hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <div className="relative shrink-0">
                        <img
                          src={avatarUrl}
                          alt={conv.otherUserName}
                          className="h-6 w-6 rounded-full object-cover bg-white/10"
                        />
                        <span
                          className={cn(
                            "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#11142D]",
                            isOnline ? "bg-emerald-400" : "bg-gray-500"
                          )}
                        />
                      </div>
                      <span className="truncate">{conv.otherUserName}</span>
                    </Link>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Action - Invite Members */}
      <div className="p-4 border-t border-white/10 shrink-0">
        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/10"
        >
          <UserPlus className="h-4 w-4" />
          Invite Members
        </button>
      </div>

      {/* Channel Creation Modal */}
      {workspace?.id && (
        <>
          <CreateChannelModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            workspaceId={workspace.id}
            onChannelCreated={fetchChannels}
          />
          <InviteMemberModal
            isOpen={isInviteModalOpen}
            onClose={() => setIsInviteModalOpen(false)}
            workspaceId={workspace.id}
          />
        </>
      )}
    </div>
  );
}
