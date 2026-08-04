"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Filter,
  ShieldAlert,
  UserCheck,
  UserX,
  Loader2,
  Phone,
  Briefcase,
  UserCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import adminService, { ManagedUser, GetUsersParams } from "@/services/admin.service";

export default function UserModerationPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [totalUsers, setTotalUsers] = useState<number>(0);

  // Filter States
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [filterType, setFilterType] = useState<"ALL" | "PERSONAL" | "BUSINESS">("ALL");
  const [filterActive, setFilterActive] = useState<"ALL" | "true" | "false">("ALL");

  // Action & Modal States
  const [processingIds, setProcessingIds] = useState<Record<string, boolean>>({});
  const [suspendModalUser, setSuspendModalUser] = useState<ManagedUser | null>(null);
  const [suspensionReason, setSuspensionReason] = useState<string>("POLICY_VIOLATION");
  const [suspensionDescription, setSuspensionDescription] = useState<string>("");
  const [isSubmittingSuspension, setIsSubmittingSuspension] = useState<boolean>(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch Users
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: GetUsersParams = {
        page: 1,
        limit: 50,
      };

      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }
      if (filterType !== "ALL") {
        params.accountType = filterType;
      }
      if (filterActive !== "ALL") {
        params.isActive = filterActive === "true";
      }

      const response = await adminService.getUsers(params);
      if (response && response.success) {
        setUsers(response.data || []);
        setTotalUsers(response.pagination?.total || (response.data || []).length);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to load user directory.");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, filterType, filterActive]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Activate Flow
  const handleActivate = async (user: ManagedUser) => {
    setProcessingIds((prev) => ({ ...prev, [user.id]: true }));
    try {
      await adminService.updateUserState(user.id, true);

      // Optimistically update local state
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: true } : u))
      );

      toast.success("User account activated successfully!", {
        description: `Full platform access restored for ${user.phoneNumber}.`,
      });
    } catch (error) {
      console.error("Failed to activate user:", error);
      toast.error("Failed to activate user account.");
    } finally {
      setProcessingIds((prev) => ({ ...prev, [user.id]: false }));
    }
  };

  // Suspend Flow Submit
  const handleSuspendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspendModalUser) return;

    if (!suspensionDescription.trim()) {
      toast.error("Please provide a brief description explaining the suspension.");
      return;
    }

    setIsSubmittingSuspension(true);
    const userId = suspendModalUser.id;
    const phone = suspendModalUser.phoneNumber;

    try {
      await adminService.suspendUser(userId, suspensionReason, suspensionDescription);

      // Optimistically update local state
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isActive: false } : u))
      );

      toast.success("User suspended immediately.", {
        description: `All active sessions and socket connections dropped for ${phone}.`,
      });

      // Close modal and reset
      setSuspendModalUser(null);
      setSuspensionDescription("");
      setSuspensionReason("POLICY_VIOLATION");
    } catch (error) {
      console.error("Failed to suspend user:", error);
      toast.error("Failed to execute suspension command.");
    } finally {
      setIsSubmittingSuspension(false);
    }
  };

  const formatDate = (dateStr: string | Date) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return String(dateStr);
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              User Management Matrix
            </h1>
            {!isLoading && (
              <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-xs font-bold text-indigo-400 border border-indigo-500/30">
                {totalUsers} Total
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Trust & Safety command center. Filter directory, monitor status, and enforce instantaneous suspensions.
          </p>
        </div>
      </div>

      {/* PHASE 1: Search & Filter Control Bar */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-[#111827] p-4 shadow-xl md:flex-row md:items-center md:justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by phone number..."
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

          {/* Active Status Filter */}
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value as any)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 focus:border-indigo-500 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Status: All</option>
            <option value="true">Active Only</option>
            <option value="false">Suspended Only</option>
          </select>
        </div>
      </div>

      {/* PHASE 2: The Data Table */}
      <div className="rounded-xl border border-slate-800 bg-[#111827] shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-3" />
            <p className="text-sm font-medium">Loading user matrix...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800/80 mb-3 border border-slate-700">
              <Phone className="h-6 w-6 text-slate-500" />
            </div>
            <h3 className="text-base font-bold text-slate-200">No Users Found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your search query or filter parameters.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-900/60 border-b border-slate-800">
              <TableRow className="hover:bg-transparent border-slate-800">
                <TableHead className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Phone Number
                </TableHead>
                <TableHead className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Account Type
                </TableHead>
                <TableHead className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Active Status
                </TableHead>
                <TableHead className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Join Date
                </TableHead>
                <TableHead className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-800/80">
              {users.map((user) => {
                const isProcessing = processingIds[user.id] || false;
                return (
                  <TableRow
                    key={user.id}
                    className="transition-colors hover:bg-slate-800/40 border-slate-800/80"
                  >
                    {/* Phone Number & ID */}
                    <TableCell className="py-4 px-4 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-indigo-400 border border-slate-700 font-mono text-xs font-bold shadow-inner">
                          <Phone className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-100 text-sm font-mono flex items-center gap-1.5">
                            {user.phoneNumber}
                          </div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">
                            ID: {user.id}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Account Type */}
                    <TableCell className="py-4 px-4 align-middle">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300 border border-slate-700/60 uppercase">
                        {user.accountType === "BUSINESS" ? (
                          <Briefcase className="h-3.5 w-3.5 text-purple-400" />
                        ) : (
                          <UserCircle className="h-3.5 w-3.5 text-indigo-400" />
                        )}
                        {user.accountType}
                      </span>
                    </TableCell>

                    {/* Active Status (Green / Red Badge) */}
                    <TableCell className="py-4 px-4 align-middle whitespace-nowrap">
                      {user.isActive ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 px-3 py-1 text-xs font-bold text-rose-400 border border-rose-500/30 animate-pulse">
                          <AlertTriangle className="h-3.5 w-3.5" /> Suspended
                        </span>
                      )}
                    </TableCell>

                    {/* Join Date */}
                    <TableCell className="py-4 px-4 align-middle whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs text-slate-300">
                        <Clock className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        <span>{formatDate(user.createdAt)}</span>
                      </div>
                    </TableCell>

                    {/* PHASE 3: Suspension / Activation Actions */}
                    <TableCell className="py-4 px-4 align-middle text-right whitespace-nowrap">
                      {user.isActive ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={isProcessing}
                          onClick={() => {
                            setSuspendModalUser(user);
                            setSuspensionReason("POLICY_VIOLATION");
                            setSuspensionDescription("");
                          }}
                          className="font-bold px-3.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30 transition-all shadow-sm"
                        >
                          {isProcessing ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                          ) : (
                            <UserX className="mr-1.5 h-3.5 w-3.5" />
                          )}
                          Suspend
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          disabled={isProcessing}
                          onClick={() => handleActivate(user)}
                          className="bg-emerald-600 text-white hover:bg-emerald-500 font-bold px-3.5 shadow-sm transition-all"
                        >
                          {isProcessing ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                          ) : (
                            <UserCheck className="mr-1.5 h-3.5 w-3.5" />
                          )}
                          Activate
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* PHASE 3: Suspension Modal Dialog */}
      <Dialog
        open={!!suspendModalUser}
        onOpenChange={(open) => {
          if (!open && !isSubmittingSuspension) {
            setSuspendModalUser(null);
          }
        }}
      >
        <DialogContent className="max-w-md border-slate-800 bg-[#111827] text-slate-100 p-6 shadow-2xl">
          <form onSubmit={handleSuspendSubmit}>
            <DialogHeader>
              <div className="flex items-center gap-2.5 text-rose-500 mb-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/10 border border-rose-500/20">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <DialogTitle className="text-lg font-bold text-white">
                  Suspend User Account
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-slate-400 leading-relaxed pt-1">
                Enforcing immediate suspension on <span className="font-mono font-bold text-slate-200">{suspendModalUser?.phoneNumber}</span> ({suspendModalUser?.id}). All active sockets will be disconnected instantly.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-4">
              {/* Reason Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Violation Category
                </label>
                <select
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="POLICY_VIOLATION">Terms & Policy Violation</option>
                  <option value="SPAM">Spam / Automated Messaging</option>
                  <option value="HARASSMENT">Harassment or Abuse</option>
                  <option value="FAKE_ACCOUNT">Impersonation / Fake Identity</option>
                  <option value="OTHER">Other Compliance Risk</option>
                </select>
              </div>

              {/* Description Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Incident Description
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Provide specific details regarding this enforcement action..."
                  value={suspensionDescription}
                  onChange={(e) => setSuspensionDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none resize-none"
                />
              </div>
            </div>

            <DialogFooter className="flex items-center justify-between sm:justify-end gap-2 border-t border-slate-800 pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSubmittingSuspension}
                onClick={() => setSuspendModalUser(null)}
                className="border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                size="sm"
                disabled={isSubmittingSuspension}
                className="bg-rose-600 text-white hover:bg-rose-500 font-bold px-4"
              >
                {isSubmittingSuspension ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                ) : (
                  <ShieldAlert className="mr-1.5 h-3.5 w-3.5" />
                )}
                Confirm Suspension
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
