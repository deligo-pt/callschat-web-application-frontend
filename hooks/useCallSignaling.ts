import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '@/components/providers/SocketProvider';
import { playNotificationSound } from '@/utils/sounds';
import { CallService } from '@/services/call.service';

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

export interface IncomingCall {
  callId: string;
  callerId: string;
  callerName?: string;
  callType: 'AUDIO' | 'VIDEO';
  roomName: string; // backend also sends roomName in the incoming payload
  isGroup?: boolean;
  groupId?: string;
  /** True when this is a mid-call escalation (3rd person invited into 1v1). */
  isEscalatedCall?: boolean;
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

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

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
  /**
   * Set to true immediately before emitting call:hangup so that the LiveKit
   * `onDisconnected` callback knows the disconnect was user-initiated and
   * should NOT emit another hangup (which would be a duplicate).
   */
  const userInitiatedHangupRef = useRef<boolean>(false);

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

    // -----------------------------------------------------------------------
    // call:incoming
    //
    // Handles both:
    //   A. Standard 1v1 incoming call  (isEscalatedCall is absent / false)
    //   B. Escalated join invitation   (isEscalatedCall === true)
    //
    // In both cases we ring the UI. The difference is in the Accept action
    // which is handled in acceptCall / acceptEscalatedCall below.
    // -----------------------------------------------------------------------
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

    const handleCallError = (payload: { code?: string; message?: string } | unknown) => {
      console.error('[Call] Call error:', payload);

      const code = (payload as { code?: string })?.code;

      // INVITE_TIMEOUT / INVITE_FAILED are informational events for the
      // InviteParticipantModal only — they must NOT disturb the active call UI,
      // stop any ringtone, or clear outgoing/incoming call state.  The modal
      // has its own call:error listener that handles these codes.
      if (code === 'INVITE_TIMEOUT' || code === 'INVITE_FAILED') {
        return;
      }

      stopRingtone();
      // IMPORTANT: Do NOT clear activeCall on call:error.
      //
      // call:error is emitted for per-operation failures (bad payload, user
      // offline, invite failed, etc.).  If we clear activeCall here, any
      // transient socket error during an active call would kill the live room
      // and trigger the onDisconnected → hangupCall cascade, ending the call
      // for BOTH parties.
      //
      // Errors that should close the call UI (call:ended, call:missed,
      // call:rejected) are handled by handleCallEnded above.
      //
      // The InviteParticipantModal has its own call:error listener for
      // INVITE_FAILED / INVITE_TIMEOUT errors — it does NOT rely on this handler.
      setOutgoingCall(null);
      setIncomingCall(null);
      // Only clear activeCall if the error code explicitly signals call failure
      // (e.g. INITIATE_FAILED before any room was joined).  A connected call
      // should survive any error that doesn't come via call:ended.
      if (code === 'INITIATE_FAILED' || code === 'ACCEPT_FAILED') {
        setActiveCall(null);
      }
    };


    socket.on('call:incoming', handleIncomingCall);
    socket.on('call:connected', handleCallConnected);
    socket.on('call:ended', handleCallEnded);
    socket.on('call:missed', handleCallEnded);
    socket.on('call:rejected', handleCallEnded);
    socket.on('call:unavailable', handleCallUnavailable);
    socket.on('call:error', handleCallError);

    const handleGroupCallActive = (payload: {
      groupId: string;
      callId: string;
      callType: 'AUDIO' | 'VIDEO';
      roomName: string;
      startedBy: string;
    }) => {
      console.log('[Call] Group call active in:', payload.groupId);
      stopRingtone();
      setActiveGroupCalls(prev =>
        prev.includes(payload.groupId) ? prev : [...prev, payload.groupId],
      );

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
      setIncomingGroupCall(prev => (prev?.groupId === payload.groupId ? null : prev));
      setOutgoingGroupCall(prev => (prev?.groupId === payload.groupId ? null : prev));
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
      setIncomingCall(prev => {
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

  // -------------------------------------------------------------------------
  // initiateCall
  // -------------------------------------------------------------------------
  const initiateCall = useCallback(
    (
      receiverId: string,
      callType: 'AUDIO' | 'VIDEO',
      receiverName?: string,
      receiverAvatar?: string,
    ) => {
      if (!socket) return;
      console.log('[Call] Initiating call to', receiverId, callType);
      pendingCancelRef.current = false;
      setOutgoingCall({ receiverId, callType, receiverName, receiverAvatar });

      socket.emit('call:initiate', { receiverId, callType }, (response: any) => {
        if (response?.success && response?.callId) {
          if (pendingCancelRef.current) {
            console.log(
              '[Call] Rapid cancel detected. Hanging up now with callId:',
              response.callId,
            );
            socket.emit('call:hangup', { callId: response.callId });
            pendingCancelRef.current = false;
            setOutgoingCall(null);
          } else {
            setOutgoingCall(prev => (prev ? { ...prev, callId: response.callId } : null));
          }
        }
      });
    },
    [socket],
  );

  // -------------------------------------------------------------------------
  // acceptCall – standard 1v1 accept; emits call:accept to the server
  // -------------------------------------------------------------------------
  const acceptCall = useCallback(
    (callId: string, roomName: string) => {
      if (!socket) return;
      console.log('[Call] Accepting call', callId);
      socket.emit('call:accept', { callId, roomName });
    },
    [socket],
  );

  // -------------------------------------------------------------------------
  // acceptEscalatedCall
  //
  // Phase 4 critical path: the user accepted an escalated call:incoming.
  // We do NOT emit call:accept (that hits the DB).  Instead we:
  //   1. Hit GET /api/v1/calls/token to get a LiveKit JWT for the room.
  //   2. Immediately set activeCall so <LiveKitRoom> mounts.
  //   3. Dismiss the incoming call UI.
  //
  // A synthetic callId is generated locally since no server-side CallLog row
  // was created for this escalation.
  // -------------------------------------------------------------------------
  const acceptEscalatedCall = useCallback(
    async (roomName: string, callType: 'AUDIO' | 'VIDEO') => {
      console.log('[Call] Accepting escalated call for room', roomName);
      stopRingtone();
      setIncomingCall(null);

      try {
        const result = await CallService.getCallToken(roomName, callType);

        setActiveCall({
          // Use the roomName as a stable local ID since no CallLog was created
          callId: result.roomName,
          token: result.token,
          serverUrl: result.livekitUrl,
          roomName: result.roomName,
          callType,
        });
      } catch (err) {
        console.error('[Call] Failed to obtain token for escalated call:', err);
      }
    },
    [stopRingtone],
  );

  // -------------------------------------------------------------------------
  // rejectCall – sends call:reject for standard calls; pure dismiss for escalated
  // -------------------------------------------------------------------------
  const rejectCall = useCallback(
    (callId: string, roomName: string, isGroup?: boolean, isEscalated?: boolean) => {
      if (!socket) return;
      console.log('[Call] Rejecting call', callId, { isEscalated });

      if (!isGroup && !isEscalated) {
        // Standard 1v1: notify the caller
        socket.emit('call:reject', { callId, roomName });
      }
      // Escalated: just dismiss locally — no server event needed since no
      // CallLog record was created for this invitation.
      stopRingtone();
      setIncomingCall(null);
    },
    [socket, stopRingtone],
  );

  // -------------------------------------------------------------------------
  // hangupCall
  //
  // Always call THIS (not hangupCall directly) from UI hang-up buttons.
  // Sets the userInitiatedHangupRef so onDisconnected in ActiveCallRoom
  // knows it was intentional and does NOT emit a second hangup.
  // -------------------------------------------------------------------------
  const hangupCall = useCallback(
    (callId: string) => {
      if (!socket) return;
      console.log('[Call] Hanging up call', callId);
      userInitiatedHangupRef.current = true;
      socket.emit('call:hangup', { callId });
      setActiveCall(null);
    },
    [socket],
  );

  // -------------------------------------------------------------------------
  // cancelOutgoingCall
  // -------------------------------------------------------------------------
  const cancelOutgoingCall = useCallback(() => {
    if (!socket || !outgoingCall) return;
    console.log('[Call] Canceling outgoing call');

    if (outgoingCall.callId) {
      socket.emit('call:hangup', { callId: outgoingCall.callId });
    } else {
      console.warn('[Call] Canceled before callId was received. Queuing hangup.');
      pendingCancelRef.current = true;
    }

    setOutgoingCall(null);
  }, [socket, outgoingCall]);

  // -------------------------------------------------------------------------
  // Group call actions
  // -------------------------------------------------------------------------
  const startGroupCall = useCallback(
    (groupId: string, callType: 'AUDIO' | 'VIDEO') => {
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
    },
    [socket],
  );

  const cancelGroupCall = useCallback(
    (groupId: string) => {
      if (!socket) return;
      console.log('[Call] Canceling group call for', groupId);
      socket.emit('group:call_cancel', { groupId });
      setOutgoingGroupCall(null);
    },
    [socket],
  );

  const acceptGroupCall = useCallback(
    (groupId: string) => {
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
            callType: 'VIDEO',
            isGroup: true,
          });
        }
      });
    },
    [socket],
  );

  const rejectGroupCall = useCallback(
    (groupId: string) => {
      if (!socket) return;
      console.log('[Call] Rejecting group call for', groupId);
      socket.emit('group:call_reject', { groupId });
      setIncomingGroupCall(null);
    },
    [socket],
  );

  const joinGroupCall = useCallback(
    (groupId: string) => {
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
    },
    [socket],
  );

  const leaveGroupCall = useCallback(
    (callId: string) => {
      if (!socket) return;
      console.log('[Call] Leaving group call', callId);
      userInitiatedHangupRef.current = true;
      socket.emit('group:call_leave', { callId });
      setActiveCall(null);
    },
    [socket],
  );

  // -------------------------------------------------------------------------
  // onLiveKitDisconnected
  //
  // Pass this as the `onDisconnected` prop of <LiveKitRoom>.
  //
  // LiveKit fires onDisconnected in many situations that are NOT user hang-ups:
  //   - DataChannel errors during WebRTC negotiation
  //   - Brief network drops that trigger reconnection
  //   - The component unmounting because hangupCall() already set activeCall=null
  //
  // Without this guard, ANY disconnect → hangupCall() → call:hangup emitted →
  // call:ended sent to the other party, killing the call unexpectedly.
  //
  // Fix: only emit call:hangup from onDisconnected when the disconnect was
  // NOT already handled by a user-initiated hangup/leave action.
  // -------------------------------------------------------------------------
  const onLiveKitDisconnected = useCallback(() => {
    if (userInitiatedHangupRef.current) {
      // The disconnect was caused by our own hangupCall / leaveGroupCall.
      // The socket event was already emitted — nothing more to do.
      console.log('[Call] LiveKit disconnected (user-initiated — no-op)');
      userInitiatedHangupRef.current = false;
      return;
    }

    // Unexpected disconnect (network drop, DataChannel error, server closed).
    // Read the current call state from a functional update so we have the
    // latest callId without a stale closure.
    console.warn('[Call] LiveKit disconnected unexpectedly — cleaning up local state');
    setActiveCall(currentCall => {
      if (currentCall && socket) {
        // Notify the backend so the other party sees call:ended in real-time.
        // Without this, the other party’s UI stays connected until they hang up.
        socket.emit('call:hangup', { callId: currentCall.callId });
      }
      return null;
    });
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
    acceptEscalatedCall,
    rejectCall,
    hangupCall,
    cancelOutgoingCall,
    startGroupCall,
    cancelGroupCall,
    acceptGroupCall,
    rejectGroupCall,
    joinGroupCall,
    leaveGroupCall,
    onLiveKitDisconnected,
  };
};
