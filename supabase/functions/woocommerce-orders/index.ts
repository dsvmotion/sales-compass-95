import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WooCommerceOrder {
  id: number;
  number: string;
  status: string;
  date_created: string;
  total: string;
  billing: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    city: string;
    country: string;
    email: string;
  };
  line_items: Array<{
    id: number;
    name: string;
    quantity: number;
  }>;
  meta_data: Array<{
    key: string;
    value: string;
  }>;
}

interface GeocodedOrder {
  id: string;
  customerName: string;
  customerType: 'pharmacy' | 'client';
  address: string;
  city: string;
  lat: number;
  lng: number;
  amount: number;
  date: string;
  products: number;
  orderId: string;
}

// City coordinates cache for Spain (faster than geocoding each address)
const cityCoords: Record<string, { lat: number; lng: number }> = {
  'madrid': { lat: 40.4168, lng: -3.7038 },
  'barcelona': { lat: 41.3851, lng: 2.1734 },
  'valencia': { lat: 39.4699, lng: -0.3763 },
  'sevilla': { lat: 37.3891, lng: -5.9845 },
  'seville': { lat: 37.3891, lng: -5.9845 },
  'zaragoza': { lat: 41.6488, lng: -0.8891 },
  'málaga': { lat: 36.7213, lng: -4.4214 },
  'malaga': { lat: 36.7213, lng: -4.4214 },
  'murcia': { lat: 37.9922, lng: -1.1307 },
  'bilbao': { lat: 43.2630, lng: -2.9350 },
  'alicante': { lat: 38.3452, lng: -0.4815 },
  'córdoba': { lat: 37.8882, lng: -4.7794 },
  'cordoba': { lat: 37.8882, lng: -4.7794 },
  'valladolid': { lat: 41.6523, lng: -4.7245 },
  'vigo': { lat: 42.2406, lng: -8.7207 },
  'gijón': { lat: 43.5322, lng: -5.6611 },
  'gijon': { lat: 43.5322, lng: -5.6611 },
  'a coruña': { lat: 43.3623, lng: -8.4115 },
  'la coruña': { lat: 43.3623, lng: -8.4115 },
  'granada': { lat: 37.1773, lng: -3.5986 },
  'vitoria': { lat: 42.8467, lng: -2.6716 },
  'santander': { lat: 43.4623, lng: -3.8099 },
  'oviedo': { lat: 43.3614, lng: -5.8493 },
  'pamplona': { lat: 42.8125, lng: -1.6458 },
  'san sebastián': { lat: 43.3183, lng: -1.9812 },
  'san sebastian': { lat: 43.3183, lng: -1.9812 },
  'donostia': { lat: 43.3183, lng: -1.9812 },
  'palma': { lat: 39.5696, lng: 2.6502 },
  'las palmas': { lat: 28.1235, lng: -15.4363 },
  'santa cruz de tenerife': { lat: 28.4636, lng: -16.2518 },
  'burgos': { lat: 42.3439, lng: -3.6969 },
  'salamanca': { lat: 40.9688, lng: -5.6631 },
  'león': { lat: 42.5987, lng: -5.5671 },
  'leon': { lat: 42.5987, lng: -5.5671 },
  'tarragona': { lat: 41.1189, lng: 1.2445 },
  'lleida': { lat: 41.6176, lng: 0.6200 },
  'girona': { lat: 41.9794, lng: 2.8214 },
  'cádiz': { lat: 36.5271, lng: -6.2886 },
  'cadiz': { lat: 36.5271, lng: -6.2886 },
  'huelva': { lat: 37.2614, lng: -6.9447 },
  'jaén': { lat: 37.7796, lng: -3.7849 },
  'jaen': { lat: 37.7796, lng: -3.7849 },
  'almería': { lat: 36.8340, lng: -2.4637 },
  'almeria': { lat: 36.8340, lng: -2.4637 },
  'toledo': { lat: 39.8628, lng: -4.0273 },
  'albacete': { lat: 38.9942, lng: -1.8585 },
  'badajoz': { lat: 38.8794, lng: -6.9707 },
  'logroño': { lat: 42.4627, lng: -2.4449 },
  'logrono': { lat: 42.4627, lng: -2.4449 },
  'castellón': { lat: 39.9864, lng: -0.0513 },
  'castellon': { lat: 39.9864, lng: -0.0513 },
  'pontevedra': { lat: 42.4310, lng: -8.6446 },
  'lugo': { lat: 43.0097, lng: -7.5567 },
  'ourense': { lat: 42.3364, lng: -7.8639 },
  'huesca': { lat: 42.1401, lng: -0.4089 },
  'teruel': { lat: 40.3456, lng: -1.1065 },
  'cuenca': { lat: 40.0704, lng: -2.1374 },
  'guadalajara': { lat: 40.6337, lng: -3.1674 },
  'segovia': { lat: 40.9429, lng: -4.1088 },
  'ávila': { lat: 40.6566, lng: -4.6818 },
  'avila': { lat: 40.6566, lng: -4.6818 },
  'soria': { lat: 41.7636, lng: -2.4649 },
  'zamora': { lat: 41.5034, lng: -5.7467 },
  'palencia': { lat: 42.0096, lng: -4.5288 },
  'cáceres': { lat: 39.4753, lng: -6.3724 },
  'caceres': { lat: 39.4753, lng: -6.3724 },
  'mérida': { lat: 38.9160, lng: -6.3435 },
  'merida': { lat: 38.9160, lng: -6.3435 },
  'ciudad real': { lat: 38.9848, lng: -3.9274 },
  'rubí': { lat: 41.4943, lng: 2.0329 },
  'rubi': { lat: 41.4943, lng: 2.0329 },
  'majadahonda': { lat: 40.4728, lng: -3.8722 },
  'pinto': { lat: 40.2426, lng: -3.6988 },
  "la seu d'urgell": { lat: 42.3578, lng: 1.4561 },
  'a pastoriza': { lat: 43.2833, lng: -7.5667 },
  'san antonio de benageber': { lat: 39.5667, lng: -0.4833 },
};

// Get coordinates for a city (with slight random offset for visual spread)
function getCityCoords(city: string): { lat: number; lng: number } | null {
  const normalizedCity = city.toLowerCase().trim();
  const coords = cityCoords[normalizedCity];
  
  if (coords) {
    // Add small random offset so markers don't stack exactly
    const offset = () => (Math.random() - 0.5) * 0.02;
    return {
      lat: coords.lat + offset(),
      lng: coords.lng + offset()
    };
  }
  
  // Try partial match
  for (const [key, value] of Object.entries(cityCoords)) {
    if (normalizedCity.includes(key) || key.includes(normalizedCity)) {
      const offset = () => (Math.random() - 0.5) * 0.02;
      return {
        lat: value.lat + offset(),
        lng: value.lng + offset()
      };
    }
  }
  
  return null;
}

// Detect if customer is a pharmacy based on company name or metadata
function isPharmacy(order: WooCommerceOrder): boolean {
  const companyName = order.billing.company?.toLowerCase() || '';
  const pharmacyKeywords = ['farmacia', 'pharmacy', 'pharma', 'botica', 'drogueria', 'apoteca'];
  
  // Check company name
  if (pharmacyKeywords.some(keyword => companyName.includes(keyword))) {
    return true;
  }
  
  // Check metadata for customer type
  const customerTypeMeta = order.meta_data?.find(
    meta => meta.key === 'customer_type' || meta.key === '_customer_type'
  );
  if (customerTypeMeta?.value?.toLowerCase() === 'pharmacy') {
    return true;
  }
  
  return false;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const wooUrl = Deno.env.get('WOOCOMMERCE_URL');
    const consumerKey = Deno.env.get('WOOCOMMERCE_CONSUMER_KEY');
    const consumerSecret = Deno.env.get('WOOCOMMERCE_CONSUMER_SECRET');

    if (!wooUrl || !consumerKey || !consumerSecret) {
      return new Response(
        JSON.stringify({ error: 'WooCommerce credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse query parameters
    const url = new URL(req.url);
    const perPage = url.searchParams.get('per_page') || '50';
    const page = url.searchParams.get('page') || '1';
    const status = url.searchParams.get('status') || 'completed,processing';

    // Fetch orders from WooCommerce
    const baseUrl = wooUrl.endsWith('/') ? wooUrl.slice(0, -1) : wooUrl;
    const apiUrl = `${baseUrl}/wp-json/wc/v3/orders?per_page=${perPage}&page=${page}&status=${status}`;
    
    const authHeader = 'Basic ' + btoa(`${consumerKey}:${consumerSecret}`);
    
    const wooResponse = await fetch(apiUrl, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });

    if (!wooResponse.ok) {
      const errorText = await wooResponse.text();
      console.error('WooCommerce API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch orders from WooCommerce', details: errorText }),
        { status: wooResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const orders: WooCommerceOrder[] = await wooResponse.json();
    
    // Transform and geocode orders
    const geocodedOrders: GeocodedOrder[] = [];
    
    for (const order of orders) {
      const customerName = order.billing.company || 
        `${order.billing.first_name} ${order.billing.last_name}`.trim();
      
      // Get coordinates from city cache (fast, no API call)
      const coords = getCityCoords(order.billing.city);
      
      // Skip orders without valid coordinates
      if (!coords) {
        console.log(`Unknown city for order ${order.number}: ${order.billing.city}`);
        continue;
      }
      
      geocodedOrders.push({
        id: order.id.toString(),
        customerName,
        customerType: isPharmacy(order) ? 'pharmacy' : 'client',
        address: order.billing.address_1,
        city: order.billing.city,
        lat: coords.lat,
        lng: coords.lng,
        amount: parseFloat(order.total),
        date: order.date_created.split('T')[0],
        products: order.line_items.reduce((sum, item) => sum + item.quantity, 0),
        orderId: `WC-${order.number}`
      });
    }

    // Get total count from headers
    const totalOrders = wooResponse.headers.get('X-WP-Total') || '0';
    const totalPages = wooResponse.headers.get('X-WP-TotalPages') || '1';

    return new Response(
      JSON.stringify({
        orders: geocodedOrders,
        pagination: {
          total: parseInt(totalOrders),
          totalPages: parseInt(totalPages),
          currentPage: parseInt(page),
          perPage: parseInt(perPage)
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
