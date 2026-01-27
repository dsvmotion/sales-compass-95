import { useState, useMemo } from 'react';
import { ShoppingCart, TrendingUp, Users, MapPin, RefreshCw, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { SalesMap } from '@/components/SalesMap';
import { StatCard } from '@/components/StatCard';
import { useWooCommerceOrders } from '@/hooks/useWooCommerceOrders';
import { Sale } from '@/data/mockSales';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

const Index = () => {
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  
  // Filter state
  const [filters, setFilters] = useState({
    city: '',
    customerType: 'all' as 'pharmacy' | 'client' | 'all',
  });

  const { data: sales = [], isLoading, error, refetch } = useWooCommerceOrders();

  // Get unique cities for filter dropdown
  const uniqueCities = useMemo(() => {
    const cities = sales
      .map(s => s.city)
      .filter((city): city is string => !!city);
    return [...new Set(cities)].sort();
  }, [sales]);

  // Filter sales
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      if (filters.city && sale.city !== filters.city) return false;
      if (filters.customerType !== 'all' && sale.customerType !== filters.customerType) return false;
      return true;
    });
  }, [sales, filters]);

  // Calculate stats
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

  // Clear all filters
  const clearFilters = () => {
    setFilters({ city: '', customerType: 'all' });
  };

  const hasActiveFilters = filters.city || filters.customerType !== 'all';

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Header />
          <Link to="/prospecting">
            <Button variant="outline" className="gap-2">
              <MapPin className="h-4 w-4" />
              Pharmacy Prospecting
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Orders"
            value={stats.totalOrders}
            subtitle={`${sales.length} total in system`}
            icon={ShoppingCart}
          />
          <StatCard
            title="Total Revenue"
            value={`€${stats.totalRevenue.toLocaleString()}`}
            subtitle="All sales combined"
            icon={TrendingUp}
            variant="pharmacy"
          />
          <StatCard
            title="Pharmacy Sales"
            value={stats.pharmacyCount}
            subtitle={`€${stats.pharmacyRevenue.toLocaleString()} revenue`}
            icon={MapPin}
          />
          <StatCard
            title="Client Sales"
            value={stats.clientCount}
            subtitle={`€${stats.clientRevenue.toLocaleString()} revenue`}
            icon={Users}
            variant="client"
          />
        </div>

        {/* Filter Bar */}
        <div className="glass-card p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">Filters:</span>
              
              <Select
                value={filters.city || 'all-cities'}
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  city: value === 'all-cities' ? '' : value 
                }))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Cities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-cities">All Cities</SelectItem>
                  {uniqueCities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select
                value={filters.customerType}
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  customerType: value as 'pharmacy' | 'client' | 'all'
                }))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="pharmacy">Pharmacies</SelectItem>
                  <SelectItem value="client">Clients</SelectItem>
                </SelectContent>
              </Select>
              
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-teal-500" />
                <span className="text-muted-foreground">Pharmacy</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-muted-foreground">Client</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Sales Locations</h2>
                <span className="text-xs text-muted-foreground">
                  {filteredSales.length} orders
                </span>
              </div>
              <div style={{ height: '500px' }} className="rounded-lg overflow-hidden">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center bg-card/50">
                    <div className="text-center">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
                      <p className="text-muted-foreground mt-2">Loading sales data...</p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="h-full flex items-center justify-center bg-card/50">
                    <div className="text-center text-destructive">
                      <AlertCircle className="h-8 w-8 mx-auto" />
                      <p className="mt-2">Failed to load sales</p>
                      <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
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
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Recent Sales</h2>
                <span className="text-xs text-muted-foreground px-2 py-1 rounded-full bg-secondary">
                  €{stats.avgOrderValue.toFixed(0)} avg
                </span>
              </div>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2 pr-4">
                  {filteredSales.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {sales.length === 0 
                        ? 'No sales data available.'
                        : 'No sales match the current filters.'}
                    </div>
                  ) : (
                    filteredSales.map((sale) => (
                      <div
                        key={sale.id}
                        className={`p-3 rounded-lg border transition-all cursor-pointer hover:border-primary/50 ${
                          selectedSale?.id === sale.id 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border bg-card/50'
                        }`}
                        onClick={() => setSelectedSale(sale)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm truncate">{sale.customerName}</h3>
                            <p className="text-xs text-muted-foreground truncate">
                              {sale.city} • {sale.orderId}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-primary">
                              €{sale.amount.toLocaleString()}
                            </span>
                            <div 
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ 
                                backgroundColor: sale.customerType === 'pharmacy' 
                                  ? '#14b8a6' 
                                  : '#a855f7'
                              }}
                            />
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {sale.products.slice(0, 2).map((product, i) => (
                            <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                              {product}
                            </span>
                          ))}
                          {sale.products.length > 2 && (
                            <span className="text-xs text-muted-foreground">
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
        <div className="mt-6 glass-card p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {isLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading sales...</span>
                </div>
              ) : error ? (
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">Failed to load data</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-primary">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
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
