"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { ContactService } from "@/services/contact.service";

export interface ContactItem {
  id: string; // Contact relationship ID
  userId: string; // Target user's account ID
  customName: string | null; // Saved custom nickname/name
  displayName: string | null; // Profile display name set by the user themselves
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

const ContactsContext = createContext<ContactsContextType | undefined>(undefined);

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
          const target = c.contact || c.addressee || c.user || {};
          const profile = target.profile || c.profile || {};
          const targetId = target.id || c.userId || c.id;

          if (!targetId) return null;

          return {
            id: c.id,
            userId: targetId,
            customName: c.customName || c.nickname || null,
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
    // Only attempt fetch if an auth token is present
    if (typeof window !== "undefined" && localStorage.getItem("accessToken")) {
      fetchContactsList();
    } else {
      setIsLoading(false);
    }
  }, [fetchContactsList]);

  // Fast O(1) lookups
  const contactsMap = useMemo(() => {
    const map = new Map<string, ContactItem>();
    for (const c of contacts) {
      if (c.userId) {
        map.set(c.userId, c);
      }
    }
    return map;
  }, [contacts]);

  const contactsByPhoneMap = useMemo(() => {
    const map = new Map<string, ContactItem>();
    for (const c of contacts) {
      if (c.phoneNumber) {
        // Strip non-digits or clean spaces for resilient phone matching
        const cleanPhone = c.phoneNumber.replace(/[^\d+]/g, "");
        map.set(cleanPhone, c);
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

const defaultContactsContext: ContactsContextType = {
  contacts: [],
  contactsMap: new Map(),
  contactsByPhoneMap: new Map(),
  isLoading: false,
  refetchContacts: async () => {},
  getContact: () => undefined,
  getContactByPhone: () => undefined,
};

export const useContacts = (): ContactsContextType => {
  const context = useContext(ContactsContext);
  if (!context) {
    return defaultContactsContext;
  }
  return context;
};
