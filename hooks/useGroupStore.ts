import { create } from 'zustand';
import { groupService, GroupItem } from '@/services/group.service';

interface GroupStoreState {
  groups: GroupItem[];
  isLoading: boolean;
  error: string | null;
  fetchGroups: (force?: boolean) => Promise<void>;
  addGroup: (group: GroupItem) => void;
  updateGroupInStore: (groupId: string, data: Partial<GroupItem>) => void;
  removeGroupFromStore: (groupId: string) => void;
  toggleFavouriteInStore: (groupId: string, status: boolean) => void;
  updateGroupMessageTimestamp: (groupId: string, lastMessageText?: string) => void;
}

export const useGroupStore = create<GroupStoreState>((set, get) => ({
  groups: [],
  isLoading: false,
  error: null,

  fetchGroups: async (force = false) => {
    const currentGroups = get().groups;
    if (currentGroups.length === 0) {
      set({ isLoading: true, error: null });
    }

    try {
      const res = await groupService.fetchMyGroups();
      if (res.success && Array.isArray(res.data)) {
        set({ groups: res.data, isLoading: false, error: null });
      } else {
        set({ isLoading: false });
      }
    } catch (error: any) {
      console.error('Failed to fetch groups in store:', error);
      set({ isLoading: false, error: error.message || 'Failed to fetch groups' });
    }
  },

  addGroup: (group: GroupItem) => {
    set((state) => {
      if (state.groups.some((g) => g.id === group.id)) {
        return {
          groups: state.groups.map((g) => (g.id === group.id ? { ...g, ...group } : g)),
        };
      }
      return {
        groups: [group, ...state.groups],
      };
    });
  },

  updateGroupInStore: (groupId: string, data: Partial<GroupItem>) => {
    set((state) => ({
      groups: state.groups.map((g) => (g.id === groupId ? { ...g, ...data } : g)),
    }));
  },

  removeGroupFromStore: (groupId: string) => {
    set((state) => ({
      groups: state.groups.filter((g) => g.id !== groupId),
    }));
  },

  toggleFavouriteInStore: (groupId: string, status: boolean) => {
    set((state) => ({
      groups: state.groups.map((g) => (g.id === groupId ? { ...g, isFavourite: status } : g)),
    }));
  },

  updateGroupMessageTimestamp: (groupId: string, lastMessageText?: string) => {
    set((state) => {
      const target = state.groups.find((g) => g.id === groupId);
      if (!target) return state;

      const updatedTarget: GroupItem = {
        ...target,
        updatedAt: new Date().toISOString(),
        description: lastMessageText !== undefined ? lastMessageText : target.description,
      };

      const rest = state.groups.filter((g) => g.id !== groupId);
      return {
        groups: [updatedTarget, ...rest],
      };
    });
  },
}));
