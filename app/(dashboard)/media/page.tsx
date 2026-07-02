"use client";

import { cn } from "@/lib/utils";
import { Search, Users, MessageSquare, Phone, Video, Star, Bell, X, FileText, Download, Link as LinkIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { chatService } from "@/services/chat.service";
import { useContacts, type Contact } from "@/hooks/useContacts";
import { useAllMedia, type MediaItem } from "@/hooks/useAllMedia";

export default function MediaPage() {
  const router = useRouter();
  const { contacts, isLoading: contactsLoading, searchQuery, setSearchQuery } = useContacts();
  const { media, isLoading: mediaLoading, loadMore, hasMore } = useAllMedia();
  
  const [activeTab, setActiveTab] = useState<'Media' | 'Docs' | 'Links'>('Media');

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

  // Group media by date
  const groupMediaByDate = (items: MediaItem[]) => {
    const groups: { [key: string]: { label: string; dateLabel: string; items: MediaItem[] } } = {};
    
    items.forEach(item => {
      const date = new Date(item.createdAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let groupKey = '';
      let label = '';
      let dateLabel = '';

      if (date.toDateString() === today.toDateString()) {
        groupKey = 'today';
        label = 'Today';
        dateLabel = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).toLowerCase();
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupKey = 'yesterday';
        label = 'Yesterday';
        dateLabel = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).toLowerCase();
      } else {
        groupKey = date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
        label = date.toLocaleDateString('en-GB', { month: 'long' });
        dateLabel = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).toLowerCase();
      }

      if (!groups[groupKey]) {
        groups[groupKey] = { label, dateLabel, items: [] };
      }
      groups[groupKey].items.push(item);
    });

    return Object.values(groups);
  };

  const mediaGroups = groupMediaByDate(media.filter(m => m.mediaType === 'image' || m.mediaType === 'video'));
  const docsGroups = groupMediaByDate(media.filter(m => m.mediaType === 'document' || m.mediaType === 'raw' || m.mediaType === 'file' || (!m.mediaType.startsWith('image') && !m.mediaType.startsWith('video') && !m.mediaType.startsWith('audio') && m.mediaType !== 'emoji' && m.mediaType !== 'call')));
  const linksGroups = groupMediaByDate(media.filter(m => m.mediaType === 'link'));

  return (
    <div className="flex h-full w-full bg-white">
      
      {/* Left Panel - Contacts List (reused visually) */}
      <div className="hidden h-full w-full flex-col border-r border-[#E6EAFA] bg-white md:flex md:w-[380px] shrink-0">
        <div className="flex flex-col bg-white px-6 pt-8 pb-4 shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-[28px] font-bold text-[#3B58F5]">Groups</h1>
            <div className="flex items-center gap-3">
              <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
              <Bell className="h-6 w-6 text-[#3B58F5]" />
            </div>
          </div>
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

        <div className="flex-1 overflow-y-auto scrollbar-hide pb-4">
          {contactsLoading ? (
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
                  <div className="bg-[#F8FAFC] px-6 py-2.5 text-[13px] font-bold text-slate-500">
                    {letter}
                  </div>
                  <div className="flex flex-col">
                    {groupedContacts[letter].map((contact) => (
                      <div key={contact.id} className="group flex w-full items-center justify-between px-6 py-3 transition-colors hover:bg-slate-50">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="relative shrink-0">
                            {contact.avatarUrl ? (
                              <img src={contact.avatarUrl} alt={contact.name} className="h-[42px] w-[42px] rounded-full object-cover" />
                            ) : (
                              <div className={cn("flex h-[42px] w-[42px] items-center justify-center rounded-full text-[14px] font-bold text-white", getRandomColor(contact.name))}>
                                {getInitials(contact.name)}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-start overflow-hidden">
                            <h3 className="text-[15px] font-bold text-slate-900 truncate w-full text-left">{contact.name}</h3>
                            <p className="text-[12px] font-medium text-slate-500 truncate text-left">{contact.phone}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={(e) => { e.preventDefault(); handleStartChat(contact.userId); }} className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-[#3B58F5] transition-colors hover:bg-blue-100">
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

      {/* Right Panel - Media Gallery */}
      <div className="flex flex-1 flex-col bg-white">
        {/* Header */}
        <div className="flex flex-col border-b border-[#E6EAFA] shrink-0">
          <div className="flex items-center px-6 py-5 gap-3">
            <button className="text-slate-400 hover:text-slate-600 transition-colors">
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-[16px] font-bold text-slate-700">Media from all chats</h2>
          </div>
          
          {/* Tabs */}
          <div className="flex px-6 items-center w-full">
            {['Media', 'Docs', 'Links'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={cn(
                  "flex-1 py-3 text-[14px] font-medium text-center transition-colors border-b-2",
                  activeTab === tab 
                    ? "text-[#3B58F5] border-[#3B58F5]" 
                    : "text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Gallery Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-6">
          {mediaLoading && media.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#3B58F5] border-t-transparent" />
            </div>
          ) : mediaGroups.length === 0 ? (
            <div className="flex h-full items-center justify-center text-slate-500 text-[15px] font-medium">
              No media found
            </div>
          ) : (
            <div className="flex flex-col gap-8 pb-10">
              {activeTab === 'Media' && mediaGroups.map((group, index) => (
                <div key={index} className="flex flex-col">
                  <div className="mb-4">
                    <h3 className="text-[18px] font-bold text-[#1e293b] capitalize">{group.label}</h3>
                    <p className="text-[13px] font-medium text-slate-500">{group.dateLabel}</p>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
                    {group.items.map((item, idx) => (
                      <div 
                        key={item.id} 
                        className={cn(
                          "relative aspect-square overflow-hidden rounded-xl bg-slate-100 border border-slate-200 group cursor-pointer",
                          // The first item in the mock has a dotted blue border, we can add a hover effect instead
                          "hover:border-[#3B58F5] hover:ring-2 hover:ring-[#3B58F5]/20 transition-all"
                        )}
                      >
                        {item.mediaType === 'image' ? (
                          <img 
                            src={item.mediaUrl} 
                            alt="Media" 
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : item.mediaType === 'video' ? (
                          <div className="relative h-full w-full">
                            <video 
                              src={item.mediaUrl} 
                              className="h-full w-full object-cover" 
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur">
                                <div className="ml-1 h-0 w-0 border-y-4 border-l-6 border-y-transparent border-l-black" />
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              {activeTab === 'Docs' && docsGroups.length === 0 && (
                <div className="flex flex-col items-center justify-center h-40 text-slate-500 text-[15px] font-medium">
                  <FileText className="w-10 h-10 mb-3 opacity-20" />
                  No documents found
                </div>
              )}
              
              {activeTab === 'Docs' && docsGroups.map((group, index) => (
                <div key={index} className="flex flex-col">
                  <div className="mb-4">
                    <h3 className="text-[18px] font-bold text-[#1e293b] capitalize">{group.label}</h3>
                    <p className="text-[13px] font-medium text-slate-500">{group.dateLabel}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {group.items.map((item) => (
                      <a 
                        key={item.id}
                        href={item.mediaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-[#E5E7EB]/50 transition-shadow hover:shadow-md group"
                      >
                        <div className="w-12 h-12 shrink-0 rounded-xl bg-[#F3F4F6] group-hover:bg-[#3B58F5]/10 flex items-center justify-center transition-colors">
                          <FileText className="w-6 h-6 text-[#6B7280] group-hover:text-[#3B58F5] transition-colors" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="text-[15px] font-bold text-[#111928] truncate group-hover:text-[#3B58F5] transition-colors">
                            {item.mediaUrl.split('/').pop() || "Document"}
                          </p>
                          <p className="text-[13px] text-[#6B7280]">
                            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 text-slate-400 group-hover:bg-[#3B58F5] group-hover:text-white transition-colors shrink-0">
                          <Download className="w-5 h-5" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              ))}

              {activeTab === 'Links' && linksGroups.length === 0 && (
                <div className="flex flex-col items-center justify-center h-40 text-slate-500 text-[15px] font-medium">
                  <LinkIcon className="w-10 h-10 mb-3 opacity-20" />
                  No links found
                </div>
              )}

              {activeTab === 'Links' && linksGroups.map((group, index) => (
                <div key={index} className="flex flex-col">
                  <div className="mb-4">
                    <h3 className="text-[18px] font-bold text-[#1e293b] capitalize">{group.label}</h3>
                    <p className="text-[13px] font-medium text-slate-500">{group.dateLabel}</p>
                  </div>
                  <div className="flex flex-col gap-3">
                    {group.items.map((item) => (
                      <a 
                        key={item.id}
                        href={item.mediaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-[#E5E7EB]/50 transition-all hover:shadow-md hover:border-[#3B58F5]/30 group"
                      >
                        <div className="w-12 h-12 shrink-0 rounded-xl bg-blue-50 group-hover:bg-[#3B58F5] flex items-center justify-center transition-colors">
                          <LinkIcon className="w-6 h-6 text-[#3B58F5] group-hover:text-white transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[15px] font-semibold text-[#111928] truncate group-hover:text-[#3B58F5] transition-colors">
                            {item.mediaUrl}
                          </p>
                          <p className="text-[13px] text-[#6B7280]">
                            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              ))}

              {hasMore && (
                <div className="flex justify-center pt-6">
                  <button 
                    onClick={loadMore}
                    disabled={mediaLoading}
                    className="rounded-full bg-slate-100 px-6 py-2 text-[14px] font-semibold text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-50"
                  >
                    {mediaLoading ? 'Loading...' : 'Load more'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
