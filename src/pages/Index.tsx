import { useState, useMemo } from 'react';
import { Building2, DollarSign, ShoppingBag, TrendingUp, User } from 'lucide-react';
import { Header } from '@/components/Header';
import { SalesMap } from '@/components/SalesMap';
import { StatCard } from '@/components/StatCard';
import { CategoryFilter } from '@/components/CategoryFilter';
import { SalesList } from '@/components/SalesList';
import { mockSales, getStats, CustomerType } from '@/data/mockSales';

const Index = () => {
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [activeFilter, setActiveFilter] = useState<CustomerType | 'all'>('all');

  const filteredSales = useMemo(() => {
    if (activeFilter === 'all') return mockSales;
    return mockSales.filter(sale => sale.customerType === activeFilter);
  }, [activeFilter]);

  const stats = useMemo(() => getStats(mockSales), []);
  const filteredStats = useMemo(() => getStats(filteredSales), [filteredSales]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-[1600px] mx-auto">
        <Header showHeatmap={showHeatmap} onHeatmapToggle={setShowHeatmap} />

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
              <div className="h-[500px] rounded-lg overflow-hidden">
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

        {/* Footer Notice */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            To connect your WooCommerce store, enable Cloud integration and add your API credentials.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
