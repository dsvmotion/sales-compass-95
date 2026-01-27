import { useState, useRef } from 'react';
import { 
  X, 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  FileText, 
  Receipt, 
  Upload, 
  Trash2, 
  Download,
  ExternalLink,
  Package,
  CreditCard,
  StickyNote
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { PharmacyWithOrders, DetailedOrder } from '@/types/operations';
import { 
  usePharmacyDocuments, 
  useUploadDocument, 
  useDeleteDocument, 
  useDownloadDocument 
} from '@/hooks/usePharmacyOperations';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PharmacyOperationsDetailProps {
  pharmacy: PharmacyWithOrders;
  onClose: () => void;
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

function PaymentBadge({ status }: { status: 'paid' | 'pending' | 'failed' | 'refunded' }) {
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

function OrderCard({ order, pharmacyId }: { order: DetailedOrder; pharmacyId: string }) {
  const invoiceInputRef = useRef<HTMLInputElement>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);
  const { data: allDocuments = [] } = usePharmacyDocuments();
  const uploadDocument = useUploadDocument();
  const deleteDocument = useDeleteDocument();
  const downloadDocument = useDownloadDocument();

  const orderDocs = allDocuments.filter(d => d.pharmacyId === pharmacyId && d.orderId === order.orderId);
  const invoice = orderDocs.find(d => d.documentType === 'invoice');
  const receipt = orderDocs.find(d => d.documentType === 'receipt');

  const handleUpload = async (file: File, type: 'invoice' | 'receipt') => {
    try {
      await uploadDocument.mutateAsync({
        pharmacyId,
        orderId: order.orderId,
        documentType: type,
        file,
      });
      toast.success(`${type === 'invoice' ? 'Invoice' : 'Receipt'} uploaded`);
    } catch (error) {
      toast.error(`Failed to upload ${type}`);
    }
  };

  const handleDelete = async (id: string, filePath: string, type: string) => {
    try {
      await deleteDocument.mutateAsync({ id, filePath });
      toast.success(`${type} deleted`);
    } catch (error) {
      toast.error(`Failed to delete ${type}`);
    }
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      const blob = await downloadDocument.mutateAsync(filePath);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-white">
      {/* Order Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{order.orderId}</span>
          <PaymentBadge status={order.paymentStatus} />
        </div>
        <span className="text-sm text-gray-500">
          {new Date(order.dateCreated).toLocaleDateString()}
        </span>
      </div>

      {/* Order Details */}
      <div className="space-y-1 text-sm mb-3">
        <div className="flex items-center gap-2 text-gray-600">
          <Package className="h-3.5 w-3.5" />
          <span>{order.products.length} product(s)</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <CreditCard className="h-3.5 w-3.5" />
          <span>{order.paymentMethodTitle}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Amount:</span>
          <span className="font-semibold text-gray-900">
            €{order.amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Payment Link */}
      {order.paymentLinkUrl && (
        <div className="mb-3 p-2 bg-gray-50 rounded text-xs flex items-center gap-2">
          <ExternalLink className="h-3.5 w-3.5 text-gray-500" />
          <a 
            href={order.paymentLinkUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-gray-900 truncate flex-1"
          >
            {order.paymentLinkUrl}
          </a>
        </div>
      )}

      {/* Products */}
      <div className="mb-3">
        <p className="text-xs text-gray-500 mb-1">Products:</p>
        <div className="space-y-1">
          {order.products.map((product, idx) => (
            <div key={idx} className="text-xs text-gray-700 flex justify-between">
              <span className="truncate max-w-[200px]">{product.name}</span>
              <span className="text-gray-500">×{product.quantity}</span>
            </div>
          ))}
        </div>
      </div>

      <Separator className="my-3" />

      {/* Documents */}
      <div className="space-y-2">
        {/* Invoice - RED when missing */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-700">Invoice</span>
          </div>
          {invoice ? (
            <div className="flex items-center gap-1">
              <span className="text-xs text-green-600 mr-2">Uploaded</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDownload(invoice.filePath, invoice.fileName)}
                className="h-7 px-2 text-gray-600"
              >
                <Download className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(invoice.id, invoice.filePath, 'Invoice')}
                className="h-7 px-2 text-gray-600 hover:text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <>
              <input
                ref={invoiceInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file, 'invoice');
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => invoiceInputRef.current?.click()}
                className="h-7 px-2 bg-red-50 border-red-300 text-red-700 hover:bg-red-100 hover:text-red-800"
                disabled={uploadDocument.isPending}
              >
                <Upload className="h-3.5 w-3.5 mr-1" />
                Upload Invoice
              </Button>
            </>
          )}
        </div>

        {/* Receipt - GREEN when invoice uploaded but no receipt */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-700">Receipt</span>
          </div>
          {receipt ? (
            <div className="flex items-center gap-1">
              <span className="text-xs text-green-600 mr-2">Paid</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDownload(receipt.filePath, receipt.fileName)}
                className="h-7 px-2 text-gray-600"
              >
                <Download className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(receipt.id, receipt.filePath, 'Receipt')}
                className="h-7 px-2 text-gray-600 hover:text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : invoice ? (
            // Only show receipt upload when invoice is already uploaded
            <>
              <input
                ref={receiptInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file, 'receipt');
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => receiptInputRef.current?.click()}
                className="h-7 px-2 bg-green-50 border-green-300 text-green-700 hover:bg-green-100 hover:text-green-800"
                disabled={uploadDocument.isPending}
              >
                <Upload className="h-3.5 w-3.5 mr-1" />
                Upload Receipt
              </Button>
            </>
          ) : (
            // Invoice not uploaded yet - receipt button disabled
            <span className="text-xs text-gray-400">Upload invoice first</span>
          )}
        </div>
      </div>
    </div>
  );
}

export function PharmacyOperationsDetail({ pharmacy, onClose }: PharmacyOperationsDetailProps) {
  return (
    <div className="h-[calc(100vh-56px)] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="h-5 w-5 text-gray-600" />
            <h2 className="font-semibold text-gray-900">{pharmacy.name}</h2>
          </div>
          <StatusBadge status={pharmacy.commercialStatus} />
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-500">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Contact Info */}
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Contact</h3>
            {pharmacy.address && (
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <div>{pharmacy.address}</div>
                  <div className="text-gray-500">
                    {[pharmacy.city, pharmacy.province, pharmacy.country].filter(Boolean).join(', ')}
                  </div>
                </div>
              </div>
            )}
            {pharmacy.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Phone className="h-4 w-4 text-gray-400" />
                <span>{pharmacy.phone}</span>
              </div>
            )}
            {pharmacy.email && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Mail className="h-4 w-4 text-gray-400" />
                <span>{pharmacy.email}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Total Orders</p>
              <p className="text-xl font-semibold text-gray-900">{pharmacy.orders.length}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Total Revenue</p>
              <p className="text-xl font-semibold text-gray-900">
                €{pharmacy.totalRevenue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <Separator />

          {/* Notes */}
          {pharmacy.notes && (
            <>
              <div className="space-y-2">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                  <StickyNote className="h-3.5 w-3.5" />
                  Notes
                </h3>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                  {pharmacy.notes}
                </p>
              </div>
              <Separator />
            </>
          )}

          {/* Order History */}
          <div className="space-y-3">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Order History ({pharmacy.orders.length})
            </h3>
            
            {pharmacy.orders.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pharmacy.orders.map((order) => (
                  <OrderCard key={order.id} order={order} pharmacyId={pharmacy.id} />
                ))}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
