"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { ContactService } from "@/services/contact.service";

export interface ContactItem {
  id: string; // Contact relationship ID
  userId: string; // Target user's account ID
  customName: string | null; // Saved custom nickname set by viewer
  displayName: string | null; // Target user's profile display name
  username: string | null;
  avatarUrl: string | null;
  phoneNumber?: string | null;
  isFavourite?: boolean;
  isVerified?: boolean;
}

interface ContactsContextType {
  contacts: ContactItem[];
  contactsMap: Map<string, ContactItem>;
  contactsByPhoneMap: Map<string, ContactItem>;
  isLoading: boolean;
  refetchContacts: () => Promise<void>;
  getContact: (userId?: string | null) => ContactItem | undefined;
  getContactByPhone: (phone?: string | null) => ContactItem | undefined;
}

const defaultContactsContext: ContactsContextType = {
  contacts: [],
  contactsMap: new Map(),
  contactsByPhoneMap: new Map(),
  isLoading: false,
  refetchContacts: async () => {},
  getContact: () => undefined,
  getContactByPhone: () => undefined,
};

const ContactsContext = createContext<ContactsContextType>(defaultContactsContext);

export const ContactsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchContactsList = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await ContactService.fetchContacts();
      const rawList: any[] =
        res?.data?.contacts ||
        res?.contacts ||
        (Array.isArray(res?.data) ? res.data : []) ||
        (Array.isArray(res) ? res : []);

      const normalized: ContactItem[] = rawList
        .map((c: any) => {
          // Strictly resolve the other person's account ID (not the relationship ID c.id)
          const target = c.contact || c.addressee || {};
          const profile = target.profile || c.profile || {};
          const targetUserId = target.id;

          if (!targetUserId) return null;

          return {
            id: c.id,
            userId: targetUserId,
            // Only set customName if a real nickname exists
            customName: c.customName?.trim() || null,
            displayName: profile.displayName || profile.name || null,
            username: profile.username || null,
            avatarUrl: profile.avatarUrl || null,
            phoneNumber: target.phone || c.phoneNumber || null,
            isFavourite: Boolean(c.isFavourite),
            isVerified: Boolean(c.isVerified || target.isVerified),
          };
        })
        .filter(Boolean) as ContactItem[];

      setContacts(normalized);
    } catch (err) {
      console.error("[ContactsContext] Failed to load contacts cache:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("accessToken")) {
      fetchContactsList();
    } else {
      setIsLoading(false);
    }
  }, [fetchContactsList]);

  // Fast O(1) lookups with duplicate prevention
  const contactsMap = useMemo(() => {
    const map = new Map<string, ContactItem>();
    for (const c of contacts) {
      if (c.userId) {
        const existing = map.get(c.userId);
        // Prioritize entry that contains custom nickname
        if (!existing || (!existing.customName && c.customName)) {
          map.set(c.userId, c);
        }
      }
    }
    return map;
  }, [contacts]);

  const contactsByPhoneMap = useMemo(() => {
    const map = new Map<string, ContactItem>();
    for (const c of contacts) {
      if (c.phoneNumber) {
        const cleanPhone = c.phoneNumber.replace(/[^\d+]/g, "");
        if (cleanPhone) map.set(cleanPhone, c);
        map.set(c.phoneNumber, c);
      }
    }
    return map;
  }, [contacts]);

  const getContact = useCallback(
    (userId?: string | null) => {
      if (!userId) return undefined;
      return contactsMap.get(userId);
    },
    [contactsMap]
  );

  const getContactByPhone = useCallback(
    (phone?: string | null) => {
      if (!phone) return undefined;
      const cleanPhone = phone.replace(/[^\d+]/g, "");
      return contactsByPhoneMap.get(cleanPhone) || contactsByPhoneMap.get(phone);
    },
    [contactsByPhoneMap]
  );

  const value = useMemo(
    () => ({
      contacts,
      contactsMap,
      contactsByPhoneMap,
      isLoading,
      refetchContacts: fetchContactsList,
      getContact,
      getContactByPhone,
    }),
    [contacts, contactsMap, contactsByPhoneMap, isLoading, fetchContactsList, getContact, getContactByPhone]
  );

  return <ContactsContext.Provider value={value}>{children}</ContactsContext.Provider>;
};

export const useContacts = (): ContactsContextType => {
  return useContext(ContactsContext);
};
