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
  phone: string | null;
  email: string | null;
  commercialStatus: 'not_contacted' | 'contacted' | 'client';
  notes: string | null;
  orders: DetailedOrder[];
  lastOrder: DetailedOrder | null;
  totalRevenue: number;
  hasInvoice: boolean;
  hasReceipt: boolean;
}

export interface OperationsFilters {
  search: string;
  country: string;
  province: string;
  city: string;
  commercialStatus: 'all' | 'not_contacted' | 'contacted' | 'client';
  paymentStatus: 'all' | 'paid' | 'pending' | 'failed' | 'refunded';
}

export type SortField = 'name' | 'commercialStatus' | 'totalRevenue' | 'paymentStatus' | 'lastOrderDate';
export type SortDirection = 'asc' | 'desc';

export interface PharmacyDocument {
  id: string;
  pharmacyId: string;
  orderId: string;
  documentType: 'invoice' | 'receipt';
  filePath: string;
  fileName: string;
  uploadedAt: string;
  notes: string | null;
}
