import { useState, useMemo, useCallback } from 'react';
import { ArrowLeft, RefreshCw, Building2, MapPin, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { usePharmaciesWithOrders } from '@/hooks/usePharmacyOperations';
import { OperationsFilters, SortField, SortDirection, PharmacyWithOrders } from '@/types/operations';
import { OperationsTable } from '@/components/operations/OperationsTable';
import { OperationsFiltersBar } from '@/components/operations/OperationsFiltersBar';
import { PharmacyOperationsDetail } from '@/components/operations/PharmacyOperationsDetail';
import { useQueryClient } from '@tanstack/react-query';
import { useGeographyOptions } from '@/hooks/useGeographyOptions';

const initialFilters: OperationsFilters = {
  search: '',
  country: '',
  province: '',
  city: '',
  commercialStatus: 'all',
  paymentStatus: 'all',
};

export default function PharmacyOperations() {
  const [filters, setFilters] = useState<OperationsFilters>(initialFilters);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedPharmacy, setSelectedPharmacy] = useState<PharmacyWithOrders | null>(null);

  // Only fetch saved pharmacies (savedOnly = true)
  const { data: pharmacies = [], isLoading } = usePharmaciesWithOrders(true);
  const queryClient = useQueryClient();

  // Geography options from unified normalized tables
  const { countries, provinces, cities } = useGeographyOptions(filters.country, filters.province);

  // Filter and sort pharmacies
  const displayedPharmacies = useMemo(() => {
    let result = pharmacies.filter(pharmacy => {
      // Text search
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          pharmacy.name.toLowerCase().includes(searchLower) ||
          pharmacy.address?.toLowerCase().includes(searchLower) ||
          pharmacy.email?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Geographic filters - exact match from normalized data
      if (filters.country && pharmacy.country !== filters.country) return false;
      if (filters.province && pharmacy.province !== filters.province) return false;
      if (filters.city && pharmacy.city !== filters.city) return false;

      // Commercial status
      if (filters.commercialStatus !== 'all' && pharmacy.commercialStatus !== filters.commercialStatus) return false;

      // Payment status (based on last order)
      if (filters.paymentStatus !== 'all') {
        if (!pharmacy.lastOrder) return false;
        if (pharmacy.lastOrder.paymentStatus !== filters.paymentStatus) return false;
      }

      return true;
    });

    // Sort
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'commercialStatus':
          comparison = a.commercialStatus.localeCompare(b.commercialStatus);
          break;
        case 'totalRevenue':
          comparison = a.totalRevenue - b.totalRevenue;
          break;
        case 'paymentStatus':
          const statusA = a.lastOrder?.paymentStatus || 'zzz';
          const statusB = b.lastOrder?.paymentStatus || 'zzz';
          comparison = statusA.localeCompare(statusB);
          break;
        case 'lastOrderDate':
          const dateA = a.lastOrder?.dateCreated || '1970-01-01';
          const dateB = b.lastOrder?.dateCreated || '1970-01-01';
          comparison = new Date(dateA).getTime() - new Date(dateB).getTime();
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [pharmacies, filters, sortField, sortDirection]);

  const handleFiltersChange = useCallback((newFilters: OperationsFilters) => {
    // Enforce hierarchy
    if (newFilters.country !== filters.country) {
      setFilters({ ...newFilters, province: '', city: '' });
      return;
    }
    if (newFilters.province !== filters.province) {
      setFilters({ ...newFilters, city: '' });
      return;
    }
    setFilters(newFilters);
  }, [filters.country, filters.province]);

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField]);

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['pharmacies'] });
    queryClient.invalidateQueries({ queryKey: ['detailed-orders'] });
    queryClient.invalidateQueries({ queryKey: ['pharmacy-documents'] });
  }, [queryClient]);

  // Empty state when no saved pharmacies
  const showEmptyState = !isLoading && pharmacies.length === 0;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="h-14 border-b border-gray-200 flex items-center justify-between px-6 bg-gray-50">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="h-6 w-px bg-gray-300" />
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-gray-700" />
            <h1 className="font-semibold text-lg">Pharmacy Operations</h1>
          </div>
          {!showEmptyState && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
              {displayedPharmacies.length} of {pharmacies.length} saved pharmacies
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Link to="/prospecting">
            <Button variant="outline" size="sm" className="border-gray-300">
              <MapPin className="h-4 w-4 mr-2" />
              Find Pharmacies
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="border-gray-300"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </header>

      {showEmptyState ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-24 px-4">
          <div className="bg-gray-100 rounded-full p-6 mb-6">
            <Building2 className="h-12 w-12 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Saved Pharmacies</h2>
          <p className="text-gray-500 text-center max-w-md mb-6">
            You haven't saved any pharmacies yet. Use the Prospecting Map to discover pharmacies 
            and save them here for management.
          </p>
          <Link to="/prospecting">
            <Button className="bg-primary hover:bg-primary/90">
              <Search className="h-4 w-4 mr-2" />
              Go to Pharmacy Prospecting
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Filters */}
          <OperationsFiltersBar
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={() => setFilters(initialFilters)}
            countries={countries}
            provinces={provinces}
            cities={cities}
          />

          {/* Main Content */}
          <div className="flex">
            {/* Table */}
            <div className={`flex-1 overflow-auto ${selectedPharmacy ? 'max-w-[calc(100%-400px)]' : ''}`}>
              <OperationsTable
                pharmacies={displayedPharmacies}
                isLoading={isLoading}
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
                selectedPharmacyId={selectedPharmacy?.id || null}
                onSelectPharmacy={setSelectedPharmacy}
              />
            </div>

            {/* Detail Panel */}
            {selectedPharmacy && (
              <div className="w-[400px] border-l border-gray-200 bg-gray-50">
                <PharmacyOperationsDetail
                  pharmacy={selectedPharmacy}
                  onClose={() => setSelectedPharmacy(null)}
                  onStatusUpdate={handleRefresh}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
