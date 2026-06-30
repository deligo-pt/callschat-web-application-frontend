import { create } from 'zustand';

interface MeetingState {
  meetingId: string | null;
  token: string | null;
  channelId: string | null;
  isJoining: boolean;
  setMeeting: (meetingId: string, token: string, channelId: string) => void;
  clearMeeting: () => void;
  setIsJoining: (isJoining: boolean) => void;
}

export const useMeetingStore = create<MeetingState>((set) => ({
  meetingId: null,
  token: null,
  channelId: null,
  isJoining: false,
  setMeeting: (meetingId: string, token: string, channelId: string) => set({ meetingId, token, channelId, isJoining: false }),
  clearMeeting: () => set({ meetingId: null, token: null, channelId: null, isJoining: false }),
  setIsJoining: (isJoining: boolean) => set({ isJoining }),
}));
