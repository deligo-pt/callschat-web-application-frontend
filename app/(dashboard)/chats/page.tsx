"use client";

import { cn } from "@/lib/utils";
import { Bell, MessageSquare, Search, Star } from "lucide-react";
import Link from "next/link";
import React from "react";

interface ActiveUser {
  id: string;
  name: string;
  avatarUrl: string;
  isOnline: boolean;
}

export default function ChatsPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeUsers, setActiveUsers] = React.useState<ActiveUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = React.useState(true);

  React.useEffect(() => {
    async function fetchUsers() {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setIsLoadingUsers(false);
          return;
        }

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000/api/v1";
        const res = await fetch(`${baseUrl}/contacts`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        
        const data = await res.json();
        if (data.success && data.data) {
          const mappedUsers = data.data?.map((u: any) => ({
            id: u.id,
            name: u.profile.displayName || u.profile.username || "Unknown",
            avatarUrl: u.profile.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.profile.displayName || u.profile.username || "U")}&background=F4F6FC&color=3B58F5`,
            isOnline: u.profile.isOnline || false
          }));
          setActiveUsers(mappedUsers);
        }
      } catch (error) {
        console.error("Failed to fetch users", error);
      } finally {
        setIsLoadingUsers(false);
      }
    }
    
    fetchUsers();
  }, []);

  const [recentChats, setRecentChats] = React.useState([]);

  const notificationsCount = 2;

  return (
    <div className="flex h-full w-full bg-[#F8FAFC]">
      
      {/* Middle Panel - Chats List */}
      <div className="flex h-full w-full flex-col border-r border-[#E6EAFA] bg-white md:w-[400px] shrink-0">
        
        {/* Header Area */}
        <div className="flex flex-col px-6 pt-8 pb-4">
          <div className="flex items-center justify-between">
            <h1 className="text-[28px] font-extrabold tracking-tight text-[#11142D]">
              Chats
            </h1>
            <div className="flex items-center gap-3">
              {/* Star/Story Icon */}
              <button className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#E6EAFA] bg-[#F4F6FC] transition-colors hover:bg-[#E6EAFA]">
                <Star className="h-5 w-5 text-[#3B58F5]" strokeWidth={2.5} />
                <div className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#FFA500]" />
              </button>
              
              {/* Notification Bell */}
              <button className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#E6EAFA] bg-[#F4F6FC] transition-colors hover:bg-[#E6EAFA]">
                <Bell className="h-5 w-5 text-[#3B58F5]" strokeWidth={2.5} />
                {notificationsCount > 0 && (
                  <div className="absolute right-2 top-2 h-2 w-2 rounded-full border border-white bg-red-500" />
                )}
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-6 relative">
            <Search className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#8F95B2]" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-[48px] w-full rounded-2xl bg-[#F4F6FC] pl-11 pr-4 text-[14px] font-medium text-[#11142D] placeholder-[#8F95B2] focus:outline-none focus:ring-1 focus:ring-[#3B58F5]/50"
            />
          </div>
        </div>

        {/* Scrollable List Area */}
        <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide md:pb-6">
          
          {/* Active Now Section */}
          <div className="mt-2 px-6">
            <div className="flex items-center justify-between">
              <h2 className="text-[14px] font-bold text-[#1D2A54]">Active Now</h2>
              <button className="text-[13px] font-semibold text-[#3B58F5] hover:underline">
                See all
              </button>
            </div>
            
            <div className="mt-4 flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {isLoadingUsers ? (
                <div className="flex w-full items-center justify-center py-4">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#3B58F5] border-t-transparent" />
                </div>
              ) : activeUsers.length > 0 ? (
                activeUsers.map((user) => (
                  <Link href={`/chats/${user.id}`} key={user.id} className="relative flex shrink-0 flex-col items-center">
                    <div className={cn(
                      "relative rounded-full border-[2.5px] p-0.5 transition-transform hover:scale-105 cursor-pointer",
                      user.isOnline ? "border-[#22C55E]" : "border-[#E6EAFA]"
                    )}>
                      <img 
                        src={user.avatarUrl} 
                        alt={user.name} 
                        className="h-[52px] w-[52px] rounded-full object-cover bg-white"
                      />
                    </div>
                    <span className="mt-1.5 text-[11px] font-medium text-[#8F95B2]">
                      {user.name.split(' ')[0]}
                    </span>
                  </Link>
                ))
              ) : (
                <div className="text-[13px] text-[#8F95B2]">No users found</div>
              )}
            </div>
          </div>

          {/* Messages List Section */}
          <div className="mt-6">
            <div className="px-6 mb-2">
              <h2 className="text-[14px] font-bold text-[#1D2A54]">Recent</h2>
            </div>
            
            <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
              {recentChats.length === 0 ? (
                <p className="text-[13px] font-medium text-[#8F95B2]">
                  No recent conversations. Click an active user above to start chatting securely.
                </p>
              ) : (
                <p className="text-[13px] font-medium text-[#8F95B2]">
                  Loading recent chats...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Active Chat Area (Empty State for Desktop) */}
      <div className="hidden flex-1 flex-col items-center justify-center bg-[#F8FAFC] md:flex">
        <div className="flex flex-col items-center text-center p-8">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-xl shadow-blue-500/5 mb-6">
            <MessageSquare className="h-10 w-10 text-[#3B58F5]" strokeWidth={1.5} />
          </div>
          <h2 className="text-[24px] font-bold text-[#1D2A54]">Your Messages</h2>
          <p className="mt-2 text-[15px] font-medium text-[#8F95B2] max-w-sm">
            Select a conversation from the sidebar or start a new chat to begin messaging.
          </p>
          <button className="mt-8 rounded-2xl bg-[#3B58F5] px-8 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-[#3B58F5]/25 transition-all hover:bg-[#2C48B8] active:scale-95">
            Start a New Conversation
          </button>
        </div>
      </div>

    </div>
  );
}
