"use client";

import React from "react";
import { useMediaDeviceSelect } from "@livekit/components-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mic, Video, Volume2, Check, SlidersHorizontal, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeviceSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export const DeviceSettingsModal = ({ open, onClose }: DeviceSettingsModalProps) => {
  const {
    devices: audioInputs,
    activeDeviceId: activeAudioInput,
    setActiveMediaDevice: setActiveAudioInput,
  } = useMediaDeviceSelect({ 
    kind: "audioinput", 
    requestPermissions: true,
  });

  const {
    devices: videoInputs,
    activeDeviceId: activeVideoInput,
    setActiveMediaDevice: setActiveVideoInput,
  } = useMediaDeviceSelect({ 
    kind: "videoinput", 
    requestPermissions: true,
  });

  const {
    devices: audioOutputs,
    activeDeviceId: activeAudioOutput,
    setActiveMediaDevice: setActiveAudioOutput,
  } = useMediaDeviceSelect({ 
    kind: "audiooutput", 
    requestPermissions: true,
  });

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent 
        overlayClassName="z-[150] bg-black/80 backdrop-blur-xs"
        className="z-[200] max-w-md bg-[#182229] border border-white/15 text-[#E9EDEF] rounded-3xl p-6 shadow-2xl backdrop-blur-2xl animate-in zoom-in-95 duration-200"
        showCloseButton={false}
      >
        <DialogHeader className="mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#00A884]/20 border border-[#00A884]/30 text-[#25D366]">
                <SlidersHorizontal className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-[#E9EDEF]">
                  Audio & Video Settings
                </DialogTitle>
                <p className="text-xs text-[#8696A0] mt-0.5">
                  Select your preferred input and output devices
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-[#8696A0] hover:text-[#E9EDEF] hover:bg-white/10 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-1 max-h-[65vh] overflow-y-auto pr-1">
          {/* Microphone Selector */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#8696A0] uppercase tracking-wider">
              <Mic className="h-3.5 w-3.5 text-[#00A884]" />
              <span>Microphone</span>
            </div>
            <div className="flex flex-col gap-1.5 rounded-2xl bg-[#111B21] border border-white/10 p-2">
              {audioInputs.length === 0 ? (
                <div className="flex items-center gap-2 p-2 text-xs text-[#8696A0]">
                  <AlertCircle className="h-4 w-4 text-amber-400" />
                  <span>No microphones detected</span>
                </div>
              ) : (
                audioInputs.map((device, idx) => {
                  const isSelected = device.deviceId === activeAudioInput || (!activeAudioInput && idx === 0);
                  return (
                    <button
                      key={device.deviceId || idx}
                      onClick={async () => {
                        try {
                          await setActiveAudioInput(device.deviceId);
                        } catch (err) {
                          console.warn("[DeviceSettings] Failed to set mic:", err);
                        }
                      }}
                      className={cn(
                        "flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer",
                        isSelected
                          ? "bg-[#00A884]/20 text-[#25D366] border border-[#00A884]/40 font-semibold"
                          : "hover:bg-white/5 text-[#E9EDEF]"
                      )}
                    >
                      <span className="truncate">{device.label || `Microphone ${idx + 1}`}</span>
                      {isSelected && <Check className="h-4 w-4 text-[#25D366] shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Camera Selector */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#8696A0] uppercase tracking-wider">
              <Video className="h-3.5 w-3.5 text-[#00A884]" />
              <span>Camera</span>
            </div>
            <div className="flex flex-col gap-1.5 rounded-2xl bg-[#111B21] border border-white/10 p-2">
              {videoInputs.length === 0 ? (
                <div className="flex items-center gap-2 p-2 text-xs text-[#8696A0]">
                  <AlertCircle className="h-4 w-4 text-amber-400" />
                  <span>No cameras detected</span>
                </div>
              ) : (
                videoInputs.map((device, idx) => {
                  const isSelected = device.deviceId === activeVideoInput || (!activeVideoInput && idx === 0);
                  return (
                    <button
                      key={device.deviceId || idx}
                      onClick={async () => {
                        try {
                          await setActiveVideoInput(device.deviceId);
                        } catch (err) {
                          console.warn("[DeviceSettings] Failed to set camera:", err);
                        }
                      }}
                      className={cn(
                        "flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer",
                        isSelected
                          ? "bg-[#00A884]/20 text-[#25D366] border border-[#00A884]/40 font-semibold"
                          : "hover:bg-white/5 text-[#E9EDEF]"
                      )}
                    >
                      <span className="truncate">{device.label || `Camera ${idx + 1}`}</span>
                      {isSelected && <Check className="h-4 w-4 text-[#25D366] shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Speaker / Output Selector */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#8696A0] uppercase tracking-wider">
              <Volume2 className="h-3.5 w-3.5 text-[#00A884]" />
              <span>Speaker / Audio Output</span>
            </div>
            <div className="flex flex-col gap-1.5 rounded-2xl bg-[#111B21] border border-white/10 p-2">
              {audioOutputs.length === 0 ? (
                <div className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs text-[#8696A0]">
                  <span>System Default Speaker</span>
                  <Check className="h-4 w-4 text-[#25D366] shrink-0" />
                </div>
              ) : (
                audioOutputs.map((device, idx) => {
                  const isSelected = device.deviceId === activeAudioOutput || (!activeAudioOutput && idx === 0);
                  return (
                    <button
                      key={device.deviceId || idx}
                      onClick={async () => {
                        try {
                          await setActiveAudioOutput(device.deviceId);
                        } catch (err) {
                          console.warn("[DeviceSettings] Failed to set speaker:", err);
                        }
                      }}
                      className={cn(
                        "flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer",
                        isSelected
                          ? "bg-[#00A884]/20 text-[#25D366] border border-[#00A884]/40 font-semibold"
                          : "hover:bg-white/5 text-[#E9EDEF]"
                      )}
                    >
                      <span className="truncate">{device.label || `Speaker ${idx + 1}`}</span>
                      {isSelected && <Check className="h-4 w-4 text-[#25D366] shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-[#00A884] hover:bg-[#02906f] text-white text-xs font-semibold shadow-md transition-all active:scale-95 cursor-pointer"
          >
            Done
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
