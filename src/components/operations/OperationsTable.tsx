import { useRef, useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, FileText, Receipt, Check, X, Loader2, Upload } from 'lucide-react';
import { PharmacyWithOrders, SortField, SortDirection } from '@/types/operations';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useUploadDocument, usePharmacyDocuments } from '@/hooks/usePharmacyOperations';
import { toast } from 'sonner';

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

interface DocUploadCellProps {
  pharmacy: PharmacyWithOrders;
}

function DocUploadCell({ pharmacy }: DocUploadCellProps) {
  const invoiceInputRef = useRef<HTMLInputElement>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);
  const uploadDocument = useUploadDocument();
  const { data: allDocuments = [] } = usePharmacyDocuments();

  // Get the latest order for this pharmacy (if any)
  const latestOrder = pharmacy.lastOrder;
  const orderId = latestOrder?.orderId || null;

  // Check docs for this pharmacy
  const pharmacyDocs = allDocuments.filter(d => d.pharmacyId === pharmacy.id);
  const hasInvoice = pharmacyDocs.some(d => d.documentType === 'invoice');
  const hasReceipt = pharmacyDocs.some(d => d.documentType === 'receipt');

  const handleUpload = async (file: File, type: 'invoice' | 'receipt', e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row selection
    
    if (!orderId) {
      toast.error('No order linked to this pharmacy');
      return;
    }

    try {
      await uploadDocument.mutateAsync({
        pharmacyId: pharmacy.id,
        orderId,
        documentType: type,
        file,
      });
      toast.success(`${type === 'invoice' ? 'Invoice' : 'Receipt'} uploaded`);
    } catch (error) {
      toast.error(`Failed to upload ${type}`);
    }
  };

  // No orders - can't upload documents
  if (!orderId) {
    return (
      <div className="flex items-center justify-center gap-2 text-gray-300">
        <FileText className="h-3.5 w-3.5" />
        <Receipt className="h-3.5 w-3.5" />
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
        {/* Invoice Button */}
        <input
          ref={invoiceInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file, 'invoice', e as unknown as React.MouseEvent);
          }}
        />
        <Tooltip>
          <TooltipTrigger asChild>
            {hasInvoice ? (
              <div className="p-1.5 text-green-600">
                <FileText className="h-4 w-4" />
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  invoiceInputRef.current?.click();
                }}
                className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                disabled={uploadDocument.isPending}
              >
                <FileText className="h-4 w-4" />
              </Button>
            )}
          </TooltipTrigger>
          <TooltipContent>
            {hasInvoice ? 'Invoice uploaded' : 'Upload invoice (PDF)'}
          </TooltipContent>
        </Tooltip>

        {/* Receipt Button - only available if invoice is uploaded */}
        <input
          ref={receiptInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file, 'receipt', e as unknown as React.MouseEvent);
          }}
        />
        <Tooltip>
          <TooltipTrigger asChild>
            {hasReceipt ? (
              <div className="p-1.5 text-green-600">
                <Receipt className="h-4 w-4" />
              </div>
            ) : hasInvoice ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  receiptInputRef.current?.click();
                }}
                className="h-7 w-7 p-0 text-green-500 hover:text-green-600 hover:bg-green-50"
                disabled={uploadDocument.isPending}
              >
                <Receipt className="h-4 w-4" />
              </Button>
            ) : (
              <div className="p-1.5 text-gray-300">
                <Receipt className="h-4 w-4" />
              </div>
            )}
          </TooltipTrigger>
          <TooltipContent>
            {hasReceipt 
              ? 'Receipt uploaded' 
              : hasInvoice 
                ? 'Upload receipt (PDF/Image)' 
                : 'Upload invoice first'}
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
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
                <DocUploadCell pharmacy={pharmacy} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
