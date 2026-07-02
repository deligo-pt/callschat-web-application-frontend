"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, Search, Lock, Users, Plus, Loader2, MessageSquare, MoreVertical, Trash2, Star } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { groupService, GroupItem } from "@/services/group.service";
import { toast } from "sonner";
import { useUser } from "@/context/UserContext";
export default function GroupsPage() {
  return (
    <div className="hidden flex-1 flex-col items-center justify-center bg-white md:flex w-full">
      <div className="flex flex-col items-center text-center max-w-sm">
        <div className="relative mb-8">
          <div className="h-[120px] w-[120px] rounded-full bg-[#EEF2FF] flex items-center justify-center border border-[#E0E7FF] shadow-2xl shadow-blue-500/10">
            <Users className="h-16 w-16 text-[#2563EB]" strokeWidth={1.5} />
          </div>
        </div>
        
        <h2 className="text-[22px] font-bold text-[#0F172A] mb-3">No Groups Yet</h2>
        <p className="text-[13px] font-semibold text-[#1E293B] leading-relaxed max-w-[240px]">
          You haven't joined or created any<br />groups yet.
        </p>
      </div>
    </div>
  );
}
