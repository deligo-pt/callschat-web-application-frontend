"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Users, Search, Shield, Check, X, ShieldAlert, CheckCircle2, Loader2, Star } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { groupService } from "@/services/group.service";
import { chatService } from "@/services/chat.service";
import { generateGroupKey, encryptMessage } from "@/utils/crypto";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";

function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

interface Contact {
  id: string;
  name: string;
  phone: string;
  initials: string;
  color: string;
  avatarUrl?: string;
}

const COLORS = ["bg-blue-500", "bg-indigo-500", "bg-purple-500", "bg-pink-500", "bg-emerald-500"];

export default function CreateGroupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);

  // Step 1 State
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000/api/v1";
        const res = await fetch(`${baseUrl}/contacts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        const data = await res.json();
        
        let usersArray: any[] = [];
        if (data.success && Array.isArray(data.data)) {
          usersArray = data.data;
        } else if (Array.isArray(data)) {
          usersArray = data;
        } else if (data.data && Array.isArray(data.data.contacts)) {
          usersArray = data.data.contacts;
        }

        const mappedContacts = usersArray.map((u: any, index: number) => {
          const userProfile = u.addressee?.profile || u.contact?.profile || u.profile || {};
          const userId = u.addressee?.id || u.contact?.id || u.id;
          const displayName = u.customName || userProfile.displayName || userProfile.username || "Unknown";
          const phone = u.addressee?.phone || u.contact?.phone || userProfile.phone || "";
          
          return {
            id: userId,
            name: displayName,
            phone: phone,
            initials: displayName.slice(0, 2).toUpperCase(),
            color: COLORS[index % COLORS.length],
            avatarUrl: userProfile.avatarUrl,
          };
        });

        // Remove duplicates just in case
        const uniqueContacts = Array.from(new Map(mappedContacts.map(item => [item.id, item])).values());
        
        setContacts(uniqueContacts);
      } catch (error) {
        console.error("Failed to fetch contacts", error);
      } finally {
        setIsLoadingContacts(false);
      }
    };

    fetchContacts();
  }, []);

  // Step 2 State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  // Step 3 State
  const [privacyEnabled, setPrivacyEnabled] = useState(true);

  const handleNext = () => setStep((s) => Math.min(s + 1, 3));
  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const toggleMember = (id: string) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (c.phone && c.phone.includes(searchQuery))
  );

  const handleCreateGroup = async () => {
    setIsCreating(true);
    try {
      const token = localStorage.getItem("accessToken");
      let myUserId = "";
      if (token) {
        const decoded = parseJwt(token);
        if (decoded) myUserId = decoded.sub || decoded.id || "";
      }

      if (!myUserId) throw new Error("Could not identify current user");

      const myPrivKeyName = `privateKey_${myUserId}`;
      let myPrivKey = localStorage.getItem(myPrivKeyName) || localStorage.getItem("privateKey");
      
      if (!myPrivKey) throw new Error("Local private key missing");

      // 1. Generate the symmetric group key
      const plaintextGroupKey = await generateGroupKey();

      // 2. Fetch public keys for everyone (creator + selectedMembers)
      const allMembers = Array.from(new Set([myUserId, ...selectedMembers]));
      const keys = [];

      for (const userId of allMembers) {
        const res = await chatService.fetchRecipientKey(userId);
        let pubKey = "";
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          pubKey = res.data[res.data.length - 1].publicKey;
        } else if (res?.success && res?.data?.publicKey) {
          pubKey = res.data.publicKey;
        }

        if (pubKey) {
          // Encrypt group key for this user
          const { ciphertext, nonce } = await encryptMessage(plaintextGroupKey, pubKey, myPrivKey);
          keys.push({
            userId,
            encryptedGroupKey: ciphertext,
            keyNonce: nonce,
          });
        } else {
          console.warn(`Could not fetch public key for user ${userId}. They won't be able to decrypt the group.`);
        }
      }

      if (keys.length === 0) {
        throw new Error("Could not retrieve public keys for any members");
      }

      // Step 3: Create the group
      const groupRes = await groupService.createGroup({
        name: groupName,
        description: description || undefined,
        isPublic: false,
        maxMembers: 50,
        keys: keys,
      });

      if (!groupRes.success || !groupRes.data) {
        console.error("Failed to create group:", groupRes.error);
        setIsCreating(false);
        return;
      }

      // Redirect to groups list
      router.push(`/groups`);
    } catch (err) {
      console.error("Error creating group:", err);
      setIsCreating(false);
    }
  };

  return (
    <div className="flex h-full w-full bg-[#F8FAFC]">
      {/* Left Panel (Wizard) */}
      <div className="flex h-full w-full flex-col border-r border-[#E6EAFA] bg-white md:w-[350px] shrink-0">
        
        {/* Header */}
        <div className="flex flex-col px-6 pt-8 pb-4 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {step > 1 && (
                <button onClick={handleBack} className="text-slate-400 hover:text-blue-500 transition-colors">
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <h1 className="text-[24px] font-bold tracking-tight text-[#2563EB]">Groups</h1>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/chats/favorites" className="relative flex items-center justify-center p-2 transition-colors hover:bg-slate-50 rounded-full">
                <Star className="h-5 w-5 fill-[#F59E0B] text-[#F59E0B]" />
              </Link>
              <NotificationDropdown />
            </div>
          </div>
          
          <div className="mt-4 relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              disabled
              className="h-10 w-full rounded-full bg-[#EEF2FF] pl-10 pr-4 text-[13px] font-medium text-slate-800 placeholder-slate-400 focus:outline-none opacity-50 cursor-not-allowed"
            />
          </div>
        </div>

        {/* Wizard Content */}
        <div className="flex-1 overflow-y-auto px-6 py-2 flex flex-col scrollbar-hide">
          {step === 1 && (
            <div className="flex flex-col items-center w-full animate-in fade-in duration-300">
              <div className="h-[72px] w-[72px] bg-[#3B58F5] rounded-full flex items-center justify-center text-white mb-4 shadow-xl shadow-blue-500/20">
                <Users className="h-8 w-8" />
              </div>
              <h2 className="text-[18px] font-bold text-[#0F172A] mb-1">Group Details</h2>
              <p className="text-[12px] font-medium text-slate-500 mb-8">Give your group a name and description</p>

              <div className="w-full space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-700">Group Name *</label>
                  <input
                    type="text"
                    placeholder="Team Design"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="h-[42px] w-full rounded-xl border border-[#E6EAFA] bg-[#F8FAFC] px-4 text-[13px] font-medium text-slate-800 focus:border-[#2563EB] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2563EB]/20 transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-700">Description (Optional)</label>
                  <textarea
                    placeholder="What's this group about?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-[#E6EAFA] bg-[#F8FAFC] p-4 text-[13px] font-medium text-slate-800 focus:border-[#2563EB] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2563EB]/20 transition-all resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col items-center w-full animate-in fade-in duration-300 h-full">
              <h2 className="text-[18px] font-bold text-[#0F172A] mb-1">Add Members</h2>
              <p className="text-[12px] font-medium text-slate-500 mb-6">Select contacts to add to the group</p>

              <div className="w-full flex flex-col flex-1 min-h-0">
                <div className="relative mb-4 shrink-0">
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-10 rounded-xl border border-[#E6EAFA] bg-[#F8FAFC] px-4 text-[13px] focus:border-[#2563EB] focus:bg-white focus:outline-none transition-colors"
                  />
                </div>
                
                {selectedMembers.length > 0 ? (
                  <div className="flex items-center justify-between bg-[#EEF2FF] rounded-lg px-3 py-2 mb-2 shrink-0">
                    <span className="text-[11px] font-bold text-[#2563EB]">
                      {selectedMembers.length} members selected
                    </span>
                    <button
                      onClick={() => setSelectedMembers([])}
                      className="text-[11px] font-bold text-[#2563EB] hover:underline"
                    >
                      Clear all
                    </button>
                  </div>
                ) : (
                  <div className="mb-2 shrink-0 h-[32px]" /> // Spacer to prevent layout shift
                )}

                <div className="flex-1 overflow-y-auto scrollbar-hide space-y-1">
                  {isLoadingContacts ? (
                    <div className="flex w-full items-center justify-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin text-[#2563EB]" />
                    </div>
                  ) : filteredContacts.length === 0 ? (
                    <div className="flex w-full justify-center py-8">
                      <p className="text-[12px] text-slate-500">No contacts found.</p>
                    </div>
                  ) : (
                    filteredContacts.map((contact) => {
                      const isSelected = selectedMembers.includes(contact.id);
                      return (
                        <div
                          key={contact.id}
                          onClick={() => toggleMember(contact.id)}
                          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-[#E6EAFA]"
                        >
                          <div className="flex items-center gap-3">
                            {contact.avatarUrl ? (
                              <img src={contact.avatarUrl} className="h-9 w-9 rounded-full object-cover bg-slate-100" />
                            ) : (
                              <div className={cn("h-9 w-9 rounded-full flex items-center justify-center text-white font-bold text-[12px]", contact.color)}>
                                {contact.initials}
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="text-[13px] font-bold text-[#0F172A]">{contact.name}</span>
                              {contact.phone && <span className="text-[11px] font-medium text-slate-500">{contact.phone}</span>}
                            </div>
                          </div>
                          <div className={cn(
                            "h-[22px] w-[22px] rounded-full border flex items-center justify-center transition-colors shrink-0",
                            isSelected ? "bg-[#3B58F5] border-[#3B58F5]" : "border-[#CBD5E1]"
                          )}>
                            {isSelected && <Check className="h-3 w-3 text-white stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center w-full animate-in fade-in duration-300 pb-6">
              <h2 className="text-[18px] font-bold text-[#0F172A] mb-1 mt-4">Privacy Settings</h2>
              <p className="text-[12px] font-medium text-slate-500 mb-6">Configure member visibility</p>

              <div className="w-full space-y-5">
                {/* Privacy Toggle */}
                <div className="bg-[#EEF2FF] rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <LockIcon className="h-4 w-4 text-[#3B58F5] shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-[13px] font-bold text-[#1D2A54]">Enable Privacy Protection</h3>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        Hide member phone numbers from other group members. Only you (the admin) can see contact details.
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-start mt-3 ml-7">
                    <button
                      onClick={() => setPrivacyEnabled(!privacyEnabled)}
                      className={cn(
                        "relative h-6 w-11 rounded-full transition-colors",
                        privacyEnabled ? "bg-[#3B58F5]" : "bg-slate-300"
                      )}
                    >
                      <div
                        className={cn(
                          "absolute top-[2px] left-[2px] h-5 w-5 rounded-full bg-white transition-transform shadow-sm",
                          privacyEnabled ? "translate-x-5" : "translate-x-0"
                        )}
                      />
                    </button>
                  </div>
                </div>

                {/* Info Cards */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-[12px] font-bold text-[#0F172A]">What members will see:</h4>
                  
                  <div className="flex items-center gap-3 bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl p-3">
                    <Check className="h-4 w-4 text-[#16A34A] shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-[12px] font-bold text-[#166534]">Name & Profile Photo</span>
                      <span className="text-[11px] font-medium text-[#166534]/70">Visible to all group members</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl p-3">
                    <Check className="h-4 w-4 text-[#16A34A] shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-[12px] font-bold text-[#166534]">Messages</span>
                      <span className="text-[11px] font-medium text-[#166534]/70">All members can see group messages</span>
                    </div>
                  </div>

                  <div className={cn(
                    "flex items-center gap-3 rounded-xl p-3 border transition-colors",
                    privacyEnabled ? "bg-[#FEF2F2] border-[#FEE2E2]" : "bg-[#F0FDF4] border-[#DCFCE7]"
                  )}>
                    {privacyEnabled ? (
                      <X className="h-4 w-4 text-[#DC2626] shrink-0" />
                    ) : (
                      <Check className="h-4 w-4 text-[#16A34A] shrink-0" />
                    )}
                    <div className="flex flex-col">
                      <span className={cn("text-[12px] font-bold", privacyEnabled ? "text-[#991B1B]" : "text-[#166534]")}>
                        Phone Numbers {privacyEnabled ? "(Hidden)" : "(Visible)"}
                      </span>
                      <span className={cn("text-[11px] font-medium", privacyEnabled ? "text-[#991B1B]/70" : "text-[#166534]/70")}>
                        {privacyEnabled ? "Only you can see member phone numbers" : "Visible to all group members"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-[#FEFCE8] border border-[#FEF08A] rounded-xl p-3">
                    <div className="h-[14px] w-[14px] rounded-full border-[2px] border-[#CA8A04] shrink-0 opacity-70" />
                    <div className="flex flex-col">
                      <span className="text-[12px] font-bold text-[#854D0E]">You're the Admin</span>
                      <span className="text-[11px] font-medium text-[#854D0E]/70 leading-relaxed">
                        As the group creator, you'll have full access to member details and group management settings.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 pb-8 pt-2 bg-white shrink-0">
          <button
            onClick={() => {
              if (step < 3) handleNext();
              else handleCreateGroup();
            }}
            disabled={
              (step === 1 && !groupName.trim()) || 
              (step === 2 && selectedMembers.length === 0) ||
              isCreating
            }
            className={cn(
              "w-full flex items-center justify-center py-3 rounded-xl font-bold text-[13px] transition-colors",
              ((step === 1 && !groupName.trim()) || (step === 2 && selectedMembers.length === 0) || isCreating)
                ? "bg-[#E2E8F0] text-slate-400 cursor-not-allowed"
                : "bg-[#3B58F5] hover:bg-blue-700 text-white shadow-sm"
            )}
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Creating...
              </>
            ) : (
              <>
                {step === 3 ? "Create Group" : "Next >"}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Right Content Area (Empty State - Static) */}
      <div className="hidden flex-1 flex-col items-center justify-center bg-white md:flex w-full">
         <div className="flex flex-col items-center text-center max-w-sm">
            <div className="relative mb-8">
              <div className="h-[120px] w-[120px] rounded-full bg-[#EEF2FF] flex items-center justify-center border border-[#E0E7FF] shadow-2xl shadow-blue-500/10">
                <Users className="h-16 w-16 text-[#3B58F5]" strokeWidth={1.5} />
              </div>
            </div>
            
            <h2 className="text-[22px] font-bold text-[#0F172A] mb-3">No Groups Yet</h2>
            <p className="text-[13px] font-semibold text-[#1E293B] leading-relaxed max-w-[240px]">
              You haven't joined or created any<br />groups yet.
            </p>
         </div>
      </div>
    </div>
  );
}

// Custom lock icon to match the design
function LockIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
