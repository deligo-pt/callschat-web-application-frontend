"use client";

import React, { useState } from "react";
import { Globe, Users, Search, Plus, Check, X, Building2, ShieldCheck, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface BusinessCommunitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Community {
  id: string;
  name: string;
  description: string;
  membersCount: number;
  category: string;
  isJoined: boolean;
  isVerified: boolean;
}

const INITIAL_COMMUNITIES: Community[] = [
  {
    id: "comm-1",
    name: "🌐 Global SaaS & Tech Founders",
    description: "Network with CEOs, CTOs, and product leaders building enterprise software across the globe.",
    membersCount: 4520,
    category: "Technology",
    isJoined: false,
    isVerified: true
  },
  {
    id: "comm-2",
    name: "💼 Enterprise Sales & Partnership Network",
    description: "B2B partnership opportunities, co-selling strategies, and referral networks for growth.",
    membersCount: 2890,
    category: "Business Development",
    isJoined: true,
    isVerified: true
  },
  {
    id: "comm-3",
    name: "⚡ AI & Automation Innovators",
    description: "Discuss cutting-edge LLM integrations, AI workflows, and enterprise automation tools.",
    membersCount: 6150,
    category: "Artificial Intelligence",
    isJoined: false,
    isVerified: true
  },
  {
    id: "comm-4",
    name: "📦 Global Retail & Supply Chain Leaders",
    description: "Connect with distributors, logistics experts, and retail brand executives worldwide.",
    membersCount: 1940,
    category: "Retail & Commerce",
    isJoined: true,
    isVerified: false
  }
];

export function BusinessCommunitiesModal({ isOpen, onClose }: BusinessCommunitiesModalProps) {
  const [activeTab, setActiveTab] = useState<"explore" | "my" | "create">("explore");
  const [communities, setCommunities] = useState<Community[]>(INITIAL_COMMUNITIES);
  const [searchQuery, setSearchQuery] = useState("");

  // Create Form State
  const [newCommName, setNewCommName] = useState("");
  const [newCommDesc, setNewCommDesc] = useState("");
  const [newCommCategory, setNewCommCategory] = useState("Technology");

  if (!isOpen) return null;

  const handleToggleJoin = (id: string, name: string, currentStatus: boolean) => {
    setCommunities(prev => prev.map(comm => {
      if (comm.id === id) {
        return { ...comm, isJoined: !currentStatus };
      }
      return comm;
    }));

    if (!currentStatus) {
      toast.success(`🎉 You joined ${name}!`);
    } else {
      toast.info(`Left ${name}`);
    }
  };

  const handleCreateCommunity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommName.trim()) {
      toast.error("Please enter a community name");
      return;
    }

    const newComm: Community = {
      id: `comm-${Date.now()}`,
      name: `🌐 ${newCommName}`,
      description: newCommDesc || "Official verified business community network.",
      membersCount: 1,
      category: newCommCategory,
      isJoined: true,
      isVerified: true
    };

    setCommunities([newComm, ...communities]);
    setNewCommName("");
    setNewCommDesc("");
    setActiveTab("my");
    toast.success("Business Community created and verified!");
  };

  const filteredCommunities = communities.filter(comm => {
    const matchesSearch = comm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          comm.description.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === "my") return matchesSearch && comm.isJoined;
    return matchesSearch;
  });

  const myCount = communities.filter(c => c.isJoined).length;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#11142D]/60 p-4 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2.5rem] bg-white shadow-2xl border border-[#E6EAFA]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F0F4FF] bg-gradient-to-r from-[#EFF4FF] via-white to-[#EFF4FF] px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#3B58F5] text-white shadow-lg shadow-[#3B58F5]/30">
              <Globe className="h-6 w-6 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#11142D] tracking-tight flex items-center gap-2">
                Business Communities
                <span className="rounded-full bg-[#E0E7FF] px-2.5 py-0.5 text-[11px] font-bold text-[#3B58F5]">
                  VERIFIED
                </span>
              </h2>
              <p className="text-xs font-medium text-[#6B7280]">
                Connect with verified enterprises, partner networks, and industry ecosystems.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-[#F0F4FF] px-8 bg-slate-50/50 flex-wrap gap-4">
          <div className="flex">
            <button
              onClick={() => setActiveTab("explore")}
              className={`flex items-center gap-2 border-b-2 py-3.5 mr-6 text-sm font-bold transition-all ${
                activeTab === "explore"
                  ? "border-[#3B58F5] text-[#3B58F5]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Search className="h-4 w-4" />
              Explore Communities
            </button>
            <button
              onClick={() => setActiveTab("my")}
              className={`flex items-center gap-2 border-b-2 py-3.5 mr-6 text-sm font-bold transition-all ${
                activeTab === "my"
                  ? "border-[#3B58F5] text-[#3B58F5]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Users className="h-4 w-4" />
              My Communities ({myCount})
            </button>
            <button
              onClick={() => setActiveTab("create")}
              className={`flex items-center gap-2 border-b-2 py-3.5 text-sm font-bold transition-all ${
                activeTab === "create"
                  ? "border-[#3B58F5] text-[#3B58F5]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Plus className="h-4 w-4" />
              Create Community
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 max-h-[60vh]">
          {activeTab !== "create" && (
            <div className="mb-6 relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search verified business networks and partner communities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl bg-[#F4F6FC] pl-11 pr-4 py-3 text-sm font-medium text-[#11142D] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3B58F5]/30 border border-transparent"
              />
            </div>
          )}

          <AnimatePresence mode="wait">
            {activeTab !== "create" && (
              <motion.div
                key="list"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {filteredCommunities.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-600">No communities found</p>
                    <p className="text-xs text-slate-400 mt-1">Try searching for a different keyword or create one.</p>
                  </div>
                ) : (
                  filteredCommunities.map((comm) => (
                    <div
                      key={comm.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[#E6EAFA] bg-white p-5 shadow-2xs hover:border-[#3B58F5]/40 hover:shadow-md transition-all group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-[#11142D]">{comm.name}</h3>
                          {comm.isVerified && (
                            <span className="flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-extrabold text-[#3B58F5]" title="Verified Business Community">
                              <ShieldCheck className="h-3 w-3" />
                              VERIFIED
                            </span>
                          )}
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                            {comm.category}
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs font-medium text-slate-600 leading-relaxed">
                          {comm.description}
                        </p>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                          <Users className="h-3.5 w-3.5 text-[#3B58F5]" />
                          <span>{comm.membersCount.toLocaleString()} businesses</span>
                        </div>
                        
                        <button
                          onClick={() => handleToggleJoin(comm.id, comm.name, comm.isJoined)}
                          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-2xs ${
                            comm.isJoined
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                              : "bg-[#3B58F5] text-white hover:bg-[#2C48B8] shadow-sm"
                          }`}
                        >
                          {comm.isJoined ? (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              <span>Joined</span>
                            </>
                          ) : (
                            <>
                              <Plus className="h-3.5 w-3.5" />
                              <span>Join Community</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            )}

            {activeTab === "create" && (
              <motion.form
                key="create"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleCreateCommunity}
                className="space-y-5 max-w-lg mx-auto"
              >
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Community Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Global Tech Founders"
                    value={newCommName}
                    onChange={(e) => setNewCommName(e.target.value)}
                    className="w-full rounded-xl border border-[#E6EAFA] bg-[#F8FAFC] px-4 py-3 text-sm font-semibold text-[#11142D] placeholder-slate-400 focus:border-[#3B58F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3B58F5]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Industry Category
                  </label>
                  <select
                    value={newCommCategory}
                    onChange={(e) => setNewCommCategory(e.target.value)}
                    className="w-full rounded-xl border border-[#E6EAFA] bg-[#F8FAFC] px-4 py-3 text-sm font-semibold text-[#11142D] focus:border-[#3B58F5] focus:bg-white focus:outline-none"
                  >
                    <option value="Technology">Technology & Software</option>
                    <option value="Business Development">Business Development & Partnerships</option>
                    <option value="Artificial Intelligence">Artificial Intelligence</option>
                    <option value="Retail & Commerce">Retail & Commerce</option>
                    <option value="Finance & Fintech">Finance & Fintech</option>
                    <option value="Healthcare & Bio">Healthcare & Bio</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Description & Purpose
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe what businesses will gain from joining this community..."
                    value={newCommDesc}
                    onChange={(e) => setNewCommDesc(e.target.value)}
                    className="w-full rounded-xl border border-[#E6EAFA] bg-[#F8FAFC] p-4 text-sm font-medium text-[#11142D] placeholder-slate-400 focus:border-[#3B58F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3B58F5]/20"
                  />
                </div>

                <div className="rounded-2xl bg-blue-50 p-4 border border-blue-100 flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-[#3B58F5] shrink-0 mt-0.5" />
                  <p className="text-xs font-medium text-blue-900 leading-relaxed">
                    Created communities receive a verification badge automatically for authenticated business workspaces. Members can network and message within community channels.
                  </p>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab("explore")}
                    className="rounded-xl bg-slate-100 px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-[#3B58F5] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#3B58F5]/25 hover:bg-[#2C48B8] transition-all"
                  >
                    Create & Verify Community
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
