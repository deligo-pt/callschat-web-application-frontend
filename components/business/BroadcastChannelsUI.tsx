"use client";

import React, { useState } from "react";
import {
  Megaphone,
  Plus,
  ArrowLeft,
  Camera,
  Check,
  Search,
  ChevronRight,
  X,
  Users,
  Sparkles,
  Shield,
  Bell,
  Heart,
  Image as ImageIcon,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface BroadcastItem {
  id: string;
  title: string;
  timestamp: string;
  recipientsCount: number;
  iconBg: string;
  iconColor: string;
}

export interface BroadcastChannelsUIProps {
  onClose?: () => void;
  onNavigateToChannels?: () => void;
  isEmbedded?: boolean;
}

export function BroadcastChannelsUI({
  onClose,
  onNavigateToChannels,
  isEmbedded = false,
}: BroadcastChannelsUIProps) {
  // Navigation & Wizard State
  const [view, setView] = useState<"list" | "wizard">("list");
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);

  // Initial Broadcasts List (matching Figma Screenshot 1)
  const [broadcasts, setBroadcasts] = useState<BroadcastItem[]>([
    {
      id: "bc-1",
      title: "Flash Sale — 40% Off",
      timestamp: "2h ago",
      recipientsCount: 2340,
      iconBg: "bg-red-50",
      iconColor: "text-red-500",
    },
    {
      id: "bc-2",
      title: "Weekly Newsletter",
      timestamp: "Yesterday",
      recipientsCount: 1890,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      id: "bc-3",
      title: "Event Invitation",
      timestamp: "3 days ago",
      recipientsCount: 580,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
  ]);

  // Step 1 State: Channel Information
  const [channelName, setChannelName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Technology");
  const [hasAvatar, setHasAvatar] = useState(false);

  // Step 2 State: Channel Settings
  const [whoCanJoin, setWhoCanJoin] = useState<"anyone" | "invite" | "approval">("anyone");
  const [whoCanPost, setWhoCanPost] = useState<"admin" | "moderators">("admin");
  const [enableReactions, setEnableReactions] = useState(true);
  const [notifications, setNotifications] = useState<"all" | "mentions">("all");

  // Step 3 State: Invite Contacts
  const [searchQuery, setSearchQuery] = useState("");
  const [contacts, setContacts] = useState([
    { id: "c-1", name: "Alice Johnson", letter: "A", color: "bg-blue-600", selected: true },
    { id: "c-2", name: "Bob Martinez", letter: "B", color: "bg-purple-600", selected: true },
    { id: "c-3", name: "Carol Chen", letter: "C", color: "bg-emerald-600", selected: false },
    { id: "c-4", name: "David Park", letter: "D", color: "bg-red-600", selected: false },
    { id: "c-5", name: "Eve Williams", letter: "E", color: "bg-amber-600", selected: false },
  ]);

  const categories = [
    { id: "Technology", label: "Technology", icon: "⚡" },
    { id: "Business", label: "Business", icon: "🏢" },
    { id: "Education", label: "Education", icon: "📖" },
    { id: "News", label: "News", icon: "📢" },
  ];

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleContact = (id: string) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c))
    );
  };

  const handleStartNewBroadcast = () => {
    setChannelName("");
    setDescription("");
    setSelectedCategory("Technology");
    setHasAvatar(false);
    setWhoCanJoin("anyone");
    setWhoCanPost("admin");
    setEnableReactions(true);
    setWizardStep(1);
    setView("wizard");
  };

  const handleFinishWizard = () => {
    const selectedCount = contacts.filter((c) => c.selected).length;
    const newItem: BroadcastItem = {
      id: `bc-${Date.now()}`,
      title: channelName.trim() || "Product Updates",
      timestamp: "Just now",
      recipientsCount: selectedCount > 0 ? selectedCount * 120 : 350,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    };
    setBroadcasts((prev) => [newItem, ...prev]);
    setView("list");
    if (onNavigateToChannels) {
      onNavigateToChannels();
    }
  };

  const containerClasses = isEmbedded
    ? "w-full max-w-xl mx-auto bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden min-h-[640px] flex flex-col"
    : "fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto";

  const cardClasses = isEmbedded
    ? "flex-1 flex flex-col"
    : "w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] min-h-[640px]";

  return (
    <div className={containerClasses}>
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        className={cardClasses}
      >
        {/* Top Header / App Bar */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4.5 bg-white shrink-0 z-10">
          <div className="flex items-center gap-3">
            {view === "wizard" ? (
              <button
                onClick={() => {
                  if (wizardStep === 1) {
                    setView("list");
                  } else if (wizardStep > 1 && wizardStep < 4) {
                    setWizardStep((prev) => (prev - 1) as any);
                  } else if (wizardStep === 4) {
                    setView("list");
                  }
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-slate-100 text-blue-600 transition-colors"
                title="Go Back"
              >
                <ArrowLeft className="h-5 w-5 stroke-[2.5]" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-slate-100 text-blue-600 transition-colors"
                title="Back"
              >
                <ArrowLeft className="h-5 w-5 stroke-[2.5]" />
              </button>
            )}

            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                {view === "list" && "Broadcast Channels"}
                {view === "wizard" && wizardStep === 1 && "Channel Information"}
                {view === "wizard" && wizardStep === 2 && "Channel Settings"}
                {view === "wizard" && wizardStep === 3 && "Channel Settings"}
                {view === "wizard" && wizardStep === 4 && "Broadcast Channels"}
              </h1>
              {view === "list" && (
                <p className="text-xs text-slate-400 font-medium">
                  Send to multiple contacts at once
                </p>
              )}
              {view === "wizard" && wizardStep < 4 && (
                <p className="text-[11px] text-blue-600 font-bold uppercase tracking-wider">
                  Step {wizardStep} of 3
                </p>
              )}
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#FCFDFE]">
          <AnimatePresence mode="wait">
            {/* SCREEN 0: BROADCAST LIST VIEW (Figma Screenshot 1) */}
            {view === "list" && (
              <motion.div
                key="list-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 max-w-md mx-auto"
              >
                <div className="flex items-center justify-between pt-1">
                  <h2 className="text-xs font-extrabold text-blue-600 tracking-wider uppercase">
                    Your Broadcasts
                  </h2>
                  <span className="text-xs font-bold text-slate-400">
                    {broadcasts.length} total
                  </span>
                </div>

                {/* Broadcast Cards */}
                <div className="space-y-3">
                  {broadcasts.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        // Clicking an existing card opens edit preview or step 1
                        setChannelName(item.title);
                        setView("wizard");
                        setWizardStep(1);
                      }}
                      className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs hover:shadow-md hover:border-blue-200 cursor-pointer transition-all group"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div
                          className={`h-12 w-12 rounded-2xl ${item.iconBg} ${item.iconColor} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}
                        >
                          <Megaphone className="h-6 w-6 stroke-[2]" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                            {item.title}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-0.5">
                            <span>{item.timestamp}</span>
                            <span>·</span>
                            <span className="text-blue-600 font-bold">
                              {item.recipientsCount.toLocaleString()} recipients
                            </span>
                          </div>
                        </div>
                      </div>

                      <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-blue-600 transition-colors shrink-0" />
                    </div>
                  ))}
                </div>

                {/* Dashed "+ New Broadcast" Button */}
                <div className="pt-4">
                  <button
                    onClick={handleStartNewBroadcast}
                    className="w-full py-4 px-6 rounded-2xl border-2 border-dashed border-blue-400 bg-blue-50/40 hover:bg-blue-50 hover:border-blue-500 text-blue-600 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-2xs group"
                  >
                    <Plus className="h-5 w-5 stroke-[2.5] group-hover:rotate-90 transition-transform" />
                    <span>New Broadcast</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* SCREEN 1: CHANNEL INFORMATION (Figma Screenshot 2) */}
            {view === "wizard" && wizardStep === 1 && (
              <motion.div
                key="wizard-step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 max-w-md mx-auto py-2"
              >
                {/* Circular Photo Placeholder */}
                <div className="flex justify-center pt-2">
                  <div
                    onClick={() => setHasAvatar(!hasAvatar)}
                    className="relative w-24 h-24 rounded-full bg-blue-50/80 border border-blue-100 flex items-center justify-center cursor-pointer hover:bg-blue-100/60 transition-colors shadow-inner"
                    title="Click to select channel photo"
                  >
                    {hasAvatar ? (
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-3xl shadow-md">
                        {channelName.charAt(0).toUpperCase() || "P"}
                      </div>
                    ) : (
                      <ImageIcon className="h-10 w-10 text-slate-400" />
                    )}
                    <div className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md border-2 border-white hover:scale-110 transition-transform">
                      <Camera className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                {/* Channel Name Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-900">
                    Channel Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Product Updates"
                    value={channelName}
                    onChange={(e) => setChannelName(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-50 focus:outline-none transition-all bg-white"
                  />
                </div>

                {/* Description Textarea */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-900">
                      Description
                    </label>
                    <span className="text-[11px] font-medium text-slate-400">
                      {description.length}/300 · Optional
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    maxLength={300}
                    placeholder="Tell people what your channel is about..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 p-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-50 focus:outline-none resize-none transition-all bg-white"
                  />
                </div>

                {/* Category Pills */}
                <div className="space-y-2.5 pt-1">
                  <label className="block text-xs font-bold text-slate-900">
                    Category
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {categories.map((cat) => {
                      const isSelected = selectedCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl text-xs font-bold transition-all border ${
                            isSelected
                              ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/25"
                              : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <span className="text-sm">{cat.icon}</span>
                          <span>{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Continue Button */}
                <div className="pt-6">
                  <button
                    onClick={() => setWizardStep(2)}
                    className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all"
                  >
                    <span>Continue</span>
                    <ArrowLeft className="h-4 w-4 rotate-180 stroke-[2.5]" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* SCREEN 2: CHANNEL SETTINGS (Figma Screenshot 3) */}
            {view === "wizard" && wizardStep === 2 && (
              <motion.div
                key="wizard-step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 max-w-md mx-auto py-1"
              >
                {/* Who can join section */}
                <div className="space-y-2.5">
                  <label className="block text-xs font-extrabold text-slate-900">
                    Who can join
                  </label>
                  <div className="space-y-2">
                    {[
                      {
                        id: "anyone",
                        title: "Anyone",
                        subtitle: "Open to all platform users",
                      },
                      {
                        id: "invite",
                        title: "Invite Only",
                        subtitle: "Members must receive an invite",
                      },
                      {
                        id: "approval",
                        title: "Requires Approval",
                        subtitle: "Admin reviews each join request",
                      },
                    ].map((opt) => {
                      const isSelected = whoCanJoin === opt.id;
                      return (
                        <div
                          key={opt.id}
                          onClick={() => setWhoCanJoin(opt.id as any)}
                          className={`flex items-center gap-3.5 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                            isSelected
                              ? "border-blue-600 bg-blue-50/50 shadow-2xs"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <div className="shrink-0">
                            {isSelected ? (
                              <div className="h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                                <Check className="h-3 w-3 stroke-[3]" />
                              </div>
                            ) : (
                              <div className="h-5 w-5 rounded-full border-2 border-slate-300" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">
                              {opt.title}
                            </p>
                            <p className="text-[11px] font-medium text-slate-500">
                              {opt.subtitle}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Who can post section */}
                <div className="space-y-2.5">
                  <label className="block text-xs font-extrabold text-slate-900">
                    Who can post
                  </label>
                  <div className="space-y-2">
                    {[
                      {
                        id: "admin",
                        title: "Admin Only",
                        subtitle: "Only channel admins can post",
                      },
                      {
                        id: "moderators",
                        title: "Admin + Moderators",
                        subtitle: "Both admins and moderators can post",
                      },
                    ].map((opt) => {
                      const isSelected = whoCanPost === opt.id;
                      return (
                        <div
                          key={opt.id}
                          onClick={() => setWhoCanPost(opt.id as any)}
                          className={`flex items-center gap-3.5 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                            isSelected
                              ? "border-blue-600 bg-blue-50/50 shadow-2xs"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <div className="shrink-0">
                            {isSelected ? (
                              <div className="h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                                <Check className="h-3 w-3 stroke-[3]" />
                              </div>
                            ) : (
                              <div className="h-5 w-5 rounded-full border-2 border-slate-300" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">
                              {opt.title}
                            </p>
                            <p className="text-[11px] font-medium text-slate-500">
                              {opt.subtitle}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Interactions section */}
                <div className="space-y-2.5">
                  <label className="block text-xs font-extrabold text-slate-900">
                    Interactions
                  </label>
                  <div className="p-4 rounded-2xl border border-slate-200 bg-white flex items-center justify-between shadow-2xs">
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Enable Reactions
                      </p>
                      <p className="text-[11px] font-medium text-slate-500">
                        Members can react with emoji
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEnableReactions(!enableReactions)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        enableReactions ? "bg-blue-600" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          enableReactions ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Default Notifications section */}
                <div className="space-y-2.5">
                  <label className="block text-xs font-extrabold text-slate-900">
                    Default Notifications for Members
                  </label>
                  <div
                    onClick={() => setNotifications("all")}
                    className="flex items-center gap-3.5 p-3.5 rounded-2xl border border-blue-600 bg-blue-50/50 shadow-2xs cursor-pointer"
                  >
                    <div className="h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        All Messages
                      </p>
                      <p className="text-[11px] font-medium text-slate-500">
                        Notify for every new post
                      </p>
                    </div>
                  </div>
                </div>

                {/* Continue Button */}
                <div className="pt-4">
                  <button
                    onClick={() => setWizardStep(3)}
                    className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all"
                  >
                    <span>Continue</span>
                    <ArrowLeft className="h-4 w-4 rotate-180 stroke-[2.5]" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* SCREEN 3: INVITE CONTACTS (Figma Screenshot 4) */}
            {view === "wizard" && wizardStep === 3 && (
              <motion.div
                key="wizard-step-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5 max-w-md mx-auto py-1"
              >
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search contacts to invite..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 pl-11 pr-4 py-3.5 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-50 focus:outline-none transition-all bg-white"
                  />
                </div>

                {/* Contacts List matching Screenshot 4 */}
                <div className="space-y-3 py-2 max-h-[340px] overflow-y-auto pr-1">
                  {filteredContacts.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => handleToggleContact(c.id)}
                      className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-100 hover:border-blue-200 cursor-pointer transition-all shadow-2xs group"
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`h-10 w-10 rounded-full ${c.color} text-white font-extrabold flex items-center justify-center text-sm shadow-sm group-hover:scale-105 transition-transform`}
                        >
                          {c.letter}
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-slate-900">
                          {c.name}
                        </span>
                      </div>

                      <div className="shrink-0">
                        {c.selected ? (
                          <div className="h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="h-5 w-5 rounded-full border border-slate-300 bg-white group-hover:border-blue-400 transition-colors" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Buttons: Create Channel + Skip */}
                <div className="pt-4 space-y-3">
                  <button
                    onClick={() => setWizardStep(4)}
                    className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all"
                  >
                    Create Channel
                  </button>

                  <button
                    type="button"
                    onClick={() => setWizardStep(4)}
                    className="w-full py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors text-center block"
                  >
                    Skip — invite members later
                  </button>
                </div>
              </motion.div>
            )}

            {/* SCREEN 4: SUCCESS SCREEN (Figma Screenshot 5) */}
            {view === "wizard" && wizardStep === 4 && (
              <motion.div
                key="wizard-step-4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center justify-center py-12 text-center max-w-md mx-auto space-y-6"
              >
                {/* Checkmark with Glowing Ring */}
                <div className="relative flex items-center justify-center pt-6">
                  <div className="absolute w-32 h-32 rounded-full bg-blue-100/60 animate-pulse" />
                  <div className="absolute w-24 h-24 rounded-full bg-blue-200/80" />
                  <div className="relative z-10 w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xl shadow-blue-500/35">
                    <Check className="h-10 w-10 stroke-[3]" />
                  </div>
                </div>

                <div className="space-y-2 max-w-xs pt-4">
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-snug">
                    Your channel has been created successfully!
                  </h2>
                  <p className="text-xs sm:text-sm font-medium text-slate-500">
                    Start sharing content with your audience
                  </p>
                </div>

                <div className="w-full pt-8">
                  <button
                    onClick={handleFinishWizard}
                    className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all"
                  >
                    Go to My Channels
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
