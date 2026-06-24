import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '@/components/providers/SocketProvider';
import { playNotificationSound } from '@/utils/sounds';

export interface IncomingCall {
  callId: string;
  callerId: string;
  callType: 'AUDIO' | 'VIDEO';
  roomName: string; // backend also sends roomName in the incoming payload
  isGroup?: boolean;
  groupId?: string;
}

export interface ActiveCall {
  callId: string;
  token: string;
  serverUrl: string;
  roomName: string;
  callType: 'AUDIO' | 'VIDEO';
  isGroup?: boolean;
}

export interface OutgoingCall {
  receiverId: string;
  callType: 'AUDIO' | 'VIDEO';
  callId?: string; // Set once backend acknowledges initiate
  receiverName?: string;
  receiverAvatar?: string;
}

export interface IncomingGroupCall {
  callId: string;
  groupId: string;
  initiatorName?: string;
  callType: 'AUDIO' | 'VIDEO';
}

export interface OutgoingGroupCall {
  groupId: string;
  callType: 'AUDIO' | 'VIDEO';
  callId?: string;
  token?: string;
  livekitUrl?: string;
  roomName?: string;
}

export const useCallSignaling = () => {
  const { socket } = useSocket();
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [outgoingCall, setOutgoingCall] = useState<OutgoingCall | null>(null);
  const [incomingGroupCall, setIncomingGroupCall] = useState<IncomingGroupCall | null>(null);
  const [outgoingGroupCall, setOutgoingGroupCall] = useState<OutgoingGroupCall | null>(null);
  const [activeGroupCalls, setActiveGroupCalls] = useState<string[]>([]);
  const pendingCancelRef = useRef<boolean>(false);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);

  const stopRingtone = useCallback(() => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
      ringtoneRef.current = null;
    }
  }, []);

  const playRingtone = useCallback(() => {
    stopRingtone();
    const audio = playNotificationSound('call');
    if (audio) {
      ringtoneRef.current = audio as HTMLAudioElement;
    }
  }, [stopRingtone]);

  useEffect(() => {
    if (!socket) return;

    // Catch-all debugger for socket events
    socket.onAny((event, ...args) => {
      console.log(`[Socket Debug] Received event: ${event}`, args);
    });

    const handleIncomingCall = (payload: IncomingCall) => {
      console.log('[Call] Incoming call received:', payload);
      playRingtone();
      setIncomingCall(payload);
    };

    const handleCallConnected = (payload: any) => {
      console.log('[Call] Call connected, joining LiveKit room:', payload);
      stopRingtone();
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
      stopRingtone();
      setIncomingCall(null);
      setOutgoingCall(null);
      setActiveCall(null);
    };

    const handleCallUnavailable = (payload?: unknown) => {
      console.warn('[Call] User unavailable:', payload);
      stopRingtone();
      setIncomingCall(null);
      setOutgoingCall(null);
      setActiveCall(null);
    };

    const handleCallError = (payload?: unknown) => {
      console.error('[Call] Call error:', payload);
      stopRingtone();
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

    const handleGroupCallActive = (payload: { groupId: string; callId: string; callType: 'AUDIO' | 'VIDEO'; roomName: string; startedBy: string }) => {
      console.log('[Call] Group call active in:', payload.groupId);
      stopRingtone();
      setActiveGroupCalls(prev => prev.includes(payload.groupId) ? prev : [...prev, payload.groupId]);
      
      // If we are currently ringing OUTGOING for this exact group, it means someone answered!
      setOutgoingGroupCall(prev => {
        if (prev && prev.groupId === payload.groupId) {
          // Transition to active call
          setActiveCall({
            callId: prev.callId || payload.callId,
            token: prev.token!,
            serverUrl: prev.livekitUrl!,
            roomName: prev.roomName!,
            callType: prev.callType,
            isGroup: true,
          });
          return null;
        }
        return prev;
      });
    };

    const handleGroupCallIncoming = (payload: IncomingGroupCall) => {
      console.log('[Call] Incoming group call:', payload);
      playRingtone();
      setIncomingGroupCall(payload);
    };

    const handleGroupCallTerminated = (payload: { groupId: string }) => {
      console.log('[Call] Group call terminated/missed in:', payload.groupId);
      stopRingtone();
      setIncomingGroupCall(prev => prev?.groupId === payload.groupId ? null : prev);
      setOutgoingGroupCall(prev => prev?.groupId === payload.groupId ? null : prev);
    };

    const handleGroupCallEnded = (payload: { groupId: string }) => {
      console.log('[Call] Group call ended in:', payload.groupId);
      stopRingtone();
      setActiveGroupCalls(prev => prev.filter(id => id !== payload.groupId));
    };

    socket.on('group:call_active', handleGroupCallActive);
    socket.on('group:call_incoming', handleGroupCallIncoming);
    socket.on('group:call_missed', handleGroupCallTerminated);
    socket.on('group:call_terminated', handleGroupCallTerminated);
    socket.on('group:call_ended', handleGroupCallEnded);

    // FCM Fallback Handler
    const handleFCMCall = (e: Event) => {
      const customEvent = e as CustomEvent;
      const data = customEvent.detail;
      
      console.log('[Call] FCM incoming call fallback triggered:', data);
      
      // Prevent deduplication if already ringing via sockets
      setIncomingCall((prev) => {
        if (prev && prev.callId === data.callId) return prev;
        
        return {
          callId: data.callId || data.routeId,
          callerId: data.callerId || data.routeId,
          callType: data.callType || 'VIDEO',
          roomName: data.roomName || data.callId || data.routeId,
          isGroup: data.isGroup === 'true' || data.type === 'GROUP_CALL',
          groupId: data.groupId || (data.isGroup === 'true' ? data.routeId : undefined),
        };
      });
    };

    window.addEventListener('fcm:incoming_call', handleFCMCall);

    return () => {
      socket.off('call:incoming', handleIncomingCall);
      socket.off('call:connected', handleCallConnected);
      socket.off('call:ended', handleCallEnded);
      socket.off('call:missed', handleCallEnded);
      socket.off('call:rejected', handleCallEnded);
      socket.off('call:unavailable', handleCallUnavailable);
      socket.off('call:error', handleCallError);
      socket.off('group:call_active', handleGroupCallActive);
      socket.off('group:call_incoming', handleGroupCallIncoming);
      socket.off('group:call_missed', handleGroupCallTerminated);
      socket.off('group:call_terminated', handleGroupCallTerminated);
      socket.off('group:call_ended', handleGroupCallEnded);
      window.removeEventListener('fcm:incoming_call', handleFCMCall);
    };
  }, [socket]);

  const initiateCall = useCallback((receiverId: string, callType: 'AUDIO' | 'VIDEO', receiverName?: string, receiverAvatar?: string) => {
    if (!socket) return;
    console.log('[Call] Initiating call to', receiverId, callType);
    pendingCancelRef.current = false;
    setOutgoingCall({ receiverId, callType, receiverName, receiverAvatar });
    
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

  const rejectCall = useCallback((callId: string, roomName: string, isGroup?: boolean) => {
    if (!socket) return;
    console.log('[Call] Rejecting call', callId);
    if (!isGroup) {
      socket.emit('call:reject', { callId, roomName });
    }
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
    
    setOutgoingGroupCall({ groupId, callType });

    socket.emit('group:call_start', { groupId, callType }, (response: any) => {
      if (response?.success && response?.token) {
        setOutgoingGroupCall({
          groupId,
          callType,
          callId: response.callId || groupId,
          token: response.token,
          livekitUrl: response.livekitUrl,
          roomName: response.roomName,
        });
      } else {
        setOutgoingGroupCall(null);
      }
    });
  }, [socket]);

  const cancelGroupCall = useCallback((groupId: string) => {
    if (!socket) return;
    console.log('[Call] Canceling group call for', groupId);
    socket.emit('group:call_cancel', { groupId });
    setOutgoingGroupCall(null);
  }, [socket]);

  const acceptGroupCall = useCallback((groupId: string) => {
    if (!socket) return;
    console.log('[Call] Accepting group call for', groupId);
    socket.emit('group:call_join', { groupId }, (response: any) => {
      if (response?.success && response?.token) {
        setIncomingGroupCall(null);
        setActiveCall({
          callId: response.callId || groupId,
          token: response.token,
          serverUrl: response.livekitUrl,
          roomName: response.roomName,
          callType: 'VIDEO', // typically join enables what user wants
          isGroup: true,
        });
      }
    });
  }, [socket]);

  const rejectGroupCall = useCallback((groupId: string) => {
    if (!socket) return;
    console.log('[Call] Rejecting group call for', groupId);
    socket.emit('group:call_reject', { groupId });
    setIncomingGroupCall(null);
  }, [socket]);

  const joinGroupCall = useCallback((groupId: string) => {
    if (!socket) return;
    console.log('[Call] Joining group call for', groupId);
    socket.emit('group:call_join', { groupId }, (response: any) => {
      if (response?.success && response?.token) {
        setActiveCall({
          callId: response.callId || groupId,
          token: response.token,
          serverUrl: response.livekitUrl,
          roomName: response.roomName,
          callType: 'VIDEO',
          isGroup: true,
        });
      }
    });
  }, [socket]);

  const leaveGroupCall = useCallback((callId: string) => {
    if (!socket) return;
    console.log('[Call] Leaving group call', callId);
    socket.emit('group:call_leave', { callId });
    setActiveCall(null);
  }, [socket]);

  return {
    incomingCall,
    activeCall,
    outgoingCall,
    incomingGroupCall,
    outgoingGroupCall,
    activeGroupCalls,
    initiateCall,
    acceptCall,
    rejectCall,
    hangupCall,
    cancelOutgoingCall,
    startGroupCall,
    cancelGroupCall,
    acceptGroupCall,
    rejectGroupCall,
    joinGroupCall,
    leaveGroupCall,
  };
};
