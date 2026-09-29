import { ContactItem, useContacts } from "@/context/ContactsContext";

export interface ResolveNameInput {
  userId?: string | null;
  phone?: string | null;
  profileDisplayName?: string | null;
  username?: string | null;
  fallback?: string;
}

export interface ResolvedNameResult {
  /**
   * Primary title/name to display:
   * - Saved custom nickname if contact exists
   * - Formatted phone number if unsaved with phone
   * - Push name (~ProfileName) or fallback if phone unavailable
   */
  title: string;
  /**
   * Push name with tilde (e.g. "~Rahim") when unsaved and phone is present; otherwise null
   */
  subtitle: string | null;
  /**
   * Ready-to-render combined string:
   * e.g. "Bhaiya" (saved)
   * or "+880 1712-345678 (~Rahim)" (unsaved with phone)
   * or "~Rahim" (unsaved without phone)
   */
  formattedName: string;
  /**
   * True if found in viewer's saved contacts
   */
  isSaved: boolean;
  /**
   * The custom nickname if saved
   */
  customName: string | null;
}

/**
 * Formats a phone number for display
 */
export function formatPhoneNumber(phone?: string | null): string {
  if (!phone) return "";
  const cleaned = phone.trim();
  // If already formatted, return as-is
  if (cleaned.includes(" ") || cleaned.includes("-")) return cleaned;
  // Basic friendly formatting if standard international
  if (cleaned.startsWith("+") && cleaned.length >= 11) {
    // Example: +8801712345678 -> +880 1712-345678
    const country = cleaned.slice(0, cleaned.length - 10);
    const part1 = cleaned.slice(cleaned.length - 10, cleaned.length - 6);
    const part2 = cleaned.slice(cleaned.length - 6);
    return `${country} ${part1}-${part2}`;
  }
  return cleaned;
}

/**
 * Ensures push names are prefixed with ~ in WhatsApp style (without duplicate ~~)
 */
export function formatPushName(name?: string | null): string | null {
  if (!name || !name.trim()) return null;
  const trimmed = name.trim();
  return trimmed.startsWith("~") ? trimmed : `~${trimmed}`;
}

/**
 * Resolves a user's display name adhering to WhatsApp's priority rules:
 * 1. Saved Contact Nickname (Highest Priority)
 * 2. Formatted Phone Number + "~Push Name" (Unsaved with phone)
 * 3. "~Push Name" / Username (Unsaved without phone)
 * 4. Fallback ("Unknown")
 */
export function resolveDisplayName(
  input: ResolveNameInput,
  contactLookup?:
    | ((userId?: string | null) => ContactItem | undefined)
    | Map<string, ContactItem>
    | ContactItem
    | null
): ResolvedNameResult {
  const { userId, phone, profileDisplayName, username, fallback = "Unknown" } = input;

  let matchedContact: ContactItem | undefined;

  if (contactLookup) {
    if (typeof contactLookup === "function") {
      matchedContact = contactLookup(userId);
    } else if (contactLookup instanceof Map) {
      if (userId) matchedContact = contactLookup.get(userId);
    } else if ("id" in contactLookup || "customName" in contactLookup) {
      matchedContact = contactLookup as ContactItem;
    }
  }

  // 1. Saved Contact Priority
  if (matchedContact && matchedContact.customName && matchedContact.customName.trim()) {
    const savedName = matchedContact.customName.trim();
    return {
      title: savedName,
      subtitle: null,
      formattedName: savedName,
      isSaved: true,
      customName: savedName,
    };
  }

  const pushName = formatPushName(profileDisplayName || matchedContact?.displayName);
  const formattedPhone = formatPhoneNumber(phone || matchedContact?.phoneNumber);

  // 2. Unsaved with Phone Number
  if (formattedPhone) {
    return {
      title: formattedPhone,
      subtitle: pushName,
      formattedName: pushName ? `${formattedPhone} (${pushName})` : formattedPhone,
      isSaved: false,
      customName: null,
    };
  }

  // 3. Unsaved without Phone (e.g. Privacy protected or in groups)
  if (pushName) {
    return {
      title: pushName,
      subtitle: null,
      formattedName: pushName,
      isSaved: false,
      customName: null,
    };
  }

  // 4. Username / Fallback
  const finalFallback = username ? `@${username}` : fallback;
  return {
    title: finalFallback,
    subtitle: null,
    formattedName: finalFallback,
    isSaved: false,
    customName: null,
  };
}

/**
 * Convenient React hook to automatically resolve names using ContactsContext
 */
export function useResolvedDisplayName(input: ResolveNameInput): ResolvedNameResult {
  const { getContact, getContactByPhone } = useContacts();
  const contact = (input.userId ? getContact(input.userId) : undefined) ||
    (input.phone ? getContactByPhone(input.phone) : undefined);

  return resolveDisplayName(input, contact);
}
