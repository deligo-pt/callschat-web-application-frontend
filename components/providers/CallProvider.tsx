"use client";

import React from 'react';
import { useCallSignaling } from '@/hooks/useCallSignaling';
import { CallContext } from '@/components/providers/CallContext';
import { IncomingCallModal } from '@/components/call/IncomingCallModal';
import { OutgoingCallModal } from '@/components/call/OutgoingCallModal';
import { GroupIncomingModal } from '@/components/call/GroupIncomingModal';
import { GroupOutgoingModal } from '@/components/call/GroupOutgoingModal';
import { ActiveCallRoom } from '@/components/call/ActiveCallRoom';
import { CallWaitingBanner } from '@/components/call/CallWaitingBanner';

export const CallProvider = ({ children }: { children: React.ReactNode }) => {
  const callSignaling = useCallSignaling();

  return (
    <CallContext.Provider value={callSignaling}>
      {children}
      <IncomingCallModal />
      <OutgoingCallModal />
      <CallWaitingBanner />
      <GroupIncomingModal />
      <GroupOutgoingModal />
      <ActiveCallRoom />
    </CallContext.Provider>
  );
};
