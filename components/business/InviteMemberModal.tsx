"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { toast } from "sonner";
import { WorkspaceService } from "@/services/workspace.service";

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
}

export function InviteMemberModal({ isOpen, onClose, workspaceId }: InviteMemberModalProps) {
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"AGENT" | "ADMIN">("AGENT");
  const [isLoading, setIsLoading] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;

    try {
      setIsLoading(true);
      const res = await WorkspaceService.inviteWorkspaceMember(phone.trim(), role);

      if (res.success) {
        toast.success("Invitation sent successfully!");
        setPhone("");
        setRole("AGENT");
        onClose();
      } else {
        toast.error(res.error?.message || "Failed to send invitation.");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "A network error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-[#11142D] text-white border-white/10">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Invite Team Member</DialogTitle>
          <DialogDescription className="text-[#8F95B2]">
            Enter the phone number of the user you wish to invite to this workspace.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleInvite} className="space-y-6 pt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-semibold text-white">
                Phone Number (E.164 Format, e.g. +1234567890)
              </label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1234567890"
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-[#8F95B2] focus-visible:ring-purple-600"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-semibold text-white">
                Role
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as "AGENT" | "ADMIN")}
                className="flex h-10 w-full rounded-md border border-white/10 bg-[#11142D] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 focus:ring-offset-[#11142D]"
              >
                <option value="AGENT">Agent</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-white/10 text-white bg-transparent hover:bg-white/10 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !phone.trim()}
              className="bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
            >
              {isLoading ? "Inviting..." : "Invite Member"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
