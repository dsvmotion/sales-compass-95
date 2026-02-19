import type { ClientType } from '@/types/pharmacy';

export interface DetailedOrder {
  id: string;
  orderId: string;
  status: string;
  customerName: string;
  customerType: 'pharmacy' | 'client';
  email: string;
  phone: string;
  billingAddress: string;
  billingCity: string;
  billingProvince: string;
  billingCountry: string;
  shippingAddress: string;
  shippingCity: string;
  amount: number;
  dateCreated: string;
  datePaid: string | null;
  paymentMethod: string;
  paymentMethodTitle: string;
  paymentStatus: 'paid' | 'pending' | 'failed' | 'refunded';
  products: Array<{
    id: number;
    name: string;
    quantity: number;
    total: number;
  }>;
  paymentLinkUrl: string | null;
}

export interface PharmacyWithOrders {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  province: string | null;
  country: string | null;
  clientType: ClientType;
  phone: string | null;
  email: string | null;
  commercialStatus: 'not_contacted' | 'contacted' | 'client';
  notes: string | null;
  orders: DetailedOrder[];
  lastOrder: DetailedOrder | null;
  totalRevenue: number;
  hasInvoice: boolean;
  hasReceipt: boolean;
  lat: number;
  lng: number;
  savedAt: string | null;
  postal_code?: string | null;
  autonomous_community?: string | null;
  secondary_phone?: string | null;
  activity?: string | null;
  subsector?: string | null;
  legal_form?: string | null;
}

export interface OperationsFilters {
  search: string;
  country: string;
  province: string;
  city: string;
  commercialStatus: 'all' | 'not_contacted' | 'contacted' | 'client';
  paymentStatus: 'all' | 'paid' | 'pending' | 'failed' | 'refunded';
}

export type SortField = 'name' | 'address' | 'postal_code' | 'city' | 'province' | 'autonomous_community' | 'phone' | 'secondary_phone' | 'email' | 'activity' | 'subsector' | 'legal_form' | 'commercialStatus' | 'lastOrderDate' | 'totalRevenue' | 'paymentStatus';
export type SortDirection = 'asc' | 'desc';

export type DocumentType = 'invoice' | 'receipt' | 'contract' | 'delivery_note' | 'other';

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  invoice: 'Invoice',
  receipt: 'Receipt',
  contract: 'Contract',
  delivery_note: 'Delivery Note',
  other: 'Other',
};

export interface PharmacyDocument {
  id: string;
  pharmacyId: string;
  orderId: string | null;
  documentType: DocumentType;
  filePath: string;
  fileName: string;
  uploadedAt: string;
  notes: string | null;
}
