"use client";

import { createContext, useContext } from 'react';
import { IncomingCall, ActiveCall } from '@/hooks/useCallSignaling';

export interface CallContextType {
  incomingCall: IncomingCall | null;
  activeCall: ActiveCall | null;
  initiateCall: (receiverId: string, callType: 'AUDIO' | 'VIDEO') => void;
  acceptCall: (callId: string, roomName: string) => void;
  rejectCall: (callId: string, roomName: string) => void;
  hangupCall: (callId: string) => void;
}

export const CallContext = createContext<CallContextType | null>(null);

export const useCallContext = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCallContext must be used within a CallProvider');
  }
  return context;
};
