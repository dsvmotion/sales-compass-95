import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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

export function useWooCommerceOrders(enabled: boolean = true) {
  return useQuery({
    queryKey: ['woocommerce-orders'],
    queryFn: async (): Promise<WooCommerceResponse> => {
      console.log('Fetching WooCommerce orders...');
      const { data, error } = await supabase.functions.invoke('woocommerce-orders', {
        body: {},
      });

      if (error) {
        console.error('WooCommerce fetch error:', error);
        throw new Error(error.message || 'Failed to fetch orders');
      }

      console.log('WooCommerce orders received:', data?.orders?.length);
      return data;
    },
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
