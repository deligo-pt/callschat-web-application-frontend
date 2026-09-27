"use client";

import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Users, Search, Shield, Check, X, ShieldAlert, CheckCircle2, Loader2, Star, Camera, Heart, Lock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { groupService } from "@/services/group.service";
import { chatService } from "@/services/chat.service";
import { useContacts } from "@/hooks/useContacts";
import { generateGroupKey, encryptMessage } from "@/utils/crypto";
import { getUserPrivateKey, storeGroupKey } from "@/utils/keyStore";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { useGroupStore } from "@/hooks/useGroupStore";
import { getOptimizedImageUrl } from "@/utils/image";

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
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { contacts: rawContacts, isLoading: isLoadingContacts } = useContacts();

  const contacts: Contact[] = rawContacts.map((c, index) => ({
    id: c.userId,
    name: c.name,
    phone: c.phone,
    initials: c.name.slice(0, 2).toUpperCase(),
    color: COLORS[index % COLORS.length],
    avatarUrl: c.avatarUrl || undefined,
  }));

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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
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

      let myPrivKey = await getUserPrivateKey(myUserId);
      
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
          pubKey = res.data[0].publicKey;
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

      let finalAvatarUrl = groupRes.data.avatarUrl || null;
      // If an avatar file was selected, upload and update the group!
      if (avatarFile && groupRes.data.id) {
        try {
          const uploadRes = await groupService.uploadGroupMedia(groupRes.data.id, avatarFile);
          if (uploadRes.success && uploadRes.data?.mediaUrl) {
            finalAvatarUrl = uploadRes.data.mediaUrl;
            await groupService.updateGroup(groupRes.data.id, { avatarUrl: finalAvatarUrl });
          }
        } catch (uploadErr) {
          console.error("Failed to upload group avatar during creation:", uploadErr);
        }
      }

      // Store symmetric group key in IndexedDB
      if (groupRes.data.id && myUserId) {
        await storeGroupKey(groupRes.data.id, myUserId, plaintextGroupKey);
      }

      // Add to store instantly & trigger background sync
      useGroupStore.getState().addGroup({
        ...groupRes.data,
        avatarUrl: finalAvatarUrl,
        memberCount: selectedMembers.length + 1,
      });
      useGroupStore.getState().fetchGroups(true);

      // Redirect to groups list
      router.push(`/groups`);
    } catch (err) {
      console.error("Error creating group:", err);
      setIsCreating(false);
    }
  };

  return (
    <div className="flex h-full w-full bg-white dark:bg-[#111B21] overflow-hidden">
      {/* Left Panel (Wizard) */}
      <div className="flex h-full w-full flex-col border-r border-[#E2E8F0] dark:border-[#222D34] bg-white dark:bg-[#111B21] md:w-[380px] lg:w-[420px] shrink-0">
        
        {/* Header */}
        <div className="flex flex-col px-4 pt-5 pb-3 border-b border-[#E2E8F0]/60 dark:border-[#222D34] shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <button 
                onClick={() => {
                  if (step > 1) handleBack();
                  else router.push('/groups');
                }} 
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#54656F] dark:text-[#8696A0] hover:bg-black/5 dark:hover:bg-white/10 hover:text-[#00A884] dark:hover:text-[#00A884] transition-colors cursor-pointer"
                title={step > 1 ? "Back" : "Cancel"}
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex flex-col">
                <h1 className="text-[20px] font-bold tracking-tight text-[#111B21] dark:text-[#E9EDEF]">New Group</h1>
                <span className="text-[11.5px] font-medium text-[#667781] dark:text-[#8696A0]">Step {step} of 3</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Link 
                href="/chats/favorites" 
                title="Favorites" 
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#F0F2F5] dark:hover:bg-[#202C33] text-[#54656F] dark:text-[#8696A0] hover:text-red-500 transition-colors focus:outline-none"
                aria-label="Favorites"
              >
                <Heart className="h-4.5 w-4.5" />
              </Link>
              <NotificationDropdown />
            </div>
          </div>
        </div>

        {/* Wizard Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col custom-scrollbar">
          {step === 1 && (
            <div className="flex flex-col items-center w-full animate-in fade-in duration-200">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative h-24 w-24 rounded-full cursor-pointer group flex items-center justify-center mb-2 shadow-md overflow-hidden bg-[#F0F2F5] dark:bg-[#202C33] border-2 border-dashed border-[#CBD5E1] dark:border-[#374248] hover:border-[#00A884] transition-all"
                title="Click to upload group photo"
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Group Preview" className="h-full w-full object-cover" />
                ) : (
                  <Users className="h-10 w-10 text-[#8696A0]" />
                )}
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[11px] font-semibold pointer-events-none">
                  <Camera className="h-5 w-5 mb-0.5" />
                  Upload
                </div>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[12.5px] font-semibold text-[#00A884] hover:underline mb-5 cursor-pointer"
              >
                {avatarPreview ? "Change Photo" : "Add Group Photo"}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
              />

              <div className="w-full space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-[#111B21] dark:text-[#E9EDEF]">Group Subject *</label>
                  <input
                    type="text"
                    placeholder="Enter group subject..."
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="h-11 w-full rounded-xl border border-[#E2E8F0] dark:border-[#2A3942] bg-[#F0F2F5] dark:bg-[#202C33] px-3.5 text-[14px] text-[#111B21] dark:text-[#E9EDEF] placeholder-[#8696A0] focus:border-[#00A884] focus:outline-none transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-[#111B21] dark:text-[#E9EDEF]">Description (Optional)</label>
                  <textarea
                    placeholder="Provide a description for this group..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-[#E2E8F0] dark:border-[#2A3942] bg-[#F0F2F5] dark:bg-[#202C33] p-3 text-[14px] text-[#111B21] dark:text-[#E9EDEF] placeholder-[#8696A0] focus:border-[#00A884] focus:outline-none transition-all resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col items-center w-full animate-in fade-in duration-200 h-full">
              <div className="w-full flex flex-col flex-1 min-h-0">
                <div className="relative mb-3 shrink-0">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8696A0]" />
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-10 rounded-xl bg-[#F0F2F5] dark:bg-[#202C33] pl-10 pr-4 text-[13.5px] text-[#111B21] dark:text-[#E9EDEF] placeholder-[#8696A0] focus:outline-none transition-colors"
                  />
                </div>
                
                {selectedMembers.length > 0 && (
                  <div className="flex items-center justify-between bg-[#00A884]/10 dark:bg-[#00A884]/15 rounded-xl px-3.5 py-2 mb-2.5 shrink-0">
                    <span className="text-[12px] font-semibold text-[#008069] dark:text-[#25D366]">
                      {selectedMembers.length} {selectedMembers.length === 1 ? "member" : "members"} selected
                    </span>
                    <button
                      onClick={() => setSelectedMembers([])}
                      className="text-[11.5px] font-semibold text-[#008069] dark:text-[#25D366] hover:underline cursor-pointer"
                    >
                      Clear all
                    </button>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
                  {isLoadingContacts ? (
                    <div className="flex w-full items-center justify-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin text-[#00A884]" />
                    </div>
                  ) : filteredContacts.length === 0 ? (
                    <div className="flex w-full justify-center py-8">
                      <p className="text-[13px] text-[#8696A0]">No contacts found.</p>
                    </div>
                  ) : (
                    filteredContacts.map((contact) => {
                      const isSelected = selectedMembers.includes(contact.id);
                      return (
                        <div
                          key={contact.id}
                          onClick={() => toggleMember(contact.id)}
                          className={cn(
                            "flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors",
                            isSelected 
                              ? "bg-[#00A884]/10 dark:bg-[#00A884]/15" 
                              : "hover:bg-[#F0F2F5] dark:hover:bg-[#202C33]"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            {contact.avatarUrl ? (
                              <img src={getOptimizedImageUrl(contact.avatarUrl)} className="h-10 w-10 rounded-full object-cover bg-slate-100 dark:bg-slate-800" />
                            ) : (
                              <div className={cn("h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-[13px]", contact.color)}>
                                {contact.initials}
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="text-[14px] font-semibold text-[#111B21] dark:text-[#E9EDEF]">{contact.name}</span>
                              {contact.phone && <span className="text-[11.5px] text-[#667781] dark:text-[#8696A0]">{contact.phone}</span>}
                            </div>
                          </div>
                          <div className={cn(
                            "h-[22px] w-[22px] rounded-full border flex items-center justify-center transition-colors shrink-0",
                            isSelected ? "bg-[#00A884] border-[#00A884]" : "border-[#CBD5E1] dark:border-[#374248]"
                          )}>
                            {isSelected && <Check className="h-3.5 w-3.5 text-white stroke-[3]" />}
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
            <div className="flex flex-col items-center w-full animate-in fade-in duration-200 pb-4">
              <div className="w-full space-y-4">
                {/* Privacy Toggle */}
                <div className="bg-[#00A884]/10 dark:bg-[#00A884]/15 rounded-2xl p-4 border border-[#00A884]/20">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-[#00A884] dark:text-[#25D366] shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-[13.5px] font-semibold text-[#111B21] dark:text-[#E9EDEF]">End-to-End Privacy Protection</h3>
                      <p className="text-[11.5px] text-[#667781] dark:text-[#8696A0] mt-1 leading-relaxed">
                        Messages and calls are secured with group symmetric keys. Only authorized members can decrypt content.
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-start mt-3 ml-8">
                    <button
                      onClick={() => setPrivacyEnabled(!privacyEnabled)}
                      className={cn(
                        "relative h-6 w-11 rounded-full transition-colors cursor-pointer",
                        privacyEnabled ? "bg-[#00A884]" : "bg-slate-300 dark:bg-slate-700"
                      )}
                    >
                      <div
                        className={cn(
                          "absolute top-[2px] left-[2px] h-5 w-5 rounded-full bg-white transition-transform shadow-xs",
                          privacyEnabled ? "translate-x-5" : "translate-x-0"
                        )}
                      />
                    </button>
                  </div>
                </div>

                {/* Info Cards */}
                <div className="flex flex-col gap-2.5">
                  <h4 className="text-[12px] font-semibold text-[#111B21] dark:text-[#E9EDEF]">Group security properties:</h4>
                  
                  <div className="flex items-center gap-3 bg-[#F0FDF4] dark:bg-emerald-950/20 border border-[#DCFCE7] dark:border-emerald-900/30 rounded-xl p-3">
                    <CheckCircle2 className="h-4 w-4 text-[#16A34A] dark:text-[#25D366] shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-[12px] font-semibold text-[#166534] dark:text-[#25D366]">E2EE Group Keys</span>
                      <span className="text-[11px] text-[#166534]/70 dark:text-emerald-400/70">Generated and encrypted uniquely per member</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-[#F0FDF4] dark:bg-emerald-950/20 border border-[#DCFCE7] dark:border-emerald-900/30 rounded-xl p-3">
                    <CheckCircle2 className="h-4 w-4 text-[#16A34A] dark:text-[#25D366] shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-[12px] font-semibold text-[#166534] dark:text-[#25D366]">Group Calls & Media</span>
                      <span className="text-[11px] text-[#166534]/70 dark:text-emerald-400/70">Encrypted audio, video, and attachments</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-[#FFF8E7] dark:bg-[#202C33] border border-[#FFE8A3] dark:border-[#2A3942] rounded-xl p-3">
                    <Shield className="h-4 w-4 text-[#D97706] dark:text-[#FFB020] shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-[12px] font-semibold text-[#854D0E] dark:text-[#FFB020]">You are the Group Admin</span>
                      <span className="text-[11px] text-[#854D0E]/80 dark:text-amber-300/70 leading-relaxed">
                        You can manage members, re-sync keys, and configure group settings at any time.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 pb-6 pt-2 bg-white dark:bg-[#111B21] border-t border-[#E2E8F0]/60 dark:border-[#222D34] shrink-0">
          <button
            onClick={() => {
              if (step < 3) handleNext();
              else handleCreateGroup();
            }}
            disabled={
              (step === 1 && !groupName.trim()) || 
              isCreating
            }
            className={cn(
              "w-full flex items-center justify-center py-3 rounded-2xl font-semibold text-[14px] transition-all cursor-pointer shadow-xs",
              ((step === 1 && !groupName.trim()) || isCreating)
                ? "bg-[#E2E8F0] dark:bg-[#202C33] text-[#8696A0] cursor-not-allowed"
                : "bg-[#00A884] hover:bg-[#008069] text-white hover:scale-[1.01] active:scale-[0.99]"
            )}
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Creating group & exchanging keys...
              </>
            ) : (
              <>
                {step === 3 ? "Create Group" : "Next"}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Right Content Area (WhatsApp E2EE Standby Canvas) */}
      <div className="hidden flex-1 flex-col items-center justify-center chat-canvas-bg md:flex w-full select-none p-8 relative">
        <div className="relative z-10 flex flex-col items-center max-w-[460px] text-center bg-white/80 dark:bg-[#202C33]/80 backdrop-blur-md p-8 rounded-3xl border border-white/60 dark:border-white/10 shadow-xl">
          <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-[#00A884] to-[#25D366] flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 mb-6 animate-in zoom-in duration-300">
            <Users className="h-9 w-9" />
          </div>
          
          <h2 className="text-[24px] font-bold text-[#111B21] dark:text-[#E9EDEF] mb-2 tracking-tight">Create a Group</h2>
          <p className="text-[14px] text-[#54656F] dark:text-[#8696A0] leading-relaxed mb-6">
            Bring your friends, family, or teammates together. All group communications are private and secure.
          </p>

          <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#667781] dark:text-[#8696A0] bg-[#00A884]/10 dark:bg-[#00A884]/15 px-3 py-1.5 rounded-full">
            <Lock className="h-3.5 w-3.5 text-[#00A884]" />
            <span>End-to-end encrypted group rooms</span>
          </div>
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
