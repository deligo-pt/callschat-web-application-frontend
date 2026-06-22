"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, Search, MessageSquare, Phone, Video, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface Contact {
  id: string;
  name: string;
  phone: string;
  avatarUrl: string | null;
}

export default function ContactsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchContacts() {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setIsLoading(false);
          return;
        }

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000/api/v1";
        const res = await fetch(`${baseUrl}/user/all`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        
        const data = await res.json();
        if (data.success && data.data) {
          const mappedContacts = data.data.map((u: any) => ({
            id: u.id,
            name: u.profile.displayName || u.profile.username || "Unknown",
            phone: u.phone || "No phone number",
            avatarUrl: u.profile.avatarUrl
          }));
          
          // Sort alphabetically
          mappedContacts.sort((a: Contact, b: Contact) => a.name.localeCompare(b.name));
          setContacts(mappedContacts);
        }
      } catch (error) {
        console.error("Failed to fetch contacts", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchContacts();
  }, []);

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
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push("/chats")}
              className="rounded-full p-1.5 transition-colors hover:bg-white/20"
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
            </button>
            <h1 className="text-[20px] font-bold">Contacts</h1>
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
                          <button className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EEF2FB] text-[#3B58F5] transition-transform hover:scale-110">
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

    </div>
  );
}
