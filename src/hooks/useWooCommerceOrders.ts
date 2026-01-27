import { useQuery } from '@tanstack/react-query';
import { Sale } from '@/data/mockSales';

interface WooCommerceResponse {
  orders: Sale[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    perPage: number;
  };
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export function useWooCommerceOrders(enabled: boolean = true) {
  return useQuery({
    queryKey: ['woocommerce-orders'],
    queryFn: async (): Promise<WooCommerceResponse> => {
      console.log('Fetching WooCommerce orders via direct fetch...');
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/woocommerce-orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'apikey': SUPABASE_KEY,
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('WooCommerce fetch error:', response.status, errorText);
        throw new Error(`Failed to fetch orders: ${response.status}`);
      }

      const data = await response.json();
      console.log('WooCommerce orders received:', data?.orders?.length);
      return data;
    },
    enabled,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
