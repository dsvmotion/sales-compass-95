import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Pharmacy, type ClientType } from '@/types/pharmacy';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface SearchFilters {
  country: string;
  province: string;
  city: string;
  clientType?: ClientType;
}

interface GooglePlaceBasic {
  google_place_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

interface GooglePlaceDetails {
  google_place_id: string;
  name: string;
  address: string;
  city: string | null;
  province: string | null;
  country: string | null;
  phone: string | null;
  website: string | null;
  opening_hours: string[] | null;
  lat: number;
  lng: number;
  google_data: Record<string, unknown> | null;
}

/**
 * Hook for manual pharmacy search.
 * - Triggered only by explicit `executeSearch()` call.
 * - Does NOT auto-search on filter changes.
 * - Handles full Google Places pagination.
 * - Caches results to local DB.
 */
export function useProspectingSearch() {
  const [results, setResults] = useState<Pharmacy[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [progress, setProgress] = useState({ found: 0, cached: 0 });
  const [detectedLocation, setDetectedLocation] = useState<{ country: string; province: string } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const clearResults = useCallback(() => {
    setResults([]);
    setHasSearched(false);
    setProgress({ found: 0, cached: 0 });
    setDetectedLocation(null);
  }, []);

  /**
   * Execute a pharmacy search for the given filters.
   * Uses Google Places Text Search to find pharmacies in the specified area.
   */
  const executeSearch = useCallback(async (filters: SearchFilters) => {
    // Validate at least one geographic filter
    if (!filters.country && !filters.province && !filters.city) {
      toast.error('Please select at least one geographic filter');
      return;
    }

    // Abort any ongoing search
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    setIsSearching(true);
    setHasSearched(true);
    setResults([]);
    setProgress({ found: 0, cached: 0 });
    setDetectedLocation(null);

    try {
      // Build search query for Google Places
      const locationParts = [filters.city, filters.province, filters.country].filter(Boolean);
      let searchTerm: string;
      const country = filters.country?.toLowerCase() || '';
      if (filters.clientType === 'herbalist') {
        if (country === 'spain' || country === 'españa') searchTerm = 'herbolario';
        else if (country === 'france' || country === 'francia') searchTerm = 'herboristerie';
        else if (country === 'germany' || country === 'alemania') searchTerm = 'kräuterladen';
        else if (country === 'italy' || country === 'italia') searchTerm = 'erboristeria';
        else if (country === 'portugal') searchTerm = 'ervanária';
        else searchTerm = 'herbalist';
      } else {
        if (country === 'spain' || country === 'españa') searchTerm = 'farmacia';
        else if (country === 'france' || country === 'francia') searchTerm = 'pharmacie';
        else if (country === 'germany' || country === 'alemania') searchTerm = 'apotheke';
        else if (country === 'italy' || country === 'italia') searchTerm = 'farmacia';
        else if (country === 'portugal') searchTerm = 'farmácia';
        else searchTerm = 'pharmacy';
      }
      const searchQuery = `${searchTerm} in ${locationParts.join(', ')}`;

      console.log('Executing pharmacy search:', searchQuery);

      // Collect all results with FULL pagination - no artificial limits
      // Google Places Text Search returns up to 60 results (20 per page × 3 pages max)
      const allBasicResults: GooglePlaceBasic[] = [];
      let nextPageToken: string | null = null;
      let pageCount = 0;
      // NO maxPages limit - fully paginate until Google returns no more results

      do {
        // Wait before using pageToken (Google requires ~2s delay)
        if (nextPageToken) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }

        if (signal.aborted) {
          console.log('Search aborted');
          return;
        }

        const response = await fetch(`${SUPABASE_URL}/functions/v1/google-places-pharmacies`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${SUPABASE_KEY}`,
            apikey: SUPABASE_KEY,
          },
          signal,
          body: JSON.stringify({
            action: 'textSearch',
            query: searchQuery,
            pageToken: nextPageToken,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Google Places search error:', response.status, errorText);
          throw new Error(`Search failed: ${response.status}`);
        }

        const data = await response.json();
        const pharmacies = data.pharmacies || [];
        allBasicResults.push(...pharmacies);
        nextPageToken = data.nextPageToken || null;
        pageCount++;

        setProgress((prev) => ({ ...prev, found: allBasicResults.length }));

        console.log(`Page ${pageCount}: found ${pharmacies.length} pharmacies, total: ${allBasicResults.length}`);
        // Continue until no more pages (nextPageToken is null)
        // Google Places has a natural limit of 3 pages (60 results) per query
      } while (nextPageToken);

      console.log(`Search complete: ${allBasicResults.length} total pharmacies found`);

      if (allBasicResults.length === 0) {
        toast.info('No pharmacies found in this area');
        setIsSearching(false);
        return;
      }

      // Fetch details and cache each pharmacy
      const cachedPharmacies: Pharmacy[] = [];

      for (let i = 0; i < allBasicResults.length; i++) {
        if (signal.aborted) {
          console.log('Search aborted during details fetching');
          return;
        }

        const basic = allBasicResults[i];

        // Check if already in database
        const { data: existing } = await supabase
          .from('pharmacies')
          .select('*')
          .eq('google_place_id', basic.google_place_id)
          .maybeSingle();

        if (existing) {
          cachedPharmacies.push(existing as Pharmacy);
          if (cachedPharmacies.length === 1) {
            setDetectedLocation({
              country: (existing as Pharmacy).country ?? '',
              province: (existing as Pharmacy).province ?? '',
            });
          }
          setProgress((prev) => ({ ...prev, cached: cachedPharmacies.length }));
          setResults([...cachedPharmacies]);
          continue;
        }

        // Fetch details from Google Places
        try {
          const detailsResponse = await fetch(`${SUPABASE_URL}/functions/v1/google-places-pharmacies`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${SUPABASE_KEY}`,
              apikey: SUPABASE_KEY,
            },
            signal,
            body: JSON.stringify({
              action: 'details',
              placeId: basic.google_place_id,
            }),
          });

          if (!detailsResponse.ok) {
            console.warn(`Failed to get details for ${basic.google_place_id}`);
            continue;
          }

          const detailsData = await detailsResponse.json();
          const details: GooglePlaceDetails = detailsData.pharmacy;

          // Insert into database - first check for existing CSV import by name+city
          // Check if already exists by google_place_id
          const { data: existingByPlaceId } = await supabase
            .from('pharmacies')
            .select('*')
            .eq('google_place_id', details.google_place_id)
            .maybeSingle();

          if (existingByPlaceId) {
            cachedPharmacies.push(existingByPlaceId as Pharmacy);
            if (cachedPharmacies.length === 1) {
              setDetectedLocation({
                country: (existingByPlaceId as Pharmacy).country ?? '',
                province: (existingByPlaceId as Pharmacy).province ?? '',
              });
            }
            setProgress((prev) => ({ ...prev, cached: cachedPharmacies.length }));
            setResults([...cachedPharmacies]);
            continue;
          }

          // Check if exists by similar name + same city (CSV imports without google_place_id)
          let existingByName = null;
          if (details.city) {
            const { data: nameMatches } = await supabase
              .from('pharmacies')
              .select('*')
              .is('google_place_id', null)
              .ilike('city', details.city)
              .ilike('name', `%${details.name.split(' ').slice(0, 3).join('%')}%`)
              .limit(1);

            if (nameMatches && nameMatches.length > 0) {
              existingByName = nameMatches[0];
            }
          }

          if (existingByName) {
            // Merge: update CSV record with Google data
            const { data: updated, error: updateError } = await supabase
              .from('pharmacies')
              .update({
                google_place_id: details.google_place_id,
                phone: details.phone || existingByName.phone,
                website: details.website || existingByName.website,
                opening_hours: details.opening_hours as Json,
                lat: details.lat || existingByName.lat,
                lng: details.lng || existingByName.lng,
                google_data: details.google_data ? (JSON.parse(JSON.stringify(details.google_data)) as Json) : null,
                address: details.address || existingByName.address,
              })
              .eq('id', existingByName.id)
              .select()
              .single();

            if (updated) {
              cachedPharmacies.push(updated as Pharmacy);
            } else {
              cachedPharmacies.push(existingByName as Pharmacy);
            }
            if (cachedPharmacies.length === 1) {
              const first = (cachedPharmacies[0] as Pharmacy);
              setDetectedLocation({ country: first.country ?? '', province: first.province ?? '' });
            }
          } else {
            // No match found - insert new
            const { data: inserted, error: insertError } = await supabase
              .from('pharmacies')
              .insert([
                {
                  google_place_id: details.google_place_id,
                  name: details.name,
                  address: details.address,
                  city: details.city,
                  province: details.province,
                  country: details.country,
                  phone: details.phone,
                  website: details.website,
                  opening_hours: details.opening_hours as Json,
                  lat: details.lat,
                  lng: details.lng,
                  google_data: details.google_data ? (JSON.parse(JSON.stringify(details.google_data)) as Json) : null,
                  client_type: filters.clientType || 'pharmacy',
                },
              ])
              .select()
              .single();

            if (insertError) {
              const { data: refetched } = await supabase
                .from('pharmacies')
                .select('*')
                .eq('google_place_id', basic.google_place_id)
                .maybeSingle();
              if (refetched) {
                cachedPharmacies.push(refetched as Pharmacy);
              }
            } else if (inserted) {
              cachedPharmacies.push(inserted as Pharmacy);
            }
            if (cachedPharmacies.length === 1) {
              const first = cachedPharmacies[0] as Pharmacy;
              setDetectedLocation({ country: first.country ?? '', province: first.province ?? '' });
            }
          }

          setProgress((prev) => ({ ...prev, cached: cachedPharmacies.length }));
          setResults([...cachedPharmacies]);

          // Small delay to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (detailError) {
          console.warn(`Error fetching details for ${basic.google_place_id}:`, detailError);
        }
      }

      console.log(`Caching complete: ${cachedPharmacies.length} pharmacies cached`);
      toast.success(`Found ${cachedPharmacies.length} pharmacies`);
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('Search was aborted');
        return;
      }
      console.error('Search error:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  }, []);

  const cancelSearch = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsSearching(false);
  }, []);

  return {
    results,
    isSearching,
    hasSearched,
    progress,
    executeSearch,
    clearResults,
    cancelSearch,
    detectedLocation,
  };
}
