import { useMemo } from 'react';
import { Building2, Loader2, Filter } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Pharmacy, PharmacyFilters as Filters } from '@/types/pharmacy';
import { PharmacyFilters } from './PharmacyFilters';
import { PharmacyListItem } from './PharmacyListItem';

function norm(value: string | null | undefined): string {
  return (value ?? '').trim().replace(/\s+/g, ' ');
}

function extractGeoFromGoogleData(googleData: unknown): { city?: string; province?: string; country?: string } {
  try {
    const comps = (googleData as any)?.address_components;
    if (!Array.isArray(comps)) return {};

    const byType = (type: string) => comps.find((c: any) => Array.isArray(c?.types) && c.types.includes(type));

    const country = byType('country')?.long_name;
    const city =
      byType('locality')?.long_name ||
      byType('postal_town')?.long_name ||
      byType('administrative_area_level_3')?.long_name ||
      byType('sublocality')?.long_name;

    const province = byType('administrative_area_level_2')?.long_name || byType('administrative_area_level_1')?.long_name;

    return {
      city: typeof city === 'string' ? city : undefined,
      province: typeof province === 'string' ? province : undefined,
      country: typeof country === 'string' ? country : undefined,
    };
  } catch {
    return {};
  }
}

interface PharmacySidebarProps {
  pharmacies: Pharmacy[];
  displayedPharmacies: Pharmacy[];
  isLoading: boolean;
  selectedPharmacyId: string | null;
  onSelectPharmacy: (pharmacy: Pharmacy) => void;
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onClearFilters: () => void;
  hasActiveGeoFilter: boolean;
}

export function PharmacySidebar({
  pharmacies,
  displayedPharmacies,
  isLoading,
  selectedPharmacyId,
  onSelectPharmacy,
  filters,
  onFiltersChange,
  onClearFilters,
  hasActiveGeoFilter,
}: PharmacySidebarProps) {
  const { countries, cities, provinces, stats } = useMemo(() => {
    const normalized = pharmacies.map((p) => {
      const fallback = extractGeoFromGoogleData(p.google_data);
      return {
        ...p,
        city: norm(p.city || fallback.city || null),
        province: norm(p.province || fallback.province || null),
        country: norm(p.country || fallback.country || null),
      };
    });

    const uniqueCountries = [...new Set(normalized.map((p) => p.country).filter(Boolean))] as string[];

    const provincesSource = filters.country
      ? normalized.filter((p) => p.country === filters.country)
      : normalized;
    const uniqueProvinces = [...new Set(provincesSource.map((p) => p.province).filter(Boolean))] as string[];

    const citiesSource = filters.province
      ? normalized.filter((p) => p.province === filters.province && (!filters.country || p.country === filters.country))
      : filters.country
        ? normalized.filter((p) => p.country === filters.country)
        : normalized;
    const uniqueCities = [...new Set(citiesSource.map((p) => p.city).filter(Boolean))] as string[];

    const statusCounts = displayedPharmacies.reduce((acc, p) => {
      acc[p.commercial_status] = (acc[p.commercial_status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      countries: uniqueCountries.sort((a, b) => a.localeCompare(b)),
      cities: uniqueCities.sort((a, b) => a.localeCompare(b)),
      provinces: uniqueProvinces.sort((a, b) => a.localeCompare(b)),
      stats: {
        total: pharmacies.length,
        displayed: displayedPharmacies.length,
        notContacted: statusCounts['not_contacted'] || 0,
        contacted: statusCounts['contacted'] || 0,
        client: statusCounts['client'] || 0,
      },
    };
  }, [pharmacies, displayedPharmacies, filters.country, filters.province]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="h-5 w-5 text-gray-600" />
          <h2 className="font-semibold text-gray-900">Pharmacies</h2>
          <span className="text-xs text-gray-500 ml-auto">
            {hasActiveGeoFilter ? `${stats.displayed} shown` : `${stats.total} total`}
          </span>
        </div>
        
        <PharmacyFilters
          filters={filters}
          onFiltersChange={onFiltersChange}
          countries={countries}
          cities={cities}
          provinces={provinces}
          onClearFilters={onClearFilters}
        />
      </div>

      {/* Stats Bar - only show when filters are active */}
      {hasActiveGeoFilter && (
        <div className="px-4 py-2 border-b border-gray-200 flex items-center gap-4 text-xs bg-gray-50">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gray-400" />
            <span className="text-gray-600">{stats.notContacted}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gray-600" />
            <span className="text-gray-600">{stats.contacted}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gray-800" />
            <span className="text-gray-600">{stats.client}</span>
          </div>
        </div>
      )}

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : !hasActiveGeoFilter ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="font-medium text-gray-700">Select filters to view pharmacies</p>
              <p className="text-xs mt-1 text-gray-400">Choose a Country, Province, or City above</p>
            </div>
          ) : displayedPharmacies.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-gray-600">No pharmacies found</p>
              <p className="text-xs mt-1 text-gray-400">Try adjusting your filters</p>
            </div>
          ) : (
            displayedPharmacies.map((pharmacy) => (
              <PharmacyListItem
                key={pharmacy.id}
                pharmacy={pharmacy}
                isSelected={selectedPharmacyId === pharmacy.id}
                onClick={() => onSelectPharmacy(pharmacy)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
