-- Create enum for commercial status
CREATE TYPE public.pharmacy_status AS ENUM ('not_contacted', 'contacted', 'client');

-- Create pharmacies table to cache Google Places data and store internal CRM data
CREATE TABLE public.pharmacies (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    google_place_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    province TEXT,
    country TEXT DEFAULT 'Spain',
    phone TEXT,
    email TEXT,
    website TEXT,
    opening_hours JSONB,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    commercial_status public.pharmacy_status NOT NULL DEFAULT 'not_contacted',
    notes TEXT,
    google_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_pharmacies_google_place_id ON public.pharmacies(google_place_id);
CREATE INDEX idx_pharmacies_status ON public.pharmacies(commercial_status);
CREATE INDEX idx_pharmacies_city ON public.pharmacies(city);
CREATE INDEX idx_pharmacies_country ON public.pharmacies(country);
CREATE INDEX idx_pharmacies_location ON public.pharmacies(lat, lng);

-- Enable RLS
ALTER TABLE public.pharmacies ENABLE ROW LEVEL SECURITY;

-- RLS policies - allow authenticated users full access
CREATE POLICY "Authenticated users can view pharmacies"
ON public.pharmacies
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert pharmacies"
ON public.pharmacies
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update pharmacies"
ON public.pharmacies
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete pharmacies"
ON public.pharmacies
FOR DELETE
TO authenticated
USING (true);

-- Also allow anon for now since we don't have auth set up yet
CREATE POLICY "Anon users can view pharmacies"
ON public.pharmacies
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Anon users can insert pharmacies"
ON public.pharmacies
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Anon users can update pharmacies"
ON public.pharmacies
FOR UPDATE
TO anon
USING (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_pharmacies_updated_at
BEFORE UPDATE ON public.pharmacies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();