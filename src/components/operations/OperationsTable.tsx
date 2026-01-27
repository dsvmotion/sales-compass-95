import { ArrowUpDown, ArrowUp, ArrowDown, FileText, Receipt, Check, X, Loader2 } from 'lucide-react';
import { PharmacyWithOrders, SortField, SortDirection } from '@/types/operations';
import { cn } from '@/lib/utils';

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

function DocIndicator({ has, type }: { has: boolean; type: 'invoice' | 'receipt' }) {
  const Icon = type === 'invoice' ? FileText : Receipt;
  return (
    <div className={cn('flex items-center gap-1', has ? 'text-gray-700' : 'text-gray-300')}>
      <Icon className="h-3.5 w-3.5" />
      {has ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
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
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="text-left px-4 py-3 font-medium text-gray-600">
              <button 
                onClick={() => onSort('name')} 
                className="flex items-center gap-1 hover:text-gray-900"
              >
                Pharmacy
                <SortIcon field="name" currentField={sortField} direction={sortDirection} />
              </button>
            </th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Location</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Contact</th>
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
                <div className="font-medium text-gray-900 truncate max-w-[200px]">
                  {pharmacy.name}
                </div>
                {pharmacy.address && (
                  <div className="text-xs text-gray-500 truncate max-w-[200px]">
                    {pharmacy.address}
                  </div>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="text-gray-700">{pharmacy.city || '—'}</div>
                <div className="text-xs text-gray-500">
                  {[pharmacy.province, pharmacy.country].filter(Boolean).join(', ') || '—'}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="text-gray-700 text-xs">{pharmacy.phone || '—'}</div>
                <div className="text-xs text-gray-500 truncate max-w-[150px]">
                  {pharmacy.email || '—'}
                </div>
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
                <div className="flex items-center justify-center gap-2">
                  <DocIndicator has={pharmacy.hasInvoice} type="invoice" />
                  <DocIndicator has={pharmacy.hasReceipt} type="receipt" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
