import { useState, useCallback, useMemo } from 'react';
import { ArrowLeft, RefreshCw, Building2, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PharmacySidebar } from '@/components/prospecting/PharmacySidebar';
import { ProspectingMap } from '@/components/prospecting/ProspectingMap';
import { PharmacyDetailPanel } from '@/components/prospecting/PharmacyDetailPanel';
import { useGeographyOptions } from '@/hooks/useGeographyOptions';
import { useProspectingSearch } from '@/hooks/useProspectingSearch';
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

  // Geography options from unified normalized tables
  const { countries, provinces, cities, isLoading: isLoadingOptions } = useGeographyOptions(
    filters.country,
    filters.province
  );

  // Manual search hook
  const {
    results: searchResults,
    isSearching,
    hasSearched,
    progress,
    executeSearch,
    clearResults,
    cancelSearch,
  } = useProspectingSearch();

  // Filter displayed results by text search and status
  const displayedPharmacies = useMemo(() => {
    return searchResults.filter((pharmacy) => {
      // Text search filter (on already fetched results)
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          pharmacy.name.toLowerCase().includes(searchLower) ||
          pharmacy.address?.toLowerCase().includes(searchLower) ||
          pharmacy.city?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status !== 'all' && pharmacy.commercial_status !== filters.status) return false;

      return true;
    });
  }, [searchResults, filters.search, filters.status]);

  const handleSelectPharmacy = useCallback((pharmacy: Pharmacy) => {
    setSelectedPharmacy(pharmacy);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedPharmacy(null);
  }, []);

  const handleFiltersChange = useCallback(
    (newFilters: Filters) => {
      // Enforce strict hierarchy: changing country resets province+city; changing province resets city.
      if (newFilters.country !== filters.country) {
        setFilters({ ...newFilters, province: '', city: '' });
        return;
      }
      if (newFilters.province !== filters.province) {
        setFilters({ ...newFilters, city: '' });
        return;
      }
      setFilters(newFilters);
    },
    [filters.country, filters.province]
  );

  const handleClearFilters = useCallback(() => {
    setFilters(initialFilters);
    setSelectedPharmacy(null);
    clearResults();
  }, [clearResults]);

  const handleSearch = useCallback(() => {
    executeSearch({
      country: filters.country,
      province: filters.province,
      city: filters.city,
    });
  }, [executeSearch, filters.country, filters.province, filters.city]);

  const handleCancelSearch = useCallback(() => {
    cancelSearch();
  }, [cancelSearch]);

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
          {hasSearched && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
              {displayedPharmacies.length} pharmacies
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isSearching && (
            <Button variant="outline" size="sm" onClick={handleCancelSearch} className="border-gray-300">
              <XCircle className="h-4 w-4 mr-2" />
              Cancel Search
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 shrink-0 border-r border-gray-200 bg-gray-50">
          <PharmacySidebar
            pharmacies={displayedPharmacies}
            isLoading={false}
            selectedPharmacyId={selectedPharmacy?.id || null}
            onSelectPharmacy={handleSelectPharmacy}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
            hasSearched={hasSearched}
            countries={countries}
            provinces={provinces}
            cities={cities}
            isLoadingOptions={isLoadingOptions}
            onSearch={handleSearch}
            isSearching={isSearching}
            progress={progress}
          />
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <ProspectingMap
            pharmacies={displayedPharmacies}
            selectedPharmacyId={selectedPharmacy?.id || null}
            onSelectPharmacy={handleSelectPharmacy}
            hasActiveGeoFilter={hasSearched}
          />
        </div>

        {/* Detail Panel */}
        {selectedPharmacy && (
          <div className="w-96 shrink-0 border-l border-gray-200 bg-gray-50">
            <PharmacyDetailPanel pharmacy={selectedPharmacy} onClose={handleCloseDetail} />
          </div>
        )}
      </div>
    </div>
  );
}
