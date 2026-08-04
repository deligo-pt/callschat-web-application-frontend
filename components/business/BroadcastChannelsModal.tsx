"use client";

import React from "react";
import { BroadcastChannelsUI } from "./BroadcastChannelsUI";

export interface BroadcastChannelsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BroadcastChannelsModal({ isOpen, onClose }: BroadcastChannelsModalProps) {
  if (!isOpen) return null;
  return <BroadcastChannelsUI onClose={onClose} isEmbedded={false} />;
}
