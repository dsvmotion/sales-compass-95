import { useState, useCallback, useRef } from 'react';
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
  const [autoSearchEnabled, setAutoSearchEnabled] = useState(false);
  const lastSearchCenter = useRef<{ lat: number; lng: number } | null>(null);

  const { data: pharmacies = [], isLoading, refetch } = usePharmacies();
  const searchPlaces = useSearchGooglePlaces();
  const getDetails = useGetPharmacyDetails();
  const cachePharmacy = useCachePharmacy();

  const handleSelectPharmacy = useCallback((pharmacy: Pharmacy) => {
    setSelectedPharmacy(pharmacy);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedPharmacy(null);
  }, []);

  // Search for pharmacies at a specific location with pagination support
  const searchPharmaciesAtLocation = useCallback(async (
    location: { lat: number; lng: number }, 
    radius: number = 20000,
    showToast: boolean = true
  ) => {
    if (isSearching) return;
    
    setIsSearching(true);
    
    try {
      let allPharmacies: Array<{ google_place_id: string }> = [];
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
          allPharmacies = [...allPharmacies, ...result.pharmacies];
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

      // Fetch details and cache each pharmacy
      let cached = 0;
      for (const pharmacy of allPharmacies) {
        try {
          const details = await getDetails.mutateAsync(pharmacy.google_place_id);
          await cachePharmacy.mutateAsync(details);
          cached++;
        } catch (error) {
          console.error('Error caching pharmacy:', error);
        }
      }

      await refetch();
      if (showToast) {
        toast.success(`Added ${cached} pharmacies to your database`);
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
    lastSearchCenter.current = { lat: location.lat, lng: location.lng };
    await searchPharmaciesAtLocation(location, 20000);
  }, [searchPharmaciesAtLocation]);

  // Handle map bounds change for dynamic loading
  const handleBoundsChanged = useCallback(async (
    bounds: google.maps.LatLngBounds, 
    center: google.maps.LatLng
  ) => {
    if (!autoSearchEnabled || isSearching) return;
    
    const newCenter = { lat: center.lat(), lng: center.lng() };
    
    // Only search if we've moved significantly (> 5km) from last search
    if (lastSearchCenter.current) {
      const distance = Math.sqrt(
        Math.pow(newCenter.lat - lastSearchCenter.current.lat, 2) +
        Math.pow(newCenter.lng - lastSearchCenter.current.lng, 2)
      ) * 111; // Approximate km per degree
      
      if (distance < 5) return; // Haven't moved enough
    }
    
    lastSearchCenter.current = newCenter;
    
    // Calculate radius based on visible bounds
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    const latDiff = Math.abs(ne.lat() - sw.lat());
    const lngDiff = Math.abs(ne.lng() - sw.lng());
    const avgDiff = (latDiff + lngDiff) / 2;
    const radius = Math.min(Math.max(avgDiff * 111 * 500, 5000), 50000); // 5km to 50km
    
    await searchPharmaciesAtLocation(newCenter, radius, false);
  }, [autoSearchEnabled, isSearching, searchPharmaciesAtLocation]);

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
            {pharmacies.length} pharmacies
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
            pharmacies={pharmacies}
            isLoading={isLoading || isSearching}
            selectedPharmacyId={selectedPharmacy?.id || null}
            onSelectPharmacy={handleSelectPharmacy}
          />
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <ProspectingMap
            pharmacies={pharmacies}
            selectedPharmacyId={selectedPharmacy?.id || null}
            onSelectPharmacy={handleSelectPharmacy}
            onBoundsChanged={autoSearchEnabled ? handleBoundsChanged : undefined}
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
