/**
 * WhatsApp-style date and time formatting utilities for message feeds.
 */

/**
 * Checks whether two dates correspond to the exact same calendar day
 * in the user's local timezone.
 */
export function isSameDay(
  d1?: string | Date | null,
  d2?: string | Date | null
): boolean {
  if (!d1 || !d2) return false;
  const date1 = new Date(d1);
  const date2 = new Date(d2);

  if (isNaN(date1.getTime()) || isNaN(date2.getTime())) return false;

  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Formats a message timestamp into a clean WhatsApp-style date divider label:
 * - "Today"
 * - "Yesterday"
 * - Day of the week (e.g., "Monday") if within the last 6 days
 * - "Month Day" (e.g., "November 14") if earlier in current year
 * - "Month Day, Year" (e.g., "December 28, 2025") if in a prior year
 */
export function formatMessageDateDivider(dateInput?: string | Date | null): string {
  if (!dateInput) return "Recent";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "Recent";

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const itemDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffMs = today.getTime() - itemDate.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays > 1 && diffDays < 7) {
    return date.toLocaleDateString(undefined, { weekday: "long" });
  }

  return date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

/**
 * Formats a timestamp into a full localized string suitable for hover tooltips:
 * e.g., "Sunday, November 22, 2026 at 10:18 PM"
 */
export function formatFullDateTime(dateInput?: string | Date | null): string {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";

  const datePart = date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const timePart = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${datePart} at ${timePart}`;
}

/**
 * Formats a timestamp into a compact time string (e.g., "10:18 PM").
 */
export function formatMessageTime(dateInput?: string | Date | null): string {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";

  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}
