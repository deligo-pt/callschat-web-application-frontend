import React from "react";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  msg: {
    id: string;
    senderId: string;
    text: string;
    createdAt: string;
    mediaUrl?: string;
    mediaType?: "image" | "video" | "audio" | "document" | null;
  };
  isMe: boolean;
  showTail: boolean;
}

export function MessageBubble({ msg, isMe, showTail }: MessageBubbleProps) {
  const formatTime = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const renderMedia = () => {
    if (!msg.mediaUrl) return null;

    switch (msg.mediaType) {
      case "image":
        return (
          <img
            src={msg.mediaUrl}
            alt="Attached Image"
            className="rounded-lg max-w-sm w-full cursor-pointer object-cover mb-1"
          />
        );
      case "video":
        return (
          <video
            src={msg.mediaUrl}
            controls
            className="rounded-lg max-w-sm w-full max-h-[300px] mb-1"
          />
        );
      case "audio":
        return (
          <audio
            src={msg.mediaUrl}
            controls
            className="w-full max-w-[250px] mb-1"
          />
        );
      default:
        return (
          <a
            href={msg.mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-blue-500 underline mb-1"
          >
            📎 Download Attachment
          </a>
        );
    }
  };

  return (
    <div className={cn("flex w-full z-10", isMe ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "relative max-w-[75%] px-3.5 py-2 text-[14.5px] shadow-sm flex flex-col group",
          isMe ? "bg-[#DCF8C6] text-[#111B21]" : "bg-white text-[#111B21]",
          isMe ? "rounded-l-xl rounded-br-xl" : "rounded-r-xl rounded-bl-xl",
          showTail && isMe ? "rounded-tr-none" : "",
          showTail && !isMe ? "rounded-tl-none" : ""
        )}
      >
        {/* Message Tail SVG */}
        {showTail && isMe && (
          <svg
            viewBox="0 0 8 13"
            width="8"
            height="13"
            className="absolute top-0 -right-[8px] text-[#DCF8C6]"
          >
            <path
              opacity="1"
              fill="currentColor"
              d="M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z"
            />
          </svg>
        )}
        {showTail && !isMe && (
          <svg
            viewBox="0 0 8 13"
            width="8"
            height="13"
            className="absolute top-0 -left-[8px] text-white"
          >
            <path
              opacity="1"
              fill="currentColor"
              d="M1.533 3.568 8 12.193V1H2.812C1.042 1 .474 2.156 1.533 3.568z"
            />
          </svg>
        )}

        {renderMedia()}

        {msg.text && (
          <span
            className="leading-snug pr-10 whitespace-pre-wrap"
            style={{ wordBreak: "break-word" }}
          >
            {msg.text}
          </span>
        )}

        <div className="absolute bottom-1 right-2 flex items-center gap-1">
          <span className="text-[10px] text-gray-500">
            {formatTime(msg.createdAt)}
          </span>
          {isMe && (
            <svg
              viewBox="0 0 16 15"
              width="16"
              height="15"
              className="text-[#53bdeb]"
            >
              <path
                fill="currentColor"
                d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.199c.143.13.36.125.498-.011l5.3-6.974a.418.418 0 0 0-.106-.54z"
              />
              <path
                fill="currentColor"
                d="M11.51 3.316l-.478-.372a.365.365 0 0 0-.51.063L5.166 9.879a.32.32 0 0 1-.484.033L2.01 7.489a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l3.052 2.776c.143.13.36.125.498-.011l5.3-6.974a.418.418 0 0 0-.106-.54z"
              />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
