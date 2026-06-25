"use client";

import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, MessageSquare, Phone, Search, Users, Video, Plus, X, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { chatService } from "@/services/chat.service";
import { useContacts, type Contact } from "@/hooks/useContacts";

export default function ContactsPage() {
  const router = useRouter();
  const { contacts, isLoading, searchQuery, setSearchQuery, fetchContacts, handleToggleFavourite } = useContacts();

  // Add Contact Modal State
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [newContactPhone, setNewContactPhone] = useState("");
  const [newContactName, setNewContactName] = useState("");
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
    setIsAddingContact(true);
    
    try {
      const token = localStorage.getItem("accessToken");
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000/api/v1";
      let formattedPhone = newContactPhone.trim().replace(/\s|-|\(|\)/g, "");
      if (!formattedPhone.startsWith('+')) {
        // If it doesn't start with +, add it (assuming they typed the country code without +)
        // If they typed a local number starting with 0, we'll let the backend regex catch it and show a nice error
        if (/^[1-9]/.test(formattedPhone)) {
          formattedPhone = '+' + formattedPhone;
        }
      }

      const res = await fetch(`${baseUrl}/contacts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          phoneNumber: formattedPhone,
          customName: newContactName
        })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success !== false) {
        setIsAddContactModalOpen(false);
        setNewContactPhone("");
        setNewContactName("");
        fetchContacts();
      } else {
        // Beautify the zod validation error if it comes from fastify
        let errorMessage = data.message || "Failed to add contact";
        if (errorMessage.includes("body/phoneNumber") || res.status === 400) {
          errorMessage = "Please enter a valid international phone number starting with '+' and country code (e.g., +88017...).";
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
    <div className="flex h-full w-full bg-[#F8FAFC]">
      
      {/* Left Panel - Contacts List */}
      <div className="flex h-full w-full flex-col border-r border-[#E6EAFA] bg-white md:w-[400px] shrink-0">
        
        {/* Blue Header Area */}
        <div className="flex flex-col bg-[#3B58F5] px-6 py-6 text-white shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.push("/chats")}
                className="rounded-full p-1.5 transition-colors hover:bg-white/20"
              >
                <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
              </button>
              <h1 className="text-[20px] font-bold">Contacts</h1>
            </div>
            <button
              onClick={() => setIsAddContactModalOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 transition-colors hover:bg-white/30"
              title="Add New Contact"
            >
              <Plus className="h-5 w-5" strokeWidth={2.5} />
            </button>
          </div>

          {/* Search Bar */}
          <div className="mt-5 relative">
            <Search className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-white/70" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-[44px] w-full rounded-xl bg-white/10 pl-11 pr-4 text-[14px] font-medium text-white placeholder-white/70 focus:outline-none focus:ring-1 focus:ring-white/50 transition-colors"
            />
          </div>
        </div>

        {/* Scrollable List Area */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#3B58F5] border-t-transparent" />
            </div>
          ) : Object.keys(groupedContacts).length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center h-full">
              <Users className="h-12 w-12 text-[#8F95B2] mb-4 opacity-50" />
              <p className="text-[15px] font-medium text-[#8F95B2]">No contacts found</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {Object.keys(groupedContacts).sort().map((letter) => (
                <div key={letter}>
                  {/* Letter Header */}
                  <div className="bg-[#F8FAFC] px-6 py-2 text-[13px] font-bold text-[#8F95B2]">
                    {letter}
                  </div>
                  
                  {/* Contacts for this letter */}
                  <div className="flex flex-col">
                    {groupedContacts[letter].map((contact, index) => (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        key={contact.id} 
                        className="group flex w-full items-center justify-between px-6 py-3.5 transition-colors hover:bg-[#F4F7FE]"
                      >
                        <div className="flex items-center gap-4 overflow-hidden">
                          {/* Avatar */}
                          <div className="relative shrink-0">
                            {contact.avatarUrl ? (
                              <img 
                                src={contact.avatarUrl} 
                                alt={contact.name} 
                                className="h-[46px] w-[46px] rounded-full object-cover"
                              />
                            ) : (
                              <div className={cn(
                                "flex h-[46px] w-[46px] items-center justify-center rounded-full text-[15px] font-bold text-white",
                                getRandomColor(contact.name)
                              )}>
                                {getInitials(contact.name)}
                              </div>
                            )}
                          </div>

                          {/* Contact Info */}
                          <div className="flex flex-col items-start overflow-hidden">
                            <h3 className="text-[15px] font-bold text-[#1D2A54] truncate w-full text-left">
                              {contact.name}
                            </h3>
                            <p className="mt-0.5 text-[13px] font-medium text-[#8F95B2] truncate text-left">
                              {contact.phone}
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleToggleFavourite(contact.id, contact.isFavourite);
                            }}
                            className="flex h-9 w-9 items-center justify-center rounded-full transition-transform hover:scale-110"
                            title={contact.isFavourite ? "Remove from favourites" : "Add to favourites"}
                          >
                            {contact.isFavourite ? (
                              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                            ) : (
                              <Star className="w-5 h-5 text-muted-foreground hover:text-yellow-400 transition-colors" />
                            )}
                          </button>
                          
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleStartChat(contact.userId);
                            }}
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EEF2FB] text-[#3B58F5] transition-transform hover:scale-110"
                          >
                            <MessageSquare className="h-[18px] w-[18px]" strokeWidth={2.5} />
                          </button>
                          <button className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ECFDF3] text-[#22C55E] transition-transform hover:scale-110">
                            <Phone className="h-[18px] w-[18px]" strokeWidth={2.5} />
                          </button>
                          <button className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F5F3FF] text-[#8B5CF6] transition-transform hover:scale-110">
                            <Video className="h-[18px] w-[18px]" strokeWidth={2.5} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Empty State (Desktop Only) */}
      <div className="hidden flex-1 flex-col items-center justify-center bg-[#F8FAFC] md:flex relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-96 w-96 rounded-full bg-gradient-to-br from-[#4A72FF]/5 to-[#1D3BB5]/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-80 w-80 rounded-full bg-gradient-to-tr from-[#3B58F5]/5 to-transparent blur-2xl" />
        
        <div className="flex flex-col items-center text-center p-8 z-10">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-xl shadow-blue-500/5 mb-6">
            <Users className="h-10 w-10 text-[#3B58F5]" strokeWidth={1.5} />
          </div>
          <h2 className="text-[24px] font-bold text-[#1D2A54]">Select a Contact</h2>
          <p className="mt-3 text-[15px] font-medium text-[#8F95B2] max-w-md leading-relaxed">
            Choose a contact from the list to view their details, start a conversation, or initiate a call.
          </p>
        </div>
      </div>

      {/* Add Contact Modal */}
      <AnimatePresence>
        {isAddContactModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1D2A54]/40 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-[20px] font-bold text-[#1D2A54]">Add New Contact</h2>
                <button
                  onClick={() => setIsAddContactModalOpen(false)}
                  className="rounded-full p-2 text-[#8F95B2] transition-colors hover:bg-[#F8FAFC] hover:text-[#1D2A54]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAddContact} className="flex flex-col gap-4">
                <div>
                  <label className="mb-1.5 block text-[13px] font-bold text-[#1D2A54]">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+8801712345678"
                    value={newContactPhone}
                    onChange={(e) => setNewContactPhone(e.target.value)}
                    className="w-full rounded-xl border border-[#E6EAFA] bg-[#F8FAFC] px-4 py-3 text-[14px] font-medium text-[#1D2A54] placeholder-[#8F95B2] focus:border-[#3B58F5] focus:outline-none focus:ring-1 focus:ring-[#3B58F5] transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-bold text-[#1D2A54]">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Alice (Work)"
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    className="w-full rounded-xl border border-[#E6EAFA] bg-[#F8FAFC] px-4 py-3 text-[14px] font-medium text-[#1D2A54] placeholder-[#8F95B2] focus:border-[#3B58F5] focus:outline-none focus:ring-1 focus:ring-[#3B58F5] transition-colors"
                    required
                  />
                </div>

                {addContactError && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="rounded-lg bg-red-50 p-3"
                  >
                    <p className="text-[13px] font-medium text-red-600">{addContactError}</p>
                  </motion.div>
                )}

                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddContactModalOpen(false)}
                    className="flex-1 rounded-xl bg-[#F8FAFC] py-3 text-[14px] font-bold text-[#1D2A54] transition-colors hover:bg-[#E6EAFA]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAddingContact}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#3B58F5] py-3 text-[14px] font-bold text-white transition-colors hover:bg-[#2A41C7] disabled:opacity-70"
                  >
                    {isAddingContact ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        <span>Adding...</span>
                      </>
                    ) : (
                      "Add Contact"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
