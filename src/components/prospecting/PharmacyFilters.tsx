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
import { PharmacyFilters as Filters, PharmacyStatus, STATUS_LABELS } from '@/types/pharmacy';

interface PharmacyFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  countries: string[];
  cities: string[];
  provinces: string[];
  onClearFilters: () => void;
  onSearch: () => void;
  isSearching: boolean;
  isLoadingOptions: boolean;
}

export function PharmacyFilters({
  filters,
  onFiltersChange,
  countries,
  cities,
  provinces,
  onClearFilters,
  onSearch,
  isSearching,
  isLoadingOptions,
}: PharmacyFiltersProps) {
  const hasActiveGeoFilter = filters.country !== '' || filters.province !== '' || filters.city !== '';

  return (
    <div className="space-y-3">
      {/* Geographic Filters - Hierarchical */}
      <div className="space-y-2">
        {/* Country */}
        <Select
          value={filters.country || 'all'}
          onValueChange={(value) => onFiltersChange({ ...filters, country: value === 'all' ? '' : value })}
        >
          <SelectTrigger className="bg-white border-gray-300 text-gray-900">
            <SelectValue placeholder="Select Country" />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200 z-50">
            <SelectItem value="all">All Countries</SelectItem>
            {countries.map((country) => (
              <SelectItem key={country} value={country}>
                {country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Province - only enabled when country is selected */}
        <Select
          value={filters.province || 'all'}
          onValueChange={(value) => onFiltersChange({ ...filters, province: value === 'all' ? '' : value })}
          disabled={!filters.country}
        >
          <SelectTrigger className={`bg-white border-gray-300 text-gray-900 ${!filters.country ? 'opacity-50' : ''}`}>
            <SelectValue placeholder={filters.country ? 'Select Province' : 'Select Country first'} />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200 z-50">
            <SelectItem value="all">All Provinces</SelectItem>
            {provinces.map((province) => (
              <SelectItem key={province} value={province}>
                {province}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* City - only enabled when province is selected */}
        <Select
          value={filters.city || 'all'}
          onValueChange={(value) => onFiltersChange({ ...filters, city: value === 'all' ? '' : value })}
          disabled={!filters.province}
        >
          <SelectTrigger className={`bg-white border-gray-300 text-gray-900 ${!filters.province ? 'opacity-50' : ''}`}>
            <MapPin className="h-4 w-4 mr-2 text-gray-400" />
            <SelectValue placeholder={filters.province ? 'Select City' : 'Select Province first'} />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200 z-50">
            <SelectItem value="all">All Cities</SelectItem>
            {cities.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Search Button - REQUIRED to trigger search */}
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

      {/* Text search - only works on already loaded results */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Filter results..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="pl-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
        />
      </div>

      {/* Status filter - works on already loaded results */}
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
