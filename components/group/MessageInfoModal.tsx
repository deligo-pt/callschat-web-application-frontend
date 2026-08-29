"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, CheckCheck, Loader2, Clock, User as UserIcon } from "lucide-react";
import { groupService } from "@/services/group.service";
import { getOptimizedImageUrl } from "@/utils/image";
import { format } from "date-fns";

interface MessageInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  messageId: string;
  messageText?: string;
  messageCreatedAt?: string;
}

export function MessageInfoModal({
  isOpen,
  onClose,
  groupId,
  messageId,
  messageText,
  messageCreatedAt,
}: MessageInfoModalProps) {
  const [loading, setLoading] = useState(false);
  const [receipts, setReceipts] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && groupId && messageId) {
      setLoading(true);
      groupService
        .fetchMessageInfo(groupId, messageId)
        .then((res) => {
          if (res.success && res.data) {
            setReceipts(res.data);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, groupId, messageId]);

  const readReceipts = receipts.filter((r) => r.status === "SEEN");
  const deliveredReceipts = receipts.filter((r) => r.status === "DELIVERED");
  const pendingReceipts = receipts.filter((r) => r.status === "PENDING");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] max-h-[85vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-[#111b21] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100">
        <DialogHeader className="p-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <span>Message info</span>
          </DialogTitle>
          {messageText && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
              &quot;{messageText}&quot;
            </p>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
              <span className="text-sm">Loading receipt details...</span>
            </div>
          ) : (
            <>
              {/* Read By Section */}
              <div>
                <div className="flex items-center gap-2 text-emerald-500 text-xs font-semibold uppercase tracking-wider mb-2">
                  <CheckCheck className="w-4 h-4" />
                  <span>Read by ({readReceipts.length})</span>
                </div>
                {readReceipts.length === 0 ? (
                  <p className="text-xs text-gray-400 dark:text-gray-500 py-1 pl-6">No one has read yet</p>
                ) : (
                  <div className="space-y-2">
                    {readReceipts.map((r) => (
                      <div
                        key={r.userId}
                        className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800/40 hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-semibold text-sm overflow-hidden flex-shrink-0">
                            {r.user?.avatarUrl ? (
                              <img
                                src={getOptimizedImageUrl(r.user.avatarUrl)}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              (r.user?.displayName || "U")[0].toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {r.user?.displayName || "Member"}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {r.user?.username ? `@${r.user.username}` : r.role}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 block">
                            {r.seenAt ? format(new Date(r.seenAt), "p") : "Read"}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {r.seenAt ? format(new Date(r.seenAt), "MMM d") : ""}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Delivered To Section */}
              <div>
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  <CheckCheck className="w-4 h-4" />
                  <span>Delivered to ({deliveredReceipts.length})</span>
                </div>
                {deliveredReceipts.length === 0 ? (
                  <p className="text-xs text-gray-400 dark:text-gray-500 py-1 pl-6">No pending deliveries</p>
                ) : (
                  <div className="space-y-2">
                    {deliveredReceipts.map((r) => (
                      <div
                        key={r.userId}
                        className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800/40 hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center font-semibold text-sm overflow-hidden flex-shrink-0">
                            {r.user?.avatarUrl ? (
                              <img
                                src={getOptimizedImageUrl(r.user.avatarUrl)}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              (r.user?.displayName || "U")[0].toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {r.user?.displayName || "Member"}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {r.user?.username ? `@${r.user.username}` : r.role}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 block">
                            {r.deliveredAt ? format(new Date(r.deliveredAt), "p") : "Delivered"}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {r.deliveredAt ? format(new Date(r.deliveredAt), "MMM d") : ""}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pending / Sent Section */}
              {pendingReceipts.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-amber-500 text-xs font-semibold uppercase tracking-wider mb-2">
                    <Clock className="w-4 h-4" />
                    <span>Sent / Awaiting Delivery ({pendingReceipts.length})</span>
                  </div>
                  <div className="space-y-2">
                    {pendingReceipts.map((r) => (
                      <div
                        key={r.userId}
                        className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800/40 opacity-70"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 flex items-center justify-center font-semibold text-sm overflow-hidden flex-shrink-0">
                            {r.user?.avatarUrl ? (
                              <img
                                src={getOptimizedImageUrl(r.user.avatarUrl)}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              (r.user?.displayName || "U")[0].toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {r.user?.displayName || "Member"}
                            </p>
                            <p className="text-xs text-gray-400">Offline / Not received</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
