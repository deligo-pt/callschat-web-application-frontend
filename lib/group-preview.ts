export interface GroupLastMessageData {
  id?: string;
  senderId?: string;
  senderName?: string | null;
  ciphertext?: string | null;
  nonce?: string | null;
  mediaType?: string | null;
  mediaUrl?: string | null;
  isSystem?: boolean;
  systemEventType?: string | null;
  systemMetadata?: any;
  pollQuestion?: string | null;
  receipts?: Array<{ userId: string; deliveredAt?: string | null; seenAt?: string | null }>;
  createdAt?: string;
  previewText?: string | null;
  text?: string | null;
  content?: string | null;
  message?: string | null;
}

/**
 * Formats a group lastMessage object into a clean WhatsApp-style preview string:
 * - System actions: "You created this group", "Alice added Bob", "Alice left", etc.
 * - Polls: "📊 Poll: ..."
 * - Media: 📷 Photo, 🎥 Video, 🎤 Voice message, 📄 Document, 📞 Call
 * - Text: "Alice: Hello everyone" or (for sender) "Hello everyone" with prefix handled by caller
 */
export function formatGroupPreviewText(
  msg: GroupLastMessageData | null | undefined,
  currentUserId?: string | null,
  decryptedText?: string | null
): {
  previewText: string;
  isSystemEvent: boolean;
  senderPrefix: string;
  mediaIcon?: 'photo' | 'video' | 'audio' | 'document' | 'poll' | 'call' | 'lock';
} {
  if (!msg) {
    return {
      previewText: "Group created",
      isSystemEvent: true,
      senderPrefix: "",
    };
  }

  const isMe = currentUserId ? msg.senderId === currentUserId : false;
  const firstName = msg.senderName ? msg.senderName.trim().split(" ")[0] : "Someone";
  const senderPrefix = isMe ? "You: " : `${firstName}: `;

  // 1. System Events
  if (msg.isSystem || msg.systemEventType) {
    const meta = typeof msg.systemMetadata === "string" ? safeJsonParse(msg.systemMetadata) : msg.systemMetadata || {};
    const targetName = meta.targetName || meta.userName || meta.displayName || "a member";

    let text = msg.text || msg.content || "";
    switch (msg.systemEventType) {
      case "GROUP_CREATED":
        text = isMe ? "You created this group" : `${firstName} created this group`;
        break;
      case "MEMBER_ADDED":
        text = isMe ? `You added ${targetName}` : `${firstName} added ${targetName}`;
        break;
      case "MEMBER_JOINED_LINK":
        text = isMe ? "You joined via invite link" : `${firstName} joined via invite link`;
        break;
      case "MEMBER_REMOVED":
        text = isMe ? `You removed ${targetName}` : `${firstName} removed ${targetName}`;
        break;
      case "MEMBER_LEFT":
        text = isMe ? "You left the group" : `${firstName} left the group`;
        break;
      case "ADMIN_PROMOTED":
        text = isMe ? `You are now an admin` : `${firstName} is now an admin`;
        break;
      case "ADMIN_DEMOTED":
        text = isMe ? `You are no longer an admin` : `${firstName} is no longer an admin`;
        break;
      case "INFO_UPDATED":
        text = isMe ? "You updated group info" : `${firstName} updated group info`;
        break;
      case "SETTINGS_UPDATED":
        text = isMe ? "You updated group settings" : `${firstName} updated group settings`;
        break;
      case "DISAPPEARING_TIMER_UPDATED":
        text = "Disappearing messages timer was changed";
        break;
      case "MESSAGE_DELETED_BY_ADMIN":
        text = "This message was deleted by an admin";
        break;
      default:
        if (!text) {
          text = "Group activity";
        }
        break;
    }

    return {
      previewText: text,
      isSystemEvent: true,
      senderPrefix: "",
    };
  }

  // 2. Polls
  if (msg.pollQuestion) {
    return {
      previewText: `Poll: ${msg.pollQuestion}`,
      isSystemEvent: false,
      senderPrefix,
      mediaIcon: 'poll',
    };
  }

  // 3. Media Previews
  const mType = (msg.mediaType || "").toLowerCase();
  if (mType === "image" || mType.startsWith("image")) {
    return {
      previewText: "Photo",
      isSystemEvent: false,
      senderPrefix,
      mediaIcon: 'photo',
    };
  }

  if (mType === "video" || mType.startsWith("video")) {
    return {
      previewText: "Video",
      isSystemEvent: false,
      senderPrefix,
      mediaIcon: 'video',
    };
  }

  if (mType === "audio" || mType.startsWith("audio")) {
    return {
      previewText: "Voice message",
      isSystemEvent: false,
      senderPrefix,
      mediaIcon: 'audio',
    };
  }

  if (
    mType === "document" ||
    mType === "file" ||
    mType === "raw" ||
    (msg.mediaUrl &&
      !mType.startsWith("image") &&
      !mType.startsWith("video") &&
      !mType.startsWith("audio") &&
      mType !== "link" &&
      mType !== "call")
  ) {
    const raw = msg.mediaUrl ? decodeURIComponent(msg.mediaUrl.split("/").pop()?.split("?")[0] || "") : "";
    const clean = raw.replace(/^\d{10,14}_/, "");
    const docName = clean ? (clean.length > 25 ? `${clean.slice(0, 22)}...` : clean) : "Document";
    return {
      previewText: docName,
      isSystemEvent: false,
      senderPrefix,
      mediaIcon: 'document',
    };
  }

  if (mType === "call") {
    let callText = "Call";
    if (msg.mediaUrl) {
      try {
        const payload = JSON.parse(msg.mediaUrl);
        callText = payload.type === "VIDEO" ? "Video call" : "Audio call";
      } catch {}
    }
    return {
      previewText: callText,
      isSystemEvent: false,
      senderPrefix,
      mediaIcon: 'call',
    };
  }

  // 4. Text / E2EE Decrypted Content
  let text = decryptedText || msg.text || msg.previewText || msg.content || msg.message || "";

  if (text.startsWith("__PIN_EVENT__:")) {
    try {
      const payload = JSON.parse(text.substring("__PIN_EVENT__:".length));
      const pName = isMe ? "You" : (msg.senderName || payload.pinnerName || "Someone");
      const action = payload.action === "pin" ? "pinned" : "unpinned";
      return {
        previewText: `📌 ${pName} ${action} a message`,
        isSystemEvent: true,
        senderPrefix: "",
      };
    } catch {
      return {
        previewText: "📌 Pinned a message",
        isSystemEvent: true,
        senderPrefix: "",
      };
    }
  }

  if (text.startsWith("__EDITED__:")) {
    text = text.substring("__EDITED__:".length);
  }

  if (text) {
    const truncated = text.length > 60 ? text.substring(0, 60) + "..." : text;
    return {
      previewText: truncated,
      isSystemEvent: false,
      senderPrefix,
    };
  }

  if (msg.ciphertext) {
    return {
      previewText: "🔒 Group message",
      isSystemEvent: false,
      senderPrefix,
      mediaIcon: 'lock',
    };
  }

  return {
    previewText: "No messages yet",
    isSystemEvent: true,
    senderPrefix: "",
  };
}

function safeJsonParse(val: string): any {
  try {
    return JSON.parse(val);
  } catch {
    return {};
  }
}
