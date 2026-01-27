import { useQuery } from '@tanstack/react-query';
import { mockSales, Sale } from '@/data/mockSales';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface WooCommerceOrder {
  id: number;
  status: string;
  total: string;
  billing: {
    first_name: string;
    last_name: string;
    company?: string;
    address_1?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  date_created: string;
  line_items: Array<{
    name: string;
    quantity: number;
  }>;
  meta_data?: Array<{
    key: string;
    value: string;
  }>;
}

function transformOrderToSale(order: WooCommerceOrder, index: number): Sale {
  // Try to get coordinates from meta data or use random Spanish location
  const spanishCities = [
    { city: 'Madrid', lat: 40.4168, lng: -3.7038 },
    { city: 'Barcelona', lat: 41.3851, lng: 2.1734 },
    { city: 'Valencia', lat: 39.4699, lng: -0.3763 },
    { city: 'Seville', lat: 37.3891, lng: -5.9845 },
    { city: 'Bilbao', lat: 43.263, lng: -2.935 },
  ];
  
  const cityData = spanishCities.find(c => 
    order.billing.city?.toLowerCase().includes(c.city.toLowerCase())
  ) || spanishCities[index % spanishCities.length];
  
  // Add some variance to prevent all markers from stacking
  const latVariance = (Math.random() - 0.5) * 0.05;
  const lngVariance = (Math.random() - 0.5) * 0.05;
  
  const isPharmacy = order.billing.company?.toLowerCase().includes('farmacia') || 
                     order.billing.company?.toLowerCase().includes('pharmacy') ||
                     Math.random() > 0.4;
  
  return {
    id: `woo-${order.id}`,
    orderId: `WC-${order.id}`,
    customerName: order.billing.company || 
                  `${order.billing.first_name} ${order.billing.last_name}`,
    customerType: isPharmacy ? 'pharmacy' : 'client',
    address: order.billing.address_1 || 'Unknown Address',
    city: order.billing.city || cityData.city,
    province: order.billing.state || '',
    country: order.billing.country || 'Spain',
    lat: cityData.lat + latVariance,
    lng: cityData.lng + lngVariance,
    amount: parseFloat(order.total) || 0,
    date: order.date_created,
    products: order.line_items.map(item => item.name),
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
          console.warn('WooCommerce API failed, using demo data');
          return mockSales;
        }
        
        const data = await response.json();
        
        if (data.orders && Array.isArray(data.orders) && data.orders.length > 0) {
          console.log(`Fetched ${data.orders.length} orders from WooCommerce`);
          return data.orders.map((order: WooCommerceOrder, index: number) => 
            transformOrderToSale(order, index)
          );
        }
        
        console.log('No orders returned, using demo data');
        return mockSales;
      } catch (error) {
        console.error('Error fetching WooCommerce orders:', error);
        return mockSales;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
}
