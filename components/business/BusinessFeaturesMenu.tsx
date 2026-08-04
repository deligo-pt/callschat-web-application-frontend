"use client";

import React, { useState } from "react";
import { MoreVertical, Hash, Megaphone, Globe, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { BroadcastChannelsModal } from "./BroadcastChannelsModal";
import { BusinessCommunitiesModal } from "./BusinessCommunitiesModal";
import { BusinessChannelsModal } from "./BusinessChannelsModal";

export function BusinessFeaturesMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [isCommunitiesModalOpen, setIsCommunitiesModalOpen] = useState(false);
  const [isBusinessChannelsModalOpen, setIsBusinessChannelsModalOpen] = useState(false);
  const router = useRouter();

  const handleSelectBusinessChannels = () => {
    setIsOpen(false);
    router.push("/business/channels");
  };

  return (
    <div className="relative inline-block text-left">
      {/* Three Dot Trigger Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center p-2 transition-colors hover:bg-slate-100 rounded-full text-slate-700 hover:text-[#3B58F5]"
        title="Business Features"
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Invisible Backdrop to close on outside click */}
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

            {/* Dropdown Menu Card (Figma UI exact match) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute right-0 top-12 z-50 w-[310px] sm:w-[330px] rounded-[2rem] border border-blue-100/80 bg-white p-3.5 shadow-2xl"
            >
              <div className="flex flex-col gap-2.5">
                {/* 1. Business Channels */}
                <div
                  onClick={handleSelectBusinessChannels}
                  className="flex items-center justify-between p-3 rounded-2xl border border-blue-200/60 bg-white hover:bg-blue-50/60 hover:border-blue-300 transition-all cursor-pointer shadow-2xs group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#3B58F5] group-hover:scale-105 transition-transform shadow-xs">
                      <Hash className="h-5 w-5 stroke-[2.5]" />
                    </div>
                    <span className="text-[15px] font-bold text-[#11142D]">Business Channels</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-[#3B58F5] group-hover:translate-x-0.5 transition-all" />
                </div>

                {/* 2. Broadcast Channels */}
                <div
                  onClick={() => {
                    setIsOpen(false);
                    setIsBroadcastModalOpen(true);
                  }}
                  className="flex items-center justify-between p-3 rounded-2xl border border-blue-200/60 bg-white hover:bg-blue-50/60 hover:border-blue-300 transition-all cursor-pointer shadow-2xs group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#3B58F5] group-hover:scale-105 transition-transform shadow-xs">
                      <Megaphone className="h-5 w-5 stroke-[2.2]" />
                    </div>
                    <span className="text-[15px] font-bold text-[#11142D]">Broadcast Channels</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-[#3B58F5] group-hover:translate-x-0.5 transition-all" />
                </div>

                {/* 3. Business Communities */}
                <div
                  onClick={() => {
                    setIsOpen(false);
                    setIsCommunitiesModalOpen(true);
                  }}
                  className="flex items-center justify-between p-3 rounded-2xl border border-blue-200/60 bg-white hover:bg-blue-50/60 hover:border-blue-300 transition-all cursor-pointer shadow-2xs group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#3B58F5] group-hover:scale-105 transition-transform shadow-xs">
                      <Globe className="h-5 w-5 stroke-[2.2]" />
                    </div>
                    <span className="text-[15px] font-bold text-[#11142D]">Business Communities</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-[#3B58F5] group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modals */}
      <BroadcastChannelsModal
        isOpen={isBroadcastModalOpen}
        onClose={() => setIsBroadcastModalOpen(false)}
      />
      <BusinessCommunitiesModal
        isOpen={isCommunitiesModalOpen}
        onClose={() => setIsCommunitiesModalOpen(false)}
      />
      <BusinessChannelsModal
        isOpen={isBusinessChannelsModalOpen}
        onClose={() => setIsBusinessChannelsModalOpen(false)}
      />
    </div>
  );
}
