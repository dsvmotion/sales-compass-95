import { useState, useMemo } from 'react';
import { Building2, DollarSign, ShoppingBag, User, RefreshCw, AlertCircle, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { SalesMap } from '@/components/SalesMap';
import { StatCard } from '@/components/StatCard';
import { CategoryFilter } from '@/components/CategoryFilter';
import { SalesList } from '@/components/SalesList';
import { mockSales, getStats, CustomerType, Sale } from '@/data/mockSales';
import { useWooCommerceOrders } from '@/hooks/useWooCommerceOrders';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [activeFilter, setActiveFilter] = useState<CustomerType | 'all'>('all');
  const [useLiveData, setUseLiveData] = useState(true);

  const { data: wooData, isLoading, error, refetch } = useWooCommerceOrders(useLiveData);

  const salesData: Sale[] = useMemo(() => {
    if (useLiveData && wooData?.orders?.length) {
      return wooData.orders;
    }
    return mockSales;
  }, [useLiveData, wooData]);

  const filteredSales = useMemo(() => {
    if (activeFilter === 'all') return salesData;
    return salesData.filter(sale => sale.customerType === activeFilter);
  }, [activeFilter, salesData]);

  const stats = useMemo(() => getStats(salesData), [salesData]);
  const filteredStats = useMemo(() => getStats(filteredSales), [filteredSales]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Header showHeatmap={showHeatmap} onHeatmapToggle={setShowHeatmap} />
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
            title="Total Revenue"
            value={`€${filteredStats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            icon={DollarSign}
            trend={{ value: 12.5, positive: true }}
          />
          <StatCard
            title="Total Orders"
            value={filteredStats.totalOrders}
            subtitle={`Avg. €${filteredStats.avgOrderValue.toFixed(0)} per order`}
            icon={ShoppingBag}
            trend={{ value: 8.2, positive: true }}
          />
          <StatCard
            title="Pharmacy Sales"
            value={stats.pharmacyCount}
            subtitle={`€${stats.pharmacyRevenue.toLocaleString()} revenue`}
            icon={Building2}
            variant="pharmacy"
          />
          <StatCard
            title="Client Sales"
            value={stats.clientCount}
            subtitle={`€${stats.clientRevenue.toLocaleString()} revenue`}
            icon={User}
            variant="client"
          />
        </div>

        {/* Filter Bar */}
        <div className="glass-card p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-2">Filter by Category</h2>
              <CategoryFilter
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                pharmacyCount={stats.pharmacyCount}
                clientCount={stats.clientCount}
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-pharmacy" />
                <span className="text-muted-foreground">Pharmacy</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-accent" />
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
                <h2 className="font-semibold">
                  {showHeatmap ? 'Sales Heatmap' : 'Sales Locations'}
                </h2>
                <span className="text-xs text-muted-foreground">
                  {filteredSales.length} locations
                </span>
              </div>
              <div style={{ height: '500px', position: 'relative' }} className="rounded-lg overflow-hidden">
                <SalesMap sales={filteredSales} showHeatmap={showHeatmap} />
              </div>
            </div>
          </div>

          {/* Sales List Section */}
          <div className="lg:col-span-1">
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Recent Sales</h2>
                <span className="text-xs text-muted-foreground px-2 py-1 rounded-full bg-secondary">
                  {filteredSales.length} orders
                </span>
              </div>
              <SalesList sales={filteredSales} />
            </div>
          </div>
        </div>

        {/* Data Source & Status */}
        <div className="mt-6 glass-card p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {isLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading orders from WooCommerce...</span>
                </div>
              ) : error ? (
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">Failed to load live data. Showing demo data.</span>
                </div>
              ) : useLiveData && wooData?.orders?.length ? (
                <div className="flex items-center gap-2 text-primary">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm">
                    Connected to moodly.com • {wooData.pagination.total} total orders
                  </span>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">
                  Using demo data
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUseLiveData(!useLiveData)}
              >
                {useLiveData ? 'Use Demo Data' : 'Use Live Data'}
              </Button>
              {useLiveData && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
