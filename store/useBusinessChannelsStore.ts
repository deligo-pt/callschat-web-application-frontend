import { create } from 'zustand';
import { ChannelData, ChannelMessageData, ChannelMemberData, ChannelService } from '@/services/channel.service';

interface BusinessChannelsState {
  // Modal & Navigation State
  isOpen: boolean;
  activeTab: "explore" | "create" | "room" | "settings";
  adminSubTab: "posts" | "members";
  
  // Data State
  channels: ChannelData[];
  selectedChannel: ChannelData | null;
  messages: ChannelMessageData[];
  channelMembers: ChannelMemberData[];
  contacts: any[];
  
  // Loading States
  isLoadingChannels: boolean;
  isLoadingMessages: boolean;
  isLoadingMembers: boolean;
  
  // Actions
  setIsOpen: (isOpen: boolean) => void;
  setActiveTab: (tab: "explore" | "create" | "room" | "settings") => void;
  setAdminSubTab: (tab: "posts" | "members") => void;
  setSelectedChannel: (channel: ChannelData | null) => void;
  setChannels: (channels: ChannelData[] | ((prev: ChannelData[]) => ChannelData[])) => void;
  setMessages: (messages: ChannelMessageData[] | ((prev: ChannelMessageData[]) => ChannelMessageData[])) => void;
  setChannelMembers: (members: ChannelMemberData[] | ((prev: ChannelMemberData[]) => ChannelMemberData[])) => void;
  setContacts: (contacts: any[]) => void;
  setIsLoadingChannels: (isLoading: boolean) => void;
  setIsLoadingMessages: (isLoading: boolean) => void;
  setIsLoadingMembers: (isLoading: boolean) => void;
}

export const useBusinessChannelsStore = create<BusinessChannelsState>((set) => ({
  isOpen: false,
  activeTab: "explore",
  adminSubTab: "posts",
  
  channels: [],
  selectedChannel: null,
  messages: [],
  channelMembers: [],
  contacts: [],
  
  isLoadingChannels: false,
  isLoadingMessages: false,
  isLoadingMembers: false,
  
  setIsOpen: (isOpen) => set({ isOpen }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setAdminSubTab: (adminSubTab) => set({ adminSubTab }),
  setSelectedChannel: (selectedChannel) => set({ selectedChannel }),
  setChannels: (updater) => set((state) => ({ 
    channels: typeof updater === 'function' ? updater(state.channels) : updater 
  })),
  setMessages: (updater) => set((state) => ({ 
    messages: typeof updater === 'function' ? updater(state.messages) : updater 
  })),
  setChannelMembers: (updater) => set((state) => ({ 
    channelMembers: typeof updater === 'function' ? updater(state.channelMembers) : updater 
  })),
  setContacts: (contacts) => set({ contacts }),
  setIsLoadingChannels: (isLoadingChannels) => set({ isLoadingChannels }),
  setIsLoadingMessages: (isLoadingMessages) => set({ isLoadingMessages }),
  setIsLoadingMembers: (isLoadingMembers) => set({ isLoadingMembers }),
}));
