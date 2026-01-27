import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface GeographyOptions {
  countries: string[];
  provinces: string[];
  cities: string[];
}

/**
 * Fetches distinct geographic values from the pharmacies table.
 * Respects strict hierarchy: Province options depend on selected Country,
 * City options depend on selected Province (and Country).
 */
export function useGeographyOptions(selectedCountry: string, selectedProvince: string) {
  // Fetch all distinct countries
  const countriesQuery = useQuery({
    queryKey: ['geography', 'countries'],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from('pharmacies')
        .select('country')
        .not('country', 'is', null)
        .order('country');

      if (error) {
        console.error('Error fetching countries:', error);
        throw error;
      }

      // Deduplicate and filter empty
      const unique = [...new Set((data || []).map((d) => d.country).filter(Boolean))] as string[];
      return unique.sort((a, b) => a.localeCompare(b));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch provinces for selected country
  const provincesQuery = useQuery({
    queryKey: ['geography', 'provinces', selectedCountry],
    queryFn: async (): Promise<string[]> => {
      if (!selectedCountry) return [];

      const { data, error } = await supabase
        .from('pharmacies')
        .select('province')
        .eq('country', selectedCountry)
        .not('province', 'is', null)
        .order('province');

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

  // Fetch cities for selected province (and country)
  const citiesQuery = useQuery({
    queryKey: ['geography', 'cities', selectedCountry, selectedProvince],
    queryFn: async (): Promise<string[]> => {
      if (!selectedProvince) return [];

      let query = supabase
        .from('pharmacies')
        .select('city')
        .eq('province', selectedProvince)
        .not('city', 'is', null)
        .order('city');

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
    countries: countriesQuery.data || [],
    provinces: provincesQuery.data || [],
    cities: citiesQuery.data || [],
    isLoading: countriesQuery.isLoading || provincesQuery.isLoading || citiesQuery.isLoading,
  };
}
