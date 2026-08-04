"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Search,
  RefreshCw,
  Send,
  CheckCircle2,
  Users,
  MessageSquare,
  Plus,
  Trash2,
  Loader2,
  Sparkles,
  Smartphone,
  X,
  ChevronLeft,
  ChevronRight,
  Info
} from "lucide-react";
import { toast } from "sonner";
import { ContactService } from "@/services/contact.service";
import type {
  UnregisteredContact,
  PaginationMeta,
  SyncContactItem
} from "@/types/contact.types";

interface InviteFriendsProps {
  onBack?: () => void;
}

export function InviteFriends({ onBack }: InviteFriendsProps) {
  const t = useTranslations("invite_friends");
  const tCommon = useTranslations("common");

  // State for unregistered contacts & pagination
  const [contacts, setContacts] = useState<UnregisteredContact[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // State for invitation actions
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [showCustomMsg, setShowCustomMsg] = useState<boolean>(false);
  const [customMessage, setCustomMessage] = useState<string>(
    t("default_invite_msg") || "Hey! I'm using CallsChat for secure audio/video calls. Join me: https://callschat.com/download"
  );

  // State for Sync Modal
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
  const [syncTab, setSyncTab] = useState<"manual" | "device">("manual");
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [manualContacts, setManualContacts] = useState<SyncContactItem[]>([
    { name: "", phoneNumber: "" },
  ]);

  // Fetch unregistered contacts
  const fetchUnregistered = useCallback(
    async (pageNum: number = 1, searchVal?: string) => {
      setIsLoading(true);
      try {
        const response = await ContactService.listUnregisteredContacts({
          page: pageNum,
          limit: 20,
          search: searchVal || undefined,
        });
        if (response.success && response.data) {
          setContacts(response.data.contacts || []);
          setPagination(response.data.pagination || {
            page: pageNum,
            limit: 20,
            total: response.data.contacts?.length || 0,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
          });
        }
      } catch (error) {
        console.error("Failed to fetch invitable contacts:", error);
        toast.error(tCommon("loading") + " Error");
      } finally {
        setIsLoading(false);
      }
    },
    [tCommon]
  );

  // Initial fetch & debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUnregistered(1, searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchUnregistered]);

  // Handle invite SMS
  const handleInvite = async (contact: UnregisteredContact) => {
    setInvitingId(contact.id);
    try {
      const response = await ContactService.inviteContact({
        phoneNumber: contact.phoneNumber,
        customMessage: customMessage || undefined,
      });
      if (response.success || response.data) {
        toast.success(`${t("invited")} ${contact.name}!`);
        // Update local state to mark as invited
        setContacts((prev) =>
          prev.map((c) =>
            c.id === contact.id
              ? { ...c, isInvited: true, invitedAt: new Date().toISOString() }
              : c
          )
        );
      } else {
        toast.error(response.message || "Failed to send invitation");
      }
    } catch (error) {
      console.error("Error sending SMS invitation:", error);
      toast.error("Network error while sending SMS");
    } finally {
      setInvitingId(null);
    }
  };

  // Handle Sync Contacts
  const handleSyncSubmit = async () => {
    const validContacts = manualContacts
      .map((c) => ({
        name: c.name.trim(),
        phoneNumber: c.phoneNumber.trim(),
      }))
      .filter((c) => c.name !== "" && c.phoneNumber !== "");

    if (validContacts.length === 0) {
      toast.error("Please enter at least one valid contact with name and phone number.");
      return;
    }

    setIsSyncing(true);
    try {
      const response = await ContactService.syncContacts({
        contacts: validContacts,
      });
      const regCount = response.data?.registered?.length || response.registered?.length || 0;
      const unregCount = response.data?.unregistered?.length || response.unregistered?.length || 0;

      toast.success(
        `Sync complete! Found ${regCount} registered account(s) and ${unregCount} invitable friend(s).`
      );
      setIsSyncModalOpen(false);
      setManualContacts([{ name: "", phoneNumber: "" }]);
      fetchUnregistered(1, searchQuery);
    } catch (error) {
      console.error("Error syncing contacts:", error);
      toast.error("Failed to sync contacts. Please check phone number formats.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle Device Contact Picker
  const handleDeviceSync = async () => {
    if (!("contacts" in navigator && "select" in (navigator as unknown as Record<string, unknown>))) {
      toast.info("Device contact picker is not supported in this browser. Please use manual entry or upload.");
      setSyncTab("manual");
      return;
    }

    try {
      const navContacts = navigator as unknown as {
        contacts: { select: (props: string[], opts: { multiple: boolean }) => Promise<Array<{ name?: string[]; tel?: string[] }>> };
      };
      const pickedContacts = await navContacts.contacts.select(["name", "tel"], {
        multiple: true,
      });

      if (pickedContacts && pickedContacts.length > 0) {
        const formatted: SyncContactItem[] = [];
        pickedContacts.forEach((item) => {
          const name = item.name?.[0] || "Unknown Contact";
          const phone = item.tel?.[0] || "";
          if (phone) {
            formatted.push({ name, phoneNumber: phone });
          }
        });

        if (formatted.length > 0) {
          setIsSyncing(true);
          const response = await ContactService.syncContacts({ contacts: formatted });
          const regCount = response.data?.registered?.length || response.registered?.length || 0;
          const unregCount = response.data?.unregistered?.length || response.unregistered?.length || 0;
          toast.success(`Synced ${formatted.length} device contacts! Found ${regCount} registered and ${unregCount} new.`);
          setIsSyncModalOpen(false);
          fetchUnregistered(1, searchQuery);
        }
      }
    } catch (err) {
      console.error("Device contact selection cancelled or failed:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Add/Remove rows in manual sync
  const addManualRow = () => {
    setManualContacts((prev) => [...prev, { name: "", phoneNumber: "" }]);
  };

  const removeManualRow = (index: number) => {
    setManualContacts((prev) => prev.filter((_, i) => i !== index));
  };

  const updateManualRow = (index: number, field: keyof SyncContactItem, val: string) => {
    setManualContacts((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: val } : item))
    );
  };

  const loadSampleContacts = () => {
    setManualContacts([
      { name: "Wade Warren", phoneNumber: "+15551234567" },
      { name: "Annette Black", phoneNumber: "+15559876543" },
      { name: "Marvin McKinney", phoneNumber: "+15558889999" },
    ]);
    toast.info("Loaded sample contacts! Click 'Sync Now' to test.");
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const getRandomColor = (name: string) => {
    const colors = [
      "bg-gradient-to-br from-blue-500 to-indigo-600",
      "bg-gradient-to-br from-purple-500 to-pink-600",
      "bg-gradient-to-br from-emerald-500 to-teal-600",
      "bg-gradient-to-br from-amber-500 to-orange-600",
      "bg-gradient-to-br from-rose-500 to-red-600",
      "bg-gradient-to-br from-cyan-500 to-blue-600",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="flex h-full flex-col bg-[#F8FAFC] relative overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-5 shrink-0 shadow-md"
        style={{ background: "linear-gradient(135deg, #3B58F5 0%, #2563EB 100%)" }}
      >
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              aria-label="Go back"
              className="flex items-center justify-center h-8 w-8 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all duration-200"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div className="flex flex-col">
            <h2 className="text-[18px] font-bold text-white tracking-tight leading-none">
              {t("title")}
            </h2>
            <span className="text-[12px] font-medium text-blue-100 mt-1">
              {t("subtitle")}
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsSyncModalOpen(true)}
          className="flex items-center gap-2 rounded-full bg-white/15 hover:bg-white/25 px-4 py-2 text-[13px] font-bold text-white backdrop-blur-sm transition-all duration-200 shadow-sm hover:scale-105 active:scale-95"
        >
          <RefreshCw className="h-4 w-4" />
          <span>{t("sync_contacts")}</span>
        </button>
      </div>

      {/* Action Bar / Search & Custom Message Toggle */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 shrink-0 flex flex-col gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t("search_placeholder") || "Search by name or phone..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-xl bg-slate-100 pl-10 pr-4 text-[13px] font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3B58F5]/20 border border-transparent focus:border-[#3B58F5] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowCustomMsg(!showCustomMsg)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-bold transition-all ${
              showCustomMsg
                ? "bg-[#EEF2FF] text-[#3B58F5] border border-blue-200"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-transparent"
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">{t("custom_message")}</span>
          </button>
        </div>

        {/* Expandable Custom Message Editor */}
        <AnimatePresence>
          {showCustomMsg && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-2 pb-1 border-t border-slate-100 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-bold text-slate-700 flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5 text-[#3B58F5]" />
                    <span>{t("custom_message")}</span>
                  </label>
                  <button
                    onClick={() => setCustomMessage(t("default_invite_msg"))}
                    className="text-[11px] font-semibold text-blue-600 hover:underline"
                  >
                    Reset to default
                  </button>
                </div>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-[13px] font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3B58F5]/20 focus:border-[#3B58F5] transition-all resize-none"
                  placeholder="Type custom invitation message..."
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Content / Contacts List */}
      <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#3B58F5]" />
            <p className="text-[14px] font-medium text-slate-500">{tCommon("loading")}</p>
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 max-w-sm mx-auto">
            <div className="h-20 w-20 rounded-full bg-[#EEF2FF] flex items-center justify-center text-[#3B58F5] mb-4 shadow-inner">
              <Users className="h-10 w-10" />
            </div>
            <h3 className="text-[17px] font-bold text-slate-800 mb-2">
              {t("no_contacts")}
            </h3>
            <p className="text-[13px] font-medium text-slate-500 leading-relaxed mb-6">
              {t("no_contacts_desc")}
            </p>
            <button
              onClick={() => setIsSyncModalOpen(true)}
              className="flex items-center gap-2 rounded-full bg-[#3B58F5] hover:bg-blue-700 px-6 py-2.5 text-[14px] font-bold text-white shadow-md hover:shadow-lg transition-all"
            >
              <RefreshCw className="h-4 w-4" />
              <span>{t("sync_contacts")}</span>
            </button>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl flex flex-col gap-3 pb-8">
            <div className="flex items-center justify-between mb-1 px-1">
              <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">
                Unregistered Contacts ({pagination.total})
              </span>
            </div>

            <AnimatePresence mode="popLayout">
              {contacts.map((contact, index) => (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[15px] font-bold text-white shadow-sm ${getRandomColor(
                        contact.name
                      )}`}
                    >
                      {getInitials(contact.name)}
                    </div>
                    <div className="flex flex-col items-start min-w-0 leading-tight">
                      <span className="text-[15px] font-bold text-slate-900 truncate w-full group-hover:text-[#3B58F5] transition-colors">
                        {contact.name}
                      </span>
                      <span className="text-[13px] font-medium text-slate-400 mt-0.5 font-mono">
                        {contact.phoneNumber}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    {contact.isInvited ? (
                      <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-[13px] font-bold">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span>{t("invited")}</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleInvite(contact)}
                        disabled={invitingId === contact.id}
                        className="flex items-center gap-2 rounded-full bg-[#EEF2FF] hover:bg-[#3B58F5] text-[#3B58F5] hover:text-white px-5 py-2 text-[13px] font-bold transition-all duration-200 shadow-sm hover:shadow active:scale-95 disabled:opacity-70"
                      >
                        {invitingId === contact.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>{t("inviting")}</span>
                          </>
                        ) : (
                          <>
                            <Send className="h-3.5 w-3.5" />
                            <span>{t("invite")}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {pagination.totalPages > 1 && (
        <div className="bg-white border-t border-slate-200 px-6 py-3 shrink-0 flex items-center justify-between">
          <span className="text-[13px] font-medium text-slate-500">
            {t("page_info", { current: pagination.page, total: pagination.totalPages })}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchUnregistered(pagination.page - 1, searchQuery)}
              disabled={!pagination.hasPrevPage || isLoading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>{t("prev")}</span>
            </button>
            <button
              onClick={() => fetchUnregistered(pagination.page + 1, searchQuery)}
              disabled={!pagination.hasNextPage || isLoading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span>{t("next")}</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Sync Phonebook Contacts Modal */}
      <AnimatePresence>
        {isSyncModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div
                className="px-6 py-5 flex items-center justify-between text-white shrink-0"
                style={{ background: "linear-gradient(135deg, #3B58F5 0%, #1D4ED8 100%)" }}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-white/15 flex items-center justify-center backdrop-blur-sm">
                    <RefreshCw className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-[17px] font-bold">{t("modal_title")}</h3>
                    <p className="text-[12px] text-blue-100">
                      Match phonebook against CallsChat accounts
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSyncModalOpen(false)}
                  className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-200 px-6 pt-3 shrink-0 bg-slate-50/50">
                <button
                  onClick={() => setSyncTab("manual")}
                  className={`pb-3 px-4 text-[14px] font-bold border-b-2 transition-all flex items-center gap-2 ${
                    syncTab === "manual"
                      ? "border-[#3B58F5] text-[#3B58F5]"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Plus className="h-4 w-4" />
                  <span>{t("sync_manual")}</span>
                </button>
                <button
                  onClick={() => setSyncTab("device")}
                  className={`pb-3 px-4 text-[14px] font-bold border-b-2 transition-all flex items-center gap-2 ${
                    syncTab === "device"
                      ? "border-[#3B58F5] text-[#3B58F5]"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Smartphone className="h-4 w-4" />
                  <span>{t("sync_device")}</span>
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6 overflow-y-auto flex-1">
                {syncTab === "manual" ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-bold text-slate-700">
                        Enter Contacts to Sync
                      </span>
                      <button
                        onClick={loadSampleContacts}
                        type="button"
                        className="text-[12px] font-bold text-[#3B58F5] hover:underline flex items-center gap-1"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>{t("load_sample")}</span>
                      </button>
                    </div>

                    <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
                      {manualContacts.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                        >
                          <input
                            type="text"
                            placeholder={t("name_placeholder")}
                            value={item.name}
                            onChange={(e) => updateManualRow(index, "name", e.target.value)}
                            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#3B58F5]"
                          />
                          <input
                            type="text"
                            placeholder={t("phone_placeholder")}
                            value={item.phoneNumber}
                            onChange={(e) => updateManualRow(index, "phoneNumber", e.target.value)}
                            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#3B58F5] font-mono"
                          />
                          {manualContacts.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeManualRow(index)}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={addManualRow}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-300 text-slate-600 hover:text-[#3B58F5] text-[13px] font-bold transition-all bg-slate-50/50 hover:bg-blue-50/30"
                    >
                      <Plus className="h-4 w-4" />
                      <span>{t("add_row")}</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-8 px-4">
                    <div className="h-16 w-16 rounded-full bg-blue-50 text-[#3B58F5] flex items-center justify-center mb-4">
                      <Smartphone className="h-8 w-8" />
                    </div>
                    <h4 className="text-[16px] font-bold text-slate-800 mb-2">
                      {t("sync_device")}
                    </h4>
                    <p className="text-[13px] font-medium text-slate-500 max-w-sm mb-6">
                      Select contacts directly from your phone or mobile device to match against CallsChat users.
                    </p>
                    <button
                      onClick={handleDeviceSync}
                      disabled={isSyncing}
                      className="flex items-center gap-2 rounded-full bg-[#3B58F5] hover:bg-blue-700 text-white px-8 py-3 text-[14px] font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-70"
                    >
                      {isSyncing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>{t("syncing")}</span>
                        </>
                      ) : (
                        <>
                          <Smartphone className="h-4 w-4" />
                          <span>Open Contact Picker</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              {syncTab === "manual" && (
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsSyncModalOpen(false)}
                    className="px-5 py-2.5 rounded-full text-[13px] font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                  >
                    {tCommon("cancel")}
                  </button>
                  <button
                    type="button"
                    onClick={handleSyncSubmit}
                    disabled={isSyncing}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#3B58F5] hover:bg-blue-700 text-white text-[13px] font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-70"
                  >
                    {isSyncing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>{t("syncing")}</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        <span>{t("sync_now")}</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
