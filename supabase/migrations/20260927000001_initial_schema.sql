-- ==============================================================================
-- AROUA AUDIT FINANCIAL PLATFORM - INITIAL SCHEMA MIGRATION
-- Migration Version: 20260927000001
-- Targets: PostgreSQL (Supabase Engine)
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS uuid-ossp;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Enumerated Types
DO $ BEGIN
    CREATE TYPE transaction_direction AS ENUM ('encaissement', 'decaissement');
EXCEPTION
    WHEN duplicate_object THEN null;
END $;

DO $ BEGIN
    CREATE TYPE financial_payment_method AS ENUM ('especes', 'cheque', 'virement', 'carte');
EXCEPTION
    WHEN duplicate_object THEN null;
END $;

DO $ BEGIN
    CREATE TYPE check_lifecycle_status AS ENUM ('en_attente', 'encaisse', 'rejete', 'annule');
EXCEPTION
    WHEN duplicate_object THEN null;
END $;

DO $ BEGIN
    CREATE TYPE payroll_slip_status AS ENUM ('brouillon', 'valide', 'paye');
EXCEPTION
    WHEN duplicate_object THEN null;
END $;

DO $ BEGIN
    CREATE TYPE sync_state AS ENUM ('synced', 'pending', 'conflict', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $;

-- 3. Caisse & Treasury Transactions Ledger
CREATE TABLE IF NOT EXISTS public.caisse_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    type transaction_direction NOT NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    payment_method financial_payment_method NOT NULL DEFAULT 'especes',
    category VARCHAR(100) NOT NULL,
    reference_number VARCHAR(100),
    description TEXT NOT NULL,
    solde_apres NUMERIC(15, 2),
    author_id UUID,
    author_name VARCHAR(150),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Staff Payroll & Salary Advances Tracking
CREATE TABLE IF NOT EXISTS public.staff_payroll (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id VARCHAR(100) NOT NULL,
    staff_name VARCHAR(200) NOT NULL,
    role VARCHAR(100) NOT NULL,
    month_year VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    base_salary NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    primes NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    deductions NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    avances_deduites NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    net_payable NUMERIC(12, 2) GENERATED ALWAYS AS (base_salary + primes - deductions - avances_deduites) STORED,
    status payroll_slip_status NOT NULL DEFAULT 'brouillon',
    dettes_restantes NUMERIC(12, 2) NOT NULL DEFAULT 0.00, -- ديون الموظفين العالقة
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Checks Portfolio & Due Dates Ledger
CREATE TABLE IF NOT EXISTS public.checks_portfolio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    check_number VARCHAR(100) NOT NULL,
    bank_name VARCHAR(120) NOT NULL,
    drawer_name VARCHAR(200) NOT NULL,
    beneficiary_name VARCHAR(200) NOT NULL DEFAULT 'Établissement Aroua',
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    emission_date DATE NOT NULL,
    due_date DATE NOT NULL,
    deposit_date DATE,
    status check_lifecycle_status NOT NULL DEFAULT 'en_attente',
    rejection_reason TEXT,
    scanned_copy_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. External Synchronization Mappings
CREATE TABLE IF NOT EXISTS public.external_sync_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    local_id UUID NOT NULL,
    external_source_id VARCHAR(200) NOT NULL,
    sync_status sync_state NOT NULL DEFAULT 'pending',
    last_synced_at TIMESTAMPTZ,
    payload_hash VARCHAR(64),
    sync_logs JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_entity_external UNIQUE (entity_type, external_source_id)
);

-- 7. Audit Trail Logs (Financial Traceability)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action_type VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
    performed_by VARCHAR(150),
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. High Performance Indexes
CREATE INDEX IF NOT EXISTS idx_caisse_date ON public.caisse_transactions (transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_caisse_type ON public.caisse_transactions (type);
CREATE INDEX IF NOT EXISTS idx_checks_due_date ON public.checks_portfolio (due_date ASC);
CREATE INDEX IF NOT EXISTS idx_checks_status ON public.checks_portfolio (status);
CREATE INDEX IF NOT EXISTS idx_payroll_month ON public.staff_payroll (month_year DESC);
CREATE INDEX IF NOT EXISTS idx_sync_external_id ON public.external_sync_mappings (external_source_id);

-- 9. Row Level Security (RLS) Activation
ALTER TABLE public.caisse_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checks_portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_sync_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 10. Default RLS Policies (Allow authenticated / authorized access)
CREATE POLICY Allow read caisse for authenticated users ON public.caisse_transactions FOR SELECT USING (true);
CREATE POLICY Allow write caisse for authenticated users ON public.caisse_transactions FOR ALL USING (true);

CREATE POLICY Allow read payroll for authenticated users ON public.staff_payroll FOR SELECT USING (true);
CREATE POLICY Allow write payroll for authenticated users ON public.staff_payroll FOR ALL USING (true);

CREATE POLICY Allow read checks for authenticated users ON public.checks_portfolio FOR SELECT USING (true);
CREATE POLICY Allow write checks for authenticated users ON public.checks_portfolio FOR ALL USING (true);

CREATE POLICY Allow read sync for authenticated users ON public.external_sync_mappings FOR SELECT USING (true);
CREATE POLICY Allow write sync for authenticated users ON public.external_sync_mappings FOR ALL USING (true);
