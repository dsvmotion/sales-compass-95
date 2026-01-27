-- Backfill normalized geography fields from stored google_data.address_components
-- This fixes incomplete filter option lists caused by NULL/empty country/province/city.

-- 1) Ensure updated_at stays correct (trigger was missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_pharmacies_updated_at'
  ) THEN
    CREATE TRIGGER update_pharmacies_updated_at
    BEFORE UPDATE ON public.pharmacies
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_pharmacy_order_documents_updated_at'
  ) THEN
    CREATE TRIGGER update_pharmacy_order_documents_updated_at
    BEFORE UPDATE ON public.pharmacy_order_documents
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 2) Backfill COUNTRY
WITH extracted AS (
  SELECT
    p.id,
    (
      SELECT comp->>'long_name'
      FROM jsonb_array_elements(p.google_data->'address_components') AS comp
      WHERE (comp->'types') ? 'country'
      LIMIT 1
    ) AS country_name
  FROM public.pharmacies p
  WHERE (p.country IS NULL OR btrim(p.country) = '')
    AND p.google_data IS NOT NULL
    AND (p.google_data ? 'address_components')
)
UPDATE public.pharmacies p
SET country = e.country_name
FROM extracted e
WHERE p.id = e.id
  AND e.country_name IS NOT NULL
  AND btrim(e.country_name) <> '';

-- 3) Backfill PROVINCE (administrative_area_level_1)
WITH extracted AS (
  SELECT
    p.id,
    (
      SELECT comp->>'long_name'
      FROM jsonb_array_elements(p.google_data->'address_components') AS comp
      WHERE (comp->'types') ? 'administrative_area_level_1'
      LIMIT 1
    ) AS province_name
  FROM public.pharmacies p
  WHERE (p.province IS NULL OR btrim(p.province) = '')
    AND p.google_data IS NOT NULL
    AND (p.google_data ? 'address_components')
)
UPDATE public.pharmacies p
SET province = e.province_name
FROM extracted e
WHERE p.id = e.id
  AND e.province_name IS NOT NULL
  AND btrim(e.province_name) <> '';

-- 4) Backfill CITY (prefer locality, fallback to postal_town)
WITH extracted AS (
  SELECT
    p.id,
    COALESCE(
      (
        SELECT comp->>'long_name'
        FROM jsonb_array_elements(p.google_data->'address_components') AS comp
        WHERE (comp->'types') ? 'locality'
        LIMIT 1
      ),
      (
        SELECT comp->>'long_name'
        FROM jsonb_array_elements(p.google_data->'address_components') AS comp
        WHERE (comp->'types') ? 'postal_town'
        LIMIT 1
      )
    ) AS city_name
  FROM public.pharmacies p
  WHERE (p.city IS NULL OR btrim(p.city) = '')
    AND p.google_data IS NOT NULL
    AND (p.google_data ? 'address_components')
)
UPDATE public.pharmacies p
SET city = e.city_name
FROM extracted e
WHERE p.id = e.id
  AND e.city_name IS NOT NULL
  AND btrim(e.city_name) <> '';

-- 5) Helpful indexes for filter performance (safe if they already exist)
CREATE INDEX IF NOT EXISTS idx_pharmacies_country ON public.pharmacies (country);
CREATE INDEX IF NOT EXISTS idx_pharmacies_province ON public.pharmacies (province);
CREATE INDEX IF NOT EXISTS idx_pharmacies_city ON public.pharmacies (city);
