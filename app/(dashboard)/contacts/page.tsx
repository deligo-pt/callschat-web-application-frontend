"use client";

import React, { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Search,
  Users,
  Video,
  Phone,
  MessageSquare,
  UserPlus,
  Heart,
  Loader2,
  X,
  Star,
  Building2,
  Lock,
  ShieldCheck,
  ArrowUpRight,
  User,
  Plus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { chatService } from "@/services/chat.service";
import { useContacts, type Contact } from "@/hooks/useContacts";
import { ExploreBusinessesModal } from "@/components/business/ExploreBusinessesModal";
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

  // Filter tab state
  const [filterTab, setFilterTab] = useState<"all" | "favorites" | "invitable">("all");

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

  // Filtered contacts based on active filter tab
  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      if (filterTab === "favorites") return contact.isFavourite;
      if (filterTab === "invitable") return contact.isUnregistered;
      return true;
    });
  }, [contacts, filterTab]);

  // Group filtered contacts by first letter
  const groupedContacts = useMemo(() => {
    return filteredContacts.reduce((acc, contact) => {
      const letter = (contact.name || "Unknown").charAt(0).toUpperCase();
      const safeLetter = /[A-Z]/.test(letter) ? letter : "#";
      if (!acc[safeLetter]) {
        acc[safeLetter] = [];
      }
      acc[safeLetter].push(contact);
      return acc;
    }, {} as Record<string, Contact[]>);
  }, [filteredContacts]);

  const sortedLetters = useMemo(() => {
    return Object.keys(groupedContacts).sort((a, b) => {
      if (a === "#") return 1;
      if (b === "#") return -1;
      return a.localeCompare(b);
    });
  }, [groupedContacts]);

  const isQuerying = Boolean(searchQuery.trim());
  const favoriteCount = useMemo(() => contacts.filter((c) => c.isFavourite).length, [contacts]);
  const invitableCount = useMemo(() => contacts.filter((c) => c.isUnregistered).length, [contacts]);

  return (
    <div className="flex h-full w-full bg-white dark:bg-[#111B21] overflow-hidden">
      {/* ── Left Sidebar Panel ────────────────────────────────────────────── */}
      <div className="flex h-full w-full flex-col border-r border-[#E2E8F0] dark:border-[#222D34] bg-white dark:bg-[#111B21] md:w-[380px] shrink-0">
        
        {/* Top Header */}
        <div className="flex flex-col bg-white dark:bg-[#111B21] px-4 pt-4 pb-2 shrink-0 border-b border-[#E2E8F0]/60 dark:border-[#222D34]">
          <div className="flex items-center justify-between h-11">
            <h1 className="text-[22px] font-bold text-[#111B21] dark:text-[#E9EDEF] tracking-tight">
              {tNav("contacts")}
            </h1>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsAddContactPanelOpen(true)}
                title="Add New Contact"
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#54656F] dark:text-[#AEBAC1] hover:bg-[#F0F2F5] dark:hover:bg-[#202C33] transition-colors cursor-pointer"
              >
                <Plus className="h-5 w-5" />
              </button>
              <Link
                href="/chats/favorites"
                title="Favorite Messages"
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#54656F] dark:text-[#AEBAC1] hover:bg-[#F0F2F5] dark:hover:bg-[#202C33] transition-colors"
              >
                <Heart className="h-4.5 w-4.5 fill-red-500 text-red-500" />
              </Link>
              <NotificationDropdown />
            </div>
          </div>

          {/* Capsule Search Bar */}
          <div className="mt-3 relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8696A0]" />
            <input
              type="text"
              placeholder="Search contacts, @usernames, or phones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-[38px] w-full rounded-xl bg-[#F0F2F5] dark:bg-[#202C33] pl-10 pr-9 text-[13.5px] font-normal text-[#111B21] dark:text-[#E9EDEF] placeholder-[#8696A0] focus:outline-none focus:ring-1 focus:ring-[#00A884] border border-transparent transition-all"
            />
            {isSearching ? (
              <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#00A884]" />
            ) : searchQuery ? (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8696A0] hover:text-[#111B21] dark:hover:text-[#E9EDEF] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          {/* Filter Pills (All / Favorites / Invitable) */}
          {!isQuerying && (
            <div className="flex items-center gap-1.5 mt-3 pb-1 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setFilterTab("all")}
                className={cn(
                  "px-3 py-1 rounded-full text-[12.5px] font-medium transition-all cursor-pointer shrink-0",
                  filterTab === "all"
                    ? "bg-[#00A884] text-white shadow-xs font-semibold"
                    : "bg-[#F0F2F5] dark:bg-[#202C33] text-[#54656F] dark:text-[#8696A0] hover:bg-[#E9EDEF] dark:hover:bg-[#2A3942]"
                )}
              >
                All ({contacts.length})
              </button>
              <button
                onClick={() => setFilterTab("favorites")}
                className={cn(
                  "flex items-center gap-1 px-3 py-1 rounded-full text-[12.5px] font-medium transition-all cursor-pointer shrink-0",
                  filterTab === "favorites"
                    ? "bg-[#00A884] text-white shadow-xs font-semibold"
                    : "bg-[#F0F2F5] dark:bg-[#202C33] text-[#54656F] dark:text-[#8696A0] hover:bg-[#E9EDEF] dark:hover:bg-[#2A3942]"
                )}
              >
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span>Favorites</span>
                {favoriteCount > 0 && <span className="opacity-80">({favoriteCount})</span>}
              </button>
              {invitableCount > 0 && (
                <button
                  onClick={() => setFilterTab("invitable")}
                  className={cn(
                    "px-3 py-1 rounded-full text-[12.5px] font-medium transition-all cursor-pointer shrink-0",
                    filterTab === "invitable"
                      ? "bg-[#00A884] text-white shadow-xs font-semibold"
                      : "bg-[#F0F2F5] dark:bg-[#202C33] text-[#54656F] dark:text-[#8696A0] hover:bg-[#E9EDEF] dark:hover:bg-[#2A3942]"
                  )}
                >
                  Invitable ({invitableCount})
                </button>
              )}
            </div>
          )}
        </div>

        {/* Scrollable Contacts List Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pb-20 md:pb-6">
          
          {/* Quick Action Rows (Shown when not searching and on 'All' tab) */}
          {!isQuerying && filterTab === "all" && (
            <div className="flex flex-col border-b border-[#E2E8F0]/60 dark:border-[#222D34]">
              {/* New Contact Action */}
              <div
                onClick={() => setIsAddContactPanelOpen(true)}
                className="flex items-center gap-3.5 px-4 py-3 hover:bg-[#F0F2F5] dark:hover:bg-[#202C33] transition-colors cursor-pointer group"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#00A884] text-white shadow-xs group-hover:scale-105 transition-transform">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[14.5px] font-semibold text-[#111B21] dark:text-[#E9EDEF]">
                    New contact
                  </span>
                  <span className="text-[12px] text-[#667781] dark:text-[#8696A0]">
                    Add by phone number or username
                  </span>
                </div>
                <ArrowUpRight className="h-4 w-4 text-[#8696A0] group-hover:text-[#00A884] transition-colors" />
              </div>

              {/* Explore Businesses Action */}
              <div
                onClick={() => setIsExploreOpen(true)}
                className="flex items-center gap-3.5 px-4 py-3 hover:bg-[#F0F2F5] dark:hover:bg-[#202C33] transition-colors cursor-pointer group"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#6366F1] text-white shadow-xs group-hover:scale-105 transition-transform">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[14.5px] font-semibold text-[#111B21] dark:text-[#E9EDEF]">
                    Explore Businesses
                  </span>
                  <span className="text-[12px] text-[#667781] dark:text-[#8696A0]">
                    Discover official channels & accounts
                  </span>
                </div>
                <ArrowUpRight className="h-4 w-4 text-[#8696A0] group-hover:text-[#6366F1] transition-colors" />
              </div>
            </div>
          )}

          {/* Case 1: Backend Search Active */}
          {isQuerying ? (
            isSearching ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#00A884] mb-3" />
                <p className="text-[14px] font-medium text-[#8696A0]">Searching users & contacts...</p>
              </div>
            ) : searchResults.length === 0 && unregisteredSearchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="h-12 w-12 rounded-full bg-[#F0F2F5] dark:bg-[#202C33] flex items-center justify-center text-[#8696A0] mb-3">
                  <Search className="h-6 w-6" />
                </div>
                <p className="text-[14.5px] font-semibold text-[#111B21] dark:text-[#E9EDEF]">No users found</p>
                <p className="text-[12.5px] text-[#8696A0] mt-1 max-w-[240px]">
                  No results for &ldquo;{searchQuery}&rdquo;. Try searching with display name, @username, or phone number.
                </p>
              </div>
            ) : (
              <div className="flex flex-col">
                {/* 1. CallsChat Registered Users */}
                {searchResults.length > 0 && (
                  <div>
                    <div className="sticky top-0 z-10 bg-[#F0F2F5] dark:bg-[#182229] px-4 py-1.5 text-[11.5px] font-bold uppercase tracking-wider text-[#008069] dark:text-[#00A884] border-y border-[#E2E8F0]/60 dark:border-[#222D34]">
                      Users on CallsChat ({searchResults.length})
                    </div>
                    <div className="flex flex-col">
                      {searchResults.map((user) => (
                        <div
                          key={user.id}
                          className="group flex w-full items-center justify-between px-4 py-3 transition-colors hover:bg-[#F0F2F5] dark:hover:bg-[#202C33] cursor-pointer"
                        >
                          <div className="flex items-center gap-3.5 min-w-0 pr-2">
                            <div className="relative shrink-0">
                              <img
                                src={getOptimizedImageUrl(
                                  user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=00A884&color=fff`,
                                  52,
                                  52
                                )}
                                alt={user.displayName}
                                className="h-[44px] w-[44px] rounded-full object-cover bg-gray-100 dark:bg-gray-800"
                              />
                              {user.isOnline && (
                                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-[#25D366] border-2 border-white dark:border-[#111B21]" />
                              )}
                            </div>

                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-1.5">
                                <h3 className="text-[14.5px] font-semibold text-[#111B21] dark:text-[#E9EDEF] truncate">
                                  {user.displayName}
                                </h3>
                                {user.isContact && (
                                  <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-semibold rounded-md bg-[#00A884]/15 text-[#008069] dark:text-[#25D366]">
                                    Contact
                                  </span>
                                )}
                              </div>
                              <p className="text-[12px] font-normal text-[#667781] dark:text-[#8696A0] truncate">
                                {user.username ? `@${user.username}` : user.phone || "CallsChat User"}
                              </p>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartChat(user.id);
                              }}
                              title="Message"
                              className="flex h-8 w-8 items-center justify-center rounded-full text-[#54656F] dark:text-[#AEBAC1] hover:bg-[#00A884]/15 hover:text-[#008069] dark:hover:text-[#25D366] transition-colors cursor-pointer"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                initiateCall(user.id, "AUDIO", user.displayName, user.avatarUrl || undefined);
                              }}
                              title="Voice Call"
                              className="flex h-8 w-8 items-center justify-center rounded-full text-[#54656F] dark:text-[#AEBAC1] hover:bg-[#00A884]/15 hover:text-[#008069] dark:hover:text-[#25D366] transition-colors cursor-pointer"
                            >
                              <Phone className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                initiateCall(user.id, "VIDEO", user.displayName, user.avatarUrl || undefined);
                              }}
                              title="Video Call"
                              className="flex h-8 w-8 items-center justify-center rounded-full text-[#54656F] dark:text-[#AEBAC1] hover:bg-[#00A884]/15 hover:text-[#008069] dark:hover:text-[#25D366] transition-colors cursor-pointer"
                            >
                              <Video className="h-4 w-4" />
                            </button>
                            {!user.isContact && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddUserAsContact(user);
                                }}
                                disabled={addingContactId === user.id}
                                title="Add to Contacts"
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00A884] text-white hover:bg-[#008069] transition-colors cursor-pointer disabled:opacity-50"
                              >
                                {addingContactId === user.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <UserPlus className="h-3.5 w-3.5" />
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
                    <div className="sticky top-0 z-10 bg-[#F0F2F5] dark:bg-[#182229] px-4 py-1.5 text-[11.5px] font-bold uppercase tracking-wider text-[#008069] dark:text-[#00A884] border-y border-[#E2E8F0]/60 dark:border-[#222D34]">
                      Invitable Contacts ({unregisteredSearchResults.length})
                    </div>
                    <div className="flex flex-col">
                      {unregisteredSearchResults.map((contact) => (
                        <div
                          key={contact.id}
                          className="group flex w-full items-center justify-between px-4 py-3 transition-colors hover:bg-[#F0F2F5] dark:hover:bg-[#202C33]"
                        >
                          <div className="flex items-center gap-3.5 min-w-0 pr-2">
                            <div className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full bg-[#00A884]/20 text-[#008069] dark:text-[#25D366] font-bold text-[15px]">
                              {(contact.name || "U").charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <h3 className="text-[14.5px] font-semibold text-[#111B21] dark:text-[#E9EDEF] truncate">
                                {contact.name}
                              </h3>
                              <p className="text-[12px] font-normal text-[#667781] dark:text-[#8696A0] truncate">
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
                            className="px-3.5 py-1.5 rounded-full bg-[#00A884]/15 hover:bg-[#00A884] text-[#008069] dark:text-[#25D366] hover:text-white text-[12px] font-semibold transition-all shadow-xs active:scale-95 cursor-pointer"
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
            <div className="flex items-center justify-center py-16">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#00A884] border-t-transparent" />
            </div>
          ) : sortedLetters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="h-12 w-12 rounded-full bg-[#F0F2F5] dark:bg-[#202C33] flex items-center justify-center text-[#8696A0] mb-3">
                <Users className="h-6 w-6" />
              </div>
              <p className="text-[14.5px] font-semibold text-[#111B21] dark:text-[#E9EDEF]">
                {filterTab === "favorites" ? "No favorite contacts" : t("no_contacts")}
              </p>
              <p className="text-[12.5px] text-[#8696A0] mt-1 max-w-xs">
                {filterTab === "favorites"
                  ? "Star your most frequent contacts to easily access them here."
                  : "Add phone numbers or search users to start connecting."}
              </p>
              {filterTab === "all" && (
                <button
                  onClick={() => setIsAddContactPanelOpen(true)}
                  className="mt-4 px-4 py-2 rounded-full bg-[#00A884] hover:bg-[#008069] text-white text-[13px] font-semibold transition-colors cursor-pointer"
                >
                  Add Contact
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col">
              {sortedLetters.map((letter) => (
                <div key={letter}>
                  {/* Alphabet Sticky Header */}
                  <div className="sticky top-0 z-10 bg-[#F0F2F5] dark:bg-[#182229] px-4 py-1 text-[11.5px] font-bold uppercase tracking-wider text-[#008069] dark:text-[#00A884] border-y border-[#E2E8F0]/60 dark:border-[#222D34]">
                    {letter}
                  </div>

                  {/* Contacts under this letter */}
                  <div className="flex flex-col">
                    {groupedContacts[letter].map((contact) => {
                      const avatarUrl =
                        contact.avatarUrl ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}&background=00A884&color=fff`;

                      return (
                        <div
                          key={contact.id}
                          onClick={() => {
                            if (!contact.isUnregistered && contact.userId) {
                              handleStartChat(contact.userId);
                            }
                          }}
                          className="group relative flex w-full items-center justify-between px-4 py-2.5 transition-colors hover:bg-[#F0F2F5] dark:hover:bg-[#202C33] cursor-pointer"
                        >
                          <div className="flex items-center gap-3.5 min-w-0 pr-2">
                            <div className="relative shrink-0">
                              <img
                                src={getOptimizedImageUrl(avatarUrl, 52, 52)}
                                alt={contact.name}
                                className="h-[44px] w-[44px] rounded-full object-cover bg-gray-100 dark:bg-gray-800"
                              />
                              {contact.isOnline && (
                                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-[#25D366] border-2 border-white dark:border-[#111B21]" />
                              )}
                            </div>

                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-1.5">
                                <h3 className="text-[14.5px] font-semibold text-[#111B21] dark:text-[#E9EDEF] truncate">
                                  {contact.name}
                                </h3>
                                {contact.isFavourite && (
                                  <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
                                )}
                              </div>
                              <p className="text-[12px] font-normal text-[#667781] dark:text-[#8696A0] truncate">
                                {contact.phone}
                              </p>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1 shrink-0">
                            {!contact.isUnregistered ? (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleFavourite(contact.id, contact.isFavourite);
                                  }}
                                  title={contact.isFavourite ? "Remove from Favorites" : "Add to Favorites"}
                                  className="flex h-8 w-8 items-center justify-center rounded-full text-[#54656F] dark:text-[#AEBAC1] hover:bg-[#00A884]/15 hover:text-amber-500 transition-colors cursor-pointer"
                                >
                                  <Star
                                    className={cn(
                                      "h-4 w-4",
                                      contact.isFavourite
                                        ? "fill-amber-400 text-amber-400"
                                        : "text-[#8696A0] group-hover:opacity-100 opacity-60"
                                    )}
                                  />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartChat(contact.userId);
                                  }}
                                  title="Message"
                                  className="hidden group-hover:flex h-8 w-8 items-center justify-center rounded-full text-[#54656F] dark:text-[#AEBAC1] hover:bg-[#00A884]/15 hover:text-[#008069] dark:hover:text-[#25D366] transition-colors cursor-pointer"
                                >
                                  <MessageSquare className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    initiateCall(contact.userId, "AUDIO", contact.name, contact.avatarUrl || undefined);
                                  }}
                                  title="Voice Call"
                                  className="hidden group-hover:flex h-8 w-8 items-center justify-center rounded-full text-[#54656F] dark:text-[#AEBAC1] hover:bg-[#00A884]/15 hover:text-[#008069] dark:hover:text-[#25D366] transition-colors cursor-pointer"
                                >
                                  <Phone className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    initiateCall(contact.userId, "VIDEO", contact.name, contact.avatarUrl || undefined);
                                  }}
                                  title="Video Call"
                                  className="hidden group-hover:flex h-8 w-8 items-center justify-center rounded-full text-[#54656F] dark:text-[#AEBAC1] hover:bg-[#00A884]/15 hover:text-[#008069] dark:hover:text-[#25D366] transition-colors cursor-pointer"
                                >
                                  <Video className="h-4 w-4" />
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    await ContactService.inviteContact({ phoneNumber: contact.phone });
                                    toast.success(`Invitation SMS sent to ${contact.name}!`);
                                  } catch (err) {
                                    toast.error("Failed to send invitation SMS");
                                  }
                                }}
                                className="px-3 py-1 rounded-full bg-[#00A884]/15 hover:bg-[#00A884] text-[#008069] dark:text-[#25D366] hover:text-white text-[11.5px] font-semibold transition-all shadow-xs active:scale-95 cursor-pointer"
                              >
                                <span>Invite</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Middle/Main Standby Canvas (WhatsApp Web Design) ─────────────── */}
      <div className="hidden md:flex flex-1 flex-col items-center justify-center chat-canvas-bg relative p-8 select-none">
        <div className="relative z-10 flex flex-col items-center max-w-[460px] text-center bg-white/85 dark:bg-[#202C33]/85 backdrop-blur-md p-8 rounded-3xl border border-white/60 dark:border-white/10 shadow-xl">
          
          {/* Animated Hero Graphic */}
          <div className="relative mb-6">
            <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-[#00A884] to-[#25D366] flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 animate-in zoom-in duration-300">
              <Users className="h-9 w-9" />
            </div>
            <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-white dark:bg-[#111B21] flex items-center justify-center shadow-md">
              <ShieldCheck className="h-5 w-5 text-[#00A884]" />
            </div>
          </div>

          <h2 className="text-[24px] font-bold text-[#111B21] dark:text-[#E9EDEF] tracking-tight mb-2">
            CallsChat Contacts
          </h2>
          <p className="text-[14px] text-[#54656F] dark:text-[#8696A0] leading-relaxed mb-8">
            Manage your address book, find friends, and connect with instant audio or video calls.
          </p>

          {/* Action Triggers */}
          <div className="flex flex-wrap justify-center gap-3 w-full mb-6">
            <button
              onClick={() => setIsAddContactPanelOpen(true)}
              className="flex-1 min-w-[170px] flex items-center justify-center gap-2 bg-[#00A884] hover:bg-[#008069] text-white px-5 py-3 rounded-2xl font-semibold text-[14px] shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <UserPlus className="h-4.5 w-4.5" />
              <span>{t("add_number")}</span>
            </button>
            <button
              onClick={() => setIsExploreOpen(true)}
              className="flex-1 min-w-[170px] flex items-center justify-center gap-2 bg-white dark:bg-[#2A3942] border border-[#E2E8F0] dark:border-[#374248] hover:bg-[#F0F2F5] dark:hover:bg-[#323D45] text-[#111B21] dark:text-[#E9EDEF] px-5 py-3 rounded-2xl font-semibold text-[14px] shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Building2 className="h-4.5 w-4.5 text-[#00A884]" />
              <span>Explore Businesses</span>
            </button>
          </div>

          {/* Encryption Guarantee Footer */}
          <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#667781] dark:text-[#8696A0] bg-[#00A884]/10 dark:bg-[#00A884]/15 px-3 py-1.5 rounded-full">
            <Lock className="h-3.5 w-3.5 text-[#00A884]" />
            <span>End-to-end encrypted contacts & communications</span>
          </div>
        </div>
      </div>

      {/* ── Right Slide-Over Panel: Add Contact Form ──────────────────────── */}
      {isAddContactPanelOpen && (
        <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[400px] flex-col border-l border-[#E2E8F0] dark:border-[#222D34] bg-white dark:bg-[#111B21] shadow-2xl animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-[#E2E8F0] dark:border-[#222D34] px-6 py-5 bg-[#F0F2F5]/60 dark:bg-[#202C33]/60 backdrop-blur-md">
            <button
              onClick={() => setIsAddContactPanelOpen(false)}
              className="rounded-full p-1.5 text-[#8696A0] hover:text-[#111B21] dark:hover:text-[#E9EDEF] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-[17px] font-bold text-[#111B21] dark:text-[#E9EDEF] tracking-tight">
              {t("new_contact")}
            </h2>
          </div>

          {/* Form */}
          <div className="flex-1 overflow-y-auto p-6">
            <form onSubmit={handleAddContact} className="flex flex-col gap-6">
              
              {/* First Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-[#667781] dark:text-[#8696A0] uppercase tracking-wider">
                  {t("first_name")}
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8696A0]" />
                  <input
                    type="text"
                    placeholder="Enter first name"
                    value={newContactFirstName}
                    onChange={(e) => setNewContactFirstName(e.target.value)}
                    className="w-full rounded-xl bg-[#F0F2F5] dark:bg-[#202C33] pl-10 pr-4 py-2.5 text-[14px] text-[#111B21] dark:text-[#E9EDEF] placeholder-[#8696A0] border border-transparent focus:border-[#00A884] focus:outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Last Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-[#667781] dark:text-[#8696A0] uppercase tracking-wider">
                  {t("last_name")}
                </label>
                <input
                  type="text"
                  placeholder="Enter last name (optional)"
                  value={newContactLastName}
                  onChange={(e) => setNewContactLastName(e.target.value)}
                  className="w-full rounded-xl bg-[#F0F2F5] dark:bg-[#202C33] px-4 py-2.5 text-[14px] text-[#111B21] dark:text-[#E9EDEF] placeholder-[#8696A0] border border-transparent focus:border-[#00A884] focus:outline-none transition-all"
                />
              </div>

              {/* Phone Number */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-[#667781] dark:text-[#8696A0] uppercase tracking-wider">
                  {t("phone_number")}
                </label>
                <div className="whatsapp-phone-input">
                  <PhoneInput
                    international
                    defaultCountry="US"
                    value={newContactPhone}
                    onChange={setNewContactPhone}
                    className="flex w-full gap-3"
                    numberInputProps={{
                      className:
                        "flex-1 rounded-xl bg-[#F0F2F5] dark:bg-[#202C33] px-4 py-2.5 text-[14px] text-[#111B21] dark:text-[#E9EDEF] placeholder-[#8696A0] border border-transparent focus:border-[#00A884] focus:outline-none transition-all",
                    }}
                  />
                </div>
              </div>

              {addContactError && (
                <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 p-3">
                  <p className="text-[13px] font-medium text-red-600 dark:text-red-400">{addContactError}</p>
                </div>
              )}

              {/* Save CTA */}
              <div className="mt-4 flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={isAddingContact}
                  className="w-full rounded-full bg-[#00A884] hover:bg-[#008069] py-3 text-[14px] font-bold text-white transition-all shadow-sm active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isAddingContact && (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  )}
                  {isAddingContact ? tCommon("saving") : t("save")}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddContactPanelOpen(false)}
                  className="w-full rounded-full bg-transparent hover:bg-black/5 dark:hover:bg-white/5 py-2.5 text-[13.5px] font-semibold text-[#667781] dark:text-[#8696A0] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Explore Businesses Modal */}
      <ExploreBusinessesModal isOpen={isExploreOpen} onClose={() => setIsExploreOpen(false)} />
    </div>
  );
}
