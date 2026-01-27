import { Building2, User, Users } from 'lucide-react';
import { CustomerType } from '@/data/mockSales';

interface CategoryFilterProps {
  activeFilter: CustomerType | 'all';
  onFilterChange: (filter: CustomerType | 'all') => void;
  pharmacyCount: number;
  clientCount: number;
}

export function CategoryFilter({ activeFilter, onFilterChange, pharmacyCount, clientCount }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onFilterChange('all')}
        className={`filter-chip flex items-center gap-2 border transition-all duration-200 ${
          activeFilter === 'all'
            ? 'bg-primary text-primary-foreground border-primary'
            : 'bg-secondary/50 text-foreground border-border hover:bg-secondary'
        }`}
      >
        <Users className="h-4 w-4" />
        <span>All</span>
        <span className="ml-1 px-2 py-0.5 rounded-full bg-background/20 text-xs">
          {pharmacyCount + clientCount}
        </span>
      </button>
      
      <button
        onClick={() => onFilterChange('pharmacy')}
        className={`filter-chip filter-chip-pharmacy flex items-center gap-2 ${
          activeFilter === 'pharmacy' ? 'active' : ''
        }`}
      >
        <Building2 className="h-4 w-4" />
        <span>Pharmacies</span>
        <span className="ml-1 px-2 py-0.5 rounded-full bg-background/20 text-xs">
          {pharmacyCount}
        </span>
      </button>
      
      <button
        onClick={() => onFilterChange('client')}
        className={`filter-chip filter-chip-client flex items-center gap-2 ${
          activeFilter === 'client' ? 'active' : ''
        }`}
      >
        <User className="h-4 w-4" />
        <span>Clients</span>
        <span className="ml-1 px-2 py-0.5 rounded-full bg-background/20 text-xs">
          {clientCount}
        </span>
      </button>
    </div>
  );
}
