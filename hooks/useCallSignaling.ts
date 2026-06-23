import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '@/components/providers/SocketProvider';

export interface IncomingCall {
  callId: string;
  callerId: string;
  callType: 'AUDIO' | 'VIDEO';
  roomName: string; // backend also sends roomName in the incoming payload
}

export interface ActiveCall {
  callId: string;
  token: string;
  serverUrl: string;
  roomName: string;
  callType: 'AUDIO' | 'VIDEO';
}

export interface OutgoingCall {
  receiverId: string;
  callType: 'AUDIO' | 'VIDEO';
  callId?: string; // Set once backend acknowledges initiate
}

export const useCallSignaling = () => {
  const { socket } = useSocket();
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [outgoingCall, setOutgoingCall] = useState<OutgoingCall | null>(null);
  const [activeGroupCalls, setActiveGroupCalls] = useState<string[]>([]);
  const pendingCancelRef = useRef<boolean>(false);

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

    const handleCallConnected = (payload: any) => {
      console.log('[Call] Call connected, joining LiveKit room:', payload);
      setIncomingCall(null);
      setOutgoingCall(null);
      setActiveCall({
        callId: payload.callId,
        token: payload.token,
        serverUrl: payload.livekitUrl,
        roomName: payload.roomName,
        callType: payload.callType,
      });
    };

    const handleCallEnded = (payload?: unknown) => {
      console.log('[Call] Call ended/missed/rejected:', payload);
      setIncomingCall(null);
      setOutgoingCall(null);
      setActiveCall(null);
    };

    const handleCallUnavailable = (payload?: unknown) => {
      console.warn('[Call] User unavailable:', payload);
      setIncomingCall(null);
      setOutgoingCall(null);
      setActiveCall(null);
    };

    const handleCallError = (payload?: unknown) => {
      console.error('[Call] Call error:', payload);
      setIncomingCall(null);
      setOutgoingCall(null);
      setActiveCall(null);
    };

    socket.on('call:incoming', handleIncomingCall);
    socket.on('call:connected', handleCallConnected);
    socket.on('call:ended', handleCallEnded);
    socket.on('call:missed', handleCallEnded);
    socket.on('call:rejected', handleCallEnded);
    socket.on('call:unavailable', handleCallUnavailable);
    socket.on('call:error', handleCallError);

    const handleGroupCallActive = (payload: { groupId: string }) => {
      console.log('[Call] Group call active in:', payload.groupId);
      setActiveGroupCalls(prev => prev.includes(payload.groupId) ? prev : [...prev, payload.groupId]);
    };

    const handleGroupCallEnded = (payload: { groupId: string }) => {
      console.log('[Call] Group call ended in:', payload.groupId);
      setActiveGroupCalls(prev => prev.filter(id => id !== payload.groupId));
    };

    socket.on('group:call_active', handleGroupCallActive);
    socket.on('group:call_ended', handleGroupCallEnded);

    return () => {
      socket.off('call:incoming', handleIncomingCall);
      socket.off('call:connected', handleCallConnected);
      socket.off('call:ended', handleCallEnded);
      socket.off('call:missed', handleCallEnded);
      socket.off('call:rejected', handleCallEnded);
      socket.off('call:unavailable', handleCallUnavailable);
      socket.off('call:error', handleCallError);
      socket.off('group:call_active', handleGroupCallActive);
      socket.off('group:call_ended', handleGroupCallEnded);
    };
  }, [socket]);

  const initiateCall = useCallback((receiverId: string, callType: 'AUDIO' | 'VIDEO') => {
    if (!socket) return;
    console.log('[Call] Initiating call to', receiverId, callType);
    pendingCancelRef.current = false;
    setOutgoingCall({ receiverId, callType });
    
    socket.emit('call:initiate', { receiverId, callType }, (response: any) => {
      if (response?.success && response?.callId) {
        if (pendingCancelRef.current) {
          // User canceled before we even got the callId. Hang up immediately.
          console.log('[Call] Rapid cancel detected. Hanging up now with callId:', response.callId);
          socket.emit('call:hangup', { callId: response.callId });
          pendingCancelRef.current = false;
          setOutgoingCall(null);
        } else {
          setOutgoingCall(prev => prev ? { ...prev, callId: response.callId } : null);
        }
      }
    });
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

  const cancelOutgoingCall = useCallback(() => {
    if (!socket || !outgoingCall) return;
    console.log('[Call] Canceling outgoing call');
    
    if (outgoingCall.callId) {
      socket.emit('call:hangup', { callId: outgoingCall.callId });
    } else {
      // Race condition: canceled before server responded with callId.
      // Set the ref so the callback hangs up automatically when it arrives.
      console.warn('[Call] Canceled before callId was received. Queuing hangup.');
      pendingCancelRef.current = true;
    }
    
    setOutgoingCall(null);
  }, [socket, outgoingCall]);

  const startGroupCall = useCallback((groupId: string, callType: 'AUDIO' | 'VIDEO') => {
    if (!socket) return;
    console.log('[Call] Starting group call for', groupId, callType);
    socket.emit('group:call_start', { groupId, callType }, (response: any) => {
      if (response?.success && response?.token) {
        setActiveCall({
          callId: response.callId,
          token: response.token,
          serverUrl: response.livekitUrl,
          roomName: response.roomName,
          callType,
        });
      }
    });
  }, [socket]);

  const joinGroupCall = useCallback((groupId: string) => {
    if (!socket) return;
    console.log('[Call] Joining group call for', groupId);
    socket.emit('group:call_join', { groupId }, (response: any) => {
      if (response?.success && response?.token) {
        // Active group calls don't explicitly pass callType down, 
        // we can default to VIDEO for UI layout. The user can disable their camera.
        setActiveCall({
          callId: response.callId,
          token: response.token,
          serverUrl: response.livekitUrl,
          roomName: response.roomName,
          callType: 'VIDEO',
        });
      }
    });
  }, [socket]);

  return {
    incomingCall,
    activeCall,
    outgoingCall,
    activeGroupCalls,
    initiateCall,
    acceptCall,
    rejectCall,
    hangupCall,
    cancelOutgoingCall,
    startGroupCall,
    joinGroupCall,
  };
};
