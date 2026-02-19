-- Add client_type (pharmacy | herbalist) and make google_place_id nullable for manual herbalists

-- 1. Create enum for client type
CREATE TYPE public.client_type AS ENUM ('pharmacy', 'herbalist');

-- 2. Add client_type column to pharmacies
ALTER TABLE public.pharmacies ADD COLUMN IF NOT EXISTS client_type public.client_type NOT NULL DEFAULT 'pharmacy';

-- 3. Index for filtering by client type
CREATE INDEX IF NOT EXISTS idx_pharmacies_client_type ON public.pharmacies(client_type);

-- 4. Allow NULL google_place_id (manual herbalists won't have one)
ALTER TABLE public.pharmacies ALTER COLUMN google_place_id DROP NOT NULL;

-- 5. Replace UNIQUE constraint with partial unique index (only when google_place_id IS NOT NULL)
DROP INDEX IF EXISTS pharmacies_google_place_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_pharmacies_google_place_id_unique ON public.pharmacies(google_place_id) WHERE google_place_id IS NOT NULL;
