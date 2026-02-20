import { useState, useMemo } from 'react';
import { ShoppingCart, Building2, Users, MapPin, RefreshCw, AlertCircle, ClipboardList, X, Leaf } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SalesMap } from '@/components/SalesMap';
import { useWooCommerceOrders } from '@/hooks/useWooCommerceOrders';
import { usePharmaciesWithOrders } from '@/hooks/usePharmacyOperations';
import { Sale } from '@/types/sale';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserMenu } from '@/components/auth/UserMenu';

const normalizeCountry = (country: string): string => {
  if (!country) return '';
  const map: Record<string, string> = {
    'ES': 'Spain', 'FR': 'France', 'DE': 'Germany', 'IT': 'Italy', 'PT': 'Portugal',
    'GB': 'United Kingdom', 'NL': 'Netherlands', 'BE': 'Belgium', 'AT': 'Austria',
    'CH': 'Switzerland', 'IE': 'Ireland', 'DK': 'Denmark', 'SE': 'Sweden',
    'NO': 'Norway', 'FI': 'Finland', 'PL': 'Poland', 'CZ': 'Czech Republic',
    'GR': 'Greece', 'HR': 'Croatia', 'RO': 'Romania', 'HU': 'Hungary',
    'BG': 'Bulgaria', 'SK': 'Slovakia', 'SI': 'Slovenia', 'LT': 'Lithuania',
    'LV': 'Latvia', 'EE': 'Estonia', 'CY': 'Cyprus', 'MT': 'Malta',
    'LU': 'Luxembourg', 'IS': 'Iceland', 'AD': 'Andorra',
  };
  return map[country.toUpperCase()] || country;
};

const normalizeProvince = (province: string, country: string): string => {
  if (!province) return '';
  // Spanish province codes from WooCommerce
  const spainMap: Record<string, string> = {
    'C': 'A CORUÑA', 'VI': 'ÁLAVA', 'AB': 'ALBACETE', 'A': 'ALICANTE',
    'AL': 'ALMERÍA', 'O': 'ASTURIAS', 'AV': 'ÁVILA', 'BA': 'BADAJOZ',
    'B': 'BARCELONA', 'BI': 'BIZKAIA', 'BU': 'BURGOS', 'CC': 'CÁCERES',
    'CA': 'CÁDIZ', 'S': 'CANTABRIA', 'CS': 'CASTELLÓN', 'CE': 'CEUTA',
    'CR': 'CIUDAD REAL', 'CO': 'CÓRDOBA', 'CU': 'CUENCA', 'SS': 'GIPUZKOA',
    'GI': 'GIRONA', 'GR': 'GRANADA', 'GU': 'GUADALAJARA', 'H': 'HUELVA',
    'HU': 'HUESCA', 'PM': 'ILLES BALEARS', 'J': 'JAÉN', 'LO': 'LA RIOJA',
    'GC': 'LAS PALMAS', 'LE': 'LEÓN', 'L': 'LLEIDA', 'LU': 'LUGO',
    'M': 'MADRID', 'MA': 'MÁLAGA', 'ML': 'MELILLA', 'MU': 'MURCIA',
    'NA': 'NAVARRA', 'OR': 'OURENSE', 'P': 'PALENCIA', 'PO': 'PONTEVEDRA',
    'SA': 'SALAMANCA', 'TF': 'SANTA CRUZ DE TENERIFE', 'SG': 'SEGOVIA',
    'SE': 'SEVILLA', 'SO': 'SORIA', 'T': 'TARRAGONA', 'TE': 'TERUEL',
    'TO': 'TOLEDO', 'V': 'VALENCIA', 'VA': 'VALLADOLID', 'Z': 'ZARAGOZA',
    'ZA': 'ZAMORA',
  };
  const normalizedCountry = normalizeCountry(country);
  if (normalizedCountry === 'Spain' && spainMap[province.toUpperCase()]) {
    return spainMap[province.toUpperCase()];
  }
  return province;
};

const Index = () => {
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  
  const [filters, setFilters] = useState({
    country: '',
    province: '',
    city: '',
    customerType: 'all' as 'pharmacy' | 'client' | 'herbalist' | 'all',
  });

  const { data: sales = [], isLoading, error, refetch } = useWooCommerceOrders();
  const { data: savedPharmacies = [] } = usePharmaciesWithOrders(true);

  const pharmacySales: Sale[] = useMemo(() => {
    if (filters.customerType === 'all' || filters.customerType === 'client') {
      return [];
    }
    return savedPharmacies
      .filter(p => p.lat != null && p.lng != null && p.lat !== 0 && p.lng !== 0)
      .filter(p => {
        if (filters.customerType === 'herbalist') return p.clientType === 'herbalist';
        if (filters.customerType === 'pharmacy') return p.clientType === 'pharmacy';
        return true;
      })
      .filter(p => {
        const nCountry = normalizeCountry(p.country || '');
        const nProvince = (p.province || '').toUpperCase();
        if (filters.country && nCountry !== filters.country) return false;
        if (filters.province && nProvince !== filters.province) return false;
        if (filters.city && p.city !== filters.city) return false;
        return true;
      })
      .map(p => ({
        id: p.id,
        orderId: `DB-${p.id.slice(0, 8)}`,
        customerName: p.name,
        customerType: (p.clientType === 'herbalist' ? 'herbalist' : 'pharmacy') as 'pharmacy' | 'client' | 'herbalist',
        address: p.address || '',
        city: p.city || '',
        province: (p.province || '').toUpperCase(),
        country: normalizeCountry(p.country || ''),
        lat: p.lat,
        lng: p.lng,
        amount: 0,
        date: p.savedAt || '',
        products: [],
        commercialStatus: p.commercialStatus || 'not_contacted',
        phone: p.phone || undefined,
        email: p.email || undefined,
      }));
  }, [savedPharmacies, filters]);

  const allSales = useMemo(() => {
    const normalizedWoo = sales.map(s => ({
      ...s,
      country: normalizeCountry(s.country),
      province: normalizeProvince(s.province, s.country),
    }));
    return [...normalizedWoo, ...pharmacySales];
  }, [sales, pharmacySales]);

  const uniqueCountries = useMemo(() => {
    const countries = [...new Set(allSales.map(s => s.country).filter(Boolean))].sort();
    return countries;
  }, [allSales]);

  const uniqueProvinces = useMemo(() => {
    if (!filters.country) return [];
    const provinces = [...new Set(
      allSales.filter(s => s.country === filters.country)
        .map(s => s.province).filter(Boolean)
    )].sort();
    return provinces;
  }, [allSales, filters.country]);

  const uniqueCities = useMemo(() => {
    if (!filters.province) return [];
    const cities = [...new Set(
      allSales.filter(s => s.country === filters.country && s.province === filters.province)
        .map(s => s.city).filter(Boolean)
    )].sort();
    return cities;
  }, [allSales, filters.country, filters.province]);

  const filteredSales = useMemo(() => {
    return allSales.filter(sale => {
      if (filters.country && sale.country !== filters.country) return false;
      if (filters.province && sale.province !== filters.province) return false;
      if (filters.city && sale.city !== filters.city) return false;
      if (filters.customerType !== 'all' && sale.customerType !== filters.customerType) return false;
      return true;
    });
  }, [allSales, filters]);

  const stats = useMemo(() => {
    // WooCommerce orders filtered by geography
    const filteredWooOrders = sales.filter(sale => {
      if (filters.country && sale.country !== filters.country) return false;
      if (filters.province && sale.province !== filters.province) return false;
      if (filters.city && sale.city !== filters.city) return false;
      return true;
    });
    const wooRevenue = filteredWooOrders.reduce((sum, s) => sum + s.amount, 0);

    // BD counts (no filters applied, just totals)
    const pharmacyCount = savedPharmacies.filter(p => p.clientType === 'pharmacy').length;
    const herbalistCount = savedPharmacies.filter(p => p.clientType === 'herbalist').length;

    // WooCommerce client orders (filtered by geography)
    const clientWooOrders = filteredWooOrders.filter(s => s.customerType === 'client');
    const clientRevenue = clientWooOrders.reduce((sum, s) => sum + s.amount, 0);

    return {
      wooOrders: filteredWooOrders.length,
      wooRevenue,
      pharmacyCount,
      herbalistCount,
      clientOrdersCount: clientWooOrders.length,
      clientRevenue,
      avgOrderValue: filteredSales.length > 0 ? filteredSales.reduce((sum, s) => sum + s.amount, 0) / filteredSales.length : 0,
    };
  }, [sales, savedPharmacies, filters, filteredSales]);

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
            <Link to="/operations/herbalists">
              <Button 
                variant="outline" 
                className="gap-2 bg-white border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              >
                <ClipboardList className="h-4 w-4" />
                Herbalist Operations
              </Button>
            </Link>
            <Link to="/prospecting/herbalists">
              <Button 
                variant="outline" 
                className="gap-2 bg-white border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              >
                <MapPin className="h-4 w-4" />
                Herbalist Prospecting
              </Button>
            </Link>
            <UserMenu />
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
                <p className="text-2xl font-bold text-gray-900">{stats.wooOrders}</p>
                <p className="text-sm text-gray-500">WooCommerce Orders (€{stats.wooRevenue.toLocaleString()})</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-200">
                <Building2 className="h-5 w-5 text-gray-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.pharmacyCount}</p>
                <p className="text-sm text-gray-500">Pharmacies in DB</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-200">
                <Leaf className="h-5 w-5 text-gray-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.herbalistCount}</p>
                <p className="text-sm text-gray-500">Herbalists in DB</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-200">
                <Users className="h-5 w-5 text-gray-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.clientOrdersCount}</p>
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
              
              {/* Country - from actual order data */}
              <SearchableSelect
                value={filters.country || 'all'}
                onValueChange={handleCountryChange}
                options={uniqueCountries}
                placeholder="All Countries"
                className="w-40"
              />

              {/* Province - from actual order data */}
              <SearchableSelect
                value={filters.province || 'all'}
                onValueChange={handleProvinceChange}
                options={uniqueProvinces}
                placeholder={filters.country ? (uniqueProvinces.length > 0 ? 'All Provinces' : 'No provinces') : 'Select Country'}
                disabled={!filters.country}
                className="w-40"
              />

              {/* City - from actual order data */}
              <SearchableSelect
                value={filters.city || 'all'}
                onValueChange={handleCityChange}
                options={uniqueCities}
                placeholder={filters.province ? (uniqueCities.length > 0 ? 'All Cities' : 'No cities') : 'Select Province'}
                disabled={!filters.province}
                className="w-40"
              />
              
              {/* Customer Type */}
              <Select
                value={filters.customerType}
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  customerType: value as 'pharmacy' | 'client' | 'herbalist' | 'all'
                }))}
              >
                <SelectTrigger className="w-40 bg-white border-gray-300 text-gray-900">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200 z-50">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="pharmacy">Pharmacies</SelectItem>
                  <SelectItem value="herbalist">Herbalist</SelectItem>
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
            
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#16a34a' }} />
                <span className="text-gray-600">Pharmacy (not contacted)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#166534' }} />
                <span className="text-gray-600">Herbalist (not contacted)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#3b82f6' }} />
                <span className="text-gray-600">Contacted</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f97316' }} />
                <span className="text-gray-600">Client</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#9333ea' }} />
                <span className="text-gray-600">WooCommerce Order</span>
              </div>
            </div>
          </div>
        </div>

        {pharmacySales.length === 0 && savedPharmacies.length > 0 && (
          <p className="text-sm text-gray-500 mb-4">
            Select Pharmacy or Herbalist type to show database locations on map
          </p>
        )}

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
              className="border-gray-300 text-gray-600"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
