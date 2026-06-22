"use client";

import React from "react";
import { Search, Star, Bell, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
        const res = await fetch(`${baseUrl}/user/all`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        
        const data = await res.json();
        if (data.success && data.data) {
          const mappedUsers = data.data.map((u: any) => ({
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

  const messages = [
    {
      id: 1,
      senderName: "Sarah Jenkins",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
      lastMessage: "Hey, are we still on for the meeting later?",
      time: "09:20",
      unreadCount: 3,
      isActive: true,
    },
    {
      id: 2,
      senderName: "Design Team",
      avatarUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=150&q=80",
      lastMessage: "Brooklyn: I've uploaded the new assets.",
      time: "Yesterday",
      unreadCount: 0,
      isActive: false,
    },
    {
      id: 3,
      senderName: "Alex Morgan",
      avatarUrl: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80",
      lastMessage: "Thanks for the help! 🙌",
      time: "Yesterday",
      unreadCount: 0,
      isActive: true,
    },
    {
      id: 4,
      senderName: "Emma Davis",
      avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80",
      lastMessage: "Can you send me the presentation?",
      time: "Tuesday",
      unreadCount: 1,
      isActive: false,
    },
    {
      id: 5,
      senderName: "James Wilson",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      lastMessage: "Sounds good to me.",
      time: "Monday",
      unreadCount: 0,
      isActive: false,
    },
    {
      id: 6,
      senderName: "Marketing Group",
      avatarUrl: "https://images.unsplash.com/photo-1556761175-5973dc0f32b7?auto=format&fit=crop&w=150&q=80",
      lastMessage: "Don't forget the deadline tomorrow!",
      time: "Monday",
      unreadCount: 5,
      isActive: true,
    },
    {
      id: 7,
      senderName: "Marketing Group",
      avatarUrl: "https://images.unsplash.com/photo-1556761175-5973dc0f32b7?auto=format&fit=crop&w=150&q=80",
      lastMessage: "Don't forget the deadline tomorrow!",
      time: "Monday",
      unreadCount: 0,
      isActive: false,
    },
  ];

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
                  <div key={user.id} className="relative flex shrink-0 flex-col items-center">
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
                  </div>
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
            
            <div className="flex flex-col">
              {messages.map((msg, index) => (
                <motion.button 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={msg.id} 
                  className="group relative flex w-full items-center gap-4 px-6 py-3.5 transition-colors hover:bg-[#F4F7FE] focus:bg-[#F4F7FE] focus:outline-none"
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <img 
                      src={msg.avatarUrl} 
                      alt={msg.senderName} 
                      className="h-[54px] w-[54px] rounded-full object-cover"
                    />
                    {msg.isActive && (
                      <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#22C55E]" />
                    )}
                  </div>

                  {/* Message Content */}
                  <div className="flex flex-1 flex-col items-start overflow-hidden">
                    <h3 className="text-[15px] font-bold text-[#1D2A54] truncate w-full text-left">{msg.senderName}</h3>
                    <p className={cn(
                      "mt-0.5 w-full truncate text-left text-[14px]", 
                      msg.unreadCount > 0 ? "font-bold text-[#1D2A54]" : "font-medium text-[#8F95B2]"
                    )}>
                      {msg.lastMessage}
                    </p>
                  </div>

                  {/* Time & Badge */}
                  <div className="flex flex-col items-end justify-center gap-1.5 shrink-0">
                    <span className={cn(
                      "text-[12px] font-semibold",
                      msg.unreadCount > 0 ? "text-[#3B58F5]" : "text-[#8F95B2]"
                    )}>{msg.time}</span>
                    {msg.unreadCount > 0 ? (
                      <div className="flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-[#3B58F5] px-1.5 text-[11px] font-bold text-white shadow-sm">
                        {msg.unreadCount}
                      </div>
                    ) : (
                      <div className="h-[22px]" />
                    )}
                  </div>
                </motion.button>
              ))}
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
