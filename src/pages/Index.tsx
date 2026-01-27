import { useState, useMemo } from 'react';
import { Building2, MapPin, Users, RefreshCw, AlertCircle, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { PharmacyGoogleMap } from '@/components/PharmacyGoogleMap';
import { StatCard } from '@/components/StatCard';
import { usePharmacies } from '@/hooks/usePharmacies';
import { Pharmacy, PharmacyStatus, STATUS_LABELS } from '@/types/pharmacy';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

const Index = () => {
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
  
  // Filter state - all empty/default means show ALL pharmacies
  const [filters, setFilters] = useState({
    city: '',
    status: 'all' as PharmacyStatus | 'all',
    search: '',
  });

  const { data: pharmacies = [], isLoading, error, refetch } = usePharmacies();

  // Get unique cities for filter dropdown
  const uniqueCities = useMemo(() => {
    const cities = pharmacies
      .map(p => p.city)
      .filter((city): city is string => !!city);
    return [...new Set(cities)].sort();
  }, [pharmacies]);

  // Filter pharmacies - if no filters are active, show ALL
  const filteredPharmacies = useMemo(() => {
    return pharmacies.filter(pharmacy => {
      // City filter
      if (filters.city && pharmacy.city !== filters.city) {
        return false;
      }
      
      // Status filter
      if (filters.status !== 'all' && pharmacy.commercial_status !== filters.status) {
        return false;
      }
      
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          pharmacy.name.toLowerCase().includes(searchLower) ||
          pharmacy.address?.toLowerCase().includes(searchLower) ||
          pharmacy.city?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      
      return true;
    });
  }, [pharmacies, filters]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = filteredPharmacies.length;
    const clients = filteredPharmacies.filter(p => p.commercial_status === 'client').length;
    const contacted = filteredPharmacies.filter(p => p.commercial_status === 'contacted').length;
    const notContacted = filteredPharmacies.filter(p => p.commercial_status === 'not_contacted').length;
    
    return { total, clients, contacted, notContacted };
  }, [filteredPharmacies]);

  // Clear all filters
  const clearFilters = () => {
    setFilters({ city: '', status: 'all', search: '' });
  };

  const hasActiveFilters = filters.city || filters.status !== 'all' || filters.search;

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
            title="Total Pharmacies"
            value={stats.total}
            subtitle={`${pharmacies.length} in database`}
            icon={Building2}
          />
          <StatCard
            title="Clients"
            value={stats.clients}
            subtitle="Active customers"
            icon={Users}
            variant="pharmacy"
          />
          <StatCard
            title="Contacted"
            value={stats.contacted}
            subtitle="In progress"
            icon={MapPin}
          />
          <StatCard
            title="Not Contacted"
            value={stats.notContacted}
            subtitle="New leads"
            icon={Building2}
            variant="client"
          />
        </div>

        {/* Filter Bar */}
        <div className="glass-card p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Filters:</span>
              </div>
              
              <Input
                placeholder="Search pharmacies..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-48"
              />
              
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
                value={filters.status}
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  status: value as PharmacyStatus | 'all' 
                }))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
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
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-muted-foreground">Client</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-muted-foreground">Contacted</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-gray-500" />
                <span className="text-muted-foreground">Not Contacted</span>
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
                <h2 className="font-semibold">Pharmacy Locations</h2>
                <span className="text-xs text-muted-foreground">
                  {filteredPharmacies.length} pharmacies
                </span>
              </div>
              <div style={{ height: '500px' }} className="rounded-lg overflow-hidden">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center bg-card/50">
                    <div className="text-center">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
                      <p className="text-muted-foreground mt-2">Loading pharmacies...</p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="h-full flex items-center justify-center bg-card/50">
                    <div className="text-center text-destructive">
                      <AlertCircle className="h-8 w-8 mx-auto" />
                      <p className="mt-2">Failed to load pharmacies</p>
                      <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
                        Retry
                      </Button>
                    </div>
                  </div>
                ) : (
                  <PharmacyGoogleMap 
                    pharmacies={filteredPharmacies} 
                    onPharmacySelect={setSelectedPharmacy}
                    selectedPharmacyId={selectedPharmacy?.id}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Pharmacy List Section */}
          <div className="lg:col-span-1">
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Pharmacies</h2>
                <span className="text-xs text-muted-foreground px-2 py-1 rounded-full bg-secondary">
                  {filteredPharmacies.length} total
                </span>
              </div>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2 pr-4">
                  {filteredPharmacies.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {pharmacies.length === 0 
                        ? 'No pharmacies in database. Use Pharmacy Prospecting to add some.'
                        : 'No pharmacies match the current filters.'}
                    </div>
                  ) : (
                    filteredPharmacies.map((pharmacy) => (
                      <div
                        key={pharmacy.id}
                        className={`p-3 rounded-lg border transition-all cursor-pointer hover:border-primary/50 ${
                          selectedPharmacy?.id === pharmacy.id 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border bg-card/50'
                        }`}
                        onClick={() => setSelectedPharmacy(pharmacy)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm truncate">{pharmacy.name}</h3>
                            <p className="text-xs text-muted-foreground truncate">
                              {pharmacy.city}
                              {pharmacy.address && ` • ${pharmacy.address}`}
                            </p>
                          </div>
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                            style={{ 
                              backgroundColor: pharmacy.commercial_status === 'client' 
                                ? '#22c55e' 
                                : pharmacy.commercial_status === 'contacted' 
                                  ? '#eab308' 
                                  : '#6b7280' 
                            }}
                          />
                        </div>
                        {pharmacy.phone && (
                          <p className="text-xs text-muted-foreground mt-1">{pharmacy.phone}</p>
                        )}
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
                  <span className="text-sm">Loading pharmacies...</span>
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
                    {pharmacies.length} pharmacies loaded • Showing {filteredPharmacies.length}
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
