import { Search, MapPin, Filter, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlacesAutocomplete } from '@/components/ui/places-autocomplete';
import { PharmacyFilters as Filters, PharmacyStatus, STATUS_LABELS } from '@/types/pharmacy';

// European country codes for Google Places restrictions
const EUROPEAN_COUNTRY_CODES: Record<string, string> = {
  'Albania': 'al', 'Andorra': 'ad', 'Austria': 'at', 'Belarus': 'by', 'Belgium': 'be',
  'Bosnia and Herzegovina': 'ba', 'Bulgaria': 'bg', 'Croatia': 'hr', 'Cyprus': 'cy',
  'Czech Republic': 'cz', 'Denmark': 'dk', 'Estonia': 'ee', 'Finland': 'fi', 'France': 'fr',
  'Germany': 'de', 'Greece': 'gr', 'Hungary': 'hu', 'Iceland': 'is', 'Ireland': 'ie',
  'Italy': 'it', 'Kosovo': 'xk', 'Latvia': 'lv', 'Liechtenstein': 'li', 'Lithuania': 'lt',
  'Luxembourg': 'lu', 'Malta': 'mt', 'Moldova': 'md', 'Monaco': 'mc', 'Montenegro': 'me',
  'Morocco': 'ma', 'Netherlands': 'nl', 'North Macedonia': 'mk', 'Norway': 'no', 'Poland': 'pl',
  'Portugal': 'pt', 'Romania': 'ro', 'Russia': 'ru', 'San Marino': 'sm', 'Serbia': 'rs',
  'Slovakia': 'sk', 'Slovenia': 'si', 'Spain': 'es', 'Sweden': 'se', 'Switzerland': 'ch',
  'Turkey': 'tr', 'Ukraine': 'ua', 'United Kingdom': 'gb', 'Vatican City': 'va',
};

interface PharmacyFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  countries: string[];
  onClearFilters: () => void;
  onSearch: () => void;
  isSearching: boolean;
  isLoadingOptions: boolean;
}

export function PharmacyFilters({
  filters,
  onFiltersChange,
  countries,
  onClearFilters,
  onSearch,
  isSearching,
  isLoadingOptions,
}: PharmacyFiltersProps) {
  const hasActiveGeoFilter = filters.country !== '' || filters.province !== '' || filters.city !== '';
  
  // Get country code for Google Places restriction
  const countryCode = filters.country ? EUROPEAN_COUNTRY_CODES[filters.country] : undefined;

  return (
    <div className="space-y-3">
      {/* Country - Full European list */}
      <Select
        value={filters.country || 'all'}
        onValueChange={(value) => onFiltersChange({ 
          ...filters, 
          country: value === 'all' ? '' : value,
          province: '', // Reset province when country changes
          city: '' // Reset city when country changes
        })}
      >
        <SelectTrigger className="bg-white border-gray-300 text-gray-900">
          <SelectValue placeholder="Select Country" />
        </SelectTrigger>
        <SelectContent className="bg-white border-gray-200 z-50 max-h-60">
          <SelectItem value="all">All Countries</SelectItem>
          {countries.map((country) => (
            <SelectItem key={country} value={country}>
              {country}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Province - Google Places Autocomplete */}
      <PlacesAutocomplete
        value={filters.province}
        onChange={(value) => onFiltersChange({ 
          ...filters, 
          province: value,
          city: '' // Reset city when province changes
        })}
        placeholder={filters.country ? 'Search province/region...' : 'Select country first'}
        types={['administrative_area_level_1']}
        componentRestrictions={countryCode ? { country: countryCode } : undefined}
        disabled={!filters.country}
        icon={<MapPin className="h-4 w-4" />}
      />

      {/* City - Google Places Autocomplete */}
      <PlacesAutocomplete
        value={filters.city}
        onChange={(value) => onFiltersChange({ ...filters, city: value })}
        placeholder={filters.country ? 'Search city...' : 'Select country first'}
        types={['locality', 'sublocality']}
        componentRestrictions={countryCode ? { country: countryCode } : undefined}
        disabled={!filters.country}
        icon={<MapPin className="h-4 w-4" />}
      />

      {/* Search Button - Triggers pharmacy search */}
      <Button
        onClick={onSearch}
        disabled={!hasActiveGeoFilter || isSearching}
        className="w-full bg-gray-900 hover:bg-gray-800 text-white"
      >
        {isSearching ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Searching...
          </>
        ) : (
          <>
            <Search className="h-4 w-4 mr-2" />
            Search Pharmacies
          </>
        )}
      </Button>

      {/* Text search - Filter already loaded results */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Filter results..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="pl-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
        />
      </div>

      {/* Status filter - Filter already loaded results */}
      <Select
        value={filters.status}
        onValueChange={(value) => onFiltersChange({ ...filters, status: value as PharmacyStatus | 'all' })}
      >
        <SelectTrigger className="bg-white border-gray-300 text-gray-900">
          <Filter className="h-4 w-4 mr-2 text-gray-400" />
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent className="bg-white border-gray-200 z-50">
          <SelectItem value="all">All Statuses</SelectItem>
          {(Object.keys(STATUS_LABELS) as PharmacyStatus[]).map((status) => (
            <SelectItem key={status} value={status}>
              {STATUS_LABELS[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear Filters */}
      {hasActiveGeoFilter && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="w-full text-gray-500 hover:text-gray-700"
        >
          <X className="h-4 w-4 mr-2" />
          Clear Filters
        </Button>
      )}
    </div>
  );
}
