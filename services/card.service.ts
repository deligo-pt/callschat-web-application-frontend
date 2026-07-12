import apiClient from './api.client';

export interface DigitalCardData {
  cardId: string;
  userId: string;
  displayName: string;
  companyName: string;
  role: string;
  phone: string;
  email: string;
  website: string;
  address?: string | null;
  avatarUrl: string | null;
  isVerified: boolean;
  qrCodeDataUrl: string;
  shareUrl: string;
  vcardUrl: string;
  pdfUrl: string;
}

export interface UpdateDigitalCardPayload {
  companyName?: string;
  role?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  displayName?: string;
  bio?: string;
}

export const CardService = {
  getCard: async (): Promise<{ success: boolean; data: DigitalCardData }> => {
    const response = await apiClient.get('/user/card');
    return response.data;
  },

  updateCard: async (data: UpdateDigitalCardPayload): Promise<{ success: boolean; data: DigitalCardData }> => {
    const response = await apiClient.patch('/user/card', data);
    return response.data;
  },

  getPublicCard: async (idOrUsername: string): Promise<{ success: boolean; data: DigitalCardData }> => {
    const response = await apiClient.get(`/user/card/public/${idOrUsername}`);
    return response.data;
  },

  downloadPNG: async (customFilename = 'digital_card_qrcode.png') => {
    try {
      const response = await apiClient.get('/user/card/qrcode', {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'image/png' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', customFilename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download PNG:', err);
      throw err;
    }
  },

  downloadPDF: async (customFilename = 'CallsChat_Business_Card.pdf') => {
    try {
      const response = await apiClient.get('/user/card/pdf', {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', customFilename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download PDF:', err);
      throw err;
    }
  },

  downloadVCard: async (customFilename = 'business_card.vcf') => {
    try {
      const response = await apiClient.get('/user/card/vcard', {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'text/vcard; charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', customFilename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download vCard:', err);
      throw err;
    }
  },
};
