import { useState, useCallback } from 'react';
import { ArrowLeft, Search, RefreshCw, Plus } from 'lucide-react';
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

  const handleSearch = useCallback(async (location: { lat: number; lng: number; name: string }) => {
    setIsSearching(true);
    setIsSearchDialogOpen(false);
    
    try {
      toast.info(`Searching pharmacies near ${location.name}...`);
      
      const result = await searchPlaces.mutateAsync({
        location: { lat: location.lat, lng: location.lng },
        radius: 10000, // 10km radius
      });

      if (!result.pharmacies || result.pharmacies.length === 0) {
        toast.info('No pharmacies found in this area');
        return;
      }

      toast.info(`Found ${result.pharmacies.length} pharmacies, fetching details...`);

      // Fetch details and cache each pharmacy
      let cached = 0;
      for (const pharmacy of result.pharmacies) {
        try {
          const details = await getDetails.mutateAsync(pharmacy.google_place_id);
          await cachePharmacy.mutateAsync(details);
          cached++;
        } catch (error) {
          console.error('Error caching pharmacy:', error);
        }
      }

      await refetch();
      toast.success(`Added ${cached} pharmacies to your database`);

    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search pharmacies. Check your API key.');
    } finally {
      setIsSearching(false);
    }
  }, [searchPlaces, getDetails, cachePharmacy, refetch]);

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
            Europe
          </span>
        </div>

        <div className="flex items-center gap-2">
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
