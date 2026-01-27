import { MapPin, Phone, Globe } from 'lucide-react';
import { Pharmacy } from '@/types/pharmacy';
import { cn } from '@/lib/utils';

interface PharmacyListItemProps {
  pharmacy: Pharmacy;
  isSelected: boolean;
  onClick: () => void;
}

function StatusBadge({ status }: { status: 'not_contacted' | 'contacted' | 'client' }) {
  const styles = {
    not_contacted: 'bg-gray-100 text-gray-600',
    contacted: 'bg-gray-200 text-gray-700',
    client: 'bg-gray-800 text-white',
  };

  const labels = {
    not_contacted: 'Not Contacted',
    contacted: 'Contacted',
    client: 'Client',
  };

  return (
    <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium', styles[status])}>
      {labels[status]}
    </span>
  );
}

export function PharmacyListItem({ pharmacy, isSelected, onClick }: PharmacyListItemProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'p-3 rounded-lg border cursor-pointer transition-all',
        isSelected 
          ? 'border-gray-400 bg-gray-100' 
          : 'border-gray-200 bg-white hover:bg-gray-50'
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-sm leading-tight truncate flex-1 text-gray-900">
          {pharmacy.name}
        </h3>
        <StatusBadge status={pharmacy.commercial_status} />
      </div>
      
      <div className="space-y-1">
        {pharmacy.address && (
          <div className="flex items-start gap-2 text-xs text-gray-500">
            <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
            <span className="truncate">{pharmacy.address}</span>
          </div>
        )}
        
        <div className="flex items-center gap-3 text-xs text-gray-500">
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
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Globe className="h-3 w-3" />
            <span className="truncate">Website</span>
          </div>
        )}
      </div>
    </div>
  );
}
