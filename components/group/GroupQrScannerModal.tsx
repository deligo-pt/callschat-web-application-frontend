"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Camera,
  Image as ImageIcon,
  X,
  AlertCircle,
  Loader2,
  RefreshCw,
  QrCode,
} from "lucide-react";
import { toast } from "sonner";

interface GroupQrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess?: (inviteCode: string) => void;
}

export function GroupQrScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
}: GroupQrScannerModalProps) {
  const router = useRouter();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isProcessingImage, setIsProcessingImage] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const stopCameraStream = () => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const parseInviteCode = (decodedString: string): string | null => {
    if (!decodedString) return null;

    const trimmed = decodedString.trim();

    // Match /groups/invite/:code
    const internalMatch = trimmed.match(/\/groups\/invite\/([a-zA-Z0-9_-]+)/i);
    if (internalMatch && internalMatch[1]) {
      return internalMatch[1];
    }

    // Match chat.whatsapp.com/:code
    const whatsappMatch = trimmed.match(/chat\.whatsapp\.com\/([a-zA-Z0-9_-]+)/i);
    if (whatsappMatch && whatsappMatch[1]) {
      return whatsappMatch[1];
    }

    // Match raw hexadecimal token (16 to 64 chars)
    if (/^[a-fA-F0-9]{16,64}$/.test(trimmed)) {
      return trimmed;
    }

    return null;
  };

  const handleDetectedCode = (code: string) => {
    stopCameraStream();
    toast.success("Group invite recognized!");
    onClose();

    if (onScanSuccess) {
      onScanSuccess(code);
    } else {
      router.push(`/groups/invite/${code}`);
    }
  };

  const startCamera = async () => {
    stopCameraStream();
    setCameraError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API is not supported on this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      mediaStreamRef.current = stream;
      setHasCameraPermission(true);
      setIsCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
        startScanLoop();
      }
    } catch (err: any) {
      setHasCameraPermission(false);
      setIsCameraActive(false);
      setCameraError(
        err?.message || "Could not access camera. Please grant camera permission or upload an image."
      );
    }
  };

  const startScanLoop = () => {
    const scanFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (qrCode && qrCode.data) {
            const inviteCode = parseInviteCode(qrCode.data);
            if (inviteCode) {
              handleDetectedCode(inviteCode);
              return;
            }
          }
        }
      }

      animationFrameIdRef.current = requestAnimationFrame(scanFrame);
    };

    animationFrameIdRef.current = requestAnimationFrame(scanFrame);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setIsProcessingImage(false);
          toast.error("Failed to initialize canvas");
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const qrCode = jsQR(imageData.data, imageData.width, imageData.height);

        setIsProcessingImage(false);

        if (qrCode && qrCode.data) {
          const inviteCode = parseInviteCode(qrCode.data);
          if (inviteCode) {
            handleDetectedCode(inviteCode);
          } else {
            toast.error("The scanned QR code is not a CallsChat group invite.");
          }
        } else {
          toast.error("No QR code found in this image. Please try another image.");
        }
      };

      img.src = reader.result as string;
    };

    reader.onerror = () => {
      setIsProcessingImage(false);
      toast.error("Failed to read image file");
    };

    reader.readAsDataURL(file);
    e.target.value = "";
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCameraStream();
    }

    return () => {
      stopCameraStream();
    };
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[440px] bg-[#111B21] border border-gray-800 text-white p-0 overflow-hidden shadow-2xl rounded-2xl">
        <DialogHeader className="p-4 border-b border-gray-800/80 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-emerald-500" />
            <DialogTitle className="text-base font-semibold text-white">
              Scan Group QR Code
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="p-5 flex flex-col items-center space-y-4">
          <p className="text-xs text-gray-400 text-center leading-relaxed">
            Point your camera at a CallsChat group QR code or upload an image to join instantly.
          </p>

          {/* Scanner Viewfinder Box */}
          <div className="relative w-full aspect-square max-w-[320px] rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-gray-800 shadow-inner">
            {/* Live Video */}
            <video
              ref={videoRef}
              className={`w-full h-full object-cover ${isCameraActive ? "block" : "hidden"}`}
            />

            {/* Offscreen Canvas for Frame Capture */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Target Reticle / Scanning Corners */}
            {isCameraActive && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="relative w-52 h-52">
                  {/* Top-left corner */}
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-emerald-500 rounded-tl-lg" />
                  {/* Top-right corner */}
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-emerald-500 rounded-tr-lg" />
                  {/* Bottom-left corner */}
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-emerald-500 rounded-bl-lg" />
                  {/* Bottom-right corner */}
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-emerald-500 rounded-br-lg" />
                  {/* Animated laser scan line */}
                  <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_#10b981] animate-pulse" />
                </div>
              </div>
            )}

            {/* Camera Fallback / Permission Denied */}
            {!isCameraActive && (
              <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-gray-800 text-gray-400 flex items-center justify-center">
                  <Camera className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-300">Camera Unavailable</p>
                  <p className="text-[11px] text-gray-500 max-w-[220px]">
                    {cameraError || "Grant camera access or choose a QR screenshot from your files."}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={startCamera}
                  className="text-xs border-gray-700 hover:bg-gray-800 text-gray-200 gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Try Again</span>
                </Button>
              </div>
            )}

            {/* Image processing overlay */}
            {isProcessingImage && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                <p className="text-xs text-gray-300">Scanning image...</p>
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="w-full flex items-center justify-between gap-3 pt-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />

            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 bg-[#202C33] hover:bg-[#2A3942] border-gray-700 text-xs text-gray-200 font-medium h-10 gap-2"
            >
              <ImageIcon className="w-4 h-4 text-emerald-500" />
              <span>Upload from Gallery</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-xs text-gray-400 hover:text-white h-10"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
