"use client";

import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  MessageSquare,
  Phone,
  Search,
  Users,
  Video,
  Plus,
  X,
  Star,
  Bell,
  UserPlus,
  User,
  Heart,
  Loader2,
  Check,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { useState, useEffect } from "react";
import { chatService } from "@/services/chat.service";
import { useContacts, type Contact } from "@/hooks/useContacts";
import { ExploreBusinessesModal } from "@/components/business/ExploreBusinessesModal";
import { Building2 } from "lucide-react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { useTranslations } from "next-intl";
import { ContactService } from "@/services/contact.service";
import { UserService, type SearchUserItem } from "@/services/user.service";
import { toast } from "sonner";
import { getOptimizedImageUrl } from "@/utils/image";
import { useCallContext } from "@/components/providers/CallContext";

export default function ContactsPage() {
  const t = useTranslations("contacts");
  const tCommon = useTranslations("common");
  const tNav = useTranslations("nav");
  const router = useRouter();
  const { initiateCall } = useCallContext();
  const { contacts, isLoading, searchQuery, setSearchQuery, fetchContacts, handleToggleFavourite } = useContacts();

  // Search by Name, Username, Phone API state
  const [searchResults, setSearchResults] = useState<SearchUserItem[]>([]);
  const [unregisteredSearchResults, setUnregisteredSearchResults] = useState<Contact[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addingContactId, setAddingContactId] = useState<string | null>(null);

  // Add Contact Panel State
  const [isAddContactPanelOpen, setIsAddContactPanelOpen] = useState(false);
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const [newContactPhone, setNewContactPhone] = useState<string | undefined>("");
  const [newContactFirstName, setNewContactFirstName] = useState("");
  const [newContactLastName, setNewContactLastName] = useState("");
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [addContactError, setAddContactError] = useState("");

  // ── Debounced Backend Search by Name, Username, Number ───────────────────────
  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults([]);
      setUnregisteredSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const [userSearchRes, unregRes] = await Promise.all([
          UserService.searchUsers(query, 30).catch(() => ({ success: false, data: [] })),
          ContactService.listUnregisteredContacts({ search: query, limit: 20 }).catch(() => ({ success: false, data: { contacts: [] } })),
        ]);

        if (userSearchRes && userSearchRes.success && Array.isArray(userSearchRes.data)) {
          setSearchResults(userSearchRes.data);
        } else {
          setSearchResults([]);
        }

        const unregList = unregRes?.data?.contacts || (unregRes as any)?.contacts || [];
        setUnregisteredSearchResults(
          unregList.map((u: any, idx: number) => ({
            id: u.id || `unreg-${idx}`,
            userId: "",
            name: u.name || "Unknown",
            phone: u.phoneNumber || u.phone || "",
            avatarUrl: null,
            isFavourite: false,
            isOnline: false,
            isUnregistered: true,
          }))
        );
      } catch (err) {
        console.error("Failed to search users/contacts:", err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleStartChat = async (targetUserId: string) => {
    try {
      const res = await chatService.initiateConversation(targetUserId);
      if (res.success && res.data?.conversationId) {
        router.push(`/chats/${res.data.conversationId}?recipientId=${targetUserId}`);
      }
    } catch (error) {
      console.error("Failed to start conversation:", error);
      toast.error("Failed to start chat");
    }
  };

  const handleAddUserAsContact = async (user: SearchUserItem) => {
    setAddingContactId(user.id);
    try {
      if (user.phone) {
        const res = await ContactService.addContact(user.phone, user.displayName);
        if (res && res.success !== false) {
          toast.success(`${user.displayName} added to contacts!`);
          fetchContacts();
          setSearchResults((prev) =>
            prev.map((u) => (u.id === user.id ? { ...u, isContact: true, relationship: "CONTACT" } : u))
          );
          return;
        }
      }
      const res = await ContactService.addMutualContact(user.id);
      if (res && res.success !== false) {
        toast.success(`${user.displayName} added to contacts!`);
        fetchContacts();
        setSearchResults((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, isContact: true, relationship: "CONTACT" } : u))
        );
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to add contact");
    } finally {
      setAddingContactId(null);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddContactError("");

    if (!newContactPhone) {
      setAddContactError(t("err_valid_phone"));
      return;
    }

    setIsAddingContact(true);

    try {
      const token = localStorage.getItem("accessToken");
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000/api/v1";

      const customName = `${newContactFirstName} ${newContactLastName}`.trim();

      const res = await fetch(`${baseUrl}/contacts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          phoneNumber: newContactPhone,
          customName: customName || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success !== false) {
        setIsAddContactPanelOpen(false);
        setNewContactPhone("");
        setNewContactFirstName("");
        setNewContactLastName("");
        fetchContacts();
        toast.success("Contact added successfully!");
      } else if (res.status === 404 || (data.message && data.message.toLowerCase().includes("no registered user"))) {
        try {
          await ContactService.syncContacts({
            contacts: [{ name: customName || newContactPhone, phoneNumber: newContactPhone }],
          });
          setIsAddContactPanelOpen(false);
          setNewContactPhone("");
          setNewContactFirstName("");
          setNewContactLastName("");
          fetchContacts();
          toast.success("Contact saved! (Unregistered on CallsChat)");
        } catch (syncErr) {
          console.error("Failed to save unregistered contact:", syncErr);
          setAddContactError("Failed to save contact. Please check phone number format.");
        }
      } else {
        let errorMessage = data.message || "Failed to add contact";
        if (errorMessage.includes("body/phoneNumber") || res.status === 400) {
          errorMessage = t("err_valid_phone");
        } else if (res.status === 409) {
          errorMessage = t("err_exists");
        }
        setAddContactError(errorMessage);
      }
    } catch (error) {
      setAddContactError(t("err_network"));
    } finally {
      setIsAddingContact(false);
    }
  };

  // Group default contacts by first letter
  const groupedContacts = contacts.reduce((acc, contact) => {
    const letter = contact.name.charAt(0).toUpperCase();
    if (!acc[letter]) {
      acc[letter] = [];
    }
    acc[letter].push(contact);
    return acc;
  }, {} as Record<string, Contact[]>);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const getRandomColor = (name: string) => {
    const colors = [
      "bg-red-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const isQuerying = Boolean(searchQuery.trim());

  return (
    <div className="flex h-full w-full bg-white">
      {/* Left Panel - Contacts & Search List */}
      <div className="flex h-full w-full flex-col border-r border-[#E6EAFA] bg-white md:w-[380px] shrink-0">
        {/* Header Area */}
        <div className="flex flex-col bg-white px-6 pt-8 pb-4 shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-[28px] font-bold text-[#3B58F5]">{tNav("contacts")}</h1>
            <div className="flex items-center gap-2">
              <Link
                href="/chats/favorites"
                className="relative flex items-center justify-center p-2 transition-colors hover:bg-slate-50 rounded-full"
              >
                <Heart className="h-5 w-5 fill-red-500 text-red-500" />
              </Link>
              <NotificationDropdown />
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-6 relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, @username, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-[42px] w-full rounded-xl bg-[#F0F2F5] pl-11 pr-10 text-[14px] font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#3B58F5] transition-colors"
            />
            {isSearching ? (
              <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#3B58F5]" />
            ) : searchQuery ? (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>

        {/* Scrollable List Area */}
        <div className="flex-1 overflow-y-auto scrollbar-hide pb-4">
          {/* Case 1: Backend Search Active */}
          {isQuerying ? (
            isSearching ? (
              <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-[#3B58F5] mb-3" />
                <p className="text-[14px] font-medium text-slate-400">Searching users & contacts...</p>
              </div>
            ) : searchResults.length === 0 && unregisteredSearchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center h-full">
                <Search className="h-10 w-10 text-slate-300 mb-3 opacity-60" />
                <p className="text-[15px] font-bold text-slate-700 mb-1">No users found</p>
                <p className="text-[13px] text-slate-400 max-w-[240px]">
                  No results for &ldquo;{searchQuery}&rdquo;. Try searching with their display name, @username, or phone number.
                </p>
              </div>
            ) : (
              <div className="flex flex-col">
                {/* 1. CallsChat Registered Users */}
                {searchResults.length > 0 && (
                  <div>
                    <div className="bg-[#F8FAFC] px-6 py-2 text-[12px] font-bold uppercase tracking-wider text-slate-500">
                      Users on CallsChat ({searchResults.length})
                    </div>
                    <div className="flex flex-col">
                      {searchResults.map((user) => (
                        <div
                          key={user.id}
                          className="group flex w-full items-center justify-between px-6 py-3 transition-colors hover:bg-slate-50"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            {/* Avatar */}
                            <div className="relative shrink-0">
                              {user.avatarUrl ? (
                                <img
                                  src={getOptimizedImageUrl(user.avatarUrl, 52, 52)}
                                  alt={user.displayName}
                                  className="h-[42px] w-[42px] rounded-full object-cover"
                                />
                              ) : (
                                <div
                                  className={cn(
                                    "flex h-[42px] w-[42px] items-center justify-center rounded-full text-[14px] font-bold text-white",
                                    getRandomColor(user.displayName)
                                  )}
                                >
                                  {getInitials(user.displayName)}
                                </div>
                              )}
                              {user.isOnline && (
                                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex flex-col items-start overflow-hidden">
                              <div className="flex items-center gap-1.5 w-full">
                                <h3 className="text-[15px] font-bold text-slate-900 truncate text-left">
                                  {user.displayName}
                                </h3>
                                {user.isContact && (
                                  <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-emerald-50 text-emerald-600">
                                    Contact
                                  </span>
                                )}
                              </div>
                              <p className="text-[12px] font-medium text-slate-500 truncate text-left">
                                {user.username ? `@${user.username}` : user.phone || "CallsChat User"}
                              </p>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                handleStartChat(user.id);
                              }}
                              title="Message"
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-[#3B58F5] transition-colors hover:bg-blue-100"
                            >
                              <MessageSquare className="h-4 w-4" strokeWidth={2.5} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                initiateCall(user.id, "AUDIO", user.displayName, user.avatarUrl || undefined);
                              }}
                              title="Voice Call"
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-green-50 text-green-500 transition-colors hover:bg-green-100"
                            >
                              <Phone className="h-4 w-4" strokeWidth={2.5} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                initiateCall(user.id, "VIDEO", user.displayName, user.avatarUrl || undefined);
                              }}
                              title="Video Call"
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-50 text-purple-500 transition-colors hover:bg-purple-100"
                            >
                              <Video className="h-4 w-4" strokeWidth={2.5} />
                            </button>
                            {!user.isContact && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleAddUserAsContact(user);
                                }}
                                disabled={addingContactId === user.id}
                                title="Add to Contacts"
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200"
                              >
                                {addingContactId === user.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <UserPlus className="h-4 w-4" strokeWidth={2.5} />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Unregistered Phonebook Contacts */}
                {unregisteredSearchResults.length > 0 && (
                  <div className="mt-2">
                    <div className="bg-[#F8FAFC] px-6 py-2 text-[12px] font-bold uppercase tracking-wider text-slate-500">
                      Invitable Contacts ({unregisteredSearchResults.length})
                    </div>
                    <div className="flex flex-col">
                      {unregisteredSearchResults.map((contact) => (
                        <div
                          key={contact.id}
                          className="group flex w-full items-center justify-between px-6 py-3 transition-colors hover:bg-slate-50"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div
                              className={cn(
                                "flex h-[42px] w-[42px] items-center justify-center rounded-full text-[14px] font-bold text-white shrink-0",
                                getRandomColor(contact.name)
                              )}
                            >
                              {getInitials(contact.name)}
                            </div>
                            <div className="flex flex-col items-start overflow-hidden">
                              <h3 className="text-[15px] font-bold text-slate-900 truncate w-full text-left">
                                {contact.name}
                              </h3>
                              <p className="text-[12px] font-medium text-slate-500 truncate text-left">
                                {contact.phone}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={async (e) => {
                              e.preventDefault();
                              try {
                                await ContactService.inviteContact({ phoneNumber: contact.phone });
                                toast.success(`Invitation SMS sent to ${contact.name}!`);
                              } catch (err) {
                                toast.error("Failed to send invitation SMS");
                              }
                            }}
                            className="px-3.5 py-1.5 rounded-full bg-[#EEF2FF] hover:bg-[#3B58F5] text-[#3B58F5] hover:text-white text-[12px] font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1"
                          >
                            <span>Invite</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          ) : isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#3B58F5] border-t-transparent" />
            </div>
          ) : Object.keys(groupedContacts).length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center h-full">
              <Users className="h-12 w-12 text-slate-300 mb-4 opacity-50" />
              <p className="text-[15px] font-medium text-slate-400">{t("no_contacts")}</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {Object.keys(groupedContacts)
                .sort()
                .map((letter) => (
                  <div key={letter}>
                    {/* Letter Header */}
                    <div className="bg-[#F8FAFC] px-6 py-2.5 text-[13px] font-bold text-slate-500">{letter}</div>

                    {/* Contacts for this letter */}
                    <div className="flex flex-col">
                      {groupedContacts[letter].map((contact) => (
                        <div
                          key={contact.id}
                          className="group flex w-full items-center justify-between px-6 py-3 transition-colors hover:bg-slate-50"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            {/* Avatar */}
                            <div className="relative shrink-0">
                              {contact.avatarUrl ? (
                                <img
                                  src={getOptimizedImageUrl(contact.avatarUrl)}
                                  alt={contact.name}
                                  className="h-[42px] w-[42px] rounded-full object-cover"
                                />
                              ) : (
                                <div
                                  className={cn(
                                    "flex h-[42px] w-[42px] items-center justify-center rounded-full text-[14px] font-bold text-white",
                                    getRandomColor(contact.name)
                                  )}
                                >
                                  {getInitials(contact.name)}
                                </div>
                              )}
                              {contact.isOnline && (
                                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                              )}
                            </div>

                            {/* Contact Info */}
                            <div className="flex flex-col items-start overflow-hidden">
                              <h3 className="text-[15px] font-bold text-slate-900 truncate w-full text-left">
                                {contact.name}
                              </h3>
                              <p className="text-[12px] font-medium text-slate-500 truncate text-left">
                                {contact.phone}
                              </p>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 shrink-0">
                            {!contact.isUnregistered ? (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleStartChat(contact.userId);
                                  }}
                                  title="Message"
                                  className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-[#3B58F5] transition-colors hover:bg-blue-100"
                                >
                                  <MessageSquare className="h-4 w-4" strokeWidth={2.5} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    initiateCall(contact.userId, "AUDIO", contact.name, contact.avatarUrl || undefined);
                                  }}
                                  title="Voice Call"
                                  className="flex h-8 w-8 items-center justify-center rounded-full bg-green-50 text-green-500 transition-colors hover:bg-green-100"
                                >
                                  <Phone className="h-4 w-4" strokeWidth={2.5} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    initiateCall(contact.userId, "VIDEO", contact.name, contact.avatarUrl || undefined);
                                  }}
                                  title="Video Call"
                                  className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-50 text-purple-500 transition-colors hover:bg-purple-100"
                                >
                                  <Video className="h-4 w-4" strokeWidth={2.5} />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={async (e) => {
                                  e.preventDefault();
                                  try {
                                    await ContactService.inviteContact({ phoneNumber: contact.phone });
                                    toast.success(`Invitation SMS sent to ${contact.name}!`);
                                  } catch (err) {
                                    toast.error("Failed to send invitation SMS");
                                  }
                                }}
                                className="px-3.5 py-1.5 rounded-full bg-[#EEF2FF] hover:bg-[#3B58F5] text-[#3B58F5] hover:text-white text-[12px] font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1"
                              >
                                <span>Invite</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Middle Panel - Empty State */}
      <div className="hidden flex-1 flex-col items-center justify-center bg-white md:flex">
        <div className="flex flex-col items-center text-center p-8 max-w-sm">
          <div className="mb-6 flex flex-col items-center justify-center h-32 w-32 rounded-xl bg-[#3B58F5] text-white shadow-lg shadow-blue-500/20">
            <UserPlus className="h-10 w-10 mb-2" strokeWidth={2} />
            <span className="text-[13px] font-semibold">{t("add_contact")}</span>
          </div>
          <p className="text-[15px] font-medium text-slate-500 leading-relaxed mb-8">
            {t("add_contact_desc")}
          </p>
          <button
            onClick={() => setIsAddContactPanelOpen(true)}
            className="rounded-full bg-[#1D2A54] px-6 py-2.5 text-[14px] font-bold text-white transition-colors hover:bg-[#2A3F7A]"
          >
            {t("add_number")}
          </button>
        </div>
      </div>

      {/* Right Panel - Add Contact Form */}
      {isAddContactPanelOpen && (
        <div className="hidden h-full w-[380px] flex-col border-l border-[#E6EAFA] bg-white lg:flex shrink-0 animate-in slide-in-from-right duration-200">
          <div className="flex items-center gap-4 border-b border-[#E6EAFA] px-6 py-5">
            <button
              onClick={() => setIsAddContactPanelOpen(false)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-[16px] font-bold text-slate-800">{t("new_contact")}</h2>
          </div>

          <div className="p-6">
            <form onSubmit={handleAddContact} className="flex flex-col gap-6">
              <div className="flex items-end gap-3">
                <User className="h-5 w-5 text-[#3B58F5] mb-2 shrink-0" />
                <div className="flex-1 border-b border-slate-300 pb-2">
                  <input
                    type="text"
                    placeholder={t("first_name")}
                    value={newContactFirstName}
                    onChange={(e) => setNewContactFirstName(e.target.value)}
                    className="w-full text-[14px] font-medium text-slate-900 placeholder-slate-400 focus:outline-none bg-transparent"
                    required
                  />
                </div>
              </div>

              <div className="flex items-end gap-3 ml-8">
                <div className="flex-1 border-b border-slate-300 pb-2">
                  <input
                    type="text"
                    placeholder={t("last_name")}
                    value={newContactLastName}
                    onChange={(e) => setNewContactLastName(e.target.value)}
                    className="w-full text-[14px] font-medium text-slate-900 placeholder-slate-400 focus:outline-none bg-transparent"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-[13px] font-bold text-slate-500 mb-3 ml-8">
                  {t("phone_number")}
                </label>
                <div className="ml-8">
                  <PhoneInput
                    international
                    defaultCountry="US"
                    value={newContactPhone}
                    onChange={setNewContactPhone}
                    className="flex w-full gap-3"
                    numberInputProps={{
                      className:
                        "flex-1 rounded-xl border border-slate-200 px-4 py-3 text-[14px] font-medium text-slate-900 focus:border-[#3B58F5] focus:outline-none focus:ring-1 focus:ring-[#3B58F5] transition-colors",
                    }}
                  />
                </div>
              </div>

              {addContactError && (
                <div className="rounded-lg bg-red-50 p-3 mt-2 ml-8">
                  <p className="text-[13px] font-medium text-red-600">{addContactError}</p>
                </div>
              )}

              <div className="mt-8 flex justify-center">
                <button
                  type="submit"
                  disabled={isAddingContact}
                  className="rounded-full bg-[#3B58F5] px-10 py-2.5 text-[14px] font-bold text-white transition-colors hover:bg-[#2A41C7] disabled:opacity-70 flex items-center gap-2"
                >
                  {isAddingContact && (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  )}
                  {isAddingContact ? tCommon("saving") : t("save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ExploreBusinessesModal isOpen={isExploreOpen} onClose={() => setIsExploreOpen(false)} />
    </div>
  );
}
