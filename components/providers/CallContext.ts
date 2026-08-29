"use client";

import { createContext, useContext } from 'react';
import {
  IncomingCall,
  ActiveCall,
  OutgoingCall,
  IncomingGroupCall,
  OutgoingGroupCall,
  OutgoingCallStatus,
  CallWaitingInfo,
} from '@/hooks/useCallSignaling';

export interface CallContextType {
  incomingCall: IncomingCall | null;
  activeCall: ActiveCall | null;
  outgoingCall: OutgoingCall | null;
  outgoingCallStatus: OutgoingCallStatus;
  callWaiting: CallWaitingInfo | null;
  incomingGroupCall: IncomingGroupCall | null;
  outgoingGroupCall: OutgoingGroupCall | null;
  activeGroupCalls: string[];
  initiateCall: (receiverId: string, callType: 'AUDIO' | 'VIDEO', receiverName?: string, receiverAvatar?: string) => void;
  acceptCall: (callId: string, roomName: string, peerName?: string, peerAvatar?: string) => void;
  acceptEscalatedCall: (roomName: string, callType: 'AUDIO' | 'VIDEO', peerName?: string, peerAvatar?: string) => Promise<void>;
  rejectCall: (callId: string, roomName: string, isGroup?: boolean, isEscalated?: boolean) => void;
  acceptCallWaiting: () => void;
  declineCallWaiting: () => void;
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
  /**
   * WhatsApp-style reconnection state (null when call is stable).
   * When non-null, contains the userId of the participant whose network dropped.
   * The <ActiveCallRoom> uses this to show a "Waiting for X..." overlay.
   */
  reconnectingUserId: string | null;
  /** Tracks if WE disconnected abruptly from LiveKit and are awaiting socket recovery */
  isAwaitingLocalReconnect: boolean;
  isCallMinimized: boolean;
  setIsCallMinimized: (val: boolean) => void;
}


export const CallContext = createContext<CallContextType | null>(null);

export const useCallContext = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCallContext must be used within a CallProvider');
  }
  return context;
};
