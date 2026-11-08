"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface AvatarImageProps {
  src?: string | null;
  alt: string;
  size?: number;
  className?: string;
  isGroup?: boolean;
  priority?: boolean;
}

const PALETTE = [
  "bg-blue-500/15 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
  "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
  "bg-violet-500/15 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400",
  "bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
  "bg-rose-500/15 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400",
  "bg-cyan-500/15 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400",
  "bg-indigo-500/15 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400",
];

function getInitials(name: string): string {
  if (!name) return "";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getPaletteClass(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % PALETTE.length;
  return PALETTE[index];
}

export function AvatarImage({
  src,
  alt,
  size = 48,
  className,
  isGroup = false,
  priority = false,
}: AvatarImageProps) {
  const [hasError, setHasError] = useState(false);
  const initials = getInitials(alt);
  const colorClass = getPaletteClass(alt);

  // If no source is provided or image loading errored
  if (!src || hasError) {
    if (isGroup) {
      return (
        <div
          className={cn(
            "flex items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 font-semibold select-none",
            className
          )}
          style={{ width: size, height: size }}
          aria-label={alt}
        >
          <Users style={{ width: size * 0.45, height: size * 0.45 }} />
        </div>
      );
    }

    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-full font-bold select-none tracking-tight",
          colorClass,
          className
        )}
        style={{
          width: size,
          height: size,
          fontSize: Math.max(12, Math.round(size * 0.38)),
        }}
        aria-label={alt}
      >
        {initials || "U"}
      </div>
    );
  }

  const isBlobOrData = src.startsWith("blob:") || src.startsWith("data:");

  return (
    <div
      className={cn("relative overflow-hidden rounded-full shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        priority={priority}
        unoptimized={isBlobOrData}
        onError={() => setHasError(true)}
        className="h-full w-full object-cover"
        sizes={`${size}px`}
      />
    </div>
  );
}
export default AvatarImage;

