"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceMessagePlayerProps {
  src: string;
  messageId: string;
  isMe: boolean;
}

export function VoiceMessagePlayer({ src, messageId, isMe }: VoiceMessagePlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0-100
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Number of decorative waveform bars
  const BAR_COUNT = 28;

  // Generate a stable pseudo-random bar height pattern for the waveform
  // based on the messageId so each message has a unique-looking waveform.
  const bars = React.useMemo(() => {
    const seed = messageId.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return Array.from({ length: BAR_COUNT }, (_, i) => {
      const val = Math.abs(Math.sin(seed * (i + 1) * 0.4) * 0.7 + Math.cos(i * 0.9) * 0.3);
      return Math.max(0.15, Math.min(1, val));
    });
  }, [messageId]);

  const formatTime = (s: number) => {
    if (!isFinite(s) || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // Initialise audio element once
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audioRef.current = audio;

    const onLoaded = () => {
      setDuration(audio.duration || 0);
      setIsLoaded(true);
    };
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
    };
    const onEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
      audio.currentTime = 0;
    };
    const onError = () => {
      console.error("[VoicePlayer] Audio load error for", src);
      setError(true);
      setIsLoaded(true);
    };

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    audio.src = src;
    audio.load();

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audio.src = "";
    };
  }, [src]);

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || error) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        console.error("[VoicePlayer] Playback failed:", err);
        setError(true);
      }
    }
  }, [isPlaying, error]);

  const handleScrub = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !progressBarRef.current || !audio.duration) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * audio.duration;
    setProgress(ratio * 100);
  }, []);

  // ── Colour tokens ──────────────────────────────────────────────────────────
  const bgColor = isMe ? "bg-[#3B58F5]" : "bg-white";
  const playBtnBg = isMe ? "bg-white/20 hover:bg-white/30" : "bg-[#3B58F5]/10 hover:bg-[#3B58F5]/20";
  const playBtnIcon = isMe ? "text-white" : "text-[#3B58F5]";
  const waveActive = isMe ? "bg-white" : "bg-[#3B58F5]";
  const waveInactive = isMe ? "bg-white/35" : "bg-[#3B58F5]/25";
  const timeColor = isMe ? "text-white/75" : "text-[#8F95B2]";
  const scrubTrack = isMe ? "bg-white/25" : "bg-[#3B58F5]/15";
  const scrubFill = isMe ? "bg-white" : "bg-[#3B58F5]";
  const scrubThumb = isMe ? "bg-white" : "bg-[#3B58F5]";

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-[18px] shadow-sm",
        "w-[260px] select-none",
        bgColor
      )}
    >
      {/* ── Play / Pause Button ─────────────────────────────────────────────── */}
      <button
        onClick={togglePlay}
        disabled={!isLoaded || error}
        className={cn(
          "flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full transition-all",
          playBtnBg,
          (!isLoaded || error) && "opacity-50 cursor-not-allowed"
        )}
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <Pause className={cn("w-4 h-4 fill-current", playBtnIcon)} strokeWidth={0} />
        ) : (
          <Play className={cn("w-4 h-4 fill-current ml-0.5", playBtnIcon)} strokeWidth={0} />
        )}
      </button>

      {/* ── Waveform + Scrubber ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col gap-1.5 min-w-0">
        {/* Waveform visualisation */}
        <div
          ref={progressBarRef}
          onClick={handleScrub}
          className="flex items-end gap-[2px] h-7 cursor-pointer"
          role="slider"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
        >
          {bars.map((height, i) => {
            const barProgress = (i / BAR_COUNT) * 100;
            const isPast = barProgress <= progress;
            const isAnimating = isPlaying && isPast && barProgress >= progress - 5;
            return (
              <div
                key={i}
                className={cn(
                  "flex-1 rounded-full transition-all duration-75",
                  isPast ? waveActive : waveInactive,
                  isAnimating && "animate-pulse"
                )}
                style={{ height: `${Math.round(height * 100)}%` }}
              />
            );
          })}
        </div>

        {/* Thin progress track below waveform */}
        <div className={cn("h-0.5 rounded-full w-full", scrubTrack)}>
          <div
            className={cn("h-full rounded-full relative transition-all duration-100", scrubFill)}
            style={{ width: `${progress}%` }}
          >
            {/* Scrub thumb */}
            <div
              className={cn(
                "absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2",
                "w-2.5 h-2.5 rounded-full shadow-sm",
                scrubThumb
              )}
            />
          </div>
        </div>
      </div>

      {/* ── Duration / Current Time ─────────────────────────────────────────── */}
      <span className={cn("flex-shrink-0 text-[11px] font-semibold tabular-nums min-w-[32px] text-right", timeColor)}>
        {isPlaying ? formatTime(currentTime) : formatTime(duration)}
      </span>
    </div>
  );
}
