import { useState } from 'react';
import { 
  X, MapPin, Phone, Globe, Clock, Copy, Check, 
  ExternalLink, Mail, FileText, Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Pharmacy, PharmacyStatus, STATUS_LABELS } from '@/types/pharmacy';
import { PharmacyStatusBadge } from './PharmacyStatusBadge';
import { useUpdatePharmacy } from '@/hooks/usePharmacies';
import { toast } from 'sonner';

interface PharmacyDetailPanelProps {
  pharmacy: Pharmacy;
  onClose: () => void;
}

export function PharmacyDetailPanel({ pharmacy, onClose }: PharmacyDetailPanelProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [notes, setNotes] = useState(pharmacy.notes || '');
  const [email, setEmail] = useState(pharmacy.email || '');
  const [status, setStatus] = useState<PharmacyStatus>(pharmacy.commercial_status);
  const [hasChanges, setHasChanges] = useState(false);

  const updatePharmacy = useUpdatePharmacy();

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSave = async () => {
    try {
      await updatePharmacy.mutateAsync({
        id: pharmacy.id,
        updates: {
          commercial_status: status,
          notes: notes || null,
          email: email || null,
        },
      });
      setHasChanges(false);
      toast.success('Pharmacy updated');
    } catch (error) {
      toast.error('Failed to update pharmacy');
    }
  };

  const handleStatusChange = (newStatus: PharmacyStatus) => {
    setStatus(newStatus);
    setHasChanges(true);
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);
    setHasChanges(true);
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setHasChanges(true);
  };

  return (
    <div className="h-full flex flex-col bg-card border-l border-border">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-lg leading-tight mb-2 truncate">
            {pharmacy.name}
          </h2>
          <PharmacyStatusBadge status={status} />
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Location Info */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Location</h3>
          
          {pharmacy.address && (
            <div className="flex items-start gap-3 group">
              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm">{pharmacy.address}</p>
                {(pharmacy.city || pharmacy.province) && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {[pharmacy.city, pharmacy.province, pharmacy.country].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Contact Info */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Contact</h3>
          
          {pharmacy.phone && (
            <div className="flex items-center gap-3 group">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm flex-1">{pharmacy.phone}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => copyToClipboard(pharmacy.phone!, 'phone')}
              >
                {copiedField === 'phone' ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          )}

          {pharmacy.website && (
            <div className="flex items-center gap-3 group">
              <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
              <a
                href={pharmacy.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1 flex-1 truncate"
              >
                {new URL(pharmacy.website).hostname}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          {/* Email Field (editable) */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2 text-xs text-muted-foreground">
              <Mail className="h-3 w-3" />
              Email (manually added)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="email"
                type="email"
                placeholder="Add email..."
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                className="h-8 text-sm"
              />
              {email && (
                <a
                  href={`mailto:${email}`}
                  className="shrink-0"
                >
                  <Button variant="outline" size="sm" className="h-8">
                    <Mail className="h-3 w-3" />
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Opening Hours */}
        {pharmacy.opening_hours && pharmacy.opening_hours.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Opening Hours
            </h3>
            <div className="text-xs space-y-1 pl-6">
              {pharmacy.opening_hours.map((hours, index) => (
                <p key={index} className="text-muted-foreground">{hours}</p>
              ))}
            </div>
          </div>
        )}

        {/* Commercial Status */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Commercial Status</h3>
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(STATUS_LABELS) as PharmacyStatus[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Notes */}
        <div className="space-y-3">
          <Label htmlFor="notes" className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Internal Notes
          </Label>
          <Textarea
            id="notes"
            placeholder="Add notes about this pharmacy..."
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            className="min-h-[100px] resize-none"
          />
        </div>
      </div>

      {/* Footer */}
      {hasChanges && (
        <div className="p-4 border-t border-border">
          <Button
            onClick={handleSave}
            disabled={updatePharmacy.isPending}
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            {updatePharmacy.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}
    </div>
  );
}
