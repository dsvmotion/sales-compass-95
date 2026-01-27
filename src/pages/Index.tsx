import { useState, useMemo } from 'react';
import { ShoppingCart, TrendingUp, Users, MapPin, RefreshCw, AlertCircle, ClipboardList, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SalesMap } from '@/components/SalesMap';
import { useWooCommerceOrders } from '@/hooks/useWooCommerceOrders';
import { Sale } from '@/types/sale';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EUROPEAN_COUNTRIES } from '@/hooks/useGeographyOptions';

const Index = () => {
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  
  const [filters, setFilters] = useState({
    country: '',
    province: '',
    city: '',
    customerType: 'all' as 'pharmacy' | 'client' | 'all',
  });

  const { data: sales = [], isLoading, error, refetch } = useWooCommerceOrders();

  // Derive provinces and cities from sales data with hierarchy
  const provinces = useMemo(() => {
    if (!filters.country) return [];
    const provincesSet = new Set(
      sales
        .filter(s => s.country === filters.country && s.province)
        .map(s => s.province)
    );
    return [...provincesSet].sort();
  }, [sales, filters.country]);

  const cities = useMemo(() => {
    if (!filters.province) return [];
    const citiesSet = new Set(
      sales
        .filter(s => s.province === filters.province && s.city)
        .map(s => s.city)
    );
    return [...citiesSet].sort();
  }, [sales, filters.province]);

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      if (filters.country && sale.country !== filters.country) return false;
      if (filters.province && sale.province !== filters.province) return false;
      if (filters.city && sale.city !== filters.city) return false;
      if (filters.customerType !== 'all' && sale.customerType !== filters.customerType) return false;
      return true;
    });
  }, [sales, filters]);

  const stats = useMemo(() => {
    const totalRevenue = filteredSales.reduce((sum, s) => sum + s.amount, 0);
    const pharmacySales = filteredSales.filter(s => s.customerType === 'pharmacy');
    const clientSales = filteredSales.filter(s => s.customerType === 'client');
    const pharmacyRevenue = pharmacySales.reduce((sum, s) => sum + s.amount, 0);
    const clientRevenue = clientSales.reduce((sum, s) => sum + s.amount, 0);
    const avgOrderValue = filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0;
    
    return {
      totalOrders: filteredSales.length,
      totalRevenue,
      pharmacyCount: pharmacySales.length,
      clientCount: clientSales.length,
      pharmacyRevenue,
      clientRevenue,
      avgOrderValue,
    };
  }, [filteredSales]);

  const clearFilters = () => {
    setFilters({ country: '', province: '', city: '', customerType: 'all' });
  };

  const hasActiveFilters = filters.country || filters.province || filters.city || filters.customerType !== 'all';

  const handleCountryChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      country: value === 'all' ? '' : value,
      province: '',
      city: '',
    }));
  };

  const handleProvinceChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      province: value === 'all' ? '' : value,
      city: '',
    }));
  };

  const handleCityChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      city: value === 'all' ? '' : value,
    }));
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 p-4 md:p-6">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sales Tracker</h1>
            <p className="text-sm text-gray-500">Global overview of sales and revenue</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/operations">
              <Button 
                variant="outline" 
                className="gap-2 bg-white border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              >
                <ClipboardList className="h-4 w-4" />
                Pharmacy Operations
              </Button>
            </Link>
            <Link to="/prospecting">
              <Button 
                variant="outline" 
                className="gap-2 bg-white border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              >
                <MapPin className="h-4 w-4" />
                Pharmacy Prospecting
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-200">
                <ShoppingCart className="h-5 w-5 text-gray-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                <p className="text-sm text-gray-500">Total Orders</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-200">
                <TrendingUp className="h-5 w-5 text-gray-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">€{stats.totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Total Revenue</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-200">
                <MapPin className="h-5 w-5 text-gray-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.pharmacyCount}</p>
                <p className="text-sm text-gray-500">Pharmacy Sales (€{stats.pharmacyRevenue.toLocaleString()})</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-200">
                <Users className="h-5 w-5 text-gray-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.clientCount}</p>
                <p className="text-sm text-gray-500">Client Sales (€{stats.clientRevenue.toLocaleString()})</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 mb-6 rounded-lg border border-gray-200 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-gray-500">Filters:</span>
              
              {/* Country */}
              <Select value={filters.country || 'all'} onValueChange={handleCountryChange}>
                <SelectTrigger className="w-40 bg-white border-gray-300 text-gray-900">
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200 max-h-60">
                  <SelectItem value="all">All Countries</SelectItem>
                  {EUROPEAN_COUNTRIES.map(country => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Province */}
              <Select 
                value={filters.province || 'all'} 
                onValueChange={handleProvinceChange}
                disabled={!filters.country}
              >
                <SelectTrigger className={`w-40 bg-white border-gray-300 text-gray-900 ${!filters.country ? 'opacity-50' : ''}`}>
                  <SelectValue placeholder={filters.country ? 'Province' : 'Select Country'} />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200 max-h-60">
                  <SelectItem value="all">All Provinces</SelectItem>
                  {provinces.map(province => (
                    <SelectItem key={province} value={province}>{province}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* City */}
              <Select 
                value={filters.city || 'all'} 
                onValueChange={handleCityChange}
                disabled={!filters.province}
              >
                <SelectTrigger className={`w-40 bg-white border-gray-300 text-gray-900 ${!filters.province ? 'opacity-50' : ''}`}>
                  <SelectValue placeholder={filters.province ? 'City' : 'Select Province'} />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200 max-h-60">
                  <SelectItem value="all">All Cities</SelectItem>
                  {cities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Customer Type */}
              <Select
                value={filters.customerType}
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  customerType: value as 'pharmacy' | 'client' | 'all'
                }))}
              >
                <SelectTrigger className="w-40 bg-white border-gray-300 text-gray-900">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="pharmacy">Pharmacies</SelectItem>
                  <SelectItem value="client">Clients</SelectItem>
                </SelectContent>
              </Select>
              
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-500">
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-gray-600">Pharmacy</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-violet-500" />
                <span className="text-gray-600">Client</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <div className="p-4 rounded-lg border border-gray-200 bg-white">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Sales Locations</h2>
                <span className="text-xs text-gray-500">
                  {filteredSales.length} orders
                </span>
              </div>
              <div style={{ height: '500px' }} className="rounded-lg overflow-hidden border border-gray-200">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                      <p className="text-gray-500 mt-2">Loading sales data...</p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="h-full flex items-center justify-center bg-gray-50">
                    <div className="text-center text-gray-600">
                      <AlertCircle className="h-8 w-8 mx-auto" />
                      <p className="mt-2">Failed to load sales</p>
                      <Button variant="outline" size="sm" className="mt-2 border-gray-300" onClick={() => refetch()}>
                        Retry
                      </Button>
                    </div>
                  </div>
                ) : (
                  <SalesMap 
                    sales={filteredSales} 
                    onSaleSelect={setSelectedSale}
                    selectedSaleId={selectedSale?.id}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Sales List Section */}
          <div className="lg:col-span-1">
            <div className="p-4 rounded-lg border border-gray-200 bg-white">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Recent Sales</h2>
                <span className="text-xs text-gray-500 px-2 py-1 rounded-full bg-gray-100">
                  €{stats.avgOrderValue.toFixed(0)} avg
                </span>
              </div>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2 pr-4">
                  {filteredSales.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      {sales.length === 0 
                        ? 'No sales data available.'
                        : 'No sales match the current filters.'}
                    </div>
                  ) : (
                    filteredSales.map((sale) => (
                      <div
                        key={sale.id}
                        className={`p-3 rounded-lg border transition-all cursor-pointer ${
                          selectedSale?.id === sale.id 
                            ? 'border-gray-400 bg-gray-100' 
                            : 'border-gray-200 bg-white hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedSale(sale)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm text-gray-900 truncate">{sale.customerName}</h3>
                            <p className="text-xs text-gray-500 truncate">
                              {sale.city} • {sale.orderId}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900">
                              €{sale.amount.toLocaleString()}
                            </span>
                            <div 
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ 
                                backgroundColor: sale.customerType === 'pharmacy' 
                                  ? '#22c55e' // green-500
                                  : '#8b5cf6' // violet-500
                              }}
                            />
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {sale.products.slice(0, 2).map((product, i) => (
                            <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                              {product}
                            </span>
                          ))}
                          {sale.products.length > 2 && (
                            <span className="text-xs text-gray-500">
                              +{sale.products.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="mt-6 p-4 rounded-lg border border-gray-200 bg-white">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {isLoading ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading sales...</span>
                </div>
              ) : error ? (
                <div className="flex items-center gap-2 text-gray-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">Failed to load data</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-600">
                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                  <span className="text-sm">
                    {sales.length} orders loaded • Showing {filteredSales.length}
                  </span>
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
              className="border-gray-300"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
