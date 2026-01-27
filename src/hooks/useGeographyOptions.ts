import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Complete list of European countries
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

/**
 * Fetches geographic options for filters.
 * - Countries: Static European list (always complete)
 * - Provinces: From database for selected country
 * - Cities: From database for selected province
 */
export function useGeographyOptions(selectedCountry: string, selectedProvince: string) {
  // Fetch provinces for selected country
  const provincesQuery = useQuery({
    queryKey: ['geography', 'provinces', selectedCountry],
    queryFn: async (): Promise<string[]> => {
      if (!selectedCountry) return [];

      const { data, error } = await supabase
        .from('pharmacies')
        .select('province')
        .eq('country', selectedCountry)
        .not('province', 'is', null);

      if (error) {
        console.error('Error fetching provinces:', error);
        throw error;
      }

      const unique = [...new Set((data || []).map((d) => d.province).filter(Boolean))] as string[];
      return unique.sort((a, b) => a.localeCompare(b));
    },
    enabled: !!selectedCountry,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch cities for selected province
  const citiesQuery = useQuery({
    queryKey: ['geography', 'cities', selectedCountry, selectedProvince],
    queryFn: async (): Promise<string[]> => {
      if (!selectedProvince) return [];

      let query = supabase
        .from('pharmacies')
        .select('city')
        .eq('province', selectedProvince)
        .not('city', 'is', null);

      if (selectedCountry) {
        query = query.eq('country', selectedCountry);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching cities:', error);
        throw error;
      }

      const unique = [...new Set((data || []).map((d) => d.city).filter(Boolean))] as string[];
      return unique.sort((a, b) => a.localeCompare(b));
    },
    enabled: !!selectedProvince,
    staleTime: 5 * 60 * 1000,
  });

  return {
    countries: EUROPEAN_COUNTRIES,
    provinces: provincesQuery.data || [],
    cities: citiesQuery.data || [],
    isLoading: provincesQuery.isLoading || citiesQuery.isLoading,
  };
}
