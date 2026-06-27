"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { 
  Search, 
  Filter, 
  ShieldAlert, 
  UserX, 
  UserCheck, 
  AlertTriangle, 
  Flag, 
  Briefcase, 
  UserCircle, 
  Globe, 
  ShieldCheck, 
  Lock
} from "lucide-react";
import { toast } from "sonner";

interface ModerationUser {
  id: string;
  username: string;
  email: string;
  phone: string;
  accountType: "PERSONAL" | "BUSINESS";
  currentMode: "PERSONAL" | "BUSINESS";
  status: "ACTIVE" | "SUSPENDED" | "BANNED";
  reportCount: number;
  riskScore: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  country: string;
  lastActive: string;
}

export default function UserModerationPage() {
  const [users, setUsers] = useState<ModerationUser[]>([
    {
      id: "USR-882190",
      username: "technova_admin",
      email: "founder@technova.io",
      phone: "+1 (555) 019-2831",
      accountType: "BUSINESS",
      currentMode: "BUSINESS",
      status: "ACTIVE",
      reportCount: 0,
      riskScore: "LOW",
      country: "United States",
      lastActive: "10 mins ago",
    },
    {
      id: "USR-441920",
      username: "crypto_king99",
      email: "spammer@airdrop.net",
      phone: "+44 7911 123456",
      accountType: "PERSONAL",
      currentMode: "PERSONAL",
      status: "ACTIVE",
      reportCount: 14,
      riskScore: "CRITICAL",
      country: "United Kingdom",
      lastActive: "Just now",
    },
    {
      id: "USR-771234",
      username: "sarah_connor",
      email: "sarah.c@gmail.com",
      phone: "+1 (555) 382-9102",
      accountType: "PERSONAL",
      currentMode: "PERSONAL",
      status: "ACTIVE",
      reportCount: 1,
      riskScore: "LOW",
      country: "Canada",
      lastActive: "2 hours ago",
    },
    {
      id: "USR-339102",
      username: "greenleaf_cafe",
      email: "hello@greenleafcafe.com",
      phone: "+1 (555) 991-0023",
      accountType: "BUSINESS",
      currentMode: "PERSONAL",
      status: "SUSPENDED",
      reportCount: 5,
      riskScore: "HIGH",
      country: "United States",
      lastActive: "3 days ago",
    },
    {
      id: "USR-102938",
      username: "alex_murphy",
      email: "amurphy@ocp.com",
      phone: "+1 (555) 441-9920",
      accountType: "PERSONAL",
      currentMode: "PERSONAL",
      status: "ACTIVE",
      reportCount: 0,
      riskScore: "LOW",
      country: "United States",
      lastActive: "5 mins ago",
    },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "PERSONAL" | "BUSINESS">("ALL");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "SUSPENDED">("ALL");

  const [confirmUser, setConfirmUser] = useState<ModerationUser | null>(null);
  const [targetAction, setTargetAction] = useState<"SUSPEND" | "ACTIVATE" | "BAN">("SUSPEND");

  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      u.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === "ALL" || u.accountType === filterType;
    const matchesStatus = filterStatus === "ALL" || u.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const triggerConfirmation = (user: ModerationUser, action: "SUSPEND" | "ACTIVATE" | "BAN") => {
    setConfirmUser(user);
    setTargetAction(action);
  };

  const executeStatusChange = () => {
    if (!confirmUser) return;
    
    const newStatus = targetAction === "ACTIVATE" ? "ACTIVE" : targetAction === "SUSPEND" ? "SUSPENDED" : "BANNED";
    
    setUsers((prev) =>
      prev.map((u) => (u.id === confirmUser.id ? { ...u, status: newStatus } : u))
    );

    if (newStatus === "ACTIVE") {
      toast.success(`Account Activated`, { description: `User ${confirmUser.username} (${confirmUser.id}) restored to full platform access.` });
    } else {
      toast.error(`Account ${newStatus === "SUSPENDED" ? "Suspended" : "Banned"}`, { description: `User ${confirmUser.username} has been restricted immediately.` });
    }

    setConfirmUser(null);
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl flex items-center gap-2.5">
            User Moderation Matrix
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Trust & Safety control center. Search users, review flags, and execute instant suspensions.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-[#111827] p-4 shadow-xl md:flex-row md:items-center md:justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by User ID, email, or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900/80 pl-10 pr-4 py-2 text-xs font-medium text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>

        {/* Filters Group */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
            <Filter className="h-3.5 w-3.5 text-indigo-400" />
            <span>Filters:</span>
          </div>

          {/* Account Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 focus:border-indigo-500 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Account Type: All</option>
            <option value="PERSONAL">Personal</option>
            <option value="BUSINESS">Business</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 focus:border-indigo-500 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Status: All</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Dense User Data Table */}
      <div className="rounded-xl border border-slate-800 bg-[#111827] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">User Profile & ID</th>
                <th className="py-3.5 px-4">Account Type & Mode</th>
                <th className="py-3.5 px-4">Flags & Risk Score</th>
                <th className="py-3.5 px-4">Report Count</th>
                <th className="py-3.5 px-4">Account Status</th>
                <th className="py-3.5 px-4 text-right">Suspension Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                    No users matching your criteria were found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-slate-800/40">
                    {/* User Profile & ID */}
                    <td className="py-3.5 px-4 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-indigo-400 font-bold text-xs border border-slate-700">
                          {u.username[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
                            @{u.username}
                            <span className="font-mono text-[11px] text-slate-400">({u.id})</span>
                          </div>
                          <div className="text-xs text-slate-400 font-medium flex items-center gap-2">
                            <span>{u.email}</span>
                            <span>·</span>
                            <span className="flex items-center gap-1 text-slate-500">
                              <Globe className="h-3 w-3" /> {u.country}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Account Type & Active Mode */}
                    <td className="py-3.5 px-4 align-middle">
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center gap-1 w-fit rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300 border border-slate-700">
                          {u.accountType === "BUSINESS" ? <Briefcase className="h-3 w-3 text-purple-400" /> : <UserCircle className="h-3 w-3 text-indigo-400" />}
                          Type: {u.accountType}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          Active Mode: <span className="font-bold text-slate-300">{u.currentMode}</span>
                        </span>
                      </div>
                    </td>

                    {/* Flags & Risk Score */}
                    <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                      {u.riskScore === "LOW" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/30">
                          Low Risk
                        </span>
                      )}
                      {u.riskScore === "MEDIUM" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-bold text-amber-400 border border-amber-500/30">
                          Medium Risk
                        </span>
                      )}
                      {(u.riskScore === "HIGH" || u.riskScore === "CRITICAL") && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2.5 py-0.5 text-xs font-bold text-rose-400 border border-rose-500/40 animate-pulse">
                          <AlertTriangle className="h-3 w-3" /> {u.riskScore} RISK
                        </span>
                      )}
                    </td>

                    {/* Report Count */}
                    <td className="py-3.5 px-4 align-middle">
                      {u.reportCount === 0 ? (
                        <span className="text-xs text-slate-500 font-medium">0 reports</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2.5 py-0.5 text-xs font-bold text-rose-400 border border-rose-500/30">
                          <Flag className="h-3 w-3 fill-rose-400/20" /> {u.reportCount} Reports
                        </span>
                      )}
                    </td>

                    {/* Account Status */}
                    <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                      {u.status === "ACTIVE" && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" /> Active
                        </span>
                      )}
                      {u.status === "SUSPENDED" && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400">
                          <span className="h-2 w-2 rounded-full bg-amber-500" /> Suspended
                        </span>
                      )}
                      {u.status === "BANNED" && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-400">
                          <span className="h-2 w-2 rounded-full bg-rose-500" /> Banned
                        </span>
                      )}
                    </td>

                    {/* Suspension Actions (Button group with confirmation triggers) */}
                    <td className="py-3.5 px-4 align-middle text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {u.status === "ACTIVE" ? (
                          <>
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => triggerConfirmation(u, "SUSPEND")}
                              className="border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300 font-bold px-2.5"
                            >
                              <Lock className="mr-1 h-3 w-3" /> Suspend
                            </Button>
                            <Button
                              size="xs"
                              variant="destructive"
                              onClick={() => triggerConfirmation(u, "BAN")}
                              className="bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30 font-bold px-2.5"
                            >
                              <UserX className="mr-1 h-3 w-3" /> Ban
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="xs"
                            onClick={() => triggerConfirmation(u, "ACTIVATE")}
                            className="bg-emerald-600 text-white hover:bg-emerald-500 font-bold px-3 shadow-xs"
                          >
                            <UserCheck className="mr-1 h-3 w-3" /> Restore Access
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Dialog to prevent accidental clicks */}
      <AlertDialog open={!!confirmUser} onOpenChange={(open) => !open && setConfirmUser(null)}>
        <AlertDialogContent className="border-slate-800 bg-[#111827] text-slate-100 p-6 shadow-2xl max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <AlertDialogTitle className="text-lg font-bold text-white">
                Confirm Enforcement Action
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-xs text-slate-400 leading-relaxed pt-2">
              Are you sure you want to execute a <span className="font-bold text-rose-400 uppercase">{targetAction}</span> command on user <span className="font-bold text-slate-200">@{confirmUser?.username}</span> ({confirmUser?.id})?
              {targetAction !== "ACTIVATE" && (
                <span className="block mt-2 font-medium text-amber-400/90">
                  This action will instantly terminate any active WebSocket connections and block login attempts.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="border-t border-slate-800 pt-4 mt-2">
            <AlertDialogCancel 
              onClick={() => setConfirmUser(null)}
              className="border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeStatusChange}
              className={
                targetAction === "ACTIVATE"
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                  : "bg-rose-600 hover:bg-rose-500 text-white font-bold"
              }
            >
              Confirm & Execute
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
