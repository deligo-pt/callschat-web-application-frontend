import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '@/components/providers/SocketProvider';

export interface IncomingCall {
  callId: string;
  callerId: string;
  callType: 'AUDIO' | 'VIDEO';
}

export interface ActiveCall {
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

    const handleIncomingCall = (payload: IncomingCall) => {
      setIncomingCall(payload);
    };

    const handleCallConnected = (payload: ActiveCall) => {
      setIncomingCall(null);
      setActiveCall(payload);
    };

    const handleCallEnded = () => {
      setIncomingCall(null);
      setActiveCall(null);
    };

    socket.on('call:incoming', handleIncomingCall);
    socket.on('call:connected', handleCallConnected);
    socket.on('call:ended', handleCallEnded);
    socket.on('call:missed', handleCallEnded);
    socket.on('call:rejected', handleCallEnded);

    return () => {
      socket.off('call:incoming', handleIncomingCall);
      socket.off('call:connected', handleCallConnected);
      socket.off('call:ended', handleCallEnded);
      socket.off('call:missed', handleCallEnded);
      socket.off('call:rejected', handleCallEnded);
    };
  }, [socket]);

  const initiateCall = useCallback((receiverId: string, callType: 'AUDIO' | 'VIDEO') => {
    if (socket) {
      socket.emit('call:initiate', { receiverId, callType });
    }
  }, [socket]);

  const acceptCall = useCallback((callId: string) => {
    if (socket) {
      socket.emit('call:accept', { callId });
    }
  }, [socket]);

  const rejectCall = useCallback((callId: string) => {
    if (socket) {
      socket.emit('call:reject', { callId });
      setIncomingCall(null);
    }
  }, [socket]);

  const hangupCall = useCallback((roomName: string) => {
    if (socket) {
      socket.emit('call:hangup', { roomName });
      setActiveCall(null);
    }
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
