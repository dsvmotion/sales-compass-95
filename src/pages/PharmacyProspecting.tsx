import { useState, useCallback, useMemo } from 'react';
import { ArrowLeft, RefreshCw, Building2, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PharmacySidebar } from '@/components/prospecting/PharmacySidebar';
import { ProspectingMap } from '@/components/prospecting/ProspectingMap';
import { PharmacyDetailPanel } from '@/components/prospecting/PharmacyDetailPanel';
import { usePharmacies } from '@/hooks/usePharmacies';
import { Pharmacy, PharmacyFilters as Filters } from '@/types/pharmacy';

const initialFilters: Filters = {
  search: '',
  city: '',
  province: '',
  country: '',
  status: 'all',
};

export default function PharmacyProspecting() {
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
  const [filters, setFilters] = useState<Filters>(initialFilters);

  const { data: pharmacies = [], isLoading, refetch } = usePharmacies();

  // Check if at least one geographic filter is active
  const hasActiveGeoFilter = useMemo(() => {
    return filters.country !== '' || filters.province !== '' || filters.city !== '';
  }, [filters.country, filters.province, filters.city]);

  // Only show pharmacies when filters are applied
  const displayedPharmacies = useMemo(() => {
    if (!hasActiveGeoFilter) {
      return []; // Empty until filters are applied
    }

    return pharmacies.filter((pharmacy) => {
      // Text search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          pharmacy.name.toLowerCase().includes(searchLower) ||
          pharmacy.address?.toLowerCase().includes(searchLower) ||
          pharmacy.city?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Geographic filters (hierarchical)
      if (filters.country && pharmacy.country !== filters.country) return false;
      if (filters.province && pharmacy.province !== filters.province) return false;
      if (filters.city && pharmacy.city !== filters.city) return false;

      // Status filter
      if (filters.status !== 'all' && pharmacy.commercial_status !== filters.status) return false;

      return true;
    });
  }, [pharmacies, filters, hasActiveGeoFilter]);

  const handleSelectPharmacy = useCallback((pharmacy: Pharmacy) => {
    setSelectedPharmacy(pharmacy);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedPharmacy(null);
  }, []);

  const handleFiltersChange = useCallback((newFilters: Filters) => {
    // Enforce hierarchy: changing country resets province+city; changing province resets city.
    if (newFilters.country !== filters.country) {
      setFilters({ ...newFilters, province: '', city: '' });
      return;
    }
    if (newFilters.province !== filters.province) {
      setFilters({ ...newFilters, city: '' });
      return;
    }
    setFilters(newFilters);
  }, [filters.country, filters.province]);

  const handleClearFilters = useCallback(() => {
    setFilters(initialFilters);
    setSelectedPharmacy(null);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-white text-gray-900">
      {/* Header */}
      <header className="h-14 border-b border-gray-200 flex items-center justify-between px-4 bg-gray-50 shrink-0">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="h-6 w-px bg-gray-300" />
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-gray-600" />
            <h1 className="font-semibold text-lg text-gray-900">Pharmacy Prospecting Map</h1>
          </div>
          {hasActiveGeoFilter && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
              {displayedPharmacies.length} pharmacies
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="border-gray-300"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 shrink-0 border-r border-gray-200 bg-gray-50">
          <PharmacySidebar
            pharmacies={pharmacies}
            displayedPharmacies={displayedPharmacies}
            isLoading={isLoading}
            selectedPharmacyId={selectedPharmacy?.id || null}
            onSelectPharmacy={handleSelectPharmacy}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
            hasActiveGeoFilter={hasActiveGeoFilter}
          />
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <ProspectingMap
            pharmacies={displayedPharmacies}
            selectedPharmacyId={selectedPharmacy?.id || null}
            onSelectPharmacy={handleSelectPharmacy}
            hasActiveGeoFilter={hasActiveGeoFilter}
          />
        </div>

        {/* Detail Panel */}
        {selectedPharmacy && (
          <div className="w-96 shrink-0 border-l border-gray-200 bg-gray-50">
            <PharmacyDetailPanel
              pharmacy={selectedPharmacy}
              onClose={handleCloseDetail}
            />
          </div>
        )}
      </div>
    </div>
  );
}
