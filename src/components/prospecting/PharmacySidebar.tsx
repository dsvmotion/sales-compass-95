import { useMemo } from 'react';
import { Building2, Loader2, Filter } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Pharmacy, PharmacyFilters as Filters } from '@/types/pharmacy';
import { PharmacyFilters } from './PharmacyFilters';
import { PharmacyListItem } from './PharmacyListItem';
import { PharmacySelectionBar } from './PharmacySelectionBar';

interface PharmacySidebarProps {
  pharmacies: Pharmacy[];
  isLoading: boolean;
  selectedPharmacyId: string | null;
  onSelectPharmacy: (pharmacy: Pharmacy) => void;
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onClearFilters: () => void;
  hasSearched: boolean;
  onSearch: () => void;
  isSearching: boolean;
  progress: { found: number; cached: number };
  // Selection props
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onSaveSelected: () => void;
  onSaveOne?: (id: string) => void;
  savedIds?: Set<string>;
  isSaving: boolean;
  labels?: {
    singular: string;
    plural: string;
    sidebarTitle: string;
    searchButton: string;
    noFound: string;
    foundCount: (n: number) => string;
  };
}

export function PharmacySidebar({
  pharmacies,
  isLoading,
  selectedPharmacyId,
  onSelectPharmacy,
  filters,
  onFiltersChange,
  onClearFilters,
  hasSearched,
  onSearch,
  isSearching,
  progress,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  onSaveSelected,
  onSaveOne,
  savedIds = new Set(),
  isSaving,
  labels,
}: PharmacySidebarProps) {
  const sidebarTitle = labels?.sidebarTitle ?? 'Pharmacies';
  const searchButtonLabel = labels?.searchButton ?? 'Search Pharmacies';
  const noFoundLabel = labels?.noFound ?? 'No pharmacies found';
  // Filter displayed pharmacies by text search and status
  const displayedPharmacies = useMemo(() => {
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

      // Status filter
      if (filters.status !== 'all' && pharmacy.commercial_status !== filters.status) return false;

      return true;
    });
  }, [pharmacies, filters.search, filters.status]);

  // Calculate status counts
  const stats = useMemo(() => {
    const statusCounts = displayedPharmacies.reduce(
      (acc, p) => {
        acc[p.commercial_status] = (acc[p.commercial_status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      total: pharmacies.length,
      displayed: displayedPharmacies.length,
      notContacted: statusCounts['not_contacted'] || 0,
      contacted: statusCounts['contacted'] || 0,
      client: statusCounts['client'] || 0,
    };
  }, [pharmacies, displayedPharmacies]);

  // Check if all displayed pharmacies are selected
  const allSelected = displayedPharmacies.length > 0 && 
    displayedPharmacies.every(p => selectedIds.has(p.id));

  // Count of selected pharmacies that are currently displayed
  const displayedSelectedCount = displayedPharmacies.filter(p => selectedIds.has(p.id)).length;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="h-5 w-5 text-gray-600" />
          <h2 className="font-semibold text-gray-900">{sidebarTitle}</h2>
          {hasSearched && (
            <span className="text-xs text-gray-500 ml-auto">{stats.displayed} shown</span>
          )}
        </div>

        <PharmacyFilters
          filters={filters}
          onFiltersChange={onFiltersChange}
          onClearFilters={onClearFilters}
          onSearch={onSearch}
          isSearching={isSearching}
          searchButtonLabel={searchButtonLabel}
        />
      </div>

      {/* Progress indicator during search */}
      {isSearching && (
        <div className="px-4 py-2 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>
              Found {progress.found} • Cached {progress.cached}
            </span>
          </div>
        </div>
      )}

      {/* Stats Bar - only show when we have results */}
      {hasSearched && !isSearching && pharmacies.length > 0 && (
        <div className="px-4 py-2 border-b border-gray-200 flex items-center gap-4 text-xs bg-gray-50">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-yellow-500" />
            <span className="text-gray-600">{stats.notContacted}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-gray-600">{stats.contacted}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-gray-600">{stats.client}</span>
          </div>
        </div>
      )}

      {/* Selection Bar - only show when we have results */}
      {hasSearched && !isSearching && pharmacies.length > 0 && (
        <PharmacySelectionBar
          totalCount={displayedPharmacies.length}
          selectedCount={displayedSelectedCount}
          allSelected={allSelected}
          onSelectAll={onSelectAll}
          onDeselectAll={onDeselectAll}
          onSave={onSaveSelected}
          isSaving={isSaving}
        />
      )}

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {isLoading || isSearching ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : !hasSearched ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="font-medium text-gray-700">Select filters and click Search</p>
              <p className="text-xs mt-1 text-gray-400">
                Choose Country → Province → City, then click &quot;{searchButtonLabel}&quot;
              </p>
            </div>
          ) : displayedPharmacies.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-gray-600">{noFoundLabel}</p>
              <p className="text-xs mt-1 text-gray-400">Try adjusting your filters</p>
            </div>
          ) : (
            displayedPharmacies.map((pharmacy) => (
              <PharmacyListItem
                key={pharmacy.id}
                pharmacy={pharmacy}
                isSelected={selectedPharmacyId === pharmacy.id}
                isChecked={selectedIds.has(pharmacy.id)}
                onCheck={(checked) => onToggleSelect(pharmacy.id)}
                onClick={() => onSelectPharmacy(pharmacy)}
                onSaveOne={onSaveOne}
                isSavedToOperations={pharmacy.saved_at != null || savedIds.has(pharmacy.id)}
                isSaving={isSaving}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
