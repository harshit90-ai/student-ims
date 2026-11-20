-- =================================================================
-- Table: public.sims_store
-- Used to store and synchronize the complete SIMS application database
-- in Supabase PostgreSQL using a JSONB document store.
-- =================================================================

CREATE TABLE IF NOT EXISTS public.sims_store (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.sims_store ENABLE ROW LEVEL SECURITY;

-- Allow service_role key full read/write access (service_role bypasses RLS by default)
CREATE POLICY "Allow service role full access" ON public.sims_store
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
