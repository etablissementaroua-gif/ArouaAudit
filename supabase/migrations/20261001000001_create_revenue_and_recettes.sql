-- ==============================================================================
-- AROUA AUDIT - STAGE 4: REVENUE ANALYTICS & RECETTES ENGINE MIGRATION
-- Migration Version: 20261001000001
-- Targets: PostgreSQL (Supabase Engine)
-- ==============================================================================

-- ==============================================================================
-- 0. التأكد من وجود جدول الصندوق وأنواع البيانات (Prerequisite Types & Table)
-- ==============================================================================
DO $$ BEGIN
    CREATE TYPE transaction_direction AS ENUM ('encaissement', 'decaissement');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE financial_payment_method AS ENUM ('especes', 'cheque', 'virement', 'carte');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

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

CREATE INDEX IF NOT EXISTS idx_caisse_date ON public.caisse_transactions (transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_caisse_type ON public.caisse_transactions (type);

ALTER TABLE public.caisse_transactions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Allow read caisse_transactions" ON public.caisse_transactions FOR SELECT USING (true);
    CREATE POLICY "Allow write caisse_transactions" ON public.caisse_transactions FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 1. جدول تغذية الصندوق والإيداعات المالية (Caisse Alimentations)
CREATE TABLE IF NOT EXISTS public.caisse_alimentations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alimentation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    source TEXT NOT NULL, -- 'apport_personnel', 'virement_bancaire', 'recouvrement', 'autre'
    destination_account TEXT NOT NULL DEFAULT 'caisse_centrale',
    agent_name TEXT NOT NULL,
    motif TEXT NOT NULL,
    receipt_reference TEXT,
    academic_year TEXT NOT NULL DEFAULT '2026/2027',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alimentations_date ON public.caisse_alimentations(alimentation_date DESC);
CREATE INDEX IF NOT EXISTS idx_alimentations_year ON public.caisse_alimentations(academic_year);

-- 2. ربط تغذية الصندوق تلقائياً كمدخول في يومية الصندوق (Caisse Inflow Trigger)
CREATE OR REPLACE FUNCTION public.handle_alimentation_caisse_inflow()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.caisse_transactions (
        transaction_date,
        type,
        amount,
        payment_method,
        category,
        reference_number,
        description,
        author_name,
        metadata,
        created_at
    ) VALUES (
        NEW.alimentation_date,
        'encaissement',
        NEW.amount,
        'especes',
        'alimentation',
        COALESCE(NEW.receipt_reference, NEW.id::TEXT),
        'تغذية الصندوق: ' || NEW.motif,
        NEW.agent_name,
        json_build_object(
            'source', NEW.source,
            'destination_account', NEW.destination_account,
            'academic_year', NEW.academic_year
        ),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_alimentation_caisse ON public.caisse_alimentations;
CREATE TRIGGER trg_alimentation_caisse
AFTER INSERT ON public.caisse_alimentations
FOR EACH ROW EXECUTE FUNCTION public.handle_alimentation_caisse_inflow();

-- 3. دوال احتساب رقم المعاملات التقديري والفعلي (CA RPC Functions)
-- أ. احتساب رقم المعاملات الشهري النظري بناءً على تعريفات المستوى والتلاميذ المسجلين
CREATE OR REPLACE FUNCTION public.calculate_monthly_theoretical_ca(p_academic_year TEXT DEFAULT '2026/2027')
RETURNS TABLE (
    academic_level TEXT,
    level_name_ar TEXT,
    students_count BIGINT,
    tuition_subtotal DECIMAL(12, 2),
    transport_subtotal DECIMAL(12, 2),
    canteen_subtotal DECIMAL(12, 2),
    monthly_total DECIMAL(12, 2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.level_code AS academic_level,
        l.name_ar AS level_name_ar,
        COUNT(s.id) AS students_count,
        COALESCE(SUM(t.tuition_monthly), 0.00) AS tuition_subtotal,
        COALESCE(SUM(CASE WHEN s.has_transport THEN t.transport_monthly ELSE 0 END), 0.00) AS transport_subtotal,
        COALESCE(SUM(CASE WHEN s.has_canteen THEN t.canteen_monthly ELSE 0 END), 0.00) AS canteen_subtotal,
        COALESCE(SUM(
            t.tuition_monthly + 
            CASE WHEN s.has_transport THEN t.transport_monthly ELSE 0 END + 
            CASE WHEN s.has_canteen THEN t.canteen_monthly ELSE 0 END
        ), 0.00) AS monthly_total
    FROM public.academic_levels_classes l
    LEFT JOIN public.level_tarifs t 
        ON l.level_code = t.level_code AND t.academic_year_code = p_academic_year
    LEFT JOIN public.students s 
        ON (s.academic_level = l.level_code 
            OR s.academic_level ILIKE '%' || l.name_ar || '%' 
            OR s.academic_level ILIKE '%' || l.level_code || '%')
        AND s.enrollment_status = 'enrolled'
    GROUP BY l.level_code, l.name_ar, l.display_order
    ORDER BY l.display_order ASC;
END;
$$ LANGUAGE plpgsql;

-- 4. إدراج بذور تغذية الصندوق الأولية
INSERT INTO public.caisse_alimentations (
    alimentation_date, amount, source, destination_account, agent_name, motif, receipt_reference, academic_year
) VALUES 
    ('2026-09-01', 50000.00, 'apport_personnel', 'caisse_centrale', 'المسير العام', 'ضخ سيولة انطلاق الموسم الدراسي 2026/2027', 'ALIM-2026-001', '2026/2027'),
    ('2026-09-15', 30000.00, 'virement_bancaire', 'caisse_centrale', 'إدارة الحسابات', 'تغذية صندوق الطوارئ ومصاريف البداية', 'ALIM-2026-002', '2026/2027'),
    ('2026-09-25', 15000.00, 'recouvrement', 'caisse_centrale', 'أمين الصندوق', 'استرداد تسبيقات وسيولة تشغيلية', 'ALIM-2026-003', '2026/2027')
ON CONFLICT DO NOTHING;

-- 5. تفعيل أمان الصفوف RLS
ALTER TABLE public.caisse_alimentations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Allow read caisse_alimentations" ON public.caisse_alimentations FOR SELECT USING (true);
    CREATE POLICY "Allow write caisse_alimentations" ON public.caisse_alimentations FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;
