"use client";

import { createContext, useContext } from 'react';
import { IncomingCall, ActiveCall, OutgoingCall } from '@/hooks/useCallSignaling';

export interface CallContextType {
  incomingCall: IncomingCall | null;
  activeCall: ActiveCall | null;
  outgoingCall: OutgoingCall | null;
  activeGroupCalls: string[];
  initiateCall: (receiverId: string, callType: 'AUDIO' | 'VIDEO', receiverName?: string, receiverAvatar?: string) => void;
  acceptCall: (callId: string, roomName: string) => void;
  rejectCall: (callId: string, roomName: string) => void;
  hangupCall: (callId: string) => void;
  cancelOutgoingCall: () => void;
  startGroupCall: (groupId: string, callType: 'AUDIO' | 'VIDEO') => void;
  joinGroupCall: (groupId: string) => void;
  leaveGroupCall: (groupId: string) => void;
}

export const CallContext = createContext<CallContextType | null>(null);

export const useCallContext = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCallContext must be used within a CallProvider');
  }
  return context;
};
