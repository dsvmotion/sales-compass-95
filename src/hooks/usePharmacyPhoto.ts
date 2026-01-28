import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface UsePharmacyPhotoResult {
  photoUrl: string | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch and display a pharmacy's Google Places photo.
 * Uses the photo_reference from google_data to construct the photo URL.
 */
export function usePharmacyPhoto(pharmacyId: string | null): UsePharmacyPhotoResult {
  const { data: photoUrl, isLoading, error } = useQuery({
    queryKey: ['pharmacy-photo', pharmacyId],
    queryFn: async (): Promise<string | null> => {
      if (!pharmacyId) return null;

      // Fetch pharmacy to get google_data
      const { data: pharmacy, error: fetchError } = await supabase
        .from('pharmacies')
        .select('google_data')
        .eq('id', pharmacyId)
        .single();

      if (fetchError || !pharmacy?.google_data) {
        return null;
      }

      const googleData = pharmacy.google_data as Record<string, unknown>;
      
      // Try to get photo reference from google_data
      const photos = googleData.photos as Array<{ photo_reference?: string }> | undefined;
      const photoReference = photos?.[0]?.photo_reference;

      if (!photoReference) {
        return null;
      }

      // Request photo URL from edge function
      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/google-places-pharmacies`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${SUPABASE_KEY}`,
            apikey: SUPABASE_KEY,
          },
          body: JSON.stringify({
            action: 'photo',
            photoReference,
            maxWidth: 400,
          }),
        });

        if (!response.ok) {
          console.warn('Failed to fetch photo URL');
          return null;
        }

        const data = await response.json();
        return data.photoUrl || null;
      } catch (e) {
        console.warn('Error fetching pharmacy photo:', e);
        return null;
      }
    },
    enabled: !!pharmacyId,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });

  return {
    photoUrl: photoUrl ?? null,
    isLoading,
    error: error as Error | null,
  };
}
