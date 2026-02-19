import { MapPin, Phone, Globe, Check, Save } from 'lucide-react';
import { Pharmacy } from '@/types/pharmacy';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PharmacyListItemProps {
  pharmacy: Pharmacy;
  isSelected: boolean;
  isChecked: boolean;
  onCheck: (checked: boolean) => void;
  onClick: () => void;
  onSaveOne?: (id: string) => void;
  isSavedToOperations?: boolean;
  isSaving?: boolean;
}

function StatusBadge({ status, isSaved }: { status: 'not_contacted' | 'contacted' | 'client'; isSaved: boolean }) {
  const styles = {
    not_contacted: 'bg-yellow-100 text-yellow-800',
    contacted: 'bg-blue-100 text-blue-800',
    client: 'bg-green-100 text-green-800',
  };

  const labels = {
    not_contacted: 'Not Contacted',
    contacted: 'Contacted',
    client: 'Client',
  };

  return (
    <div className="flex items-center gap-1">
      {isSaved && (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-200 text-gray-700 flex items-center gap-0.5">
          <Check className="h-2.5 w-2.5" />
          Saved
        </span>
      )}
      <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium', styles[status])}>
        {labels[status]}
      </span>
    </div>
  );
}

export function PharmacyListItem({
  pharmacy,
  isSelected,
  isChecked,
  onCheck,
  onClick,
  onSaveOne,
  isSavedToOperations = false,
  isSaving = false,
}: PharmacyListItemProps) {
  const isSaved = pharmacy.saved_at !== null;

  return (
    <div
      className={cn(
        'p-3 rounded-lg border cursor-pointer transition-all',
        isSelected 
          ? 'border-gray-400 bg-gray-100' 
          : 'border-gray-200 bg-white hover:bg-gray-50'
      )}
    >
      <div className="flex items-start gap-2">
        {/* Checkbox */}
        <div 
          className="pt-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox
            checked={isChecked}
            onCheckedChange={onCheck}
            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0" onClick={onClick}>
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-sm leading-tight truncate flex-1 text-gray-900">
              {pharmacy.name}
            </h3>
            <StatusBadge status={pharmacy.commercial_status} isSaved={isSaved} />
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

          {/* Save to Operations - per card */}
          {onSaveOne && (
            <div className="mt-2" onClick={(e) => e.stopPropagation()}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full h-7 text-xs border-gray-300"
                disabled={isSavedToOperations || isSaving}
                onClick={() => onSaveOne(pharmacy.id)}
              >
                {isSavedToOperations ? (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Saved ✓
                  </>
                ) : isSaving ? (
                  'Saving...'
                ) : (
                  <>
                    <Save className="h-3 w-3 mr-1" />
                    Save to Operations
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
