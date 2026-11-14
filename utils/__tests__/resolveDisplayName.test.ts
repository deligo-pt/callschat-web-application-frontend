import { describe, it, expect } from "vitest";
import {
  formatPhoneNumber,
  formatPushName,
  resolveDisplayName,
} from "../resolveDisplayName";
import { ContactItem } from "@/context/ContactsContext";

describe("resolveDisplayName utilities", () => {
  describe("formatPhoneNumber", () => {
    it("formats standard international numbers with spaces and hyphens", () => {
      expect(formatPhoneNumber("+8801712345678")).toBe("+880 1712-345678");
    });

    it("preserves already formatted numbers", () => {
      expect(formatPhoneNumber("+880 1712-345678")).toBe("+880 1712-345678");
    });

    it("returns empty string for null or undefined input", () => {
      expect(formatPhoneNumber(null)).toBe("");
      expect(formatPhoneNumber(undefined)).toBe("");
    });
  });

  describe("formatPushName", () => {
    it("adds tilde prefix if missing", () => {
      expect(formatPushName("John Doe")).toBe("~John Doe");
    });

    it("does not duplicate tilde if already present", () => {
      expect(formatPushName("~John Doe")).toBe("~John Doe");
    });

    it("returns null for empty or whitespace-only names", () => {
      expect(formatPushName("")).toBeNull();
      expect(formatPushName("   ")).toBeNull();
      expect(formatPushName(null)).toBeNull();
    });
  });

  describe("resolveDisplayName", () => {
    const mockSavedContact: ContactItem = {
      id: "contact-1",
      userId: "user-123",
      customName: "Alex Colleague",
      displayName: "Alexander Graham",
      phoneNumber: "+8801712345678",
      username: "alexg",
      avatarUrl: null,
    };

    it("prioritizes saved contact custom nickname", () => {
      const result = resolveDisplayName(
        { userId: "user-123", profileDisplayName: "Alex On Wire" },
        mockSavedContact
      );

      expect(result.isSaved).toBe(true);
      expect(result.title).toBe("Alex Colleague");
      expect(result.formattedName).toBe("Alex Colleague");
      expect(result.subtitle).toBeNull();
    });

    it("resolves saved contact via profile displayName when custom nickname is empty", () => {
      const contactWithoutNickname: ContactItem = {
        ...mockSavedContact,
        customName: null,
      };

      const result = resolveDisplayName(
        { userId: "user-123", profileDisplayName: "Alexander Graham" },
        contactWithoutNickname
      );

      expect(result.isSaved).toBe(true);
      expect(result.title).toBe("Alexander Graham");
      expect(result.subtitle).toBeNull();
      // Must not prepend '~' when contact is saved
      expect(result.title.startsWith("~")).toBe(false);
    });

    it("resolves unsaved user with phone and push name (WhatsApp style)", () => {
      const result = resolveDisplayName({
        userId: "unknown-user",
        phone: "+8801712345678",
        profileDisplayName: "Rahim",
      });

      expect(result.isSaved).toBe(false);
      expect(result.title).toBe("+880 1712-345678");
      expect(result.subtitle).toBe("~Rahim");
      expect(result.formattedName).toBe("+880 1712-345678 (~Rahim)");
    });

    it("resolves unsaved user in group chat without phone using ~pushName", () => {
      const result = resolveDisplayName({
        userId: "group-member-1",
        profileDisplayName: "Karim",
      });

      expect(result.isSaved).toBe(false);
      expect(result.title).toBe("~Karim");
      expect(result.subtitle).toBeNull();
      expect(result.formattedName).toBe("~Karim");
    });

    it("falls back to username or default fallback when name and phone are unavailable", () => {
      const resultWithUsername = resolveDisplayName({
        userId: "unknown-user-2",
        username: "techlead",
      });
      expect(resultWithUsername.title).toBe("@techlead");
      expect(resultWithUsername.isSaved).toBe(false);

      const resultWithFallback = resolveDisplayName(
        { userId: "ghost-user" },
        null
      );
      expect(resultWithFallback.title).toBe("Unknown");
      expect(resultWithFallback.isSaved).toBe(false);
    });

    it("resolves correctly when contactLookup is passed as a function or Map", () => {
      const contactsMap = new Map<string, ContactItem>([
        ["user-123", mockSavedContact],
      ]);

      const mapResult = resolveDisplayName({ userId: "user-123" }, contactsMap);
      expect(mapResult.isSaved).toBe(true);
      expect(mapResult.title).toBe("Alex Colleague");

      const fnLookup = (id?: string | null) => (id === "user-123" ? mockSavedContact : undefined);
      const fnResult = resolveDisplayName({ userId: "user-123" }, fnLookup);
      expect(fnResult.isSaved).toBe(true);
      expect(fnResult.title).toBe("Alex Colleague");
    });
  });
});

