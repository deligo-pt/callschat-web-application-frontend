"use client";

import React, { useState, useEffect } from "react";
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, Video, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCallContext } from "@/components/providers/CallContext";

interface Contact {
  id: string;
  name: string;
  avatarUrl: string;
  isOnline: boolean;
}

export default function CallsPage() {
  const [filter, setFilter] = useState<"all" | "missed">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { initiateCall } = useCallContext();

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000/api/v1";
        const contactsRes = await fetch(`${baseUrl}/contacts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const contactsData = await contactsRes.json();
        
        let usersArray: any[] = [];
        if (contactsData.success && Array.isArray(contactsData.data)) {
          usersArray = contactsData.data;
        } else if (Array.isArray(contactsData)) {
          usersArray = contactsData;
        } else if (contactsData.data && Array.isArray(contactsData.data.contacts)) {
          usersArray = contactsData.data.contacts;
        }

        const mappedUsers = usersArray.map((u: any) => {
          const userProfile = u.addressee?.profile || u.contact?.profile || u.profile || {};
          const userId = u.addressee?.id || u.contact?.id || u.id;
          const displayName = u.customName || userProfile.displayName || userProfile.username || "Unknown";
          return {
            id: userId,
            name: displayName,
            avatarUrl: userProfile.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=3B58F5&color=fff`,
            isOnline: userProfile.isOnline || false,
          };
        });
        // Deduplicate contacts by user ID to prevent React key errors for mutual contacts
        const uniqueContacts = Array.from(new Map(mappedUsers.map((item: any) => [item.id, item])).values());
        setContacts(uniqueContacts as Contact[]);
      } catch (err) {
        console.error("Failed to fetch contacts", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContacts();
  }, []);

  const filteredContacts = contacts.filter(contact => {
    // For now, "Missed" will be empty because we're just rendering active contacts
    if (filter === "missed") return false;
    if (searchQuery && !contact.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex h-full w-full bg-[#F8FAFC]">
      {/* Left Sidebar (Call List) */}
      <div className="flex h-full w-full flex-col border-r border-[#E6EAFA] bg-white md:w-[400px] shrink-0">
        <div className="flex flex-col px-6 pt-8 pb-4">
          <h1 className="text-[28px] font-extrabold tracking-tight text-[#11142D]">Calls</h1>
          
          {/* Tabs */}
          <div className="mt-6 flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={cn(
                "rounded-full px-5 py-1.5 text-[13px] font-bold transition-colors",
                filter === "all" ? "bg-[#3B58F5] text-white shadow-md shadow-[#3B58F5]/20" : "border border-[#E6EAFA] bg-white text-[#8F95B2] hover:bg-[#F4F6FC]"
              )}
            >
              All
            </button>
            <button
              onClick={() => setFilter("missed")}
              className={cn(
                "rounded-full px-5 py-1.5 text-[13px] font-bold transition-colors",
                filter === "missed" ? "bg-[#3B58F5] text-white shadow-md shadow-[#3B58F5]/20" : "border border-[#E6EAFA] bg-white text-[#8F95B2] hover:bg-[#F4F6FC]"
              )}
            >
              Missed
            </button>
          </div>

          {/* Search */}
          <div className="mt-6 relative">
            <Search className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#8F95B2]" />
            <input
              type="text"
              placeholder="Search calls..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-[48px] w-full rounded-2xl bg-[#F4F6FC] pl-11 pr-4 text-[14px] font-medium text-[#11142D] placeholder-[#8F95B2] focus:outline-none focus:ring-1 focus:ring-[#3B58F5]/50"
            />
          </div>
        </div>

        {/* Call List */}
        <div className="flex-1 overflow-y-auto scrollbar-hide pb-24 md:pb-6">
          <div className="flex flex-col">
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#3B58F5] border-t-transparent" />
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
                <p className="text-[14px] font-medium text-[#8F95B2]">
                  {filter === "missed" ? "No missed calls." : "No contacts found."}
                </p>
              </div>
            ) : (
              filteredContacts.map((contact) => (
                <div key={contact.id} className="group relative flex w-full items-center justify-between px-6 py-3.5 transition-colors hover:bg-[#F4F7FE]">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img src={contact.avatarUrl} alt={contact.name} className="h-[48px] w-[48px] rounded-full object-cover" />
                      {contact.isOnline && (
                        <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#22C55E]" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[15px] font-bold text-[#1D2A54]">
                        {contact.name}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[13px] font-medium text-[#8F95B2]">
                          Available to call
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => initiateCall(contact.id, "AUDIO")}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF2FF] text-[#3B58F5] transition-colors hover:bg-[#3B58F5] hover:text-white shadow-sm"
                      title="Audio Call"
                    >
                      <Phone className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={() => initiateCall(contact.id, "VIDEO")}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF2FF] text-[#3B58F5] transition-colors hover:bg-[#3B58F5] hover:text-white shadow-sm"
                      title="Video Call"
                    >
                      <Video className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area (Placeholder for Web UI similar to WhatsApp Web) */}
      <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-[#F8FAFC]">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-xl shadow-blue-500/5 mb-6">
          <Phone className="h-10 w-10 text-[#3B58F5]" strokeWidth={1.5} />
        </div>
        <h2 className="text-[24px] font-bold text-[#1D2A54]">Your Calls</h2>
        <p className="mt-2 text-[15px] font-medium text-[#8F95B2] max-w-sm text-center">
          Select a contact from the sidebar or your contacts list to start a voice or video call.
        </p>
      </div>
    </div>
  );
}
