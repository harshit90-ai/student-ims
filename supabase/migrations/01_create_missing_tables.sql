-- =================================================================
-- Migration 01: Create profiles and payment_transactions tables
-- These 2 tables were not in the initial 12-table Supabase schema.
-- =================================================================

-- profiles: links Supabase Auth (auth.users) to SIMS app metadata
CREATE TABLE IF NOT EXISTS public.profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username          TEXT NOT NULL UNIQUE,
  name              TEXT NOT NULL,
  role              TEXT NOT NULL
                    CHECK (role IN ('admin', 'teacher', 'student')),
  avatar            TEXT DEFAULT '',
  linked_entity_id  TEXT,
  department        TEXT,
  title             TEXT,
  created_at        TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- payment_transactions: extracted from FeeRecord.paymentHistory[]
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id          BIGSERIAL PRIMARY KEY,
  fee_id      TEXT NOT NULL REFERENCES public.fees(id) ON DELETE CASCADE,
  receipt_no  TEXT NOT NULL UNIQUE,
  date        DATE NOT NULL,
  amount      NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  method      TEXT NOT NULL
              CHECK (method IN ('Bank Transfer', 'Card', 'Online Portal', 'Check')),
  reference   TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
