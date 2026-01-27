-- Create storage bucket for pharmacy documents (invoices, receipts)
INSERT INTO storage.buckets (id, name, public)
VALUES ('pharmacy-documents', 'pharmacy-documents', false);

-- Create RLS policies for the storage bucket
CREATE POLICY "Authenticated users can upload pharmacy documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'pharmacy-documents');

CREATE POLICY "Authenticated users can view pharmacy documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'pharmacy-documents');

CREATE POLICY "Authenticated users can delete pharmacy documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'pharmacy-documents');

CREATE POLICY "Anon users can upload pharmacy documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'pharmacy-documents');

CREATE POLICY "Anon users can view pharmacy documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'pharmacy-documents');

-- Create table for tracking pharmacy order documents
CREATE TABLE public.pharmacy_order_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pharmacy_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('invoice', 'receipt')),
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.pharmacy_order_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for document tracking
CREATE POLICY "Anon users can view pharmacy documents"
ON public.pharmacy_order_documents FOR SELECT
USING (true);

CREATE POLICY "Anon users can insert pharmacy documents"
ON public.pharmacy_order_documents FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anon users can delete pharmacy documents"
ON public.pharmacy_order_documents FOR DELETE
USING (true);

CREATE POLICY "Authenticated users can view pharmacy documents"
ON public.pharmacy_order_documents FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert pharmacy documents"
ON public.pharmacy_order_documents FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete pharmacy documents"
ON public.pharmacy_order_documents FOR DELETE
USING (true);

-- Create indexes for performance
CREATE INDEX idx_pharmacy_order_documents_pharmacy ON public.pharmacy_order_documents(pharmacy_id);
CREATE INDEX idx_pharmacy_order_documents_order ON public.pharmacy_order_documents(order_id);
CREATE INDEX idx_pharmacy_order_documents_type ON public.pharmacy_order_documents(document_type);