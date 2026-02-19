import { ArrowUpDown, ArrowUp, ArrowDown, FileText, Loader2 } from 'lucide-react';
import { PharmacyWithOrders, SortField, SortDirection } from '@/types/operations';
import { cn } from '@/lib/utils';
import { usePharmacyDocuments } from '@/hooks/usePharmacyOperations';

interface OperationsTableProps {
  pharmacies: PharmacyWithOrders[];
  isLoading: boolean;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  selectedPharmacyId: string | null;
  onSelectPharmacy: (pharmacy: PharmacyWithOrders) => void;
}

function SortIcon({ field, currentField, direction }: { field: SortField; currentField: SortField; direction: SortDirection }) {
  if (field !== currentField) {
    return <ArrowUpDown className="h-3 w-3 text-gray-400" />;
  }
  return direction === 'asc' 
    ? <ArrowUp className="h-3 w-3 text-gray-700" />
    : <ArrowDown className="h-3 w-3 text-gray-700" />;
}

function StatusBadge({ status }: { status: 'not_contacted' | 'contacted' | 'client' }) {
  const styles = {
    not_contacted: 'bg-yellow-100 text-yellow-800', // Yellow
    contacted: 'bg-blue-100 text-blue-800', // Blue
    client: 'bg-green-100 text-green-800', // Green
  };

  const labels = {
    not_contacted: 'Not Contacted',
    contacted: 'Contacted',
    client: 'Client',
  };

  return (
    <span className={cn('px-2 py-0.5 rounded text-xs font-medium', styles[status])}>
      {labels[status]}
    </span>
  );
}

function PaymentBadge({ status }: { status: 'paid' | 'pending' | 'failed' | 'refunded' | null }) {
  if (!status) {
    return <span className="text-xs text-gray-400">—</span>;
  }

  const styles = {
    paid: 'bg-gray-100 text-gray-800',
    pending: 'bg-gray-50 text-gray-600 border border-gray-200',
    failed: 'bg-gray-200 text-gray-600',
    refunded: 'bg-gray-100 text-gray-500',
  };

  return (
    <span className={cn('px-2 py-0.5 rounded text-xs font-medium', styles[status])}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

interface DocCountCellProps {
  pharmacy: PharmacyWithOrders;
}

function DocCountCell({ pharmacy }: DocCountCellProps) {
  const { data: allDocuments = [] } = usePharmacyDocuments();
  const count = allDocuments.filter((d) => d.pharmacyId === pharmacy.id).length;

  return (
    <div className="flex items-center justify-center">
      {count > 0 ? (
        <span className="inline-flex items-center justify-center min-w-[1.5rem] px-1.5 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-800">
          {count}
        </span>
      ) : (
        <FileText className="h-4 w-4 text-gray-300" />
      )}
    </div>
  );
}

export function OperationsTable({
  pharmacies,
  isLoading,
  sortField,
  sortDirection,
  onSort,
  selectedPharmacyId,
  onSelectPharmacy,
}: OperationsTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (pharmacies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <FileText className="h-12 w-12 mb-4 text-gray-300" />
        <p className="font-medium">No pharmacies found</p>
        <p className="text-sm text-gray-400 mt-1">Adjust your filters or add more pharmacies</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[1600px]">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="text-left px-4 py-3 font-medium text-gray-600">
              <button 
                onClick={() => onSort('name')} 
                className="flex items-center gap-1 hover:text-gray-900"
              >
                Name
                <SortIcon field="name" currentField={sortField} direction={sortDirection} />
              </button>
            </th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">
              <button onClick={() => onSort('address')} className="flex items-center gap-1 hover:text-gray-900">
                Address
                <SortIcon field="address" currentField={sortField} direction={sortDirection} />
              </button>
            </th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">
              <button onClick={() => onSort('postal_code')} className="flex items-center gap-1 hover:text-gray-900">
                CP
                <SortIcon field="postal_code" currentField={sortField} direction={sortDirection} />
              </button>
            </th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">
              <button onClick={() => onSort('city')} className="flex items-center gap-1 hover:text-gray-900">
                City
                <SortIcon field="city" currentField={sortField} direction={sortDirection} />
              </button>
            </th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">
              <button onClick={() => onSort('province')} className="flex items-center gap-1 hover:text-gray-900">
                Province
                <SortIcon field="province" currentField={sortField} direction={sortDirection} />
              </button>
            </th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">
              <button onClick={() => onSort('autonomous_community')} className="flex items-center gap-1 hover:text-gray-900">
                Autonomous Community
                <SortIcon field="autonomous_community" currentField={sortField} direction={sortDirection} />
              </button>
            </th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">
              <button onClick={() => onSort('phone')} className="flex items-center gap-1 hover:text-gray-900">
                Phone
                <SortIcon field="phone" currentField={sortField} direction={sortDirection} />
              </button>
            </th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">
              <button onClick={() => onSort('secondary_phone')} className="flex items-center gap-1 hover:text-gray-900">
                Tel. Adicional
                <SortIcon field="secondary_phone" currentField={sortField} direction={sortDirection} />
              </button>
            </th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">
              <button onClick={() => onSort('email')} className="flex items-center gap-1 hover:text-gray-900">
                Email
                <SortIcon field="email" currentField={sortField} direction={sortDirection} />
              </button>
            </th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">
              <button onClick={() => onSort('activity')} className="flex items-center gap-1 hover:text-gray-900">
                Activity
                <SortIcon field="activity" currentField={sortField} direction={sortDirection} />
              </button>
            </th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">
              <button onClick={() => onSort('subsector')} className="flex items-center gap-1 hover:text-gray-900">
                Subsector
                <SortIcon field="subsector" currentField={sortField} direction={sortDirection} />
              </button>
            </th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">
              <button onClick={() => onSort('legal_form')} className="flex items-center gap-1 hover:text-gray-900">
                Legal Form
                <SortIcon field="legal_form" currentField={sortField} direction={sortDirection} />
              </button>
            </th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">
              <button 
                onClick={() => onSort('commercialStatus')} 
                className="flex items-center gap-1 hover:text-gray-900"
              >
                Status
                <SortIcon field="commercialStatus" currentField={sortField} direction={sortDirection} />
              </button>
            </th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">
              <button 
                onClick={() => onSort('lastOrderDate')} 
                className="flex items-center gap-1 hover:text-gray-900"
              >
                Last Order
                <SortIcon field="lastOrderDate" currentField={sortField} direction={sortDirection} />
              </button>
            </th>
            <th className="text-right px-4 py-3 font-medium text-gray-600">
              <button 
                onClick={() => onSort('totalRevenue')} 
                className="flex items-center gap-1 hover:text-gray-900 ml-auto"
              >
                Revenue
                <SortIcon field="totalRevenue" currentField={sortField} direction={sortDirection} />
              </button>
            </th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">
              <button 
                onClick={() => onSort('paymentStatus')} 
                className="flex items-center gap-1 hover:text-gray-900"
              >
                Payment
                <SortIcon field="paymentStatus" currentField={sortField} direction={sortDirection} />
              </button>
            </th>
            <th className="text-center px-4 py-3 font-medium text-gray-600">Docs</th>
          </tr>
        </thead>
        <tbody>
          {pharmacies.map((pharmacy) => (
            <tr
              key={pharmacy.id}
              onClick={() => onSelectPharmacy(pharmacy)}
              className={cn(
                'border-b border-gray-100 cursor-pointer transition-colors',
                selectedPharmacyId === pharmacy.id
                  ? 'bg-gray-100'
                  : 'hover:bg-gray-50'
              )}
            >
              <td className="px-4 py-3">
                <div className="font-medium text-gray-900 truncate max-w-[180px]">
                  {pharmacy.name}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="text-xs text-gray-700 truncate max-w-[180px]">
                  {pharmacy.address || '—'}
                </div>
              </td>
              <td className="px-4 py-3 text-xs text-gray-700">
                {pharmacy.postal_code || '—'}
              </td>
              <td className="px-4 py-3 text-gray-700">
                {pharmacy.city || '—'}
              </td>
              <td className="px-4 py-3 text-gray-700">
                {pharmacy.province || '—'}
              </td>
              <td className="px-4 py-3 text-xs text-gray-700">
                {pharmacy.autonomous_community || '—'}
              </td>
              <td className="px-4 py-3 text-xs text-gray-700">
                {pharmacy.phone || '—'}
              </td>
              <td className="px-4 py-3 text-xs text-gray-700">
                {pharmacy.secondary_phone || '—'}
              </td>
              <td className="px-4 py-3">
                <div className="text-xs text-gray-700 truncate max-w-[150px]">
                  {pharmacy.email || '—'}
                </div>
              </td>
              <td className="px-4 py-3 text-xs text-gray-700">
                {pharmacy.activity || '—'}
              </td>
              <td className="px-4 py-3 text-xs text-gray-700">
                {pharmacy.subsector || '—'}
              </td>
              <td className="px-4 py-3 text-xs text-gray-700">
                {pharmacy.legal_form || '—'}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={pharmacy.commercialStatus} />
              </td>
              <td className="px-4 py-3">
                {pharmacy.lastOrder ? (
                  <div>
                    <div className="text-gray-700">{pharmacy.lastOrder.orderId}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(pharmacy.lastOrder.dateCreated).toLocaleDateString()}
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-400">No orders</span>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                <span className="font-medium text-gray-900">
                  €{pharmacy.totalRevenue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                </span>
              </td>
              <td className="px-4 py-3">
                <PaymentBadge status={pharmacy.lastOrder?.paymentStatus || null} />
              </td>
              <td className="px-4 py-3">
                <DocCountCell pharmacy={pharmacy} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
