"use client";

import { PendingInvitesModal } from "@/components/business/PendingInvitesModal";
import { WorkspaceSwitcher } from "@/components/navigation/WorkspaceSwitcher";
import { CallProvider } from "@/components/providers/CallProvider";
import { SocketProvider } from "@/components/providers/SocketProvider";
import { PresenceProvider } from "@/context/PresenceContext";
import { UserProvider, useUser } from "@/context/UserContext";
import { cn } from "@/lib/utils";
import { Briefcase, CheckCircle2, Contact, Folder, MessageSquare, PhoneCall, Share2, UserCircle2, Users, UsersRound } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect } from "react";

function DashboardNavContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, currentMode, businessProfile, workspace, isLoading } = useUser();
  const isBusiness = currentMode === "BUSINESS";
  const isOnboarding = pathname === "/business/onboarding";
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");

  useEffect(() => {
    if (!isLoading && isBusiness && workspace === null && !isOnboarding) {
      router.replace("/business/onboarding");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isBusiness, workspace, isOnboarding]);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navItems = [
    { name: tNav("message"), href: isBusiness ? "/business/chats" : "/chats", icon: MessageSquare },
    { name: tNav("calls"), href: isBusiness ? "/business/calls" : "/calls", icon: PhoneCall },
    { name: tNav("group"), href: "/groups", icon: Users },
    { name: tNav("contacts"), href: "/contacts", icon: Contact },
    { name: tNav("media"), href: "/media", icon: Folder },
    { name: tNav("channel"), href: "/channels", icon: Share2 },
    { name: tNav("communities"), href: "/communities", icon: UsersRound },
  ].filter(item => {
    if (!isBusiness && (item.href === "/channels" || item.href === "/communities")) {
      return false;
    }
    return true;
  });

  if (isOnboarding) {
    return (
      <div className="flex h-screen w-full bg-[#F8FAFC] overflow-hidden">
        <main className="flex flex-1 h-full overflow-hidden relative w-full">
          {children}
        </main>
        {user && <PendingInvitesModal />}
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] overflow-hidden">
      {/* Persistent Left Sidebar - Desktop First */}
      <nav className="hidden md:flex h-full w-[88px] flex-col items-center border-r border-[#E6EAFA] bg-white py-6 shadow-sm z-20">
        {isBusiness && (
          <div className="mb-6">
            {/* Logo */}
            <div className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl shadow-lg transition-all duration-300 relative",
              "bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] shadow-purple-500/25" 
            )}>
              <Briefcase className="h-6 w-6 text-white" strokeWidth={2.5} />
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[8px] font-extrabold text-purple-600 shadow-xs">
                B
              </span>
              {businessProfile?.isVerified && (
                <span title="Verified Business" className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-xs">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#3B58F5] fill-[#3B58F5]" />
                </span>
              )}
            </div>
          </div>
        )}

        {!isBusiness && (
          <div className="mb-4">
            <WorkspaceSwitcher compact={true} />
          </div>
        )}

        <div className="flex flex-1 flex-col items-center gap-2.5 w-full mt-2 overflow-y-auto scrollbar-hide px-2">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            
            return (
                <Link 
                  key={item.name} 
                  href={item.href}
                  className="group relative flex w-full flex-col items-center justify-center py-1.5 transition-all"
                >
                  <div 
                    className={cn(
                      "flex h-[46px] w-[46px] items-center justify-center rounded-[18px] transition-all duration-300 shadow-xs",
                      isActive 
                        ? "bg-[#EEF2FF] text-[#2563EB] border border-[#E0E7FF] shadow-blue-500/10"
                        : "bg-[#F8FAFC] border border-transparent text-[#64748B] hover:bg-[#EEF2FF]/60 hover:text-[#2563EB]"
                    )}
                  >
                    <Icon className="h-5 w-5" strokeWidth={isActive ? 2.3 : 1.8} />
                  </div>
                  <span className={cn(
                    "text-[11px] font-semibold mt-1.5 transition-colors",
                    isActive ? "text-[#2563EB] font-bold" : "text-[#64748B] group-hover:text-[#2563EB]"
                  )}>
                    {item.name}
                  </span>
                </Link>
            );
          })}
        </div>

        {/* Profile Button at bottom */}
        <div className="mt-auto w-full mb-2 px-2 pt-2">
          <Link href="/profile" className="flex flex-col w-full items-center justify-center py-1.5 group">
            <div className={cn(
              "flex h-[46px] w-[46px] items-center justify-center rounded-[18px] transition-all duration-300 relative shadow-xs",
              pathname.startsWith("/profile")
                ? "bg-[#EEF2FF] text-[#2563EB] border border-[#E0E7FF] shadow-blue-500/10"
                : "bg-[#F8FAFC] border border-transparent text-[#64748B] hover:bg-[#EEF2FF]/60 hover:text-[#2563EB]"
            )}>
              <UserCircle2 className="h-5 w-5" strokeWidth={pathname.startsWith("/profile") ? 2.3 : 1.8} />
              {isBusiness && (
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#2563EB] ring-2 ring-white" />
              )}
            </div>
            <span className={cn(
              "text-[11px] font-semibold mt-1.5 transition-colors",
              pathname.startsWith("/profile") ? "text-[#2563EB] font-bold" : "text-[#64748B] group-hover:text-[#2563EB]"
            )}>
              {tNav("profile")}
            </span>
          </Link>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex flex-1 h-full overflow-hidden relative">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar (Hidden on Desktop) */}
      <nav className="absolute bottom-0 left-0 flex w-full items-center justify-between overflow-x-auto scrollbar-hide bg-white/95 backdrop-blur-md px-4 pb-6 pt-3 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] border-t border-[#F4F6FC] md:hidden z-20 gap-4">
        {!isBusiness && (
          <div className="flex flex-col items-center gap-1 shrink-0">
            <WorkspaceSwitcher compact={true} className="h-9 w-9" />
            <span className="text-[9px] font-bold text-[#8F95B2]">Mode</span>
          </div>
        )}
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          
          return (
            <Link key={item.name} href={item.href} className="flex flex-col items-center gap-1.5 shrink-0 min-w-[50px]">
              <div className={cn(
                "flex h-9 w-9 items-center justify-center rounded-[12px] transition-colors",
                isActive ? "bg-[#EEF2FF] text-[#2563EB]" : "text-[#64748B]"
              )}>
                <Icon 
                  className="h-5 w-5" 
                  strokeWidth={isActive ? 2.3 : 1.8} 
                />
              </div>
              <span className={cn("text-[10px] font-semibold", isActive ? "text-[#2563EB] font-bold" : "text-[#64748B]")}>
                {item.name}
              </span>
            </Link>
          );
        })}
        <Link href="/profile" className="flex flex-col items-center gap-1.5 shrink-0 min-w-[50px]">
          <div className={cn(
            "flex h-9 w-9 items-center justify-center rounded-[12px] transition-colors",
            pathname.startsWith("/profile") ? "bg-[#EEF2FF] text-[#2563EB]" : "text-[#64748B]"
          )}>
            <UserCircle2 
              className="h-5 w-5" 
              strokeWidth={pathname.startsWith("/profile") ? 2.3 : 1.8} 
            />
          </div>
          <span className={cn("text-[10px] font-semibold", pathname.startsWith("/profile") ? "text-[#2563EB] font-bold" : "text-[#64748B]")}>
            {tNav("profile")}
          </span>
        </Link>
      </nav>
      
      {user && <PendingInvitesModal />}
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
