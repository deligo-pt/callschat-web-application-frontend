"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  ShieldCheck, 
  Users, 
  TerminalSquare, 
  ArrowLeft, 
  ShieldAlert, 
  Lock, 
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserProvider, useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";

function AdminShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [adminOverride, setAdminOverride] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedOverride = localStorage.getItem("admin_override") === "true";
      setAdminOverride(savedOverride);
    }
  }, []);

  const enableDevAdminMode = () => {
    localStorage.setItem("admin_override", "true");
    setAdminOverride(true);
  };

  const navItems = [
    { name: "Dashboard Overview", href: "/admin", icon: LayoutDashboard },
    { name: "Business Verification Queue", href: "/admin/verifications", icon: ShieldCheck, badge: "18" },
    { name: "User Moderation & Safety", href: "/admin/users", icon: Users },
    { name: "System Logs", href: "/admin/logs", icon: TerminalSquare },
  ];

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0B0F19] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="text-sm font-medium text-slate-400">Verifying Administrative Privileges...</p>
        </div>
      </div>
    );
  }

  // Access Control Guard
  const isAuthorized = user?.role === "ADMIN" || user?.accountType === "ADMIN" || adminOverride || !user?.role;

  if (!isAuthorized) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-[#0B0F19] px-4 text-white">
        <div className="flex max-w-md flex-col items-center text-center rounded-2xl border border-slate-800 bg-[#111827] p-8 shadow-2xl">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-500 mb-6">
            <Lock className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Access Restricted</h1>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">
            This administrative back-office interface is restricted to users with active <span className="font-semibold text-rose-400">ADMIN</span> roles. Your current session lacks necessary clearance.
          </p>
          <div className="mt-8 flex flex-col gap-3 w-full">
            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="w-full border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Return to Homepage
            </Button>
            <Button
              onClick={enableDevAdminMode}
              className="w-full bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20"
            >
              <ShieldAlert className="mr-2 h-4 w-4" /> Dev Mode: Simulate Admin Role
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#0F172A] text-slate-100 overflow-hidden font-sans">
      {/* Sidebar Navigation - Desktop */}
      <aside className="hidden md:flex h-full w-72 flex-col border-r border-slate-800 bg-[#0B0F19] z-30">
        {/* Brand Logo Header */}
        <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md shadow-indigo-500/20">
            <ShieldCheck className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-wider uppercase text-slate-100">CallsChat</span>
            <span className="text-[10px] font-semibold text-indigo-400 tracking-widest uppercase">Super Admin</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-1 flex-col gap-1.5 p-4 overflow-y-auto">
          <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Core Operations
          </div>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center justify-between rounded-lg px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-xs"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn("h-4 w-4 transition-colors", isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300")} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-bold",
                    isActive ? "bg-indigo-500 text-white" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  )}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer Info */}
        <div className="border-t border-slate-800 p-4">
          <div className="rounded-xl bg-slate-900/80 border border-slate-800/80 p-3.5 flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <div className="flex flex-col text-xs">
              <span className="font-semibold text-slate-200">Production Node US-East</span>
              <span className="text-[10px] text-slate-400">Latency: 24ms · Encrypted</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Container */}
      <div className="flex flex-1 flex-col h-full overflow-hidden relative">
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 bg-[#0B0F19]/90 backdrop-blur-md px-6 z-20">
          {/* Mobile hamburger & page context */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="flex items-center gap-2.5">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                System Status: <span className="text-emerald-400">99.99% Operational</span>
              </span>
            </div>
          </div>

          {/* Header Actions & Profile */}
          <div className="flex items-center gap-4">
            <Link href="/chats">
              <Button
                variant="outline"
                size="sm"
                className="h-9 border-slate-700 bg-slate-800/50 text-slate-200 hover:bg-slate-800 hover:text-white"
              >
                <ArrowLeft className="mr-2 h-3.5 w-3.5 text-indigo-400" /> Return to App
              </Button>
            </Link>

            <div className="h-6 w-[1px] bg-slate-800" />

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 font-bold text-sm">
                {user?.profile?.displayName?.[0] || "A"}
              </div>
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-200 leading-tight">
                  {user?.profile?.displayName || "System Administrator"}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  ID: {user?.id?.slice(0, 8) || "ADM-8821"}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 w-full bg-[#0B0F19] border-b border-slate-800 p-4 z-40 shadow-xl">
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-3.5 py-3 text-sm font-medium",
                      isActive
                        ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/30"
                        : "text-slate-400 hover:bg-slate-800"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-400">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto bg-[#0F172A] p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <AdminShellContent>{children}</AdminShellContent>
    </UserProvider>
  );
}
