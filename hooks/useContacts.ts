import { useState, useEffect, useCallback } from 'react';
import { ContactService } from '@/services/contact.service';
import { toast } from 'sonner';
import { getOptimizedImageUrl } from '@/utils/image';

export interface Contact {
  id: string;
  userId: string;
  name: string;
  phone: string;
  avatarUrl: string | null;
  isFavourite: boolean;
  isOnline: boolean;
  isUnregistered?: boolean;
}

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchContacts = useCallback(async () => {
    setIsLoading(true);
    try {
      const [data, unregResponse] = await Promise.all([
        ContactService.fetchContacts(),
        ContactService.listUnregisteredContacts({ limit: 100 }).catch(() => ({ success: false, data: { contacts: [] } }))
      ]);

      let contactsArray = [];
      if (Array.isArray(data)) {
        contactsArray = data;
      } else if (data && Array.isArray(data.data)) {
        contactsArray = data.data;
      } else if (data && data.data && Array.isArray(data.data.contacts)) {
        contactsArray = data.data.contacts;
      } else if (data && data.data && Array.isArray(data.data.items)) {
        contactsArray = data.data.items;
      } else if (data && data.data && Array.isArray(data.data.list)) {
        contactsArray = data.data.list;
      } else if (data && data.data && Array.isArray(data.data.users)) {
        contactsArray = data.data.users;
      } else if (data && Array.isArray(data.contacts)) {
        contactsArray = data.contacts;
      } else if (data && Array.isArray(data.items)) {
        contactsArray = data.items;
      } else if (data && Array.isArray(data.list)) {
        contactsArray = data.list;
      } else if (data && Array.isArray(data.users)) {
        contactsArray = data.users;
      }

      const getFullName = (profile: any) => {
        if (!profile) return "";
        if (profile.firstName || profile.lastName) {
          return `${profile.firstName || ""} ${profile.lastName || ""}`.trim();
        }
        return profile.displayName || profile.username || "";
      };

      const mappedContacts = contactsArray.map((u: any, idx: number) => {
        const id = u.id || u._id || u.addressee?.id || u.contact?.id || `contact-${idx}`;
        
        let targetUserId = "";
        let targetProfile = null;
        let targetPhone = "";
        
        // Find the user ID from token
        let myId = "";
        if (typeof window !== "undefined") {
          const token = localStorage.getItem("accessToken");
          if (token) {
            try {
              const payload = JSON.parse(atob(token.split('.')[1]));
              myId = payload.sub || payload.id || "";
            } catch (e) {}
          }
        }

        if (u.requesterId && u.addresseeId) {
          if (myId && u.requesterId === myId) {
            targetUserId = u.addresseeId;
            targetProfile = u.addressee?.profile;
            targetPhone = u.addressee?.phone;
          } else if (myId && u.addresseeId === myId) {
            targetUserId = u.requesterId;
            targetProfile = u.contact?.profile;
            targetPhone = u.contact?.phone;
          } else {
            targetUserId = u.addresseeId;
            targetProfile = u.addressee?.profile;
            targetPhone = u.addressee?.phone;
          }
        } else {
          targetUserId = u.addressee?.id || u.addresseeId || u.userId || u.user?.id || u.contact?.userId || u.contact?.id || u.contactId || u.id || id;
          targetProfile = u.addressee?.profile || u.contact?.profile || u.profile || u.user?.profile;
          targetPhone = u.contact?.phone || u.phoneNumber || u.phone || u.user?.phone || u.addressee?.phone;
        }

        const userId = targetUserId;
        const name = u.customName || u.name || getFullName(targetProfile) || "Unknown";
        const phone = targetPhone || "No phone number";
        const rawAvatarUrl = u.avatarUrl || targetProfile?.avatarUrl || null;
        const avatarUrl = rawAvatarUrl ? getOptimizedImageUrl(rawAvatarUrl, 52, 52) : null;
        const isFavourite = u.isFavourite || false;
        const isOnline = u.addressee?.profile?.isOnline || u.contact?.profile?.isOnline || u.profile?.isOnline || u.user?.profile?.isOnline || false;

        console.log(`[DEBUG Contacts] id=${id}, targetUserId=${targetUserId}, name=${name}, isFavourite=${isFavourite}`);

        return {
          id,
          userId,
          name,
          phone,
          avatarUrl,
          isFavourite,
          isOnline
        };
      });

      const unregArray = unregResponse?.data?.contacts || (unregResponse as any)?.contacts || [];
      const mappedUnreg = unregArray.map((u: any, idx: number) => ({
        id: u.id || `unreg-${idx}`,
        userId: "",
        name: u.name || "Unknown",
        phone: u.phoneNumber || u.phone || "No phone number",
        avatarUrl: null,
        isFavourite: false,
        isOnline: false,
        isUnregistered: true,
      }));

      const uniqueMap = new Map<string, Contact>();
      const seenPhones = new Set<string>();

      for (const c of mappedContacts) {
        const key = c.userId || c.id || Math.random().toString();
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, c);
          if (c.phone) seenPhones.add(c.phone.replace(/\D/g, ""));
        }
      }

      for (const c of mappedUnreg) {
        const cleanPhone = c.phone ? c.phone.replace(/\D/g, "") : "";
        if (!cleanPhone || !seenPhones.has(cleanPhone)) {
          const key = c.id || Math.random().toString();
          if (!uniqueMap.has(key)) {
            uniqueMap.set(key, c);
            if (cleanPhone) seenPhones.add(cleanPhone);
          }
        }
      }

      const uniqueContacts = Array.from(uniqueMap.values());
      uniqueContacts.sort((a, b) => a.name.localeCompare(b.name));
      setContacts(uniqueContacts);
    } catch (error) {
      console.error("Failed to fetch contacts", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
    
    const handleUpdate = () => {
      fetchContacts();
    };

    window.addEventListener('contactsUpdated', handleUpdate);
    return () => window.removeEventListener('contactsUpdated', handleUpdate);
  }, [fetchContacts]);

  const handleToggleFavourite = async (contactId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    
    // Optimistic Update
    setContacts(prev => prev.map(c => c.id === contactId ? { ...c, isFavourite: newStatus } : c));
    
    try {
      await ContactService.toggleFavourite(contactId, newStatus);
    } catch (error) {
      // Rollback on Error
      setContacts(prev => prev.map(c => c.id === contactId ? { ...c, isFavourite: currentStatus } : c));
      toast.error("Failed to update favorite status");
    }
  };

  return {
    contacts,
    setContacts,
    isLoading,
    searchQuery,
    setSearchQuery,
    fetchContacts,
    handleToggleFavourite
  };
}
