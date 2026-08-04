"use client";

import React, { useEffect, useState } from "react";
import { CommunitiesSidebar } from "./CommunitiesSidebar";
import { CreateCommunitiesUI, CommunityItem } from "./CreateCommunitiesUI";
import { CommunityDetailView } from "./CommunityDetailView";
import { communityService } from "@/services/community.service";
import { Loader2 } from "lucide-react";

export function CommunitiesRouteContainer() {
  const [communities, setCommunities] = useState<CommunityItem[]>([]);
  const [activeView, setActiveView] = useState<string>("create");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadCommunities() {
      setIsLoading(true);
      const res = await communityService.fetchMyCommunities();
      if (isMounted) {
        setIsLoading(false);
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          const formatted = res.data.map((c, i) => ({
            ...c,
            iconBg: i % 3 === 0 ? "bg-blue-100" : i % 3 === 1 ? "bg-purple-100" : "bg-emerald-100",
            iconColor: i % 3 === 0 ? "text-blue-600" : i % 3 === 1 ? "text-purple-600" : "text-emerald-600",
          }));
          setCommunities(formatted);
          setActiveView(formatted[0].id);
        } else {
          // No dummy data — only real communities loaded from the database
          setCommunities([]);
          setActiveView("create");
        }
      }
    }
    loadCommunities();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelectCommunity = (comm: CommunityItem) => {
    setActiveView(comm.id);
  };

  const handleSelectCreate = () => {
    setActiveView("create");
  };

  const handleCommunityCreated = (newComm: CommunityItem) => {
    setCommunities((prev) => [newComm, ...prev]);
    setActiveView(newComm.id);
  };

  const handleCommunityDeleted = (deletedId: string) => {
    setCommunities((prev) => {
      const updated = prev.filter((c) => c.id !== deletedId);
      if (updated.length > 0) {
        setActiveView(updated[0].id);
      } else {
        setActiveView("create");
      }
      return updated;
    });
  };

  const activeCommunity = communities.find((c) => c.id === activeView);

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin text-[#2563EB]" />
          <span className="text-sm font-semibold">Loading your communities...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full bg-[#F8FAFC] overflow-hidden">
      {/* Secondary Left Sidebar */}
      <CommunitiesSidebar
        communities={communities}
        activeView={activeView}
        onSelectCommunity={handleSelectCommunity}
        onSelectCreate={handleSelectCreate}
      />

      {/* Main Content Panel */}
      <div className="flex flex-1 h-full w-full overflow-hidden relative">
        {activeView === "create" || !activeCommunity ? (
          <CreateCommunitiesUI
            onBack={() => {
              if (communities.length > 0) {
                setActiveView(communities[0].id);
              }
            }}
            onCommunityCreated={handleCommunityCreated}
          />
        ) : (
          <CommunityDetailView
            community={activeCommunity}
            onCreateNewClick={handleSelectCreate}
            onCommunityDeleted={handleCommunityDeleted}
          />
        )}
      </div>
    </div>
  );
}
