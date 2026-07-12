"use client";

import React, { useState } from "react";
import { CommunitiesSidebar } from "./CommunitiesSidebar";
import { CreateCommunitiesUI, CommunityItem } from "./CreateCommunitiesUI";
import { CommunityDetailView } from "./CommunityDetailView";

const INITIAL_COMMUNITIES: CommunityItem[] = [
  {
    id: "comm-tech",
    name: "Tech Company Community",
    description: "Official tech company ecosystem and team syncs.",
    category: "Technology",
    memberCount: 450,
    groupCount: 12,
    iconBg: "bg-blue-100",
    iconColor: "text-[#2563EB]",
  },
  {
    id: "comm-industry",
    name: "Industry Hub",
    description: "Global industry network and partner collaborations.",
    category: "Business",
    memberCount: 230,
    groupCount: 6,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
  },
  {
    id: "comm-startup",
    name: "Startup Circle",
    description: "Founders, product leaders, and early-stage startup innovators.",
    category: "Business",
    memberCount: 120,
    groupCount: 4,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
];

export function CommunitiesRouteContainer() {
  const [communities, setCommunities] = useState<CommunityItem[]>(INITIAL_COMMUNITIES);
  const [activeView, setActiveView] = useState<string>("create"); // Default to "create" to immediately show the requested UI design

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

  const activeCommunity = communities.find((c) => c.id === activeView);

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
          />
        )}
      </div>
    </div>
  );
}
