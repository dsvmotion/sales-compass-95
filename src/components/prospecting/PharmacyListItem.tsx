import { MapPin, Phone, Globe } from 'lucide-react';
import { Pharmacy } from '@/types/pharmacy';
import { PharmacyStatusBadge } from './PharmacyStatusBadge';
import { cn } from '@/lib/utils';

interface PharmacyListItemProps {
  pharmacy: Pharmacy;
  isSelected: boolean;
  onClick: () => void;
}

export function PharmacyListItem({ pharmacy, isSelected, onClick }: PharmacyListItemProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'p-3 rounded-lg border cursor-pointer transition-all',
        'hover:border-primary/50 hover:bg-primary/5',
        isSelected 
          ? 'border-primary bg-primary/10 ring-1 ring-primary/30' 
          : 'border-border bg-card'
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-sm leading-tight truncate flex-1">
          {pharmacy.name}
        </h3>
        <PharmacyStatusBadge status={pharmacy.commercial_status} size="sm" />
      </div>
      
      <div className="space-y-1">
        {pharmacy.address && (
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
            <span className="truncate">{pharmacy.address}</span>
          </div>
        )}
        
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {pharmacy.city && (
            <span className="truncate">{pharmacy.city}</span>
          )}
          {pharmacy.phone && (
            <div className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              <span className="truncate">{pharmacy.phone}</span>
            </div>
          )}
        </div>
        
        {pharmacy.website && (
          <div className="flex items-center gap-1 text-xs text-primary">
            <Globe className="h-3 w-3" />
            <span className="truncate">Website</span>
          </div>
        )}
      </div>
    </div>
  );
}
