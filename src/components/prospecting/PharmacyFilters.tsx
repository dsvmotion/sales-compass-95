import { Search, Filter, X, Loader2 } from 'lucide-react';
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
  onClearFilters: () => void;
  onSearch: () => void;
  isSearching: boolean;
  searchButtonLabel?: string;
}

export function PharmacyFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  onSearch,
  isSearching,
  searchButtonLabel = 'Search Pharmacies',
}: PharmacyFiltersProps) {
  const hasActiveGeoFilter = filters.country !== '' || filters.province !== '' || filters.city !== '';

  return (
    <div className="space-y-3">
      <Input
        placeholder="Country (e.g. Spain, France)"
        value={filters.country}
        onChange={(e) => onFiltersChange({ ...filters, country: e.target.value })}
        className="bg-white border-gray-300 text-gray-900"
      />

      <Input
        placeholder="Province (optional)"
        value={filters.province}
        onChange={(e) => onFiltersChange({ ...filters, province: e.target.value })}
        className="bg-white border-gray-300 text-gray-900"
      />

      <Input
        placeholder="City (e.g. Toulouse, Madrid)"
        value={filters.city}
        onChange={(e) => onFiltersChange({ ...filters, city: e.target.value })}
        className="bg-white border-gray-300 text-gray-900"
      />

      {/* Search Button */}
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
            {searchButtonLabel}
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

      {/* Status filter */}
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
