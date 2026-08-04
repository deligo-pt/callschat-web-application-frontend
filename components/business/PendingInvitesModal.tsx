"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Building2, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { WorkspaceService } from "@/services/workspace.service";
import { useUser } from "@/context/UserContext";
import { useSocket } from "@/components/providers/SocketProvider";
import { toast } from "sonner";

interface InviteItem {
  id: string;
  workspaceId: string;
  inviterId: string;
  inviteeId: string;
  status: string;
  createdAt: string;
  workspace?: {
    name: string;
    businessId: string;
  };
}

export function PendingInvitesModal() {
  const { user, refetchWorkspace, currentMode } = useUser();
  const [invites, setInvites] = useState<InviteItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const { socket } = useSocket();

  useEffect(() => {
    if (user) {
      fetchInvites();
    } else {
      setIsOpen(false);
    }
  }, [user]);

  useEffect(() => {
    if (!socket) return;
    const handleNewInvite = () => {
      fetchInvites();
      toast("You received a new workspace invitation!", { icon: "🏢" });
    };
    socket.on("workspace:invite_received", handleNewInvite);
    return () => {
      socket.off("workspace:invite_received", handleNewInvite);
    };
  }, [socket]);

  const fetchInvites = async () => {
    setIsLoading(true);
    try {
      const res = await WorkspaceService.getMyInvites();
      if (res.success && res.data && res.data.length > 0) {
        setInvites(res.data);
        setIsOpen(true);
      }
    } catch (error) {
      console.error("Failed to load invites:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (inviteId: string) => {
    setActionId(inviteId);
    try {
      const res = await WorkspaceService.acceptInvite(inviteId);
      if (res.success) {
        toast.success("Workspace invitation accepted!");
        setInvites(prev => prev.filter(i => i.id !== inviteId));
        if (invites.length <= 1) {
          setIsOpen(false);
        }
        refetchWorkspace();
      } else {
        toast.error("Failed to accept invitation");
      }
    } catch (error) {
      console.error("Failed to accept invite:", error);
      toast.error("Failed to accept invitation");
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (inviteId: string) => {
    setActionId(inviteId);
    try {
      const res = await WorkspaceService.rejectInvite(inviteId);
      if (res.success) {
        toast.success("Workspace invitation declined.");
        setInvites(prev => prev.filter(i => i.id !== inviteId));
        if (invites.length <= 1) {
          setIsOpen(false);
        }
      } else {
        toast.error("Failed to decline invitation");
      }
    } catch (error) {
      console.error("Failed to decline invite:", error);
      toast.error("Failed to decline invitation");
    } finally {
      setActionId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1D2A54]/50 p-4 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-[#E6EAFA]"
        >
          {/* Header Banner */}
          <div className="relative overflow-hidden bg-gradient-to-r from-[#3B58F5] via-[#4A72FF] to-[#6366F1] px-7 py-6 text-white shrink-0">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 shadow-inner">
                  <Building2 className="h-6 w-6 text-white" strokeWidth={2.2} />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight">Pending Invitations</h2>
                  <p className="text-xs text-white/80 font-medium">
                    You have been invited to join workspaces
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full bg-white/10 p-2 text-white/90 transition-all hover:bg-white/20 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* List Body */}
          <div className="flex-1 overflow-y-auto p-6 bg-[#F8FAFC]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-[#3B58F5]" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {invites.map((invite) => (
                  <motion.div
                    key={invite.id}
                    layout
                    className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm border border-[#E6EAFA]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#EEF2FB] to-[#DCE6FF] border border-[#3B58F5]/20 text-lg font-bold text-[#3B58F5]">
                        {invite.workspace?.name?.substring(0, 2).toUpperCase() || "WS"}
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <h4 className="text-base font-bold text-[#1D2A54] truncate">
                          {invite.workspace?.name || "Corporate Workspace"}
                        </h4>
                        <p className="text-xs font-medium text-[#64748B]">
                          @{invite.workspace?.businessId || "business"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => handleAccept(invite.id)}
                        disabled={actionId === invite.id}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#3B58F5] px-3 py-2 text-xs font-bold text-white shadow-md shadow-[#3B58F5]/20 transition-all hover:bg-[#2A46DB] disabled:opacity-50"
                      >
                        {actionId === invite.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            Accept
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleReject(invite.id)}
                        disabled={actionId === invite.id}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-red-50 text-red-600 px-3 py-2 text-xs font-bold transition-all hover:bg-red-100 disabled:opacity-50 border border-red-200"
                      >
                        {actionId === invite.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <XCircle className="h-4 w-4" />
                            Decline
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
