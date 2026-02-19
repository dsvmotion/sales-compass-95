-- Extend pharmacy_order_documents: more document types and optional order_id (for general docs)

-- 1. Drop existing CHECK and add new one with extended types
ALTER TABLE public.pharmacy_order_documents DROP CONSTRAINT IF EXISTS pharmacy_order_documents_document_type_check;
ALTER TABLE public.pharmacy_order_documents ADD CONSTRAINT pharmacy_order_documents_document_type_check
  CHECK (document_type IN ('invoice', 'receipt', 'contract', 'delivery_note', 'other'));

-- 2. Make order_id nullable (general documents are not linked to an order)
ALTER TABLE public.pharmacy_order_documents ALTER COLUMN order_id DROP NOT NULL;
