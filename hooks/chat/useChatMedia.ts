import { useState, useCallback } from "react";
import { chatService } from "@/services/chat.service";
import { compressImage } from "@/utils/image";
import { toast } from "sonner";

export interface MediaUploadResult {
  success: boolean;
  mediaUrl?: string;
  mediaType?: string;
  error?: string;
}

export function useChatMedia() {
  const [isUploading, setIsUploading] = useState(false);

  const uploadMedia = useCallback(
    async (conversationId: string, file: File): Promise<MediaUploadResult> => {
      setIsUploading(true);
      try {
        let finalFile = file;
        if (file.type.startsWith("image/") && !file.type.includes("svg")) {
          try {
            finalFile = await compressImage(file, 1920, 0.8);
          } catch (compressErr) {
            console.warn("[useChatMedia] Image compression fallback to raw file:", compressErr);
          }
        }

        const uploadRes = await chatService.uploadMedia(conversationId, finalFile);
        if (uploadRes.success && uploadRes.data) {
          const mediaUrl = uploadRes.data.mediaUrl;
          const mediaType =
            uploadRes.data.mediaType ||
            (file.type.startsWith("image/")
              ? "image"
              : file.type.startsWith("video/")
              ? "video"
              : file.type.startsWith("audio/")
              ? "audio"
              : "document");

          return { success: true, mediaUrl, mediaType };
        } else {
          const errMsg = uploadRes.error || "Failed to upload file";
          toast.error(errMsg);
          return { success: false, error: errMsg };
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : "Failed to upload file";
        toast.error(errMsg);
        return { success: false, error: errMsg };
      } finally {
        setIsUploading(false);
      }
    },
    []
  );

  return {
    isUploading,
    uploadMedia,
  };
}

