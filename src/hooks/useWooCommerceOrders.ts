import { useQuery } from '@tanstack/react-query';
import { Sale } from '@/types/sale';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface WooCommerceOrderResponse {
  id: string;
  orderId: string;
  customerName: string;
  customerType: 'pharmacy' | 'client';
  address: string;
  city: string;
  country?: string;
  province?: string;
  lat?: number | null;
  lng?: number | null;
  amount: number;
  date: string;
  products: number | string[];
}

function isValidLatLng(lat: unknown, lng: unknown): lat is number {
  return (
    typeof lat === 'number' &&
    Number.isFinite(lat) &&
    typeof lng === 'number' &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function transformOrderToSale(order: WooCommerceOrderResponse): Sale {
  if (!isValidLatLng(order.lat, order.lng)) {
    throw new Error(`Order ${order.orderId} has invalid coordinates`);
  }
  return {
    id: order.id,
    orderId: order.orderId,
    customerName: order.customerName,
    customerType: order.customerType,
    address: order.address || '',
    city: order.city || '',
    province: order.province || '',
    country: order.country || '',
    lat: order.lat,
    lng: order.lng,
    amount: order.amount || 0,
    date: order.date,
    products: Array.isArray(order.products) 
      ? order.products 
      : order.products > 0 
        ? [`${order.products} item${order.products > 1 ? 's' : ''}`]
        : [],
  };
}

export function useWooCommerceOrders() {
  return useQuery({
    queryKey: ['woocommerce-orders'],
    queryFn: async (): Promise<Sale[]> => {
      try {
        console.log('Fetching WooCommerce orders...');
        
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
          console.error('WooCommerce API failed:', response.status);
          // Return empty array - NO mock data fallback
          return [];
        }
        
        const data = await response.json();
        
        if (data.orders && Array.isArray(data.orders) && data.orders.length > 0) {
          console.log(`Fetched ${data.orders.length} orders from WooCommerce`);
          const sales: Sale[] = [];
          let skipped = 0;
          for (const o of data.orders as WooCommerceOrderResponse[]) {
            try {
              sales.push(transformOrderToSale(o));
            } catch {
              skipped++;
            }
          }
          if (skipped > 0) {
            console.warn(`Skipped ${skipped} orders due to missing/invalid geocoding`);
          }
          return sales;
        }
        
        console.log('No orders returned from WooCommerce');
        // Return empty array - NO mock data fallback
        return [];
      } catch (error) {
        console.error('Error fetching WooCommerce orders:', error);
        // Return empty array - NO mock data fallback
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
}

// Hook to fetch orders by pharmacy name or city for matching
export function useOrdersByPharmacy(pharmacyName: string | null, city: string | null) {
  const { data: allOrders = [] } = useWooCommerceOrders();
  
  if (!pharmacyName && !city) return [];
  
  return allOrders.filter(order => {
    const nameMatch = pharmacyName && 
      order.customerName.toLowerCase().includes(pharmacyName.toLowerCase());
    const cityMatch = city && 
      order.city.toLowerCase() === city.toLowerCase();
    
    return nameMatch || (cityMatch && order.customerType === 'pharmacy');
  });
}
