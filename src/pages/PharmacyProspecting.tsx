import { useState, useCallback, useMemo, useEffect } from 'react';
import { ArrowLeft, XCircle, Building2, Leaf } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PharmacySidebar } from '@/components/prospecting/PharmacySidebar';
import { ProspectingMap } from '@/components/prospecting/ProspectingMap';
import { PharmacyDetailPanel } from '@/components/prospecting/PharmacyDetailPanel';
import { useProspectingSearch } from '@/hooks/useProspectingSearch';
import { useSavePharmacies } from '@/hooks/useSavePharmacies';
import { Pharmacy, PharmacyFilters as Filters, type ClientType } from '@/types/pharmacy';
import { UserMenu } from '@/components/auth/UserMenu';

interface Props {
  clientType?: ClientType;
}

const initialFilters: Filters = {
  search: '',
  city: '',
  province: '',
  country: '',
  status: 'all',
};

export default function PharmacyProspecting({ clientType = 'pharmacy' }: Props) {
  const labels = useMemo(() => ({
    singular: clientType === 'herbalist' ? 'herbalist' : 'pharmacy',
    plural: clientType === 'herbalist' ? 'herbalists' : 'pharmacies',
    sidebarTitle: clientType === 'herbalist' ? 'Herbalists' : 'Pharmacies',
    searchButton: clientType === 'herbalist' ? 'Search Herbalists' : 'Search Pharmacies',
    noFound: clientType === 'herbalist' ? 'No herbalists found' : 'No pharmacies found',
    foundCount: (n: number) => clientType === 'herbalist' ? `Found ${n} herbalists` : `Found ${n} pharmacies`,
  }), [clientType]);

  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  // Manual search hook
  const {
    results: searchResults,
    isSearching,
    hasSearched,
    progress,
    executeSearch,
    clearResults,
    cancelSearch,
    detectedLocation,
  } = useProspectingSearch();

  // Auto-fill country/province from first Google Places result when user had not set country
  useEffect(() => {
    if (detectedLocation && !filters.country) {
      setFilters((prev) => ({
        ...prev,
        country: detectedLocation.country || prev.country,
        province: detectedLocation.province || prev.province,
      }));
    }
  }, [detectedLocation]);

  // Save pharmacies mutation
  const savePharmacies = useSavePharmacies();

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

  const handleFiltersChange = useCallback((newFilters: Filters) => {
    setFilters(newFilters);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters(initialFilters);
    setSelectedPharmacy(null);
    setSelectedIds(new Set());
    clearResults();
  }, [clearResults]);

  const handleSearch = useCallback(() => {
    setSelectedIds(new Set()); // Clear selection on new search
    executeSearch({
      country: filters.country,
      province: filters.province,
      city: filters.city,
      clientType,
    });
  }, [executeSearch, filters.country, filters.province, filters.city, clientType]);

  const handleCancelSearch = useCallback(() => {
    cancelSearch();
  }, [cancelSearch]);

  // Selection handlers
  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIds(new Set(displayedPharmacies.map(p => p.id)));
  }, [displayedPharmacies]);

  const handleDeselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleSaveSelected = useCallback(() => {
    const ids = Array.from(selectedIds);
    savePharmacies.mutate(ids, {
      onSuccess: () => {
        setSelectedIds(new Set());
        setSavedIds((prev) => new Set([...prev, ...ids]));
      },
    });
  }, [selectedIds, savePharmacies]);

  const handleSaveOne = useCallback(
    (id: string) => {
      savePharmacies.mutate([id], {
        onSuccess: () => {
          setSavedIds((prev) => new Set(prev).add(id));
        },
      });
    },
    [savePharmacies]
  );

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
            {clientType === 'pharmacy' ? (
              <Building2 className="h-5 w-5 text-gray-600" />
            ) : (
              <Leaf className="h-5 w-5 text-gray-600" />
            )}
            <h1 className="font-semibold text-lg text-gray-900">
              {clientType === 'pharmacy' ? 'Pharmacy Prospecting Map' : 'Herbalist Prospecting Map'}
            </h1>
          </div>
          {hasSearched && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
              {displayedPharmacies.length} {labels.plural}
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
          <UserMenu />
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
            onSearch={handleSearch}
            isSearching={isSearching}
            progress={progress}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            onSaveSelected={handleSaveSelected}
            onSaveOne={handleSaveOne}
            savedIds={savedIds}
            isSaving={savePharmacies.isPending}
            labels={labels}
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
