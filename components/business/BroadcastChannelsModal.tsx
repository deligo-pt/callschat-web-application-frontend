"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Megaphone,
  Plus,
  Users,
  Send,
  Check,
  X,
  Sparkles,
  MessageSquare,
  Search,
  CheckCircle2,
  Trash2,
  ChevronRight,
  ArrowLeft,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ContactService } from "@/services/contact.service";
import { chatService } from "@/services/chat.service";

interface BroadcastList {
  id: string;
  name: string;
  description: string;
  recipientCount: number;
  recipientIds: string[];
  createdAt: string;
  lastSentAt?: string;
}

interface BroadcastChannelsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BroadcastChannelsModal({ isOpen, onClose }: BroadcastChannelsModalProps) {
  const [activeTab, setActiveTab] = useState<"list" | "create" | "compose">("list");
  const [broadcastLists, setBroadcastLists] = useState<BroadcastList[]>([
    {
      id: "bl-1",
      name: "VIP Enterprise Customers",
      description: "Priority product announcements & exclusive promotional offers.",
      recipientCount: 48,
      recipientIds: [],
      createdAt: new Date().toISOString(),
      lastSentAt: "2 days ago",
    },
    {
      id: "bl-2",
      name: "Newsletter & Blog Subscribers",
      description: "Weekly tech insights, tutorials, and community highlights.",
      recipientCount: 152,
      recipientIds: [],
      createdAt: new Date().toISOString(),
      lastSentAt: "1 week ago",
    },
  ]);

  const [selectedList, setSelectedList] = useState<BroadcastList | null>(null);

  // Create List State
  const [listName, setListName] = useState("");
  const [listDescription, setListDescription] = useState("");
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Compose Blast State
  const [blastTitle, setBlastTitle] = useState("");
  const [blastMessage, setBlastMessage] = useState("");
  const [sendViaSms, setSendViaSms] = useState(false);
  const [sendViaPush, setSendViaPush] = useState(true);
  const [isSendingBlast, setIsSendingBlast] = useState(false);

  const fetchContacts = useCallback(async () => {
    try {
      const [contactsRes, convsRes] = await Promise.all([
        ContactService.fetchContacts().catch(() => ({ data: [] })),
        chatService.fetchMyConversations().catch(() => ({ data: [] })),
      ]);

      const map = new Map<string, any>();
      if (Array.isArray(contactsRes?.data)) {
        contactsRes.data.forEach((c: any) => {
          const id = c.contactUserId || c.userId || c.id;
          if (id) {
            map.set(id, {
              id,
              name: c.customName || c.name || c.contactUser?.profile?.displayName || "Contact",
              phone: c.phone || c.contactUser?.phone || null,
              avatarUrl: c.avatarUrl || c.contactUser?.profile?.avatarUrl || null,
            });
          }
        });
      }
      if (Array.isArray(convsRes?.data)) {
        convsRes.data.forEach((c: any) => {
          if (c.otherUserId) {
            map.set(c.otherUserId, {
              id: c.otherUserId,
              name: c.otherUserName || "User",
              phone: null,
              avatarUrl: c.otherUserAvatar || null,
            });
          }
        });
      }
      setContacts(Array.from(map.values()));
    } catch (e) {
      console.error("Failed to load contacts for broadcast", e);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchContacts();
    }
  }, [isOpen, fetchContacts]);

  if (!isOpen) return null;

  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!listName.trim()) {
      toast.error("Please enter a name for your broadcast list");
      return;
    }
    if (selectedRecipientIds.length === 0) {
      toast.error("Please select at least 1 recipient");
      return;
    }

    setIsCreating(true);
    setTimeout(() => {
      const newList: BroadcastList = {
        id: `bl-${Date.now()}`,
        name: listName.trim(),
        description: listDescription.trim() || "Custom broadcast recipient list.",
        recipientCount: selectedRecipientIds.length,
        recipientIds: selectedRecipientIds,
        createdAt: new Date().toISOString(),
      };
      setBroadcastLists((prev) => [newList, ...prev]);
      setListName("");
      setListDescription("");
      setSelectedRecipientIds([]);
      setIsCreating(false);
      setActiveTab("list");
      toast.success(`Broadcast List "${newList.name}" created!`);
    }, 600);
  };

  const handleSendBlast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blastMessage.trim() || !selectedList) return;

    setIsSendingBlast(true);
    setTimeout(() => {
      setIsSendingBlast(false);
      setBlastTitle("");
      setBlastMessage("");
      setBroadcastLists((prev) =>
        prev.map((l) => (l.id === selectedList.id ? { ...l, lastSentAt: "Just now" } : l))
      );
      toast.success(`Broadcast sent to ${selectedList.recipientCount} recipients!`);
      setActiveTab("list");
    }, 1000);
  };

  const handleDeleteList = (id: string, name: string) => {
    if (!confirm(`Delete broadcast list "${name}"?`)) return;
    setBroadcastLists((prev) => prev.filter((l) => l.id !== id));
    toast.success("Broadcast list deleted");
  };

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0F172A]/70 p-4 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        className="flex h-[85vh] max-h-[780px] w-full max-w-2xl flex-col overflow-hidden rounded-[2.5rem] bg-white shadow-2xl border border-[#E6EAFA]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F0F4FF] bg-white px-7 py-5 shrink-0">
          <div className="flex items-center gap-3">
            {activeTab !== "list" ? (
              <button
                onClick={() => setActiveTab("list")}
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-slate-100 text-[#3B58F5] transition-colors"
              >
                <ArrowLeft className="h-5 w-5 stroke-[2.5]" />
              </button>
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white shadow-md shadow-indigo-500/20">
                <Megaphone className="h-5 w-5" />
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-[#11142D] tracking-tight">
                {activeTab === "list" && "Broadcast Channels & Lists"}
                {activeTab === "create" && "New Broadcast List"}
                {activeTab === "compose" && selectedList && `Blast: ${selectedList.name}`}
              </h2>
              <p className="text-xs font-medium text-slate-400">
                {activeTab === "list" && "Send one-to-many marketing blasts and promotional announcements"}
                {activeTab === "create" && "Select customer segments to receive broadcast campaigns"}
                {activeTab === "compose" && `Reaching ${selectedList?.recipientCount} selected recipients`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-7">
          <AnimatePresence mode="wait">
            {/* 1. LISTS */}
            {activeTab === "list" && (
              <motion.div
                key="list"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 max-w-xl mx-auto"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-[#3B58F5] tracking-wide">Your Broadcast Lists</h3>
                  <button
                    onClick={() => setActiveTab("create")}
                    className="flex items-center gap-1.5 rounded-xl bg-[#3B58F5] px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-[#2C48B8] transition-all"
                  >
                    <Plus className="h-3.5 w-3.5 stroke-[3]" />
                    <span>New List</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {broadcastLists.map((list) => (
                    <div
                      key={list.id}
                      className="flex items-center justify-between p-4 rounded-2xl border border-[#F0F4FF] bg-white shadow-2xs hover:shadow-md hover:border-indigo-200 transition-all group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center shrink-0">
                          <Users className="h-6 w-6" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-base font-bold text-[#11142D] truncate">{list.name}</h4>
                          <p className="text-xs text-slate-500 font-medium truncate mt-0.5">{list.description}</p>
                          <div className="flex items-center gap-3 mt-1.5 text-[11px] font-bold text-slate-400">
                            <span className="text-indigo-600">{list.recipientCount} recipients</span>
                            {list.lastSentAt && <span>· Last sent {list.lastSentAt}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            setSelectedList(list);
                            setActiveTab("compose");
                          }}
                          className="flex items-center gap-1.5 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white px-3.5 py-2 text-xs font-bold transition-all shadow-2xs"
                        >
                          <Send className="h-3.5 w-3.5" />
                          <span>Send Blast</span>
                        </button>
                        <button
                          onClick={() => handleDeleteList(list.id, list.name)}
                          className="p-2 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Delete List"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 2. CREATE LIST */}
            {activeTab === "create" && (
              <motion.form
                key="create"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleCreateList}
                className="max-w-xl mx-auto space-y-6"
              >
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#11142D]">
                    Broadcast List Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., VIP Customers, Product Beta Testers"
                    value={listName}
                    onChange={(e) => setListName(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-[#11142D] focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#11142D]">Description</label>
                  <input
                    type="text"
                    placeholder="What is this recipient list for?"
                    value={listDescription}
                    onChange={(e) => setListDescription(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-[#11142D] focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-[#11142D]">
                      Select Recipients ({selectedRecipientIds.length} selected)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedRecipientIds.length === contacts.length) {
                          setSelectedRecipientIds([]);
                        } else {
                          setSelectedRecipientIds(contacts.map((c) => c.id));
                        }
                      }}
                      className="text-xs font-bold text-indigo-600 hover:underline"
                    >
                      {selectedRecipientIds.length === contacts.length ? "Deselect All" : "Select All"}
                    </button>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search contacts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-xs font-semibold focus:border-indigo-600 focus:outline-none"
                    />
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-1.5 border border-slate-100 rounded-2xl p-2 bg-[#F8FAFC]">
                    {filteredContacts.length === 0 ? (
                      <p className="py-8 text-center text-xs font-semibold text-slate-400">No contacts found</p>
                    ) : (
                      filteredContacts.map((c) => {
                        const isSelected = selectedRecipientIds.includes(c.id);
                        return (
                          <div
                            key={c.id}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedRecipientIds((prev) => prev.filter((id) => id !== c.id));
                              } else {
                                setSelectedRecipientIds((prev) => [...prev, c.id]);
                              }
                            }}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-white hover:bg-slate-50 cursor-pointer transition-colors shadow-2xs"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 overflow-hidden">
                                {c.avatarUrl ? (
                                  <img src={c.avatarUrl} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  <span>{c.name.charAt(0).toUpperCase()}</span>
                                )}
                              </div>
                              <span className="text-xs font-bold text-[#11142D]">{c.name}</span>
                            </div>

                            <div className="shrink-0">
                              {isSelected ? (
                                <div className="h-5 w-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                                  <Check className="h-3 w-3 stroke-[3]" />
                                </div>
                              ) : (
                                <div className="h-5 w-5 rounded-full border-2 border-slate-300" />
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab("list")}
                    className="flex-1 rounded-2xl bg-slate-100 py-3.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 disabled:opacity-50 transition-all"
                  >
                    {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Save Broadcast List</span>}
                  </button>
                </div>
              </motion.form>
            )}

            {/* 3. COMPOSE BLAST */}
            {activeTab === "compose" && selectedList && (
              <motion.form
                key="compose"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleSendBlast}
                className="max-w-xl mx-auto space-y-6"
              >
                <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-extrabold text-indigo-900 block">Target Audience</span>
                    <span className="text-sm font-bold text-indigo-600">
                      {selectedList.name} ({selectedList.recipientCount} recipients)
                    </span>
                  </div>
                  <span className="rounded-full bg-indigo-200/60 text-indigo-800 px-2.5 py-1 text-[10px] font-extrabold">
                    One-Way Blast
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#11142D]">Campaign / Blast Title</label>
                  <input
                    type="text"
                    placeholder="e.g., Summer Flash Sale - 50% Off!"
                    value={blastTitle}
                    onChange={(e) => setBlastTitle(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#11142D]">
                    Message Content <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={5}
                    required
                    placeholder="Write your broadcast announcement here..."
                    value={blastMessage}
                    onChange={(e) => setBlastMessage(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 p-4 text-sm font-medium focus:border-indigo-600 focus:outline-none resize-none"
                  />
                </div>

                <div className="space-y-3 p-4 rounded-2xl border border-slate-100 bg-[#F8FAFC]">
                  <span className="text-xs font-bold text-[#11142D] block">Delivery Channels</span>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-600">Send In-App Push Notification</span>
                    <input
                      type="checkbox"
                      checked={sendViaPush}
                      onChange={(e) => setSendViaPush(e.target.checked)}
                      className="h-5 w-9 rounded-full text-indigo-600 focus:ring-indigo-600"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-600">Send SMS Notification via BulkGate</span>
                    <input
                      type="checkbox"
                      checked={sendViaSms}
                      onChange={(e) => setSendViaSms(e.target.checked)}
                      className="h-5 w-9 rounded-full text-indigo-600 focus:ring-indigo-600"
                    />
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab("list")}
                    className="flex-1 rounded-2xl bg-slate-100 py-3.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingBlast || !blastMessage.trim()}
                    className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 disabled:opacity-50 transition-all"
                  >
                    {isSendingBlast ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Dispatch Blast</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
