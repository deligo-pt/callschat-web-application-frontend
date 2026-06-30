"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MessageSquare, PhoneCall, Users, Contact, UserCircle2, Briefcase, LayoutDashboard, BarChart3, Inbox, Settings, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SocketProvider } from "@/components/providers/SocketProvider";
import { CallProvider } from "@/components/providers/CallProvider";
import { PresenceProvider } from "@/context/PresenceContext";
import { UserProvider, useUser } from "@/context/UserContext";
import { WorkspaceSwitcher } from "@/components/navigation/WorkspaceSwitcher";
import { PendingInvitesModal } from "@/components/business/PendingInvitesModal";

function DashboardNavContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentMode, businessProfile, workspace, isLoading } = useUser();
  const isBusiness = currentMode === "BUSINESS";
  const isOnboarding = pathname === "/business/onboarding";

  useEffect(() => {
    if (!isLoading && isBusiness && workspace === null && !isOnboarding) {
      router.replace("/business/onboarding");
    }
  }, [isLoading, isBusiness, workspace, isOnboarding, router]);

  useEffect(() => {
    const handleWorkspaceChange = (e: any) => {
      if (e?.detail?.mode === 'BUSINESS') {
        router.push('/business/dashboard');
      } else if (e?.detail?.mode === 'PERSONAL') {
        router.push('/chats');
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('workspaceModeChanged', handleWorkspaceChange);
      return () => window.removeEventListener('workspaceModeChanged', handleWorkspaceChange);
    }
  }, [router]);

  const navItems = isBusiness ? [
    { name: "Dashboard", href: "/business/dashboard", icon: LayoutDashboard },
    { name: "Inbox", href: "/business/inbox", icon: Inbox },
    { name: "Chats", href: "/chats", icon: MessageSquare },
    { name: "Teams", href: "/groups", icon: Users },
    { name: "Analytics", href: "/business/analytics", icon: BarChart3 },
    { name: "Settings", href: "/business/settings", icon: Settings },
  ] : [
    { name: "Chats", href: "/chats", icon: MessageSquare },
    { name: "Calls", href: "/calls", icon: PhoneCall },
    { name: "Groups", href: "/groups", icon: Users },
    { name: "Contacts", href: "/contacts", icon: Contact },
  ];

  if (isOnboarding) {
    return (
      <div className="flex h-screen w-full bg-[#F8FAFC] overflow-hidden">
        <main className="flex flex-1 h-full overflow-hidden relative w-full">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] overflow-hidden">
      {/* Persistent Left Sidebar - Desktop First */}
      <nav className="hidden md:flex h-full w-[88px] flex-col items-center border-r border-[#E6EAFA] bg-white py-6 shadow-sm z-20">
        <div className="mb-6">
          {/* Logo */}
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl shadow-lg transition-all duration-300 relative",
            isBusiness 
              ? "bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] shadow-purple-500/25" 
              : "bg-gradient-to-br from-[#4A72FF] to-[#1D3BB5] shadow-[#3B58F5]/20"
          )}>
            {isBusiness ? (
              <Briefcase className="h-6 w-6 text-white" strokeWidth={2.5} />
            ) : (
              <MessageSquare className="h-6 w-6 text-white" strokeWidth={2.5} />
            )}
            {isBusiness && (
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[8px] font-extrabold text-purple-600 shadow-xs">
                B
              </span>
            )}
            {isBusiness && businessProfile?.isVerified && (
              <span title="Verified Business" className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-xs">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#3B58F5] fill-[#3B58F5]" />
              </span>
            )}
          </div>
        </div>

        <div className="mb-4">
          <WorkspaceSwitcher compact={true} />
        </div>

        <div className="flex flex-1 flex-col items-center gap-2 w-full mt-2">
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
                  <div className={cn(
                    "absolute left-0 top-1/2 h-10 w-1.5 -translate-y-1/2 rounded-r-full transition-colors",
                    isBusiness ? "bg-[#8B5CF6]" : "bg-[#3B58F5]"
                  )} />
                )}
                
                <div 
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-[1.25rem] transition-all duration-300",
                    isActive 
                      ? (isBusiness ? "bg-purple-50 text-[#8B5CF6] shadow-sm" : "bg-[#EEF2FB] text-[#3B58F5] shadow-sm")
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
              "flex h-12 w-12 items-center justify-center rounded-[1.25rem] transition-all duration-300 relative",
              pathname.startsWith("/profile")
                ? (isBusiness ? "bg-purple-50 text-[#8B5CF6] shadow-sm" : "bg-[#EEF2FB] text-[#3B58F5] shadow-sm")
                : "text-[#8F95B2] hover:bg-[#F4F6FC] hover:text-[#1D2A54]"
            )}>
              <UserCircle2 className="h-[24px] w-[24px]" strokeWidth={pathname.startsWith("/profile") ? 2.5 : 2} />
              {isBusiness && (
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
              )}
            </div>
          </Link>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex flex-1 h-full overflow-hidden relative">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar (Hidden on Desktop) */}
      <nav className="absolute bottom-0 left-0 flex w-full items-center justify-between bg-white/95 backdrop-blur-md px-4 pb-8 pt-3 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] border-t border-[#F4F6FC] md:hidden z-20">
        <div className="flex flex-col items-center gap-1">
          <WorkspaceSwitcher compact={true} className="h-9 w-9" />
          <span className="text-[9px] font-bold text-[#8F95B2]">Mode</span>
        </div>
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          
          return (
            <Link key={item.name} href={item.href} className="flex flex-col items-center gap-1.5">
              <div className="relative">
                <Icon 
                  className={cn("h-6 w-6 transition-colors", isActive ? (isBusiness ? "text-[#8B5CF6]" : "text-[#3B58F5]") : "text-[#A0A6C0] hover:text-[#3B58F5]")} 
                  strokeWidth={isActive ? 2.5 : 2} 
                />
              </div>
              <span className={cn("text-[10px] font-bold", isActive ? (isBusiness ? "text-[#8B5CF6]" : "text-[#3B58F5]") : "text-[#A0A6C0]")}>
                {item.name}
              </span>
            </Link>
          );
        })}
        <Link href="/profile" className="flex flex-col items-center gap-1.5">
          <UserCircle2 
            className={cn("h-6 w-6 transition-colors", pathname.startsWith("/profile") ? (isBusiness ? "text-[#8B5CF6]" : "text-[#3B58F5]") : "text-[#A0A6C0] hover:text-[#3B58F5]")} 
            strokeWidth={pathname.startsWith("/profile") ? 2.5 : 2} 
          />
          <span className={cn("text-[10px] font-bold", pathname.startsWith("/profile") ? (isBusiness ? "text-[#8B5CF6]" : "text-[#3B58F5]") : "text-[#A0A6C0]")}>
            Profile
          </span>
        </Link>
      </nav>
      
      {isBusiness && <PendingInvitesModal />}
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <SocketProvider>
        <CallProvider>
          <PresenceProvider>
            <DashboardNavContent>
              {children}
            </DashboardNavContent>
          </PresenceProvider>
        </CallProvider>
      </SocketProvider>
    </UserProvider>
  );
}
