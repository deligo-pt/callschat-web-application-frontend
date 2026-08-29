"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Settings, Shield, MessageSquare, UserPlus, Clock, Loader2, Check } from "lucide-react";
import { groupService } from "@/services/group.service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface GroupSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
  isAdmin: boolean;
  settings: {
    editGroupInfoScope?: "ALL_MEMBERS" | "ONLY_ADMINS";
    sendMessagesScope?: "ALL_MEMBERS" | "ONLY_ADMINS";
    addMembersScope?: "ALL_MEMBERS" | "ONLY_ADMINS";
    joinApprovalMode?: "DIRECT" | "APPROVAL_REQUIRED";
    disappearAfterSeconds?: number | null;
  };
  onSettingsUpdated: (newSettings: any) => void;
}

export function GroupSettingsDrawer({
  isOpen,
  onClose,
  groupId,
  groupName,
  isAdmin,
  settings,
  onSettingsUpdated,
}: GroupSettingsDrawerProps) {
  const [editInfo, setEditInfo] = useState<"ALL_MEMBERS" | "ONLY_ADMINS">(
    settings.editGroupInfoScope || "ALL_MEMBERS"
  );
  const [sendMessages, setSendMessages] = useState<"ALL_MEMBERS" | "ONLY_ADMINS">(
    settings.sendMessagesScope || "ALL_MEMBERS"
  );
  const [addMembers, setAddMembers] = useState<"ALL_MEMBERS" | "ONLY_ADMINS">(
    settings.addMembersScope || "ALL_MEMBERS"
  );
  const [approvalMode, setApprovalMode] = useState<"DIRECT" | "APPROVAL_REQUIRED">(
    settings.joinApprovalMode || "DIRECT"
  );
  const [disappearSeconds, setDisappearSeconds] = useState<number | null>(
    settings.disappearAfterSeconds ?? null
  );

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!isAdmin) {
      toast.error("Only administrators can update group settings");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        editGroupInfoScope: editInfo,
        sendMessagesScope: sendMessages,
        addMembersScope: addMembers,
        joinApprovalMode: approvalMode,
        disappearAfterSeconds: disappearSeconds,
      };

      const res = await groupService.updateGroupSettings(groupId, payload);
      if (res.success) {
        toast.success("Group permissions updated successfully");
        onSettingsUpdated(payload);
        onClose();
      } else {
        toast.error(res.error || "Failed to update group permissions");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update group settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] bg-white dark:bg-[#111b21] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b border-gray-100 dark:border-gray-800">
          <DialogTitle className="text-base font-semibold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <Settings className="w-5 h-5" />
            <span>Group Permissions &amp; Settings</span>
          </DialogTitle>
        </DialogHeader>

        <div className="p-5 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Edit Group Info Permission */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-semibold">Edit group info</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Choose who can change this group&apos;s name, icon, description, and settings.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => isAdmin && setEditInfo("ALL_MEMBERS")}
                className={cn(
                  "p-2.5 rounded-xl border text-xs font-medium text-left flex items-center justify-between transition-colors",
                  editInfo === "ALL_MEMBERS"
                    ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300"
                    : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                )}
              >
                <span>All participants</span>
                {editInfo === "ALL_MEMBERS" && <Check className="w-3.5 h-3.5 text-emerald-500" />}
              </button>
              <button
                type="button"
                onClick={() => isAdmin && setEditInfo("ONLY_ADMINS")}
                className={cn(
                  "p-2.5 rounded-xl border text-xs font-medium text-left flex items-center justify-between transition-colors",
                  editInfo === "ONLY_ADMINS"
                    ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300"
                    : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                )}
              >
                <span>Only admins</span>
                {editInfo === "ONLY_ADMINS" && <Check className="w-3.5 h-3.5 text-emerald-500" />}
              </button>
            </div>
          </div>

          {/* Send Messages Permission (Announcement Mode) */}
          <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-semibold">Send messages (Announcement mode)</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Choose who can send messages, photos, videos, and voice notes in this group.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => isAdmin && setSendMessages("ALL_MEMBERS")}
                className={cn(
                  "p-2.5 rounded-xl border text-xs font-medium text-left flex items-center justify-between transition-colors",
                  sendMessages === "ALL_MEMBERS"
                    ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300"
                    : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                )}
              >
                <span>All participants</span>
                {sendMessages === "ALL_MEMBERS" && <Check className="w-3.5 h-3.5 text-emerald-500" />}
              </button>
              <button
                type="button"
                onClick={() => isAdmin && setSendMessages("ONLY_ADMINS")}
                className={cn(
                  "p-2.5 rounded-xl border text-xs font-medium text-left flex items-center justify-between transition-colors",
                  sendMessages === "ONLY_ADMINS"
                    ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300"
                    : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                )}
              >
                <span>Only admins</span>
                {sendMessages === "ONLY_ADMINS" && <Check className="w-3.5 h-3.5 text-emerald-500" />}
              </button>
            </div>
          </div>

          {/* Add Members Permission */}
          <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-semibold">Add other participants</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Choose who can add other participants to this group.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => isAdmin && setAddMembers("ALL_MEMBERS")}
                className={cn(
                  "p-2.5 rounded-xl border text-xs font-medium text-left flex items-center justify-between transition-colors",
                  addMembers === "ALL_MEMBERS"
                    ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300"
                    : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                )}
              >
                <span>All participants</span>
                {addMembers === "ALL_MEMBERS" && <Check className="w-3.5 h-3.5 text-emerald-500" />}
              </button>
              <button
                type="button"
                onClick={() => isAdmin && setAddMembers("ONLY_ADMINS")}
                className={cn(
                  "p-2.5 rounded-xl border text-xs font-medium text-left flex items-center justify-between transition-colors",
                  addMembers === "ONLY_ADMINS"
                    ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300"
                    : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                )}
              >
                <span>Only admins</span>
                {addMembers === "ONLY_ADMINS" && <Check className="w-3.5 h-3.5 text-emerald-500" />}
              </button>
            </div>
          </div>

          {/* Approve New Participants */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
            <div>
              <span className="text-sm font-semibold block">Approve new participants</span>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                When turned on, an admin must approve anyone who joins with an invite link.
              </p>
            </div>
            <Switch
              checked={approvalMode === "APPROVAL_REQUIRED"}
              onCheckedChange={(checked) =>
                setApprovalMode(checked ? "APPROVAL_REQUIRED" : "DIRECT")
              }
              disabled={!isAdmin}
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>

          {/* Disappearing Messages Timer */}
          <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-semibold">Disappearing messages</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              New messages will automatically disappear from this group after the selected duration.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {[
                { label: "Off", val: null },
                { label: "24 hours", val: 86400 },
                { label: "7 days", val: 604800 },
                { label: "90 days", val: 7776000 },
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => isAdmin && setDisappearSeconds(opt.val)}
                  className={cn(
                    "p-2.5 rounded-xl border text-xs font-medium text-left flex items-center justify-between transition-colors",
                    disappearSeconds === opt.val
                      ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300"
                      : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                  )}
                >
                  <span>{opt.label}</span>
                  {disappearSeconds === opt.val && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="p-4 bg-gray-50 dark:bg-[#182229] border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={saving}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
