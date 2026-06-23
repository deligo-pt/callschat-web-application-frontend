"use client";

import React, { useState } from "react";
import { ArrowLeft, Users, Search, Shield, Check, X, ShieldAlert, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Dummy data for contacts
const DUMMY_CONTACTS = [
  { id: "1", name: "Sarah Johnson", phone: "+1 (555) 123-4567", initials: "SJ", color: "bg-blue-500" },
  { id: "2", name: "Alex Chen", phone: "+1 (555) 234-5678", initials: "AC", color: "bg-blue-600" },
  { id: "3", name: "Emma Wilson", phone: "+1 (555) 345-6789", initials: "EW", color: "bg-indigo-500" },
  { id: "4", name: "Michael Smith", phone: "+1 (555) 456-7890", initials: "MS", color: "bg-blue-500" },
  { id: "5", name: "Lisa Anderson", phone: "+1 (555) 567-8901", initials: "LA", color: "bg-indigo-600" },
];

export default function CreateGroupPage() {
  const [step, setStep] = useState(1);

  // Step 1 State
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");

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

  const filteredContacts = DUMMY_CONTACTS.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full w-full flex-col items-center bg-[#F8FAFC] overflow-y-auto">
      {/* Wizard Container */}
      <div className="w-full max-w-2xl my-8 bg-white rounded-3xl shadow-sm border border-[#E6EAFA] overflow-hidden flex flex-col min-h-[700px]">
        
        {/* Header */}
        <div className="bg-[#3B58F5] text-white px-6 py-4 flex flex-col shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link href="/chats" className="rounded-full p-2 hover:bg-white/10 transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-[18px] font-bold">Create Group</h1>
            </div>
            <span className="text-[13px] font-medium text-white/80">Step {step}/3</span>
          </div>

          {/* Progress Bar */}
          <div className="flex gap-2 w-full">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-1 flex-1 rounded-full bg-white/20 overflow-hidden">
                <div
                  className={cn(
                    "h-full bg-white transition-all duration-300",
                    step >= i ? "w-full" : "w-0"
                  )}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col p-8 overflow-y-auto">
          {step === 1 && (
            <div className="flex flex-col items-center animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="h-20 w-20 bg-[#3B58F5] rounded-full flex items-center justify-center text-white mb-6 shadow-lg shadow-blue-500/30">
                <Users className="h-10 w-10" />
              </div>
              <h2 className="text-[22px] font-bold text-[#11142D] mb-2">Group Details</h2>
              <p className="text-[#8F95B2] text-[14px] mb-8">Give your group a name and description</p>

              <div className="w-full max-w-md space-y-6">
                <div>
                  <label className="block text-[13px] font-semibold text-[#1D2A54] mb-2">
                    Group Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Team Design"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full h-[48px] rounded-xl border border-[#E6EAFA] bg-[#F8FAFC] px-4 text-[14px] text-[#11142D] focus:border-[#3B58F5] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#3B58F5] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#1D2A54] mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    placeholder="What's this group about?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-[#E6EAFA] bg-[#F8FAFC] p-4 text-[14px] text-[#11142D] focus:border-[#3B58F5] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#3B58F5] transition-colors resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col items-center animate-in fade-in slide-in-from-right-4 duration-300 h-full">
              <h2 className="text-[22px] font-bold text-[#11142D] mb-2 mt-4">Add Members</h2>
              <p className="text-[#8F95B2] text-[14px] mb-8">Select contacts to add to the group</p>

              <div className="w-full max-w-md flex flex-col flex-1 min-h-0">
                {/* Search */}
                <div className="relative mb-6 shrink-0">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#8F95B2]" />
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-[48px] rounded-xl border border-[#E6EAFA] bg-[#F8FAFC] pl-12 pr-4 text-[14px] focus:border-[#3B58F5] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#3B58F5] transition-colors"
                  />
                </div>

                {/* Selection Header */}
                <div className="flex items-center justify-between bg-[#F4F6FC] rounded-lg px-4 py-3 mb-4 shrink-0">
                  <span className="text-[13px] font-medium text-[#1D2A54]">
                    {selectedMembers.length} members selected
                  </span>
                  {selectedMembers.length > 0 && (
                    <button
                      onClick={() => setSelectedMembers([])}
                      className="text-[13px] font-semibold text-[#3B58F5] hover:underline"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {/* Contacts List */}
                <div className="flex-1 overflow-y-auto space-y-1 scrollbar-hide pr-2 pb-4">
                  {filteredContacts.map((contact) => {
                    const isSelected = selectedMembers.includes(contact.id);
                    return (
                      <div
                        key={contact.id}
                        onClick={() => toggleMember(contact.id)}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-[#F8FAFC] cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn("h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold text-[14px]", contact.color)}>
                            {contact.initials}
                          </div>
                          <div>
                            <p className="text-[15px] font-bold text-[#1D2A54]">{contact.name}</p>
                            <p className="text-[12px] text-[#8F95B2]">{contact.phone}</p>
                          </div>
                        </div>
                        <div
                          className={cn(
                            "h-5 w-5 rounded-full border flex items-center justify-center transition-colors",
                            isSelected
                              ? "bg-[#3B58F5] border-[#3B58F5]"
                              : "border-[#D0D4E4]"
                          )}
                        >
                          {isSelected && <Check className="h-3 w-3 text-white stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="h-20 w-20 bg-[#3B58F5] rounded-full flex items-center justify-center text-white mb-6 shadow-lg shadow-blue-500/30">
                <Shield className="h-10 w-10" />
              </div>
              <h2 className="text-[22px] font-bold text-[#11142D] mb-2">Privacy Settings</h2>
              <p className="text-[#8F95B2] text-[14px] mb-8">Configure member visibility</p>

              <div className="w-full max-w-md space-y-6">
                {/* Privacy Toggle Card */}
                <div className="bg-[#F4F6FC] rounded-2xl p-5 border border-[#E6EAFA]">
                  <div className="flex items-start gap-3 mb-2">
                    <LockIcon className="h-5 w-5 text-[#3B58F5] shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-[15px] font-bold text-[#1D2A54]">Enable Privacy Protection</h3>
                      <p className="text-[13px] text-[#8F95B2] mt-1 leading-relaxed">
                        Hide member phone numbers from other group members. Only you (the admin) can see contact details.
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <button
                      onClick={() => setPrivacyEnabled(!privacyEnabled)}
                      className={cn(
                        "relative h-7 w-12 rounded-full transition-colors",
                        privacyEnabled ? "bg-[#3B58F5]" : "bg-[#D0D4E4]"
                      )}
                    >
                      <div
                        className={cn(
                          "absolute top-1 left-1 h-5 w-5 rounded-full bg-white transition-transform",
                          privacyEnabled ? "translate-x-5" : "translate-x-0"
                        )}
                      />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[14px] font-bold text-[#1D2A54]">What members will see:</h4>
                  
                  <div className="flex items-start gap-3 bg-[#EEFDF4] border border-[#BBF7D0] rounded-xl p-4">
                    <CheckCircle2 className="h-5 w-5 text-[#22C55E] shrink-0" />
                    <div>
                      <p className="text-[14px] font-bold text-[#166534]">Name & Profile Photo</p>
                      <p className="text-[12px] text-[#166534]/70">Visible to all group members</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-[#EEFDF4] border border-[#BBF7D0] rounded-xl p-4">
                    <CheckCircle2 className="h-5 w-5 text-[#22C55E] shrink-0" />
                    <div>
                      <p className="text-[14px] font-bold text-[#166534]">Messages</p>
                      <p className="text-[12px] text-[#166534]/70">All members can see group messages</p>
                    </div>
                  </div>

                  <div className={cn(
                    "flex items-start gap-3 rounded-xl p-4 border transition-colors",
                    privacyEnabled ? "bg-[#FEF2F2] border-[#FECACA]" : "bg-[#EEFDF4] border-[#BBF7D0]"
                  )}>
                    {privacyEnabled ? (
                      <X className="h-5 w-5 text-[#EF4444] shrink-0" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-[#22C55E] shrink-0" />
                    )}
                    <div>
                      <p className={cn("text-[14px] font-bold", privacyEnabled ? "text-[#991B1B]" : "text-[#166534]")}>
                        Phone Numbers {privacyEnabled ? "(Hidden)" : "(Visible)"}
                      </p>
                      <p className={cn("text-[12px]", privacyEnabled ? "text-[#991B1B]/70" : "text-[#166534]/70")}>
                        {privacyEnabled ? "Only you can see member phone numbers" : "Visible to all group members"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-[#FEFCE8] border border-[#FEF08A] rounded-xl p-4">
                    <ShieldAlert className="h-5 w-5 text-[#CA8A04] shrink-0" />
                    <div>
                      <p className="text-[14px] font-bold text-[#854D0E]">You're the Admin</p>
                      <p className="text-[12px] text-[#854D0E]/70 leading-relaxed">
                        As the group creator, you'll have full access to member details and group management settings.
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-[#E6EAFA] p-6 flex justify-between bg-white shrink-0">
          {step > 1 ? (
            <button
              onClick={handleBack}
              className="px-6 py-3 rounded-xl border border-[#E6EAFA] text-[#1D2A54] font-semibold text-[14px] hover:bg-[#F8FAFC] transition-colors"
            >
              Back
            </button>
          ) : (
            <div /> // Placeholder to push Next to the right
          )}
          
          <button
            onClick={() => {
              if (step < 3) handleNext();
              else console.log("Creating group...", { groupName, description, selectedMembers, privacyEnabled });
            }}
            disabled={(step === 1 && !groupName.trim()) || (step === 2 && selectedMembers.length === 0)}
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-[#3B58F5] text-white font-semibold text-[14px] hover:bg-[#2542E5] disabled:opacity-50 disabled:hover:bg-[#3B58F5] transition-colors"
          >
            {step === 3 ? "Create Group" : "Next"}
            {step < 3 && <ArrowLeft className="h-4 w-4 rotate-180" />}
          </button>
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
