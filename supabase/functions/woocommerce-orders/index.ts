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
    address_2?: string;
    city: string;
    state?: string;
    postcode?: string;
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

type GeocodeResult = {
  location: { lat: number; lng: number };
  location_type?: string;
};

const geocodeCache = new Map<string, GeocodeResult | null>();

function normalizeAddressForCache(addr: string): string {
  return addr.trim().replace(/\s+/g, ' ').toLowerCase();
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

async function geocodeFullAddress(address: string): Promise<GeocodeResult | null> {
  const key = normalizeAddressForCache(address);
  if (geocodeCache.has(key)) return geocodeCache.get(key) ?? null;

  const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
  if (!apiKey) {
    geocodeCache.set(key, null);
    return null;
  }

  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('address', address);
  url.searchParams.set('key', apiKey);

  const resp = await fetch(url.toString());
  if (!resp.ok) {
    geocodeCache.set(key, null);
    return null;
  }

  const json = await resp.json();
  const first = json?.results?.[0];
  const loc = first?.geometry?.location;
  const locationType = first?.geometry?.location_type;

  if (!isValidLatLng(loc?.lat, loc?.lng)) {
    geocodeCache.set(key, null);
    return null;
  }

  // Strict reliability gate: accept only precise-ish results.
  const allowed = new Set(['ROOFTOP', 'RANGE_INTERPOLATED']);
  if (locationType && !allowed.has(String(locationType))) {
    geocodeCache.set(key, null);
    return null;
  }

  const result: GeocodeResult = { location: { lat: loc.lat, lng: loc.lng }, location_type: locationType };
  geocodeCache.set(key, result);
  return result;
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
    let skippedNoGeocode = 0;
    
    for (const order of orders) {
      const customerName = order.billing.company || 
        `${order.billing.first_name} ${order.billing.last_name}`.trim();

      const addressParts = [
        order.billing.address_1,
        order.billing.address_2,
        order.billing.postcode,
        order.billing.city,
        order.billing.state,
        order.billing.country,
      ].filter((x) => typeof x === 'string' && x.trim().length > 0) as string[];
      const fullAddress = addressParts.join(', ');

      const geo = await geocodeFullAddress(fullAddress);
      if (!geo) {
        skippedNoGeocode++;
        continue;
      }
      
      geocodedOrders.push({
        id: order.id.toString(),
        customerName,
        customerType: isPharmacy(order) ? 'pharmacy' : 'client',
        address: order.billing.address_1,
        city: order.billing.city,
        lat: geo.location.lat,
        lng: geo.location.lng,
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
        skipped: {
          no_geocode: skippedNoGeocode,
        },
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
