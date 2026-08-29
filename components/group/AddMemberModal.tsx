"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { UserPlus, Search, Loader2, Check, User as UserIcon } from "lucide-react";
import { Contact } from "@/hooks/useContacts";
import { getOptimizedImageUrl } from "@/utils/image";

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
  const [addingUserId, setAddingUserId] = useState<string | null>(null);

  const filteredContacts = contacts.filter((c) => {
    const isAlreadyMember = existingMemberUserIds.includes(c.userId || c.id);
    if (isAlreadyMember) return false;
    if (c.isUnregistered) return false;

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q)
    );
  });

  const handleAdd = async (userId: string) => {
    if (isAddingMember) return;
    setAddingUserId(userId);
    try {
      await onSelectUser(userId);
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

        {/* Search input */}
        <div className="p-3 border-b border-gray-100 dark:border-gray-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts by name or number..."
              className="pl-9 bg-gray-50 dark:bg-[#202c33] border-gray-200 dark:border-gray-700 text-xs h-9"
            />
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

              return (
                <button
                  key={c.id || uId}
                  type="button"
                  onClick={() => handleAdd(uId)}
                  disabled={isAddingMember}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-[#182229] transition-colors text-left disabled:opacity-50"
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
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {c.name || "Contact"}
                      </p>
                      <p className="text-xs text-gray-500">{c.phone || "CallsChat user"}</p>
                    </div>
                  </div>

                  <div>
                    {isSelected ? (
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
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
