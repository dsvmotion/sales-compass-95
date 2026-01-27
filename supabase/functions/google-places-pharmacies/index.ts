import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address?: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  formatted_phone_number?: string;
  international_phone_number?: string;
  website?: string;
  opening_hours?: {
    weekday_text?: string[];
    open_now?: boolean;
  };
  address_components?: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

function extractAddressComponent(components: PlaceResult['address_components'], type: string): string | null {
  if (!components) return null;
  const component = components.find(c => c.types.includes(type));
  return component?.long_name || null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error('GOOGLE_MAPS_API_KEY is not configured');
    }

    const { action, location, radius = 50000, pageToken, placeId } = await req.json();

    if (action === 'search') {
      // Search for pharmacies near a location
      const { lat, lng } = location;
      
      let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=pharmacy&key=${GOOGLE_MAPS_API_KEY}`;
      
      if (pageToken) {
        url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?pagetoken=${pageToken}&key=${GOOGLE_MAPS_API_KEY}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.error('Google Places API error:', data);
        throw new Error(`Google Places API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
      }

      const pharmacies = (data.results || []).map((place: PlaceResult) => ({
        google_place_id: place.place_id,
        name: place.name,
        address: place.formatted_address || '',
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
      }));

      return new Response(JSON.stringify({
        pharmacies,
        nextPageToken: data.next_page_token || null,
        status: data.status,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'details') {
      // Get detailed information for a specific place
      if (!placeId) {
        throw new Error('placeId is required for details action');
      }

      const fields = 'place_id,name,formatted_address,formatted_phone_number,international_phone_number,website,opening_hours,address_components,geometry';
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_MAPS_API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK') {
        console.error('Google Places Details API error:', data);
        throw new Error(`Google Places Details API error: ${data.status}`);
      }

      const place: PlaceResult = data.result;
      const addressComponents = place.address_components;

      const pharmacy = {
        google_place_id: place.place_id,
        name: place.name,
        address: place.formatted_address || '',
        city: extractAddressComponent(addressComponents, 'locality') || 
              extractAddressComponent(addressComponents, 'administrative_area_level_4'),
        province: extractAddressComponent(addressComponents, 'administrative_area_level_2') ||
                  extractAddressComponent(addressComponents, 'administrative_area_level_1'),
        country: extractAddressComponent(addressComponents, 'country'),
        phone: place.formatted_phone_number || place.international_phone_number || null,
        website: place.website || null,
        opening_hours: place.opening_hours?.weekday_text || null,
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
        google_data: place,
      };

      return new Response(JSON.stringify({ pharmacy }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'textSearch') {
      // Text search for pharmacies in a specific area
      const { query } = await req.json();
      
      let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&type=pharmacy&key=${GOOGLE_MAPS_API_KEY}`;
      
      if (pageToken) {
        url = `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${pageToken}&key=${GOOGLE_MAPS_API_KEY}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.error('Google Places Text Search API error:', data);
        throw new Error(`Google Places API error: ${data.status}`);
      }

      const pharmacies = (data.results || []).map((place: PlaceResult) => ({
        google_place_id: place.place_id,
        name: place.name,
        address: place.formatted_address || '',
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
      }));

      return new Response(JSON.stringify({
        pharmacies,
        nextPageToken: data.next_page_token || null,
        status: data.status,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid action. Use "search", "details", or "textSearch"');

  } catch (error) {
    console.error('Error in google-places-pharmacies:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
