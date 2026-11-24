"use client";

import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { UserPlus, Search, Loader2 } from "lucide-react";
import { Contact } from "@/hooks/useContacts";
import { getOptimizedImageUrl } from "@/utils/image";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: Contact[];
  isLoadingContacts: boolean;
  existingMemberUserIds: string[];
  isAddingMember: boolean;
  onSelectUser: (userId: string) => Promise<void>;
}

export function AddMemberModal({
  isOpen,
  onClose,
  contacts,
  isLoadingContacts,
  existingMemberUserIds,
  isAddingMember,
  onSelectUser,
}: AddMemberModalProps) {
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<"callschat" | "all">("callschat");
  const [addingUserId, setAddingUserId] = useState<string | null>(null);

  const nonMemberContacts = useMemo(() => {
    return contacts.filter((c) => !existingMemberUserIds.includes(c.userId || c.id));
  }, [contacts, existingMemberUserIds]);

  const callsChatCount = useMemo(() => {
    return nonMemberContacts.filter((c) => !c.isUnregistered && Boolean(c.userId)).length;
  }, [nonMemberContacts]);

  const allCount = nonMemberContacts.length;

  const filteredContacts = useMemo(() => {
    return nonMemberContacts.filter((c) => {
      const isOnCallsChat = !c.isUnregistered && Boolean(c.userId);
      if (filterTab === "callschat" && !isOnCallsChat) return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        c.name?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q)
      );
    });
  }, [nonMemberContacts, filterTab, search]);

  const handleAdd = async (contact: Contact) => {
    if (isAddingMember) return;
    const uId = contact.userId;
    if (!uId || contact.isUnregistered) {
      toast.info(`${contact.name || "This contact"} hasn't joined CallsChat yet. Only CallsChat users can be added to the group.`);
      return;
    }

    setAddingUserId(uId);
    try {
      await onSelectUser(uId);
    } finally {
      setAddingUserId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isAddingMember && onClose()}>
      <DialogContent className="sm:max-w-[460px] bg-white dark:bg-[#111b21] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b border-gray-100 dark:border-gray-800">
          <DialogTitle className="text-base font-semibold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <UserPlus className="w-5 h-5" />
            <span>Add Participants</span>
          </DialogTitle>
        </DialogHeader>

        {/* Search input & Filter pills */}
        <div className="p-3 border-b border-gray-100 dark:border-gray-800 space-y-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts by name or number..."
              className="pl-9 bg-gray-50 dark:bg-[#202c33] border-gray-200 dark:border-gray-700 text-xs h-9"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilterTab("callschat")}
              className={cn(
                "px-2.5 py-1 rounded-full text-[11.5px] font-medium transition-all cursor-pointer shrink-0",
                filterTab === "callschat"
                  ? "bg-emerald-600 text-white shadow-xs font-semibold"
                  : "bg-gray-100 dark:bg-[#202c33] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#2a3942]"
              )}
            >
              CallsChat ({callsChatCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("all")}
              className={cn(
                "px-2.5 py-1 rounded-full text-[11.5px] font-medium transition-all cursor-pointer shrink-0",
                filterTab === "all"
                  ? "bg-emerald-600 text-white shadow-xs font-semibold"
                  : "bg-gray-100 dark:bg-[#202c33] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#2a3942]"
              )}
            >
              All ({allCount})
            </button>
          </div>
        </div>

        {/* Contact List */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-1">
          {isLoadingContacts ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
              <span className="text-xs">Loading contacts...</span>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-xs">
              {search ? "No matching contacts found." : "No contacts available to add."}
            </div>
          ) : (
            filteredContacts.map((c) => {
              const uId = c.userId || c.id;
              const isSelected = addingUserId === uId;
              const isOnCallsChat = !c.isUnregistered && Boolean(c.userId);

              return (
                <button
                  key={c.id || uId}
                  type="button"
                  onClick={() => handleAdd(c)}
                  disabled={isAddingMember}
                  className={cn(
                    "w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-[#182229] transition-colors text-left disabled:opacity-50",
                    !isOnCallsChat && "opacity-75"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-sm overflow-hidden shrink-0">
                      {c.avatarUrl ? (
                        <img
                          src={getOptimizedImageUrl(c.avatarUrl)}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        (c.name || "U")[0].toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {c.name || "Contact"}
                        </p>
                        {!isOnCallsChat && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
                            Not on CallsChat
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{c.phone || "CallsChat user"}</p>
                    </div>
                  </div>

                  <div>
                    {isSelected ? (
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                    ) : !isOnCallsChat ? (
                      <div className="text-[11px] font-medium text-gray-400 px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800">
                        Invite
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center hover:bg-emerald-100 transition-colors">
                        <UserPlus className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
