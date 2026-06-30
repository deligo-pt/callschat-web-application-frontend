"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Building2, CheckCircle2, MessageSquare, ArrowRight, Loader2 } from "lucide-react";
import { BusinessService } from "@/services/business.service";
import { chatService } from "@/services/chat.service";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface BusinessDirectoryItem {
  workspaceId: string;
  name: string;
  isVerified: boolean;
  avatarUrl: string | null;
  description: string | null;
}

interface ExploreBusinessesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExploreBusinessesModal({ isOpen, onClose }: ExploreBusinessesModalProps) {
  const router = useRouter();
  const [businesses, setBusinesses] = useState<BusinessDirectoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [initiatingId, setInitiatingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchDirectory();
    }
  }, [isOpen]);

  const fetchDirectory = async () => {
    setIsLoading(true);
    try {
      const res = await BusinessService.getDirectory();
      if (res.success && res.data) {
        setBusinesses(res.data);
      }
    } catch (error) {
      console.error("Failed to load business directory:", error);
      toast.error("Failed to load verified businesses");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartChat = async (workspaceId: string) => {
    setInitiatingId(workspaceId);
    try {
      const res = await chatService.initiateConversation({ workspaceId });
      const convId = res?.data?.conversationId ?? res?.conversationId;
      if (convId) {
        toast.success("Connected to Business Support!");
        onClose();
        router.push(`/chats/${convId}`);
      } else {
        toast.error("Could not start conversation");
      }
    } catch (error) {
      console.error("Failed to initiate business chat:", error);
      toast.error("Failed to connect to business account");
    } finally {
      setInitiatingId(null);
    }
  };

  const filteredBusinesses = businesses.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.description && b.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1D2A54]/50 p-4 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-[#E6EAFA]"
          >
            {/* Header Banner */}
            <div className="relative overflow-hidden bg-gradient-to-r from-[#3B58F5] via-[#4A72FF] to-[#6366F1] px-7 py-6 text-white shrink-0">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-white/10 blur-xl" />

              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 shadow-inner">
                    <Building2 className="h-6 w-6 text-white" strokeWidth={2.2} />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold tracking-tight">Explore Businesses</h2>
                    <p className="text-xs text-white/80 font-medium">
                      Discover official workspaces & chat directly with customer support
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-full bg-white/10 p-2 text-white/90 transition-all hover:bg-white/20 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative z-10 mt-5">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
                <input
                  type="text"
                  placeholder="Search verified business accounts by name or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-11 w-full rounded-2xl bg-white/15 pl-11 pr-4 text-sm font-medium text-white placeholder-white/70 backdrop-blur-md border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                />
              </div>
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#F8FAFC]">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-[#3B58F5]" />
                  <p className="text-xs font-semibold text-[#8F95B2]">Finding official businesses...</p>
                </div>
              ) : filteredBusinesses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mb-3 border border-slate-200">
                    <Building2 className="h-8 w-8 text-[#8F95B2]" />
                  </div>
                  <h3 className="text-base font-bold text-[#1D2A54]">No businesses found</h3>
                  <p className="mt-1 text-xs text-[#8F95B2] max-w-sm">
                    {searchQuery
                      ? `We couldn't find any business matching "${searchQuery}". Try a different search term.`
                      : "There are no verified businesses currently registered in the directory."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3.5">
                  {filteredBusinesses.map((b) => (
                    <motion.div
                      key={b.workspaceId}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group relative flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm border border-[#E6EAFA] transition-all duration-200 hover:shadow-md hover:border-[#3B58F5]/40 hover:-translate-y-0.5"
                    >
                      <div className="flex items-center gap-4 overflow-hidden pr-3">
                        {/* Avatar / Icon */}
                        <div className="relative shrink-0">
                          {b.avatarUrl ? (
                            <img
                              src={b.avatarUrl}
                              alt={b.name}
                              className="h-13 w-13 rounded-2xl object-cover border border-[#E6EAFA]"
                            />
                          ) : (
                            <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-br from-[#EEF2FB] to-[#DCE6FF] border border-[#3B58F5]/20 text-lg font-bold text-[#3B58F5]">
                              {b.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex flex-col overflow-hidden">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-base font-bold text-[#1D2A54] truncate">
                              {b.name}
                            </h4>
                            {b.isVerified && (
                              <span title="Verified Business Account" className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-[10px] font-extrabold border border-blue-200 shrink-0">
                                <CheckCircle2 className="h-3 w-3 fill-blue-600 text-white" />
                                Official
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs font-medium text-[#64748B] line-clamp-1">
                            {b.description || "Official Business Workspace Account"}
                          </p>
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => handleStartChat(b.workspaceId)}
                        disabled={initiatingId === b.workspaceId}
                        className="shrink-0 flex items-center gap-2 rounded-xl bg-[#3B58F5] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-[#3B58F5]/20 transition-all duration-200 hover:bg-[#2A46DB] hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {initiatingId === b.workspaceId ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Connecting...</span>
                          </>
                        ) : (
                          <>
                            <MessageSquare className="h-4 w-4" />
                            <span>Message</span>
                            <ArrowRight className="h-3.5 w-3.5 opacity-80 transition-transform group-hover:translate-x-0.5" />
                          </>
                        )}
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-[#E6EAFA] bg-white px-7 py-4 text-xs text-[#8F95B2] shrink-0">
              <span>Looking to register your own business?</span>
              <button
                onClick={() => {
                  onClose();
                  router.push("/business");
                }}
                className="font-bold text-[#3B58F5] hover:underline"
              >
                Switch to Business Mode →
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
