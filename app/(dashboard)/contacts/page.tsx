"use client";

import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, MessageSquare, Phone, Search, Users, Video, Plus, X, Star, Bell, UserPlus, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { chatService } from "@/services/chat.service";
import { useContacts, type Contact } from "@/hooks/useContacts";
import { ExploreBusinessesModal } from "@/components/business/ExploreBusinessesModal";
import { Building2 } from "lucide-react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

export default function ContactsPage() {
  const router = useRouter();
  const { contacts, isLoading, searchQuery, setSearchQuery, fetchContacts, handleToggleFavourite } = useContacts();

  // Add Contact Panel State
  const [isAddContactPanelOpen, setIsAddContactPanelOpen] = useState(false);
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const [newContactPhone, setNewContactPhone] = useState<string | undefined>("");
  const [newContactFirstName, setNewContactFirstName] = useState("");
  const [newContactLastName, setNewContactLastName] = useState("");
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [addContactError, setAddContactError] = useState("");

  const handleStartChat = async (targetUserId: string) => {
    try {
      const res = await chatService.initiateConversation(targetUserId);
      if (res.success && res.data?.conversationId) {
        router.push(`/chats/${res.data.conversationId}`);
      }
    } catch (error) {
      console.error("Failed to start conversation:", error);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddContactError("");
    
    if (!newContactPhone) {
      setAddContactError("Please enter a valid phone number.");
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
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          phoneNumber: newContactPhone,
          customName: customName || undefined
        })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success !== false) {
        setIsAddContactPanelOpen(false);
        setNewContactPhone("");
        setNewContactFirstName("");
        setNewContactLastName("");
        fetchContacts();
      } else {
        let errorMessage = data.message || "Failed to add contact";
        if (errorMessage.includes("body/phoneNumber") || res.status === 400) {
          errorMessage = "Please enter a valid international phone number.";
        } else if (res.status === 409) {
          errorMessage = "This contact already exists or you are trying to add yourself.";
        } else if (res.status === 404) {
          errorMessage = "No registered user found with this phone number.";
        }
        setAddContactError(errorMessage);
      }
    } catch (error) {
      setAddContactError("Network error. Please try again.");
    } finally {
      setIsAddingContact(false);
    }
  };

  // Filter contacts by search query
  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    contact.phone.includes(searchQuery)
  );

  // Group contacts by first letter
  const groupedContacts = filteredContacts.reduce((acc, contact) => {
    const letter = contact.name.charAt(0).toUpperCase();
    if (!acc[letter]) {
      acc[letter] = [];
    }
    acc[letter].push(contact);
    return acc;
  }, {} as Record<string, Contact[]>);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getRandomColor = (name: string) => {
    const colors = [
      "bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500", 
      "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500"
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="flex h-full w-full bg-white">
      
      {/* Left Panel - Contacts List */}
      <div className="flex h-full w-full flex-col border-r border-[#E6EAFA] bg-white md:w-[380px] shrink-0">
        
        {/* Header Area */}
        <div className="flex flex-col bg-white px-6 pt-8 pb-4 shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-[28px] font-bold text-[#3B58F5]">Groups</h1>
            <div className="flex items-center gap-3">
              <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
              <Bell className="h-6 w-6 text-[#3B58F5]" />
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-6 relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-[42px] w-full rounded-xl bg-[#F0F2F5] pl-11 pr-4 text-[14px] font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#3B58F5] transition-colors"
            />
          </div>
        </div>

        {/* Scrollable List Area */}
        <div className="flex-1 overflow-y-auto scrollbar-hide pb-4">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#3B58F5] border-t-transparent" />
            </div>
          ) : Object.keys(groupedContacts).length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center h-full">
              <Users className="h-12 w-12 text-slate-300 mb-4 opacity-50" />
              <p className="text-[15px] font-medium text-slate-400">No contacts found</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {Object.keys(groupedContacts).sort().map((letter) => (
                <div key={letter}>
                  {/* Letter Header */}
                  <div className="bg-[#F8FAFC] px-6 py-2.5 text-[13px] font-bold text-slate-500">
                    {letter}
                  </div>
                  
                  {/* Contacts for this letter */}
                  <div className="flex flex-col">
                    {groupedContacts[letter].map((contact, index) => (
                      <div 
                        key={contact.id} 
                        className="group flex w-full items-center justify-between px-6 py-3 transition-colors hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          {/* Avatar */}
                          <div className="relative shrink-0">
                            {contact.avatarUrl ? (
                              <img 
                                src={contact.avatarUrl} 
                                alt={contact.name} 
                                className="h-[42px] w-[42px] rounded-full object-cover"
                              />
                            ) : (
                              <div className={cn(
                                "flex h-[42px] w-[42px] items-center justify-center rounded-full text-[14px] font-bold text-white",
                                getRandomColor(contact.name)
                              )}>
                                {getInitials(contact.name)}
                              </div>
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
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              handleStartChat(contact.userId);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-[#3B58F5] transition-colors hover:bg-blue-100"
                          >
                            <MessageSquare className="h-4 w-4" strokeWidth={2.5} />
                          </button>
                          <button className="flex h-8 w-8 items-center justify-center rounded-full bg-green-50 text-green-500 transition-colors hover:bg-green-100">
                            <Phone className="h-4 w-4" strokeWidth={2.5} />
                          </button>
                          <button className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-50 text-purple-500 transition-colors hover:bg-purple-100">
                            <Video className="h-4 w-4" strokeWidth={2.5} />
                          </button>
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
            <span className="text-[13px] font-semibold">Add contact</span>
          </div>
          <p className="text-[15px] font-medium text-slate-500 leading-relaxed mb-8">
            Add contacts and start chatting or calling them instantly.
          </p>
          <button 
            onClick={() => setIsAddContactPanelOpen(true)}
            className="rounded-full bg-[#1D2A54] px-6 py-2.5 text-[14px] font-bold text-white transition-colors hover:bg-[#2A3F7A]"
          >
            + Add number
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
            <h2 className="text-[16px] font-bold text-slate-800">New contact</h2>
          </div>

          <div className="p-6">
            <form onSubmit={handleAddContact} className="flex flex-col gap-6">
              
              <div className="flex items-end gap-3">
                <User className="h-5 w-5 text-[#3B58F5] mb-2 shrink-0" />
                <div className="flex-1 border-b border-slate-300 pb-2">
                  <input
                    type="text"
                    placeholder="First name"
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
                    placeholder="Last name"
                    value={newContactLastName}
                    onChange={(e) => setNewContactLastName(e.target.value)}
                    className="w-full text-[14px] font-medium text-slate-900 placeholder-slate-400 focus:outline-none bg-transparent"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-[13px] font-bold text-slate-500 mb-3 ml-8">
                  Phone number
                </label>
                <div className="ml-8">
                  <PhoneInput
                    international
                    defaultCountry="US"
                    value={newContactPhone}
                    onChange={setNewContactPhone}
                    className="flex w-full gap-3"
                    numberInputProps={{
                      className: "flex-1 rounded-xl border border-slate-200 px-4 py-3 text-[14px] font-medium text-slate-900 focus:border-[#3B58F5] focus:outline-none focus:ring-1 focus:ring-[#3B58F5] transition-colors"
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
                  {isAddingContact && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
                  Save
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
