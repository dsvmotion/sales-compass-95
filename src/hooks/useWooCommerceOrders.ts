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
      const { data, error } = await supabase.functions.invoke('woocommerce-orders', {
        body: null,
      });

      if (error) {
        throw new Error(error.message || 'Failed to fetch orders');
      }

      return data;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}
