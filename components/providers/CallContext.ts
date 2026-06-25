"use client";

import { createContext, useContext } from 'react';
import {
  IncomingCall,
  ActiveCall,
  OutgoingCall,
  IncomingGroupCall,
  OutgoingGroupCall,
} from '@/hooks/useCallSignaling';

export interface CallContextType {
  incomingCall: IncomingCall | null;
  activeCall: ActiveCall | null;
  outgoingCall: OutgoingCall | null;
  incomingGroupCall: IncomingGroupCall | null;
  outgoingGroupCall: OutgoingGroupCall | null;
  activeGroupCalls: string[];
  initiateCall: (receiverId: string, callType: 'AUDIO' | 'VIDEO', receiverName?: string, receiverAvatar?: string) => void;
  acceptCall: (callId: string, roomName: string) => void;
  /** Phase 4: Accept an escalated (mid-call) invitation — fetches token via REST, bypasses DB. */
  acceptEscalatedCall: (roomName: string, callType: 'AUDIO' | 'VIDEO') => Promise<void>;
  rejectCall: (callId: string, roomName: string, isGroup?: boolean, isEscalated?: boolean) => void;
  hangupCall: (callId: string) => void;
  cancelOutgoingCall: () => void;
  startGroupCall: (groupId: string, callType: 'AUDIO' | 'VIDEO') => void;
  cancelGroupCall: (groupId: string) => void;
  acceptGroupCall: (groupId: string) => void;
  rejectGroupCall: (groupId: string) => void;
  joinGroupCall: (groupId: string) => void;
  leaveGroupCall: (callId: string) => void;
  /**
   * Pass this as `onDisconnected` to `<LiveKitRoom>`.
   * Guards against the DataChannel error → onDisconnected → double-hangup cascade.
   */
  onLiveKitDisconnected: () => void;
}

export const CallContext = createContext<CallContextType | null>(null);

export const useCallContext = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCallContext must be used within a CallProvider');
  }
  return context;
};
