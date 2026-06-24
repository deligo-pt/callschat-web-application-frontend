import { useState, useRef, useCallback, useEffect } from 'react';

export function useMediaCapture() {
  // Audio Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Camera States
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // --- Task 1: Dynamic MIME Type Resolver ---
  // Browsers support different audio codecs. We probe in priority order:
  //   1. audio/webm;codecs=opus – Chrome, Firefox, Edge
  //   2. audio/mp4              – Safari, iOS (AAC codec)
  //   3. audio/ogg;codecs=opus  – Firefox (alternative)
  //   4. audio/webm             – Generic WebM fallback
  //   5. ''                     – Let the browser pick its default
  const getSupportedAudioMimeType = (): string => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/webm',
    ];
    for (const type of types) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return '';
  };

  // Derive a safe file extension from the MIME type string
  const getExtensionForMime = (mimeType: string): string => {
    if (mimeType.startsWith('audio/mp4')) return 'mp4';
    if (mimeType.startsWith('audio/ogg')) return 'ogg';
    return 'webm'; // covers audio/webm and browser default
  };

  // --- Task 2: Rewritten Recording Logic ---
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mimeType = getSupportedAudioMimeType();

      // Only pass mimeType if the browser confirmed it's supported; otherwise
      // let MediaRecorder pick its own default to avoid NotSupportedError.
      const options: MediaRecorderOptions = mimeType ? { mimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, options);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start audio recording:', err);
      throw err;
    }
  }, []);

  const stopRecording = useCallback((): Promise<File | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder) {
        resolve(null);
        return;
      }

      // Capture the MIME type *before* stopping; after stop the recorder
      // state may be cleared in some browser implementations.
      const chosenMimeType = recorder.mimeType || 'audio/webm';

      recorder.onstop = () => {
        // Build the Blob with the exact same MIME type that was used during
        // recording. This guarantees the container format matches the encoded
        // data, which is the root cause of playback failures.
        const audioBlob = new Blob(audioChunksRef.current, { type: chosenMimeType });

        const ext = getExtensionForMime(chosenMimeType);
        const audioFile = new File(
          [audioBlob],
          `audio_${Date.now()}.${ext}`,
          { type: chosenMimeType }
        );

        // Cleanup stream tracks so the mic indicator disappears
        recorder.stream.getTracks().forEach((track) => track.stop());

        setIsRecording(false);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        setRecordingDuration(0);

        resolve(audioFile);
      };

      recorder.stop();
    });
  }, []);

  // --- Camera Logic ---
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraOpen(true);
    } catch (err) {
      console.error('Failed to start camera:', err);
      throw err;
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  }, []);

  const capturePhoto = useCallback((): File | null => {
    if (!videoRef.current || !streamRef.current) return null;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      
      // Convert DataURL to File
      const arr = dataUrl.split(',');
      const mimeMatch = arr[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      
      const file = new File([u8arr], `photo_${Date.now()}.jpg`, { type: mime });
      stopCamera();
      return file;
    }
    
    return null;
  }, [stopCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return {
    // Audio
    isRecording,
    recordingDuration,
    startRecording,
    stopRecording,
    // Camera
    isCameraOpen,
    videoRef,
    startCamera,
    stopCamera,
    capturePhoto,
  };
}
