import { useState, useEffect, useCallback } from 'react';
import { ContactService } from '@/services/contact.service';
import { toast } from 'sonner';

export interface Contact {
  id: string;
  userId: string;
  name: string;
  phone: string;
  avatarUrl: string | null;
  isFavourite: boolean;
  isOnline: boolean;
}

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchContacts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await ContactService.fetchContacts();
      let contactsArray = [];
      if (data.success && Array.isArray(data.data)) {
        contactsArray = data.data;
      } else if (Array.isArray(data)) {
        contactsArray = data;
      } else if (data.data && Array.isArray(data.data.contacts)) {
        contactsArray = data.data.contacts;
      }

      const mappedContacts = contactsArray.map((u: any) => ({
        id: u.id,
        userId: u.addressee?.id || u.userId || u.id,
        name: u.customName || u.addressee?.profile?.displayName || u.profile?.displayName || u.profile?.username || "Unknown",
        phone: u.contact?.phone || u.phoneNumber || u.phone || "No phone number",
        avatarUrl: u.addressee?.profile?.avatarUrl || u.profile?.avatarUrl || null,
        isFavourite: u.isFavourite || false,
        isOnline: u.addressee?.profile?.isOnline || u.contact?.profile?.isOnline || u.profile?.isOnline || false
      }));
      
      // Deduplicate by userId to prevent rendering the same person twice for mutual contacts
      const uniqueContacts = Array.from(new Map<string, Contact>(mappedContacts.map((c: Contact) => [c.userId, c])).values());
      
      // Sort alphabetically
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
