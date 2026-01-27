export type PharmacyStatus = 'not_contacted' | 'contacted' | 'client';

export interface Pharmacy {
  id: string;
  google_place_id: string;
  name: string;
  address: string | null;
  city: string | null;
  province: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  opening_hours: string[] | null;
  lat: number;
  lng: number;
  commercial_status: PharmacyStatus;
  notes: string | null;
  google_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface PharmacyFilters {
  city: string;
  province: string;
  country: string;
  status: PharmacyStatus | 'all';
  search: string;
}

export const STATUS_LABELS: Record<PharmacyStatus, string> = {
  not_contacted: 'Not Contacted',
  contacted: 'Contacted',
  client: 'Client',
};

export const STATUS_COLORS: Record<PharmacyStatus, { bg: string; text: string; pin: string }> = {
  not_contacted: { bg: 'bg-gray-500/20', text: 'text-gray-400', pin: '#6b7280' },
  contacted: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', pin: '#eab308' },
  client: { bg: 'bg-green-500/20', text: 'text-green-400', pin: '#22c55e' },
};

export const EUROPEAN_COUNTRIES = [
  'Spain', 'France', 'Germany', 'Italy', 'Portugal', 'United Kingdom',
  'Netherlands', 'Belgium', 'Austria', 'Switzerland', 'Poland', 'Greece',
  'Sweden', 'Norway', 'Denmark', 'Finland', 'Ireland', 'Czech Republic',
  'Hungary', 'Romania', 'Bulgaria', 'Croatia', 'Slovakia', 'Slovenia',
] as const;

export const SPANISH_CITIES = [
  { name: 'Madrid', lat: 40.4168, lng: -3.7038 },
  { name: 'Barcelona', lat: 41.3851, lng: 2.1734 },
  { name: 'Valencia', lat: 39.4699, lng: -0.3763 },
  { name: 'Seville', lat: 37.3891, lng: -5.9845 },
  { name: 'Bilbao', lat: 43.263, lng: -2.935 },
  { name: 'Málaga', lat: 36.7213, lng: -4.4214 },
  { name: 'Zaragoza', lat: 41.6488, lng: -0.8891 },
  { name: 'Murcia', lat: 37.9922, lng: -1.1307 },
  { name: 'Palma', lat: 39.5696, lng: 2.6502 },
  { name: 'Las Palmas', lat: 28.1235, lng: -15.4366 },
] as const;
