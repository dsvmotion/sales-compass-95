import { useState, useCallback, useMemo, useRef } from 'react';
import { ArrowLeft, RefreshCw, Plus, MapPin, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PharmacySidebar } from '@/components/prospecting/PharmacySidebar';
import { ProspectingMap } from '@/components/prospecting/ProspectingMap';
import { PharmacyDetailPanel } from '@/components/prospecting/PharmacyDetailPanel';
import { SearchLocationDialog } from '@/components/prospecting/SearchLocationDialog';
import { 
  usePharmacies, 
  useSearchGooglePlaces, 
  useGetPharmacyDetails,
  useCachePharmacy 
} from '@/hooks/usePharmacies';
import { Pharmacy } from '@/types/pharmacy';
import { toast } from 'sonner';

export default function PharmacyProspecting() {
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [autoSearchEnabled, setAutoSearchEnabled] = useState(true);
  const lastBoundsKey = useRef<string | null>(null);
  const activeSearchSeq = useRef(0);
  const activeAbort = useRef<AbortController | null>(null);
  const [viewBounds, setViewBounds] = useState<{
    ne: { lat: number; lng: number };
    sw: { lat: number; lng: number };
  } | null>(null);

  const { data: pharmacies = [], isLoading, refetch } = usePharmacies();
  const pharmaciesInView = useMemo(() => {
    if (!viewBounds) return pharmacies;
    const { ne, sw } = viewBounds;
    return pharmacies.filter((p) => {
      return p.lat >= sw.lat && p.lat <= ne.lat && p.lng >= sw.lng && p.lng <= ne.lng;
    });
  }, [pharmacies, viewBounds]);
  const searchPlaces = useSearchGooglePlaces();
  const getDetails = useGetPharmacyDetails();
  const cachePharmacy = useCachePharmacy();

  type PlaceSummary = {
    google_place_id: string;
    name: string;
    address?: string;
    lat: number;
    lng: number;
  };

  const markerIconUrl = useMemo(() => {
    // Expect the design-provided icon to be placed at public/pharmacy-marker.png
    return '/pharmacy-marker.png';
  }, []);

  const boundsToKey = useCallback((bounds: google.maps.LatLngBounds) => {
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    // Round to reduce noisy re-searches
    const r = (n: number) => Math.round(n * 1000) / 1000;
    return `${r(sw.lat())},${r(sw.lng())}|${r(ne.lat())},${r(ne.lng())}`;
  }, []);

  const kmBetween = useCallback((a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
    // Haversine
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const lat1 = (a.lat * Math.PI) / 180;
    const lat2 = (b.lat * Math.PI) / 180;
    const x =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
    return R * c;
  }, []);

  const fetchNearbyAllPages = useCallback(
    async (args: { location: { lat: number; lng: number }; radius: number; signal?: AbortSignal }) => {
      let all: Array<{ google_place_id: string; name: string; address?: string; lat: number; lng: number }> = [];
      let pageToken: string | null = null;
      let pageCount = 0;
      const maxPages = 3; // Google Places hard limit per search

      do {
        const result = await searchPlaces.mutateAsync({
          location: args.location,
          radius: args.radius,
          pageToken: pageToken || undefined,
          signal: args.signal,
        });

        if (result?.pharmacies?.length) {
          all = all.concat(result.pharmacies);
        }

        pageToken = result?.nextPageToken ?? null;
        pageCount++;

        // Google requires a short delay before a next_page_token becomes valid
        if (pageToken && pageCount < maxPages) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      } while (pageToken && pageCount < maxPages);

      return all;
    },
    [searchPlaces]
  );

  const searchPharmaciesInBounds = useCallback(
    async (bounds: google.maps.LatLngBounds, showToast: boolean) => {
      // Cancel any in-flight search (prevents overlapping API calls + stale UI)
      activeAbort.current?.abort();
      const abort = new AbortController();
      activeAbort.current = abort;

      const mySeq = ++activeSearchSeq.current;

      setIsSearching(true);
      try {
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();

        // Grid search across bounds (improves completeness in dense areas vs single-radius search)
        const grid = 3;
        const latStep = (ne.lat() - sw.lat()) / grid;
        const lngStep = (ne.lng() - sw.lng()) / grid;

        const centers: Array<{ lat: number; lng: number }> = [];
        for (let i = 0; i < grid; i++) {
          for (let j = 0; j < grid; j++) {
            centers.push({
              lat: sw.lat() + latStep * (i + 0.5),
              lng: sw.lng() + lngStep * (j + 0.5),
            });
          }
        }

        const radiusKm = Math.max(
          kmBetween(
            { lat: sw.lat(), lng: sw.lng() },
            { lat: ne.lat(), lng: sw.lng() }
          ),
          kmBetween(
            { lat: sw.lat(), lng: sw.lng() },
            { lat: sw.lat(), lng: ne.lng() }
          )
        );
        // Radius per cell: diagonal-ish safety factor
        const radiusMeters = Math.min(Math.max((radiusKm / grid) * 1000 * 0.8, 1000), 50000);

        const byPlaceId = new Map<
          string,
          { google_place_id: string; name: string; address?: string; lat: number; lng: number }
        >();

        // Sequential per cell (stable + respects quotas). Cancels cleanly.
        for (const c of centers) {
          if (abort.signal.aborted) return;
          const results = await fetchNearbyAllPages({ location: c, radius: radiusMeters, signal: abort.signal });

          if (abort.signal.aborted) return;
          for (const p of results) {
            byPlaceId.set(p.google_place_id, p);
          }
        }

        if (abort.signal.aborted || mySeq !== activeSearchSeq.current) return;

        const allFound = Array.from(byPlaceId.values());
        if (allFound.length === 0) {
          if (showToast) toast.info('No pharmacies found in this area');
          return;
        }

        if (showToast) toast.info(`Found ${allFound.length} pharmacies in view`);

        // Cache minimal records FIRST (fast, stable) – details are hydrated selectively.
        for (const p of allFound) {
          if (abort.signal.aborted || mySeq !== activeSearchSeq.current) return;
          try {
            await cachePharmacy.mutateAsync({
              google_place_id: p.google_place_id,
              name: p.name,
              address: p.address ?? null,
              lat: p.lat,
              lng: p.lng,
              // hydrate later
              city: null,
              province: null,
              country: null,
              phone: null,
              website: null,
              opening_hours: null,
              google_data: null,
            });
          } catch (e) {
            // ignore duplicates / transient errors
          }
        }

        // Hydrate details for a limited subset to keep UI calm (still real + consistent)
        const hydrateLimit = 25;
        const toHydrate = allFound.slice(0, hydrateLimit);
        for (const p of toHydrate) {
          if (abort.signal.aborted || mySeq !== activeSearchSeq.current) return;
          try {
            const details = await getDetails.mutateAsync(p.google_place_id);
            await cachePharmacy.mutateAsync(details);
          } catch (e) {
            // best-effort
          }
        }

        await refetch();
      } catch (error) {
        if ((error as Error)?.name === 'AbortError') return;
        console.error('Bounds search error:', error);
        if (showToast) toast.error('Failed to search pharmacies in this area');
      } finally {
        if (mySeq === activeSearchSeq.current) {
          setIsSearching(false);
        }
      }
    },
    [cachePharmacy, fetchNearbyAllPages, getDetails, kmBetween, refetch]
  );

  const handleSelectPharmacy = useCallback((pharmacy: Pharmacy) => {
    setSelectedPharmacy(pharmacy);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedPharmacy(null);
  }, []);

  // Manual search (center + radius) remains available via the dialog.
  const searchPharmaciesAtLocation = useCallback(async (
    location: { lat: number; lng: number }, 
    radius: number = 20000,
    showToast: boolean = true
  ) => {
    if (isSearching) return;
    
    setIsSearching(true);
    
    try {
      let allPharmacies: PlaceSummary[] = [];
      let pageToken: string | null = null;
      let pageCount = 0;
      const maxPages = 3; // Google Places returns max 60 results (3 pages of 20)
      
      // Fetch all pages
      do {
        const result = await searchPlaces.mutateAsync({
          location,
          radius,
          pageToken: pageToken || undefined,
        });

        if (result.pharmacies && result.pharmacies.length > 0) {
          allPharmacies = [...allPharmacies, ...(result.pharmacies as PlaceSummary[])];
        }
        
        pageToken = result.nextPageToken;
        pageCount++;
        
        // Wait 2 seconds between page requests (Google API requirement)
        if (pageToken && pageCount < maxPages) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } while (pageToken && pageCount < maxPages);

      if (allPharmacies.length === 0) {
        if (showToast) toast.info('No pharmacies found in this area');
        return;
      }

      if (showToast) {
        toast.info(`Found ${allPharmacies.length} pharmacies, fetching details...`);
      }

      // Cache minimal first (fast), then hydrate some details (stable)
      let cached = 0;
      for (const pharmacy of allPharmacies) {
        try {
          await cachePharmacy.mutateAsync({
            google_place_id: pharmacy.google_place_id,
            name: pharmacy.name,
            address: pharmacy.address ?? null,
            lat: pharmacy.lat,
            lng: pharmacy.lng,
            city: null,
            province: null,
            country: null,
            phone: null,
            website: null,
            opening_hours: null,
            google_data: null,
          });
          cached++;
        } catch (error) {
          // ignore duplicates
        }
      }

      const hydrateLimit = 25;
      let hydrated = 0;
      for (const pharmacy of allPharmacies.slice(0, hydrateLimit)) {
        try {
          const details = await getDetails.mutateAsync(pharmacy.google_place_id);
          await cachePharmacy.mutateAsync(details);
          hydrated++;
        } catch (error) {
          // best-effort
        }
      }

      await refetch();
      if (showToast) {
        toast.success(`Added ${cached} pharmacies (hydrated ${hydrated})`);
      }

    } catch (error) {
      console.error('Search error:', error);
      if (showToast) {
        toast.error('Failed to search pharmacies. Check your API key.');
      }
    } finally {
      setIsSearching(false);
    }
  }, [isSearching, searchPlaces, getDetails, cachePharmacy, refetch]);

  const handleSearch = useCallback(async (location: { lat: number; lng: number; name: string }) => {
    setIsSearchDialogOpen(false);
    toast.info(`Searching pharmacies near ${location.name}...`);
    await searchPharmaciesAtLocation(location, 20000);
  }, [searchPharmaciesAtLocation]);

  // Handle map bounds change for dynamic loading
  const handleBoundsChanged = useCallback(async (
    bounds: google.maps.LatLngBounds, 
    center: google.maps.LatLng
  ) => {
    if (!autoSearchEnabled) return;

    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    setViewBounds({
      ne: { lat: ne.lat(), lng: ne.lng() },
      sw: { lat: sw.lat(), lng: sw.lng() },
    });

    const key = boundsToKey(bounds);
    if (lastBoundsKey.current === key) return;
    lastBoundsKey.current = key;

    // bounds is the source of truth; center is unused but kept for signature compatibility
    void center;
    // Never let an async error bubble into the map event loop
    try {
      await searchPharmaciesInBounds(bounds, false);
    } catch (e) {
      console.error('AutoSearch failed:', e);
    }
  }, [autoSearchEnabled, boundsToKey, searchPharmaciesInBounds]);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-card/50 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="h-6 w-px bg-border" />
          <h1 className="font-semibold text-lg">Pharmacy Prospecting Map</h1>
          <span className="text-xs text-muted-foreground bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {pharmaciesInView.length} pharmacies
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={autoSearchEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setAutoSearchEnabled(!autoSearchEnabled);
              toast.info(autoSearchEnabled ? 'Auto-search disabled' : 'Auto-search enabled: Move the map to search new areas');
            }}
            disabled={isSearching}
          >
            <MapPin className={`h-4 w-4 mr-2 ${autoSearchEnabled ? 'animate-pulse' : ''}`} />
            Auto-Search: {autoSearchEnabled ? 'ON' : 'OFF'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setIsSearchDialogOpen(true)}
            disabled={isSearching}
          >
            <Plus className="h-4 w-4 mr-2" />
            Search Area
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 shrink-0">
          <PharmacySidebar
            pharmacies={pharmaciesInView}
            isLoading={isLoading || isSearching}
            selectedPharmacyId={selectedPharmacy?.id || null}
            onSelectPharmacy={handleSelectPharmacy}
          />
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <ProspectingMap
            pharmacies={pharmaciesInView}
            selectedPharmacyId={selectedPharmacy?.id || null}
            onSelectPharmacy={handleSelectPharmacy}
            onBoundsChanged={autoSearchEnabled ? handleBoundsChanged : undefined}
            markerIconUrl={markerIconUrl}
          />
          
          {/* Loading Overlay */}
          {isSearching && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
              <div className="bg-card p-6 rounded-lg shadow-lg flex items-center gap-3">
                <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                <span>Searching for pharmacies...</span>
              </div>
            </div>
          )}
          
          {/* Auto-search indicator */}
          {autoSearchEnabled && !isSearching && (
            <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-sm flex items-center gap-2">
              <Search className="h-4 w-4" />
              Pan/zoom to search new areas
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedPharmacy && (
          <div className="w-96 shrink-0">
            <PharmacyDetailPanel
              pharmacy={selectedPharmacy}
              onClose={handleCloseDetail}
            />
          </div>
        )}
      </div>

      {/* Search Dialog */}
      <SearchLocationDialog
        open={isSearchDialogOpen}
        onOpenChange={setIsSearchDialogOpen}
        onSearch={handleSearch}
        isSearching={isSearching}
      />
    </div>
  );
}
