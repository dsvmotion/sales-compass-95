-- Add saved_at column to distinguish saved pharmacies from just cached search results
ALTER TABLE public.pharmacies 
ADD COLUMN IF NOT EXISTS saved_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Index for efficient filtering of saved pharmacies
CREATE INDEX IF NOT EXISTS idx_pharmacies_saved_at ON public.pharmacies(saved_at) WHERE saved_at IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN public.pharmacies.saved_at IS 'When the pharmacy was explicitly saved to Operations. NULL means it is just a cached search result.';