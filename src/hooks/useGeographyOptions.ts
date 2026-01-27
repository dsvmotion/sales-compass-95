import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Country {
  code: string;
  name: string;
  name_local: string | null;
}

interface Province {
  id: string;
  code: string | null;
  name: string;
  name_local: string | null;
  country_code: string;
}

interface City {
  id: string;
  name: string;
  name_local: string | null;
  province_id: string;
}

/**
 * Unified geography options hook.
 * Fetches from normalized geography tables as single source of truth.
 * 
 * - Countries: All European countries from geography_countries
 * - Provinces: Filtered by selected country
 * - Cities: Filtered by selected province
 */
export function useGeographyOptions(selectedCountry: string, selectedProvince: string) {
  // Fetch all countries
  const countriesQuery = useQuery({
    queryKey: ['geography', 'countries'],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from('geography_countries')
        .select('name')
        .order('name');

      if (error) {
        console.error('Error fetching countries:', error);
        throw error;
      }

      return (data || []).map((c) => c.name);
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - reference data rarely changes
  });

  // Find country code from country name
  const countryCodeQuery = useQuery({
    queryKey: ['geography', 'country-code', selectedCountry],
    queryFn: async (): Promise<string | null> => {
      if (!selectedCountry) return null;

      const { data, error } = await supabase
        .from('geography_countries')
        .select('code')
        .eq('name', selectedCountry)
        .maybeSingle();

      if (error) {
        console.error('Error fetching country code:', error);
        throw error;
      }

      return data?.code || null;
    },
    enabled: !!selectedCountry,
    staleTime: 24 * 60 * 60 * 1000,
  });

  const countryCode = countryCodeQuery.data;

  // Fetch provinces for selected country
  const provincesQuery = useQuery({
    queryKey: ['geography', 'provinces', countryCode],
    queryFn: async (): Promise<string[]> => {
      if (!countryCode) return [];

      const { data, error } = await supabase
        .from('geography_provinces')
        .select('name')
        .eq('country_code', countryCode)
        .order('name');

      if (error) {
        console.error('Error fetching provinces:', error);
        throw error;
      }

      return (data || []).map((p) => p.name);
    },
    enabled: !!countryCode,
    staleTime: 24 * 60 * 60 * 1000,
  });

  // Find province ID from province name
  const provinceIdQuery = useQuery({
    queryKey: ['geography', 'province-id', countryCode, selectedProvince],
    queryFn: async (): Promise<string | null> => {
      if (!countryCode || !selectedProvince) return null;

      const { data, error } = await supabase
        .from('geography_provinces')
        .select('id')
        .eq('country_code', countryCode)
        .eq('name', selectedProvince)
        .maybeSingle();

      if (error) {
        console.error('Error fetching province ID:', error);
        throw error;
      }

      return data?.id || null;
    },
    enabled: !!countryCode && !!selectedProvince,
    staleTime: 24 * 60 * 60 * 1000,
  });

  const provinceId = provinceIdQuery.data;

  // Fetch cities for selected province
  const citiesQuery = useQuery({
    queryKey: ['geography', 'cities', provinceId],
    queryFn: async (): Promise<string[]> => {
      if (!provinceId) return [];

      const { data, error } = await supabase
        .from('geography_cities')
        .select('name')
        .eq('province_id', provinceId)
        .order('name');

      if (error) {
        console.error('Error fetching cities:', error);
        throw error;
      }

      return (data || []).map((c) => c.name);
    },
    enabled: !!provinceId,
    staleTime: 24 * 60 * 60 * 1000,
  });

  return {
    countries: countriesQuery.data || [],
    provinces: provincesQuery.data || [],
    cities: citiesQuery.data || [],
    isLoading:
      countriesQuery.isLoading ||
      countryCodeQuery.isLoading ||
      provincesQuery.isLoading ||
      provinceIdQuery.isLoading ||
      citiesQuery.isLoading,
  };
}

// Re-export for backwards compatibility (but this is no longer the source of truth)
export const EUROPEAN_COUNTRIES = [
  'Albania', 'Andorra', 'Austria', 'Belarus', 'Belgium', 'Bosnia and Herzegovina',
  'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic', 'Denmark', 'Estonia',
  'Finland', 'France', 'Germany', 'Greece', 'Hungary', 'Iceland', 'Ireland',
  'Italy', 'Kosovo', 'Latvia', 'Liechtenstein', 'Lithuania', 'Luxembourg',
  'Malta', 'Moldova', 'Monaco', 'Montenegro', 'Morocco', 'Netherlands',
  'North Macedonia', 'Norway', 'Poland', 'Portugal', 'Romania', 'Russia',
  'San Marino', 'Serbia', 'Slovakia', 'Slovenia', 'Spain', 'Sweden',
  'Switzerland', 'Turkey', 'Ukraine', 'United Kingdom', 'Vatican City',
];
