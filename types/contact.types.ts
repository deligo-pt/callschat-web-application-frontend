export interface SyncContactItem {
  name: string;
  phoneNumber: string;
}

export interface SyncContactsRequest {
  contacts: SyncContactItem[];
}

export interface RegisteredContact {
  id: string;
  userId?: string;
  name: string;
  phoneNumber?: string;
  avatarUrl?: string | null;
  [key: string]: unknown;
}

export interface UnregisteredContact {
  id: string;
  name: string;
  phoneNumber: string;
  isInvited?: boolean;
  invitedAt?: string | null;
  createdAt?: string;
}

export interface SyncContactsResponseData {
  registered: RegisteredContact[];
  unregistered: UnregisteredContact[];
}

export interface SyncContactsResponse {
  success?: boolean;
  data?: SyncContactsResponseData;
  registered?: RegisteredContact[];
  unregistered?: UnregisteredContact[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ListUnregisteredResponse {
  success: boolean;
  data: {
    contacts: UnregisteredContact[];
    pagination: PaginationMeta;
  };
}

export interface InviteContactRequest {
  phoneNumber: string;
  customMessage?: string;
}

export interface InviteContactResponse {
  success: boolean;
  message?: string;
  data?: UnregisteredContact;
}
