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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Building2,
  CheckCircle2,
  Clock,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import adminService, { PendingBusinessVerification } from "@/services/admin.service";

export default function VerificationsQueuePage() {
  const [verifications, setVerifications] = useState<PendingBusinessVerification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [processingIds, setProcessingIds] = useState<Record<string, boolean>>({});
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [openPopoverIds, setOpenPopoverIds] = useState<Record<string, boolean>>({});

  const predefinedReasons = [
    "Invalid or incomplete documentation",
    "Mismatched company tax details",
    "Unverified business website or contact info",
    "High risk or restricted business category",
  ];

  const fetchVerifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await adminService.getPendingVerifications(1, 50);
      if (response && response.success) {
        setVerifications(response.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch pending verifications:", error);
      toast.error("Failed to load verification queue.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVerifications();
  }, [fetchVerifications]);

  const handleVerification = async (
    businessId: string,
    action: "APPROVE" | "REJECT",
    reason?: string
  ) => {
    if (action === "REJECT" && (!reason || !reason.trim())) {
      toast.error("Please provide a rejection reason.");
      return;
    }

    setProcessingIds((prev) => ({ ...prev, [businessId]: true }));

    try {
      await adminService.updateVerification(businessId, action, reason);

      // Optimistic UI update: remove row immediately
      setVerifications((prev) => prev.filter((item) => item.id !== businessId));

      if (action === "APPROVE") {
        toast.success("Business account approved and verified successfully!");
      } else {
        toast.success("Business verification request rejected.");
      }

      // Close popover if open
      setOpenPopoverIds((prev) => ({ ...prev, [businessId]: false }));
    } catch (error) {
      console.error(`Failed to ${action.toLowerCase()} business:`, error);
      toast.error(`Failed to ${action.toLowerCase()} verification request. Please try again.`);
    } finally {
      setProcessingIds((prev) => ({ ...prev, [businessId]: false }));
    }
  };

  const formatDate = (dateStr: string | Date) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
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
              Business Verification Queue
            </h1>
            {!isLoading && (
              <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-400 border border-amber-500/30">
                {verifications.length} Pending
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Review compliance details and approve or reject pending business accounts.
          </p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-xl border border-slate-800 bg-[#111827] shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-3" />
            <p className="text-sm font-medium">Loading verification queue...</p>
          </div>
        ) : verifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800/80 mb-3 border border-slate-700">
              <ShieldCheck className="h-6 w-6 text-emerald-400" />
            </div>
            <h3 className="text-base font-bold text-slate-200">Queue is Empty</h3>
            <p className="text-xs text-slate-500 mt-1">All pending business verification requests have been processed.</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-900/60 border-b border-slate-800">
              <TableRow className="hover:bg-transparent border-slate-800">
                <TableHead className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Company Name
                </TableHead>
                <TableHead className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Business Category
                </TableHead>
                <TableHead className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Submission Date
                </TableHead>
                <TableHead className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-800/80">
              {verifications.map((item) => {
                const isProcessing = processingIds[item.id] || false;
                return (
                  <TableRow
                    key={item.id}
                    className="transition-colors hover:bg-slate-800/40 border-slate-800/80"
                  >
                    {/* Company Name */}
                    <TableCell className="py-4 px-4 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
                            {item.companyName}
                          </div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5">
                            ID: {item.userId}
                            {item.taxId && <span className="ml-2 text-slate-500">· EIN: {item.taxId}</span>}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Business Category */}
                    <TableCell className="py-4 px-4 align-middle">
                      <span className="inline-flex items-center rounded-md bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300 border border-slate-700/60">
                        {item.industry || "General Enterprise"}
                      </span>
                      {item.businessEmail && (
                        <div className="text-[11px] text-slate-400 mt-1 truncate max-w-[180px]">
                          {item.businessEmail}
                        </div>
                      )}
                    </TableCell>

                    {/* Submission Date */}
                    <TableCell className="py-4 px-4 align-middle whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs text-slate-300">
                        <Clock className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        <span>{formatDate(item.createdAt)}</span>
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="py-4 px-4 align-middle text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2.5">
                        {/* Approve Button */}
                        <Button
                          size="sm"
                          disabled={isProcessing}
                          onClick={() => handleVerification(item.id, "APPROVE")}
                          className="bg-indigo-600 text-white hover:bg-indigo-500 font-bold px-3.5 shadow-sm transition-all"
                        >
                          {isProcessing ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                          ) : (
                            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                          )}
                          Approve
                        </Button>

                        {/* Reject Popover */}
                        <Popover
                          open={openPopoverIds[item.id] || false}
                          onOpenChange={(open) =>
                            setOpenPopoverIds((prev) => ({ ...prev, [item.id]: open }))
                          }
                        >
                          <PopoverTrigger asChild>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={isProcessing}
                              className="font-bold px-3.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30 transition-all"
                            >
                              <XCircle className="mr-1.5 h-3.5 w-3.5" /> Reject
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-80 border-slate-700 bg-[#111827] text-slate-100 p-4 shadow-2xl z-50"
                            align="end"
                          >
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                                <ShieldAlert className="h-4 w-4" />
                                <span>Rejection Reason</span>
                              </div>
                              <p className="text-xs text-slate-400">
                                Provide a reason for rejecting <span className="font-semibold text-slate-200">{item.companyName}</span>.
                              </p>
                              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                                {predefinedReasons.map((reason) => (
                                  <button
                                    key={reason}
                                    type="button"
                                    onClick={() =>
                                      setRejectionReasons((prev) => ({ ...prev, [item.id]: reason }))
                                    }
                                    className="w-full rounded-md px-2.5 py-1.5 text-left text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors border border-transparent hover:border-slate-700"
                                  >
                                    • {reason}
                                  </button>
                                ))}
                              </div>
                              <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
                                <input
                                  type="text"
                                  placeholder="Or type custom reason..."
                                  value={rejectionReasons[item.id] || ""}
                                  onChange={(e) =>
                                    setRejectionReasons((prev) => ({ ...prev, [item.id]: e.target.value }))
                                  }
                                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
                                />
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  disabled={isProcessing}
                                  onClick={() =>
                                    handleVerification(
                                      item.id,
                                      "REJECT",
                                      rejectionReasons[item.id] || "Application did not meet compliance verification criteria."
                                    )
                                  }
                                  className="w-full bg-rose-600 text-white hover:bg-rose-500 font-bold mt-1"
                                >
                                  {isProcessing ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                  ) : null}
                                  Confirm Rejection
                                </Button>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
