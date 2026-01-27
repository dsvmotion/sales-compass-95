-- Create normalized geography tables for a single source of truth

-- Countries table
CREATE TABLE public.geography_countries (
  code TEXT PRIMARY KEY, -- ISO 3166-1 alpha-2 code (ES, FR, DE, etc.)
  name TEXT NOT NULL,
  name_local TEXT, -- Local name (España, France, Deutschland)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Provinces/Regions table
CREATE TABLE public.geography_provinces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country_code TEXT NOT NULL REFERENCES public.geography_countries(code) ON DELETE CASCADE,
  code TEXT, -- Regional code if applicable (e.g., MD for Madrid)
  name TEXT NOT NULL,
  name_local TEXT, -- Local name
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(country_code, name)
);

-- Cities table
CREATE TABLE public.geography_cities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  province_id UUID NOT NULL REFERENCES public.geography_provinces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_local TEXT, -- Local name
  population INTEGER, -- For sorting by importance
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(province_id, name)
);

-- Create indexes for fast lookups
CREATE INDEX idx_geography_provinces_country ON public.geography_provinces(country_code);
CREATE INDEX idx_geography_cities_province ON public.geography_cities(province_id);
CREATE INDEX idx_geography_cities_name ON public.geography_cities(name);
CREATE INDEX idx_geography_provinces_name ON public.geography_provinces(name);

-- Enable RLS
ALTER TABLE public.geography_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geography_provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geography_cities ENABLE ROW LEVEL SECURITY;

-- Create read-only policies (public reference data)
CREATE POLICY "Anyone can read countries" ON public.geography_countries FOR SELECT USING (true);
CREATE POLICY "Anyone can read provinces" ON public.geography_provinces FOR SELECT USING (true);
CREATE POLICY "Anyone can read cities" ON public.geography_cities FOR SELECT USING (true);

-- Create insert policies for edge function population
CREATE POLICY "Authenticated can insert countries" ON public.geography_countries FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated can insert provinces" ON public.geography_provinces FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated can insert cities" ON public.geography_cities FOR INSERT WITH CHECK (true);

-- Anon policies for edge function (runs with anon key)
CREATE POLICY "Anon can insert countries" ON public.geography_countries FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon can insert provinces" ON public.geography_provinces FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon can insert cities" ON public.geography_cities FOR INSERT WITH CHECK (true);