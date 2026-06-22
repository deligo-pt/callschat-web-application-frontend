import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '@/components/providers/SocketProvider';

export interface IncomingCall {
  callId: string;
  callerId: string;
  callType: 'AUDIO' | 'VIDEO';
  roomName: string; // backend also sends roomName in the incoming payload
}

export interface ActiveCall {
  callId: string;  // store callId so we can emit call:hangup correctly
  token: string;
  livekitUrl: string;
  roomName: string;
}

export const useCallSignaling = () => {
  const { socket } = useSocket();
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);

  useEffect(() => {
    if (!socket) return;

    // Catch-all debugger for socket events
    socket.onAny((event, ...args) => {
      console.log(`[Socket Debug] Received event: ${event}`, args);
    });

    const handleIncomingCall = (payload: IncomingCall) => {
      console.log('[Call] Incoming call received:', payload);
      setIncomingCall(payload);
    };

    const handleCallConnected = (payload: ActiveCall) => {
      console.log('[Call] Call connected, joining LiveKit room:', payload);
      setIncomingCall(null);
      setActiveCall(payload);
    };

    const handleCallEnded = (payload?: unknown) => {
      console.log('[Call] Call ended/missed/rejected:', payload);
      setIncomingCall(null);
      setActiveCall(null);
    };

    const handleCallUnavailable = (payload?: unknown) => {
      console.warn('[Call] User unavailable:', payload);
      setIncomingCall(null);
      setActiveCall(null);
    };

    const handleCallError = (payload?: unknown) => {
      console.error('[Call] Call error:', payload);
      setIncomingCall(null);
      setActiveCall(null);
    };

    socket.on('call:incoming', handleIncomingCall);
    socket.on('call:connected', handleCallConnected);
    socket.on('call:ended', handleCallEnded);
    socket.on('call:missed', handleCallEnded);
    socket.on('call:rejected', handleCallEnded);
    socket.on('call:unavailable', handleCallUnavailable);
    socket.on('call:error', handleCallError);

    return () => {
      socket.off('call:incoming', handleIncomingCall);
      socket.off('call:connected', handleCallConnected);
      socket.off('call:ended', handleCallEnded);
      socket.off('call:missed', handleCallEnded);
      socket.off('call:rejected', handleCallEnded);
      socket.off('call:unavailable', handleCallUnavailable);
      socket.off('call:error', handleCallError);
    };
  }, [socket]);

  const initiateCall = useCallback((receiverId: string, callType: 'AUDIO' | 'VIDEO') => {
    if (!socket) return;
    console.log('[Call] Initiating call to', receiverId, callType);
    socket.emit('call:initiate', { receiverId, callType });
  }, [socket]);

  // FIX: Backend call:accept requires { callId, roomName }
  const acceptCall = useCallback((callId: string, roomName: string) => {
    if (!socket) return;
    console.log('[Call] Accepting call', callId);
    socket.emit('call:accept', { callId, roomName });
  }, [socket]);

  const rejectCall = useCallback((callId: string, roomName: string) => {
    if (!socket) return;
    console.log('[Call] Rejecting call', callId);
    socket.emit('call:reject', { callId, roomName });
    setIncomingCall(null);
  }, [socket]);

  // FIX: Backend call:hangup requires { callId } not { roomName }
  const hangupCall = useCallback((callId: string) => {
    if (!socket) return;
    console.log('[Call] Hanging up call', callId);
    socket.emit('call:hangup', { callId });
    setActiveCall(null);
  }, [socket]);

  return {
    incomingCall,
    activeCall,
    initiateCall,
    acceptCall,
    rejectCall,
    hangupCall,
  };
};
