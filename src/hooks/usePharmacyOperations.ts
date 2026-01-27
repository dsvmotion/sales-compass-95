import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DetailedOrder, PharmacyWithOrders, PharmacyDocument } from '@/types/operations';
import { Pharmacy } from '@/types/pharmacy';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export function useDetailedOrders() {
  return useQuery({
    queryKey: ['detailed-orders'],
    queryFn: async (): Promise<DetailedOrder[]> => {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/woocommerce-orders-detailed`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'apikey': SUPABASE_KEY,
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch detailed orders:', response.status);
        return [];
      }

      const data = await response.json();
      return data.orders || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function usePharmacyDocuments() {
  return useQuery({
    queryKey: ['pharmacy-documents'],
    queryFn: async (): Promise<PharmacyDocument[]> => {
      const { data, error } = await supabase
        .from('pharmacy_order_documents')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (error) {
        console.error('Error fetching documents:', error);
        return [];
      }

      return (data || []).map(doc => ({
        id: doc.id,
        pharmacyId: doc.pharmacy_id,
        orderId: doc.order_id,
        documentType: doc.document_type as 'invoice' | 'receipt',
        filePath: doc.file_path,
        fileName: doc.file_name,
        uploadedAt: doc.uploaded_at,
        notes: doc.notes,
      }));
    },
  });
}

export function usePharmaciesWithOrders(savedOnly: boolean = true) {
  const { data: pharmacies = [], isLoading: pharmaciesLoading } = useQuery({
    queryKey: ['pharmacies', savedOnly ? 'saved' : 'all'],
    queryFn: async (): Promise<Pharmacy[]> => {
      let query = supabase
        .from('pharmacies')
        .select('*')
        .order('name');

      // Only fetch saved pharmacies for Operations view
      if (savedOnly) {
        query = query.not('saved_at', 'is', null);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching pharmacies:', error);
        return [];
      }

      return (data || []) as Pharmacy[];
    },
  });

  const { data: orders = [], isLoading: ordersLoading } = useDetailedOrders();
  const { data: documents = [], isLoading: docsLoading } = usePharmacyDocuments();

  const pharmaciesWithOrders: PharmacyWithOrders[] = pharmacies.map((pharmacy) => {
    // STRICT matching: Only match orders if the pharmacy is marked as 'client'
    // AND the order customer name matches the pharmacy name with high confidence
    let pharmacyOrders: DetailedOrder[] = [];
    
    // Only attempt to match orders for pharmacies that are clients
    // Non-contacted and contacted pharmacies should NEVER have orders
    if (pharmacy.commercial_status === 'client') {
      pharmacyOrders = orders.filter(order => {
        const orderName = order.customerName.toLowerCase().trim();
        const pharmacyName = pharmacy.name.toLowerCase().trim();
        
        // Require strong match:
        // 1. Exact match, OR
        // 2. Order name starts with pharmacy name (or vice versa) with at least 80% length overlap
        if (orderName === pharmacyName) return true;
        
        // Check if one is a significant substring of the other
        const minLength = Math.min(orderName.length, pharmacyName.length);
        const maxLength = Math.max(orderName.length, pharmacyName.length);
        
        // Only match if the shorter string is at least 80% of the longer one
        if (minLength / maxLength < 0.8) return false;
        
        // And one must contain the other
        return orderName.includes(pharmacyName) || pharmacyName.includes(orderName);
      });
    }

    // Sort orders by date (newest first)
    const sortedOrders = [...pharmacyOrders].sort(
      (a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
    );

    // Only set lastOrder if there are REAL matched orders
    const lastOrder = sortedOrders.length > 0 ? sortedOrders[0] : null;
    const totalRevenue = pharmacyOrders.reduce((sum, o) => sum + o.amount, 0);

    // Check for documents
    const pharmacyDocs = documents.filter(d => d.pharmacyId === pharmacy.id);
    const hasInvoice = pharmacyDocs.some(d => d.documentType === 'invoice');
    const hasReceipt = pharmacyDocs.some(d => d.documentType === 'receipt');

    return {
      id: pharmacy.id,
      name: pharmacy.name,
      address: pharmacy.address,
      city: pharmacy.city,
      province: pharmacy.province,
      country: pharmacy.country,
      phone: pharmacy.phone,
      email: pharmacy.email,
      commercialStatus: pharmacy.commercial_status,
      notes: pharmacy.notes,
      orders: sortedOrders,
      lastOrder,
      totalRevenue,
      hasInvoice,
      hasReceipt,
    };
  });

  return {
    data: pharmaciesWithOrders,
    isLoading: pharmaciesLoading || ordersLoading || docsLoading,
  };
}

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pharmacyId,
      orderId,
      documentType,
      file,
    }: {
      pharmacyId: string;
      orderId: string;
      documentType: 'invoice' | 'receipt';
      file: File;
    }) => {
      // Upload file to storage
      const filePath = `${pharmacyId}/${orderId}/${documentType}-${Date.now()}-${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('pharmacy-documents')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Create document record
      const { data, error } = await supabase
        .from('pharmacy_order_documents')
        .insert({
          pharmacy_id: pharmacyId,
          order_id: orderId,
          document_type: documentType,
          file_path: filePath,
          file_name: file.name,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to save document record: ${error.message}`);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-documents'] });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, filePath }: { id: string; filePath: string }) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('pharmacy-documents')
        .remove([filePath]);

      if (storageError) {
        console.warn('Failed to delete file from storage:', storageError);
      }

      // Delete record
      const { error } = await supabase
        .from('pharmacy_order_documents')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete document: ${error.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-documents'] });
    },
  });
}

export function useDownloadDocument() {
  return useMutation({
    mutationFn: async (filePath: string) => {
      const { data, error } = await supabase.storage
        .from('pharmacy-documents')
        .download(filePath);

      if (error) {
        throw new Error(`Download failed: ${error.message}`);
      }

      return data;
    },
  });
}
