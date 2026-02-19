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
  StickyNote,
  Globe,
  Save,
  ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PharmacyWithOrders, DetailedOrder, DocumentType, DOCUMENT_TYPE_LABELS } from '@/types/operations';
import { PharmacyStatus, STATUS_LABELS, STATUS_COLORS } from '@/types/pharmacy';
import { 
  usePharmacyDocuments, 
  useUploadDocument, 
  useDeleteDocument, 
  useDownloadDocument 
} from '@/hooks/usePharmacyOperations';
import { useUpdatePharmacyStatus } from '@/hooks/usePharmacies';
import { usePharmacyPhoto } from '@/hooks/usePharmacyPhoto';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PharmacyOperationsDetailProps {
  pharmacy: PharmacyWithOrders;
  onClose: () => void;
  onStatusUpdate?: () => void;
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

const ACCEPTED_DOC_EXTENSIONS = '.pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx';

function DocumentsSection({ pharmacyId }: { pharmacyId: string }) {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedType, setSelectedType] = useState<DocumentType>('other');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: allDocuments = [] } = usePharmacyDocuments();
  const uploadDocument = useUploadDocument();
  const deleteDocument = useDeleteDocument();
  const downloadDocument = useDownloadDocument();

  const pharmacyDocs = allDocuments.filter((d) => d.pharmacyId === pharmacyId);

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error('Please select a file');
      return;
    }
    try {
      await uploadDocument.mutateAsync({
        pharmacyId,
        orderId: null,
        documentType: selectedType,
        file,
      });
      toast.success(`${DOCUMENT_TYPE_LABELS[selectedType]} uploaded`);
      setShowUploadForm(false);
      setSelectedType('other');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      toast.error('Failed to upload document');
    }
  };

  const handleDelete = async (id: string, filePath: string, label: string) => {
    try {
      await deleteDocument.mutateAsync({ id, filePath });
      toast.success(`${label} deleted`);
    } catch (error) {
      toast.error('Failed to delete document');
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

  const DocIcon = ({ type }: { type: DocumentType }) =>
    type === 'receipt' ? (
      <Receipt className="h-4 w-4 text-gray-500" />
    ) : (
      <FileText className="h-4 w-4 text-gray-500" />
    );

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
        <FileText className="h-3.5 w-3.5" />
        Documents
      </h3>
      {!showUploadForm ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowUploadForm(true)}
          className="border-gray-300 text-gray-700"
        >
          <Upload className="h-3.5 w-3.5 mr-1" />
          Upload Document
        </Button>
      ) : (
        <div className="p-3 border border-gray-200 rounded-lg bg-gray-50 space-y-3">
          <Select value={selectedType} onValueChange={(v) => setSelectedType(v as DocumentType)}>
            <SelectTrigger className="bg-white border-gray-300 h-8 text-sm">
              <SelectValue placeholder="Document type" />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200">
              {(Object.keys(DOCUMENT_TYPE_LABELS) as DocumentType[]).map((t) => (
                <SelectItem key={t} value={t}>
                  {DOCUMENT_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_DOC_EXTENSIONS}
            className="text-xs text-gray-600 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-gray-200 file:text-gray-700"
            onChange={() => {}}
          />
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleUpload} disabled={uploadDocument.isPending}>
              Upload
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowUploadForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
      <div className="space-y-2 mt-3">
        {pharmacyDocs.length === 0 ? (
          <p className="text-xs text-gray-500">No documents yet</p>
        ) : (
          pharmacyDocs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between gap-2 p-2 rounded border border-gray-100 bg-white text-sm"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <DocIcon type={doc.documentType} />
                <div className="min-w-0">
                  <p className="truncate text-gray-900 font-medium">{doc.fileName}</p>
                  <p className="text-xs text-gray-500">
                    {DOCUMENT_TYPE_LABELS[doc.documentType]} · {new Date(doc.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-gray-600"
                  onClick={() => handleDownload(doc.filePath, doc.fileName)}
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-gray-600 hover:text-red-600"
                  onClick={() => handleDelete(doc.id, doc.filePath, DOCUMENT_TYPE_LABELS[doc.documentType])}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
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
      toast.success(`${DOCUMENT_TYPE_LABELS[type]} uploaded`);
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

export function PharmacyOperationsDetail({ pharmacy, onClose, onStatusUpdate }: PharmacyOperationsDetailProps) {
  const [status, setStatus] = useState<PharmacyStatus>(pharmacy.commercialStatus);
  const [notes, setNotes] = useState(pharmacy.notes || '');
  const [hasChanges, setHasChanges] = useState(false);

  const updateStatus = useUpdatePharmacyStatus();
  const { photoUrl, isLoading: photoLoading } = usePharmacyPhoto(pharmacy.id);

  const handleStatusChange = (newStatus: PharmacyStatus) => {
    setStatus(newStatus);
    setHasChanges(true);
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await updateStatus.mutateAsync({
        id: pharmacy.id,
        updates: {
          commercial_status: status,
          notes: notes || null,
        },
      });
      setHasChanges(false);
      onStatusUpdate?.();
      toast.success('Pharmacy updated');
    } catch (error) {
      toast.error('Failed to update pharmacy');
    }
  };

  const statusColor = STATUS_COLORS[status];

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col">
      {/* Header with Photo */}
      <div className="border-b border-gray-200">
        {/* Photo Section */}
        <div className="h-32 bg-gray-100 relative overflow-hidden">
          {photoUrl ? (
            <img 
              src={photoUrl} 
              alt={pharmacy.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {photoLoading ? (
                <div className="animate-pulse">
                  <ImageIcon className="h-10 w-10 text-gray-300" />
                </div>
              ) : (
                <div className="text-center">
                  <Building2 className="h-10 w-10 text-gray-300 mx-auto" />
                  <p className="text-xs text-gray-400 mt-1">No photo available</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Title and Status */}
        <div className="p-4 flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-900 truncate">{pharmacy.name}</h2>
            <span className={cn('inline-block px-2 py-0.5 rounded text-xs font-medium mt-1', statusColor.bg, statusColor.text)}>
              {STATUS_LABELS[status]}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-500 -mr-2">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Commercial Status - EDITABLE */}
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Commercial Status</h3>
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger className="bg-white border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200">
                {(Object.keys(STATUS_LABELS) as PharmacyStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    <div className="flex items-center gap-2">
                      <span className={cn('w-2 h-2 rounded-full', STATUS_COLORS[s].bg.replace('bg-', 'bg-'))} 
                        style={{ backgroundColor: STATUS_COLORS[s].pin }} />
                      {STATUS_LABELS[s]}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

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

          {/* Documents */}
          <DocumentsSection pharmacyId={pharmacy.id} />

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

          {/* Notes - EDITABLE */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
              <StickyNote className="h-3.5 w-3.5" />
              Internal Notes
            </Label>
            <Textarea
              id="notes"
              placeholder="Add notes about this pharmacy..."
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              className="min-h-[80px] resize-none bg-white border-gray-300 text-sm"
            />
          </div>

          <Separator />

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

      {/* Save Button */}
      {hasChanges && (
        <div className="p-4 border-t border-gray-200">
          <Button
            onClick={handleSave}
            disabled={updateStatus.isPending}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            {updateStatus.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}
    </div>
  );
}
