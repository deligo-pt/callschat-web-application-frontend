"use client";

import * as React from "react";
import { Search, Bell, MessageSquare, PhoneCall, Users, Contact, UserCircle2, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { motion } from "framer-motion";

// --- Types for Real-Time Data ---
interface ActiveUser {
  id: string;
  name: string;
  avatarUrl: string;
  isActive: boolean;
}

interface ChatPreview {
  id: string;
  senderName: string;
  avatarUrl: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  isActive: boolean;
}

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = React.useState("");
  
  // Real-time state placeholders
  const [activeUsers, setActiveUsers] = React.useState<ActiveUser[]>([]);
  const [messages, setMessages] = React.useState<ChatPreview[]>([]);
  const [notificationsCount, setNotificationsCount] = React.useState(0);

  // Simulated Real-Time Data Fetching
  // TODO: Replace with actual Socket.io listeners and API fetches
  React.useEffect(() => {
    // Mocking an API response or Socket event
    const fetchRealTimeData = () => {
      setActiveUsers([
        { id: "1", name: "User1", avatarUrl: "https://i.pravatar.cc/150?u=a1", isActive: true },
        { id: "2", name: "User2", avatarUrl: "https://i.pravatar.cc/150?u=a2", isActive: true },
        { id: "3", name: "User3", avatarUrl: "https://i.pravatar.cc/150?u=a3", isActive: true },
        { id: "4", name: "User4", avatarUrl: "https://i.pravatar.cc/150?u=a4", isActive: true },
        { id: "5", name: "User5", avatarUrl: "https://i.pravatar.cc/150?u=a5", isActive: true },
        { id: "6", name: "User6", avatarUrl: "https://i.pravatar.cc/150?u=a6", isActive: true },
      ]);

      setMessages([
        { id: "m1", senderName: "Sarah John", avatarUrl: "https://i.pravatar.cc/150?u=a1", lastMessage: "Let me know if 3pm work!", time: "10:47 AM", unreadCount: 3, isActive: true },
        { id: "m2", senderName: "Brooklyn Si", avatarUrl: "https://i.pravatar.cc/150?u=a2", lastMessage: "Let me know if 3pm work!", time: "10:47 AM", unreadCount: 0, isActive: true },
        { id: "m3", senderName: "Darrell", avatarUrl: "https://i.pravatar.cc/150?u=a7", lastMessage: "Let me know if 3pm work!", time: "10:47 AM", unreadCount: 0, isActive: false },
        { id: "m4", senderName: "Jane", avatarUrl: "https://i.pravatar.cc/150?u=a8", lastMessage: "Let me know if 3pm work!", time: "10:47 AM", unreadCount: 1, isActive: true },
        { id: "m5", senderName: "Cody", avatarUrl: "https://i.pravatar.cc/150?u=a9", lastMessage: "Let me know if 3pm work!", time: "10:47 AM", unreadCount: 3, isActive: false },
        { id: "m6", senderName: "Wade", avatarUrl: "https://i.pravatar.cc/150?u=a10", lastMessage: "Let me know if 3pm work!", time: "10:47 AM", unreadCount: 0, isActive: true },
      ]);

      setNotificationsCount(2); // Example dynamic notification count
    };

    fetchRealTimeData();
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white font-sans">
      
      {/* Desktop Sidebar Navigation (Visible only on md+ screens) */}
      <div className="hidden w-[80px] shrink-0 flex-col items-center border-r border-[#F4F6FC] bg-white py-8 md:flex">
        <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-[1rem] bg-[#3B58F5] shadow-lg shadow-[#3B58F5]/30">
          <MessageSquare className="h-6 w-6 text-white" strokeWidth={2} />
        </div>

        <div className="flex flex-1 flex-col items-center gap-8">
          <Link href="/home" className="group relative flex flex-col items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EEF2FB] transition-colors">
              <MessageSquare className="h-6 w-6 text-[#3B58F5]" strokeWidth={2.5} />
            </div>
          </Link>

          <Link href="/calls" className="group flex flex-col items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl transition-colors hover:bg-gray-50">
              <PhoneCall className="h-6 w-6 text-[#A0A6C0] group-hover:text-[#3B58F5]" strokeWidth={2.5} />
            </div>
          </Link>

          <Link href="/groups" className="group flex flex-col items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl transition-colors hover:bg-gray-50">
              <Users className="h-6 w-6 text-[#A0A6C0] group-hover:text-[#3B58F5]" strokeWidth={2.5} />
            </div>
          </Link>

          <Link href="/contacts" className="group flex flex-col items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl transition-colors hover:bg-gray-50">
              <Contact className="h-6 w-6 text-[#A0A6C0] group-hover:text-[#3B58F5]" strokeWidth={2.5} />
            </div>
          </Link>
        </div>

        <Link href="/profile" className="mt-auto group flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl transition-colors hover:bg-gray-50">
            <UserCircle2 className="h-6 w-6 text-[#A0A6C0] group-hover:text-[#3B58F5]" strokeWidth={2.5} />
          </div>
        </Link>
      </div>

      {/* Chats List Panel */}
      <div className="relative flex h-full w-full shrink-0 flex-col border-r border-[#F4F6FC] bg-white md:w-[380px] lg:w-[420px]">
        
        {/* Header Section */}
        <div className="px-6 pb-4 pt-10 md:pt-8">
          <div className="flex items-center justify-between">
            <h1 className="text-[26px] font-bold tracking-tight text-[#3B58F5]">
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

        {/* Scrollable Content Area */}
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
              {activeUsers.map((user) => (
                <div key={user.id} className="relative flex shrink-0 flex-col items-center">
                  <div className="relative rounded-full border-[2.5px] border-[#22C55E] p-0.5 transition-transform hover:scale-105 cursor-pointer">
                    <img 
                      src={user.avatarUrl} 
                      alt={user.name} 
                      className="h-[52px] w-[52px] rounded-full object-cover"
                    />
                  </div>
                  <span className="mt-1.5 text-[11px] font-medium text-[#8F95B2]">
                    {user.name.split(' ')[0]}
                  </span>
                </div>
              ))}
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
                  className="group relative flex w-full items-center gap-4 px-6 py-3.5 transition-colors hover:bg-[#F4F7FE]"
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
                    <h3 className="text-[15px] font-bold text-[#1D2A54]">{msg.senderName}</h3>
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

        {/* Mobile Bottom Navigation Bar (Hidden on md+) */}
        <div className="absolute bottom-0 left-0 flex w-full items-center justify-between bg-white/90 backdrop-blur-md px-6 pb-8 pt-4 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] border-t border-[#F4F6FC] md:hidden z-10">
          
          <Link href="/home" className="flex flex-col items-center gap-1">
            <div className="relative">
              <MessageSquare className="h-6 w-6 text-[#3B58F5]" strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-bold text-[#3B58F5]">Message</span>
          </Link>

          <Link href="/calls" className="flex flex-col items-center gap-1">
            <PhoneCall className="h-6 w-6 text-[#A0A6C0] transition-colors hover:text-[#3B58F5]" strokeWidth={2} />
            <span className="text-[10px] font-semibold text-[#A0A6C0]">Calls</span>
          </Link>

          <Link href="/groups" className="flex flex-col items-center gap-1">
            <Users className="h-6 w-6 text-[#A0A6C0] transition-colors hover:text-[#3B58F5]" strokeWidth={2} />
            <span className="text-[10px] font-semibold text-[#A0A6C0]">Group</span>
          </Link>

          <Link href="/contacts" className="flex flex-col items-center gap-1">
            <Contact className="h-6 w-6 text-[#A0A6C0] transition-colors hover:text-[#3B58F5]" strokeWidth={2} />
            <span className="text-[10px] font-semibold text-[#A0A6C0]">Contacts</span>
          </Link>

          <Link href="/profile" className="flex flex-col items-center gap-1">
            <UserCircle2 className="h-6 w-6 text-[#A0A6C0] transition-colors hover:text-[#3B58F5]" strokeWidth={2} />
            <span className="text-[10px] font-semibold text-[#A0A6C0]">Profile</span>
          </Link>
        </div>
      </div>

      {/* Main Chat Area (Empty State for Desktop) */}
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
