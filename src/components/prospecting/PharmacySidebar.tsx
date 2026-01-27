import { useState, useMemo } from 'react';
import { Building2, Loader2 } from 'lucide-react';
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
    // City preference order
    const city =
      byType('locality')?.long_name ||
      byType('postal_town')?.long_name ||
      byType('administrative_area_level_3')?.long_name ||
      byType('sublocality')?.long_name;

    // Province/region preference order (Spain often level_2 = province)
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
  isLoading: boolean;
  selectedPharmacyId: string | null;
  onSelectPharmacy: (pharmacy: Pharmacy) => void;
}

const initialFilters: Filters = {
  search: '',
  city: '',
  province: '',
  country: '',
  status: 'all',
};

export function PharmacySidebar({
  pharmacies,
  isLoading,
  selectedPharmacyId,
  onSelectPharmacy,
}: PharmacySidebarProps) {
  const [filters, setFilters] = useState<Filters>(initialFilters);

  const { filteredPharmacies, countries, cities, provinces, stats } = useMemo(() => {
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

    const filtered = normalized.filter((pharmacy) => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          pharmacy.name.toLowerCase().includes(searchLower) ||
          pharmacy.address?.toLowerCase().includes(searchLower) ||
          pharmacy.city?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      if (filters.city && pharmacy.city !== filters.city) return false;
      if (filters.province && pharmacy.province !== filters.province) return false;
      if (filters.country && pharmacy.country !== filters.country) return false;
      if (filters.status !== 'all' && pharmacy.commercial_status !== filters.status) return false;
      return true;
    });

    const statusCounts = pharmacies.reduce((acc, p) => {
      acc[p.commercial_status] = (acc[p.commercial_status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      filteredPharmacies: filtered,
      countries: uniqueCountries.sort((a, b) => a.localeCompare(b)),
      cities: uniqueCities.sort((a, b) => a.localeCompare(b)),
      provinces: uniqueProvinces.sort((a, b) => a.localeCompare(b)),
      stats: {
        total: pharmacies.length,
        filtered: filtered.length,
        notContacted: statusCounts['not_contacted'] || 0,
        contacted: statusCounts['contacted'] || 0,
        client: statusCounts['client'] || 0,
      },
    };
  }, [pharmacies, filters]);

  const handleFiltersChange = (next: Filters) => {
    // Enforce hierarchy: changing country resets province+city; changing province resets city.
    if (next.country !== filters.country) {
      setFilters({ ...next, province: '', city: '' });
      return;
    }
    if (next.province !== filters.province) {
      setFilters({ ...next, city: '' });
      return;
    }
    setFilters(next);
  };

  return (
    <div className="flex flex-col h-full bg-card/50 backdrop-blur-sm border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Pharmacies</h2>
          <span className="text-xs text-muted-foreground ml-auto">
            {stats.filtered} of {stats.total}
          </span>
        </div>
        
        <PharmacyFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          countries={countries}
          cities={cities}
          provinces={provinces}
          onClearFilters={() => setFilters(initialFilters)}
        />
      </div>

      {/* Stats Bar */}
      <div className="px-4 py-2 border-b border-border flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-gray-500" />
          <span className="text-muted-foreground">{stats.notContacted}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-yellow-500" />
          <span className="text-muted-foreground">{stats.contacted}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-muted-foreground">{stats.client}</span>
        </div>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredPharmacies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No pharmacies found</p>
              <p className="text-xs mt-1">Try adjusting your filters or search a new area</p>
            </div>
          ) : (
            filteredPharmacies.map((pharmacy) => (
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
