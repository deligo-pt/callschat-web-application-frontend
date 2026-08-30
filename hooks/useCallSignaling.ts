import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '@/components/providers/SocketProvider';
import { playNotificationSound } from '@/utils/sounds';
import { CallService } from '@/services/call.service';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

export interface IncomingCall {
  callId: string;
  callerId: string;
  callerName?: string;
  callerAvatar?: string | null;
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
  groupId?: string;
  peerName?: string;
  peerAvatar?: string;
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

export type OutgoingCallStatus =
  | 'CALLING'
  | 'RINGING'
  | 'WAITING'
  | 'BUSY'
  | 'UNAVAILABLE'
  | 'DECLINED'
  | 'NOT_ANSWERED';

export interface CallWaitingInfo {
  callId: string;
  callerId: string;
  callerName?: string;
  callerAvatar?: string | null;
  callType: 'AUDIO' | 'VIDEO';
  roomName: string;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export const useCallSignaling = () => {
  const { socket } = useSocket();
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [outgoingCall, setOutgoingCall] = useState<OutgoingCall | null>(null);
  const [outgoingCallStatus, setOutgoingCallStatus] = useState<OutgoingCallStatus>('CALLING');
  const [callWaiting, setCallWaiting] = useState<CallWaitingInfo | null>(null);
  const [incomingGroupCall, setIncomingGroupCall] = useState<IncomingGroupCall | null>(null);
  const [outgoingGroupCall, setOutgoingGroupCall] = useState<OutgoingGroupCall | null>(null);
  const [activeGroupCalls, setActiveGroupCalls] = useState<string[]>([]);
  const [isCallMinimized, setIsCallMinimized] = useState<boolean>(false);
  /**
   * WhatsApp-style reconnection state.
   * When non-null, one of the call participants lost their network and is in
   * the 45-second reconnect window. The UI should show a "Waiting for X..."
   * badge on the remote participant's tile.
   */
  const [reconnectingUserId, setReconnectingUserId] = useState<string | null>(null);

  /**
   * Tracks if the LOCAL user disconnected unexpectedly from LiveKit and is waiting
   * for Socket.io to recover and provide a fresh token.
   */
  const [isAwaitingLocalReconnect, setIsAwaitingLocalReconnect] = useState<boolean>(false);

  const activeCallRef = useRef<ActiveCall | null>(null);
  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  const pendingCancelRef = useRef<boolean>(false);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const pendingPeerRef = useRef<{ name?: string; avatar?: string }>({});
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

  // Safety net: always stop ringtone when the hook unmounts (e.g. user navigates away)
  useEffect(() => {
    return () => { stopRingtone(); };
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
      // Immediately acknowledge to server that our device is ringing
      if (socket && payload.callId) {
        socket.emit('call:ringing_ack', { callId: payload.callId });
      }

      pendingPeerRef.current = { 
        name: payload.callerName,
        avatar: payload.callerAvatar ?? undefined,
      };

      // If already in an active call, treat as Call Waiting (non-blocking banner)
      if (activeCallRef.current) {
        playNotificationSound('call_waiting');
        setCallWaiting({
          callId: payload.callId,
          callerId: payload.callerId,
          callerName: payload.callerName,
          callerAvatar: payload.callerAvatar,
          callType: payload.callType,
          roomName: payload.roomName,
        });
      } else {
        playRingtone();
        setIncomingCall(payload);
      }
    };

    const handleCallRinging = (payload: { callId: string }) => {
      console.log('[Call] Remote device is actively ringing:', payload);
      setOutgoingCallStatus('RINGING');
    };

    const handleCallBusy = (payload: { callId: string; reason?: string; message?: string }) => {
      console.log('[Call] Remote user is busy:', payload);
      stopRingtone();
      playNotificationSound('busy');
      setOutgoingCallStatus('BUSY');
      setTimeout(() => {
        setOutgoingCall(null);
        setOutgoingCallStatus('CALLING');
      }, 2500);
    };

    const handleCallWaiting = (payload: CallWaitingInfo | { status?: string; message?: string }) => {
      console.log('[Call] Call waiting notification received:', payload);
      if ('status' in payload && payload.status === 'WAITING') {
        setOutgoingCallStatus('WAITING');
        return;
      }
      playNotificationSound('call_waiting');
      setCallWaiting(payload as CallWaitingInfo);
    };

    const handleCallCancelled = (payload: { callId: string }) => {
      console.log('[Call] Call cancelled by caller:', payload);
      stopRingtone();
      setIncomingCall(prev => (prev?.callId === payload.callId ? null : prev));
      setCallWaiting(prev => (prev?.callId === payload.callId ? null : prev));
    };

    const handleCallConnected = (payload: any) => {
      console.log('[Call] Call connected, joining LiveKit room:', payload);
      stopRingtone();
      setIncomingCall(null);
      setOutgoingCall(null);
      setOutgoingCallStatus('CALLING');
      setActiveCall({
        callId: payload.callId,
        token: payload.token,
        serverUrl: payload.livekitUrl,
        roomName: payload.roomName,
        callType: payload.callType,
        peerName: pendingPeerRef.current.name,
        peerAvatar: pendingPeerRef.current.avatar,
      });
      pendingPeerRef.current = {};
    };

    const handleCallEnded = (payload?: { callId?: string; reason?: string }) => {
      console.log('[Call] Call ended/missed/rejected:', payload);

      // If a specific callId is received and we are currently in an active call, only tear down if it matches
      if (payload?.callId && activeCallRef.current) {
        const currentCallId = activeCallRef.current.callId;
        const currentRoomName = activeCallRef.current.roomName;
        if (payload.callId !== currentCallId && payload.callId !== currentRoomName) {
          console.log('[Call] Ignored call:ended for unrelated callId:', payload.callId);
          return;
        }
      }

      stopRingtone();
      playNotificationSound('call_ended');
      setIncomingCall(null);
      setOutgoingCall(null);
      setActiveCall(null);
      setCallWaiting(null);
      setReconnectingUserId(null); // Always clear the reconnecting overlay
      setIsAwaitingLocalReconnect(false);
      setOutgoingCallStatus('CALLING');

      // Show a descriptive toast when the call ended due to reconnect timeout
      if (payload?.reason === 'reconnect_timeout') {
        toast.error('Call ended', {
          description: 'The other person could not reconnect in time.',
          duration: 4000,
        });
      }
    };

    const handleCallRejected = (payload?: unknown) => {
      console.log('[Call] Call declined/rejected:', payload);
      stopRingtone();
      playNotificationSound('call_ended');
      setOutgoingCallStatus('DECLINED');
      setTimeout(() => {
        setOutgoingCall(null);
        setOutgoingCallStatus('CALLING');
      }, 2500);
    };

    const handleCallTimeout = (payload?: unknown) => {
      console.log('[Call] Call timed out (no answer):', payload);
      stopRingtone();
      playNotificationSound('call_ended');
      setOutgoingCallStatus('NOT_ANSWERED');
      setTimeout(() => {
        setOutgoingCall(null);
        setOutgoingCallStatus('CALLING');
      }, 2500);
    };

    const handleCallUnavailable = (payload?: unknown) => {
      console.warn('[Call] User unavailable:', payload);
      stopRingtone();
      playNotificationSound('call_ended');
      setOutgoingCallStatus('UNAVAILABLE');
      setTimeout(() => {
        setOutgoingCall(null);
        setOutgoingCallStatus('CALLING');
      }, 2500);
    };

    const handleCallError = (payload: { code?: string; message?: string } | unknown) => {
      const errPayload =
        payload && typeof payload === 'object'
          ? (payload as { code?: string; message?: string })
          : {};
      const code = errPayload.code;
      const message = errPayload.message || 'Call failed or ended';

      console.warn('[Call] Call signaling notice:', { code, message, payload });

      if (code === 'CALL_TIMEOUT') {
        handleCallTimeout(payload);
        return;
      }

      // INVITE_TIMEOUT / INVITE_FAILED are informational events for the
      // InviteParticipantModal only — they must NOT disturb the active call UI,
      // stop any ringtone, or clear outgoing/incoming call state.
      if (code === 'INVITE_TIMEOUT' || code === 'INVITE_FAILED') {
        return;
      }

      stopRingtone();
      setOutgoingCall(null);
      setIncomingCall(null);
      if (code === 'INITIATE_FAILED' || code === 'ACCEPT_FAILED') {
        setActiveCall(null);
      }
    };

    // -----------------------------------------------------------------------
    // call:reconnecting
    //
    // Received by the SURVIVING participant when the other user's network drops.
    // We store the disconnectedUserId so the <ActiveCallRoom> can render the
    // "Waiting for X..." badge on their tile.
    //
    // The call session is still alive in LiveKit — we do NOT dismount the room.
    // -----------------------------------------------------------------------
    const handleCallReconnecting = (payload: {
      callId: string;
      disconnectedUserId: string;
      reconnectWindowExpiresAt: string;
    }) => {
      console.log('[Call] Remote participant is reconnecting:', payload);
      playNotificationSound('reconnecting');
      setReconnectingUserId(payload.disconnectedUserId);
    };

    // -----------------------------------------------------------------------
    // call:reconnected
    //
    // Received by BOTH parties when the dropped user rejoins:
    //   A. The reconnecting user (our socket just reconnected + the server
    //      detected our RECONNECTING call): receives { callId, roomName,
    //      token, livekitUrl } — we re-mount the LiveKit room.
    //   B. The surviving participant: receives { callId, reconnectedUserId }
    //      — we clear the reconnecting overlay.
    // -----------------------------------------------------------------------
    const handleCallReconnected = (payload: {
      callId: string;
      roomName?: string;
      token?: string;
      livekitUrl?: string;
      reconnectedUserId?: string;
    }) => {
      console.log('[Call] Call reconnected:', payload);
      // Always clear the reconnecting overlay
      setReconnectingUserId(null);
      setIsAwaitingLocalReconnect(false); // Clear local reconnect state

      // Case A: we are the returning user and received a fresh token
      if (payload.token && payload.roomName && payload.livekitUrl) {
        setActiveCall(current => {
          if (!current) {
            // We were fully dismounted — restore the active call
            return {
              callId: payload.callId,
              token: payload.token!,
              serverUrl: payload.livekitUrl!,
              roomName: payload.roomName!,
              // Preserve call type and group from the pending peer ref if available
              callType: 'AUDIO',
            };
          }
          // Already mounted (LiveKit auto-reconnected) — just refresh the token
          return { ...current, token: payload.token!, callId: payload.callId };
        });
      }
      // Case B: nothing to do beyond clearing the overlay (already done above)
    };

    const handleAnsweredElsewhere = (payload: { callId?: string; reason?: string }) => {
      console.log('[Call] Call answered on another device:', payload);
      stopRingtone();
      setIncomingCall(null);
      setCallWaiting(null);
    };

    const handleGroupAnsweredElsewhere = (payload: { groupId: string; callId?: string }) => {
      console.log('[Call] Group call joined on another device:', payload);
      stopRingtone();
      setIncomingGroupCall(null);
    };

    socket.on('call:incoming', handleIncomingCall);
    socket.on('call:ringing', handleCallRinging);
    socket.on('call:busy', handleCallBusy);
    socket.on('call:waiting', handleCallWaiting);
    socket.on('call:cancelled', handleCallCancelled);
    socket.on('call:answered_elsewhere', handleAnsweredElsewhere);
    socket.on('call:reconnecting', handleCallReconnecting);
    socket.on('call:reconnected', handleCallReconnected);

    socket.on('call:connected', handleCallConnected);
    socket.on('call:ended', handleCallEnded);
    socket.on('call:missed', handleCallEnded);
    socket.on('call:rejected', handleCallRejected);
    socket.on('call:timeout', handleCallTimeout);
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
      setActiveGroupCalls(prev =>
        prev.includes(payload.groupId) ? prev : [...prev, payload.groupId],
      );

      // If we are currently ringing OUTGOING for this exact group, it means someone answered!
      setOutgoingGroupCall(prev => {
        if (prev && prev.groupId === payload.groupId) {
          stopRingtone(); // Stop any outgoing ringtone if applicable
          // Transition to active call
          setActiveCall({
            callId: prev.callId || payload.callId,
            token: prev.token!,
            serverUrl: prev.livekitUrl!,
            roomName: prev.roomName!,
            callType: prev.callType,
            isGroup: true,
            groupId: payload.groupId,
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
    socket.on('group:call_answered_elsewhere', handleGroupAnsweredElsewhere);

    // FCM Fallback Handler
    const handleFCMCall = (e: Event) => {
      const customEvent = e as CustomEvent;
      const data = customEvent.detail || {};

      console.log('[Call] FCM incoming call fallback triggered:', data);

      const resolvedCallId = data.callId || data.call_id || data.routeId;
      if (!resolvedCallId) return;

      const isVideo =
        data.is_video === 'true' ||
        data.callType === 'VIDEO' ||
        data.call_type?.toUpperCase() === 'VIDEO';

      const callerId = data.callerId || data.caller_id || data.routeId || '';
      const callerName = data.callerName || data.caller_name;
      const callerAvatar = data.callerAvatar || data.caller_avatar || null;
      const roomName = data.roomName || data.room_name || resolvedCallId;
      const isGroup =
        data.isGroup === 'true' ||
        data.type === 'GROUP_CALL' ||
        data.type === 'group_call';
      const groupId = data.groupId || data.group_id || (isGroup ? data.routeId : undefined);

      pendingPeerRef.current = {
        name: callerName,
        avatar: callerAvatar ?? undefined,
      };

      if (activeCallRef.current) {
        playNotificationSound('call_waiting');
        setCallWaiting({
          callId: resolvedCallId,
          callerId,
          callerName,
          callerAvatar,
          callType: isVideo ? 'VIDEO' : 'AUDIO',
          roomName,
        });
        return;
      }

      // Prevent deduplication if already ringing via sockets
      setIncomingCall(prev => {
        if (prev && prev.callId === resolvedCallId) return prev;
        playRingtone();

        return {
          callId: resolvedCallId,
          callerId,
          callerName,
          callerAvatar,
          callType: isVideo ? 'VIDEO' : 'AUDIO',
          roomName,
          isGroup,
          groupId,
        };
      });
    };

    window.addEventListener('fcm:incoming_call', handleFCMCall);

    return () => {
      socket.off('call:incoming', handleIncomingCall);
      socket.off('call:ringing', handleCallRinging);
      socket.off('call:busy', handleCallBusy);
      socket.off('call:waiting', handleCallWaiting);
      socket.off('call:cancelled', handleCallCancelled);
      socket.off('call:answered_elsewhere', handleAnsweredElsewhere);
      socket.off('call:connected', handleCallConnected);
      socket.off('call:ended', handleCallEnded);
      socket.off('call:missed', handleCallEnded);
      socket.off('call:rejected', handleCallRejected);
      socket.off('call:timeout', handleCallTimeout);
      socket.off('call:unavailable', handleCallUnavailable);
      socket.off('call:error', handleCallError);
      socket.off('call:reconnecting', handleCallReconnecting);
      socket.off('call:reconnected', handleCallReconnected);
      socket.off('group:call_active', handleGroupCallActive);
      socket.off('group:call_incoming', handleGroupCallIncoming);
      socket.off('group:call_missed', handleGroupCallTerminated);
      socket.off('group:call_terminated', handleGroupCallTerminated);
      socket.off('group:call_ended', handleGroupCallEnded);
      socket.off('group:call_answered_elsewhere', handleGroupAnsweredElsewhere);
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
      playRingtone();
      pendingPeerRef.current = { name: receiverName, avatar: receiverAvatar };
      // Set tentative outgoing state with CALLING status
      setOutgoingCallStatus('CALLING');
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
    [socket, playRingtone],
  );

  // -------------------------------------------------------------------------
  // acceptCall – standard 1v1 accept; emits call:accept to the server
  // -------------------------------------------------------------------------
  const acceptCall = useCallback(
    (callId: string, roomName: string, peerName?: string, peerAvatar?: string) => {
      if (!socket) return;
      console.log('[Call] Accepting call', callId);
      // Store peer info so call:connected handler can inject it into activeCall
      pendingPeerRef.current = { name: peerName, avatar: peerAvatar };
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
    async (roomName: string, callType: 'AUDIO' | 'VIDEO', peerName?: string, peerAvatar?: string) => {
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
          isGroup: true, // Mark as multi-party call so leaver doesn't terminate room
          peerName: peerName || pendingPeerRef.current.name,
          peerAvatar: peerAvatar || pendingPeerRef.current.avatar,
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
  // Call Waiting Actions (WhatsApp-style: End & Accept / Decline)
  // -------------------------------------------------------------------------
  const acceptCallWaiting = useCallback(() => {
    if (!socket || !callWaiting) return;
    console.log('[Call] Accepting call waiting:', callWaiting);

    // End current active call
    if (activeCall) {
      userInitiatedHangupRef.current = true;
      socket.emit('call:hangup', { callId: activeCall.callId });
    }

    // Accept waiting call
    socket.emit('call:accept', { callId: callWaiting.callId, roomName: callWaiting.roomName });
    pendingPeerRef.current = {
      name: callWaiting.callerName,
      avatar: callWaiting.callerAvatar ?? undefined,
    };
    setCallWaiting(null);
  }, [socket, callWaiting, activeCall]);

  const declineCallWaiting = useCallback(() => {
    if (!socket || !callWaiting) return;
    console.log('[Call] Declining call waiting:', callWaiting);
    socket.emit('call:reject', { callId: callWaiting.callId, roomName: callWaiting.roomName });
    setCallWaiting(null);
  }, [socket, callWaiting]);

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
      stopRingtone();
      userInitiatedHangupRef.current = true;
      if (activeCallRef.current?.isGroup) {
        socket.emit('group:call_leave', { callId });
      } else {
        socket.emit('call:hangup', { callId });
      }
      setActiveCall(null);
      setReconnectingUserId(null);
      setIsAwaitingLocalReconnect(false);
    },
    [socket],
  );

  // -------------------------------------------------------------------------
  // cancelOutgoingCall
  // -------------------------------------------------------------------------
  const cancelOutgoingCall = useCallback(() => {
    if (!socket || !outgoingCall) return;
    console.log('[Call] Canceling outgoing call');

    // ✅ Always stop ringtone immediately when the caller cancels
    stopRingtone();

    if (outgoingCall.callId) {
      socket.emit('call:hangup', { callId: outgoingCall.callId });
    } else {
      console.warn('[Call] Canceled before callId was received. Queuing hangup.');
      pendingCancelRef.current = true;
    }

    setOutgoingCall(null);
  }, [socket, outgoingCall, stopRingtone]);

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
      // ✅ Stop ringtone immediately when the caller cancels a group call
      stopRingtone();
      socket.emit('group:call_cancel', { groupId });
      setOutgoingGroupCall(null);
    },
    [socket, stopRingtone],
  );

  const acceptGroupCall = useCallback(
    (groupId: string) => {
      if (!socket) return;
      console.log('[Call] Accepting group call for', groupId);
      stopRingtone();
      socket.emit('group:call_join', { groupId }, (response: any) => {
        if (response?.success && response?.token) {
          setIncomingGroupCall(null);
          setActiveCall({
            callId: response.callId || groupId,
            token: response.token,
            serverUrl: response.livekitUrl,
            roomName: response.roomName,
            callType: response.callType || 'AUDIO',
            isGroup: true,
            groupId: groupId,
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
      stopRingtone();
      socket.emit('group:call_reject', { groupId });
      setIncomingGroupCall(null);
    },
    [socket],
  );

  const joinGroupCall = useCallback(
    (groupId: string) => {
      if (!socket) return;
      console.log('[Call] Joining group call for', groupId);
      stopRingtone();
      socket.emit('group:call_join', { groupId }, (response: any) => {
        if (response?.success && response?.token) {
          setActiveCall({
            callId: response.callId || groupId,
            token: response.token,
            serverUrl: response.livekitUrl,
            roomName: response.roomName,
            callType: response.callType || 'AUDIO',
            isGroup: true,
            groupId: groupId,
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
      stopRingtone();
      userInitiatedHangupRef.current = true;
      socket.emit('group:call_leave', { callId });
      setActiveCall(null);
    },
    [socket],
  );

  // -------------------------------------------------------------------------
  // onLiveKitDisconnected (UPDATED — WhatsApp-style reconnect)
  //
  // Pass this as the `onDisconnected` prop of <LiveKitRoom>.
  //
  // PREVIOUS BEHAVIOR: any unexpected disconnect → emit call:hangup → call ended.
  // This caused calls to terminate on every brief network hiccup.
  //
  // NEW BEHAVIOR (WhatsApp-style):
  //   - User-initiated hangup:   unchanged. userInitiatedHangupRef prevents a
  //     duplicate call:hangup from being emitted by this handler.
  //   - Unexpected disconnect:   we do NOT emit call:hangup. The server's
  //     `socket.on('disconnect')` handler already transitions the call to
  //     RECONNECTING and emits call:reconnecting to the other party.
  //     LiveKit itself will attempt to reconnect automatically for up to
  //     the room's departureTimeout (45 seconds). If it succeeds, the
  //     server's reconnect probe fires call:reconnected to both parties.
  //     If it times out, the background sweeper ends the call and both
  //     parties receive call:ended.
  //
  //   The local user sees the useConnectionState() RECONNECTING overlay
  //   in <ActiveCallRoom> for the duration of the LiveKit auto-reconnect.
  // -------------------------------------------------------------------------
  const onLiveKitDisconnected = useCallback(() => {
    if (userInitiatedHangupRef.current) {
      // The disconnect was caused by our own hangupCall / leaveGroupCall.
      // The socket event was already emitted — nothing more to do.
      console.log('[Call] LiveKit disconnected (user-initiated — no-op)');
      userInitiatedHangupRef.current = false;
      return;
    }

    // Unexpected disconnect (network drop, DataChannel error, etc.).
    // We intentionally do NOT emit call:hangup here.
    console.warn(
      '[Call] LiveKit disconnected unexpectedly — reconnect window open, awaiting server recovery',
    );
    setIsAwaitingLocalReconnect(true); // Trigger local overlay
    
    // Clear the active call state ONLY if the user's socket also dropped
    // and the server confirmed the call ended (via call:ended listener above).
    // Do NOT clear it here — it would dismount the LiveKitRoom before LiveKit
    // has a chance to auto-reconnect.
  }, []);

  return {
    incomingCall,
    activeCall,
    outgoingCall,
    outgoingCallStatus,
    callWaiting,
    incomingGroupCall,
    outgoingGroupCall,
    activeGroupCalls,
    reconnectingUserId,
    isAwaitingLocalReconnect,
    initiateCall,
    acceptCall,
    acceptEscalatedCall,
    rejectCall,
    acceptCallWaiting,
    declineCallWaiting,
    hangupCall,
    cancelOutgoingCall,
    startGroupCall,
    cancelGroupCall,
    acceptGroupCall,
    rejectGroupCall,
    joinGroupCall,
    leaveGroupCall,
    onLiveKitDisconnected,
    isCallMinimized,
    setIsCallMinimized,
  };
};

