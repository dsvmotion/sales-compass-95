import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Loader2, FileSpreadsheet } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import type { ClientType } from '@/types/pharmacy';
import { cn } from '@/lib/utils';

const FIELDS = [
  { key: 'name', label: 'Name', required: true },
  { key: 'address', label: 'Address', required: false },
  { key: 'postal_code', label: 'Postal code', required: false },
  { key: 'city', label: 'City (LOCALIDAD)', required: false },
  { key: 'sub_locality', label: 'Sub locality', required: false },
  { key: 'province', label: 'Province', required: false },
  { key: 'autonomous_community', label: 'Comunidad autónoma', required: false },
  { key: 'country', label: 'Country', required: false },
  { key: 'lat', label: 'Latitude', required: false },
  { key: 'lng', label: 'Longitude', required: false },
  { key: 'phone', label: 'Phone', required: false },
  { key: 'secondary_phone', label: 'Tel. adicional', required: false },
  { key: 'email', label: 'Email', required: false },
  { key: 'website', label: 'Website', required: false },
  { key: 'activity', label: 'Activity', required: false },
  { key: 'subsector', label: 'Subsector', required: false },
  { key: 'legal_form', label: 'Forma social', required: false },
  { key: 'client_type', label: 'Type (pharmacy/herbalist)', required: false },
] as const;

type FieldKey = (typeof FIELDS)[number]['key'];

const AUTO_DETECT: Record<string, FieldKey> = {
  'nombre de empresa': 'name',
  nombre: 'name',
  name: 'name',
  direccion: 'address',
  dirección: 'address',
  address: 'address',
  cp: 'postal_code',
  'codigo postal': 'postal_code',
  postal_code: 'postal_code',
  localidad: 'city',
  ciudad: 'city',
  city: 'city',
  'sub localidad': 'sub_locality',
  sublocalidad: 'sub_locality',
  provincia: 'province',
  province: 'province',
  'comunidad autonoma': 'autonomous_community',
  'comunidad autónoma': 'autonomous_community',
  telefono: 'phone',
  teléfono: 'phone',
  phone: 'phone',
  'tel. adicional': 'secondary_phone',
  email: 'email',
  correo: 'email',
  actividad: 'activity',
  subsector: 'subsector',
  'forma social': 'legal_form',
  web: 'website',
  website: 'website',
  latitud: 'lat',
  longitud: 'lng',
  lat: 'lat',
  lng: 'lng',
  tipo: 'client_type',
  type: 'client_type',
};

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, ' ');
}

function parseCSVLine(line: string, sep: string): string[] {
  const row: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let j = 0; j < line.length; j++) {
    const ch = line[j];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === sep && !inQuotes) {
      row.push(current.trim().replace(/^["']|["']$/g, ''));
      current = '';
    } else {
      current += ch;
    }
  }
  row.push(current.trim().replace(/^["']|["']$/g, ''));
  return row;
}

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  const first = lines[0];
  const sep = first.includes(';') ? ';' : ',';
  const headers = parseCSVLine(first, sep);
  const rows: string[][] = [];
  for (let i = 1; i < lines.length; i++) {
    rows.push(parseCSVLine(lines[i], sep));
  }
  return { headers, rows };
}

function parseExcel(buffer: ArrayBuffer): { headers: string[]; rows: string[][] } {
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' });
  if (data.length === 0) return { headers: [], rows: [] };
  const headers = (data[0] as string[]).map((h) => String(h ?? '').trim());
  const rows = data.slice(1).map((row) => (row as string[]).map((c) => String(c ?? '').trim()));
  return { headers, rows };
}

function autoDetectMapping(headers: string[]): Partial<Record<FieldKey, string>> {
  const mapping: Partial<Record<FieldKey, string>> = {};
  for (const col of headers) {
    if (!col || col.toString().trim() === '') continue;
    const norm = normalizeHeader(col);
    const field = AUTO_DETECT[norm];
    if (field && !mapping[field]) mapping[field] = col.toString().trim();
  }
  return mapping;
}

interface BulkImportDialogProps {
  defaultClientType: ClientType;
  onSuccess?: () => void;
}

export function BulkImportDialog({ defaultClientType, onSuccess }: BulkImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Partial<Record<FieldKey, string>>>({});
  const [defaultType, setDefaultType] = useState<ClientType>(defaultClientType);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ imported: 0, errors: 0 });
  const [result, setResult] = useState<{ imported: number; errors: number } | null>(null);

  const reset = useCallback(() => {
    setFile(null);
    setHeaders([]);
    setRows([]);
    setMapping({});
    setDefaultType(defaultClientType);
    setResult(null);
  }, [defaultClientType]);

  const handleFile = useCallback(
    (f: File) => {
      setFile(f);
      setResult(null);
      const ext = f.name.split('.').pop()?.toLowerCase();
      const reader = new FileReader();
      reader.onload = () => {
        try {
          let h: string[];
          let r: string[][];
          if (ext === 'csv') {
            const text = reader.result as string;
            const parsed = parseCSV(text);
            h = parsed.headers;
            r = parsed.rows;
          } else if (ext === 'xlsx' || ext === 'xls') {
            const buf = reader.result as ArrayBuffer;
            const parsed = parseExcel(buf);
            h = parsed.headers;
            r = parsed.rows;
          } else {
            setHeaders([]);
            setRows([]);
            setMapping({});
            return;
          }
          setHeaders(h);
          setRows(r);
          const detected = autoDetectMapping(h);
          setMapping((prev) => ({ ...detected, ...prev }));
        } catch (e) {
          console.error(e);
          setHeaders([]);
          setRows([]);
        }
      };
      if (ext === 'csv') reader.readAsText(f);
      else reader.readAsArrayBuffer(f);
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const f = e.dataTransfer.files[0];
      if (f && /\.(csv|xlsx|xls)$/i.test(f.name)) handleFile(f);
    },
    [handleFile]
  );

  const handleImport = useCallback(async () => {
    if (!headers.length || !mapping.name || mapping.name === '__skip__') return;
    setImporting(true);
    setProgress({ imported: 0, errors: 0 });
    let imported = 0;
    let errors = 0;
    const getVal = (row: string[], key: FieldKey): string => {
      const col = mapping[key];
      if (!col || col === '__skip__') return '';
      const idx = headers.indexOf(col);
      if (idx < 0) return '';
      const v = row[idx];
      return (v == null ? '' : String(v)).trim();
    };

    const BATCH = 100;
    for (let i = 0; i < rows.length; i += BATCH) {
      const chunk = rows.slice(i, i + BATCH);
      const payloads = chunk
        .filter((row) => getVal(row, 'name'))
        .map((row) => {
          const clientTypeRaw = (getVal(row, 'client_type') || getVal(row, 'activity') || getVal(row, 'subsector') || '').toLowerCase();
          let clientType: ClientType = defaultType;
          if (clientTypeRaw.includes('herbol') || clientTypeRaw.includes('herbor') || clientTypeRaw.includes('erborist')) {
            clientType = 'herbalist';
          } else if (clientTypeRaw.includes('farmac') || clientTypeRaw.includes('pharmac')) {
            clientType = 'pharmacy';
          }
          return {
            name: getVal(row, 'name'),
            address: getVal(row, 'address') || null,
            postal_code: getVal(row, 'postal_code') || null,
            city: getVal(row, 'city') || null,
            sub_locality: getVal(row, 'sub_locality') || null,
            province: getVal(row, 'province') || null,
            autonomous_community: getVal(row, 'autonomous_community') || null,
            country: getVal(row, 'country') || 'Spain',
            lat: parseFloat(getVal(row, 'lat')) || 0,
            lng: parseFloat(getVal(row, 'lng')) || 0,
            phone: getVal(row, 'phone') || null,
            secondary_phone: getVal(row, 'secondary_phone') || null,
            email: getVal(row, 'email') || null,
            website: getVal(row, 'website') || null,
            activity: getVal(row, 'activity') || null,
            subsector: getVal(row, 'subsector') || null,
            legal_form: getVal(row, 'legal_form') || null,
            client_type: clientType,
            google_place_id: null,
            saved_at: new Date().toISOString(),
          };
        });

      const { error } = await supabase.from('pharmacies').insert(payloads);
      if (error) {
        errors += payloads.length;
      } else {
        imported += payloads.length;
      }
      setProgress({ imported, errors });
    }
    setResult({ imported, errors });
    setImporting(false);
    if (imported > 0) {
      onSuccess?.();
      await supabase
        .from('pharmacies')
        .update({ saved_at: new Date().toISOString() })
        .is('saved_at', null)
        .is('google_place_id', null);
    }
  }, [headers, mapping, rows, defaultType, onSuccess]);

  const previewRows = rows.slice(0, 5);
  const canImport = headers.length > 0 && mapping.name && mapping.name !== '__skip__' && rows.length > 0 && !importing;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-gray-300">
          <Upload className="h-4 w-4 mr-2" />
          Import CSV/Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col bg-white border-gray-200 text-gray-900" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-gray-900">Bulk import</DialogTitle>
        </DialogHeader>

        {!file ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
              'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
            )}
          >
            <FileSpreadsheet className="h-10 w-10 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 mb-2">Drag & drop a file or click to select</p>
            <p className="text-xs text-gray-500 mb-4">Accepted: .csv, .xlsx, .xls</p>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              id="bulk-import-file"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('bulk-import-file')?.click()}
              className="border-gray-300"
            >
              Select file
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{file.name}</span>
              <span>{rows.length} rows</span>
            </div>

            <Label className="text-xs text-gray-500">Default type for unmapped rows</Label>
            <Select value={defaultType} onValueChange={(v) => setDefaultType(v as ClientType)}>
              <SelectTrigger className="w-40 bg-white border-gray-300 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pharmacy">Pharmacy</SelectItem>
                <SelectItem value="herbalist">Herbalist</SelectItem>
              </SelectContent>
            </Select>

            <Label className="text-xs font-medium text-gray-700">Column mapping</Label>
            <div className="grid grid-cols-2 gap-2">
              {FIELDS.map(({ key, label, required }) => (
                <div key={key} className="flex items-center gap-2">
                  <Label className="w-28 text-xs text-gray-600 shrink-0">
                    {label} {required && '*'}
                  </Label>
                  <Select
                    value={mapping[key] ?? '__skip__'}
                    onValueChange={(v) => setMapping((m) => ({ ...m, [key]: v === '__skip__' ? undefined : v }))}
                  >
                    <SelectTrigger className="flex-1 h-8 bg-white border-gray-300 text-xs">
                      <SelectValue placeholder={required ? 'Select column' : '—'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__skip__">—</SelectItem>
                      {headers.filter((h) => h && h.toString().trim() !== '').map((header, index) => (
                        <SelectItem key={`${index}-${header}`} value={header.toString().trim()}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <Label className="text-xs font-medium text-gray-700">Preview (first 5 rows)</Label>
            <ScrollArea className="border border-gray-200 rounded-md">
              <div className="max-h-40 overflow-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {headers.map((h) => (
                        <th key={h} className="text-left px-2 py-1.5 font-medium text-gray-700 truncate max-w-[120px]">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        {row.map((cell, j) => (
                          <td key={j} className="px-2 py-1 text-gray-600 truncate max-w-[120px]">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ScrollArea>

            {result && (
              <p className="text-sm text-gray-700">
                Done: {result.imported} imported, {result.errors} errors.
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
              {importing && (
                <span className="text-xs text-gray-500">
                  Importing... {progress.imported + progress.errors}/{rows.length} rows
                </span>
              )}
              <Button
                onClick={handleImport}
                disabled={!canImport}
                className="bg-gray-900 hover:bg-gray-800 text-white"
              >
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing…
                  </>
                ) : result ? (
                  'Import again'
                ) : (
                  `Import ${rows.length} records`
                )}
              </Button>
              {result && (
                <Button
                  variant="outline"
                  onClick={() => {
                    onSuccess?.();
                    setOpen(false);
                  }}
                  className="border-gray-300"
                >
                  Close
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}