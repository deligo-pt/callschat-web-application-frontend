"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, PhoneCall, Users, Contact, UserCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SocketProvider } from "@/components/providers/SocketProvider";
import { CallProvider } from "@/components/providers/CallProvider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { name: "Chats", href: "/chats", icon: MessageSquare },
    { name: "Calls", href: "/calls", icon: PhoneCall },
    { name: "Groups", href: "/groups", icon: Users },
    { name: "Contacts", href: "/contacts", icon: Contact },
  ];

  return (
    <SocketProvider>
      <CallProvider>
      <div className="flex h-screen w-full bg-[#F8FAFC] overflow-hidden">
      {/* Persistent Left Sidebar - Desktop First */}
      <nav className="hidden md:flex h-full w-[88px] flex-col items-center border-r border-[#E6EAFA] bg-white py-6 shadow-sm z-20">
        <div className="mb-8">
          {/* Logo */}
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#4A72FF] to-[#1D3BB5] shadow-lg shadow-[#3B58F5]/20">
            <MessageSquare className="h-6 w-6 text-white" strokeWidth={2.5} />
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center gap-2 w-full mt-4">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className="group relative flex w-full flex-col items-center justify-center py-3"
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 h-10 w-1.5 -translate-y-1/2 rounded-r-full bg-[#3B58F5]" />
                )}
                
                <div 
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-[1.25rem] transition-all duration-300",
                    isActive 
                      ? "bg-[#EEF2FB] text-[#3B58F5] shadow-sm" 
                      : "text-[#8F95B2] hover:bg-[#F4F6FC] hover:text-[#1D2A54]"
                  )}
                >
                  <Icon className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.5 : 2} />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Profile Button at bottom */}
        <div className="mt-auto w-full mb-4">
          <Link href="/profile" className="flex w-full items-center justify-center py-3">
            <div className={cn(
              "flex h-12 w-12 items-center justify-center rounded-[1.25rem] transition-all duration-300",
              pathname.startsWith("/profile")
                ? "bg-[#EEF2FB] text-[#3B58F5] shadow-sm" 
                : "text-[#8F95B2] hover:bg-[#F4F6FC] hover:text-[#1D2A54]"
            )}>
              <UserCircle2 className="h-[24px] w-[24px]" strokeWidth={pathname.startsWith("/profile") ? 2.5 : 2} />
            </div>
          </Link>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex flex-1 h-full overflow-hidden relative">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar (Hidden on Desktop) */}
      <nav className="absolute bottom-0 left-0 flex w-full items-center justify-between bg-white/90 backdrop-blur-md px-6 pb-8 pt-4 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] border-t border-[#F4F6FC] md:hidden z-20">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          
          return (
            <Link key={item.name} href={item.href} className="flex flex-col items-center gap-1.5">
              <div className="relative">
                <Icon 
                  className={cn("h-6 w-6 transition-colors", isActive ? "text-[#3B58F5]" : "text-[#A0A6C0] hover:text-[#3B58F5]")} 
                  strokeWidth={isActive ? 2.5 : 2} 
                />
              </div>
              <span className={cn("text-[10px] font-bold", isActive ? "text-[#3B58F5]" : "text-[#A0A6C0]")}>
                {item.name}
              </span>
            </Link>
          );
        })}
        <Link href="/profile" className="flex flex-col items-center gap-1.5">
          <UserCircle2 
            className={cn("h-6 w-6 transition-colors", pathname.startsWith("/profile") ? "text-[#3B58F5]" : "text-[#A0A6C0] hover:text-[#3B58F5]")} 
            strokeWidth={pathname.startsWith("/profile") ? 2.5 : 2} 
          />
          <span className={cn("text-[10px] font-bold", pathname.startsWith("/profile") ? "text-[#3B58F5]" : "text-[#A0A6C0]")}>
            Profile
          </span>
        </Link>
      </nav>
    </div>
      </CallProvider>
    </SocketProvider>
  );
}
