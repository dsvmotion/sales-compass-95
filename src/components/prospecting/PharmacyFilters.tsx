import { Search, MapPin, Filter, X } from 'lucide-react';
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
}

export function PharmacyFilters({
  filters,
  onFiltersChange,
  countries,
  cities,
  provinces,
  onClearFilters,
}: PharmacyFiltersProps) {
  const hasActiveFilters = 
    filters.search !== '' ||
    filters.city !== '' ||
    filters.province !== '' ||
    filters.country !== '' ||
    filters.status !== 'all';

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search pharmacies..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="pl-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
        />
      </div>

      {/* Filter Grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* Country */}
        <Select
          value={filters.country || 'all'}
          onValueChange={(value) => onFiltersChange({ ...filters, country: value === 'all' ? '' : value })}
        >
          <SelectTrigger className="bg-white border-gray-300 text-gray-900">
            <SelectValue placeholder="Country" />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200">
            <SelectItem value="all">All Countries</SelectItem>
            {countries.map((country) => (
              <SelectItem key={country} value={country}>
                {country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Province */}
        <Select
          value={filters.province || 'all'}
          onValueChange={(value) => onFiltersChange({ ...filters, province: value === 'all' ? '' : value })}
        >
          <SelectTrigger className="bg-white border-gray-300 text-gray-900">
            <SelectValue placeholder="Province" />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200">
            <SelectItem value="all">All Provinces</SelectItem>
            {provinces.map((province) => (
              <SelectItem key={province} value={province}>
                {province}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* City */}
        <Select
          value={filters.city || 'all'}
          onValueChange={(value) => onFiltersChange({ ...filters, city: value === 'all' ? '' : value })}
        >
          <SelectTrigger className="bg-white border-gray-300 text-gray-900">
            <MapPin className="h-4 w-4 mr-2 text-gray-400" />
            <SelectValue placeholder="City" />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200">
            <SelectItem value="all">All Cities</SelectItem>
            {cities.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status */}
        <Select
          value={filters.status}
          onValueChange={(value) => onFiltersChange({ ...filters, status: value as PharmacyStatus | 'all' })}
        >
          <SelectTrigger className="bg-white border-gray-300 text-gray-900">
            <Filter className="h-4 w-4 mr-2 text-gray-400" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200">
            <SelectItem value="all">All Statuses</SelectItem>
            {(Object.keys(STATUS_LABELS) as PharmacyStatus[]).map((status) => (
              <SelectItem key={status} value={status}>
                {STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
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
