-- Add columns for bulk import (pharmacies/herbalists Excel/CSV)
ALTER TABLE public.pharmacies ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE public.pharmacies ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.pharmacies ADD COLUMN IF NOT EXISTS autonomous_community TEXT;
ALTER TABLE public.pharmacies ADD COLUMN IF NOT EXISTS secondary_phone TEXT;
ALTER TABLE public.pharmacies ADD COLUMN IF NOT EXISTS activity TEXT;
ALTER TABLE public.pharmacies ADD COLUMN IF NOT EXISTS subsector TEXT;
ALTER TABLE public.pharmacies ADD COLUMN IF NOT EXISTS legal_form TEXT;
ALTER TABLE public.pharmacies ADD COLUMN IF NOT EXISTS sub_locality TEXT;
