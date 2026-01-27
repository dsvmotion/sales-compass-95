import { Search, X } from 'lucide-react';
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
import { OperationsFilters } from '@/types/operations';

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

// Full list of European countries
const EUROPEAN_COUNTRIES = Object.keys(EUROPEAN_COUNTRY_CODES).sort();

interface OperationsFiltersBarProps {
  filters: OperationsFilters;
  onFiltersChange: (filters: OperationsFilters) => void;
  onClearFilters: () => void;
}

export function OperationsFiltersBar({
  filters,
  onFiltersChange,
  onClearFilters,
}: OperationsFiltersBarProps) {
  const hasActiveFilters =
    filters.search !== '' ||
    filters.country !== '' ||
    filters.province !== '' ||
    filters.city !== '' ||
    filters.commercialStatus !== 'all' ||
    filters.paymentStatus !== 'all';

  // Get country code for Google Places restriction
  const countryCode = filters.country ? EUROPEAN_COUNTRY_CODES[filters.country] : undefined;

  return (
    <div className="px-6 py-3 border-b border-gray-200 bg-white flex items-center gap-3 flex-wrap">
      {/* Search */}
      <div className="relative w-64">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search pharmacies..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="pl-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
        />
      </div>

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
        <SelectTrigger className="w-40 bg-white border-gray-300 text-gray-900">
          <SelectValue placeholder="Country" />
        </SelectTrigger>
        <SelectContent className="bg-white border-gray-200 max-h-60">
          <SelectItem value="all">All Countries</SelectItem>
          {EUROPEAN_COUNTRIES.map((country) => (
            <SelectItem key={country} value={country}>
              {country}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Province - Google Places Autocomplete */}
      <div className="w-48">
        <PlacesAutocomplete
          value={filters.province}
          onChange={(value) => onFiltersChange({ 
            ...filters, 
            province: value,
            city: '' // Reset city when province changes
          })}
          placeholder={filters.country ? 'Province...' : 'Select country'}
          types={['administrative_area_level_1']}
          componentRestrictions={countryCode ? { country: countryCode } : undefined}
          disabled={!filters.country}
        />
      </div>

      {/* City - Google Places Autocomplete */}
      <div className="w-48">
        <PlacesAutocomplete
          value={filters.city}
          onChange={(value) => onFiltersChange({ ...filters, city: value })}
          placeholder={filters.country ? 'City...' : 'Select country'}
          types={['locality', 'sublocality']}
          componentRestrictions={countryCode ? { country: countryCode } : undefined}
          disabled={!filters.country}
        />
      </div>

      {/* Commercial Status */}
      <Select
        value={filters.commercialStatus}
        onValueChange={(value) => onFiltersChange({ ...filters, commercialStatus: value as OperationsFilters['commercialStatus'] })}
      >
        <SelectTrigger className="w-40 bg-white border-gray-300 text-gray-900">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent className="bg-white border-gray-200">
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="not_contacted">Not Contacted</SelectItem>
          <SelectItem value="contacted">Contacted</SelectItem>
          <SelectItem value="client">Client</SelectItem>
        </SelectContent>
      </Select>

      {/* Payment Status */}
      <Select
        value={filters.paymentStatus}
        onValueChange={(value) => onFiltersChange({ ...filters, paymentStatus: value as OperationsFilters['paymentStatus'] })}
      >
        <SelectTrigger className="w-36 bg-white border-gray-300 text-gray-900">
          <SelectValue placeholder="Payment" />
        </SelectTrigger>
        <SelectContent className="bg-white border-gray-200">
          <SelectItem value="all">All Payments</SelectItem>
          <SelectItem value="paid">Paid</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="failed">Failed</SelectItem>
          <SelectItem value="refunded">Refunded</SelectItem>
        </SelectContent>
      </Select>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
