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
import { OperationsFilters } from '@/types/operations';

interface OperationsFiltersBarProps {
  filters: OperationsFilters;
  onFiltersChange: (filters: OperationsFilters) => void;
  onClearFilters: () => void;
  countries: string[];
  provinces: string[];
  cities: string[];
}

export function OperationsFiltersBar({
  filters,
  onFiltersChange,
  onClearFilters,
  countries,
  provinces,
  cities,
}: OperationsFiltersBarProps) {
  const hasActiveFilters =
    filters.search !== '' ||
    filters.country !== '' ||
    filters.province !== '' ||
    filters.city !== '' ||
    filters.commercialStatus !== 'all' ||
    filters.paymentStatus !== 'all';

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

      {/* Country - From normalized geography tables */}
      <Select
        value={filters.country || 'all'}
        onValueChange={(value) => onFiltersChange({ 
          ...filters, 
          country: value === 'all' ? '' : value,
          province: '',
          city: ''
        })}
      >
        <SelectTrigger className="w-40 bg-white border-gray-300 text-gray-900">
          <SelectValue placeholder="Country" />
        </SelectTrigger>
        <SelectContent className="bg-white border-gray-200 max-h-60 z-50">
          <SelectItem value="all">All Countries</SelectItem>
          {countries.map((country) => (
            <SelectItem key={country} value={country}>
              {country}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Province - From normalized geography tables */}
      <Select
        value={filters.province || 'all'}
        onValueChange={(value) => onFiltersChange({ 
          ...filters, 
          province: value === 'all' ? '' : value,
          city: ''
        })}
        disabled={!filters.country}
      >
        <SelectTrigger className={`w-40 bg-white border-gray-300 text-gray-900 ${!filters.country ? 'opacity-50' : ''}`}>
          <SelectValue placeholder={filters.country ? (provinces.length > 0 ? 'Province' : 'No provinces') : 'Select Country'} />
        </SelectTrigger>
        <SelectContent className="bg-white border-gray-200 max-h-60 z-50">
          <SelectItem value="all">All Provinces</SelectItem>
          {provinces.map((province) => (
            <SelectItem key={province} value={province}>
              {province}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* City - From normalized geography tables */}
      <Select
        value={filters.city || 'all'}
        onValueChange={(value) => onFiltersChange({ ...filters, city: value === 'all' ? '' : value })}
        disabled={!filters.province}
      >
        <SelectTrigger className={`w-40 bg-white border-gray-300 text-gray-900 ${!filters.province ? 'opacity-50' : ''}`}>
          <SelectValue placeholder={filters.province ? (cities.length > 0 ? 'City' : 'No cities') : 'Select Province'} />
        </SelectTrigger>
        <SelectContent className="bg-white border-gray-200 max-h-60 z-50">
          <SelectItem value="all">All Cities</SelectItem>
          {cities.map((city) => (
            <SelectItem key={city} value={city}>
              {city}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Commercial Status */}
      <Select
        value={filters.commercialStatus}
        onValueChange={(value) => onFiltersChange({ ...filters, commercialStatus: value as OperationsFilters['commercialStatus'] })}
      >
        <SelectTrigger className="w-40 bg-white border-gray-300 text-gray-900">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent className="bg-white border-gray-200 z-50">
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
        <SelectContent className="bg-white border-gray-200 z-50">
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
