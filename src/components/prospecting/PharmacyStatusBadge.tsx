import { PharmacyStatus, STATUS_LABELS, STATUS_COLORS } from '@/types/pharmacy';
import { cn } from '@/lib/utils';

interface PharmacyStatusBadgeProps {
  status: PharmacyStatus;
  size?: 'sm' | 'md';
}

export function PharmacyStatusBadge({ status, size = 'md' }: PharmacyStatusBadgeProps) {
  const colors = STATUS_COLORS[status];
  
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        colors.bg,
        colors.text,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      )}
    >
      <span
        className={cn(
          'rounded-full',
          size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'
        )}
        style={{ backgroundColor: colors.pin }}
      />
      {STATUS_LABELS[status]}
    </span>
  );
}
